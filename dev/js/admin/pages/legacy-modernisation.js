export const fbPath = 'pages/legacyModernisation';

export const defaults = {
  hero: {
    pill: 'AI POWERED LEGACY MODERNISATION',
    title: ['Modernise legacy platforms', 'without losing the logic'],
    subtitle: 'Your legacy system works. The problem is nobody can change it quickly, maintain it cheaply, or explain how half of it functions.',
    primaryCta: 'Talk to our team',
    secondaryCta: 'View Case Studies',
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
    summary: 'Most migration projects run over budget and over time. The business logic that took years to build.',
    cards: [
      { number: '01', title: 'Business logic is scattered and undocumented', body: 'Rules live in application code, database triggers, batch scripts, and tribal knowledge. When the people who built it leave, the understanding goes with them.' },
      { number: '02', title: 'Traditional rewrites take too long and break things', body: "Eighteen-month migration timelines that slip to thirty months are common. By the time you finish, the target architecture is already dated - and you've introduced regressions the business discovers in production." },
      { number: '03', title: 'The longer you wait, the more expensive it gets', body: 'Maintenance costs on legacy platforms compound year over year. The engineers who can work on them become rarer and more expensive. Meanwhile, new features are impossible to ship at any reasonable pace.' },
    ],
  },
  howWeWork: {
    kicker: 'How We Work',
    title: ['Six Phases', 'Every rule traced end to end'],
    summary: "We don't rewrite systems from a requirements document. We extract the actual logic from the running system, reconstruct it in a modern stack.",
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
    summary: "The goal isn't just to move code from one language to another. It's to end up with a platform that's cheaper to maintain faster.",
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
      { heading: 'Payment Experts, Not Generalists', body: '20+ years building card platforms, not generic software. We speak authorization flows, 3DS, and scheme integrations fluently.' },
      { heading: 'Proven at scale', body: "Supporting platforms processing 10M+ transactions monthly. We've been there, scaled that." },
      { heading: 'Full-Stack Team', body: 'From strategy to 24x7 ops-no vendor juggling needed. One team, end-to-end ownership.' },
      { heading: 'Compliance-First Approach', body: 'ISO 27001 certified, PCI-DSS aligned, GDPR compliant. Built-in audit readiness from day one.' },
    ],
  },
  fit: {
    kicker: 'Who This Is For',
    title: ['Fintechs that need operations', 'to keep pace with growth'],
    summary: '',
    bullets: [
      'Issuer processors scaling transaction volumes and client count',
      'Card platforms where fraud and disputes are growing faster than headcount',
      "PSPs that need 24x7 monitoring they can't staff in-house",
      'Fintechs looking to reduce ops cost without reducing service quality',
    ],
    engageKicker: 'How We Engage',
    engageCards: [
      { heading: 'Managed services', body: 'full 24x7 ops with SLA-backed outcomes' },
      { heading: 'Team extension', body: 'embed ops specialists into your existing team' },
      { heading: 'Project-based', body: 'set up monitoring, fraud systems, or reconciliation pipelines' },
      { heading: 'Flex support', body: 'shared resources, 30-day rolling, scale when ready' },
    ],
  },
  footerCta: { title: 'Ready to Build Your Card Platform' },
};

export const sections = [
  { key: 'hero', label: 'Hero Section', fields: [{ key: 'pill', label: 'Pill text', type: 'text' }, { key: 'title', label: 'Title (line 1 | line 2)', type: 'title' }, { key: 'subtitle', label: 'Subtitle', type: 'textarea' }, { key: 'primaryCta', label: 'Primary CTA', type: 'text' }, { key: 'secondaryCta', label: 'Secondary CTA', type: 'text' }, { key: 'trustedKicker', label: 'Trusted kicker', type: 'text' }, { key: 'stats', label: 'Stats', type: 'stats' }] },
  { key: 'challenge', label: 'The Problem', fields: [{ key: 'kicker', label: 'Kicker', type: 'text' }, { key: 'title', label: 'Title (line 1 | line 2)', type: 'title' }, { key: 'summary', label: 'Summary', type: 'textarea' }, { key: 'cards', label: 'Problem cards', type: 'numbered-cards' }] },
  { key: 'howWeWork', label: 'How We Work', fields: [{ key: 'kicker', label: 'Kicker', type: 'text' }, { key: 'title', label: 'Title (line 1 | line 2)', type: 'title' }, { key: 'summary', label: 'Summary', type: 'textarea' }, { key: 'stages', label: 'Process stages', type: 'stages' }] },
  { key: 'whatWeBuild', label: 'What We Build', fields: [{ key: 'kicker', label: 'Kicker', type: 'text' }, { key: 'title', label: 'Title (line 1 | line 2)', type: 'title' }, { key: 'summary', label: 'Summary', type: 'textarea' }, { key: 'columns', label: 'Capability columns', type: 'columns' }, { key: 'deliveryKicker', label: 'Delivery kicker', type: 'text' }, { key: 'deliveryCards', label: 'Delivery cards', type: 'heading-body-cards' }] },
  { key: 'howWeBuild', label: 'How We Build', fields: [{ key: 'kicker', label: 'Kicker', type: 'text' }, { key: 'title', label: 'Title (line 1 | line 2)', type: 'title' }, { key: 'summary', label: 'Summary', type: 'textarea' }, { key: 'cards', label: 'Outcome cards', type: 'pill-cards' }] },
  { key: 'why', label: 'Why Panasa', fields: [{ key: 'kicker', label: 'Kicker', type: 'text' }, { key: 'title', label: 'Title (line 1 | line 2)', type: 'title' }, { key: 'summary', label: 'Summary', type: 'textarea' }, { key: 'cards', label: 'Reason cards', type: 'heading-body-cards' }] },
  { key: 'fit', label: 'Who This Is For', fields: [{ key: 'kicker', label: 'Kicker', type: 'text' }, { key: 'title', label: 'Title (line 1 | line 2)', type: 'title' }, { key: 'summary', label: 'Summary', type: 'textarea' }, { key: 'bullets', label: 'Audience bullets', type: 'string-list' }, { key: 'engageKicker', label: 'Engage kicker', type: 'text' }, { key: 'engageCards', label: 'Engagement models', type: 'heading-body-cards' }] },
  { key: 'footerCta', label: 'Footer CTA', fields: [{ key: 'title', label: 'CTA title', type: 'text' }] },
];
