import { newArticleDefaults, typeUrlPrefix } from './articleHelpers.js';

const BLOG_SECTIONS = [
  { key: 'meta', label: 'SEO Meta', fields: [
    { key: 'title', label: 'Meta title', type: 'text' },
    { key: 'description', label: 'Meta description', type: 'textarea' },
    { key: 'canonical', label: 'Canonical URL', type: 'text' },
    { key: 'ogImage', label: 'OG image URL', type: 'text' },
  ]},
  { key: 'identity', label: 'Article Identity', parentKey: '_root', fields: [
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'category', label: 'Category', type: 'text' },
    { key: 'tag', label: 'Tag (uppercase pill)', type: 'text' },
    { key: 'date', label: 'Display date (e.g. 21 APR 2026)', type: 'text' },
    { key: 'datePublished', label: 'Date published (YYYY-MM-DD)', type: 'text' },
    { key: 'dateModified', label: 'Date modified (YYYY-MM-DD)', type: 'text' },
    { key: 'readTime', label: 'Read time (e.g. 5 MINS READ)', type: 'text' },
    { key: 'author', label: 'Author', type: 'text' },
    { key: 'tags', label: 'Tags', type: 'string-list' },
  ]},
  { key: 'hero', label: 'Hero image', parentKey: '_root', fields: [
    { key: 'heroImage', label: 'Hero (desktop)', type: 'image' },
    { key: 'heroImageTablet', label: 'Hero (tablet)', type: 'image' },
    { key: 'heroImageMobile', label: 'Hero (mobile)', type: 'image' },
    { key: 'heroImageAlt', label: 'Hero alt text', type: 'text' },
  ]},
  { key: 'body', label: 'Article Body', parentKey: '_root', fields: [
    { key: 'body', label: 'Body blocks', type: 'blocks', allowedTypes: ['html', 'callout', 'youtube'] },
  ]},
  { key: 'related', label: 'Related Articles', parentKey: '_root', fields: [
    { key: 'relatedSlugs', label: 'Pick related articles to feature at the bottom', type: 'related-articles' },
  ]},
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
