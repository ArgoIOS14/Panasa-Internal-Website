const initSwipeCarousel = ({
  rootSelector,
  trackSelector,
  slideSelector,
  dotSelector,
  activeClass = 'active',
  autoplayDelay = 4500,
  pauseDelay = 3200,
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
  let slideWidth = 0;
  let rafId = null;
  let pendingTranslate = null;

  const settleTransition = 'transform var(--motion-duration-carousel, 620ms) var(--motion-ease-carousel, cubic-bezier(0.22, 1, 0.36, 1))';

  const measure = () => {
    carouselWidth = carousel.getBoundingClientRect().width;
    slideWidth = slides[0]?.getBoundingClientRect().width || carouselWidth;
  };

  const getWidth = () => {
    if (!carouselWidth) measure();
    return slideWidth || carouselWidth;
  };

  const flushTranslate = (value, animate = true) => {
    track.style.transition = animate && !reducedMotion.matches ? settleTransition : 'none';
    track.style.transform = `translate3d(${value}px, 0, 0)`;
  };

  const setTranslate = (value, animate = true) => {
    if (!animate) {
      pendingTranslate = value;
      if (rafId) return;
      rafId = window.requestAnimationFrame(() => {
        if (pendingTranslate == null) return;
        flushTranslate(pendingTranslate, false);
        pendingTranslate = null;
        rafId = null;
      });
      return;
    }
    if (rafId) {
      window.cancelAnimationFrame(rafId);
      rafId = null;
      pendingTranslate = null;
    }
    flushTranslate(value, true);
  };

  const goTo = (nextIndex, animate = true) => {
    index = Math.max(0, Math.min(nextIndex, slides.length - 1));
    dots.forEach((dot, i) => dot.classList.toggle(activeClass, i === index));
    setTranslate(-index * getWidth(), animate);
  };

  const goNext = () => goTo((index + 1) % slides.length);
  const goPrev = () => goTo((index - 1 + slides.length) % slides.length);

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
    track.setPointerCapture?.(event.pointerId);
    setTranslate(-index * getWidth() + deltaX, false);
  };

  const onPointerMove = (event) => {
    if (!isDragging || !isPointerDown) return;
    currentX = event.clientX;
    deltaX = currentX - startX;
    setTranslate(-index * getWidth() + deltaX, false);
  };

  const onPointerUp = (event) => {
    if (!isDragging) return;
    isPointerDown = false;
    isDragging = false;
    track.releasePointerCapture?.(event.pointerId);
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
  carousel.addEventListener('mouseenter', stopAuto);
  carousel.addEventListener('mouseleave', startAuto);
  window.addEventListener('resize', () => {
    measure();
    goTo(index, false);
  });
  reducedMotion.addEventListener('change', () => {
    stopAuto();
    if (!reducedMotion.matches) startAuto();
  });

  measure();
  goTo(0, false);
  startAuto();
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
  });
};
