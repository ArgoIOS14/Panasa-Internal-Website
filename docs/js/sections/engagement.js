import { createEl, setText } from '../utils/dom.js';
import { highlightWords } from '../utils/text.js';

export const renderEngagement = (data) => {
  setText('[data-engagement-pill]', data.pill);

  const titleEl = document.querySelector('[data-engagement-title]');
  if (titleEl) titleEl.innerHTML = highlightWords(data.title, 1);

  setText('[data-engagement-subtitle]', data.subtitle);
  setText('[data-engagement-note]', data.note);

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
