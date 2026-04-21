import { initScrollAnimations } from './Home scenes/components/animations.js';
import './smooth-scroll.js';
import { loadContent } from './Home scenes/data/loadContent.js';
import { initNavToggle, renderNav } from './Home scenes/sections/nav.js';
import { renderFooter } from './Home scenes/sections/footer.js';
import { renderResources } from './Home scenes/sections/resources.js';

const RESOURCES_JSON_URL = 'content/Resources/content.json';

const loadResourcesContent = async () => {
  try {
    const res = await fetch(RESOURCES_JSON_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.warn('Falling back to default Resources content:', error);
    return window.DEFAULT_RESOURCES_CONTENT || null;
  }
};

const resolveToSiteHref = (href) => {
  if (!href) return href;
  if (href === '#about') return 'about';
  if (href === '#services') return 'ai-accelerated-fintech-engineering';
  if (href === '#resources') return 'resources';
  if (href.startsWith('#')) return `/${href}`;
  return href;
};

const buildFooterLinks = (footer) => ({
  ...footer,
  columns: (footer?.columns || []).map((column) => ({
    ...column,
    links: (column.links || []).map((link) => ({
      ...link,
      href: resolveToSiteHref(link.href),
    })),
  })),
});

const initResources = async () => {
  initNavToggle();
  initScrollAnimations();

  // Render Resources section with fallback content immediately so the page
  // paints real content even if the network fetch is slow.
  const fallback = window.DEFAULT_RESOURCES_CONTENT;
  if (fallback) renderResources(fallback);

  const fresh = await loadResourcesContent();
  if (fresh && fresh !== fallback) {
    renderResources(fresh);
    if (fresh.meta?.title) document.title = fresh.meta.title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && fresh.meta?.description) {
      metaDesc.setAttribute('content', fresh.meta.description);
    }
  }

  // Shared nav + footer come from the Home content.json
  try {
    const home = await loadContent();
    if (home?.nav) renderNav(home.nav);
    if (home?.footer) renderFooter(buildFooterLinks(home.footer));
  } catch (error) {
    console.error('Failed to load shared nav/footer content', error);
    if (window.DEFAULT_CONTENT?.nav) renderNav(window.DEFAULT_CONTENT.nav);
    if (window.DEFAULT_CONTENT?.footer) {
      renderFooter(buildFooterLinks(window.DEFAULT_CONTENT.footer));
    }
  }

  // Re-run scroll animations now that new DOM has been inserted
  initScrollAnimations();
};

initResources();

window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    initScrollAnimations();
  }
});
