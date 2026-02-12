import { createEl, setText } from '../utils/dom.js';

export const renderFooter = (data) => {
  setText('[data-footer-cta-title]', data.ctaTitle);
  setText('[data-footer-cta-text]', data.ctaText);

  const ctaBtn = document.querySelector('[data-footer-cta-button]');
  if (ctaBtn) ctaBtn.textContent = data.ctaButton;

  setText('[data-footer-brand-text]', data.brandText);
  setText('[data-footer-email]', data.email);
  setText('[data-footer-phone]', data.phone);

  const columns = document.querySelector('[data-footer-columns]');
  if (columns) {
    columns.innerHTML = '';
    data.columns.forEach((column) => {
      const col = createEl('div');
      const h4 = createEl('h4');
      h4.textContent = column.title;
      col.appendChild(h4);

      column.links.forEach((link) => {
        const a = createEl('a');
        a.textContent = link.label;
        a.href = link.href;
        col.appendChild(a);
      });

      columns.appendChild(col);
    });
  }

  setText('[data-footer-copyright]', data.legal.copyright);

  const legal = document.querySelector('[data-footer-legal-links]');
  if (legal) {
    legal.innerHTML = '';
    data.legal.links.forEach((link) => {
      const a = createEl('a');
      a.textContent = link.label;
      a.href = link.href;
      legal.appendChild(a);
    });
  }
};
