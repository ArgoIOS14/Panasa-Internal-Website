import { createEl, setText } from '../utils/dom.js';
import { highlightWords } from '../utils/text.js';

export const renderServices = (data) => {
  setText('[data-services-pill]', data.pill);
  const titleEl = document.querySelector('[data-services-title]');
  if (titleEl) titleEl.innerHTML = highlightWords(data.title, 1);
  setText('[data-services-subtitle]', data.subtitle);

  const grid = document.querySelector('[data-services-grid]');
  if (!grid) return;
  grid.innerHTML = '';

  data.items.forEach((item) => {
    const card = createEl('article', 'service-card');
    const img = createEl('img');
    img.src = item.icon;
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

    card.append(img, h3, p, ul);
    grid.appendChild(card);
  });
};
