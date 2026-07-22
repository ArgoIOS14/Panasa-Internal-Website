/**
 * GSAP-driven visuals for the AI-Accelerated Fintech Engineering service page.
 *
 * Design notes:
 * - We deliberately do NOT use GSAP ScrollTrigger. `smooth-scroll.js` already owns
 *   the Lenis requestAnimationFrame loop; adding ScrollTrigger would mean racing two
 *   RAF loops (or refactoring a shared module four pages depend on). None of these
 *   sections need scroll-scrubbing — they only need "run the loop while the section
 *   is on screen", which a plain IntersectionObserver handles cleanly (see the
 *   viewport gate at the bottom of initServiceAnimations).
 * - GSAP core + MotionPathPlugin are loaded on demand from jsdelivr (+esm), matching
 *   how Lenis / DOMPurify are loaded elsewhere in this codebase.
 * - Every animated node has a readable CSS resting state, so the sections degrade
 *   gracefully if the CDN is blocked (catch → static) or the visitor prefers reduced
 *   motion (short-circuit before the CDN fetch). GSAP animates *over* that baseline;
 *   nothing that carries copy starts hidden.
 */

const GSAP_URL = 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/+esm';
const MOTIONPATH_URL = 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/MotionPathPlugin/+esm';
const SVGNS = 'http://www.w3.org/2000/svg';

// Idempotency guard: `initScrollAnimations` re-runs on bfcache `pageshow`, and the
// caller may fire us more than once. GSAP timelines must only be built a single time.
let started = false;

export async function initServiceAnimations() {
  if (started) return;
  started = true;

  const roots = {
    build: document.querySelector('.svc-build'),
    challenge: document.querySelector('.challenge-section .svc-problem'),
    timeline: document.querySelector('.svc-timeline'),
    process: document.querySelector('.svc-flow'),
  };
  const present = Object.values(roots).filter(Boolean);
  if (!present.length) return;

  const markStatic = () => present.forEach((el) => el.classList.add('svc-anim-static'));

  // Reduced motion: show the final composition, never fetch GSAP, never tween.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    markStatic();
    return;
  }

  let gsap;
  try {
    ({ gsap } = await import(GSAP_URL));
    const { MotionPathPlugin } = await import(MOTIONPATH_URL);
    gsap.registerPlugin(MotionPathPlugin);
  } catch (err) {
    console.warn('[service-animations] GSAP failed to load; using static fallback', err);
    markStatic();
    return;
  }

  present.forEach((el) => el.classList.add('svc-anim-ready'));

  const loops = []; // { el, tl } — timelines gated to the viewport
  const register = (el, tl) => {
    if (el && tl) loops.push({ el, tl });
  };

  if (roots.build) initDeliverables(gsap, roots.build, register);
  if (roots.challenge) initChallenge(gsap, roots.challenge, register);
  if (roots.timeline) initTimeline(gsap, roots.timeline, register);
  if (roots.process) initProcess(gsap, roots.process, register);

  // Pause looping timelines while their section is off-screen.
  if (loops.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const rec = loops.find((l) => l.el === entry.target);
          if (!rec) return;
          if (entry.isIntersecting) rec.tl.play();
          else rec.tl.pause();
        });
      },
      { threshold: 0.06 },
    );
    loops.forEach((l) => io.observe(l.el));
  }
}

/* ---- helper: glowing packets travelling along an SVG path, looping ---- */
function flow(gsap, svg, path, opt = {}) {
  const { count = 1, dur = 2, size = 2.4, delay = 0, reverse = false } = opt;
  const tl = gsap.timeline({ repeat: -1, paused: true });
  for (let i = 0; i < count; i += 1) {
    const c = document.createElementNS(SVGNS, 'circle');
    c.setAttribute('r', size);
    c.setAttribute('class', 'svc-packet');
    svg.appendChild(c);
    const d = delay + i * (dur / count);
    tl.to(
      c,
      {
        duration: dur,
        repeat: -1,
        ease: 'none',
        motionPath: { path, align: path, alignOrigin: [0.5, 0.5], start: reverse ? 1 : 0, end: reverse ? 0 : 1 },
      },
      d,
    );
    tl.to(c, { keyframes: { opacity: [0, 1, 1, 0] }, duration: dur, repeat: -1, ease: 'none' }, d);
  }
  return tl;
}

/* ================= Deliverables — 5 payment-infrastructure cards ================= */
function initDeliverables(gsap, root, register) {
  const q = (sel) => root.querySelector(sel);
  const qa = (sel) => Array.from(root.querySelectorAll(sel));

  // Card 1 — Payment & Issuing: contactless waves + branch packets + node glow
  const c1 = q('[data-viz="issuing"]');
  if (c1) {
    const master = gsap.timeline();
    const waves = qa('[data-viz="issuing"] .svc-wave');
    gsap.set(waves, { transformOrigin: 'center', opacity: 0, scale: 0.4 });
    master.add(
      gsap
        .timeline({ repeat: -1, repeatDelay: 0.5 })
        .to(waves, { opacity: 0.9, scale: 1, duration: 0.45, stagger: 0.16, ease: 'power2.out' })
        .to(waves, { opacity: 0, duration: 0.45, stagger: 0.1, ease: 'power1.in' }, '+=0.25'),
      0,
    );
    gsap.to('[data-viz="issuing"] .svc-sheen', { x: 150, duration: 2.4, repeat: -1, repeatDelay: 2, ease: 'power2.inOut' });
    // gentle float of the whole card mock (matches reference .ccard float)
    gsap.to('[data-viz="issuing"] .svc-cardmock', { y: -4, duration: 2.6, repeat: -1, yoyo: true, ease: 'sine.inOut' });
    const svg = c1.querySelector('svg');
    ['#i-p1', '#i-p2', '#i-p3'].forEach((p, i) => {
      const path = svg.querySelector(p);
      if (path) master.add(flow(gsap, svg, path, { dur: 1.9, delay: i * 0.55 }), 0);
    });
    const nodes = qa('[data-viz="issuing"] .svc-endnode');
    const glow = gsap.timeline({ repeat: -1 });
    nodes.forEach((n, i) => {
      glow
        .to(n, { attr: { class: 'svc-endnode is-hot' }, duration: 0.1 }, 0.45 + i * 0.55)
        .to(n, { attr: { class: 'svc-endnode' }, duration: 0.1 }, 0.95 + i * 0.55);
    });
    glow.to({}, { duration: 0.5 });
    master.add(glow, 0);
    register(c1, master);
  }

  // Card 2 — Payment Processing: authorize → process → settle
  const c2 = q('[data-viz="processing"]');
  if (c2) {
    const svg = c2.querySelector('svg');
    const master = gsap.timeline();
    ['#pr-p1', '#pr-p2'].forEach((p, i) => {
      const path = svg.querySelector(p);
      if (path) master.add(flow(gsap, svg, path, { dur: 1.4, delay: i * 1.4 }), 0);
    });
    gsap.to('[data-viz="processing"] .svc-ring', { rotation: 360, duration: 4, repeat: -1, ease: 'none', transformOrigin: 'center' });
    // breathing glow on the process node (matches reference #c2proc box-shadow pulse)
    gsap.fromTo(
      '[data-viz="processing"] .svc-proc',
      { filter: 'drop-shadow(0 0 0px rgba(22,171,109,0))' },
      { filter: 'drop-shadow(0 0 10px rgba(22,171,109,0.55))', duration: 1.4, repeat: -1, yoyo: true, ease: 'sine.inOut' },
    );
    master.add(
      gsap.to('[data-viz="processing"] .svc-proc', {
        scale: 1.08,
        duration: 1.4,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        transformOrigin: 'center',
      }),
      0,
    );
    register(c2, master);
  }

  // Card 3 — Open Banking: sonar radar
  const c3 = q('[data-viz="openbanking"]');
  if (c3) {
    const svg = c3.querySelector('svg');
    const master = gsap.timeline();
    master.add(
      gsap.to('[data-viz="openbanking"] .svc-radar', {
        opacity: 0.5,
        duration: 2.2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        stagger: 0.2,
        transformOrigin: 'center',
      }),
      0,
    );
    const cx = 60;
    const cy = 110;
    [0, 0.9, 1.8].forEach((d) => {
      const ping = document.createElementNS(SVGNS, 'circle');
      ping.setAttribute('cx', cx);
      ping.setAttribute('cy', cy);
      ping.setAttribute('r', 10);
      ping.setAttribute('class', 'svc-ping');
      svg.appendChild(ping);
      master.add(
        gsap.fromTo(
          ping,
          { attr: { r: 8 }, opacity: 0.7 },
          { attr: { r: 78 }, opacity: 0, duration: 2.6, ease: 'power1.out', repeat: -1, delay: d },
        ),
        0,
      );
    });
    ['#ob-p1', '#ob-p2'].forEach((p, i) => {
      const path = svg.querySelector(p);
      if (path) master.add(flow(gsap, svg, path, { dur: 1.5, delay: i * 0.75 }), 0);
    });
    // glow pulse on the Open Banking layer pill (matches reference .ob-pill pulse)
    gsap.fromTo(
      '[data-viz="openbanking"] .svc-oblabel-bg',
      { filter: 'drop-shadow(0 0 0px rgba(22,171,109,0))' },
      { filter: 'drop-shadow(0 0 12px rgba(22,171,109,0.5))', duration: 1.6, repeat: -1, yoyo: true, ease: 'sine.inOut' },
    );
    register(c3, master);
  }

  // Card 4 — Ledger & Core Banking: floating chips + row-sweep
  const c4 = q('[data-viz="ledger"]');
  if (c4) {
    const master = gsap.timeline();
    master.add(
      gsap.to('[data-viz="ledger"] .svc-chip', {
        y: -5,
        duration: 2.4,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        stagger: { each: 0.3 },
      }),
      0,
    );
    // border shimmer on the chips (matches reference pill border shimmer)
    gsap.to('[data-viz="ledger"] .svc-chip rect', {
      stroke: 'rgba(22,171,109,0.45)',
      duration: 1.8,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      stagger: 0.4,
    });
    const hl = c4.querySelector('.svc-rowhl');
    const rowY = [46, 80, 114];
    const sweep = gsap.timeline({ repeat: -1 });
    rowY.forEach((y, i) => {
      sweep
        .to(hl, { attr: { y }, duration: 0.5, ease: 'power2.inOut' }, i * 1.0)
        .fromTo(hl, { opacity: 0.25 }, { opacity: 1, duration: 0.3, yoyo: true, repeat: 1 }, i * 1.0 + 0.1);
    });
    master.add(sweep, 0);
    register(c4, master);
  }

  // Card 5 — Settlement & Reconciliation: converge → node → diverge
  const c5 = q('[data-viz="settlement"]');
  if (c5) {
    const svg = c5.querySelector('svg');
    const master = gsap.timeline();
    ['#st-s1', '#st-s2', '#st-s3'].forEach((p, i) => {
      const path = svg.querySelector(p);
      if (path) master.add(flow(gsap, svg, path, { dur: 1.5, delay: i * 0.25 }), 0);
    });
    ['#st-r1', '#st-r2'].forEach((p, i) => {
      const path = svg.querySelector(p);
      if (path) master.add(flow(gsap, svg, path, { dur: 1.4, delay: 1.5 + i * 0.25 }), 0);
    });
    gsap.to('[data-viz="settlement"] .svc-ring', { rotation: -360, duration: 5, repeat: -1, ease: 'none', transformOrigin: 'center' });
    // node pulse synced to convergence (matches reference #c5node pulse)
    gsap.fromTo(
      '[data-viz="settlement"] .svc-proc',
      { scale: 1, filter: 'drop-shadow(0 0 0px rgba(22,171,109,0))', transformOrigin: 'center' },
      { scale: 1.06, filter: 'drop-shadow(0 0 12px rgba(22,171,109,0.5))', duration: 0.5, repeat: -1, yoyo: true, repeatDelay: 1.1, ease: 'power2.out', transformOrigin: 'center' },
    );
    register(c5, master);
  }
}

/* ================= Challenge — auto-rotating problem accordion ================= */
function mkSvg(tag, attrs) {
  const el = document.createElementNS(SVGNS, tag);
  Object.entries(attrs || {}).forEach(([k, v]) => el.setAttribute(k, v));
  return el;
}

// Builds the "volume vs. manual capacity" bar visual; returns a replay fn.
function buildScaleViz(gsap, frame) {
  const barsG = frame.querySelector('.svc-vz-bars');
  const chip = frame.querySelector('.svc-vz-chip');
  const H = [34, 58, 80, 104, 128, 150, 172, 192, 210];
  const bars = H.map((h, k) => {
    const over = h > 100;
    const r = mkSvg('rect', { class: 'svc-vz-bar' + (over ? ' is-over' : ''), x: 40 + 41 * k, y: 250, width: 26, height: 0, rx: 4 });
    barsG.appendChild(r);
    return r;
  });
  return () => {
    bars.forEach((b) => { b.setAttribute('height', 0); b.setAttribute('y', 250); });
    gsap.set(chip, { autoAlpha: 0 });
    const tl = gsap.timeline();
    bars.forEach((b, k) => tl.to(b, { attr: { height: H[k], y: 250 - H[k] }, duration: 0.4, ease: 'power3.out' }, 0.05 * k));
    tl.fromTo(chip, { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '-=0.15');
    return tl;
  };
}

// Builds the "release timeline" gates visual; returns a replay fn.
function buildTimelineViz(gsap, frame) {
  const gatesG = frame.querySelector('.svc-vz-gates');
  const fillG = frame.querySelector('.svc-vz-fill-g');
  const fillD = frame.querySelector('.svc-vz-fill-d');
  const delay = frame.querySelector('.svc-vz-delay');
  const gateDefs = [{ x: 150, t: 'PCI' }, { x: 240, t: 'Scheme' }, { x: 330, t: 'FCA' }];
  const gates = gateDefs.map((g) => {
    const grp = mkSvg('g', { class: 'svc-vz-gate', opacity: 0 });
    grp.appendChild(mkSvg('rect', { x: g.x, y: 188, width: 22, height: 20, rx: 4 }));
    const t = mkSvg('text', { x: g.x + 11, y: 228, 'text-anchor': 'middle' });
    t.textContent = g.t;
    grp.appendChild(t);
    gatesG.appendChild(grp);
    return grp;
  });
  const widths = [210, 300, 386];
  return () => {
    fillG.setAttribute('width', 0);
    fillD.setAttribute('width', 0);
    gates.forEach((g) => gsap.set(g, { autoAlpha: 0, y: -8 }));
    gsap.set(delay, { autoAlpha: 0 });
    const tl = gsap.timeline();
    tl.to(fillG, { attr: { width: 270 }, duration: 0.6, ease: 'power2.out' });
    tl.to(fillD, { attr: { width: 130 }, duration: 0.4, ease: 'power2.out' }, '+=0.1');
    gates.forEach((g, k) => {
      tl.to(g, { autoAlpha: 1, y: 0, duration: 0.32, ease: 'back.out(2)' });
      tl.to(fillD, { attr: { width: widths[k] }, duration: 0.36, ease: 'power2.out' }, '<');
    });
    tl.fromTo(delay, { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power2.out' }, '-=0.1');
    return tl;
  };
}

// Builds the "sprint capacity over time" stacked-bar + trend visual; returns a replay fn.
function buildDebtViz(gsap, frame) {
  const stacksG = frame.querySelector('.svc-vz-stacks');
  const trend = frame.querySelector('.svc-vz-trend');
  const end = frame.querySelector('.svc-vz-end');
  const frac = [0.18, 0.32, 0.46, 0.6, 0.74, 0.86];
  const base = 250;
  const total = 200;
  const pts = [];
  const pairs = frac.map((f, k) => {
    const x = 52 + 62 * k;
    const legH = total * f;
    const featH = total - legH;
    const feat = mkSvg('rect', { class: 'svc-vz-stack-f', x, width: 42, rx: 3, y: base, height: 0 });
    const leg = mkSvg('rect', { class: 'svc-vz-stack-m', x, width: 42, rx: 3, y: base, height: 0 });
    stacksG.appendChild(feat);
    stacksG.appendChild(leg);
    pts.push((x + 21) + ',' + (base - legH));
    return { feat, leg, featY: base - total, featH, legY: base - legH, legH };
  });
  trend.setAttribute('points', pts.join(' '));
  return () => {
    pairs.forEach((p) => { p.feat.setAttribute('height', 0); p.feat.setAttribute('y', base); p.leg.setAttribute('height', 0); p.leg.setAttribute('y', base); });
    gsap.set(end, { autoAlpha: 0 });
    const len = trend.getTotalLength ? trend.getTotalLength() : 400;
    gsap.set(trend, { attr: { 'stroke-dashoffset': len }, strokeDasharray: '4 4' });
    const tl = gsap.timeline();
    pairs.forEach((p, k) => {
      tl.to(p.leg, { attr: { height: p.legH, y: p.legY }, duration: 0.38, ease: 'power3.out' }, 0.08 * k);
      tl.to(p.feat, { attr: { height: p.featH, y: p.featY }, duration: 0.38, ease: 'power3.out' }, 0.08 * k + 0.05);
    });
    tl.fromTo(trend, { attr: { 'stroke-dashoffset': len } }, { attr: { 'stroke-dashoffset': 0 }, duration: 0.8, ease: 'power1.inOut' }, '-=0.4');
    tl.fromTo(end, { autoAlpha: 0, x: 8 }, { autoAlpha: 1, x: 0, duration: 0.45 }, '-=0.2');
    return tl;
  };
}

function initChallenge(gsap, root, register) {
  const items = Array.from(root.querySelectorAll('.svc-acc-item'));
  const frames = Array.from(root.querySelectorAll('.svc-viz-frame'));
  const dots = Array.from(root.querySelectorAll('.svc-dot i'));
  if (!items.length) return;

  const builders = [buildScaleViz, buildTimelineViz, buildDebtViz];
  const players = frames.map((f, i) => (builders[i] ? builders[i](gsap, f) : () => {}));

  const DWELL = 2800;
  let current = -1;
  let timer = null;
  let hovering = false;
  let inView = false;

  const setActive = (i) => {
    if (i === current) return;
    current = i;
    // All descriptions stay visible with fixed spacing; only the highlight moves
    // (toggling .is-open drives the check, rule, and text emphasis via CSS), so the
    // checkbox column never reflows as the section auto-rotates.
    items.forEach((it, j) => it.classList.toggle('is-open', j === i));
    // Hide inactive frames instantly (so they can never overlap the active one,
    // even if a crossfade tween is interrupted) and fade the active one in.
    frames.forEach((f, j) => {
      if (j !== i) gsap.set(f, { autoAlpha: 0 });
    });
    gsap.to(frames[i], { autoAlpha: 1, duration: 0.4 });
    if (players[i]) players[i]();
    dots.forEach((d, j) => gsap.set(d, { width: j < i ? '100%' : '0%' }));
    if (dots[i]) gsap.fromTo(dots[i], { width: '0%' }, { width: '100%', duration: DWELL / 1000, ease: 'none' });
  };
  const advance = () => setActive((current + 1) % items.length);
  const start = () => {
    stop();
    if (inView && !hovering) timer = setInterval(advance, DWELL);
  };
  function stop() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  items.forEach((it, i) => {
    const trigger = it.querySelector('.svc-acc-trigger');
    if (trigger)
      trigger.addEventListener('click', () => {
        setActive(i);
        start();
      });
  });
  dots.forEach((d, i) => {
    const dot = d.closest('.svc-dot');
    if (dot) dot.addEventListener('click', () => { setActive(i); start(); });
  });
  root.addEventListener('mouseenter', () => { hovering = true; stop(); });
  root.addEventListener('mouseleave', () => { hovering = false; start(); });

  setActive(0);

  // The IO gate starts/stops the rotation as the section enters/leaves the viewport.
  register(root, { play: () => { inView = true; start(); }, pause: () => { inView = false; stop(); } });
}

/* ================= Timeline — same scope, half the timeline ================= */
function initTimeline(gsap, root, register) {
  const bars = Array.from(root.querySelectorAll('.svc-tl-seg'));
  const faster = root.querySelector('.svc-tl-faster');
  const tradBar = root.querySelector('.svc-tl-bar-trad');
  const tl = gsap.timeline({ paused: true });
  if (tradBar) tl.fromTo(tradBar, { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: 'power2.out', transformOrigin: 'left center' });
  tl.fromTo(bars, { opacity: 0, scaleX: 0 }, { opacity: 1, scaleX: 1, duration: 0.45, stagger: 0.12, ease: 'power3.out', transformOrigin: 'left center' }, '-=0.3');
  if (faster) tl.fromTo(faster, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: 'power2.out' }, '-=0.2');
  // continuous soft glow on the faster zone
  if (faster) gsap.to(faster, { boxShadow: '0 0 26px rgba(22,171,109,0.22)', duration: 1.8, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 1.4 });

  // Play once when it enters; register a shim so the IO gate can trigger it.
  let played = false;
  const gate = { play: () => { if (!played) { played = true; tl.play(); } }, pause: () => {} };
  register(root, gate);
}

/* ================= Process — animated five-stage flow ================= */
function initProcess(gsap, root, register) {
  const nodes = Array.from(root.querySelectorAll('.svc-flow-node'));
  const flowLine = root.querySelector('.svc-flow-flow');

  // Continuous flowing dashes along the green connector (cheap; not gated).
  if (flowLine) {
    gsap.set(flowLine, { strokeDasharray: '5 11' });
    gsap.to(flowLine, { strokeDashoffset: -32, duration: 1, repeat: -1, ease: 'none' });
  }

  // Sequential node activation with a subtle pop, gated to the viewport by the IO shim.
  const master = gsap.timeline({ repeat: -1, repeatDelay: 0.6 });
  nodes.forEach((n, i) => {
    master
      .to(n, { attr: { class: 'svc-flow-node is-hot' }, duration: 0.1 }, i * 0.55)
      .fromTo(n, { scale: 1 }, { scale: 1.1, duration: 0.25, yoyo: true, repeat: 1, transformOrigin: 'center', ease: 'power2.out' }, i * 0.55)
      .to(n, { attr: { class: 'svc-flow-node' }, duration: 0.1 }, i * 0.55 + 0.85);
  });
  master.to({}, { duration: 0.4 });
  register(root, master);
}
