/**
 * Custom velocity-based smooth scroll.
 *
 * Feel: wheel events add directly to velocity (instant response on first
 * tick), velocity decays smoothly with friction so scrolling glides to a
 * stop naturally. At page boundaries the browser clamps scrollY, which
 * means velocity dissipates gracefully instead of hitting a hard wall.
 *
 * Disabled when user prefers reduced motion, on touch devices (native
 * momentum is better), and when the wheel event doesn't look like a
 * traditional mouse wheel (trackpads already provide native inertia).
 */

const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const isTouchDevice = window.matchMedia?.('(hover: none) and (pointer: coarse)').matches;

/* ─── Tuning ───────────────────────────────────────────────
   Higher WHEEL_INTENSITY  → more distance per wheel tick (faster)
   Higher FRICTION (<1)    → longer glide before stopping
   ────────────────────────────────────────────────────────── */
const WHEEL_INTENSITY = 0.9;
const FRICTION = 0.88;
const MIN_VELOCITY = 0.4;

let velocity = 0;
let running = false;
let rafId = null;
let active = false;

export function initSmoothScroll() {
  if (prefersReducedMotion || isTouchDevice) return null;
  if (active) return;
  active = true;

  window.addEventListener('wheel', onWheel, { passive: false });

  // Intercept in-page anchor links and animate them smoothly
  document.addEventListener('click', onAnchorClick);

  return { stop: stopSmoothScroll };
}

function onWheel(e) {
  // Bail out for trackpads / precision devices (small smooth deltas).
  // They already provide native inertia; intercepting adds lag.
  if (e.deltaMode === 0 && Math.abs(e.deltaY) < 15) return;

  // Respect ctrl+wheel (browser zoom) and horizontal scroll
  if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;

  e.preventDefault();
  velocity += e.deltaY * WHEEL_INTENSITY;

  if (!running) {
    running = true;
    rafId = requestAnimationFrame(tick);
  }
}

function tick() {
  // Scroll by the current velocity, then decay it
  if (Math.abs(velocity) < MIN_VELOCITY) {
    velocity = 0;
    running = false;
    return;
  }

  const before = window.scrollY;
  window.scrollBy(0, velocity);
  const after = window.scrollY;

  // If the browser refused to scroll (we hit top/bottom), kill velocity
  // so it doesn't linger. Otherwise decay with friction.
  if (after === before) {
    velocity *= 0.4; // quick kill at boundaries
  } else {
    velocity *= FRICTION;
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
  smoothScrollTo(target.getBoundingClientRect().top + window.scrollY - 20);
  if (history.replaceState) history.replaceState(null, '', href);
}

/**
 * Custom animated scroll to a Y position using the same inertia model.
 * Duration is distance-proportional but capped for very long scrolls.
 */
function smoothScrollTo(targetY) {
  const startY = window.scrollY;
  const distance = targetY - startY;
  const duration = Math.min(700, Math.max(300, Math.abs(distance) * 0.5));
  const startTime = performance.now();

  // Cancel any wheel-driven velocity
  velocity = 0;

  function step(now) {
    const elapsed = now - startTime;
    const t = Math.min(elapsed / duration, 1);
    // easeOutCubic — fast start, smooth deceleration (matches wheel feel)
    const eased = 1 - Math.pow(1 - t, 3);
    window.scrollTo(0, startY + distance * eased);
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

export function stopSmoothScroll() {
  if (!active) return;
  active = false;
  window.removeEventListener('wheel', onWheel);
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
