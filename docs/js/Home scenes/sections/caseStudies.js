import { createEl, setText } from '../utils/dom.js';

export const renderCaseStudies = (data) => {
  const pillEl = document.querySelector('[data-case-pill]');
  if (pillEl) {
    if (data.pill) {
      pillEl.textContent = data.pill;
      pillEl.style.display = '';
    } else {
      pillEl.textContent = '';
      pillEl.style.display = 'none';
    }
  }

  const titleEl = document.querySelector('[data-case-title]');
  if (titleEl) titleEl.innerHTML = 'Proven Results <span>for Leading Platforms</span>';
  setText('[data-case-subtitle]', data.subtitle);

  const slidesContainer = document.querySelector('[data-case-slides]');
  const dotsContainer = document.querySelector('[data-case-dots]');
  if (!slidesContainer || !dotsContainer) return;

  slidesContainer.innerHTML = '';
  dotsContainer.innerHTML = '';

  data.slides.forEach((slide, index) => {
    const article = createEl('article', 'slide');
    const card = createEl('div', 'results-card');
    const left = createEl('div', 'results-copy');

    const eyebrow = createEl('span', 'eyebrow');
    eyebrow.textContent = slide.eyebrow;

    const h3 = createEl('h3');
    h3.textContent = slide.title;

    const p = createEl('p');
    p.textContent = slide.text;

    const cta = createEl('a', 'btn btn-dark results-cta');
    cta.textContent = slide.cta.label;
    cta.href = 'contact.html';
    cta.addEventListener('click', (event) => {
      event.preventDefault();
      window.location.assign('contact.html');
    });

    left.append(eyebrow, h3, p, cta);

    card.append(left);
    article.appendChild(card);
    slidesContainer.appendChild(article);

    const dot = createEl('button', index === 0 ? 'dot active' : 'dot');
    dot.setAttribute('data-slide', index.toString());
    dot.setAttribute('aria-label', `Slide ${index + 1}`);
    dotsContainer.appendChild(dot);
  });
};
