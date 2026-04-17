/**
 * Lenis smooth scroll initialization.
 *
 * - Disabled entirely when the user prefers reduced motion
 * - Disabled on touch devices (native momentum is better there)
 * - Intercepts anchor links (href="#...") and scrolls via Lenis
 * - Exposes the instance on window.lenis so scroll libraries
 *   (ScrollTrigger, scroll animations) can sync with its RAF loop
 */

const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const isTouchDevice = window.matchMedia?.('(hover: none) and (pointer: coarse)').matches;

let lenis = null;

export async function initSmoothScroll() {
  // Respect user preference — fall back to native scroll
  if (prefersReducedMotion || isTouchDevice) return null;

  try {
    const { default: Lenis } = await import('https://cdn.jsdelivr.net/npm/lenis@1.1.14/+esm');

    lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    // Drive Lenis via rAF
    const raf = (time) => {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);

    // Expose globally for other libraries to hook into
    window.lenis = lenis;

    // Intercept in-page anchor links so they animate via Lenis
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;
      const href = link.getAttribute('href');
      if (!href || href === '#' || href.length < 2) return;
      // Ignore links that open in new tab / have modifier keys
      if (link.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey) return;

      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();
      lenis.scrollTo(target, { offset: -20 });
      // Update URL hash without triggering native scroll
      if (history.replaceState) history.replaceState(null, '', href);
    });

    return lenis;
  } catch (err) {
    console.warn('Lenis failed to load, using native scroll', err);
    return null;
  }
}

export function getLenis() {
  return lenis;
}

export function stopSmoothScroll() {
  if (lenis) {
    lenis.destroy();
    lenis = null;
    window.lenis = null;
  }
}

// Auto-initialize on import — page scripts just need
// `import './smooth-scroll.js';` (side-effect import).
// Guarded so multiple imports don't double-init.
if (!window.__lenisInitAttempted) {
  window.__lenisInitAttempted = true;
  initSmoothScroll();
}
