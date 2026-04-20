/**
 * Smooth scroll using Lenis — tuned to match the feel of artechsoft.com.
 *
 * Measured reference: ~850ms settle time for a small wheel tick on
 * artechsoft.com, which corresponds to a Lenis `duration` of ~0.9s
 * with a standard exponential ease-out curve.
 *
 * - Disabled when user prefers reduced motion
 * - Disabled on touch devices (native momentum is better there)
 * - Intercepts anchor links and animates via lenis.scrollTo
 * - Exposes the instance on window.lenis for scroll-linked libraries
 */

const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const isTouchDevice = window.matchMedia?.('(hover: none) and (pointer: coarse)').matches;

let lenis = null;

export async function initSmoothScroll() {
  if (prefersReducedMotion || isTouchDevice) return null;

  try {
    const { default: Lenis } = await import('https://cdn.jsdelivr.net/npm/lenis@1.1.14/+esm');

    lenis = new Lenis({
      // Matches artechsoft.com's ~850ms measured feel
      duration: 0.9,
      // Exponential ease-out: fast initial motion, smooth settle
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    const raf = (time) => {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);

    window.lenis = lenis;

    // Intercept anchor links
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
