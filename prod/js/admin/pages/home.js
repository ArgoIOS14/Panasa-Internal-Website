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
  { key: 'hero', label: 'Hero Section', fields: [{ key: 'pill', label: 'Pill text', type: 'text' }, { key: 'title', label: 'Title', type: 'text' }, { key: 'titleEmphasis', label: 'Title emphasis line', type: 'text' }, { key: 'subtitle', label: 'Subtitle', type: 'textarea' }] },
  { key: 'hero_ctas', label: 'Hero CTAs', parentKey: 'hero', fields: [{ key: 'primaryCta', label: 'Primary CTA', type: 'label-href' }, { key: 'secondaryCta', label: 'Secondary CTA', type: 'label-href' }] },
  { key: 'hero_trusted', label: 'Hero Trusted Logos', parentKey: 'hero', fields: [{ key: 'trustedLabel', label: 'Trusted label', type: 'text' }, { key: 'trustedLogos', label: 'Logo images', type: 'image-list' }] },
  { key: 'hero_certs', label: 'Hero Certification Badges', parentKey: 'hero', fields: [
    { key: 'certTitle', label: 'Certifications heading (use \\n for line break)', type: 'textarea',
      help: 'Label shown next to the cert badges. Example: "Compliance-Ready\\nFintech Systems".' },
    { key: 'certBadges', label: 'Badge images', type: 'image-list' },
  ]},
  { key: 'services', label: 'Services Section', fields: [{ key: 'pill', label: 'Pill text', type: 'text' }, { key: 'title', label: 'Section title', type: 'text' }, { key: 'subtitle', label: 'Subtitle', type: 'textarea' }, { key: 'learnMoreLabel', label: 'Learn more label', type: 'text' }, { key: 'visualLabel', label: 'Visual label (text shown in the service carousel visual)', type: 'text' }, { key: 'items', label: 'Service cards', type: 'service-cards' }] },
  { key: 'why', label: 'Why Section', fields: [{ key: 'pill', label: 'Pill text', type: 'text' }, { key: 'title', label: 'Section title', type: 'text' }, { key: 'subtitle', label: 'Subtitle', type: 'textarea' }, { key: 'cards', label: 'Why cards', type: 'why-cards' }] },
  { key: 'caseStudies', label: 'Case Studies', fields: [{ key: 'pill', label: 'Pill text', type: 'text' }, { key: 'title', label: 'Section title', type: 'text' }, { key: 'subtitle', label: 'Subtitle', type: 'textarea' }, { key: 'slides', label: 'Case study slides', type: 'case-slides' }] },
  { key: 'testimonials', label: 'Testimonials', fields: [{ key: 'pill', label: 'Pill text', type: 'text' }, { key: 'title', label: 'Section title', type: 'text' }, { key: 'subtitle', label: 'Subtitle', type: 'textarea' }, { key: 'cards', label: 'Testimonial cards', type: 'testimonial-cards' }] },
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
  ]},
  { key: 'footer_contact', label: 'Footer Contact Info', parentKey: 'footer', fields: [{ key: 'brandText', label: 'Brand text', type: 'textarea' }, { key: 'email', label: 'Email', type: 'text' }, { key: 'phones', label: 'Phone numbers', type: 'string-list' }] },
  { key: 'footer_social', label: 'Footer Social Links', parentKey: 'footer', fields: [{ key: 'linkedin', label: 'LinkedIn URL', type: 'text' }, { key: 'facebook', label: 'Facebook URL', type: 'text' }, { key: 'twitter', label: 'X (Twitter) URL', type: 'text' }, { key: 'instagram', label: 'Instagram URL', type: 'text' }] },
  { key: 'footer_legal', label: 'Footer Legal', parentKey: 'footer', nestedKey: 'legal', fields: [
    { key: 'copyright', label: 'Copyright text', type: 'text' },
    { key: 'links', label: 'Legal links (privacy, cookies, …)', type: 'link-list',
      help: 'Small links shown next to the copyright (e.g. "Privacy Policy", "Cookies").' },
  ]},
  { key: 'emailCapture', label: 'Email Capture Popup', fields: [{ key: 'promptHeading', label: 'Heading', type: 'text' }, { key: 'promptSubtext', label: 'Subtext', type: 'text' }, { key: 'buttonLabel', label: 'Button label', type: 'text' }] },
  STRUCTURED_DATA_SECTION,
];
