/**
 * Hero canvas animation — path-based snakes.
 *
 * Every snake has a **precomputed path** from an origin to a
 * destination. Origins/destinations are either:
 *   - an icon anchor cell (one of the orbiting service icons)
 *   - a cell on the canvas edge (top/bottom/left/right)
 *
 * Icon snakes go from icon → canvas edge. Transit snakes go from a
 * canvas edge → an icon. The head animates along the path; on reaching
 * the destination the snake fades out (so it always "terminates at an
 * anchor", per design).
 *
 * Paths are planned with BFS, biased toward fewest crossings with
 * other live snakes. When a crossing is unavoidable, the snake will
 * pass through that cell and a small spark is rendered there. This
 * gives "no two lines on the same course" most of the time, with
 * occasional intentional collision moments.
 *
 * Background grid + center halo remain unchanged.
 */

// ── Grid / palette / no-go zones ────────────────────────────────

const GRID_BASE_COL_SPACING = 96;
const GRID_BASE_ROW_SPACING = 70;   // finer rows → more routing options

const GRID_LINE_RGB = '20, 20, 20';
const GRID_DOT_RGB = '20, 20, 20';
const SNAKE_TRAIL_RGB = '16, 179, 106';
const SPARK_RGB = '16, 179, 106';
const HALO_RGB = '255, 174, 155';


// ── Snake tuning ────────────────────────────────────────────────

const SNAKE_SPEED_PX_PER_SEC = 115;   // slower = smoother, less jumpy
const SNAKE_TRAIL_LEN = 13;
const SNAKE_FADEIN_MS = 650;          // gentle appearance
const SNAKE_FADEOUT_MS = 1500;        // gentle disappearance
const SNAKE_DASH = [5, 9];
const SNAKE_DASH_FLOW_PX_PER_SEC = 16;
// After a snake finishes, its icon waits before emitting another — gives
// a calm rhythm instead of snakes popping back instantly.
const ICON_COOLDOWN_MIN = 2200;
const ICON_COOLDOWN_RANGE = 2600;

// Target population & spawn cadence. Target scales with canvas width
// so big-screen layouts feel populated rather than sparse.
const TARGET_BASE = 5;
const TARGET_MAX = 18;
const TARGET_PIXELS_PER_SNAKE = 140;  // 1 snake target per ~140px of canvas width
const MIN_SPAWN_INTERVAL = 320;       // aggressive when below target
const NORMAL_SPAWN_INTERVAL_MIN = 750;
const NORMAL_SPAWN_INTERVAL_RANGE = 700;
const MAX_PATH_CROSSINGS = 1;         // keep overlaps rare (avoid squares)

// Direction balance — bias transit origins so the visible flow alternates
// between "more snakes going right" and "more snakes going left".

const lerp = (a, b, t) => a + (b - a) * t;

export const initHeroAnimation = (root = document) => {
  const canvas = root.querySelector('[data-hero-canvas]');
  if (!canvas) return;
  const host = canvas.closest('.hero') || canvas.parentElement;
  if (!host) return;

  const orbitCenterEl = root.querySelector('[data-orbit-center]');
  const orbitNodeEls = Array.from(root.querySelectorAll('[data-orbit-node]'));
  // Individual obstacle elements — snakes route around each of these
  // (rather than one big hero-copy block), threading through the gaps.
  const obstacleEls = [
    root.querySelector('[data-hero-pill]'),
    root.querySelector('.hero-copy h1'),
    root.querySelector('[data-hero-subtitle]'),
    root.querySelector('[data-hero-cta-primary]'),
    root.querySelector('[data-hero-cta-secondary]'),
  ].filter(Boolean);
  // Bottom boundary of the play area — snakes roam down to just above
  // the "Trusted by high-growth fintechs" row.
  const trustedRowEl = root.querySelector('.hero-trusted-row');

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  let cssW = 0;
  let cssH = 0;
  let dpr = 1;
  let canvasRect = { left: 0, top: 0 };

  let cols = 0;
  let rows = 0;
  let colStep = 0;
  let rowStep = 0;

  let snakes = [];
  let sparks = [];
  let iconAnchors = [];
  let iconCooldown = {};   // iconIdx → timestamp until it may spawn again
  let nextSpawnTime = 0;
  let noGoZones = [];
  let orbitCenterPx = null;
  let gridPadY = 0;
  const NO_BLOCK = new Set(); // paths ignore other snakes (they may cross)

  // ── Geometry helpers ──────────────────────────────────────────

  const computeGrid = () => {
    cols = Math.max(4, Math.round(cssW / GRID_BASE_COL_SPACING) + 1);
    // Small vertical inset only. Snakes exit left/right (never top/bottom)
    // so we don't need a big margin — and a small one keeps the top and
    // bottom rows in the clear margins ABOVE the pill / BELOW the CTAs,
    // giving real corridors for left-bound snakes to route around the
    // text block without crossing it.
    gridPadY = Math.min(22, cssH * 0.05);
    const usableH = Math.max(1, cssH - gridPadY * 2);
    rows = Math.max(4, Math.round(usableH / GRID_BASE_ROW_SPACING) + 1);
    colStep = cssW / (cols - 1);            // full width → left/right edges = viewport ends
    rowStep = usableH / (rows - 1);
  };
  const gridX = (c) => c * colStep;
  const gridY = (r) => gridPadY + r * rowStep;
  const inBounds = (c, r) => c >= 0 && c < cols && r >= 0 && r < rows;
  const stepCell = (c, r, dir) => {
    if (dir === 'up')    return { c, r: r - 1 };
    if (dir === 'down')  return { c, r: r + 1 };
    if (dir === 'left')  return { c: c - 1, r };
    return { c: c + 1, r };  // right
  };

  const elementCenterInCanvas = (el) => {
    const r = el.getBoundingClientRect();
    return {
      x: r.left + r.width / 2 - canvasRect.left,
      y: r.top + r.height / 2 - canvasRect.top,
    };
  };

  const orbitVisible = () =>
    orbitCenterEl && orbitCenterEl.offsetParent !== null;

  // ── No-go zones ──────────────────────────────────────────────

  // Build a rect obstacle from a DOM element (canvas-local, padded).
  const rectFor = (el, pad) => {
    if (!el || el.offsetParent === null) return null;
    const r = el.getBoundingClientRect();
    if (r.width === 0) return null;
    return {
      left: r.left - canvasRect.left - pad,
      top: r.top - canvasRect.top - pad,
      right: r.right - canvasRect.left + pad,
      bottom: r.bottom - canvasRect.top + pad,
    };
  };

  const computeNoGoZones = () => {
    const zones = [];
    // 1) Text block — pill + headline + subtitle + CTAs as ONE rect so
    //    snakes route AROUND it (never between / through the lines).
    let tb = null;
    for (const el of obstacleEls) {
      const r = rectFor(el, 12);
      if (!r) continue;
      if (!tb) tb = { type: 'rect', ...r };
      else {
        tb.left = Math.min(tb.left, r.left);
        tb.top = Math.min(tb.top, r.top);
        tb.right = Math.max(tb.right, r.right);
        tb.bottom = Math.max(tb.bottom, r.bottom);
      }
    }
    if (tb) zones.push(tb);

    // 2) Orbit — a single ELLIPSE enclosing the P + all icons, so snakes
    //    travel around the whole orbit (not between the icons).
    if (orbitCenterEl && orbitCenterEl.offsetParent !== null && orbitNodeEls.length > 0) {
      const cr = orbitCenterEl.getBoundingClientRect();
      const cx = cr.left + cr.width / 2 - canvasRect.left;
      const cy = cr.top + cr.height / 2 - canvasRect.top;
      let rx = (cr.width / 2) + 24;
      let ry = (cr.height / 2) + 24;
      for (const nodeEl of orbitNodeEls) {
        if (nodeEl.offsetParent === null) continue;
        const nr = nodeEl.getBoundingClientRect();
        const nx = nr.left + nr.width / 2 - canvasRect.left;
        const ny = nr.top + nr.height / 2 - canvasRect.top;
        rx = Math.max(rx, Math.abs(nx - cx) + nr.width / 2 + 18);
        ry = Math.max(ry, Math.abs(ny - cy) + nr.height / 2 + 18);
      }
      zones.push({ type: 'ellipse', x: cx, y: cy, rx, ry });
      orbitCenterPx = { x: cx, y: cy };
    } else {
      orbitCenterPx = null;
    }
    return zones;
  };

  const pointInZone = (x, y, z) => {
    if (z.type === 'ellipse') {
      const dx = (x - z.x) / z.rx;
      const dy = (y - z.y) / z.ry;
      return dx * dx + dy * dy <= 1;
    }
    return x >= z.left && x <= z.right && y >= z.top && y <= z.bottom;
  };

  const inAnyNoGoZone = (x, y, zones) => {
    for (const z of zones) if (pointInZone(x, y, z)) return true;
    return false;
  };

  const cellBlocked = (toC, toR, zones, fromC, fromR, exemptCell) => {
    if (exemptCell && exemptCell.c === toC && exemptCell.r === toR) return false;
    const tx = gridX(toC);
    const ty = gridY(toR);
    const hasFrom = typeof fromC === 'number';
    const mx = hasFrom ? (gridX(fromC) + tx) / 2 : tx;
    const my = hasFrom ? (gridY(fromR) + ty) / 2 : ty;
    for (const z of zones) {
      if (pointInZone(tx, ty, z)) return true;
      if (hasFrom && pointInZone(mx, my, z)) return true;
    }
    return false;
  };

  // ── Icon anchors ─────────────────────────────────────────────

  const computeIconAnchors = () => {
    iconAnchors = [];
    if (!orbitVisible()) return;
    for (const nodeEl of orbitNodeEls) {
      const n = elementCenterInCanvas(nodeEl);
      const c = Math.max(0, Math.min(cols - 1, Math.round(n.x / colStep)));
      // Subtract the vertical inset before mapping to a row, else the
      // anchor lands rows below the actual icon.
      const r = Math.max(0, Math.min(rows - 1, Math.round((n.y - gridPadY) / rowStep)));
      // Keep the icon's exact centre so the snake visually starts FROM
      // the icon (not from the snapped grid cell, which can sit beside
      // or behind the tile).
      iconAnchors.push({ c, r, px: { x: n.x, y: n.y } });
    }
  };

  // Find the nearest cell to an icon that is clear of all obstacles
  // (BFS outward in every direction). The icon tile itself is an
  // obstacle, and left-side icons are wedged against the headline, so
  // the escape is usually vertical — we must not assume a horizontal
  // exit. The destination edge (not the start) decides travel direction.
  const findClearStart = (c, r, zones) => {
    const visited = new Set([`${c},${r}`]);
    const queue = [{ c, r }];
    let head = 0;
    while (head < queue.length) {
      const cell = queue[head++];
      if (!(cell.c === c && cell.r === r) &&
          !inAnyNoGoZone(gridX(cell.c), gridY(cell.r), zones)) {
        return cell;
      }
      for (const d of ['up', 'down', 'left', 'right']) {
        const n = stepCell(cell.c, cell.r, d);
        if (!inBounds(n.c, n.r)) continue;
        const k = `${n.c},${n.r}`;
        if (visited.has(k)) continue;
        visited.add(k);
        queue.push(n);
      }
      if (queue.length > 60) break;
    }
    return null;
  };

  // ── BFS path planning ────────────────────────────────────────

  // Plain FIFO breadth-first search → shortest path. Neighbours are
  // explored straight-direction-first so paths keep turns low without
  // the cost of a priority sort (which made this O(n² log n) and froze
  // the loop on wide grids). One BFS per crossing budget.
  const planPath = (start, end, blockedSet, zones, maxCrossings) => {
    if (!inBounds(start.c, start.r) || !inBounds(end.c, end.r)) return null;
    if (start.c === end.c && start.r === end.r) return [start];

    const key = (c, r) => `${c},${r}`;
    const visited = new Set();
    visited.add(key(start.c, start.r));
    const queue = [{ cell: start, path: [start], crossings: 0, lastDir: null }];
    let head = 0;

    while (head < queue.length) {
      const node = queue[head++];
      if (node.cell.c === end.c && node.cell.r === end.r) return node.path;

      // Continue in the same direction first → fewer turns.
      const dirs = node.lastDir
        ? [node.lastDir, ...['up', 'down', 'left', 'right'].filter((d) => d !== node.lastDir)]
        : ['up', 'down', 'left', 'right'];

      for (const dir of dirs) {
        const next = stepCell(node.cell.c, node.cell.r, dir);
        if (!inBounds(next.c, next.r)) continue;
        const k = key(next.c, next.r);
        if (visited.has(k)) continue;
        const isDest = (next.c === end.c && next.r === end.r);
        if (cellBlocked(next.c, next.r, zones, node.cell.c, node.cell.r, end)) continue;
        const isCrossing = blockedSet.has(k) && !isDest;
        const newCrossings = node.crossings + (isCrossing ? 1 : 0);
        if (newCrossings > maxCrossings) continue;
        visited.add(k);
        queue.push({ cell: next, path: [...node.path, next], crossings: newCrossings, lastDir: dir });
      }
      if (queue.length > 6000) break; // safety
    }
    return null;
  };

  // Try crossings = 0, then 1, then 2. Returns path or null.
  const planBestPath = (start, end, blockedSet, zones) => {
    for (let c = 0; c <= MAX_PATH_CROSSINGS; c++) {
      const p = planPath(start, end, blockedSet, zones, c);
      if (p) return p;
    }
    return null;
  };

  // Zig-zag planner: routes start→end through a few waypoints that
  // alternate one row up/down, so the snake weaves instead of running
  // dead straight. Each leg is connected with BFS (so obstacles are
  // still avoided). Falls back to the straight path if zig-zag can't
  // be connected or the span is too short.
  const planZigZagPath = (start, end, zones, blockedSet) => {
    const block = blockedSet || NO_BLOCK;
    const span = Math.abs(end.c - start.c);
    if (span < 3) return planBestPath(start, end, block, zones);

    const jogs = Math.min(5, Math.max(2, Math.floor(span / 2)));
    const stepC = (end.c - start.c) / (jogs + 1);
    let jog = Math.random() < 0.5 ? 1 : -1;

    const waypoints = [start];
    for (let k = 1; k <= jogs; k++) {
      const wc = Math.max(0, Math.min(cols - 1, Math.round(start.c + stepC * k)));
      let wr = Math.max(0, Math.min(rows - 1, start.r + jog));
      // If that cell is blocked, try the opposite jog, else stay level.
      if (cellBlocked(wc, wr, zones)) {
        const alt = Math.max(0, Math.min(rows - 1, start.r - jog));
        wr = cellBlocked(alt, wr, zones) ? start.r : alt;
      }
      waypoints.push({ c: wc, r: wr });
      jog *= -1;
    }
    waypoints.push(end);

    const full = [{ c: start.c, r: start.r }];
    for (let k = 1; k < waypoints.length; k++) {
      const seg = planBestPath(waypoints[k - 1], waypoints[k], block, zones);
      if (!seg) return planBestPath(start, end, block, zones); // fall back
      for (let m = 1; m < seg.length; m++) full.push(seg[m]);
    }
    return full;
  };

  // Cells currently traced by live snakes — new snakes plan around
  // these so trails don't overlap (which forms square crossings).
  const occupiedCellSet = () => {
    const set = new Set();
    for (const s of snakes) {
      if (s.dead) continue;
      const startIdx = Math.max(0, s.pathIndex - SNAKE_TRAIL_LEN);
      for (let k = startIdx; k < s.path.length; k++) {
        set.add(`${s.path[k].c},${s.path[k].r}`);
      }
    }
    return set;
  };

  // ── Spawning ─────────────────────────────────────────────────

  const makeSnake = (path, now, iconIdx, destEdge) => ({
    path,
    pathIndex: 0,
    progress: 0,
    speedMul: 0.9 + Math.random() * 0.2,   // tight range → uniform, smooth
    born: now,
    originIcon: iconIdx,
    destEdge,                 // 'L' or 'R'
    arrived: false,
    arrivedAt: 0,
    dead: false,
    merged: false,
  });

  // Every snake originates AT an icon and travels OUTWARD to the viewport
  // edge on its OWN side of the orbit (icons left of centre exit to the
  // left viewport edge, right-of-centre to the right edge). Because the
  // ring only lets snakes escape outward, this keeps paths natural and
  // gives both viewport edges coverage (the orbit has icons on each
  // side). One snake per icon at a time.
  const trySpawnOne = (now) => {
    if (iconAnchors.length === 0) return false;

    const usedIcons = new Set();
    for (const s of snakes) {
      if (s.dead || s.arrived) continue;
      if (typeof s.originIcon === 'number') usedIcons.add(s.originIcon);
    }

    const indices = [...iconAnchors.keys()]
      .filter((i) => !usedIcons.has(i) && now >= (iconCooldown[i] || 0))
      .sort(() => Math.random() - 0.5);

    const occupied = occupiedCellSet();

    for (const i of indices) {
      const origin = iconAnchors[i];
      const dx = orbitCenterPx ? gridX(origin.c) - orbitCenterPx.x : 1;
      // Edge is locked to the icon's own side — left icons ALWAYS go to
      // the left viewport edge, right icons to the right. No inward
      // fallback (that's what made left icons wrongly head right).
      const edge = dx >= 0 ? 'R' : 'L';
      // Nearest clear cell to the icon in ANY direction (left icons are
      // wedged against the text block, so they escape vertically).
      const start = findClearStart(origin.c, origin.r, noGoZones);
      if (!start) continue;
      const dest = { c: edge === 'L' ? 0 : cols - 1, r: origin.r };
      // Plan around obstacles AND around other snakes (occupied) so
      // trails don't overlap into squares — merges stay occasional.
      const path = planZigZagPath(start, dest, noGoZones, occupied);
      if (path && path.length >= 2) {
        const snake = makeSnake(path, now, i, edge);
        snake.originPx = origin.px; // visual start = icon centre
        snakes.push(snake);
        // Ignition spark at the icon — marks the snake launching from it.
        if (origin.px) sparks.push({ x: origin.px.x, y: origin.px.y, born: now });
        return true;
      }
    }
    return false;
  };

  // ── Update ──────────────────────────────────────────────────

  const updateSnakes = (now, dtMs) => {
    noGoZones = computeNoGoZones();

    if (!orbitVisible() || iconAnchors.length === 0) {
      snakes = [];
      sparks = [];
      return;
    }

    // Spawn pacing: ONE snake per spawn event (no bursts — bursts cause
    // multiple snakes to pop in at once, which reads as janky). The
    // per-icon cooldown + interval keep a calm, staggered rhythm.
    if (now >= nextSpawnTime) {
      const spawned = trySpawnOne(now);
      nextSpawnTime = now + (spawned
        ? NORMAL_SPAWN_INTERVAL_MIN + Math.random() * NORMAL_SPAWN_INTERVAL_RANGE
        : 400);
    }

    // Advance snakes along their paths.
    for (const s of snakes) {
      if (s.dead) continue;
      if (s.arrived) {
        if (now - s.arrivedAt > SNAKE_FADEOUT_MS) s.dead = true;
        continue;
      }
      const curr = s.path[s.pathIndex];
      const next = s.path[s.pathIndex + 1];
      if (!next) {
        s.arrived = true;
        s.arrivedAt = now;
        continue;
      }
      const segLen = (curr.r === next.r) ? colStep : rowStep;
      if (segLen <= 0) continue;
      const speed = SNAKE_SPEED_PX_PER_SEC * s.speedMul;
      s.progress += (speed * dtMs / 1000) / segLen;

      while (s.progress >= 1) {
        s.progress -= 1;
        s.pathIndex++;
        if (!s.path[s.pathIndex + 1]) {
          s.arrived = true;
          s.arrivedAt = now;
          break;
        }
      }
    }

    // Merge step: when two snakes from DIFFERENT icons meet OUT IN THE
    // OPEN FIELD (not at the crowded icon cluster) they fuse into one —
    // a spark marks the join and the younger is absorbed. Guards:
    //  - both snakes must be past a short grace period (so they don't
    //    annihilate the instant they leave neighbouring icons)
    //  - the meeting point must be well outside the icon ring, so the
    //    merge reads as two travelling lines crossing in open space.
    const MERGE_GRACE_MS = 1200;
    const MERGE_MIN_DIST_FROM_CENTER = 230; // px — merge out in open space
    const live = snakes.filter((s) => !s.dead && !s.arrived);
    for (let i = 0; i < live.length; i++) {
      const a = live[i];
      if (a.merged || now - a.born < MERGE_GRACE_MS) continue;
      const ha = a.path[a.pathIndex];
      for (let j = i + 1; j < live.length; j++) {
        const b = live[j];
        if (b.merged || b.originIcon === a.originIcon) continue;
        if (now - b.born < MERGE_GRACE_MS) continue;
        const hb = b.path[b.pathIndex];
        const dist = Math.abs(ha.c - hb.c) + Math.abs(ha.r - hb.r);
        if (dist > 1) continue;
        // Only merge out in the open field, away from the icon cluster.
        if (orbitCenterPx) {
          const mx = (gridX(ha.c) + gridX(hb.c)) / 2;
          const my = (gridY(ha.r) + gridY(hb.r)) / 2;
          if (Math.hypot(mx - orbitCenterPx.x, my - orbitCenterPx.y) < MERGE_MIN_DIST_FROM_CENTER) continue;
        }
        sparks.push({
          x: (gridX(ha.c) + gridX(hb.c)) / 2,
          y: (gridY(ha.r) + gridY(hb.r)) / 2,
          born: now,
        });
        // Younger snake is absorbed into the older — "becomes one".
        const younger = a.born >= b.born ? a : b;
        younger.arrived = true;
        younger.arrivedAt = now;
        younger.merged = true;
        if (younger === a) break;
      }
    }

    // Cull dead snakes and sparks. When a snake's icon frees up, start a
    // cooldown so it pauses before emitting the next one (calm rhythm).
    for (const s of snakes) {
      if (s.dead && typeof s.originIcon === 'number') {
        iconCooldown[s.originIcon] = now + ICON_COOLDOWN_MIN + Math.random() * ICON_COOLDOWN_RANGE;
      }
    }
    snakes = snakes.filter((s) => !s.dead);
    sparks = sparks.filter((sp) => now - sp.born < 700);
  };

  // ── Drawing ─────────────────────────────────────────────────

  const drawGrid = () => {
    ctx.save();
    ctx.setLineDash([3, 6]);
    ctx.strokeStyle = `rgba(${GRID_LINE_RGB}, 0.10)`;
    ctx.lineWidth = 1;
    // Keep grid lines within the vertical inset so nothing draws flush
    // against the top/bottom canvas edges.
    const yTop = gridY(0);
    const yBot = gridY(rows - 1);
    ctx.beginPath();
    for (let c = 0; c < cols; c++) {
      const x = gridX(c) + 0.5;
      ctx.moveTo(x, yTop);
      ctx.lineTo(x, yBot);
    }
    for (let r = 0; r < rows; r++) {
      const y = gridY(r) + 0.5;
      ctx.moveTo(0, y);
      ctx.lineTo(cssW, y);
    }
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = `rgba(${GRID_DOT_RGB}, 0.10)`;
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        ctx.fillRect(gridX(c) - 0.75, gridY(r) - 0.75, 1.5, 1.5);
      }
    }
  };

  const snakeLifeAlpha = (s, now) => {
    if (s.arrived) {
      const t = (now - s.arrivedAt) / SNAKE_FADEOUT_MS;
      return Math.max(0, 1 - t);
    }
    const age = now - s.born;
    if (age < SNAKE_FADEIN_MS) return age / SNAKE_FADEIN_MS;
    return 1;
  };

  const drawSnake = (s, now) => {
    const start = Math.max(0, s.pathIndex - SNAKE_TRAIL_LEN);
    const end = s.pathIndex;
    const trail = s.path.slice(start, end + 1);
    if (trail.length < 1) return;

    const lifeAlpha = snakeLifeAlpha(s, now);
    if (lifeAlpha <= 0) return;

    // Pixel position of a trail cell — while the tail is still at the
    // very start, anchor it to the icon centre so the snake clearly
    // emerges FROM the icon rather than from the grid cell beside it.
    const cellPx = (cell, trailIdx) => {
      if (start === 0 && trailIdx === 0 && s.originPx) return s.originPx;
      return { x: gridX(cell.c), y: gridY(cell.r) };
    };

    ctx.save();
    ctx.lineCap = 'round';
    ctx.setLineDash(SNAKE_DASH);
    ctx.lineDashOffset = -((now / 1000) * SNAKE_DASH_FLOW_PX_PER_SEC);
    ctx.lineWidth = 2.2;

    for (let i = 0; i < trail.length - 1; i++) {
      const a = cellPx(trail[i], i);
      const b = cellPx(trail[i + 1], i + 1);
      const t = (i + 1) / Math.max(1, trail.length);
      const alpha = (0.4 + t * 0.55) * lifeAlpha;
      ctx.strokeStyle = `rgba(${SNAKE_TRAIL_RGB}, ${alpha})`;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }

    // Head segment — interpolated forward position.
    if (!s.arrived) {
      const curr = s.path[s.pathIndex];
      const nxt = s.path[s.pathIndex + 1];
      if (curr && nxt) {
        const cx = gridX(curr.c);
        const cy = gridY(curr.r);
        const nx = gridX(nxt.c);
        const ny = gridY(nxt.r);
        const px = cx + (nx - cx) * s.progress;
        const py = cy + (ny - cy) * s.progress;
        ctx.strokeStyle = `rgba(${SNAKE_TRAIL_RGB}, ${0.95 * lifeAlpha})`;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(px, py);
        ctx.stroke();
      }
    }

    ctx.restore();
  };

  const drawSparks = (now) => {
    for (const sp of sparks) {
      const t = (now - sp.born) / 700;
      if (t >= 1) continue;
      const ease = 1 - Math.pow(1 - t, 2);
      const ringR = 3 + ease * 18;
      const alpha = (1 - t) * 0.7;
      // Don't render a spark so close to the top/bottom that it clips
      // into a half-circle.
      const margin = ringR + 12;
      if (sp.y < margin || sp.y > cssH - margin) continue;

      // Outer glow.
      const grad = ctx.createRadialGradient(sp.x, sp.y, 0, sp.x, sp.y, ringR + 10);
      grad.addColorStop(0, `rgba(${SPARK_RGB}, ${alpha * 0.85})`);
      grad.addColorStop(0.6, `rgba(${SPARK_RGB}, ${alpha * 0.30})`);
      grad.addColorStop(1, `rgba(${SPARK_RGB}, 0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, ringR + 10, 0, Math.PI * 2);
      ctx.fill();

      // Expanding ring.
      ctx.strokeStyle = `rgba(${SPARK_RGB}, ${alpha})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, ringR, 0, Math.PI * 2);
      ctx.stroke();

      // Bright pulse core that shrinks.
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.9})`;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, Math.max(0.5, 2.4 - t * 2), 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const drawCenterHalo = (now) => {
    if (!orbitVisible() || !orbitCenterPx) return;
    const ts = now * 0.001;
    const breathe = Math.sin(ts * 0.55) * 0.5 + 0.5;
    const haloR = 110 + breathe * 24;
    const grad = ctx.createRadialGradient(orbitCenterPx.x, orbitCenterPx.y, 0, orbitCenterPx.x, orbitCenterPx.y, haloR);
    grad.addColorStop(0, `rgba(${HALO_RGB}, ${0.18 + breathe * 0.08})`);
    grad.addColorStop(0.55, `rgba(${HALO_RGB}, 0.04)`);
    grad.addColorStop(1, `rgba(${HALO_RGB}, 0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(orbitCenterPx.x, orbitCenterPx.y, haloR, 0, Math.PI * 2);
    ctx.fill();
  };

  // ── Resize / parallax ───────────────────────────────────────

  const resize = () => {
    // Extend the canvas downward so the play area reaches just above the
    // "Trusted by high-growth fintechs" row — giving snakes room to route
    // below the text block / orbit, not just in thin margins.
    const gridEl = canvas.parentElement;
    if (gridEl) {
      const gridRect = gridEl.getBoundingClientRect();
      let targetH = gridRect.height;
      if (trustedRowEl && trustedRowEl.offsetParent !== null) {
        const tr = trustedRowEl.getBoundingClientRect();
        const h = tr.top - gridRect.top - 14;
        if (h > targetH) targetH = h;
      }
      canvas.style.height = `${Math.round(targetH)}px`;
    }

    const rect = canvas.getBoundingClientRect();
    cssW = rect.width;
    cssH = rect.height;
    if (cssW === 0 || cssH === 0) return;
    canvasRect = { left: rect.left, top: rect.top };
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    computeGrid();
    computeIconAnchors();
    noGoZones = computeNoGoZones();
    snakes = [];
    sparks = [];
    iconCooldown = {};
    const now = performance.now();
    nextSpawnTime = now;

    // Seed a couple of snakes immediately so the canvas isn't blank,
    // then stagger the rest: give each remaining icon a short, spread-out
    // initial cooldown so snakes ease in one-by-one rather than all
    // popping in together (which looked janky).
    let seeded = 0;
    while (seeded < 2 && trySpawnOne(now)) seeded++;
    for (let i = 0; i < iconAnchors.length; i++) {
      if (!iconCooldown[i]) iconCooldown[i] = now + 400 + Math.random() * 2600;
    }
  };

  let parallaxX = 0, parallaxY = 0, targetParallaxX = 0, targetParallaxY = 0;
  const onMove = (e) => {
    const rect = host.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    targetParallaxX = Math.max(-1, Math.min(1, px)) * 6;
    targetParallaxY = Math.max(-1, Math.min(1, py)) * 6;
  };
  const onLeave = () => { targetParallaxX = 0; targetParallaxY = 0; };
  host.addEventListener('pointermove', onMove);
  host.addEventListener('pointerleave', onLeave);

  // ── Draw orchestration / loop ───────────────────────────────

  let lastFrameTime = 0;

  const draw = (now, staticFrame = false) => {
    const rect = canvas.getBoundingClientRect();
    canvasRect.left = rect.left;
    canvasRect.top = rect.top;

    let dtMs = lastFrameTime ? Math.min(80, now - lastFrameTime) : 16;
    lastFrameTime = now;

    ctx.clearRect(0, 0, cssW, cssH);

    if (!staticFrame) updateSnakes(now, dtMs);

    parallaxX = lerp(parallaxX, targetParallaxX, 0.06);
    parallaxY = lerp(parallaxY, targetParallaxY, 0.06);

    ctx.save();
    ctx.translate(parallaxX, parallaxY);
    drawCenterHalo(now);
    drawGrid();
    for (const s of snakes) drawSnake(s, now);
    drawSparks(now);
    ctx.restore();
  };

  let rafId = 0;
  let running = false;
  const tick = (now) => {
    if (!running) return;
    draw(now);
    rafId = requestAnimationFrame(tick);
  };
  const start = () => {
    if (running) return;
    // If the canvas hasn't been measured yet (cssW=0 right after a
    // page/layout shift), do a fresh measure first and retry next
    // frame if it's still empty. Avoids the loop staying dormant.
    if (cssW === 0 || cssH === 0) {
      resize();
      if (cssW === 0 || cssH === 0) {
        requestAnimationFrame(start);
        return;
      }
    }
    running = true;
    lastFrameTime = 0;
    rafId = requestAnimationFrame(tick);
  };
  const stop = () => {
    if (!running) return;
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
  };

  const paintStaticFrame = () => draw(2200, true);

  resize();
  if (reduced) paintStaticFrame();
  else start();

  const io = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (reduced) continue;
          if (entry.isIntersecting) start();
          else stop();
        }
      }, { threshold: 0.05 })
    : null;
  io?.observe(host);

  let resizeRaf = 0;
  const onResize = () => {
    cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(() => {
      resize();
      if (reduced) {
        paintStaticFrame();
      } else if (!running && cssW > 0 && cssH > 0) {
        // Loop was paused (e.g. via IntersectionObserver during a
        // layout shift). Restart it so the new size animates.
        start();
      }
    });
  };
  window.addEventListener('resize', onResize);

  let scrollRaf = 0;
  const onScroll = () => {
    if (scrollRaf) return;
    scrollRaf = requestAnimationFrame(() => {
      scrollRaf = 0;
      const r = canvas.getBoundingClientRect();
      canvasRect.left = r.left;
      canvasRect.top = r.top;
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  // Tab visibility — when user comes back to the tab the rAF queue
  // may not auto-resume on some browsers if our loop got into a weird
  // state. Force-restart here as a safety net.
  const onVisibility = () => {
    if (document.visibilityState === 'visible' && !reduced && !running) {
      start();
    }
  };
  document.addEventListener('visibilitychange', onVisibility);

  return () => {
    stop();
    io?.disconnect();
    window.removeEventListener('resize', onResize);
    window.removeEventListener('scroll', onScroll);
    document.removeEventListener('visibilitychange', onVisibility);
    host.removeEventListener('pointermove', onMove);
    host.removeEventListener('pointerleave', onLeave);
  };
};
