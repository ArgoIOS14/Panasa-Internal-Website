import { SEO_META_EXTRAS } from './seoMetaFields.js';
import { STRUCTURED_DATA_SECTION } from './structuredDataSection.js';

export const fbPath = 'pages/servicesOverview';

export const defaults = {
  meta: {
    title: 'Services Overview | Panasa',
    description: "Whether you're building new infrastructure, modernising what you have, governing the AI models you use, or running operations at scale, we have a team that has done it before.",
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
    pill: 'Our Services',
    title: 'Four ways we work with',
    titleEmphasis: 'Payment Businesses',
    subtitle: "Whether you're building new infrastructure, modernising what you have, governing the AI models you use, or running operations at scale. We have a team that has done it before.",
  },
  serviceBlocks: [
    { kicker: 'Core Build', heading: 'AI Accelerated Fintech Engineering', href: 'ai-accelerated-fintech-engineering.html', items: ['AI Agent Swarm Powered Legacy App', 'AI-Led Fintech Engineering', 'AI Strategy & Implementation', 'Agentic AI & Automation', 'New Product and Platform', 'Business Intelligence & Advanced Analytics'] },
    { kicker: 'Core Control', heading: 'AI Governance', href: 'ai-governance.html', items: ['AI Risk Classification & Impact Assessment', 'AI Security, Privacy & Data Protection Controls', 'Model Lifecycle & Governance Framework', 'Regulatory Alignment ISO, NIST, EU AI Act', 'Human-in-the-Loop & Audit Controls', 'Shadow AI Detection & Risk Management'] },
    { kicker: 'Core Operate', heading: 'Intelligent Operations', href: 'intelligent-operations.html', items: ['24x7 Transaction Monitoring', 'Fraud Detection & Risk Management Workflows', 'Customer & Cardholder Support (L1-L3)', 'Disputes & Chargeback Lifecycle Handling', 'Reporting, Reconciliation & Audit Pipelines', 'Onboarding & Operational Playbooks'] },
    { kicker: 'Core Modernise', heading: 'AI-Led Legacy Modernisation', href: 'ai-powered-legacy-modernisation.html', items: ['Legacy Code & Business Logic Extraction', 'System Decomposition & Migration Planning', 'AI-Assisted Code Generation & Rebuild', 'Multi-Level Validation & Testing Framework', 'Cloud, Microservices & Platform Migration', 'Parallel Rollout & Zero-Loss Deployment'] },
  ],
  engagement: {
    title: 'Engagement Models',
    titleEmphasis: 'Built for Your Growth',
    subtitle: "Flexible operating models designed to match your fintech's stage, scale, and regulatory complexity.",
    cards: [
      { heading: 'Engineering Squads', text: 'Extend your team with our payment specialists. Flex capacity up or down based on project needs.', bullets: ['Month-to-month flexibility', 'Defined timeline', 'Milestone payments', 'End-to-end ownership', 'Predictable costs'], variant: 'light' },
      { heading: 'Managed Services', text: 'Full operational ownership with SLA-backed performance. From build to 24/7 operations.', bullets: ['24/7 coverage', 'SLA guarantees', 'Outcome-based pricing', 'Complete ownership', 'Continuous optimisation'], variant: 'featured' },
      { heading: 'Project-Based', text: 'Fixed scope, fixed budget, clear deliverables. Perfect for well-defined projects with set timelines.', bullets: ['Clear deliverables', 'Defined timeline', 'Milestone payments', 'End-to-end ownership', 'Predictable costs'], variant: 'light' },
      { heading: 'GCC Delivery Model', text: 'Build and scale your global delivery hub with structured talent, operations, and performance frameworks.', bullets: ['Talent Advisory Workspaces', 'AI-Powered Business Operations', 'Market Intelligence & Benchmarking', 'Workforce Planning', 'Build-Operate-Transfer (BOT)'], variant: 'light' },
    ],
    note: '*Most clients start with a project and graduate to managed services as they scale',
  },
  faq: {
    title: 'Frequently Asked',
    titleEmphasis: 'Questions',
    subtitle: 'Everything you need to know about Panasa. From capabilities to how we deliver results.',
    items: [
      { question: 'How does Panasa support issuer processors and fintech platforms', answer: 'Panasa provides end-to-end engineering, infrastructure, and operations support. We help design, build, scale, and run secure financial platforms reliably.' },
      { question: 'What types of fintech companies does Panasa typically work with', answer: 'We work with issuer processors, neobanks, payment service providers, BaaS platforms, and programme managers across the UK, EU, and APAC regions.' },
      { question: 'Does Panasa help with compliance and security requirements', answer: 'Yes. We are ISO 27001 certified and PCI-DSS aligned. Compliance is built into our engineering and operations processes from day one, not bolted on afterwards.' },
      { question: 'Can Panasa help scale platforms with high transaction volumes', answer: 'Absolutely. We currently support platforms processing over 10 million transactions monthly, with multi-region deployments and 24x7 operational monitoring.' },
      { question: 'How is Panasa different from a typical development agency', answer: 'We are payment specialists, not generalists. Our team has 20+ years of experience in card platforms, scheme integrations, and regulated fintech environments. We offer end-to-end ownership from engineering through to 24x7 operations.' },
    ],
  },
  emailCapture: { promptHeading: 'Want to see how we deliver?', promptSubtext: 'Get our services overview straight to your inbox.', buttonLabel: 'Get overview' },
  footerCta: {
    title: 'Ready to Build Your Card Platform',
    text: "Let's discuss your requirements. Our team will show you exactly how we can help—from custom development to 24×7 operations.",
    button: 'Book a Meeting',
  },
};

export const sections = [
  { key: 'meta', label: 'SEO Meta', fields: [
    { key: 'title', label: 'Meta title', type: 'text' },
    { key: 'description', label: 'Meta description', type: 'textarea' },
    ...SEO_META_EXTRAS,
  ]},
  { key: 'hero', label: 'Hero Section', fields: [
    { key: 'pill', label: 'Pill badge', type: 'text' },
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'titleEmphasis', label: 'Title emphasis', type: 'text' },
    { key: 'subtitle', label: 'Subtitle', type: 'textarea' },
  ]},
  { key: 'serviceBlocks', label: 'Service Blocks', fields: [
    { key: 'serviceBlocks', label: 'Service blocks', type: 'service-blocks', arrayAtRoot: true },
  ]},
  { key: 'engagement', label: 'Engagement Models', fields: [
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'titleEmphasis', label: 'Title emphasis', type: 'text' },
    { key: 'subtitle', label: 'Subtitle', type: 'textarea' },
    { key: 'cards', label: 'Engagement cards', type: 'engagement-cards' },
    { key: 'note', label: 'Footer note', type: 'text' },
  ]},
  { key: 'faq', label: 'FAQ', fields: [
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'titleEmphasis', label: 'Title emphasis', type: 'text' },
    { key: 'subtitle', label: 'Subtitle', type: 'textarea' },
    { key: 'items', label: 'FAQ items', type: 'faq-items' },
  ]},
  { key: 'footerCta', label: 'Footer CTA', fields: [
    { key: 'title', label: 'CTA title', type: 'text' },
    { key: 'text', label: 'CTA text', type: 'textarea' },
    { key: 'button', label: 'Button label', type: 'text' },
  ]},
  { key: 'emailCapture', label: 'Email Capture Popup', fields: [{ key: 'promptHeading', label: 'Heading', type: 'text' }, { key: 'promptSubtext', label: 'Subtext', type: 'text' }, { key: 'buttonLabel', label: 'Button label', type: 'text' }] },
  STRUCTURED_DATA_SECTION,
];
