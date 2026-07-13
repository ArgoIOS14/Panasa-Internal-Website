import { SEO_META_EXTRAS } from './seoMetaFields.js';
import { STRUCTURED_DATA_SECTION } from './structuredDataSection.js';

export const fbPath = 'pages/legacyModernisation';

export const defaults = {
  meta: {
    title: 'AI Powered Legacy Modernisation | Panasa',
    description: 'Modernise legacy platforms without losing the logic. We extract business rules from running systems and rebuild them on modern stacks.',
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
    pill: 'AI POWERED LEGACY MODERNISATION',
    title: ['Modernise legacy platforms', 'without losing the logic'],
    subtitle: 'Your legacy system works. The problem is nobody can change it quickly, maintain it cheaply, or explain how half of it functions.',
    primaryCta: { label: 'Talk to our team', href: 'contact.html' },
    secondaryCta: { label: 'View Case Studies', href: '#careers' },
    trustedKicker: 'TRUSTED BY HIGH-GROWTH FINTECHS',
    stats: [
      { value: '30-60%', label: 'Faster migration delivery' },
      { value: '60-75%', label: 'Shorter dev and review cycles' },
      { value: '2-3x', label: 'Engineer productivity uplift' },
      { value: '>90%', label: 'Business logic accuracy retained' },
    ],
  },
  challenge: {
    kicker: 'The Problem',
    title: ['Legacy migration is', 'expensive, slow, and risky'],
    summary: 'Most migration projects run over budget and over time. The business logic that took years to build gets lost in translation, and teams end up rebuilding what they already had. We do it differently.',
    cards: [
      { number: '01', title: 'Business logic is scattered and undocumented', body: 'Rules live in application code, database triggers, batch scripts, and tribal knowledge. When the people who built it leave, the understanding goes with them.' },
      { number: '02', title: 'Traditional rewrites take too long and break things', body: "Eighteen-month migration timelines that slip to thirty months are common. By the time you finish, the target architecture is already dated - and you've introduced regressions the business discovers in production." },
      { number: '03', title: 'The longer you wait, the more expensive it gets', body: 'Maintenance costs on legacy platforms compound year over year. The engineers who can work on them become rarer and more expensive. Meanwhile, new features are impossible to ship at any reasonable pace.' },
    ],
  },
  howWeWork: {
    kicker: 'How We Work',
    title: ['Six Phases', 'Every rule traced end to end'],
    summary: 'Rather than rebuilding platforms from static requirement documents, we extract business logic directly from the live environment, reconstruct it within a modern architecture, and validate behavioural parity against the original system before any transition into production takes place.',
    stages: [
      { heading: 'Extract', description: 'Parse source code, stored procedures, configs, and runtime behaviour into a structured knowledge base' },
      { heading: 'Model', description: 'Map extracted business rules, dependencies, and data flows. Validate with SMEs to catch undocumented behaviour' },
      { heading: 'Decompose', description: 'Break the system into independent migration work units that can be built and tested in parallel' },
      { heading: 'Generate', description: 'AI produces target code and test suites using pattern-driven templates, with business rules as context' },
      { heading: 'Validate', description: 'Five levels of equivalence testing - unit, integration, business process, performance, and UAT' },
      { heading: 'Roll out', description: 'Phased deployment with rollback triggers, dual-run comparison, and hypercare monitoring' },
    ],
  },
  whatWeBuild: {
    kicker: 'What We Build',
    title: ['Platform modernisation', 'for regulated fintechs'],
    summary: 'We work with the kinds of legacy systems fintech companies actually run.',
    columns: [
      { heading: 'Migration patterns', bullets: [
        { icon: null, text: 'Language and framework migration (e.g., .NET Framework to .NET Core, AngularJS to React)' },
        { icon: null, text: 'Platform migration - on-prem to cloud-native, monolith to microservices' },
        { icon: null, text: 'Database migration - Oracle to PostgreSQL, SQL Server to Aurora' },
        { icon: null, text: 'Integration modernisation - SOAP to REST, point-to-point to event-driven' },
        { icon: null, text: 'UI modernisation - thick client to web, legacy frontend to modern SPA' },
      ]},
      { heading: 'Systems we understand from the inside', bullets: [
        { icon: null, text: 'Card issuing and programme management platforms' },
        { icon: null, text: 'Payment processing and authorisation engines' },
        { icon: null, text: 'Reconciliation and settlement workflows' },
        { icon: null, text: 'Scheme integration and certification layers' },
        { icon: null, text: 'Back-office operations and reporting systems' },
      ]},
    ],
    deliveryKicker: 'WHAT MAKES IT FASTER',
    deliveryCards: [
      { heading: 'Automated extraction, not manual discovery', body: 'AI agents parse your codebase, stored procedures, and runtime behaviour to build a structured knowledge base. What traditionally takes months of SME interviews happens in weeks.' },
      { heading: 'Parallel work units, not sequential phases', body: 'The system is decomposed into independent migration units that can be built, tested, and deployed in parallel. Five teams working simultaneously instead of one team working sequentially.' },
      { heading: 'Proven equivalence, not hopeful testing', body: 'We run the legacy and migrated systems side by side on the same inputs and compare outputs. No release happens without proven behavioural equivalence across all business scenarios.' },
    ],
  },
  howWeBuild: {
    kicker: 'How We Build',
    title: ['A modern platform', 'not just a rewrite'],
    summary: "The goal isn't just to move code from one language to another. It's to end up with a platform that's cheaper to maintain and faster to change.",
    cards: [
      { heading: 'Faster feature delivery', body: 'Once migration completes, your engineering team can ship new features in weeks instead of months. The modern stack removes the constraints that made every change expensive.', pill: 'POST-MIGRATION VELOCITY' },
      { heading: 'Lower maintenance costs', body: "Eliminate the premium you're paying for engineers who can work on legacy technology. Modern stacks have larger talent pools, better tooling, and lower operational overhead.", pill: 'REDUCED SME DEPENDENCY' },
      { heading: 'Zero logic loss', body: 'Every business rule is traced from the legacy system through extraction, generation, and validation. A complete traceability matrix is maintained throughout and delivered at the end.', pill: 'FULL AUDIT TRAIL' },
    ],
  },
  why: {
    kicker: 'Why Panasa',
    title: ['Why Fintechs', 'Choose Panasa'],
    summary: 'What sets us apart in the fintech development landscape',
    cards: [
      { heading: 'Fintech Domain Experience', body: 'We have 20+ years of experience working on card platforms, payment engines, and reconciliation systems.' },
      { heading: 'Proven at Scale', body: 'We work with platforms processing 10M+ transactions monthly. We understand what that volume demands when it comes to migration risk and zero-loss deployment.' },
      { heading: 'Full-Stack Team', body: 'A single team handles extraction, rebuild, and deployment. No handoffs between phases.' },
      { heading: 'Compliance-First Approach', body: 'ISO 27001 certified, PCI-DSS aligned, GDPR compliant. Compliance is maintained at every stage of the migration.' },
    ],
  },
  fit: {
    kicker: 'Who This Is For',
    title: ['Fintechs ready to move', 'off legacy platforms'],
    summary: '',
    bullets: [
      'Fintechs running platforms that are expensive to maintain and slow to change',
      'Engineering teams spending more time on upkeep than new features',
      'Organisations where key system knowledge sits with a handful of people',
      'Fintechs preparing for scale but constrained by their current architecture',
      'Teams that have tried rewrites before and run into cost and timeline overruns',
    ],
    engageKicker: 'How We Engage',
    engageCards: [
      { heading: 'Assessment', body: 'codebase review, business logic extraction, and migration scoping' },
      { heading: 'Project-based', body: 'fixed scope, milestone-based delivery' },
      { heading: 'Phased rollout', body: 'parallel run, staged deployment, and go-live support' },
      { heading: 'Ongoing support', body: 'post-migration stabilisation and team handover' },
    ],
  },
  testimonial: { quote: 'We assigned payment platform integration work to Panasa, and they delivered to our utmost satisfaction. We wish Panasa Tech all the best for their future endeavors.', name: 'Aaron Holmes', role: 'Chief Executive Officer – Kani Payments', logo: 'assets/testimonial-logo-kani.svg', logoAlt: 'Kani Payments' },
  faq: { title: 'Frequently Asked', titleEmphasis: 'Questions', subtitle: 'Everything you need to know about Panasa. From capabilities to how we deliver results.', items: [
    { question: 'How does Panasa support issuer processors and fintech platforms?', answer: 'Panasa provides end-to-end engineering, infrastructure, and operations support. We help design, build, scale, and run secure financial platforms reliably.' },
    { question: 'What types of fintech companies does Panasa typically work with?', answer: 'We work with issuer processors, neobanks, payment service providers, BaaS platforms, and programme managers across the UK, EU, and APAC regions.' },
    { question: 'Does Panasa help with compliance and security requirements?', answer: 'Yes. We are ISO 27001 certified and PCI-DSS aligned. Compliance is built into our engineering and operations processes from day one, not bolted on afterwards.' },
    { question: 'Can Panasa help scale platforms with high transaction volumes?', answer: 'Absolutely. We currently support platforms processing over 10 million transactions monthly, with multi-region deployments and 24x7 operational monitoring.' },
    { question: 'How is Panasa different from a typical development agency?', answer: 'We are payment specialists, not generalists. Our team has 20+ years of experience in card platforms, scheme integrations, and regulated fintech environments. We offer end-to-end ownership from engineering through to 24x7 operations.' },
  ] },
  footerCta: { title: 'Ready to Build Your Card Platform' },
};

export const sections = [
  { key: 'meta', label: 'SEO Meta', fields: [
    { key: 'title', label: 'Meta title', type: 'text' },
    { key: 'description', label: 'Meta description', type: 'textarea' },
    ...SEO_META_EXTRAS,
  ]},
  { key: 'hero', label: 'Hero Section', fields: [{ key: 'pill', label: 'Pill text', type: 'text' }, { key: 'title', label: 'Title (line 1 | line 2)', type: 'title' }, { key: 'subtitle', label: 'Subtitle', type: 'textarea' }, { key: 'primaryCta', label: 'Primary CTA', type: 'label-href' }, { key: 'secondaryCta', label: 'Secondary CTA', type: 'label-href' }, { key: 'trustedKicker', label: 'Trusted kicker', type: 'text' }, { key: 'stats', label: 'Stats', type: 'stats', help: 'Stat icons are not rendered on this page — value and label text only.' }] },
  { key: 'challenge', label: 'The Problem', fields: [{ key: 'kicker', label: 'Kicker', type: 'text' }, { key: 'title', label: 'Title (line 1 | line 2)', type: 'title' }, { key: 'summary', label: 'Summary', type: 'textarea' }, { key: 'cards', label: 'Problem cards', type: 'numbered-cards' }] },
  { key: 'howWeWork', label: 'How We Work', fields: [{ key: 'kicker', label: 'Kicker', type: 'text' }, { key: 'title', label: 'Title (line 1 | line 2)', type: 'title' }, { key: 'summary', label: 'Summary', type: 'textarea' }, { key: 'stages', label: 'Process stages', type: 'stages' }] },
  { key: 'whatWeBuild', label: 'What We Build', fields: [{ key: 'kicker', label: 'Kicker', type: 'text' }, { key: 'title', label: 'Title (line 1 | line 2)', type: 'title' }, { key: 'summary', label: 'Summary', type: 'textarea' }, { key: 'columns', label: 'Capability columns', type: 'columns', help: 'Bullet icons are not rendered on this page — heading and bullet text only.' }, { key: 'deliveryKicker', label: 'Delivery kicker', type: 'text' }, { key: 'deliveryCards', label: 'Delivery cards', type: 'heading-body-cards' }] },
  { key: 'howWeBuild', label: 'How We Build', fields: [{ key: 'kicker', label: 'Kicker', type: 'text' }, { key: 'title', label: 'Title (line 1 | line 2)', type: 'title' }, { key: 'summary', label: 'Summary', type: 'textarea' }, { key: 'cards', label: 'Outcome cards', type: 'pill-cards' }] },
  { key: 'why', label: 'Why Panasa', fields: [{ key: 'kicker', label: 'Kicker', type: 'text' }, { key: 'title', label: 'Title (line 1 | line 2)', type: 'title' }, { key: 'summary', label: 'Summary', type: 'textarea' }, { key: 'cards', label: 'Reason cards', type: 'heading-body-cards' }] },
  { key: 'fit', label: 'Who This Is For', fields: [{ key: 'kicker', label: 'Kicker', type: 'text' }, { key: 'title', label: 'Title (line 1 | line 2)', type: 'title' }, { key: 'summary', label: 'Summary', type: 'textarea' }, { key: 'bullets', label: 'Audience bullets', type: 'string-list' }, { key: 'engageKicker', label: 'Engage kicker', type: 'text' }, { key: 'engageCards', label: 'Engagement models', type: 'heading-body-cards' }] },
  { key: 'testimonial', label: 'Testimonial', fields: [{ key: 'quote', label: 'Quote', type: 'textarea' }, { key: 'name', label: 'Name', type: 'text' }, { key: 'role', label: 'Role / company', type: 'text' }, { key: 'logo', label: 'Logo image', type: 'image' }, { key: 'logoAlt', label: 'Logo alt text', type: 'text' }] },
  { key: 'faq', label: 'FAQ', fields: [{ key: 'title', label: 'Title', type: 'text' }, { key: 'titleEmphasis', label: 'Title (emphasised word)', type: 'text' }, { key: 'subtitle', label: 'Subtitle', type: 'textarea' }, { key: 'items', label: 'FAQ items', type: 'faq-items', help: 'The page only has 5 FAQ slots — only the first 5 items render.' }] },
  { key: 'footerCta', label: 'Footer CTA', fields: [{ key: 'title', label: 'CTA title', type: 'text' }] },
  STRUCTURED_DATA_SECTION,
];
