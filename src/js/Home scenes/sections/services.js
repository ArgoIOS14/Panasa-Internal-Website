import { createEl, setText } from '../utils/dom.js';
import { highlightWords } from '../utils/text.js';

const createFeatureSlide = (item, ctaLabel, visualLabel) => {
  const slide = createEl('article', 'services-slide');

  const copy = createEl('div', 'services-feature-copy');
  const pill = createEl('span', 'services-feature-pill');
  pill.textContent = item.eyebrow || item.title;

  const title = createEl('h3');
  title.textContent = item.title;

  const list = createEl('ul', 'services-feature-list');
  item.bullets.forEach((bullet) => {
    const li = createEl('li');
    li.textContent = bullet;
    list.appendChild(li);
  });

  const cta = createEl('a', 'services-feature-link');
  cta.href = '#contact';
  cta.textContent = ctaLabel;

  copy.append(pill, title, list, cta);

  const visualWrap = createEl('div', 'services-feature-visual-wrap');
  const visual = createEl('div', 'services-feature-visual');
  const glow = createEl('div', 'services-visual-glow');
  const label = createEl('span', 'services-visual-label');
  label.textContent = visualLabel || item.title;
  const icon = createEl('img', 'services-visual-icon');
  icon.src = item.icon;
  icon.alt = item.title;

  visual.append(glow, icon, label);
  visualWrap.appendChild(visual);

  slide.append(copy, visualWrap);
  return slide;
};

export const renderServices = (data) => {
  const topPill = document.querySelector('[data-services-pill]');
  if (topPill) {
    if (data.pill) {
      topPill.textContent = data.pill;
      topPill.style.display = '';
    } else {
      topPill.textContent = '';
      topPill.style.display = 'none';
    }
  }

  const titleEl = document.querySelector('[data-services-title]');
  if (titleEl) titleEl.innerHTML = highlightWords(data.title, 1);
  setText('[data-services-subtitle]', data.subtitle);

  const slides = document.querySelector('[data-services-slides]');
  const dots = document.querySelector('[data-services-dots]');
  if (!slides || !dots || !data.items?.length) return;

  slides.innerHTML = '';
  dots.innerHTML = '';

  data.items.forEach((item, index) => {
    slides.appendChild(
      createFeatureSlide(item, data.learnMoreLabel || 'Learn More +', data.visualLabel || item.title)
    );

    const dot = createEl('button', index === 0 ? 'services-dot active' : 'services-dot');
    dot.type = 'button';
    dot.setAttribute('aria-label', `Show ${item.title}`);
    dot.setAttribute('data-services-slide', index.toString());
    dots.appendChild(dot);
  });
};
