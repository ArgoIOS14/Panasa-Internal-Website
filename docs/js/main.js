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

const renderPage = (content) => {
  document.title = content.meta.title;

  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute('content', content.meta.description);

  renderNav(content.nav);
  renderHero(content.hero);
  renderServices(content.services);
  renderWhy(content.why);
  renderCaseStudies(content.caseStudies);
  renderTestimonials(content.testimonials);
  renderEngagement(content.engagement);
  renderFooter(content.footer);

  initCarousel();
  initScrollAnimations();
};

const initApp = () => {
  initNavToggle();

  // Render default content immediately for fast first paint
  if (window.DEFAULT_CONTENT) {
    renderPage(window.DEFAULT_CONTENT);
  }

  initEmailCapture({
    promptHeading: 'See how we delivered for a top issuer',
    promptSubtext: 'Get the full case study in your inbox.',
    buttonLabel: 'Get it free',
    triggerPercent: 0.6,
    storageKey: 'panasa_email_home',
    crmDescription: 'Email capture: Case study request (Home page)',
  });

  // Then try to fetch fresh content in the background
  loadContent()
    .then((content) => {
      renderPage(content);
    })
    .catch(() => {
      // Default content already rendered, nothing to do
    });
};

initApp();

window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    initScrollAnimations();
  }
});
