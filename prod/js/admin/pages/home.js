import { SEO_META_EXTRAS } from './seoMetaFields.js';
import { STRUCTURED_DATA_SECTION } from './structuredDataSection.js';

export const fbPath = 'pages/home';

let _defaults = null;

export async function getDefaults() {
  if (_defaults) return _defaults;
  try {
    const res = await fetch('content/Home page/content.json');
    _defaults = await res.json();
  } catch (e) {
    console.warn('Failed to load home content.json fallback', e);
    _defaults = {};
  }
  return _defaults;
}

export const defaults = null; // loaded async via getDefaults()

export const sections = [
  { key: 'meta', label: 'SEO Meta', fields: [
    { key: 'title', label: 'Meta title', type: 'text' },
    { key: 'description', label: 'Meta description', type: 'textarea' },
    ...SEO_META_EXTRAS,
  ]},
  { key: 'nav', label: 'Navigation', fields: [
    { key: 'links', label: 'Nav links', type: 'nav-links' },
    { key: 'cta', label: 'Nav CTA button', type: 'label-href' },
  ]},
  { key: 'hero', label: 'Hero Section', fields: [{ key: 'pill', label: 'Pill text', type: 'text' }, { key: 'title', label: 'Title', type: 'text' }, { key: 'titleEmphasis', label: 'Title emphasis line', type: 'text' }, { key: 'subtitle', label: 'Subtitle', type: 'textarea' }] },
  { key: 'hero_ctas', label: 'Hero CTAs', parentKey: 'hero', fields: [{ key: 'primaryCta', label: 'Primary CTA', type: 'label-href' }, { key: 'secondaryCta', label: 'Secondary CTA', type: 'label-href' }] },
  { key: 'hero_trusted', label: 'Hero Trusted Logos', parentKey: 'hero', fields: [{ key: 'trustedLabel', label: 'Trusted label', type: 'text' }, { key: 'trustedLogos', label: 'Logo images', type: 'image-list' }] },
  { key: 'hero_certs', label: 'Hero Certification Badges', parentKey: 'hero', fields: [
    { key: 'certTitle', label: 'Certifications heading (use \\n for line break)', type: 'textarea',
      help: 'Label shown next to the cert badges. Example: "Compliance-Ready\\nFintech Systems".' },
    { key: 'certBadges', label: 'Badge images', type: 'image-list' },
    { key: 'certImage', label: 'Single certification image (advanced, optional)', type: 'cert-single-image',
      help: 'Rarely used alternate render path: if set, this single image REPLACES the badge list above entirely. Leave empty (default) to keep showing the Badge images list.' },
  ]},
  { key: 'services', label: 'Services Section', fields: [{ key: 'pill', label: 'Pill text', type: 'text' }, { key: 'title', label: 'Section title', type: 'text' }, { key: 'subtitle', label: 'Subtitle', type: 'textarea' }, { key: 'learnMoreLabel', label: 'Learn more label', type: 'text' }, { key: 'visualLabel', label: 'Visual label (text shown in the service carousel visual)', type: 'text',
      help: 'Currently not rendered anywhere on the page — there is no matching visual slot in the current design. Saving this field has no visible effect yet.' }, { key: 'items', label: 'Service cards', type: 'service-cards' }] },
  { key: 'why', label: 'Why Section', fields: [{ key: 'pill', label: 'Pill text', type: 'text' }, { key: 'title', label: 'Section title', type: 'text' }, { key: 'titleEmphasis', label: 'Title emphasis (highlighted portion)', type: 'text' }, { key: 'subtitle', label: 'Subtitle', type: 'textarea' }, { key: 'cards', label: 'Why cards', type: 'why-cards' }] },
  { key: 'caseStudies', label: 'Case Studies', fields: [{ key: 'pill', label: 'Pill text', type: 'text' }, { key: 'title', label: 'Section title', type: 'text' }, { key: 'titleEmphasis', label: 'Title emphasis (highlighted portion)', type: 'text' }, { key: 'subtitle', label: 'Subtitle', type: 'textarea' }, { key: 'slides', label: 'Case study slides', type: 'case-slides' }] },
  { key: 'knowledgeHub', label: 'Knowledge Hub', fields: [
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'titleEmphasis', label: 'Title emphasis line', type: 'text' },
    { key: 'subtitle', label: 'Subtitle', type: 'textarea' },
    { key: 'cta', label: 'CTA', type: 'label-href' },
    { key: 'cards', label: 'Knowledge Hub cards', type: 'knowledge-cards' },
  ]},
  { key: 'testimonials', label: 'Testimonials', fields: [{ key: 'pill', label: 'Pill text', type: 'text' }, { key: 'title', label: 'Section title', type: 'text' }, { key: 'titleEmphasis', label: 'Title emphasis (highlighted portion)', type: 'text' }, { key: 'subtitle', label: 'Subtitle', type: 'textarea' }, { key: 'cards', label: 'Testimonial cards', type: 'testimonial-cards' }] },
  { key: 'faq', label: 'FAQ', fields: [
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'titleEmphasis', label: 'Title emphasis line', type: 'text' },
    { key: 'subtitle', label: 'Subtitle', type: 'textarea' },
    { key: 'items', label: 'FAQ items', type: 'home-faq-items' },
  ]},
  { key: 'engagement', label: 'Engagement Models', fields: [
    { key: 'pill', label: 'Pill text', type: 'text' },
    { key: 'title', label: 'Section title', type: 'text' },
    { key: 'subtitle', label: 'Subtitle', type: 'textarea' },
    { key: 'note', label: 'Footer note', type: 'text' },
    { key: 'filters', label: 'Tab labels (e.g. "Engagement Models", "Growth Packages")', type: 'string-list',
      help: 'Toggle labels above the cards. The first one is shown by default unless overridden below.' },
    { key: 'activeFilter', label: 'Default active tab', type: 'text',
      help: 'Must exactly match one of the labels above (e.g. "Engagement Models").' },
    { key: 'items', label: 'Engagement models', type: 'engagement-cards' },
    { key: 'growthPackages', label: 'Growth packages', type: 'growth-cards' },
  ]},
  { key: 'footer', label: 'Footer CTA', fields: [
    { key: 'ctaTitle', label: 'CTA title', type: 'text' },
    { key: 'ctaText', label: 'CTA text', type: 'textarea' },
    { key: 'ctaButton', label: 'CTA button label', type: 'text',
      help: 'Just the button label (e.g. "Book a Meeting"). The link target is set below.' },
    { key: 'ctaHref', label: 'CTA button link', type: 'text',
      help: 'Path the button links to (e.g. "contact").' },
    { key: 'showResources', label: 'Show Resources column in footer', type: 'toggle' },
    { key: 'columns', label: 'Footer link columns', type: 'footer-columns',
      help: '"Visible" toggles hide a column/link without deleting it. "Badge type" is a short keyword (e.g. "hiring", "new") used to color the badge; "Badge text" is what actually displays (e.g. "HIRING!"). Leave both blank for no badge.' },
  ]},
  { key: 'footer_contact', label: 'Footer Contact Info', parentKey: 'footer', fields: [{ key: 'brandText', label: 'Brand text', type: 'textarea' }, { key: 'email', label: 'Email', type: 'text' }, { key: 'phones', label: 'Phone numbers', type: 'string-list' }] },
  { key: 'footer_social', label: 'Footer Social Links', parentKey: 'footer', fields: [{ key: 'linkedin', label: 'LinkedIn URL', type: 'text' }, { key: 'facebook', label: 'Facebook URL', type: 'text' }, { key: 'twitter', label: 'X (Twitter) URL', type: 'text' }, { key: 'instagram', label: 'Instagram URL', type: 'text' }] },
  { key: 'footer_legal', label: 'Footer Legal', parentKey: 'footer', nestedKey: 'legal', fields: [
    { key: 'copyright', label: 'Copyright text', type: 'text' },
    { key: 'links', label: 'Legal links (privacy, cookies, …)', type: 'link-list',
      help: 'Small links shown next to the copyright (e.g. "Privacy Policy", "Cookies").' },
  ]},
  { key: 'newsletter', label: 'Newsletter Modal (site-wide popup)', fields: [
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'subtitle', label: 'Subtitle', type: 'textarea' },
    { key: 'inputPlaceholder', label: 'Email input placeholder', type: 'text' },
    { key: 'submitLabel', label: 'Submit button label', type: 'text' },
    { key: 'fineText', label: 'Fine print (below the form)', type: 'text' },
    { key: 'successMessage', label: 'Success message (shown after submit)', type: 'text' },
    { key: 'errorMessage', label: 'Error message (shown on invalid email)', type: 'text' },
  ]},
  { key: 'emailCapture', label: 'Email Capture Popup', fields: [
    { key: 'promptHeading', label: 'Heading', type: 'text' },
    { key: 'promptSubtext', label: 'Subtext', type: 'text' },
    { key: 'buttonLabel', label: 'Button label', type: 'text' },
    { key: 'inputPlaceholder', label: 'Email input placeholder', type: 'text' },
    { key: 'successMessage', label: 'Success message (shown after submit)', type: 'text' },
    { key: 'errorMessage', label: 'Error message (shown on invalid email)', type: 'text' },
  ]},
  STRUCTURED_DATA_SECTION,
];
