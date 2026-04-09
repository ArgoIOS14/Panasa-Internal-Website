import { initScrollAnimations } from './Home scenes/components/animations.js';
import { loadContent } from './Home scenes/data/loadContent.js';
import { renderFooter } from './Home scenes/sections/footer.js';
import { initNavToggle, renderNav } from './Home scenes/sections/nav.js';
import { firebaseConfig } from './firebase-config.js';

function stripTags(str) { if (!str || typeof str !== 'string' || !str.includes('<')) return str || ''; const d = document.createElement('div'); d.innerHTML = str; return d.textContent || ''; }
function deepStripTags(obj) { if (typeof obj === 'string') return stripTags(obj); if (Array.isArray(obj)) return obj.map(deepStripTags); if (obj && typeof obj === 'object') { const o = {}; for (const k of Object.keys(obj)) o[k] = deepStripTags(obj[k]); return o; } return obj; }

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

  try {
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js');
    const { getDatabase, ref, get } = await import('https://www.gstatic.com/firebasejs/11.1.0/firebase-database.js');
    const app = initializeApp(firebaseConfig, 'privacy-reader');
    const db = getDatabase(app);
    const snapshot = await get(ref(db, 'pages/privacyPolicy'));
    if (snapshot.exists()) {
      const fb = deepStripTags(snapshot.val());
      const h = fb.hero || {};
      const pill = document.querySelector('.privacy-hero .pill');
      const h1 = document.querySelector('.privacy-hero h1');
      const heroP = document.querySelector('.privacy-hero p');
      if (pill && h.pill) pill.textContent = h.pill;
      if (h1 && (h.title || h.titleEmphasis)) h1.innerHTML = `<span>${h.title || ''}</span> <em>${h.titleEmphasis || ''}</em>`;
      if (heroP && h.subtitle) heroP.textContent = h.subtitle;
    }
  } catch (e) { console.warn('Firebase fetch failed for privacy policy', e); }
};

initPrivacy();

window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    initScrollAnimations();
  }
});
