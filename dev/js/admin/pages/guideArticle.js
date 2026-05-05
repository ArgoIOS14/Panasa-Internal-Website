import { newArticleDefaults, typeUrlPrefix } from './articleHelpers.js';
import { SEO_META_EXTRAS } from './seoMetaFields.js';
import { STRUCTURED_DATA_SECTION } from './structuredDataSection.js';

const GUIDE_SECTIONS = [
  { key: 'meta', label: 'SEO Meta', fields: [
    { key: 'title', label: 'Meta title', type: 'text', required: true, charCount: { min: 30, max: 60 },
      help: 'Shown in the browser tab + Google search results. Aim for under 60 characters.' },
    { key: 'description', label: 'Meta description', type: 'textarea', required: true, charCount: { min: 120, max: 160 },
      help: 'One-paragraph summary shown under the title in Google + social shares. 150–160 characters work best.' },
    ...SEO_META_EXTRAS,
  ]},
  { key: 'identity', label: 'Guide Identity', parentKey: '_root', fields: [
    { key: 'title', label: 'Title', type: 'text', required: true },
    { key: 'titleHighlight', label: 'Title highlight (last word/phrase)', type: 'text',
      help: 'Optional. The portion of the title that should render in the lime accent color (always at the end). Strip it from the main title — the renderer concatenates them.' },
    { key: 'description', label: 'Subtitle / description', type: 'textarea',
      help: 'Short paragraph below the title in the hero.' },
    { key: 'tocHeading', label: 'TOC heading', type: 'text',
      help: 'Heading for the sticky "On this page" sidebar. Defaults to "On this page".' },
    { key: 'category', label: 'Category', type: 'text' },
    { key: 'tag', label: 'Tag (uppercase pill)', type: 'text' },
    { key: 'date', label: 'Display date', type: 'text' },
    { key: 'datePublished', label: 'Date published', type: 'date',
      help: 'Used for SEO (article:published_time + JSON-LD datePublished).' },
    { key: 'dateModified', label: 'Date modified', type: 'date',
      help: 'Used for SEO (article:modified_time). Set to today after a meaningful edit.' },
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
    { key: 'blocks', label: 'Body blocks', type: 'blocks', allowedTypes: ['html', 'callout', 'note', 'subheading', 'youtube'],
      help: 'Intro section blocks. Use Subheading to break the intro into chunks.' },
  ]},
  { key: 'sections', label: 'Sticky bar Sections', parentKey: '_root', fields: [
    { key: 'sections', label: 'Sections', type: 'guide-sections',
      help: 'Numbered sections shown in the sticky right-hand sidebar. Drag the ⠿ handle on each card to reorder.' },
  ]},
  { key: 'related', label: 'Related Articles', parentKey: '_root', fields: [
    { key: 'relatedSlugs', label: 'Pick related articles to feature at the bottom', type: 'related-articles' },
  ]},
  STRUCTURED_DATA_SECTION,
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
