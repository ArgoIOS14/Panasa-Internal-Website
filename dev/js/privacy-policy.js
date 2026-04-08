import { initScrollAnimations } from './Home scenes/components/animations.js';
import { loadContent } from './Home scenes/data/loadContent.js';
import { renderFooter } from './Home scenes/sections/footer.js';
import { initNavToggle, renderNav } from './Home scenes/sections/nav.js';

const resolveToSiteHref = (href) => {
  if (href === '#about') return 'about.html';
  if (href === '#services') return 'ai-accelerated-fintech-engineering.html';
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
});

/* ── Tab switching ── */
const initTabs = () => {
  const tabs = Array.from(document.querySelectorAll('.privacy-tab'));
  const sections = Array.from(document.querySelectorAll('.privacy-section'));
  if (!tabs.length) return;

  const activate = (tabId) => {
    tabs.forEach((t) => t.classList.toggle('is-active', t.dataset.tab === tabId));
    sections.forEach((s) => s.classList.toggle('is-active', s.id === `section-${tabId}`));
    window.scrollTo({ top: document.querySelector('.privacy-tabs').offsetTop - 80, behavior: 'smooth' });
  };

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => activate(tab.dataset.tab));
  });

  // Check if arriving via hash or sessionStorage (e.g. clicking "Cookies" in footer)
  const stored = sessionStorage.getItem('privacyTab');
  if (stored) {
    activate(stored);
    sessionStorage.removeItem('privacyTab');
  } else if (location.hash) {
    const hash = location.hash.replace('#section-', '');
    const matching = tabs.find((t) => t.dataset.tab === hash);
    if (matching) activate(hash);
  }
};

const initPrivacy = async () => {
  initNavToggle();
  initScrollAnimations();
  initTabs();

  try {
    const content = await loadContent();
    renderNav(content.nav);
    renderFooter(buildFooterLinks(content.footer));
  } catch (error) {
    console.error('Failed to load privacy page shared content', error);
    if (window.DEFAULT_CONTENT?.nav) renderNav(window.DEFAULT_CONTENT.nav);
    if (window.DEFAULT_CONTENT?.footer) {
      renderFooter(buildFooterLinks(window.DEFAULT_CONTENT.footer));
    }
  }
};

initPrivacy();

window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    initScrollAnimations();
  }
});
