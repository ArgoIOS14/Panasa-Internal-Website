import { createEl, setText } from '../utils/dom.js';

export const renderEngagement = (data) => {
  const pillEl = document.querySelector('[data-engagement-pill]');
  if (pillEl) {
    if (data.pill) {
      pillEl.textContent = data.pill;
      pillEl.style.display = '';
    } else {
      pillEl.textContent = '';
      pillEl.style.display = 'none';
    }
  }

  const titleEl = document.querySelector('[data-engagement-title]');
  if (titleEl) titleEl.innerHTML = 'Engagement Models <span>Built for Your Growth</span>';

  setText('[data-engagement-subtitle]', data.subtitle);
  setText('[data-engagement-note]', data.note);

  const grid = document.querySelector('[data-engagement-grid]');
  const filters = document.querySelector('[data-engagement-filters]');
  if (!grid || !filters) return;

  const renderCards = (items) => {
    grid.innerHTML = '';
    items.forEach((item) => {
      const card = createEl('article', `engagement-card${item.variant === 'featured' ? ' featured' : ''}`);

      const img = createEl('img', 'engagement-image');
      img.src = item.image;
      img.alt = item.title;

      const h3 = createEl('h3');
      h3.textContent = item.title;

      const p = createEl('p');
      p.textContent = item.text;

      const includes = createEl('div', 'engagement-includes');
      includes.textContent = 'Includes:';

      const ul = createEl('ul');
      item.bullets.forEach((bullet) => {
        const li = createEl('li');
        li.textContent = bullet;
        ul.appendChild(li);
      });

      const btn = createEl('button', 'btn btn-dark');
      btn.textContent = item.cta;

      card.append(img, h3, p, includes, ul, btn);
      grid.appendChild(card);
    });
  };

  const filterMap = {
    'Engagement Models': data.items || [],
    'Growth Packages': data.growthPackages || [],
  };

  const setActiveFilter = (label) => {
    filters.querySelectorAll('.engagement-filter').forEach((button) => {
      button.classList.toggle('active', button.textContent === label);
    });
    renderCards(filterMap[label] || data.items || []);
  };

  filters.innerHTML = '';
  (data.filters || []).forEach((filter) => {
    const button = createEl('button', `engagement-filter${filter === (data.activeFilter || data.filters?.[0]) ? ' active' : ''}`);
    button.type = 'button';
    button.textContent = filter;
    button.addEventListener('click', () => setActiveFilter(filter));
    filters.appendChild(button);
  });

  setActiveFilter(data.activeFilter || data.filters?.[0] || 'Engagement Models');
};
