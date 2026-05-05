import { newArticleDefaults, typeUrlPrefix } from './articleHelpers.js';
import { SEO_META_EXTRAS } from './seoMetaFields.js';
import { STRUCTURED_DATA_SECTION } from './structuredDataSection.js';

const BLOG_SECTIONS = [
  { key: 'meta', label: 'SEO Meta', fields: [
    { key: 'title', label: 'Meta title', type: 'text', required: true, charCount: { min: 30, max: 60 },
      help: 'Shown in the browser tab + Google search results. Aim for under 60 characters.' },
    { key: 'description', label: 'Meta description', type: 'textarea', required: true, charCount: { min: 120, max: 160 },
      help: 'One-paragraph summary shown under the title in Google + social shares. 150–160 characters work best.' },
    ...SEO_META_EXTRAS,
  ]},
  { key: 'identity', label: 'Article Identity', parentKey: '_root', fields: [
    { key: 'title', label: 'Title', type: 'text', required: true },
    { key: 'category', label: 'Category', type: 'text',
      help: 'Drives the tag color and the resources card filter. Usually "Blog" or "Insights".' },
    { key: 'tag', label: 'Tag (uppercase pill)', type: 'text',
      help: 'Small uppercase pill at the top of the resources card. Defaults to "BLOG" / "INSIGHTS".' },
    { key: 'date', label: 'Display date (e.g. 21 APR 2026)', type: 'text',
      help: 'Free-form display date shown on the resources card.' },
    { key: 'datePublished', label: 'Date published', type: 'date',
      help: 'Used for SEO (article:published_time + JSON-LD datePublished).' },
    { key: 'dateModified', label: 'Date modified', type: 'date',
      help: 'Used for SEO (article:modified_time). Set to today after a meaningful edit.' },
    { key: 'readTime', label: 'Read time (e.g. 5 MINS READ)', type: 'text',
      help: 'Estimated reading time. Rule of thumb: 1 minute per 200 words.' },
    { key: 'author', label: 'Author', type: 'text' },
    { key: 'tags', label: 'Tags', type: 'string-list',
      help: 'Comma-separated list of topic tags. Used for SEO meta keywords + on-page article tag list.' },
  ]},
  { key: 'hero', label: 'Hero image', parentKey: '_root', fields: [
    { key: 'heroImage', label: 'Hero (desktop)', type: 'image' },
    { key: 'heroImageTablet', label: 'Hero (tablet)', type: 'image' },
    { key: 'heroImageMobile', label: 'Hero (mobile)', type: 'image' },
    { key: 'heroImageAlt', label: 'Hero alt text', type: 'text',
      help: 'Accessibility text describing the hero image. Read aloud by screen readers.' },
  ]},
  { key: 'body', label: 'Article Body', parentKey: '_root', fields: [
    { key: 'body', label: 'Body blocks', type: 'blocks', allowedTypes: ['html', 'callout', 'youtube'],
      help: 'Add Rich Text, Callout, or YouTube blocks. Drag to reorder.' },
  ]},
  { key: 'related', label: 'Related Articles', parentKey: '_root', fields: [
    { key: 'relatedSlugs', label: 'Pick related articles to feature at the bottom', type: 'related-articles',
      help: 'Up to 3 of these will appear in the "More" grid at the bottom of the article.' },
  ]},
  STRUCTURED_DATA_SECTION,
];

export function configFor(type, slug) {
  return {
    fbPath: `pages/articles/${type}/${slug}`,
    sections: BLOG_SECTIONS,
    defaults: newArticleDefaults(type, slug),
    previewUrl: `/${typeUrlPrefix(type)}/${slug}.html`,
    pageKey: `${type}:${slug}`,
    articleType: type,
    articleSlug: slug,
  };
}
