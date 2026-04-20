/**
 * Smooth scroll using Lenis with the default config — matches the
 * feel of lenis.dev (the library's official demo).
 *
 * - Disabled when user prefers reduced motion
 * - Disabled on touch devices (native momentum is better there)
 * - Intercepts anchor links (href="#...") and animates via Lenis
 * - Exposes the instance on window.lenis so scroll-linked libraries
 *   can sync with its RAF loop
 */

const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const isTouchDevice = window.matchMedia?.('(hover: none) and (pointer: coarse)').matches;

let lenis = null;

export async function initSmoothScroll() {
  if (prefersReducedMotion || isTouchDevice) return null;

  try {
    const { default: Lenis } = await import('https://cdn.jsdelivr.net/npm/lenis@1.1.14/+esm');

    // Default Lenis config — identical to lenis.dev:
    //   duration: 1.2 seconds per scroll
    //   easing:   exponential ease-out (fast start, smooth settle)
    //   smoothWheel: true
    //   wheelMultiplier: 1
    //   touchMultiplier: 2
    lenis = new Lenis({
      duration: 1.2,
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

    // Expose globally for other scroll-linked libraries
    window.lenis = lenis;

    // Intercept in-page anchor links and animate via Lenis
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;
      const href = link.getAttribute('href');
      if (!href || href === '#' || href.length < 2) return;
      if (link.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey) return;

      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();
      lenis.scrollTo(target, { offset: -20 });
      if (history.replaceState) history.replaceState(null, '', href);
    });

    return lenis;
  } catch (err) {
    console.warn('Lenis failed to load, falling back to native scroll', err);
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

// Auto-initialize on import
if (!window.__smoothScrollInit) {
  window.__smoothScrollInit = true;
  initSmoothScroll();
}
