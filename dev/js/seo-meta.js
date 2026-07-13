/* Shared SEO Meta application helper for the Services pages (services.js +
   services-overview.js). Mirrors the established pattern already used in
   `Home scenes/sections/caseStudyDetail.js` (`updateSeoMeta`/`setMeta`/
   `ensureMeta`): only overwrite a <head> tag when the admin-authored `meta`
   object supplies a non-empty value, so a blank/missing CMS field leaves the
   page's hardcoded <head> tags untouched. <head> tags aren't rendered UI, so
   applying them doesn't change page appearance. */

const setMeta = (selector, value) => {
  if (typeof value !== 'string' || !value.trim()) return;
  const el = document.querySelector(selector);
  if (el) el.setAttribute('content', value.trim());
};

const ensureMeta = (attr, name, value) => {
  if (typeof value !== 'string' || !value.trim()) return;
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', value.trim());
};

const ensureLink = (rel, value) => {
  if (typeof value !== 'string' || !value.trim()) return;
  let el = document.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', value.trim());
};

/** Applies an admin `meta` (SEO Meta section) object to the current
 * document's <head>. Defensive: does nothing for a missing/blank `meta`,
 * and leaves any tag untouched when the corresponding CMS field is blank. */
export const applySeoMeta = (meta) => {
  if (!meta || typeof meta !== 'object') return;

  const { title, description, canonical, ogImage, robots } = meta;

  if (typeof title === 'string' && title.trim()) {
    document.title = title.trim();
    setMeta('meta[property="og:title"]', title);
    setMeta('meta[name="twitter:title"]', title);
  }
  if (typeof description === 'string' && description.trim()) {
    ensureMeta('name', 'description', description);
    setMeta('meta[property="og:description"]', description);
    setMeta('meta[name="twitter:description"]', description);
  }
  if (typeof canonical === 'string' && canonical.trim()) {
    ensureLink('canonical', canonical);
    setMeta('meta[property="og:url"]', canonical);
  }
  if (typeof ogImage === 'string' && ogImage.trim()) {
    setMeta('meta[property="og:image"]', ogImage);
    setMeta('meta[name="twitter:image"]', ogImage);
  }
  if (typeof robots === 'string' && robots.trim()) {
    ensureMeta('name', 'robots', robots);
  }
};
