import { initScrollAnimations } from './Home scenes/components/animations.js';
import { loadContent } from './Home scenes/data/loadContent.js';
import { renderFooter } from './Home scenes/sections/footer.js';
import { initNavToggle, renderNav } from './Home scenes/sections/nav.js';

const resolveToSiteHref = (href) => {
  if (href === '#contact') return 'contact.html';
  if (href === '#services') return 'services.html';
  if (href.startsWith('#')) return `index.html${href}`;
  return href;
};

const buildContactNav = (nav) => ({
  ...nav,
  links: nav.links.map((link) => ({
    ...link,
    href: link.label === 'Services' ? 'services.html' : resolveToSiteHref(link.href),
  })),
  cta: {
    ...nav.cta,
    href: 'contact.html',
  },
});

const buildContactFooter = (footer) => ({
  ...footer,
  columns: footer.columns.map((column) => ({
    ...column,
    links: column.links.map((link) => ({
      ...link,
      href:
        link.label.toLowerCase() === 'contact'
          ? 'contact.html'
          : resolveToSiteHref(link.href),
    })),
  })),
  legal: {
    ...footer.legal,
    links: footer.legal.links.map((link) => ({
      ...link,
      href: '#top',
    })),
  },
});

const initContactForm = () => {
  const form = document.querySelector('[data-contact-form]');
  if (!form) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
  });
};

const initContact = async () => {
  initNavToggle();
  initScrollAnimations();
  initContactForm();

  try {
    const content = await loadContent();
    renderNav(buildContactNav(content.nav));
    renderFooter(buildContactFooter(content.footer));
  } catch (err) {
    console.error('Failed to load shared contact content', err);
    if (window.DEFAULT_CONTENT?.nav) renderNav(buildContactNav(window.DEFAULT_CONTENT.nav));
    if (window.DEFAULT_CONTENT?.footer) renderFooter(buildContactFooter(window.DEFAULT_CONTENT.footer));
  }
};

initContact();

window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    initScrollAnimations();
  }
});
