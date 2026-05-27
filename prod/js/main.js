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
import { initHeroAnimation } from './Home scenes/components/hero-animation.js?v=hero20';
import './smooth-scroll.js'; // side-effect: auto-initializes Lenis (falls back to native scroll on touch / reduced-motion)

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
  initHeroAnimation();

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
