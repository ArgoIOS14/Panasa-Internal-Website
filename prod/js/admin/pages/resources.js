import { SEO_META_EXTRAS } from './seoMetaFields.js';
import { STRUCTURED_DATA_SECTION } from './structuredDataSection.js';

export const fbPath = 'pages/resources';

export const defaults = {
  meta: {
    title: 'Resources | Panasa',
    description: 'Explore expert insights, real-world case studies, and proven strategies to design, build, and scale secure fintech platforms.',
    keywords: [],
    canonical: '',
    robots: 'index,follow',
    ogImage: '',
    ogType: 'website',
    twitterCard: 'summary_large_image',
    includeInSitemap: true,
    sitemapPriority: '',
    sitemapChangefreq: '',
    hreflang: [],
  },
  hero: {
    titleLine1: 'Where Fintech Teams',
    titleLine2: 'Learn, Build, and Scale Faster',
    subtitle: 'Explore expert insights, real-world case studies, and proven strategies to design, build, and scale secure fintech platforms.',
  },
  filters: ['All', 'Blogs', 'Insights', 'Guides', 'Case Studies'],
  activeFilter: 'All',
  pagination: {
    defaultRowsPerPage: 2,
    rowsPerPageOptions: [2, 4, 8],
  },
};

export const sections = [
  { key: 'meta', label: 'SEO Meta', fields: [
    { key: 'title', label: 'Meta title', type: 'text' },
    { key: 'description', label: 'Meta description', type: 'textarea' },
    ...SEO_META_EXTRAS,
  ]},
  { key: 'hero', label: 'Hero', fields: [
    { key: 'titleLine1', label: 'Title line 1', type: 'text' },
    { key: 'titleLine2', label: 'Title line 2', type: 'text' },
    { key: 'subtitle', label: 'Subtitle', type: 'textarea' },
  ]},
  { key: 'filters_sect', label: 'Filter Tabs', parentKey: '_root', fields: [
    { key: 'filters', label: 'Filter labels', type: 'string-list',
      help: 'Reordering or renaming "All", "Blogs", "Insights", "Guides", "Case Studies" is safe. Adding a brand-new label beyond these 5 needs a matching code change first (tag color, "Read more" icon, and card background are wired per-category in resources.js/feature-card.css) — otherwise the new category silently renders with Blog styling.' },
    { key: 'activeFilter', label: 'Default active filter', type: 'text' },
  ]},
  { key: 'pagination', label: 'Pagination', fields: [
    { key: 'defaultRowsPerPage', label: 'Rows per page (default)', type: 'text' },
    { key: 'rowsPerPageOptions', label: 'Rows-per-page options (numbers)', type: 'string-list' },
  ]},
  STRUCTURED_DATA_SECTION,
];
