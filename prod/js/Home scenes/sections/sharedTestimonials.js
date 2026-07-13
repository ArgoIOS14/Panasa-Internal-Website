import { createEl, setText } from '../utils/dom.js';

const MOBILE_BREAKPOINT = '(max-width: 900px)';

const chunkCards = (cards, chunkSize) => {
  const slides = [];
  for (let index = 0; index < cards.length; index += chunkSize) {
    slides.push(cards.slice(index, index + chunkSize));
  }
  return slides;
};

export const renderSharedTestimonials = (data, selectors = {}) => {
  const {
    titleSelector = '[data-testimonials-title]',
    subtitleSelector = '[data-testimonials-subtitle]',
    trackSelector = '[data-testimonials-track]',
    prevSelector = '[data-testimonials-prev]',
    nextSelector = '[data-testimonials-next]',
    dotsSelector = '[data-testimonials-dots]',
  } = selectors;

  const titleEl = document.querySelector(titleSelector);
  if (titleEl && (data.title || data.titleEmphasis)) {
    titleEl.innerHTML = `${data.title || ''} <span>${data.titleEmphasis || ''}</span>`;
  }
  setText(subtitleSelector, data.subtitle);

  const track = document.querySelector(trackSelector);
  const prev = document.querySelector(prevSelector);
  const next = document.querySelector(nextSelector);
  const dots = document.querySelector(dotsSelector);
  if (!(track && prev && next && dots)) return;

  const media = window.matchMedia(MOBILE_BREAKPOINT);
  const cards = data.cards || [];
  let slides = [];
  let index = 0;
  let isDragging = false;
  let startX = 0;
  let deltaX = 0;
  let rafId = null;
  let pendingX = null;

  const settleTransition = 'transform var(--motion-duration-carousel, 620ms) var(--motion-ease-carousel, cubic-bezier(0.22, 1, 0.36, 1))';
  const hasCarousel = () => (media.matches ? cards.length > 1 : cards.length > 2);

  const chunkSize = () => {
    if (!hasCarousel()) return Math.max(cards.length, 1);
    return media.matches ? 1 : 2;
  };

  const updateDots = () => {
    Array.from(dots.children).forEach((dot, dotIndex) => {
      dot.classList.toggle('active', dotIndex === index);
      dot.setAttribute('aria-selected', String(dotIndex === index));
    });
  };

  const render = (animate = true) => {
    if (!hasCarousel()) {
      track.style.transition = 'none';
      track.style.transform = 'translate3d(0, 0, 0)';
      return;
    }
    track.style.transition = animate
      ? settleTransition
      : 'none';
    track.style.transform = `translate3d(-${index * 100}%, 0, 0)`;
    updateDots();
  };

  const goTo = (nextIndex, animate = true) => {
    if (!slides.length || !hasCarousel()) return;
    index = (nextIndex + slides.length) % slides.length;
    render(animate);
  };

  const buildSlides = () => {
    slides = chunkCards(cards, chunkSize());
    index = Math.min(index, Math.max(slides.length - 1, 0));

    track.innerHTML = '';
    dots.innerHTML = '';

    const showControls = hasCarousel();
    prev.style.display = showControls ? '' : 'none';
    next.style.display = showControls ? '' : 'none';
    dots.style.display = showControls ? '' : 'none';

    slides.forEach((group, slideIndex) => {
      const slide = createEl('article', 'split-testimonial-card');
      const columns = createEl('div', 'split-testimonial-columns');
      if (group.length === 1) columns.classList.add('is-single');

      group.forEach((item) => {
        const column = createEl('div', 'split-testimonial-column');
        const body = createEl('p');
        body.textContent = item.text;

        const person = createEl('div', 'split-testimonial-person');
        const personCopy = createEl('div');
        const name = createEl('strong');
        name.textContent = item.name;
        const role = createEl('span');
        role.textContent = item.role;
        personCopy.append(name, role);

        const logo = createEl('img');
        logo.src = item.logo;
        logo.alt = item.logoAlt || item.name;
        logo.loading = 'lazy';
        logo.decoding = 'async';

        person.append(personCopy, logo);
        column.append(body, person);
        columns.appendChild(column);
      });

      slide.appendChild(columns);
      track.appendChild(slide);

      if (showControls) {
        const dot = createEl('button', slideIndex === index ? 'split-testimonial-dot active' : 'split-testimonial-dot');
        dot.type = 'button';
        dot.setAttribute('aria-label', `Go to testimonial slide ${slideIndex + 1}`);
        dot.setAttribute('aria-selected', String(slideIndex === index));
        dot.addEventListener('click', () => goTo(slideIndex));
        dots.appendChild(dot);
      }
    });

    render(false);
  };

  prev.addEventListener('click', () => goTo(index - 1));
  next.addEventListener('click', () => goTo(index + 1));

  const viewport = track.parentElement;
  viewport?.addEventListener('pointerdown', (event) => {
    if (!hasCarousel()) return;
    if (event.target.closest('a, button')) return;
    isDragging = true;
    startX = event.clientX;
    deltaX = 0;
    track.setPointerCapture?.(event.pointerId);
    track.style.transition = 'none';
  });

  viewport?.addEventListener('pointermove', (event) => {
    if (!hasCarousel()) return;
    if (!isDragging) return;
    deltaX = event.clientX - startX;
    pendingX = deltaX;
    if (rafId) return;
    rafId = window.requestAnimationFrame(() => {
      track.style.transform = `translate3d(calc(-${index * 100}% + ${pendingX || 0}px), 0, 0)`;
      rafId = null;
    });
  });

  const endDrag = (event) => {
    if (!hasCarousel()) return;
    if (!isDragging) return;
    isDragging = false;
    track.releasePointerCapture?.(event.pointerId);
    if (rafId) {
      window.cancelAnimationFrame(rafId);
      rafId = null;
    }
    pendingX = null;

    const threshold = (viewport?.getBoundingClientRect().width || 0) * 0.18;
    if (Math.abs(deltaX) > threshold) {
      goTo(deltaX < 0 ? index + 1 : index - 1);
    } else {
      render();
    }
  };

  viewport?.addEventListener('pointerup', endDrag);
  viewport?.addEventListener('pointercancel', endDrag);
  viewport?.addEventListener('pointerleave', endDrag);

  media.addEventListener('change', buildSlides);
  window.addEventListener('resize', () => render(false));

  buildSlides();
};
