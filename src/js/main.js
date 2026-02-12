import { initScrollAnimations } from './components/animations.js';
import { initCarousel } from './components/carousel.js';
import { loadContent } from './data/loadContent.js';
import { renderCaseStudies } from './sections/caseStudies.js';
import { renderEngagement } from './sections/engagement.js';
import { renderFooter } from './sections/footer.js';
import { renderHero } from './sections/hero.js';
import { initNavToggle, renderNav } from './sections/nav.js';
import { renderServices } from './sections/services.js';
import { renderTestimonials } from './sections/testimonials.js';
import { renderWhy } from './sections/why.js';

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
};

const initApp = async () => {
  initNavToggle();
  initScrollAnimations();

  try {
    const content = await loadContent();
    renderPage(content);
  } catch (err) {
    console.error('Failed to load content.json', err);
    if (window.DEFAULT_CONTENT) renderPage(window.DEFAULT_CONTENT);
  }
};

initApp();
