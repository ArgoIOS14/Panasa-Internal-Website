import { newArticleDefaults, typeUrlPrefix } from './articleHelpers.js';

const GUIDE_SECTIONS = [
  { key: 'meta', label: 'SEO Meta', fields: [
    { key: 'title', label: 'Meta title', type: 'text' },
    { key: 'description', label: 'Meta description', type: 'textarea' },
    { key: 'canonical', label: 'Canonical URL', type: 'text' },
    { key: 'ogImage', label: 'OG image URL', type: 'text' },
  ]},
  { key: 'identity', label: 'Guide Identity', parentKey: '_root', fields: [
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'titleHighlight', label: 'Title highlight (last word/phrase)', type: 'text' },
    { key: 'description', label: 'Subtitle / description', type: 'textarea' },
    { key: 'tocHeading', label: 'TOC heading', type: 'text' },
    { key: 'category', label: 'Category', type: 'text' },
    { key: 'tag', label: 'Tag (uppercase pill)', type: 'text' },
    { key: 'date', label: 'Display date', type: 'text' },
    { key: 'datePublished', label: 'Date published (YYYY-MM-DD)', type: 'text' },
    { key: 'dateModified', label: 'Date modified (YYYY-MM-DD)', type: 'text' },
    { key: 'readTime', label: 'Read time', type: 'text' },
    { key: 'author', label: 'Author', type: 'text' },
    { key: 'tags', label: 'Tags', type: 'string-list' },
  ]},
  { key: 'hero', label: 'Hero image', parentKey: '_root', fields: [
    { key: 'heroImage', label: 'Hero (desktop)', type: 'image' },
    { key: 'heroImageTablet', label: 'Hero (tablet)', type: 'image' },
    { key: 'heroImageMobile', label: 'Hero (mobile)', type: 'image' },
    { key: 'heroImageAlt', label: 'Hero alt text', type: 'text' },
  ]},
  { key: 'introduction', label: 'Guide Body', fields: [
    { key: 'heading', label: 'Heading', type: 'text' },
    { key: 'blocks', label: 'Body blocks', type: 'blocks', allowedTypes: ['html', 'callout', 'note', 'subheading', 'youtube'] },
  ]},
  { key: 'sections', label: 'Sticky bar Sections', parentKey: '_root', fields: [
    { key: 'sections', label: 'Sections', type: 'guide-sections' },
  ]},
  { key: 'related', label: 'Related Articles', parentKey: '_root', fields: [
    { key: 'relatedSlugs', label: 'Pick related articles to feature at the bottom', type: 'related-articles' },
  ]},
];

export function configFor(type, slug) {
  return {
    fbPath: `pages/articles/${type}/${slug}`,
    sections: GUIDE_SECTIONS,
    defaults: newArticleDefaults(type, slug),
    previewUrl: `/${typeUrlPrefix(type)}/${slug}.html`,
    pageKey: `${type}:${slug}`,
    articleType: type,
    articleSlug: slug,
  };
}
