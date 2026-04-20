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
      // Responsive-start, smooth-glide-end profile.
      // IMPORTANT: lerp must be explicitly false — Lenis 1.1+ defaults to
      // lerp: 0.1 and when both lerp and duration are set, lerp wins.
      lerp: false,
      // Duration 1.2s: long enough for a smooth tail, short enough that
      // each wheel tick makes visible motion in the first few frames.
      duration: 1.2,
      // easeOutQuint: front-loads ~83% of motion into the first 300ms,
      // then the remaining ~17% glides over the last 900ms.
      //   t=0.1 → 41% done   (feels instant)
      //   t=0.3 → 83% done   (big visible scroll in 300ms)
      //   t=0.5 → 97% done
      //   t=1.0 → 100%       (smooth long glide to rest)
      easing: (t) => 1 - Math.pow(1 - t, 5),
      smoothWheel: true,
      wheelMultiplier: 1,
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
