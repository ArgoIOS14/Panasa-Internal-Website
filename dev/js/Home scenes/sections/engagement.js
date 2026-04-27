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
  if (titleEl) {
    const title = data.title || '';
    const highlight = 'Built for Your Growth';
    if (title.endsWith(highlight)) {
      const prefix = title.slice(0, -highlight.length).trimEnd();
      titleEl.innerHTML = `${prefix} <span>${highlight}</span>`;
    } else {
      titleEl.textContent = title;
    }
  }

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
      img.loading = 'lazy';
      img.decoding = 'async';

      const h3 = createEl('h3');
      h3.textContent = item.title;

      const p = createEl('p');
      p.textContent = item.text;

      let suited;
      if (item.bestSuitedFor) {
        suited = createEl('p', 'engagement-best-fit');
        suited.innerHTML = `Best suited for -> <span>${item.bestSuitedFor}</span>`;
      }

      const includes = createEl('div', 'engagement-includes');
      includes.textContent = 'Includes:';

      const ul = createEl('ul');
      item.bullets.forEach((bullet) => {
        const li = createEl('li');
        li.textContent = bullet;
        ul.appendChild(li);
      });

      let outcome;
      if (item.outcome) {
        outcome = createEl('p', 'engagement-outcome');
        outcome.innerHTML = `<strong>Outcome:</strong> ${item.outcome}`;
      }

      const btn = createEl('a', 'btn btn-dark');
      btn.textContent = item.cta;
      btn.href = 'contact';

      card.append(img, h3, p);
      if (suited) card.appendChild(suited);
      card.append(includes, ul);
      if (outcome) card.appendChild(outcome);
      card.appendChild(btn);
      grid.appendChild(card);
    });
  };

  const filterMap = {
    'Engagement Models': data.items || [],
    'Growth Packages': data.growthPackages || [],
  };
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let currentFilter = data.activeFilter || data.filters?.[0] || 'Engagement Models';
  let transitionToken = 0;
  const OUT_MS = 300;
  const IN_MS = 400;

  const applyFilterState = (label) => {
    currentFilter = label;
    filters.querySelectorAll('.engagement-filter').forEach((button) => {
      button.classList.toggle('active', button.textContent === label);
      button.disabled = false;
    });
    grid.classList.toggle('growth-packages-active', label === 'Growth Packages');
    renderCards(filterMap[label] || data.items || []);
  };

  const setActiveFilter = (label, animate = true) => {
    if (label === currentFilter) return;

    if (!animate || reducedMotion) {
      applyFilterState(label);
      return;
    }

    const token = ++transitionToken;
    filters.querySelectorAll('.engagement-filter').forEach((button) => {
      button.disabled = true;
    });

    grid.classList.remove('is-transition-in');
    grid.classList.add('is-transition-out');

    window.setTimeout(() => {
      if (token !== transitionToken) return;
      applyFilterState(label);
      grid.classList.remove('is-transition-out');
      grid.classList.add('is-transition-in');

      window.setTimeout(() => {
        if (token !== transitionToken) return;
        grid.classList.remove('is-transition-in');
      }, IN_MS);
    }, OUT_MS);
  };

  filters.innerHTML = '';
  (data.filters || []).forEach((filter) => {
    const button = createEl('button', `engagement-filter${filter === (data.activeFilter || data.filters?.[0]) ? ' active' : ''}`);
    button.type = 'button';
    button.textContent = filter;
    button.addEventListener('click', () => setActiveFilter(filter, true));
    filters.appendChild(button);
  });

  applyFilterState(currentFilter);
};
