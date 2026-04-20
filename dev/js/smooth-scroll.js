/**
 * Momentum / inertia-only smooth scroll.
 *
 * Feel:
 * - During active wheel scrolling → NATIVE (no smoothing, instant response)
 * - When wheel stops             → smooth decaying glide using recent velocity
 * - At page boundaries           → glide dissipates quickly (no jitter)
 *
 * This is the opposite of Lenis's model. Lenis smooths during the wheel
 * (felt slow at the start). This model lets native scroll handle the
 * active phase and adds a Lenis-like deceleration only after you let go.
 *
 * Mac trackpads already provide OS-level inertia, so we detect and skip
 * them — adding our own on top would feel double-buffered.
 */

const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const isTouchDevice = window.matchMedia?.('(hover: none) and (pointer: coarse)').matches;

/* ─── Tuning ─────────────────────────────────────────────
   VELOCITY_SCALE  — how much of the recent wheel speed carries into the glide (0..1)
   FRICTION        — per-frame velocity decay (higher = longer glide)
   WHEEL_STOP_MS   — how long after the last wheel event before glide kicks in
   ─────────────────────────────────────────────────────── */
const VELOCITY_SCALE = 0.45;
const FRICTION = 0.93;
const WHEEL_STOP_MS = 70;
const MIN_VELOCITY = 0.5;
const TRACKPAD_THRESHOLD = 50; // deltaY below this on deltaMode=0 = trackpad

let recentEvents = [];
let lastWheelAt = 0;
let glideTimer = null;
let gliding = false;
let velocity = 0;
let rafId = null;
let active = false;

export function initSmoothScroll() {
  if (prefersReducedMotion || isTouchDevice) return null;
  if (active) return;
  active = true;

  // passive: true — we never preventDefault, native scroll runs unhindered
  window.addEventListener('wheel', onWheel, { passive: true });
  document.addEventListener('click', onAnchorClick);

  return { stop: stopSmoothScroll };
}

function onWheel(e) {
  // Skip trackpads — they already have OS inertia; adding more feels doubled
  if (e.deltaMode === 0 && Math.abs(e.deltaY) < TRACKPAD_THRESHOLD) {
    return;
  }
  // Skip horizontal scroll and browser zoom (ctrl+wheel)
  if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;

  const now = performance.now();

  // If we were mid-glide, stop immediately so it doesn't fight the user
  if (gliding) {
    cancelAnimationFrame(rafId);
    gliding = false;
    velocity = 0;
  }

  // Record delta for velocity calculation
  recentEvents.push({ time: now, delta: e.deltaY });
  // Keep only events within a ~150ms window
  while (recentEvents.length && recentEvents[0].time < now - 150) {
    recentEvents.shift();
  }
  lastWheelAt = now;

  // After WHEEL_STOP_MS of silence, start the glide
  clearTimeout(glideTimer);
  glideTimer = setTimeout(startGlide, WHEEL_STOP_MS);
}

function startGlide() {
  const now = performance.now();
  if (now - lastWheelAt < WHEEL_STOP_MS - 5) return;
  if (recentEvents.length < 2) return;

  const oldest = recentEvents[0];
  const newest = recentEvents[recentEvents.length - 1];
  const timeSpan = newest.time - oldest.time;
  if (timeSpan < 10) return;

  const totalDelta = recentEvents.reduce((s, ev) => s + ev.delta, 0);
  // Average pixels per 16ms frame, scaled down so glide feels subtle not bouncy
  velocity = (totalDelta / timeSpan) * 16 * VELOCITY_SCALE;

  if (Math.abs(velocity) < MIN_VELOCITY) {
    recentEvents.length = 0;
    return;
  }

  gliding = true;
  rafId = requestAnimationFrame(glide);
}

function glide() {
  if (Math.abs(velocity) < MIN_VELOCITY) {
    gliding = false;
    velocity = 0;
    recentEvents.length = 0;
    return;
  }

  const before = window.scrollY;
  window.scrollBy(0, velocity);
  const after = window.scrollY;

  // Boundary detection — browser refused the scroll delta
  if (after === before) {
    velocity *= 0.25; // snap to rest quickly at boundaries
  } else {
    velocity *= FRICTION;
  }

  rafId = requestAnimationFrame(glide);
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
  const targetY = target.getBoundingClientRect().top + window.scrollY - 20;
  animateScrollTo(targetY);
  if (history.replaceState) history.replaceState(null, '', href);
}

function animateScrollTo(targetY) {
  const startY = window.scrollY;
  const distance = targetY - startY;
  const duration = Math.min(700, Math.max(300, Math.abs(distance) * 0.5));
  const startTime = performance.now();

  // Cancel any glide in progress
  if (gliding) {
    cancelAnimationFrame(rafId);
    gliding = false;
    velocity = 0;
  }

  function step(now) {
    const elapsed = now - startTime;
    const t = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
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
  clearTimeout(glideTimer);
  if (rafId) cancelAnimationFrame(rafId);
  velocity = 0;
  gliding = false;
}

// Auto-init on import
if (!window.__smoothScrollInit) {
  window.__smoothScrollInit = true;
  initSmoothScroll();
}
