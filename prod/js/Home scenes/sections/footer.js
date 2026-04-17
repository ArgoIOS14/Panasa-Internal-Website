import { createEl, setText } from '../utils/dom.js';

export const renderFooter = (data) => {
  setText('[data-footer-cta-title]', data.ctaTitle);
  setText('[data-footer-cta-text]', data.ctaText);

  const ctaBtn = document.querySelector('[data-footer-cta-button]');
  if (ctaBtn) {
    // Handle both old string format and new object format { label, href }
    const btnData = data.ctaButton;
    const btnLabel = typeof btnData === 'object' ? (btnData.label || '') : (btnData || '');
    const btnHref = typeof btnData === 'object' ? (btnData.href || 'contact.html') : (data.ctaHref || 'contact.html');
    const label = ctaBtn.querySelector('.footer-cta-label');
    if (label) {
      label.textContent = btnLabel;
    } else {
      ctaBtn.textContent = btnLabel;
    }
    if ('href' in ctaBtn) {
      ctaBtn.href = btnHref;
    }
  }

  setText('[data-footer-brand-text]', data.brandText);

  // Contact info
  const phoneContainer = document.querySelector('[data-footer-phones]');
  if (phoneContainer && data.phones) {
    phoneContainer.innerHTML = '';
    data.phones.forEach((phone) => {
      const a = createEl('a');
      a.href = `tel:${phone.replace(/\s|\(|\)/g, '')}`;
      a.textContent = phone;
      phoneContainer.appendChild(a);
    });
  }

  const emailLink = document.querySelector('[data-footer-email]');
  if (emailLink && data.email) {
    emailLink.href = `mailto:${data.email}`;
    emailLink.textContent = data.email;
  }

  // Columns
  const columns = document.querySelector('[data-footer-columns]');
  if (columns) {
    columns.innerHTML = '';
    const showResources = data.showResources !== false;
    const visibleColumns = (data.columns || [])
      .filter((column) => column.visible !== false)
      .filter((column) => showResources || !column.isResourcesColumn)
      .map((column) => ({
        ...column,
        links: (column.links || [])
          .filter((link) => link.visible !== false)
          .filter((link) => showResources || !link.isResourcesLink),
      }))
      .filter((column) => column.links.length > 0);

    visibleColumns.forEach((column) => {
      const col = createEl('div');
      const h4 = createEl('h4');
      h4.textContent = column.title;
      col.appendChild(h4);

      column.links.forEach((link) => {
        const a = createEl('a');
        a.href = link.href;

        if (link.badge) {
          const labelSpan = document.createTextNode(link.label);
          a.appendChild(labelSpan);
          const badge = createEl('span', `footer-link-badge footer-link-badge-${link.badge}`);
          badge.textContent = link.badgeText || link.badge.toUpperCase();
          a.appendChild(badge);
        } else {
          a.textContent = link.label;
        }

        col.appendChild(a);
      });

      columns.appendChild(col);
    });
  }

  setText('[data-footer-copyright]', data.legal?.copyright);

  const legal = document.querySelector('[data-footer-legal-links]');
  if (legal && data.legal?.links) {
    legal.innerHTML = '';
    data.legal.links.forEach((link) => {
      const a = createEl('a');
      a.textContent = link.label;
      a.href = link.href;
      legal.appendChild(a);
    });
  }
};
