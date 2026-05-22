import { initScrollAnimations } from './Home scenes/components/animations.js';
import './smooth-scroll.js';
import { loadContent } from './Home scenes/data/loadContent.js';
import { initNavToggle, renderNav } from './Home scenes/sections/nav.js';
import { renderFooter } from './Home scenes/sections/footer.js';
import { renderResources } from './Home scenes/sections/resources.js';

// Live preview — only loaded in ?preview=true mode (admin panel iframe).
// The receiver module installs a `postMessage` listener that dispatches admin
// edits to `window.__livePreviewRender` (defined at the bottom of this file).
if (new URLSearchParams(window.location.search).get('preview') === 'true') {
  import('./live-preview-receiver.js').catch(() => { /* non-critical */ });
}

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
    // Apply meta title BEFORE rendering so the section can capture it as the
    // base for filter-prefixed titles ("Blogs | Resources | Panasa" etc.).
    if (fresh.meta?.title) {
      document.title = fresh.meta.title;
      if (document.body) delete document.body.dataset.resourcesBaseTitle;
    }
    renderResources(fresh);
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

/* Live preview hook — when the page is opened in the admin's iframe with
   ?preview=true, register a render handler that the live-preview-receiver
   dispatches to on every postMessage from the admin. Mirrors the pattern in
   contact.js / about.js / services.js / etc. */
if (new URLSearchParams(window.location.search).get('preview') === 'true') {
  window.__livePreviewRender = (data) => {
    try {
      if (data) {
        renderResources(data);
        if (data.meta?.title) document.title = data.meta.title;
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc && data.meta?.description) {
          metaDesc.setAttribute('content', data.meta.description);
        }
        // Re-run animations so newly-inserted resource cards fade-in cleanly.
        initScrollAnimations();
      }
    } catch (e) {
      console.warn('[live-preview] resources render failed:', e);
    }
  };
}

window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    initScrollAnimations();
  }
});
