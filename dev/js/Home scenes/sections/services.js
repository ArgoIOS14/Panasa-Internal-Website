import { createEl, setText } from '../utils/dom.js';

const resolveServiceHrefFromHeading = (heading, fallbackHref) => {
  // CMS-provided href always wins when present/non-empty. Title-based
  // matching is only a fallback for the default cards (or any card that
  // hasn't had a href set yet), so existing default hrefs stay unchanged.
  if (fallbackHref && String(fallbackHref).trim()) {
    return String(fallbackHref).trim();
  }

  const normalized = (heading || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

  if (normalized.includes('ai accelerated fintech engineering')) {
    return 'ai-accelerated-fintech-engineering';
  }
  if (normalized.includes('ai governance')) {
    return 'ai-governance';
  }
  if (normalized.includes('intelligent operations')) {
    return 'intelligent-operations';
  }
  if (normalized.includes('legacy modernisation') || normalized.includes('legacy modernization')) {
    return 'ai-powered-legacy-modernisation';
  }

  return 'ai-accelerated-fintech-engineering';
};

const createFeatureSlide = (item, ctaLabel) => {
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
  cta.href = resolveServiceHrefFromHeading(item.title, item.href);
  cta.textContent = ctaLabel;

  copy.append(pill, title, list, cta);

  const visualWrap = createEl('div', 'services-feature-visual-wrap');
  const visual = createEl('div', 'services-feature-visual');
  const icon = createEl('img', 'services-visual-icon');
  icon.src = item.icon;
  icon.alt = item.title;
  icon.loading = 'lazy';
  icon.decoding = 'async';

  visual.appendChild(icon);
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
  if (titleEl) {
    const words = (data.title || '').trim().split(/\s+/).filter(Boolean);
    const head = words.slice(0, 1).join(' ');
    const tail = words.slice(1).join(' ');
    titleEl.innerHTML = tail ? `${head} <span>${tail}</span>` : head;
  }
  setText('[data-services-subtitle]', data.subtitle);

  const slides = document.querySelector('[data-services-slides]');
  const dots = document.querySelector('[data-services-dots]');
  if (!slides || !dots || !data.items?.length) return;

  slides.innerHTML = '';
  dots.innerHTML = '';

  data.items.forEach((item, index) => {
    slides.appendChild(
      createFeatureSlide(item, data.learnMoreLabel || 'Learn More +')
    );

    const dot = createEl('button', index === 0 ? 'services-dot active' : 'services-dot');
    dot.type = 'button';
    dot.setAttribute('aria-label', `Show ${item.title}`);
    dot.setAttribute('data-services-slide', index.toString());
    dots.appendChild(dot);
  });
};
