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
  featured: {
    ref: null,
    tag: '',
    tagClass: '',
    title: '',
    date: '',
    author: '',
    image: '',
    href: '',
  },
  filters: ['All', 'Blogs', 'Insights', 'Guides', 'Case Studies'],
  activeFilter: 'All',
  pagination: {
    defaultRowsPerPage: 2,
    rowsPerPageOptions: ['2', '4', '8'],
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
  { key: 'featured', label: 'Featured Card', fields: [
    { key: 'ref', label: 'Featured article (auto-fills the card)', type: 'article-picker' },
  ]},
  { key: 'filters_sect', label: 'Filter Tabs', parentKey: '_root', fields: [
    { key: 'filters', label: 'Filter labels', type: 'string-list' },
    { key: 'activeFilter', label: 'Default active filter', type: 'text' },
  ]},
  { key: 'pagination', label: 'Pagination', fields: [
    { key: 'defaultRowsPerPage', label: 'Rows per page (default)', type: 'text' },
    { key: 'rowsPerPageOptions', label: 'Rows-per-page options (numbers)', type: 'string-list' },
  ]},
  STRUCTURED_DATA_SECTION,
];
