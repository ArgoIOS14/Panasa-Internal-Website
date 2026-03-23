import { createEl } from '../utils/dom.js';

export const initNavToggle = () => {
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  const closeMenu = () => {
    navLinks?.classList.remove('open');
    navToggle?.setAttribute('aria-expanded', 'false');
    navLinks?.querySelectorAll('.nav-item-has-children.open').forEach((item) => {
      item.classList.remove('open');
      item.querySelector('.nav-dropdown-toggle')?.setAttribute('aria-expanded', 'false');
    });
  };

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });

    navLinks.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const toggle = target.closest('.nav-dropdown-toggle');
      if (toggle instanceof HTMLButtonElement) {
        const parent = toggle.closest('.nav-item-has-children');
        const isOpen = parent?.classList.toggle('open');
        toggle.setAttribute('aria-expanded', String(Boolean(isOpen)));
        return;
      }
      if (target.closest('[data-nav-close]') || target.closest('a')) closeMenu();
    });
  }
};

const getCurrentPage = () => {
  const current = window.location.pathname.split('/').pop();
  return current || 'index.html';
};

const getCurrentRoute = () => {
  return `${getCurrentPage()}${window.location.search || ''}`;
};

const resolveHref = (href) => {
  if (!href.startsWith('#')) return href;
  return getCurrentPage() === 'index.html' ? href : `index.html${href}`;
};

const isActiveLink = (href) => {
  if (href.startsWith('#')) return false;
  return href === getCurrentRoute() || href === getCurrentPage();
};

const hasActiveChild = (items = []) => {
  return items.some((item) => isActiveLink(item.href));
};

export const renderNav = (data) => {
  const container = document.querySelector('[data-nav-links]');
  if (!container) return;
  container.innerHTML = '';

  const mobileHead = createEl('li', 'nav-mobile-head');
  const mobileBrand = createEl('a', 'nav-mobile-brand');
  mobileBrand.href = 'index.html';
  mobileBrand.setAttribute('aria-label', 'Panasa home');

  const mobileLogo = createEl('img');
  mobileLogo.src = 'assets/logo.svg';
  mobileLogo.alt = 'Panasa';
  mobileBrand.appendChild(mobileLogo);

  const mobileClose = createEl('button', 'nav-mobile-close');
  mobileClose.type = 'button';
  mobileClose.setAttribute('aria-label', 'Close navigation');
  mobileClose.setAttribute('data-nav-close', 'true');
  mobileClose.textContent = '×';

  mobileHead.append(mobileBrand, mobileClose);
  container.appendChild(mobileHead);

  data.links.forEach((link) => {
    const li = createEl('li');
    if (Array.isArray(link.children) && link.children.length > 0) {
      li.classList.add('nav-item-has-children');

      const triggerWrap = createEl('div', 'nav-dropdown-wrap');
      const a = createEl('a');
      a.textContent = link.label;
      a.href = resolveHref(link.href);
      if (isActiveLink(link.href) || hasActiveChild(link.children)) a.classList.add('active');

      const toggle = createEl('button', 'nav-dropdown-toggle');
      toggle.type = 'button';
      toggle.setAttribute('aria-label', `Open ${link.label} menu`);
      toggle.setAttribute('aria-expanded', 'false');
      toggle.innerHTML = '<span></span>';

      triggerWrap.append(a, toggle);

      const submenu = createEl('div', 'nav-submenu');
      link.children.forEach((child) => {
        const childLink = createEl('a');
        childLink.textContent = child.label;
        childLink.href = resolveHref(child.href);
        if (isActiveLink(child.href)) childLink.classList.add('active');
        submenu.appendChild(childLink);
      });

      li.append(triggerWrap, submenu);
    } else {
      const a = createEl('a');
      a.textContent = link.label;
      a.href = resolveHref(link.href);
      if (isActiveLink(link.href)) a.classList.add('active');
      li.appendChild(a);
    }
    container.appendChild(li);
  });

  const ctaLi = createEl('li');
  const cta = createEl('a', 'btn btn-light');
  cta.textContent = data.cta.label;
  cta.href = resolveHref(data.cta.href);
  ctaLi.appendChild(cta);
  container.appendChild(ctaLi);
};
