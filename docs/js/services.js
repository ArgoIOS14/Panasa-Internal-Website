import { initScrollAnimations } from './Home scenes/components/animations.js';
import { loadContent } from './Home scenes/data/loadContent.js';
import { renderFooter } from './Home scenes/sections/footer.js';
import { renderLogoMarquee } from './Home scenes/sections/logoMarquee.js';
import { initNavToggle, renderNav } from './Home scenes/sections/nav.js';

const TRUSTED_LOGOS = [
  { src: 'assets/logo-accelovate.svg', alt: 'Accelovate' },
  { src: 'assets/logo-paymentology.svg', alt: 'Paymentology' },
  { src: 'assets/logo-crunch.svg', alt: 'Crunch' },
  { src: 'assets/logo-ribbon-gi.svg', alt: 'Ribbon GI' },
  { src: 'assets/logo-kani.svg', alt: 'Kani' },
  { src: 'assets/logo-88-eu.svg', alt: '88 EU' },
  { src: 'assets/logo-osper.svg', alt: 'Osper' },
  { src: 'assets/logo-paci.svg', alt: 'Paci' },
  { src: 'assets/logo-prosper.svg', alt: 'Prosper' },
  { src: 'assets/logo-dialect.svg', alt: 'Dialect' },
];

const resolveToSiteHref = (href) => {
  if (href === '#about') return 'about.html';
  if (href === '#services') return 'services.html';
  if (href.startsWith('#')) return `index.html${href}`;
  return href;
};

const buildFooterLinks = (footer) => ({
  ...footer,
  columns: footer.columns.map((column) => ({
    ...column,
    links: column.links.map((link) => ({
      ...link,
      href: resolveToSiteHref(link.href),
    })),
  })),
  legal: {
    ...footer.legal,
    links: footer.legal.links.map((link) => ({
      ...link,
      href: resolveToSiteHref(link.href),
    })),
  },
});

const buildNav = (nav) => ({
  ...nav,
  links: nav.links.map((link) => ({
    ...link,
    href: link.label === 'Services' ? 'services.html' : resolveToSiteHref(link.href),
  })),
});

const initServicesPage = async () => {
  initNavToggle();
  initScrollAnimations();
  document
    .querySelector('[data-service-trusted-logos]')
    ?.classList.add('logo-marquee', 'logo-marquee-light');
  renderLogoMarquee('[data-service-trusted-logos]', TRUSTED_LOGOS);

  try {
    const content = await loadContent();
    renderNav(buildNav(content.nav));
    renderFooter(buildFooterLinks(content.footer));
  } catch (error) {
    console.error('Failed to load shared service page content', error);
    if (window.DEFAULT_CONTENT?.nav) renderNav(buildNav(window.DEFAULT_CONTENT.nav));
    if (window.DEFAULT_CONTENT?.footer) {
      renderFooter(buildFooterLinks(window.DEFAULT_CONTENT.footer));
    }
  }
};

initServicesPage();
