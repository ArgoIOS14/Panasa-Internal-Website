import { initScrollAnimations } from './Home scenes/components/animations.js';
import './smooth-scroll.js';
import { loadContent } from './Home scenes/data/loadContent.js';
import { renderEngagement } from './Home scenes/sections/engagement.js';
import { renderFooter } from './Home scenes/sections/footer.js';
import { initNavToggle, renderNav } from './Home scenes/sections/nav.js';
import { renderSharedTestimonials } from './Home scenes/sections/sharedTestimonials.js';
import { initEmailCapture } from './Home scenes/components/email-capture.js';

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

const initApp = () => {
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
};

initApp();

window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    initScrollAnimations();
  }
});
