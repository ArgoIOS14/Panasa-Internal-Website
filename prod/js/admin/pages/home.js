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
  { key: 'meta', label: 'Meta / SEO', fields: [{ key: 'title', label: 'Page title', type: 'text' }, { key: 'description', label: 'Meta description', type: 'textarea' }] },
  { key: 'hero', label: 'Hero Section', fields: [{ key: 'pill', label: 'Pill text', type: 'text' }, { key: 'title', label: 'Title', type: 'text' }, { key: 'titleEmphasis', label: 'Title emphasis line', type: 'text' }, { key: 'subtitle', label: 'Subtitle', type: 'textarea' }, { key: 'trustedLabel', label: 'Trusted label', type: 'text' }] },
  { key: 'hero_ctas', label: 'Hero CTAs', parentKey: 'hero', fields: [{ key: 'primaryCta', label: 'Primary CTA', type: 'label-href' }, { key: 'secondaryCta', label: 'Secondary CTA', type: 'label-href' }] },
  { key: 'services', label: 'Services Section', fields: [{ key: 'title', label: 'Section title', type: 'text' }, { key: 'subtitle', label: 'Subtitle', type: 'textarea' }, { key: 'learnMoreLabel', label: 'Learn more label', type: 'text' }, { key: 'items', label: 'Service cards', type: 'service-cards' }] },
  { key: 'why', label: 'Why Section', fields: [{ key: 'title', label: 'Section title', type: 'text' }, { key: 'subtitle', label: 'Subtitle', type: 'textarea' }, { key: 'cards', label: 'Why cards', type: 'why-cards' }] },
  { key: 'caseStudies', label: 'Case Studies', fields: [{ key: 'title', label: 'Section title', type: 'text' }, { key: 'subtitle', label: 'Subtitle', type: 'textarea' }, { key: 'slides', label: 'Case study slides', type: 'case-slides' }] },
  { key: 'testimonials', label: 'Testimonials', fields: [{ key: 'title', label: 'Section title', type: 'text' }, { key: 'subtitle', label: 'Subtitle', type: 'textarea' }, { key: 'cards', label: 'Testimonial cards', type: 'testimonial-cards' }] },
  { key: 'engagement', label: 'Engagement Models', fields: [{ key: 'title', label: 'Section title', type: 'text' }, { key: 'subtitle', label: 'Subtitle', type: 'textarea' }, { key: 'note', label: 'Footer note', type: 'text' }, { key: 'items', label: 'Engagement models', type: 'engagement-cards' }, { key: 'growthPackages', label: 'Growth packages', type: 'growth-cards' }] },
  { key: 'footer', label: 'Footer', fields: [{ key: 'ctaTitle', label: 'CTA title', type: 'text' }, { key: 'ctaText', label: 'CTA text', type: 'textarea' }, { key: 'ctaButton', label: 'CTA button label', type: 'text' }, { key: 'brandText', label: 'Brand text', type: 'textarea' }, { key: 'email', label: 'Email', type: 'text' }, { key: 'phones', label: 'Phone numbers', type: 'string-list' }] },
  { key: 'emailCapture', label: 'Email Capture Popup', fields: [{ key: 'promptHeading', label: 'Heading', type: 'text' }, { key: 'promptSubtext', label: 'Subtext', type: 'text' }, { key: 'buttonLabel', label: 'Button label', type: 'text' }] },
];
