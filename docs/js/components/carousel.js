export const initCarousel = () => {
  const carousel = document.querySelector('[data-carousel]');
  const track = carousel?.querySelector('.slides');
  if (!carousel || !track) return;

  const slides = Array.from(track.children);
  const dots = Array.from(carousel.querySelectorAll('.dot'));
  if (!slides.length) return;

  let index = 0;
  let startX = 0;
  let currentX = 0;
  let deltaX = 0;
  let isDragging = false;
  let timerId = null;
  let resumeTimer = null;
  let pauseUntil = 0;

  const getWidth = () => carousel.getBoundingClientRect().width;

  const setTranslate = (value, animate = true) => {
    track.style.transition = animate ? 'transform 0.5s ease' : 'none';
    track.style.transform = `translateX(${value}px)`;
  };

  const goTo = (nextIndex, animate = true) => {
    index = Math.max(0, Math.min(nextIndex, slides.length - 1));
    dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
    const offset = -index * getWidth();
    setTranslate(offset, animate);
  };

  const goNext = () => goTo((index + 1) % slides.length);
  const goPrev = () => goTo((index - 1 + slides.length) % slides.length);

  const startAuto = () => {
    const delay = pauseUntil - Date.now();
    if (delay > 0) {
      resumeTimer = setTimeout(startAuto, delay);
      return;
    }
    timerId = setInterval(goNext, 3500);
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

  const pauseAuto = (ms = 3000) => {
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
    isDragging = true;
    startX = event.clientX;
    currentX = startX;
    deltaX = 0;
    pauseAuto();
    track.setPointerCapture?.(event.pointerId);
    setTranslate(-index * getWidth(), false);
  };

  const onPointerMove = (event) => {
    if (!isDragging) return;
    currentX = event.clientX;
    deltaX = currentX - startX;
    const offset = -index * getWidth() + deltaX;
    setTranslate(offset, false);
  };

  const onPointerUp = (event) => {
    if (!isDragging) return;
    isDragging = false;
    track.releasePointerCapture?.(event.pointerId);
    const threshold = getWidth() * 0.2;
    if (Math.abs(deltaX) > threshold) {
      if (deltaX < 0) {
        goNext();
      } else {
        goPrev();
      }
    } else {
      goTo(index);
    }
    pauseAuto();
  };

  carousel.addEventListener('pointerdown', onPointerDown);
  carousel.addEventListener('pointermove', onPointerMove);
  carousel.addEventListener('pointerup', onPointerUp);
  carousel.addEventListener('pointerleave', onPointerUp);
  carousel.addEventListener('mouseenter', stopAuto);
  carousel.addEventListener('mouseleave', startAuto);
  window.addEventListener('resize', () => goTo(index, false));

  goTo(0, false);
  startAuto();
};
