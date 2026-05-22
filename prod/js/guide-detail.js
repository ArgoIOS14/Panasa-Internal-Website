// Override the shared home-content fetch URL because we're in a /guides/ subfolder.
window.STRAPI_URL = '../content/Home page/content.json';

import { initScrollAnimations } from './Home scenes/components/animations.js';
import './smooth-scroll.js';
import { loadContent } from './Home scenes/data/loadContent.js';
import { initNavToggle, renderNav } from './Home scenes/sections/nav.js';
import { renderFooter } from './Home scenes/sections/footer.js';
import { renderGuideDetail } from './Home scenes/sections/guideDetail.js';
import { initInlineNewsletter } from './Home scenes/components/inline-newsletter.js';

// Live preview — only loaded in ?preview=true mode (admin panel iframe).
if (new URLSearchParams(window.location.search).get('preview') === 'true') {
  import('./live-preview-receiver.js').catch(() => { /* non-critical */ });
}

const RESOURCES_JSON_URL = '../content/Resources/content.json';

const getSlug = () =>
  document.querySelector('.guide-detail-page')?.dataset.guideSlug ||
  (location.pathname.match(/\/guides\/([^/]+?)(?:\.html)?$/) || [])[1] ||
  '';

const loadGuideContent = async (slug) => {
  if (!slug) return null;
  try {
    const res = await fetch(`../content/Guide/${slug}.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.warn(`Falling back to default guide content for ${slug}:`, error);
    return window.DEFAULT_GUIDE_CONTENT || null;
  }
};

const loadResourcesIndex = async () => {
  try {
    const res = await fetch(RESOURCES_JSON_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (_) {
    return window.DEFAULT_RESOURCES_CONTENT || null;
  }
};

/* Guide pages live one level deep (/guides/<slug>), so same-level site links
   need the `../` prefix used elsewhere. Matches blog-detail.js. */
const resolveToSiteHref = (href) => {
  if (!href) return href;
  if (href === '#about') return '../about';
  if (href === '#services') return '../ai-accelerated-fintech-engineering';
  if (href === '#resources') return '../resources';
  if (href === '/') return '../';
  if (href.startsWith('#')) return href;
  if (!href.startsWith('..') && !href.startsWith('/') && !href.startsWith('http')) {
    return `../${href}`;
  }
  return href;
};

const buildFooterLinks = (footer) => ({
  ...footer,
  ctaHref: footer?.ctaHref ? resolveToSiteHref(footer.ctaHref) : footer?.ctaHref,
  columns: (footer?.columns || []).map((column) => ({
    ...column,
    links: (column.links || []).map((link) => ({
      ...link,
      href: resolveToSiteHref(link.href),
    })),
  })),
  legal: footer?.legal
    ? {
        ...footer.legal,
        links: (footer.legal.links || []).map((link) => ({
          ...link,
          href: resolveToSiteHref(link.href),
        })),
      }
    : footer?.legal,
});

const buildNavLinks = (nav) => ({
  ...nav,
  links: (nav.links || []).map((link) => ({
    ...link,
    href: resolveToSiteHref(link.href),
    children: (link.children || []).map((child) => ({
      ...child,
      href: resolveToSiteHref(child.href),
    })),
  })),
  cta: nav.cta
    ? { ...nav.cta, href: resolveToSiteHref(nav.cta.href) }
    : nav.cta,
});

const initGuideDetail = async () => {
  initNavToggle();
  initScrollAnimations();

  const slug = getSlug();

  const fallbackGuide = window.DEFAULT_GUIDE_CONTENT;
  if (fallbackGuide) {
    renderGuideDetail(fallbackGuide, window.DEFAULT_RESOURCES_CONTENT);
  }

  const [freshGuide, freshResources] = await Promise.all([
    loadGuideContent(slug),
    loadResourcesIndex(),
  ]);

  if (freshGuide) {
    renderGuideDetail(freshGuide, freshResources || window.DEFAULT_RESOURCES_CONTENT);
  }

  initInlineNewsletter({
    formSelector: '[data-guide-newsletter]',
    crmDescription: `Newsletter: Guide (${slug || 'unknown slug'})`,
    storageKey: `panasa_newsletter_guide`,
  });

  try {
    const home = await loadContent();
    if (home?.nav) renderNav(buildNavLinks(home.nav));
    if (home?.footer) renderFooter(buildFooterLinks(home.footer));
  } catch (error) {
    console.error('Failed to load shared nav/footer content', error);
    if (window.DEFAULT_CONTENT?.nav) renderNav(buildNavLinks(window.DEFAULT_CONTENT.nav));
    if (window.DEFAULT_CONTENT?.footer) renderFooter(buildFooterLinks(window.DEFAULT_CONTENT.footer));
  }

  document.querySelectorAll('.nav-mobile-brand img').forEach((img) => {
    const src = img.getAttribute('src') || '';
    if (src && !src.startsWith('/') && !src.startsWith('..') && !src.startsWith('http')) {
      img.setAttribute('src', `../${src}`);
    }
  });

  initScrollAnimations();

  /* Guide body renders async (fetch → renderGuideDetail), so Lenis — which
     measures page height at init — ends up with a stale `limit` and refuses
     to scroll past it. Re-measure after the body is in the DOM. A second
     resize after fonts load catches the layout shift. */
  const syncLenis = () => window.lenis?.resize?.();
  requestAnimationFrame(syncLenis);
  if (document.fonts?.ready?.then) document.fonts.ready.then(syncLenis);
};

initGuideDetail();

/* Live preview render handler — called by live-preview-receiver on every
   admin edit. Re-renders the guide with the in-flight admin data
   (meta, hero, title + accent, intro, sticky-bar sections, related). */
if (new URLSearchParams(window.location.search).get('preview') === 'true') {
  window.__livePreviewRender = (data) => {
    try {
      if (data) {
        const resources = window.DEFAULT_RESOURCES_CONTENT || null;
        renderGuideDetail(data, resources);
        if (data.meta?.title) document.title = data.meta.title;
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc && data.meta?.description) {
          metaDesc.setAttribute('content', data.meta.description);
        }
        initScrollAnimations();
      }
    } catch (e) {
      console.warn('[live-preview] guide render failed:', e);
    }
  };
}

window.addEventListener('pageshow', (event) => {
  if (event.persisted) initScrollAnimations();
});
