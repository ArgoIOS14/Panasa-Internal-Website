/**
 * Momentum-after-release smooth scroll.
 *
 * Principle:
 *   - Active wheel/scroll = NATIVE (no smoothing, zero delay, exactly
 *     tracks the wheel hardware).
 *   - When the wheel stops = a smooth gliding deceleration carries
 *     scrollY a bit further with easeOutQuint decay.
 *   - Anchor links       = smooth animated scroll with the same easing.
 *
 * This drops Lenis entirely. Lenis smooths during the wheel too, which
 * is the exact behavior the user didn't want.
 *
 * Trackpads are skipped — they already have OS-level inertia; stacking
 * our glide on top would double-buffer the momentum.
 */

const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const isTouchDevice = window.matchMedia?.('(hover: none) and (pointer: coarse)').matches;

/* ─── Tuning ─────────────────────────────────────────────
   GLIDE_DELAY_MS     — quiet time after last wheel event before glide starts
   GLIDE_DURATION_MS  — how long the deceleration animation runs
   GLIDE_DISTANCE_PCT — glide adds this fraction of recent scroll distance
   GLIDE_MAX_PX       — absolute cap so fast scrolls don't glide forever
   ─────────────────────────────────────────────────────── */
const GLIDE_DELAY_MS = 70;
const GLIDE_DURATION_MS = 800;
const GLIDE_DISTANCE_PCT = 0.55;
const GLIDE_MAX_PX = 500;
const VELOCITY_SAMPLE_MS = 140;
const MIN_GLIDE_PX = 15;
const TRACKPAD_DELTA_THRESHOLD = 50; // deltaY <this on deltaMode=0 = trackpad

let recentEvents = [];   // {time, delta}
let lastWheelAt = 0;
let glideTimer = null;
let glideRaf = null;
let gliding = false;
let active = false;

export function initSmoothScroll() {
  if (prefersReducedMotion || isTouchDevice) return null;
  if (active) return;
  active = true;

  // passive: true — we never preventDefault; native scroll runs unimpeded
  window.addEventListener('wheel', onWheel, { passive: true });
  document.addEventListener('click', onAnchorClick);

  return { stop: stopSmoothScroll };
}

function onWheel(e) {
  // Skip trackpads — they already have OS inertia
  if (e.deltaMode === 0 && Math.abs(e.deltaY) < TRACKPAD_DELTA_THRESHOLD) return;
  // Skip horizontal scroll / browser zoom
  if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;

  const now = performance.now();

  // User is actively scrolling — stop any in-progress glide immediately
  if (gliding) {
    cancelAnimationFrame(glideRaf);
    gliding = false;
  }

  // Track event for velocity calculation
  recentEvents.push({ time: now, delta: e.deltaY });
  while (recentEvents.length && recentEvents[0].time < now - VELOCITY_SAMPLE_MS) {
    recentEvents.shift();
  }
  lastWheelAt = now;

  // Schedule glide kick-off after wheel quiet period
  clearTimeout(glideTimer);
  glideTimer = setTimeout(startGlide, GLIDE_DELAY_MS);
}

function startGlide() {
  const now = performance.now();
  if (now - lastWheelAt < GLIDE_DELAY_MS - 10) return;
  if (recentEvents.length === 0) return;

  // Sum recent wheel deltas (how much the user pushed the page recently)
  const totalDelta = recentEvents.reduce((s, ev) => s + ev.delta, 0);
  recentEvents.length = 0;

  const direction = Math.sign(totalDelta);
  const magnitude = Math.abs(totalDelta);
  if (magnitude < MIN_GLIDE_PX) return;

  // Glide distance = scaled fraction of recent scroll, capped
  const distance = direction * Math.min(magnitude * GLIDE_DISTANCE_PCT, GLIDE_MAX_PX);

  animateGlide(distance);
}

function animateGlide(distance) {
  const startY = window.scrollY;
  const startT = performance.now();
  gliding = true;

  // easeOutQuint — smooth deceleration to rest
  const ease = (t) => 1 - Math.pow(1 - t, 5);

  const step = () => {
    if (!gliding) return;
    const t = Math.min((performance.now() - startT) / GLIDE_DURATION_MS, 1);
    const targetY = startY + distance * ease(t);
    window.scrollTo(0, targetY);

    // Stop if we hit a page boundary (browser refused to scroll further)
    if (Math.abs(window.scrollY - targetY) > 2) {
      gliding = false;
      return;
    }
    if (t < 1) {
      glideRaf = requestAnimationFrame(step);
    } else {
      gliding = false;
    }
  };
  glideRaf = requestAnimationFrame(step);
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
  if (gliding) {
    cancelAnimationFrame(glideRaf);
    gliding = false;
  }
  const startY = window.scrollY;
  const distance = targetY - startY;
  const duration = Math.min(1000, Math.max(400, Math.abs(distance) * 0.5));
  const startT = performance.now();

  // easeOutQuint — same curve as the wheel glide for consistency
  const ease = (t) => 1 - Math.pow(1 - t, 5);

  const step = () => {
    const t = Math.min((performance.now() - startT) / duration, 1);
    window.scrollTo(0, startY + distance * ease(t));
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

export function stopSmoothScroll() {
  if (!active) return;
  active = false;
  window.removeEventListener('wheel', onWheel);
  document.removeEventListener('click', onAnchorClick);
  clearTimeout(glideTimer);
  if (glideRaf) cancelAnimationFrame(glideRaf);
  gliding = false;
  recentEvents.length = 0;
}

// Auto-init on import
if (!window.__smoothScrollInit) {
  window.__smoothScrollInit = true;
  initSmoothScroll();
}
