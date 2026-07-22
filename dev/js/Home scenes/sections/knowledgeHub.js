import { createEl, setText } from '../utils/dom.js';

/* Category → tag styling, mirroring sections/resources.js so the Knowledge Hub
   cards share the same colour language as the Resources page. */
const TAG_CLASS_BY_CATEGORY = {
  Blog: 'resource-tag-blog',
  Blogs: 'resource-tag-blog',
  Insights: 'resource-tag-insights',
  Insight: 'resource-tag-insights',
  Guide: 'resource-tag-guide',
  Guides: 'resource-tag-guide',
  'Case Study': 'resource-tag-case-study',
  'Case Studies': 'resource-tag-case-study',
};

const tagClassFor = (category) => TAG_CLASS_BY_CATEGORY[category] || 'resource-tag-blog';

const categoryLabel = (category) => {
  const label = String(category || '').toUpperCase();
  return label === 'INSIGHTS' ? 'INSIGHT' : label;
};

export const renderKnowledgeHub = (data) => {
  if (!data) return;

  const titleEl = document.querySelector('[data-knowledge-title]');
  if (titleEl) {
    titleEl.innerHTML = `${data.title || ''} <span>${data.titleEmphasis || ''}</span>`;
  }
  setText('[data-knowledge-subtitle]', data.subtitle);

  const ctaEl = document.querySelector('[data-knowledge-cta]');
  if (ctaEl) {
    const label = data.cta?.label || 'Explore Resources';
    ctaEl.innerHTML = `${label} <span class="knowledge-cta-arrow" aria-hidden="true">›</span>`;
    if (ctaEl instanceof HTMLAnchorElement) ctaEl.href = data.cta?.href || 'resources';
  }

  const grid = document.querySelector('[data-knowledge-cards]');
  if (!grid) return;
  grid.innerHTML = '';

  (data.cards || []).forEach((card) => {
    const link = createEl('a', 'knowledge-card');
    link.href = card.href || 'resources';

    const imgWrap = createEl('div', 'knowledge-card-image');
    if (card.image) {
      const img = createEl('img');
      img.src = card.image;
      img.alt = card.title || '';
      imgWrap.appendChild(img);
    }
    link.appendChild(imgWrap);

    const body = createEl('div', 'knowledge-card-body');

    const tag = createEl('span', `resource-tag ${tagClassFor(card.category)}`);
    tag.textContent = categoryLabel(card.category);
    body.appendChild(tag);

    const h3 = createEl('h3', 'knowledge-card-title');
    h3.textContent = card.title || '';
    body.appendChild(h3);

    if (card.date) {
      const meta = createEl('div', 'knowledge-card-meta');
      const date = createEl('span', 'knowledge-card-date');
      date.textContent = card.date;
      meta.appendChild(date);
      body.appendChild(meta);
    }

    const read = createEl('span', 'knowledge-card-read');
    read.innerHTML = 'Read More <span class="knowledge-card-read-arrow" aria-hidden="true">›</span>';
    body.appendChild(read);

    link.appendChild(body);
    grid.appendChild(link);
  });
};
