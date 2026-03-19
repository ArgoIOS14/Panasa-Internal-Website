import { createEl } from '../utils/dom.js';

export const initNavToggle = () => {
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  const closeMenu = () => {
    navLinks?.classList.remove('open');
    navToggle?.setAttribute('aria-expanded', 'false');
  };

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });

    navLinks.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (target.closest('[data-nav-close]') || target.closest('a')) closeMenu();
    });
  }
};

const getCurrentPage = () => {
  const current = window.location.pathname.split('/').pop();
  return current || 'index.html';
};

const resolveHref = (href) => {
  if (!href.startsWith('#')) return href;
  return getCurrentPage() === 'index.html' ? href : `index.html${href}`;
};

const isActiveLink = (href) => {
  if (href.startsWith('#')) return false;
  return href === getCurrentPage();
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
    const a = createEl('a');
    a.textContent = link.label;
    a.href = resolveHref(link.href);
    if (isActiveLink(link.href)) a.classList.add('active');
    li.appendChild(a);
    container.appendChild(li);
  });

  const ctaLi = createEl('li');
  const cta = createEl('a', 'btn btn-light');
  cta.textContent = data.cta.label;
  cta.href = resolveHref(data.cta.href);
  ctaLi.appendChild(cta);
  container.appendChild(ctaLi);
};
