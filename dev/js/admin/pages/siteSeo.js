/**
 * Site-wide SEO settings — shared across every page on the site.
 *
 * Stored in Firebase at `pages/siteSEO`. Loaded by `dev/api/rebuild.php` on every
 * rebuild via `fetchSiteSEO()`, then applied to the static HTML by
 * `SiteSeoApplier.php` BEFORE the per-page MetaUpdater::update() call.
 *
 * Section keys are deliberately mapped to match the shape SiteSeoApplier expects:
 *   identity / twitter / verification / analytics  → flatten to top-level when read
 *   organization                                   → nested {orgName, orgUrl, …}
 *
 * After saving here, click "Rebuild every page" to propagate site-wide changes
 * to all static HTML files (otherwise they apply only on each page's next publish).
 */
const SITE_SEO_SECTIONS = [
  /* The first four sections all write to data root (not nested) so
     SiteSeoApplier sees `defaultOgImage`, `ga4Id`, etc. as top-level keys. */
  { key: 'identity', label: 'Site Identity', parentKey: '_root', fields: [
    { key: 'siteName', label: 'Site name', type: 'text',
      help: 'Used in og:site_name, default page-title suffix, and Schema.org Organization.name.' },
    { key: 'titleSeparator', label: 'Title separator', type: 'select',
      options: [' | ', ' — ', ' · ', ' / ', ' • '],
      help: 'Glue character between page title and site name.' },
    { key: 'defaultDescription', label: 'Default meta description', type: 'textarea',
      help: 'Fallback when a page does not set its own meta description.' },
    { key: 'defaultOgImage', label: 'Default social share image (URL)', type: 'text',
      help: 'Full URL to a 1200×630 image. Used when a page does not set its own og:image.' },
    { key: 'defaultOgLocale', label: 'Default locale', type: 'text',
      help: 'e.g. en_GB. Sets <meta property="og:locale">.' },
  ]},
  { key: 'twitter', label: 'Twitter / X', parentKey: '_root', fields: [
    { key: 'twitterSite', label: 'Site handle', type: 'text',
      help: 'e.g. @panasatech. Sets <meta name="twitter:site">.' },
    { key: 'twitterCreator', label: 'Default creator handle', type: 'text',
      help: 'e.g. @panasatech. Sets <meta name="twitter:creator">.' },
    { key: 'defaultTwitterCard', label: 'Default card type', type: 'select',
      options: ['summary', 'summary_large_image'],
      help: 'summary_large_image is the bigger preview card. Default for most blog/case-study pages.' },
  ]},
  { key: 'verification', label: 'Search Engine Verification', parentKey: '_root', fields: [
    { key: 'googleSearchConsole', label: 'Google verification token', type: 'text',
      help: 'The "content" string from the meta-tag verification method in Google Search Console.' },
    { key: 'bingWebmaster', label: 'Bing verification token', type: 'text',
      help: 'msvalidate.01 token from Bing Webmaster Tools.' },
    { key: 'yandex', label: 'Yandex verification token', type: 'text' },
    { key: 'pinterest', label: 'Pinterest verification token', type: 'text',
      help: 'p:domain_verify token from Pinterest.' },
  ]},
  { key: 'analytics', label: 'Analytics', parentKey: '_root', fields: [
    { key: 'ga4Id', label: 'Google Analytics 4 ID', type: 'text',
      help: 'Format: G-XXXXXXXXXX. Loads gtag.js on every page.' },
    { key: 'gtmId', label: 'Google Tag Manager ID', type: 'text',
      help: 'Format: GTM-XXXXXXX. Loads GTM container.' },
    { key: 'plausibleDomain', label: 'Plausible analytics domain', type: 'text',
      help: 'e.g. panasatech.com.' },
    { key: 'fathomSiteId', label: 'Fathom site ID', type: 'text',
      help: 'Fathom Analytics tracking script.' },
  ]},
  { key: 'sitemap', label: 'Sitemap — extra URLs', parentKey: '_root', fields: [
    { key: 'extraSitemapUrls', label: 'Manually-added URLs (subdomain pages, external resources)', type: 'sitemap-extras',
      help: 'Each entry is appended to sitemap.xml after the auto-generated entries. Per-article and per-static-page sitemap settings live on the page itself (toggle "Include in sitemap.xml" under SEO Meta).' },
  ]},
  /* This section nests under data.organization to match SiteSeoApplier::buildOrgJsonLd */
  { key: 'organization', label: 'Organization (Schema.org)', fields: [
    { key: 'orgName', label: 'Legal name', type: 'text' },
    { key: 'orgUrl', label: 'Canonical URL', type: 'text',
      help: 'Full https URL of the homepage.' },
    { key: 'orgLogo', label: 'Logo URL', type: 'text',
      help: 'Full URL to the company logo (used in Google knowledge-panel results).' },
    { key: 'orgDescription', label: 'One-line description', type: 'textarea' },
    { key: 'orgFounded', label: 'Year founded', type: 'text', help: 'e.g. 2018' },
    { key: 'orgEmail', label: 'Contact email', type: 'text' },
    { key: 'orgPhones', label: 'Contact phone numbers', type: 'string-list',
      help: 'One number per line. International format (e.g. +44 1273 977101).' },
    { key: 'orgAddress', label: 'Postal address', type: 'address' },
    { key: 'orgSameAs', label: 'Same-as URLs (LinkedIn, X, GitHub, …)', type: 'string-list',
      help: 'One per line. Helps search engines link your social profiles to your organization.' },
  ]},
];

export const fbPath  = 'pages/siteSEO';
export const sections = SITE_SEO_SECTIONS;
export const defaults = {
  siteName: 'Panasa Technology',
  titleSeparator: ' | ',
  defaultDescription: '',
  defaultOgImage: 'https://www.panasatech.com/assets/og-image.png',
  defaultOgLocale: 'en_GB',
  twitterSite: '',
  twitterCreator: '',
  defaultTwitterCard: 'summary_large_image',
  googleSearchConsole: '',
  bingWebmaster: '',
  yandex: '',
  pinterest: '',
  ga4Id: '',
  gtmId: '',
  plausibleDomain: '',
  fathomSiteId: '',
  extraSitemapUrls: [],
  organization: {
    orgName: 'Panasa Technology',
    orgUrl: 'https://www.panasatech.com',
    orgLogo: 'https://www.panasatech.com/assets/logo.svg',
    orgDescription: '',
    orgFounded: '',
    orgEmail: '',
    orgPhones: [],
    orgAddress: { street: '', city: '', region: '', postal: '', country: '' },
    orgSameAs: [],
  },
};
