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
    { key: 'title', label: 'Hero title (legacy — leave blank if using Title accent + suffix)', type: 'text',
      help: 'Legacy field. New case studies build the headline from "Title accent" (lime) + "Title suffix" (white). Use this only for older studies (e.g. Osper) that store the headline as a single string.' },
    { key: 'titleAccent', label: 'Title accent (lime — first half of the headline)', type: 'text',
      help: 'Renders in the lime accent colour. Example: "Building the Operations Backbone".' },
    { key: 'titleSuffix', label: 'Title suffix (white — second half of the headline)', type: 'text',
      help: 'Renders after the accent in white. Example: "of a Global Issuer Processor".' },
    { key: 'background', label: 'Hero background image', type: 'image',
      help: 'Full-bleed background image for the hero (e.g. assets/cs-ops-backbone-hero-bg.webp). WebP at ~1600×900 works best.' },
  ]},
  { key: 'heroImage', label: 'Hero Image (right side of card)', parentKey: '_root', fields: [
    { key: 'heroImage', label: 'Hero image', type: 'image',
      help: 'Image shown on the right side of the case-study hero card + used as the social share image if no separate SEO image is set. Leave blank to keep the existing "assets/cover-<slug>.webp" cover — that is the default until you upload one here and republish.' },
    { key: 'heroImageAlt', label: 'Hero image alt text', type: 'text',
      help: 'Accessibility text describing the hero image. Optional — the image is decorative on most case studies.' },
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
    { key: 'eyebrow', label: 'Eyebrow (uppercase)', type: 'text',
      help: 'Small uppercase label above the heading. Usually "NEWSLETTER".' },
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'titleAccent', label: 'Title accent (lime)', type: 'text',
      help: 'Optional second line of the title rendered in lime. Example: "Get Payments Deconstructed."' },
    { key: 'description', label: 'Description', type: 'textarea',
      help: 'One- or two-line sub-copy under the title.' },
    { key: 'placeholder', label: 'Email field placeholder', type: 'text',
      help: 'Greyed-out hint text inside the email box (e.g. "Enter Email Address").' },
    { key: 'submitLabel', label: 'Submit button label', type: 'text',
      help: 'Default: "Subscribe".' },
    { key: 'formNote', label: 'Form note', type: 'text',
      help: 'Fine print under the form (e.g. "No spam. Unsubscribe anytime.").' },
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
