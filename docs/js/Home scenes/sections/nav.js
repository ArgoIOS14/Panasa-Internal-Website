import { createEl } from '../utils/dom.js';

export const initNavToggle = () => {
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  const syncMobileDropdownLayout = (scope = navLinks) => {
    if (!(scope instanceof HTMLElement) || window.innerWidth > 900) return;

    const items = scope.querySelectorAll('.nav-item-has-children');
    items.forEach((item) => {
      if (!(item instanceof HTMLElement)) return;
      item.style.width = '100%';
      item.style.maxWidth = '280px';
      item.style.marginInline = 'auto';
      item.style.display = 'flex';
      item.style.flexDirection = 'column';
      item.style.alignItems = 'center';

      const triggerWrap = item.querySelector('.nav-dropdown-wrap');
      if (triggerWrap instanceof HTMLElement) {
        triggerWrap.style.width = 'auto';
        triggerWrap.style.maxWidth = '100%';
        triggerWrap.style.display = 'inline-flex';
        triggerWrap.style.alignItems = 'center';
        triggerWrap.style.justifyContent = 'center';
      }

      const submenu = item.querySelector('.nav-submenu');
      if (!(submenu instanceof HTMLElement)) return;

      const targetWidth = 280;
      submenu.style.position = 'relative';
      submenu.style.left = 'auto';
      submenu.style.transform = 'none';
      submenu.style.width = `${targetWidth}px`;
      submenu.style.maxWidth = `${targetWidth}px`;
      submenu.style.marginInline = 'auto';
      submenu.style.alignSelf = 'center';
      submenu.style.alignItems = 'center';

      submenu.querySelectorAll('a').forEach((link) => {
        if (link instanceof HTMLElement) {
          link.style.width = `${targetWidth}px`;
          link.style.maxWidth = `${targetWidth}px`;
          link.style.marginInline = 'auto';
          link.style.textAlign = 'center';
          link.style.justifyContent = 'center';
        }
      });
    });
  };

  const syncAfterOpen = (scope = navLinks) => {
    requestAnimationFrame(() => {
      syncMobileDropdownLayout(scope);
      requestAnimationFrame(() => {
        syncMobileDropdownLayout(scope);
      });
    });
  };

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
      if (isOpen) {
        syncAfterOpen(navLinks);
      }
    });

    navLinks.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const toggle = target.closest('.nav-dropdown-toggle');
      if (toggle instanceof HTMLButtonElement) {
        const parent = toggle.closest('.nav-item-has-children');
        const isOpen = parent?.classList.toggle('open');
        toggle.setAttribute('aria-expanded', String(Boolean(isOpen)));
        if (isOpen) {
          syncAfterOpen(parent ?? navLinks);
        }
        return;
      }
      if (target.closest('[data-nav-close]') || target.closest('a')) closeMenu();
    });

    window.addEventListener('resize', () => {
      syncMobileDropdownLayout(navLinks);
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
  if (href.includes('?')) return href === getCurrentRoute();
  if (window.location.search) return href === getCurrentRoute();
  return href === getCurrentPage();
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
