import { initScrollAnimations } from './Home scenes/components/animations.js';
import './smooth-scroll.js';
import { loadContent } from './Home scenes/data/loadContent.js';
import { renderFooter } from './Home scenes/sections/footer.js';
import { initNavToggle, renderNav } from './Home scenes/sections/nav.js';
import { firebaseConfig } from './firebase-config.js';


// Live preview — only loaded in ?preview=true mode (admin panel iframe)
if (new URLSearchParams(window.location.search).get('preview') === 'true') {
  import('./live-preview-receiver.js').catch(() => { /* non-critical */ });
}
function stripTags(str) { if (!str || typeof str !== 'string' || !str.includes('<')) return str || ''; const d = document.createElement('div'); d.innerHTML = str; return d.textContent || ''; }
function deepStripTags(obj) { if (typeof obj === 'string') return stripTags(obj); if (Array.isArray(obj)) return obj.map(deepStripTags); if (obj && typeof obj === 'object') { const o = {}; for (const k of Object.keys(obj)) o[k] = deepStripTags(obj[k]); return o; } return obj; }

const resolveToSiteHref = (href) => {
  if (href === '#about') return 'about';
  if (href === '#services') return 'ai-accelerated-fintech-engineering';
  if (href.startsWith('#')) return `/${href}`;
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
    if (snapshot.exists()) applyFirebaseData(snapshot.val());
  } catch (e) { console.warn('Firebase fetch failed for privacy policy', e); }
};

/* Apply a { heading, body } (or subset) group to elements looked up by
   data-* hooks, following the defensive "never blank on missing value"
   pattern used across the shared page renderers. */
function applyTextHook(attr, value) {
  if (!value) return;
  const el = document.querySelector(`[data-${attr}]`);
  if (el) el.textContent = value;
}

function applyGroup(prefix, group) {
  if (!group) return;
  applyTextHook(`${prefix}-heading`, group.heading);
  applyTextHook(`${prefix}-body`, group.body);
}

/* Rebuild a <ul>/<ol> list's items from a string array, matching the
   Array.isArray-guarded innerHTML rebuild pattern used in careers.js. */
function applyListHook(attr, items) {
  if (!Array.isArray(items) || !items.length) return;
  const el = document.querySelector(`[data-${attr}]`);
  if (!el) return;
  el.innerHTML = items.map((item) => `<li>${item}</li>`).join('');
}

function applyCookieTypes(types) {
  if (!Array.isArray(types) || !types.length) return;
  const el = document.querySelector('[data-privacy-ck-types]');
  if (!el) return;
  el.innerHTML = types.map((t) => `<div class="cookie-type-card">
                <strong>${t.name || ''}</strong>
                <span>${t.meta || ''}</span>
                <p>${t.description || ''}</p>
              </div>`).join('');
}

function applyFirebaseData(raw) {
  if (!raw) return;
  const fb = deepStripTags(raw);

  const h = fb.hero || {};
  const pill = document.querySelector('.privacy-hero .pill');
  const h1 = document.querySelector('.privacy-hero h1');
  const heroP = document.querySelector('.privacy-hero p');
  if (pill && h.pill) pill.textContent = h.pill;
  if (h1 && (h.title || h.titleEmphasis)) h1.innerHTML = `<span>${h.title || ''}</span> <em>${h.titleEmphasis || ''}</em>`;
  if (heroP && h.subtitle) heroP.textContent = h.subtitle;

  // Contact card (bottom of page)
  const cc = fb.contactCard || {};
  applyTextHook('privacy-contact-card-heading', cc.heading);
  applyTextHook('privacy-contact-card-text', cc.text);
  if (cc.email) {
    const emailLink = document.querySelector('[data-privacy-contact-card-email]');
    if (emailLink) { emailLink.href = `mailto:${cc.email}`; emailLink.textContent = `Email ${cc.email}`; }
  }

  // Tab: Website Privacy
  const wp = fb.websitePrivacy || {};
  applyTextHook('privacy-wp-intro', wp.intro);
  applyTextHook('privacy-wp-intro-2', wp.intro2);
  applyGroup('privacy-wp-who', wp.whoWeAre);
  applyGroup('privacy-wp-what', wp.whatWeDo);
  applyGroup('privacy-wp-legal', wp.legalBasis);
  applyTextHook('privacy-wp-legal-body-2', wp.legalBasis?.body2);
  applyListHook('privacy-wp-legal-principles', wp.legalBasis?.principles);
  applyTextHook('privacy-wp-glossary-intro', wp.glossary?.intro);
  applyGroup('privacy-wp-personal', wp.personalData);
  applyListHook('privacy-wp-personal-items', wp.personalData?.items);
  applyGroup('privacy-wp-usage', wp.usageData);
  applyTextHook('privacy-wp-usage-body-2', wp.usageData?.body2);
  applyTextHook('privacy-wp-useof-heading', wp.useOfData?.heading);
  applyGroup('privacy-wp-retention', wp.retention);
  applyTextHook('privacy-wp-retention-body-2', wp.retention?.body2);
  applyGroup('privacy-wp-transfer', wp.transfer);
  applyTextHook('privacy-wp-transfer-body-2', wp.transfer?.body2);
  applyGroup('privacy-wp-disclosure-transactions', wp.disclosureTransactions);
  applyGroup('privacy-wp-disclosure-enforcement', wp.disclosureLawEnforcement);
  applyGroup('privacy-wp-disclosure-legal', wp.disclosureOtherLegal);
  applyListHook('privacy-wp-disclosure-legal-items', wp.disclosureOtherLegal?.items);
  applyGroup('privacy-wp-security', wp.security);
  applyTextHook('privacy-wp-rights-heading', wp.rights?.heading);
  applyListHook('privacy-wp-rights-items', wp.rights?.items);
  applyTextHook('privacy-wp-honour-intro', wp.honourRights?.intro);
  applyListHook('privacy-wp-honour-items', wp.honourRights?.items);
  applyGroup('privacy-wp-children', wp.children);
  applyGroup('privacy-wp-thirdparty', wp.thirdPartyLinks);
  applyTextHook('privacy-wp-thirdparty-body-2', wp.thirdPartyLinks?.body2);
  applyGroup('privacy-wp-changes', wp.changes);
  applyTextHook('privacy-wp-changes-body-2', wp.changes?.body2);
  applyGroup('privacy-wp-contact', wp.contact);

  // Tab: Cookies
  const ck = fb.cookies || {};
  applyTextHook('privacy-ck-overview-heading', ck.overview?.heading);
  applyTextHook('privacy-ck-overview-body', ck.overview?.body);
  applyCookieTypes(ck.cookieTypes);
  applyGroup('privacy-ck-banner', ck.banner);
  applyGroup('privacy-ck-managing', ck.managing);

  // Tab: GDPR & B2B
  const gd = fb.gdpr || {};
  applyGroup('privacy-gd-who', gd.whoWeAre);
  applyGroup('privacy-gd-legal', gd.legalBasis);
  applyTextHook('privacy-gd-legal-body-2', gd.legalBasis?.body2);
  applyListHook('privacy-gd-legal-principles', gd.legalBasis?.principles);
  applyGroup('privacy-gd-sharing', gd.dataSharing);
  applyListHook('privacy-gd-sharing-items', gd.dataSharing?.items);
  applyGroup('privacy-gd-transfer', gd.transfer);
  applyGroup('privacy-gd-source', gd.dataSource);
  applyTextHook('privacy-gd-rights-heading', gd.rights?.heading);
  applyTextHook('privacy-gd-rights-rectification-heading', gd.rights?.rectificationHeading);
  applyTextHook('privacy-gd-rights-object-heading', gd.rights?.objectHeading);
  applyTextHook('privacy-gd-rights-access-heading', gd.rights?.accessHeading);
  applyGroup('privacy-gd-info', gd.infoCollect);
  applyListHook('privacy-gd-info-items', gd.infoCollect?.items);
  applyGroup('privacy-gd-ico', gd.ico);
  applyGroup('privacy-gd-storing', gd.storing);
  applyGroup('privacy-gd-disclosing', gd.disclosing);
  applyListHook('privacy-gd-disclosing-items', gd.disclosing?.items);
  applyGroup('privacy-gd-contact', gd.contact);

  // Tab: Campaign Policy
  const cp = fb.campaign || {};
  applyTextHook('privacy-cp-intro', cp.intro);
  applyGroup('privacy-cp-legal', cp.legalBasis);
  applyListHook('privacy-cp-legal-principles', cp.legalBasis?.principles);
  applyGroup('privacy-cp-sharing', cp.dataSharing);
  applyListHook('privacy-cp-sharing-items', cp.dataSharing?.items);
  applyGroup('privacy-cp-transfer', cp.transfer);
  applyGroup('privacy-cp-source', cp.dataSource);
  applyTextHook('privacy-cp-rights-heading', cp.rights?.heading);
  applyTextHook('privacy-cp-rights-rectification-heading', cp.rights?.rectificationHeading);
  applyTextHook('privacy-cp-rights-object-heading', cp.rights?.objectHeading);
  applyTextHook('privacy-cp-rights-access-heading', cp.rights?.accessHeading);
  applyListHook('privacy-cp-rights-items', cp.rights?.items);
  applyGroup('privacy-cp-info', cp.infoCollect);
  applyListHook('privacy-cp-info-items', cp.infoCollect?.items);
  applyGroup('privacy-cp-ico', cp.ico);
  applyGroup('privacy-cp-storing', cp.storing);
  applyGroup('privacy-cp-thirdparty', cp.thirdParty);
  applyGroup('privacy-cp-contact', cp.contact);
}

initPrivacy();

// Live preview hook
if (new URLSearchParams(window.location.search).get('preview') === 'true') {
  window.__livePreviewRender = (data) => {
    try { applyFirebaseData(data); } catch (e) { console.warn('[live-preview] privacy-policy failed:', e); }
  };
}

window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    initScrollAnimations();
  }
});
