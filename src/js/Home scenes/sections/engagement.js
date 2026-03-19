import { createEl, setText } from '../utils/dom.js';

export const renderEngagement = (data) => {
  setText('[data-engagement-pill]', data.pill);

  const titleEl = document.querySelector('[data-engagement-title]');
  if (titleEl) titleEl.innerHTML = 'Engagement Models <span>Built for Your Growth</span>';

  setText('[data-engagement-subtitle]', data.subtitle);
  setText('[data-engagement-note]', data.note);

  const filters = document.querySelector('[data-engagement-filters]');
  if (filters) {
    filters.innerHTML = '';
    (data.filters || []).forEach((filter, index) => {
      const button = createEl(`button`, `engagement-filter${index === 0 ? ' active' : ''}`);
      button.type = 'button';
      button.textContent = filter;
      filters.appendChild(button);
    });
  }

  const grid = document.querySelector('[data-engagement-grid]');
  if (!grid) return;
  grid.innerHTML = '';

  data.items.forEach((item) => {
    const card = createEl('article', `engagement-card${item.variant === 'featured' ? ' featured' : ''}`);

    const img = createEl('img', 'engagement-image');
    img.src = item.image;
    img.alt = item.title;

    const h3 = createEl('h3');
    h3.textContent = item.title;

    const p = createEl('p');
    p.textContent = item.text;

    const ul = createEl('ul');
    item.bullets.forEach((bullet) => {
      const li = createEl('li');
      li.textContent = bullet;
      ul.appendChild(li);
    });

    const btn = createEl('button', 'btn btn-dark');
    btn.textContent = item.cta;

    card.append(img, h3, p, ul, btn);
    grid.appendChild(card);
  });
};
