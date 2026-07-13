import { initScrollAnimations } from './Home scenes/components/animations.js';
import './smooth-scroll.js';
import { loadContent } from './Home scenes/data/loadContent.js';
import { renderEngagement } from './Home scenes/sections/engagement.js';
import { renderFooter } from './Home scenes/sections/footer.js';
import { initNavToggle, renderNav } from './Home scenes/sections/nav.js';
import { renderSharedTestimonials } from './Home scenes/sections/sharedTestimonials.js';
import { initEmailCapture } from './Home scenes/components/email-capture.js';
import { firebaseConfig } from './firebase-config.js';
import { applySeoMeta } from './seo-meta.js';


// Live preview — only loaded in ?preview=true mode (admin panel iframe)
if (new URLSearchParams(window.location.search).get('preview') === 'true') {
  import('./live-preview-receiver.js').catch(() => { /* non-critical */ });
}
function stripTags(str) { if (!str || typeof str !== 'string' || !str.includes('<')) return str || ''; const d = document.createElement('div'); d.innerHTML = str; return d.textContent || ''; }
function deepStripTags(obj) { if (typeof obj === 'string') return stripTags(obj); if (Array.isArray(obj)) return obj.map(deepStripTags); if (obj && typeof obj === 'object') { const o = {}; for (const k of Object.keys(obj)) o[k] = deepStripTags(obj[k]); return o; } return obj; }

/* ── FAQ Accordion ──────────────────────────────────────────── */

let faqInitialized = false;

const initFaqAccordion = () => {
  const items = Array.from(document.querySelectorAll('[data-faq-item]'));
  if (!items.length) return;

  const setPanelState = (item, isOpen) => {
    const button = item.querySelector('[data-faq-toggle]');
    const panel = item.querySelector('[data-faq-panel]');
    if (!(button && panel)) return;

    item.classList.toggle('is-active', isOpen);
    button.setAttribute('aria-expanded', String(isOpen));
    panel.style.height = isOpen ? `${panel.scrollHeight}px` : '0px';
  };

  items.forEach((item) => {
    setPanelState(item, item.classList.contains('is-active'));
  });

  if (!faqInitialized) {
    faqInitialized = true;

    items.forEach((item) => {
      const button = item.querySelector('[data-faq-toggle]');
      button?.addEventListener('click', () => {
        const isCurrentlyActive = item.classList.contains('is-active');
        items.forEach((entry) => setPanelState(entry, false));
        if (!isCurrentlyActive) setPanelState(item, true);
      });
    });

    window.addEventListener('resize', () => {
      items.forEach((item) => {
        if (item.classList.contains('is-active')) setPanelState(item, true);
      });
    });
  }
};

/* ── App init ─────────────────────────────────────────────── */

/* The admin `label-href` field type stores CTAs as {label, href, icon}; the
   hero markup only ever displays a plain label string plus an href — mirrors
   ctaLabel()/ctaHref() in services.js. */
const ctaLabel = (v) => (v && typeof v === 'object' && typeof v.label === 'string' && v.label.trim()) ? v.label : undefined;
const ctaHref = (v) => (v && typeof v === 'object' && typeof v.href === 'string' && v.href.trim()) ? v.href.trim() : undefined;

// Extracted apply logic — reusable from both Firebase fetch and live preview.
function applyFirebaseData(fb) {
  if (!fb) return;
  fb = deepStripTags(fb);
  applySeoMeta(fb.meta);
  const h = fb.hero || {};
  const pill = document.querySelector('.services-overview-hero .pill');
  const h1 = document.querySelector('.services-overview-hero h1');
  const heroP = document.querySelector('.services-overview-hero .services-overview-hero-copy > p');
  if (pill && h.pill) pill.textContent = h.pill;
  if (h1 && (h.title || h.titleEmphasis)) h1.innerHTML = `<span>${h.title || ''}</span> <em>${h.titleEmphasis || ''}</em>`;
  if (heroP && h.subtitle) heroP.textContent = h.subtitle;

  const heroActionLinks = document.querySelectorAll('.services-overview-hero .hero-actions a');
  const primaryLabel = ctaLabel(h.primaryCta);
  const primaryHref = ctaHref(h.primaryCta);
  const secondaryLabel = ctaLabel(h.secondaryCta);
  const secondaryHref = ctaHref(h.secondaryCta);
  if (heroActionLinks[0]) {
    if (primaryLabel) { const l = heroActionLinks[0].querySelector('.hero-action-label'); if (l) l.textContent = primaryLabel; }
    if (primaryHref) heroActionLinks[0].setAttribute('href', primaryHref);
  }
  if (heroActionLinks[1]) {
    if (secondaryLabel) { const l = heroActionLinks[1].querySelector('.hero-action-label'); if (l) l.textContent = secondaryLabel; }
    if (secondaryHref) heroActionLinks[1].setAttribute('href', secondaryHref);
  }

  const blocks = Array.isArray(fb.serviceBlocks) ? fb.serviceBlocks : (fb.serviceBlocks ? Object.values(fb.serviceBlocks) : []);
  const blockEls = document.querySelectorAll('.service-block');
  blocks.forEach((b, i) => { if (!blockEls[i]) return; const k = blockEls[i].querySelector('.service-block-kicker'); const heading = blockEls[i].querySelector('h3'); const items = blockEls[i].querySelectorAll('.service-block-list li'); const link = blockEls[i].querySelector('.service-block-link'); if (k && b.kicker) k.textContent = b.kicker; if (heading && b.heading) heading.textContent = b.heading; if (link && typeof b.href === 'string' && b.href.trim()) link.setAttribute('href', b.href.trim()); const bItems = Array.isArray(b.items) ? b.items : (b.items ? Object.values(b.items) : []); bItems.forEach((item, j) => { if (items[j]) items[j].textContent = item; }); });

  const faq = fb.faq || {};
  const faqTitle = document.querySelector('.faq-section .section-title h2');
  if (faqTitle && (faq.title || faq.titleEmphasis)) faqTitle.innerHTML = `<span>${faq.title || ''}</span> <em>${faq.titleEmphasis || ''}</em>`;
  const faqSubtitle = document.querySelector('.faq-section .section-head p');
  if (faqSubtitle && faq.subtitle) faqSubtitle.textContent = faq.subtitle;
  // Markup only has 5 fixed FAQ slots — extra CMS items have nowhere to render.
  const faqItems = (Array.isArray(faq.items) ? faq.items : (faq.items ? Object.values(faq.items) : [])).slice(0, 5);
  const faqEls = document.querySelectorAll('.faq-item');
  faqItems.forEach((f, i) => { if (!faqEls[i]) return; const qSpan = faqEls[i].querySelector('.faq-question span:first-child'); const a = faqEls[i].querySelector('[data-faq-panel] p'); if (qSpan && f.question) qSpan.textContent = f.question; if (a && f.answer) a.textContent = f.answer; });

  const cta = fb.footerCta || {};
  const ctaTitle = document.querySelector('[data-footer-cta-title]');
  const ctaText = document.querySelector('[data-footer-cta-text]');
  const ctaButtonEl = document.querySelector('[data-footer-cta-button]');
  const ctaButtonLabel = ctaButtonEl?.querySelector('.footer-cta-label');
  if (ctaTitle && cta.title) ctaTitle.textContent = cta.title;
  if (ctaText && cta.text) ctaText.textContent = cta.text;
  if (ctaButtonLabel && cta.button) ctaButtonLabel.textContent = cta.button;

  // Email capture override
  const ec = fb.emailCapture;
  if (ec) {
    const eh = document.querySelector('.email-capture__heading');
    const es = document.querySelector('.email-capture__subtext');
    const eb = document.querySelector('.email-capture__form button[type="submit"]');
    if (eh && ec.promptHeading) eh.textContent = ec.promptHeading;
    if (es && ec.promptSubtext) es.textContent = ec.promptSubtext;
    if (eb && ec.buttonLabel) eb.textContent = ec.buttonLabel;
  }
}

const initApp = async () => {
  initNavToggle();

  const defaults = window.DEFAULT_CONTENT || {};

  if (defaults.nav) renderNav(defaults.nav);
  if (defaults.testimonials) renderSharedTestimonials(defaults.testimonials);
  if (defaults.engagement) renderEngagement(defaults.engagement);
  if (defaults.footer) renderFooter(defaults.footer);

  initFaqAccordion();
  initScrollAnimations();

  initEmailCapture({
    promptHeading: 'Want to see how we deliver?',
    promptSubtext: 'Get our services overview straight to your inbox.',
    buttonLabel: 'Get overview',
    triggerPercent: 0.65,
    storageKey: 'panasa_email_services_overview',
    crmDescription: 'Email capture: Services overview request (Services landing page)',
  });

  loadContent()
    .then((content) => {
      if (content.nav) renderNav(content.nav);
      if (content.testimonials) renderSharedTestimonials(content.testimonials);
      if (content.engagement) renderEngagement(content.engagement);
      if (content.footer) renderFooter(content.footer);

      initFaqAccordion();
      initScrollAnimations();
    })
    .catch(() => {});

  // Apply Firebase content
  try {
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js');
    const { getDatabase, ref, get } = await import('https://www.gstatic.com/firebasejs/11.1.0/firebase-database.js');
    const app = initializeApp(firebaseConfig, 'so-reader');
    const db = getDatabase(app);
    const snapshot = await get(ref(db, 'pages/servicesOverview'));
    if (snapshot.exists()) applyFirebaseData(snapshot.val());
  } catch (e) { console.warn('Firebase fetch failed for services overview', e); }
};

initApp();

// Live preview hook
if (new URLSearchParams(window.location.search).get('preview') === 'true') {
  window.__livePreviewRender = (data) => {
    try { applyFirebaseData(data); } catch (e) { console.warn('[live-preview] services-overview failed:', e); }
  };
}

window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    initScrollAnimations();
  }
});
