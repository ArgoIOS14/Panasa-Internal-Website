import { SEO_META_EXTRAS } from './seoMetaFields.js';
import { STRUCTURED_DATA_SECTION } from './structuredDataSection.js';

export const fbPath = 'pages/contact';

export const defaults = {
  meta: {
    title: 'Contact Panasa | Build Your Fintech Platform',
    description: 'Talk to our team about engineering, operations, or scaling your payment infrastructure.',
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
    title: "Let's Build Your",
    titleEmphasis: 'Fintech Platform',
    subtitle: 'Talk to our team about engineering, operations, or scaling your payment infrastructure.',
  },
  form: {
    heading: 'Send us a message',
    submitButton: 'Send Message',
  },
  contactInfo: {
    heading: 'You can reach us anytime via',
    emailHeading: 'Email',
    email: 'info@panasatech.com',
    phoneHeading: 'Contact',
    phones: ['+91 75940 52401', '+44 (0) 1273 977101'],
  },
  locations: {
    title: 'Our Offices',
    titleEmphasis: 'Locations',
    subtitle: 'Serving global fintech teams across key regions with reliable delivery and support.',
    offices: [
      { country: 'India', address: '9th Floor, Carnival Infopark Phase 2, Infopark Phase 2, Kakkanad, Kochi, Kerala, India 682042' },
      { country: 'United Kingdom', address: 'Maritime House, Basin Rd North, Brighton & Hove, United Kingdom BN41 1WR' },
    ],
  },
};

export const sections = [
  { key: 'meta', label: 'SEO Meta', fields: [
    { key: 'title', label: 'Meta title', type: 'text' },
    { key: 'description', label: 'Meta description', type: 'textarea' },
    ...SEO_META_EXTRAS,
  ]},
  { key: 'hero', label: 'Hero Section', fields: [
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'titleEmphasis', label: 'Title emphasis', type: 'text' },
    { key: 'subtitle', label: 'Subtitle', type: 'textarea' },
  ]},
  { key: 'form', label: 'Contact Form', fields: [
    { key: 'heading', label: 'Form heading', type: 'text' },
    { key: 'submitButton', label: 'Submit button text', type: 'text' },
  ]},
  { key: 'contactInfo', label: 'Contact Info', fields: [
    { key: 'heading', label: 'Heading', type: 'text' },
    { key: 'emailHeading', label: 'Email heading', type: 'text' },
    { key: 'email', label: 'Email address', type: 'text' },
    { key: 'phoneHeading', label: 'Phone heading', type: 'text' },
    { key: 'phones', label: 'Phone numbers', type: 'string-list' },
  ]},
  { key: 'locations', label: 'Office Locations', fields: [
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'titleEmphasis', label: 'Title emphasis', type: 'text' },
    { key: 'subtitle', label: 'Subtitle', type: 'textarea' },
    { key: 'offices', label: 'Offices', type: 'office-cards' },
  ]},
  STRUCTURED_DATA_SECTION,
];
