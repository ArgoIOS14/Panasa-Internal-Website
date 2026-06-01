import { createEl, setText } from '../utils/dom.js';

const FAQ_ICON_SVG = `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M23.3332 14H4.6665" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><path class="faq-icon-vertical" d="M14.0015 4.66797L14.0015 23.3346" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

let faqDelegationBound = false;

/* Height-animated, single-open accordion — mirrors the Services sub-page FAQ
   so the UI element stays consistent across the site. */
const initFaqAccordion = (listEl) => {
  const items = Array.from(listEl.querySelectorAll('[data-faq-item]'));
  if (!items.length) return;

  const setPanelState = (item, isOpen) => {
    const button = item.querySelector('[data-faq-toggle]');
    const panel = item.querySelector('[data-faq-panel]');
    if (!(button && panel)) return;
    item.classList.toggle('is-active', isOpen);
    button.setAttribute('aria-expanded', String(isOpen));
    panel.style.height = isOpen ? `${panel.scrollHeight}px` : '0px';
  };

  items.forEach((item) => setPanelState(item, item.classList.contains('is-active')));

  if (faqDelegationBound) return;
  faqDelegationBound = true;

  items.forEach((item) => {
    const button = item.querySelector('[data-faq-toggle]');
    button?.addEventListener('click', () => {
      const isActive = item.classList.contains('is-active');
      items.forEach((entry) => setPanelState(entry, false));
      if (!isActive) setPanelState(item, true);
    });
  });

  window.addEventListener('resize', () => {
    items.forEach((item) => {
      if (item.classList.contains('is-active')) setPanelState(item, true);
    });
  });
};

export const renderFaq = (data) => {
  if (!data) return;

  const titleEl = document.querySelector('[data-faq-title]');
  if (titleEl) {
    titleEl.innerHTML = `<span>${data.title || ''}</span><em>${data.titleEmphasis || ''}</em>`;
  }
  setText('[data-faq-subtitle]', data.subtitle);

  const listEl = document.querySelector('[data-faq-list]');
  if (!listEl) return;
  listEl.innerHTML = '';

  (data.items || []).forEach((item, index) => {
    const isOpen = index === 0;
    const article = createEl('article', isOpen ? 'faq-item is-active' : 'faq-item');
    article.setAttribute('data-faq-item', '');

    const btn = createEl('button', 'faq-toggle');
    btn.type = 'button';
    btn.setAttribute('data-faq-toggle', '');
    btn.setAttribute('aria-expanded', String(isOpen));

    const q = createEl('span');
    q.textContent = item.q || '';
    const icon = createEl('span', 'faq-icon');
    icon.innerHTML = FAQ_ICON_SVG;
    btn.append(q, icon);

    const panel = createEl('div', 'faq-panel');
    panel.setAttribute('data-faq-panel', '');
    const inner = createEl('div', 'faq-panel-inner');
    const p = createEl('p');
    p.textContent = item.a || '';
    inner.appendChild(p);
    panel.appendChild(inner);

    article.append(btn, panel);
    listEl.appendChild(article);
  });

  initFaqAccordion(listEl);
};
