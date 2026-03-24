let activeObserver = null;

export const initScrollAnimations = () => {
  if (activeObserver) {
    activeObserver.disconnect();
    activeObserver = null;
  }

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const elements = Array.from(document.querySelectorAll('[data-animate]'));
  if (!elements.length) return;

  const variantStyles = {
    instant: {
      y: '4px',
      scale: '1',
      blur: '0px',
      duration: 'var(--motion-duration-reveal-fast)',
    },
    heading: {
      y: '8px',
      scale: '0.999',
      blur: '0px',
      duration: 'var(--motion-duration-reveal)',
    },
    media: {
      y: '6px',
      scale: '0.998',
      blur: '0px',
      duration: 'var(--motion-duration-reveal)',
    },
    card: {
      y: '10px',
      scale: '0.998',
      blur: '0px',
      duration: 'var(--motion-duration-reveal)',
    },
    soft: {
      y: '8px',
      scale: '0.999',
      blur: '0px',
      duration: 'var(--motion-duration-reveal)',
    },
  };

  const staggerParentSelectors = [
    '.feature-grid',
    '.engagement-grid',
    '.about-stats',
    '.role-list',
    '.office-grid',
    '.challenge-grid',
    '.domains-grid',
    '.roadmap-grid',
    '.fit-cards',
    '.fit-columns',
    '.deliverables-cards',
    '.engineering-build-cards',
    '.engineering-roadmap-grid',
    '.hero-stats',
    '.footer-links',
  ].join(', ');

  const inferVariant = (element) => {
    if (element.dataset.animateVariant) return element.dataset.animateVariant;

    if (
      element.matches(
        '.site-header, .footer-cta, .footer-card, .nav, .nav-mobile-head'
      )
    ) {
      return 'instant';
    }

    if (
      element.matches(
        'h1, h2, .section-head, .section-title, .section-title-split, .roles-header, .locations-header'
      )
    ) {
      return 'heading';
    }

    if (
      element.matches(
        '.hero-copy, .about-hero-copy, .service-hero-copy, .contact-hero-copy, .team-photo, .about-stats, .trusted-logos-shell, .hero-stats, .presence-map-shell, .process-visual-card, .services-feature-visual, .results-card'
      )
    ) {
      return 'media';
    }

    if (
      element.matches(
        '.feature-card, .engagement-card, .deliverable-card, .fit-card, .role-card, .office-card, .contact-card, .hero-stat-card, .stat-card, .challenge-card, .domain-card, .roadmap-card, .engineering-build-card, .engineering-roadmap-card'
      )
    ) {
      return 'card';
    }

    return 'soft';
  };

  const applyVariantStyles = (element) => {
    const variant = inferVariant(element);
    const styles = variantStyles[variant] || variantStyles.soft;
    element.style.setProperty('--motion-y-start', styles.y);
    element.style.setProperty('--motion-scale-start', styles.scale);
    element.style.setProperty('--motion-blur-start', styles.blur);
    element.style.setProperty('--motion-duration', styles.duration);
    element.dataset.motionVariant = variant;
  };

  const applyStagger = (element) => {
    if (element.dataset.animateOrder) {
      const order = Number.parseInt(element.dataset.animateOrder, 10) || 0;
      element.style.setProperty('--motion-delay', `${Math.min(order, 6) * 30}ms`);
      return;
    }

    const staggerParent = element.closest(staggerParentSelectors);
    if (!staggerParent) return;

    const siblings = Array.from(staggerParent.querySelectorAll(':scope > [data-animate]'));
    const index = siblings.indexOf(element);
    if (index >= 0) {
      element.style.setProperty('--motion-delay', `${Math.min(index, 6) * 30}ms`);
    }
  };

  const primeElements = () => {
    elements.forEach((element) => {
      applyVariantStyles(element);
      applyStagger(element);
      if (reducedMotion.matches) {
        element.classList.add('in-view');
        element.style.setProperty('--motion-delay', '0ms');
      }
    });
  };

  primeElements();

  if (reducedMotion.matches) return;

  let rafPending = false;
  let pendingEntries = [];

  const observer = new IntersectionObserver(
    (entries) => {
      pendingEntries.push(...entries);
      if (!rafPending) {
        rafPending = true;
        requestAnimationFrame(() => {
          const batch = pendingEntries.splice(0);
          batch.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('in-view');
              if (entry.target.dataset.animateRepeat !== 'true') {
                observer.unobserve(entry.target);
              }
            } else if (entry.target.dataset.animateRepeat === 'true') {
              entry.target.classList.remove('in-view');
            }
          });
          rafPending = false;
        });
      }
    },
    {
      threshold: 0.01,
      rootMargin: '0px 0px 120px 0px',
    }
  );

  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  const isInitiallyVisible = (element) => {
    const rect = element.getBoundingClientRect();
    return rect.bottom > 0 && rect.top < viewportHeight * 0.92;
  };

  elements.forEach((el) => {
    observer.observe(el);
    if (isInitiallyVisible(el)) {
      el.classList.add('in-view');
      if (el.dataset.animateRepeat !== 'true') {
        observer.unobserve(el);
      }
    }
  });
  activeObserver = observer;
};
