/**
 * Smooth scroll using Lenis — matched byte-for-byte to artechsoft.com.
 *
 * Config pulled directly from their live Lenis instance:
 *   lerp:            false     (duration mode, NOT lerp)
 *   duration:        2.5       (2.5-second animation per scroll target)
 *   easing:          exp ease-out (fast initial, long smooth tail)
 *   wheelMultiplier: 0.8
 *   touchMultiplier: 1.5
 *
 * Why lerp must be explicitly false:
 * Lenis 1.1+ defaults lerp to 0.1 and, when both lerp and duration are
 * set, lerp wins. Without this explicit false, duration is silently
 * ignored and scroll uses lerp interpolation instead.
 *
 * Skipped for touch devices and reduced-motion preference.
 */

const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const isTouchDevice = window.matchMedia?.('(hover: none) and (pointer: coarse)').matches;

let lenis = null;

export async function initSmoothScroll() {
  if (prefersReducedMotion || isTouchDevice) return null;

  try {
    const { default: Lenis } = await import('https://cdn.jsdelivr.net/npm/lenis@1.1.14/+esm');

    lenis = new Lenis({
      lerp: false,
      duration: 2.5,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 0.8,
      touchMultiplier: 1.5,
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
