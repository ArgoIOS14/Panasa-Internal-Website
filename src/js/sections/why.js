import { createEl, setText } from '../utils/dom.js';

export const renderWhy = (data) => {
  setText('[data-why-pill]', data.pill);

  const titleEl = document.querySelector('[data-why-title]');
  if (titleEl) {
    titleEl.innerHTML = 'Why fintechs choose <span>Panasa</span>';
  }

  setText('[data-why-subtitle]', data.subtitle);

  const container = document.querySelector('[data-why-cards]');
  if (!container) return;
  container.innerHTML = '';

  data.cards.forEach((cardData) => {
    const card = createEl('article', `feature-card ${cardData.style}`);

    if (cardData.imageType === 'tags') {
      const box = createEl('div', 'card-image soft');
      const tags = createEl('div', 'chip-tags');
      cardData.tags.forEach((tag) => {
        const span = createEl('span');
        span.textContent = tag;
        tags.appendChild(span);
      });
      box.appendChild(tags);
      card.appendChild(box);
    } else {
      const img = createEl('img', 'card-image');
      img.src = cardData.image;
      img.alt = cardData.title;
      card.appendChild(img);
    }

    const textWrap = createEl('div');
    const h3 = createEl('h3');
    h3.textContent = cardData.title;
    const p = createEl('p');
    p.textContent = cardData.text;
    textWrap.append(h3, p);
    card.appendChild(textWrap);
    container.appendChild(card);
  });
};
