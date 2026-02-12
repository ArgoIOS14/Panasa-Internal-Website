import { createEl, setText } from '../utils/dom.js';
import { highlightWords } from '../utils/text.js';

export const renderCaseStudies = (data) => {
  setText('[data-case-pill]', data.pill);

  const titleEl = document.querySelector('[data-case-title]');
  if (titleEl) titleEl.innerHTML = highlightWords(data.title, 2);
  setText('[data-case-subtitle]', data.subtitle);

  const slidesContainer = document.querySelector('[data-case-slides]');
  const dotsContainer = document.querySelector('[data-case-dots]');
  if (!slidesContainer || !dotsContainer) return;

  slidesContainer.innerHTML = '';
  dotsContainer.innerHTML = '';

  data.slides.forEach((slide, index) => {
    const article = createEl('article', 'slide');
    const card = createEl('div', 'results-card');
    const left = createEl('div');

    const eyebrow = createEl('span', 'eyebrow');
    eyebrow.textContent = slide.eyebrow;

    const h3 = createEl('h3');
    h3.textContent = slide.title;

    const p = createEl('p');
    p.textContent = slide.text;

    const img = createEl('img', 'case-image');
    img.src = slide.image;
    img.alt = slide.title;

    const cta = createEl('a', 'btn btn-dark');
    cta.textContent = slide.cta.label;
    cta.href = slide.cta.href;

    left.append(eyebrow, h3, p, img, cta);

    const metrics = createEl('div', 'results-metrics');
    slide.metrics.forEach((metric) => {
      const box = createEl('div');
      const value = createEl('h4');
      value.textContent = metric.value;
      const label = createEl('span');
      label.textContent = metric.label;
      box.append(value, label);
      metrics.appendChild(box);
    });

    card.append(left, metrics);
    article.appendChild(card);
    slidesContainer.appendChild(article);

    const dot = createEl('button', index === 0 ? 'dot active' : 'dot');
    dot.setAttribute('data-slide', index.toString());
    dot.setAttribute('aria-label', `Slide ${index + 1}`);
    dotsContainer.appendChild(dot);
  });
};
