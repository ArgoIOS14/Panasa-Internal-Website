import { createEl, setText } from '../utils/dom.js';

const chunkCards = (cards) => {
  const slides = [];
  for (let index = 0; index < cards.length; index += 2) {
    slides.push(cards.slice(index, index + 2));
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
  } = selectors;

  const titleEl = document.querySelector(titleSelector);
  if (titleEl) titleEl.innerHTML = 'Trusted by <span>Fintech Leaders</span>';
  setText(subtitleSelector, data.subtitle);

  const track = document.querySelector(trackSelector);
  const prev = document.querySelector(prevSelector);
  const next = document.querySelector(nextSelector);
  if (!(track && prev && next)) return;

  track.innerHTML = '';

  const slides = chunkCards(data.cards || []);
  slides.forEach((pair) => {
    const slide = createEl('article', 'split-testimonial-card');
    const columns = createEl('div', 'split-testimonial-columns');

    pair.forEach((item) => {
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

      person.append(personCopy, logo);
      column.append(body, person);
      columns.appendChild(column);
    });

    slide.appendChild(columns);
    track.appendChild(slide);
  });

  let index = 0;
  const render = () => {
    track.style.transform = `translateX(-${index * 100}%)`;
  };

  prev.onclick = () => {
    index = (index - 1 + slides.length) % slides.length;
    render();
  };

  next.onclick = () => {
    index = (index + 1) % slides.length;
    render();
  };

  render();
};
