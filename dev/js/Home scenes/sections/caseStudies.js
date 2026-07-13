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
  if (titleEl) {
    const title = data.title || 'Proven Results';
    const emphasis = data.titleEmphasis || 'for Leading Platforms';
    titleEl.innerHTML = `${title} <span>${emphasis}</span>`;
  }
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

    left.append(eyebrow, h3);

    if (slide.date || slide.readTime) {
      const meta = createEl('div', 'results-meta');
      if (slide.date) {
        const date = createEl('span', 'results-meta-date');
        date.textContent = slide.date;
        meta.appendChild(date);
      }
      if (slide.date && slide.readTime) {
        const dot = createEl('span', 'results-meta-dot');
        dot.textContent = '•';
        meta.appendChild(dot);
      }
      if (slide.readTime) {
        const read = createEl('span', 'results-meta-read');
        read.textContent = slide.readTime;
        meta.appendChild(read);
      }
      left.appendChild(meta);
    }

    const cta = createEl('a', 'btn btn-dark results-cta');
    cta.textContent = slide.cta.label;
    const ctaHref = slide.cta.href || 'resources?filter=case-studies';
    cta.href = ctaHref;
    cta.addEventListener('click', (event) => {
      event.preventDefault();
      window.location.assign(ctaHref);
    });
    left.appendChild(cta);

    card.append(left);

    if (slide.image) {
      const visual = createEl('div', 'results-visual');
      const img = createEl('img');
      img.src = slide.image;
      img.alt = slide.title || '';
      img.loading = 'lazy';
      img.decoding = 'async';
      visual.appendChild(img);
      card.append(visual);
    }

    article.appendChild(card);
    slidesContainer.appendChild(article);

    const dot = createEl('button', index === 0 ? 'dot active' : 'dot');
    dot.setAttribute('data-slide', index.toString());
    dot.setAttribute('aria-label', `Slide ${index + 1}`);
    dotsContainer.appendChild(dot);
  });
};
