import { SEO_META_EXTRAS } from './seoMetaFields.js';
import { STRUCTURED_DATA_SECTION } from './structuredDataSection.js';

export const fbPath = 'pages/aiGovernance';

export const defaults = {
  meta: {
    title: 'AI Governance | Panasa',
    description: 'Move from scattered AI use to visible controls, clear ownership, and audit-ready governance designed for regulated fintech environments.',
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
    pill: 'AI Governance',
    title: ['AI governance for teams', "that can't afford to guess"],
    subtitle: 'Move from scattered AI use to visible controls, clear ownership, and audit-ready governance designed for regulated fintech environments.',
    primaryCta: { label: 'Talk to our team', href: 'contact.html' },
    secondaryCta: { label: 'View Case Studies', href: '#careers' },
    trustedKicker: 'Trusted by leading fintech teams',
    stats: [
      { value: '7', label: 'Governance domains covered' },
      { value: '11', label: 'Core deliverables included' },
      { value: '12', label: 'Months to full governance' },
      { value: '3', label: 'Lines of defence aligned' },
    ],
  },
  challenge: {
    kicker: 'The Problem',
    title: ['AI is everywhere in your', "organisation Governance isn't"],
    summary: 'Engineers are using Copilot and ChatGPT daily. Customer support has AI assistants.',
    cards: [
      { number: '01', title: 'Shadow AI is already running', body: 'Teams adopt AI tools faster than policies can keep up. Unsanctioned tools process customer data, generate code that goes into production, and make decisions that affect end users with no oversight and no audit trail.' },
      { number: '02', title: 'Regulators are moving faster than you think', body: 'The EU AI Act is in force. ISO 42001 is the new governance standard. DORA demands operational resilience including for AI systems. If your answer to "how do you govern AI?" is a blank stare, that\'s a problem with a deadline attached.' },
      { number: '03', title: 'A security incident is a matter of when, not if', body: "Prompt injection, data leakage through AI APIs, and model hallucinations in customer-facing systems aren't theoretical risks. Without proper controls, your AI tools are an open attack surface that nobody is monitoring." },
    ],
  },
  why: {
    kicker: 'Why Panasa',
    title: ['Why Fintechs', 'Choose Panasa'],
    summary: 'What sets us apart in the fintech development landscape',
    cards: [
      { heading: 'Payment Experts, Not Generalists', body: '20+ years building card platforms, not generic software. We speak authorization flows, 3DS, and scheme integrations fluently.' },
      { heading: 'Proven at scale', body: "Supporting platforms processing 10M+ transactions monthly. We've been there, scaled that." },
      { heading: 'Full-Stack Team', body: 'From strategy to 24x7 ops-no vendor juggling needed. One team, end-to-end ownership.' },
      { heading: 'Compliance-First Approach', body: 'ISO 27001 certified, PCI-DSS aligned, GDPR compliant. Built-in audit readiness from day one.' },
    ],
  },
  fit: {
    kicker: 'Who This Is For',
    title: ['Fintechs that use AI and need to', 'prove they control it'],
    summary: '',
    bullets: [
      'Issuer processors and card platforms using AI in operations or engineering',
      'Fintechs entering regulated markets with AI embedded in customer-facing processes',
      'Compliance teams that need frameworks before their next audit',
      'CTOs who know AI is being used but have no visibility into how or where',
    ],
    engageKicker: 'How We Engage',
    engageCards: [
      { heading: 'Assessment', body: 'governance audit and gap analysis' },
      { heading: 'Framework build', body: 'policy, controls, registry setup' },
      { heading: 'Managed governance', body: 'ongoing oversight and assurance' },
      { heading: 'Training', body: 'team enablement and awareness' },
    ],
  },
  footerCta: { title: 'Ready to Build Your Card Platform' },
};

export const sections = [
  { key: 'meta', label: 'SEO Meta', fields: [
    { key: 'title', label: 'Meta title', type: 'text' },
    { key: 'description', label: 'Meta description', type: 'textarea' },
    ...SEO_META_EXTRAS,
  ]},
  { key: 'hero', label: 'Hero Section', fields: [{ key: 'pill', label: 'Pill text', type: 'text' }, { key: 'title', label: 'Title (line 1 | line 2)', type: 'title' }, { key: 'subtitle', label: 'Subtitle', type: 'textarea' }, { key: 'primaryCta', label: 'Primary CTA', type: 'label-href' }, { key: 'secondaryCta', label: 'Secondary CTA', type: 'label-href' }, { key: 'trustedKicker', label: 'Trusted kicker', type: 'text' }, { key: 'stats', label: 'Stats', type: 'stats' }] },
  { key: 'challenge', label: 'The Problem', fields: [{ key: 'kicker', label: 'Kicker', type: 'text' }, { key: 'title', label: 'Title (line 1 | line 2)', type: 'title' }, { key: 'summary', label: 'Summary', type: 'textarea' }, { key: 'cards', label: 'Problem cards', type: 'numbered-cards' }] },
  { key: 'why', label: 'Why Panasa', fields: [{ key: 'kicker', label: 'Kicker', type: 'text' }, { key: 'title', label: 'Title (line 1 | line 2)', type: 'title' }, { key: 'summary', label: 'Summary', type: 'textarea' }, { key: 'cards', label: 'Reason cards', type: 'heading-body-cards' }] },
  { key: 'fit', label: 'Who This Is For', fields: [{ key: 'kicker', label: 'Kicker', type: 'text' }, { key: 'title', label: 'Title (line 1 | line 2)', type: 'title' }, { key: 'summary', label: 'Summary', type: 'textarea' }, { key: 'bullets', label: 'Audience bullets', type: 'string-list' }, { key: 'engageKicker', label: 'Engage kicker', type: 'text' }, { key: 'engageCards', label: 'Engagement models', type: 'heading-body-cards' }] },
  { key: 'footerCta', label: 'Footer CTA', fields: [{ key: 'title', label: 'CTA title', type: 'text' }] },
  STRUCTURED_DATA_SECTION,
];
