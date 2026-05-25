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
    tag: 'CASE STUDY',
    tagClass: 'case-study',
    title: '',
    date: '',
    author: 'Panasa Team',
    image: '',
    href: '',
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
  { key: 'featured', label: 'Featured Card', fields: [
    { key: 'tag', label: 'Tag (uppercase pill)', type: 'text',
      help: 'Small uppercase label on the featured card (e.g. "CASE STUDY", "BLOG").' },
    { key: 'tagClass', label: 'Tag CSS class', type: 'text',
      help: 'Drives the pill colour. Use one of: case-study, blog, insights, guide.' },
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'date', label: 'Date (display string, e.g. 30 APR 2026)', type: 'text' },
    { key: 'author', label: 'Author', type: 'text' },
    { key: 'image', label: 'Cover image', type: 'image' },
    { key: 'href', label: 'Article link (e.g. case-studies/osper-family-banking)', type: 'text',
      help: 'Path without leading slash. Examples: blog/anatomy-of-a-swipe, case-studies/osper-family-banking.' },
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
