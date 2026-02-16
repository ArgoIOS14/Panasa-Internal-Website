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
