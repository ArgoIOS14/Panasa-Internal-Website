// Override the shared home-content fetch URL because we're in a /blog/ subfolder.
// loadContent() reads this before making the request.
window.STRAPI_URL = '../content/Home page/content.json';

import { initScrollAnimations } from './Home scenes/components/animations.js';
import './smooth-scroll.js';
import { loadContent } from './Home scenes/data/loadContent.js';
import { initNavToggle, renderNav } from './Home scenes/sections/nav.js';
import { renderFooter } from './Home scenes/sections/footer.js';
import { renderBlogDetail } from './Home scenes/sections/blogDetail.js';
import { initInlineNewsletter } from './Home scenes/components/inline-newsletter.js';

const RESOURCES_JSON_URL = '../content/Resources/content.json';

const getSlug = () =>
  document.querySelector('.blog-detail-page')?.dataset.blogSlug ||
  // Match either /blog/<slug> or /insights/<slug> — both content types share
  // this renderer; the URL prefix is the only thing that differs.
  (location.pathname.match(/\/(?:blog|insights)\/([^/]+?)(?:\.html)?$/) || [])[1] ||
  '';

// Insights pages are served from /insights/, blog pages from /blog/ — the
// admin rebuild pipeline (PageRegistry.php) writes NEW insight articles' JSON
// to content/Insights/, while the pre-existing live insight articles still
// have their JSON under content/Blog/ (legacy, before the Insights folder
// split existed). Try the folder matching the current page type first, then
// fall back to the other folder so neither legacy nor newly-published
// articles 404.
const isInsightsPage = () => /\/insights\//.test(location.pathname);

const loadBlogContent = async (slug) => {
  if (!slug) return null;
  const primaryFolder = isInsightsPage() ? 'Insights' : 'Blog';
  const fallbackFolder = primaryFolder === 'Insights' ? 'Blog' : 'Insights';
  for (const folder of [primaryFolder, fallbackFolder]) {
    try {
      const res = await fetch(`../content/${folder}/${slug}.json`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (error) {
      if (folder === fallbackFolder) {
        console.warn(`Falling back to default blog content for ${slug}:`, error);
      }
    }
  }
  return window.DEFAULT_BLOG_CONTENT || null;
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

const resolveToSiteHref = (href) => {
  if (!href) return href;
  if (href === '#about') return '../about';
  if (href === '#services') return '../ai-accelerated-fintech-engineering';
  if (href === '#resources') return '../resources';
  if (href === '/') return '../';
  if (href.startsWith('#')) return href;
  // Blog detail pages live at /blog/<slug>, so all same-level site links need `../` prefix
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

const initBlogDetail = async () => {
  initNavToggle();
  initScrollAnimations();

  const slug = getSlug();

  // Render from fallback immediately so the page paints fast
  const fallbackBlog = window.DEFAULT_BLOG_CONTENT;
  if (fallbackBlog) {
    renderBlogDetail(fallbackBlog, window.DEFAULT_RESOURCES_CONTENT);
  }

  // Fetch fresh content in parallel
  const [freshBlog, freshResources] = await Promise.all([
    loadBlogContent(slug),
    loadResourcesIndex(),
  ]);

  if (freshBlog) {
    renderBlogDetail(freshBlog, freshResources || window.DEFAULT_RESOURCES_CONTENT);
  }

  // Inline newsletter — same Zoho endpoint as the home modal
  initInlineNewsletter({
    formSelector: '[data-blog-newsletter]',
    crmDescription: `Newsletter: Blog (${slug || 'unknown slug'})`,
    storageKey: `panasa_newsletter_blog`,
  });

  // Shared nav + footer from the Home content
  try {
    const home = await loadContent();
    if (home?.nav) renderNav(buildNavLinks(home.nav));
    if (home?.footer) renderFooter(buildFooterLinks(home.footer));
  } catch (error) {
    console.error('Failed to load shared nav/footer content', error);
    if (window.DEFAULT_CONTENT?.nav) renderNav(buildNavLinks(window.DEFAULT_CONTENT.nav));
    if (window.DEFAULT_CONTENT?.footer) renderFooter(buildFooterLinks(window.DEFAULT_CONTENT.footer));
  }

  // Fix asset paths injected by shared renderers — we're one directory deep
  // so any `assets/...` reference needs a `../` prefix to resolve correctly.
  document.querySelectorAll('.nav-mobile-brand img').forEach((img) => {
    const src = img.getAttribute('src') || '';
    if (src && !src.startsWith('/') && !src.startsWith('..') && !src.startsWith('http')) {
      img.setAttribute('src', `../${src}`);
    }
  });

  initScrollAnimations();

  /* Body renders async (fetch → renderBlogDetail), so Lenis — which measures
     page height at init — can end up with a stale `limit` and refuse to
     scroll past it. Re-measure after the body is in the DOM. */
  const syncLenis = () => window.lenis?.resize?.();
  requestAnimationFrame(syncLenis);
  if (document.fonts?.ready?.then) document.fonts.ready.then(syncLenis);
};

initBlogDetail();

window.addEventListener('pageshow', (event) => {
  if (event.persisted) initScrollAnimations();
});
