/**
 * Shared SEO meta fields appended to every page's `meta` section.
 *
 * Each page schema imports `SEO_META_EXTRAS` and spreads it into its `meta`
 * section's `fields` array, after the page-specific title + description.
 * MetaUpdater.php (extended in Phase 1a) reads these as keys on `data.meta`.
 *
 * Site-wide defaults from `pages/siteSEO` fill in for any field left blank
 * (handled by SiteSeoApplier before MetaUpdater runs).
 */
export const SEO_META_EXTRAS = [
  { key: 'keywords', label: 'Meta keywords', type: 'string-list',
    help: 'One per line. Bing/Yandex still use these; Google ignores. Example: fintech, payments, AI.' },

  { key: 'canonical', label: 'Canonical URL', type: 'text',
    help: 'The full URL where this page lives. Leave blank to auto-derive (recommended for most pages). Set explicitly only when content is duplicated across multiple URLs.' },

  { key: 'robots', label: 'Robots directive', type: 'select',
    options: ['index,follow', 'noindex,follow', 'index,nofollow', 'noindex,nofollow'],
    help: 'Default: index,follow. Use noindex on staging/test pages to keep them out of search results.' },

  { key: 'ogImage', label: 'Social share image (URL)', type: 'text',
    help: '1200×630px works best for LinkedIn/X/WhatsApp previews. Leave blank to use the site default from Site SEO.' },

  { key: 'ogType', label: 'OG type', type: 'select',
    options: ['website', 'article'],
    help: 'website for static pages, article for blog/insight/guide/case-study posts. Auto-set to "article" by article schemas.' },

  { key: 'twitterCard', label: 'Twitter card style', type: 'select',
    options: ['summary', 'summary_large_image'],
    help: 'summary_large_image shows a bigger preview. summary is the small/inline card.' },

  { key: 'includeInSitemap', label: 'Include in sitemap.xml', type: 'toggle',
    help: 'Off for staging/test pages, thank-you pages, or anything you don\'t want crawled.' },

  { key: 'sitemapPriority', label: 'Sitemap priority', type: 'select',
    options: ['', '0.4', '0.5', '0.6', '0.7', '0.8', '0.9', '1.0'],
    help: 'Leave blank for auto: 1.0 home, 0.9 services, 0.8 about/resources/case-studies/guides, 0.7 blog/insights, 0.4 privacy.' },

  { key: 'sitemapChangefreq', label: 'Sitemap changefreq', type: 'select',
    options: ['', 'never', 'yearly', 'monthly', 'weekly', 'daily', 'always'],
    help: 'Leave blank for auto. Most pages: monthly; resources: weekly.' },

  { key: 'hreflang', label: 'Hreflang alternates', type: 'hreflang-list',
    help: 'For multilingual sites — leave empty if the site is single-language. One row per locale + URL.' },
];
