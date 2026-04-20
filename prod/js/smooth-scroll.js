/**
 * Smooth scroll with spring physics.
 *
 * Model: each wheel event updates a virtual target position. Each frame
 * the actual scroll position is pulled toward the target by a critically-
 * damped spring (stiffness pulls toward target, damping prevents bounce).
 *
 * Feel:
 * - Responsive start (spring accelerates into motion)
 * - Buttery smooth middle (high-resolution interpolation)
 * - Natural deceleration (spring settles into target)
 * - Graceful boundary behavior (target clamps to page, spring eases to rest)
 *
 * Disabled for reduced-motion users and touch devices (native is better).
 */

const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const isTouchDevice = window.matchMedia?.('(hover: none) and (pointer: coarse)').matches;

/* ─── Tuning ─────────────────────────────────────────────────
   WHEEL_INTENSITY  — how far a wheel tick pushes the target
   STIFFNESS        — how strongly spring pulls toward target  (0..1)
   DAMPING          — friction on velocity each frame            (0..1)
   Sweet spot: STIFFNESS ~0.1–0.15, DAMPING ~0.75–0.85
   ─────────────────────────────────────────────────────────── */
const WHEEL_INTENSITY = 1.3;
const STIFFNESS = 0.11;
const DAMPING = 0.82;
const REST_THRESHOLD = 0.15;

let targetY = 0;
let velocity = 0;
let running = false;
let rafId = null;
let active = false;

export function initSmoothScroll() {
  if (prefersReducedMotion || isTouchDevice) return null;
  if (active) return;
  active = true;

  targetY = window.scrollY;

  window.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('resize', onResize);
  document.addEventListener('click', onAnchorClick);

  return { stop: stopSmoothScroll };
}

function onResize() {
  targetY = Math.min(targetY, maxScroll());
}

function maxScroll() {
  return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function onWheel(e) {
  // Let trackpads / precision devices use native scroll — their deltas
  // are already smooth and intercepting adds perceptible lag.
  if (e.deltaMode === 0 && Math.abs(e.deltaY) < 15) return;

  // Pass through browser zoom and horizontal scroll
  if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;

  e.preventDefault();

  // If the target was drifting behind the actual scroll position (e.g.
  // user scrolled natively somehow), sync it before adding delta.
  const currentY = window.scrollY;
  if (Math.abs(targetY - currentY) > 200) targetY = currentY;

  targetY = clamp(targetY + e.deltaY * WHEEL_INTENSITY, 0, maxScroll());

  if (!running) {
    running = true;
    rafId = requestAnimationFrame(tick);
  }
}

function tick() {
  const currentY = window.scrollY;
  const delta = targetY - currentY;

  // Spring physics:  a = (target - pos) * k ;  v = v*damping + a ;  pos += v
  const acceleration = delta * STIFFNESS;
  velocity = velocity * DAMPING + acceleration;

  // Rest condition — both velocity and delta are tiny
  if (Math.abs(velocity) < REST_THRESHOLD && Math.abs(delta) < REST_THRESHOLD) {
    // Snap to exact target for pixel-perfect rest
    window.scrollTo(0, Math.round(targetY));
    velocity = 0;
    running = false;
    return;
  }

  window.scrollBy(0, velocity);

  // If the browser clamped us (hit top/bottom), realign target
  const afterY = window.scrollY;
  if (afterY !== currentY + velocity) {
    targetY = afterY;
    velocity = 0;
  }

  rafId = requestAnimationFrame(tick);
}

function onAnchorClick(e) {
  const link = e.target.closest('a[href^="#"]');
  if (!link) return;
  const href = link.getAttribute('href');
  if (!href || href === '#' || href.length < 2) return;
  if (link.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey) return;

  const target = document.querySelector(href);
  if (!target) return;

  e.preventDefault();
  // Jump the spring target; the existing tick loop will animate toward it
  targetY = clamp(
    target.getBoundingClientRect().top + window.scrollY - 20,
    0,
    maxScroll()
  );
  if (!running) {
    running = true;
    rafId = requestAnimationFrame(tick);
  }
  if (history.replaceState) history.replaceState(null, '', href);
}

export function stopSmoothScroll() {
  if (!active) return;
  active = false;
  window.removeEventListener('wheel', onWheel);
  window.removeEventListener('resize', onResize);
  document.removeEventListener('click', onAnchorClick);
  if (rafId) cancelAnimationFrame(rafId);
  velocity = 0;
  running = false;
}

// Auto-init on import
if (!window.__smoothScrollInit) {
  window.__smoothScrollInit = true;
  initSmoothScroll();
}
