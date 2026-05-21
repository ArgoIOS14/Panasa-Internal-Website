/* Case Study Detail entry — mirrors blog-detail.js / guide-detail.js.
   Loads JSON for the slug, renders the page, wires shared nav + footer + newsletter. */

window.STRAPI_URL = '../content/Home page/content.json';

import { initScrollAnimations } from './Home scenes/components/animations.js';
import './smooth-scroll.js';
import { loadContent } from './Home scenes/data/loadContent.js';
import { initNavToggle, renderNav } from './Home scenes/sections/nav.js';
import { renderFooter } from './Home scenes/sections/footer.js';
import { renderCaseStudyDetail } from './Home scenes/sections/caseStudyDetail.js';
import { initInlineNewsletter } from './Home scenes/components/inline-newsletter.js';

const RESOURCES_JSON_URL = '../content/Resources/content.json';

const getSlug = () =>
  document.querySelector('.case-study-detail-page')?.dataset.caseSlug ||
  (location.pathname.match(/\/case-studies\/([^/]+?)(?:\.html)?$/) || [])[1] ||
  '';

const loadCaseContent = async (slug) => {
  if (!slug) return null;
  try {
    const res = await fetch(`../content/Case Studies/${slug}.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.warn(`Falling back to default case study content for ${slug}:`, error);
    return window.DEFAULT_CASE_STUDY_CONTENT || null;
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
  cta: nav.cta ? { ...nav.cta, href: resolveToSiteHref(nav.cta.href) } : nav.cta,
});

const initCaseStudyDetail = async () => {
  initNavToggle();
  initScrollAnimations();

  const slug = getSlug();

  const fallback = window.DEFAULT_CASE_STUDY_CONTENT;
  if (fallback) renderCaseStudyDetail(fallback, window.DEFAULT_RESOURCES_CONTENT);

  const [fresh, resources] = await Promise.all([loadCaseContent(slug), loadResourcesIndex()]);
  if (fresh) renderCaseStudyDetail(fresh, resources || window.DEFAULT_RESOURCES_CONTENT);

  initInlineNewsletter({
    formSelector: '[data-case-newsletter]',
    crmDescription: `Newsletter: Case Study (${slug || 'unknown slug'})`,
    storageKey: 'panasa_newsletter_case_study',
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

  /* Case-study pages live one folder deep; nav-mobile-brand asset paths come
     from shared content with a bare `assets/...` prefix and need rebasing. */
  document.querySelectorAll('.nav-mobile-brand img').forEach((img) => {
    const src = img.getAttribute('src') || '';
    if (src && !src.startsWith('/') && !src.startsWith('..') && !src.startsWith('http')) {
      img.setAttribute('src', `../${src}`);
    }
  });

  initScrollAnimations();

  const syncLenis = () => window.lenis?.resize?.();
  requestAnimationFrame(syncLenis);
  if (document.fonts?.ready?.then) document.fonts.ready.then(syncLenis);
};

initCaseStudyDetail();

window.addEventListener('pageshow', (event) => {
  if (event.persisted) initScrollAnimations();
});
