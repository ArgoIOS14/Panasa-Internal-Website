const initSwipeCarousel = ({
  rootSelector,
  trackSelector,
  slideSelector,
  dotSelector,
  activeClass = 'active',
  autoplayDelay = 4500,
  pauseDelay = 3200,
  stableSnap = false,
}) => {
  const carousel = document.querySelector(rootSelector);
  const track = carousel?.querySelector(trackSelector);
  if (!carousel || !track) return;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const slides = Array.from(track.querySelectorAll(slideSelector));
  const dots = Array.from(carousel.parentElement?.querySelectorAll(dotSelector) || carousel.querySelectorAll(dotSelector));
  if (!slides.length) return;

  let index = 0;
  let startX = 0;
  let currentX = 0;
  let deltaX = 0;
  let isDragging = false;
  let isPointerDown = false;
  let timerId = null;
  let resumeTimer = null;
  let pauseUntil = 0;
  let carouselWidth = 0;
  let rafId = null;
  let pendingTransform = null;

  const settleTransition = 'transform var(--motion-duration-carousel, 620ms) var(--motion-ease-carousel, cubic-bezier(0.22, 1, 0.36, 1))';

  const measure = () => {
    carouselWidth = carousel.getBoundingClientRect().width;
  };

  const getWidth = () => {
    if (!carouselWidth) measure();
    return carouselWidth;
  };

  const flushTransform = (transformValue, animate = true) => {
    track.style.transition = animate && !reducedMotion.matches ? settleTransition : 'none';
    track.style.transform = transformValue;
  };

  const setTransform = (transformValue, animate = true) => {
    if (!animate) {
      pendingTransform = transformValue;
      if (rafId) return;
      rafId = window.requestAnimationFrame(() => {
        if (pendingTransform == null) return;
        flushTransform(pendingTransform, false);
        pendingTransform = null;
        rafId = null;
      });
      return;
    }
    if (rafId) {
      window.cancelAnimationFrame(rafId);
      rafId = null;
      pendingTransform = null;
    }
    flushTransform(transformValue, true);
  };

  const setTransformForIndex = (targetIndex, animate = true) => {
    if (stableSnap) {
      setTransform(`translate3d(calc(-${targetIndex * 100}% + 0px), 0, 0)`, animate);
      return;
    }
    setTransform(`translate3d(${-targetIndex * getWidth()}px, 0, 0)`, animate);
  };

  const goTo = (nextIndex, animate = true) => {
    index = Math.max(0, Math.min(nextIndex, slides.length - 1));
    dots.forEach((dot, i) => dot.classList.toggle(activeClass, i === index));
    setTransformForIndex(index, animate);
  };

  const goNext = () => goTo((index + 1) % slides.length);
  const goPrev = () => goTo((index - 1 + slides.length) % slides.length);

  const onTrackTransitionEnd = (event) => {
    if (!stableSnap) return;
    if (event.propertyName !== 'transform') return;
    // Hard snap after animated transitions to avoid sub-pixel drift on narrow/mobile viewports.
    setTransformForIndex(index, false);
  };

  const startAuto = () => {
    if (reducedMotion.matches || autoplayDelay <= 0 || isDragging || timerId) return;
    const delay = pauseUntil - Date.now();
    if (delay > 0) {
      resumeTimer = setTimeout(startAuto, delay);
      return;
    }
    timerId = setInterval(goNext, autoplayDelay);
  };

  const stopAuto = () => {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
    if (resumeTimer) {
      clearTimeout(resumeTimer);
      resumeTimer = null;
    }
  };

  const pauseAuto = (ms = pauseDelay) => {
    pauseUntil = Date.now() + ms;
    stopAuto();
    startAuto();
  };

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      goTo(i);
      pauseAuto();
    });
  });

  const onPointerDown = (event) => {
    if (event.target.closest('a, button, input, textarea, select, label')) return;
    isPointerDown = true;
    isDragging = true;
    startX = event.clientX;
    currentX = startX;
    deltaX = 0;
    pauseAuto();
    carousel.setPointerCapture?.(event.pointerId);
    if (stableSnap) {
      setTransform(`translate3d(calc(-${index * 100}% + ${deltaX}px), 0, 0)`, false);
    } else {
      setTransform(`translate3d(${-index * getWidth() + deltaX}px, 0, 0)`, false);
    }
  };

  const onPointerMove = (event) => {
    if (!isDragging || !isPointerDown) return;
    currentX = event.clientX;
    deltaX = currentX - startX;
    if (stableSnap) {
      setTransform(`translate3d(calc(-${index * 100}% + ${deltaX}px), 0, 0)`, false);
    } else {
      setTransform(`translate3d(${-index * getWidth() + deltaX}px, 0, 0)`, false);
    }
  };

  const onPointerUp = (event) => {
    if (!isDragging) return;
    isPointerDown = false;
    isDragging = false;
    carousel.releasePointerCapture?.(event.pointerId);
    const threshold = getWidth() * 0.2;
    if (Math.abs(deltaX) > threshold) {
      if (deltaX < 0) goNext();
      else goPrev();
    } else {
      goTo(index);
    }
    pauseAuto();
  };

  carousel.addEventListener('pointerdown', onPointerDown);
  carousel.addEventListener('pointermove', onPointerMove);
  carousel.addEventListener('pointerup', onPointerUp);
  carousel.addEventListener('pointercancel', onPointerUp);
  carousel.addEventListener('pointerleave', onPointerUp);
  if (stableSnap) {
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    track.addEventListener('transitionend', onTrackTransitionEnd);
  }
  carousel.addEventListener('mouseenter', stopAuto);
  carousel.addEventListener('mouseleave', startAuto);
  const onResize = () => {
    measure();
    goTo(index, false);
  };
  window.addEventListener('resize', onResize);

  let resizeObserver = null;
  if (stableSnap && 'ResizeObserver' in window) {
    resizeObserver = new ResizeObserver(() => {
      measure();
      goTo(index, false);
    });
    resizeObserver.observe(carousel);
  }

  const onMotionChange = () => {
    stopAuto();
    if (!reducedMotion.matches) startAuto();
  };
  reducedMotion.addEventListener('change', onMotionChange);

  measure();
  goTo(0, false);
  startAuto();

  return () => {
    stopAuto();
    carousel.removeEventListener('pointerdown', onPointerDown);
    carousel.removeEventListener('pointermove', onPointerMove);
    carousel.removeEventListener('pointerup', onPointerUp);
    carousel.removeEventListener('pointercancel', onPointerUp);
    carousel.removeEventListener('pointerleave', onPointerUp);
    if (stableSnap) {
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      track.removeEventListener('transitionend', onTrackTransitionEnd);
    }
    carousel.removeEventListener('mouseenter', stopAuto);
    carousel.removeEventListener('mouseleave', startAuto);
    window.removeEventListener('resize', onResize);
    if (resizeObserver) resizeObserver.disconnect();
    reducedMotion.removeEventListener('change', onMotionChange);
  };
};

export const initCarousel = () => {
  initSwipeCarousel({
    rootSelector: '[data-carousel]',
    trackSelector: '.slides',
    slideSelector: '.slide',
    dotSelector: '.dot',
    autoplayDelay: 4500,
  });

  initSwipeCarousel({
    rootSelector: '[data-services-carousel]',
    trackSelector: '.services-slides',
    slideSelector: '.services-slide',
    dotSelector: '.services-dot',
    autoplayDelay: 4500,
    stableSnap: true,
  });
};
