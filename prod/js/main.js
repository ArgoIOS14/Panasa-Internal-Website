import { initScrollAnimations } from './Home scenes/components/animations.js';
import { initCarousel } from './Home scenes/components/carousel.js';
import { loadContent } from './Home scenes/data/loadContent.js';
import { renderCaseStudies } from './Home scenes/sections/caseStudies.js';
import { renderEngagement } from './Home scenes/sections/engagement.js';
import { renderFooter } from './Home scenes/sections/footer.js';
import { renderHero } from './Home scenes/sections/hero.js';
import { initNavToggle, renderNav } from './Home scenes/sections/nav.js';
import { renderServices } from './Home scenes/sections/services.js';
import { renderTestimonials } from './Home scenes/sections/testimonials.js';
import { renderWhy } from './Home scenes/sections/why.js';
import { initEmailCapture } from './Home scenes/components/email-capture.js';
import './smooth-scroll.js'; // side-effect: auto-initializes Lenis (falls back to native scroll on touch / reduced-motion)

// Live preview — only loaded in ?preview=true mode (admin panel iframe)
if (new URLSearchParams(window.location.search).get('preview') === 'true') {
  import('./live-preview-receiver.js').catch(() => { /* non-critical */ });
}

/* ── Section keys and their render functions ──────────────── */

const SECTION_KEYS = ['nav', 'hero', 'services', 'why', 'caseStudies', 'testimonials', 'engagement', 'footer'];

const SECTION_RENDERERS = {
  nav: renderNav,
  hero: renderHero,
  services: renderServices,
  why: renderWhy,
  caseStudies: renderCaseStudies,
  testimonials: renderTestimonials,
  engagement: renderEngagement,
  footer: renderFooter,
};

/* ── Live preview hook (only active when ?preview=true) ────── */

const _livePreviewHashes = {};

window.__livePreviewRender = (content) => {
  if (!content || typeof content !== 'object') return;
  let anyChanged = false;
  for (const [key, render] of Object.entries(SECTION_RENDERERS)) {
    if (content[key] === undefined) continue;
    const hash = JSON.stringify(content[key]);
    if (hash === _livePreviewHashes[key]) continue;
    try { render(content[key]); _livePreviewHashes[key] = hash; anyChanged = true; }
    catch (e) { console.warn('[live-preview] ' + key + ' failed:', e); }
  }
  if (content.meta?.title && document.title !== content.meta.title) {
    document.title = content.meta.title;
  }
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc && content.meta?.description) {
    metaDesc.setAttribute('content', content.meta.description);
  }
  if (anyChanged) {
    try { initCarousel(); } catch (e) {}
    try { initScrollAnimations(); } catch (e) {}
  }
};

/* ── App init ─────────────────────────────────────────────── */

const initApp = () => {
  initNavToggle();

  const defaults = window.DEFAULT_CONTENT || {};

  // Pre-compute stringified defaults for comparison
  const defaultHashes = {};
  for (const key of SECTION_KEYS) {
    if (defaults[key]) defaultHashes[key] = JSON.stringify(defaults[key]);
  }

  // Homepage is pre-rendered in HTML — no need for initial renderPage().
  // Only testimonials and engagement need JS init for interactivity
  // (responsive carousel, filter state machine). Content matches HTML
  // so there is no visual flash.
  if (defaults.testimonials) renderTestimonials(defaults.testimonials);
  if (defaults.engagement) renderEngagement(defaults.engagement);

  // Init carousels and scroll animations on pre-rendered DOM
  initCarousel();
  initScrollAnimations();

  initEmailCapture({
    promptHeading: 'See how we delivered for a top issuer',
    promptSubtext: 'Get the full case study in your inbox.',
    buttonLabel: 'Get it free',
    triggerPercent: 0.6,
    storageKey: 'panasa_email_home',
    crmDescription: 'Email capture: Case study request (Home page)',
  });

  // Fetch fresh content — only re-render sections that changed
  loadContent()
    .then((content) => {
      let anyChanged = false;

      for (const key of SECTION_KEYS) {
        const freshJson = JSON.stringify(content[key]);
        if (freshJson !== defaultHashes[key]) {
          SECTION_RENDERERS[key](content[key]);
          anyChanged = true;
        }
      }

      // Update meta only if changed
      if (content.meta?.title !== defaults.meta?.title) {
        document.title = content.meta.title;
      }
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc && content.meta?.description !== defaults.meta?.description) {
        metaDesc.setAttribute('content', content.meta.description);
      }

      // Re-init carousels and animations only if DOM was changed
      if (anyChanged) {
        initCarousel();
        initScrollAnimations();
      }
    })
    .then((content) => {
      // Override email capture popup if Firebase has data
      const ec = content?.emailCapture;
      if (ec) {
        const h = document.querySelector('.email-capture__heading');
        const s = document.querySelector('.email-capture__subtext');
        const b = document.querySelector('.email-capture__form button[type="submit"]');
        if (h && ec.promptHeading) h.textContent = ec.promptHeading;
        if (s && ec.promptSubtext) s.textContent = ec.promptSubtext;
        if (b && ec.buttonLabel) b.textContent = ec.buttonLabel;
      }
    })
    .catch(() => {
      // Pre-rendered content already visible, nothing to do
    });
};

initApp();

window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    initScrollAnimations();
  }
});
