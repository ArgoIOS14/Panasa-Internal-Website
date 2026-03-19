import { initScrollAnimations } from './Home scenes/components/animations.js';
import { loadContent } from './Home scenes/data/loadContent.js';
import { initNavToggle, renderNav } from './Home scenes/sections/nav.js';

const initCareers = async () => {
  initNavToggle();
  initScrollAnimations();

  try {
    const content = await loadContent();
    renderNav(content.nav);
  } catch (err) {
    console.error('Failed to load shared nav content', err);
    if (window.DEFAULT_CONTENT?.nav) renderNav(window.DEFAULT_CONTENT.nav);
  }
};

initCareers();
