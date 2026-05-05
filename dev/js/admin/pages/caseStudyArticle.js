import { newArticleDefaults, typeUrlPrefix } from './articleHelpers.js';
import { SEO_META_EXTRAS } from './seoMetaFields.js';
import { STRUCTURED_DATA_SECTION } from './structuredDataSection.js';

const CASE_STUDY_SECTIONS = [
  { key: 'meta', label: 'SEO Meta', fields: [
    { key: 'title', label: 'Meta title', type: 'text', required: true, charCount: { min: 30, max: 60 },
      help: 'Shown in the browser tab + Google search results. Aim for under 60 characters. Example: "Reinventing Family Banking — Osper × Panasa".' },
    { key: 'description', label: 'Meta description', type: 'textarea', required: true, charCount: { min: 120, max: 160 },
      help: 'One-paragraph summary shown under the title in Google + social shares. 150–160 characters work best.' },
    ...SEO_META_EXTRAS,
  ]},
  { key: 'identity', label: 'Case Study Identity', parentKey: '_root', fields: [
    { key: 'title', label: 'Title (used in browser tab + breadcrumb + JSON-LD)', type: 'text', required: true,
      help: 'The full case-study title as it should appear in search results and the page <title>. Often the same as the hero title + accent combined.' },
    { key: 'category', label: 'Category', type: 'text',
      help: 'Always "Case Study" — drives the tag color, the resources card filter, and the routing prefix.' },
    { key: 'tag', label: 'Tag (uppercase pill)', type: 'text',
      help: 'Small uppercase pill at the top of the resources card. Defaults to "CASE STUDY".' },
    { key: 'date', label: 'Display date (e.g. 30 APR 2026)', type: 'text',
      help: 'Free-form display date shown on the resources card. Edit this if you want a different format than the auto-generated one.' },
    { key: 'datePublished', label: 'Date published', type: 'date',
      help: 'Used for SEO (article:published_time + JSON-LD datePublished). Pick a date.' },
    { key: 'dateModified', label: 'Date modified', type: 'date',
      help: 'Used for SEO (article:modified_time). Set to today after a meaningful edit.' },
    { key: 'readTime', label: 'Read time (e.g. 5 MINS READ)', type: 'text',
      help: 'Estimated reading time, shown on the resources card. Rule of thumb: 1 minute per 200 words.' },
    { key: 'author', label: 'Author', type: 'text' },
    { key: 'tags', label: 'Tags', type: 'string-list',
      help: 'Comma-separated list of topic tags. Used for SEO meta keywords + on-page article tag list.' },
  ]},
  { key: 'hero', label: 'Hero (dark green client card)', fields: [
    { key: 'eyebrow', label: 'Eyebrow (uppercase, default "CASE STUDY")', type: 'text',
      help: 'Small uppercase label above the title. Usually "CASE STUDY".' },
    { key: 'title', label: 'Hero title (main copy)', type: 'text', required: true,
      help: 'The main headline shown in the dark green hero card. Usually starts with a verb — "Reinventing Family Banking Through".' },
    { key: 'titleAccent', label: 'Hero title accent (rendered in accent color, appended after the title)', type: 'text',
      help: 'Optional. Renders in the lime accent color, after the title. Osper uses "Compliance, Trust, and Experience" here.' },
    { key: 'logo', label: 'Client logo (image)', type: 'image',
      help: 'Client logo shown on the right of the hero card. SVG works best (scales cleanly). Leave blank for no logo.' },
    { key: 'logoAlt', label: 'Client logo alt text', type: 'text',
      help: 'Accessibility text describing the logo (e.g. "Osper"). Read aloud by screen readers.' },
  ]},
  { key: 'metaTiles', label: 'Meta Tiles strip (1–5 tiles)', parentKey: '_root', fields: [
    { key: 'metaTiles', label: 'Tiles', type: 'meta-tiles',
      help: 'Quick facts strip below the hero. Up to 5 tiles. Each tile has an icon, an uppercase label (e.g. LOCATION) and a value (e.g. Japan).' },
  ]},
  { key: 'sections', label: 'Case Study Sections', parentKey: '_root', fields: [
    { key: 'sections', label: 'Sections (ordered, drag to reorder, delete to omit)', type: 'case-sections',
      help: 'The body of the case study. Click "+ Add section" to pick a section type from the list. Drag the ⠿ handle on each card to reorder.' },
  ]},
  { key: 'newsletter', label: 'Newsletter strip', fields: [
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'subtitle', label: 'Subtitle', type: 'textarea' },
    { key: 'placeholder', label: 'Email field placeholder', type: 'text',
      help: 'Greyed-out hint text inside the email box (e.g. "Enter Email Address").' },
  ]},
  { key: 'related', label: 'Related Articles', parentKey: '_root', fields: [
    { key: 'relatedSlugs', label: 'Pick related articles to feature at the bottom', type: 'related-articles',
      help: 'Up to 3 of these will appear in the "More Case Studies" grid at the bottom. If you leave it empty, the system picks recent case studies automatically.' },
  ]},
  STRUCTURED_DATA_SECTION,
];

export function configFor(type, slug) {
  return {
    fbPath: `pages/articles/${type}/${slug}`,
    sections: CASE_STUDY_SECTIONS,
    defaults: newArticleDefaults(type, slug),
    previewUrl: `/${typeUrlPrefix(type)}/${slug}.html`,
    pageKey: `${type}:${slug}`,
    articleType: type,
    articleSlug: slug,
  };
}
