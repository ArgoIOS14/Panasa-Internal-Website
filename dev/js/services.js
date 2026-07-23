import { initScrollAnimations } from './Home scenes/components/animations.js';
import './smooth-scroll.js';
import { loadContent } from './Home scenes/data/loadContent.js';
import { renderFooter } from './Home scenes/sections/footer.js';
import { renderLogoMarquee } from './Home scenes/sections/logoMarquee.js';
import { initNavToggle, renderNav } from './Home scenes/sections/nav.js';
import { initEmailCapture } from './Home scenes/components/email-capture.js';
import { firebaseConfig } from './firebase-config.js';
import { applySeoMeta } from './seo-meta.js';

// Live preview — only loaded in ?preview=true mode (admin panel iframe)
if (new URLSearchParams(window.location.search).get('preview') === 'true') {
  import('./live-preview-receiver.js').catch(() => { /* non-critical */ });
}

const TRUSTED_LOGOS = [
  { src: 'assets/logo-accelovate.svg', alt: 'Accelovate' },
  { src: 'assets/logo-paymentology.svg', alt: 'Paymentology' },
  { src: 'assets/logo-crunch.svg', alt: 'Crunch' },
  { src: 'assets/logo-ribbon-gi.svg', alt: 'Ribbon GI' },
  { src: 'assets/logo-kani.svg', alt: 'Kani' },
  { src: 'assets/logo-88-eu.svg', alt: '88 EU' },
  { src: 'assets/logo-osper.svg', alt: 'Osper' },
  { src: 'assets/logo-paci.svg', alt: 'Paci' },
  { src: 'assets/logo-prosper.svg', alt: 'Prosper' },
  { src: 'assets/logo-dialect.svg', alt: 'Dialect' },
];

const AI_ACCELERATED_COPY = {
  hero: {
    pill: 'AI Accelerated Fintech Engineering',
    title: ['Ship fintech', 'platforms faster'],
    subtitle:
      'We build card programmes, payment engines, and issuing platforms for regulated fintechs. Our teams use AI tooling to cut delivery timelines in half.',
    primaryCta: 'Talk to our team',
    secondaryCta: 'View Case Studies',
    trustedKicker: 'Trusted by High-Growth Fintechs',
    stats: [
      { value: '50%', label: 'Faster delivery vs traditional teams' },
      { value: '75%', label: 'Shorter code review cycles' },
      { value: '3x', label: 'Engineer productivity with AI tooling' },
      { value: '800M+', label: 'Transactions managed across clients' },
    ],
  },
  challenge: {
    kicker: 'The Problem',
    title: ['Fintech teams are stuck', 'maintaining instead of building'],
    summary:
      'Most engineering organisations we work with are spending 60-70% of their time on maintenance and compliance remediation',
    cards: [
      {
        number: '01',
        title: 'Scale breaks manual processes',
        body: 'What works at a million transactions falls apart at ten million. Exception handling, edge cases, and reconciliation gaps multiply faster than teams can patch them.',
      },
      {
        number: '02',
        title: 'Compliance slows every release',
        body: 'PCI recertification, scheme mandate updates, FCA reporting changes — each one adds weeks to your release cycle when bolted on at the end instead of built in from the start.',
      },
      {
        number: '03',
        title: 'Tech debt compounds quietly',
        body: 'Legacy code written three years ago now consumes most of your sprint capacity. New features get squeezed into whatever time remains, and quality suffers.',
      },
    ],
  },
  howWeWork: {
    kicker: 'How We Work',
    title: ['Five stages,', 'continuous feedback'],
    summary:
      "No need to hire, train, and manage multiple teams. We're your end-to-end fintech engineering and operations partner.",
    stages: [
      {
        heading: 'Scope',
        description: 'Problem framing, acceptance criteria, scheme rules mapped to requirements',
      },
      {
        heading: 'Prototype',
        description: 'Competing approaches built on separate branches. Working code in days, not weeks',
      },
      {
        heading: 'Validate',
        description: 'Automated linting, security scans, type checks. Issues caught and fixed before review',
      },
      {
        heading: 'Test',
        description: 'AI-generated test suites from acceptance criteria. 80%+ coverage enforced at the pipeline level',
      },
      {
        heading: 'Deploy',
        description: 'Progressive rollout with canary releases, automated rollback triggers, and full observability',
      },
    ],
  },
  whatWeBuild: {
    kicker: 'What We Build',
    title: ['Payment Infrastructure', 'for Regulated Platforms'],
    summary:
      'Core payment and platform capabilities delivered for issuers, programme managers, and embedded finance products.',
    columns: [
      {
        heading: 'Payment & Issuing',
        bullets: [
          'Card issuing and programme management',
          'Authorisation and payment processing engines',
          'Visa and Mastercard scheme integrations',
          'Tokenisation and digital wallet enablement',
          'Open banking and embedded finance APIs',
        ],
      },
      {
        heading: 'Platform Architecture',
        bullets: [
          'API-first microservices for composability',
          'Event-driven workflows for real-time processing',
          'Multi-tenant design for programme managers',
          'Zero-trust partner integrations',
        ],
      },
    ],
    deliveryKicker: 'What Makes Delivery Faster',
    deliveryCards: [
      {
        heading: 'Specs generated from requirements',
        body: 'Business requirements become implementation-ready specs with automated consistency checks across service boundaries. Less ambiguity, fewer rounds of clarification.',
      },
      {
        heading: 'Tests written alongside features',
        body: "Test suites are generated in parallel with code, not queued after it. The QA bottleneck that delays most fintech releases doesn't exist in our process.",
      },
      {
        heading: 'Scheme playbooks, not guesswork',
        body: 'We maintain runbooks for Visa and Mastercard certification, partner onboarding sequences, and compliance checkpoints. Repeatable process, fewer surprises.',
      },
    ],
  },
  howWeBuild: {
    kicker: 'How We Build',
    title: ['Production-grade', 'from sprint one'],
    summary:
      "We don't build prototypes that need to be rebuilt for production. Every platform is architected for the transaction volumes, compliance requirements, and operational demands of live fintech environments.",
    cards: [
      {
        heading: 'High availability',
        body: 'Multi-region deployment, failover routing, and observability stacks that give your ops team clear signal not noise at any transaction volume.',
        pill: '99.99% UPTIME',
      },
      {
        heading: 'Operational visibility',
        body: 'Real-time dashboards, immutable audit logs, and traceable workflows. When something goes wrong at 2am, your on-call team can diagnose it in minutes.',
        pill: 'FULL TRACEABILITY',
      },
      {
        heading: 'Compliance from day one',
        body: 'PCI DSS controls, FCA reporting hooks, and GDPR data handling designed into the architecture not discovered as gaps during your next audit.',
        pill: 'PCI & FCA READY',
      },
    ],
  },
  why: {
    kicker: 'Why Panasa',
    title: ["Why Fintechs", 'Choose Panasa'],
    summary:
      'What sets us apart in the fintech development landscape',
    cards: [
      {
        heading: 'Payment Engineering Experts',
        body: '20+ years building card platforms. We speak authorization flows, 3DS, and scheme integrations fluently.',
      },
      {
        heading: 'Proven at Scale',
        body: 'We work with platforms processing 10M+ transactions monthly. We understand what that volume demands operationally and technically.',
      },
      {
        heading: 'Full-Stack Team',
        body: 'We cover everything from scoping and architecture to deployment and ongoing support. One engineering team, end-to-end delivery, no handoffs.',
      },
      {
        heading: 'Compliance-First Approach',
        body: 'ISO 27001 certified, PCI-DSS aligned, GDPR compliant. Compliance is built into how we work, not added at the end.',
      },
    ],
  },
  fit: {
    kicker: 'Who This Is For',
    title: ['Built for regulated', 'high-growth fintechs'],
    summary: '',
    bullets: [
      'Issuer processors scaling card programme volume',
      'PSPs and acquirers modernising legacy stacks',
      'Neobanks expanding into new markets and schemes',
      'BaaS providers managing complex partner integrations',
    ],
    engageKicker: 'How We Engage',
    engageCards: [
      { heading: 'Engineering squads', body: 'month-to-month, flexible' },
      { heading: 'Project-based', body: 'fixed scope, milestone billing' },
      { heading: 'Managed services', body: '24x7, SLA-backed' },
      { heading: 'GCC delivery', body: 'your own offshore hub' },
    ],
  },
  faq: {
    title: 'Frequently Asked',
    titleEmphasis: 'Questions',
    subtitle: 'Everything you need to know about Panasa. From capabilities to how we deliver results.',
    items: [
      { question: 'How does Panasa support issuer processors and fintech platforms?', answer: 'Panasa provides end-to-end engineering, infrastructure, and operations support. We help design, build, scale, and run secure financial platforms reliably.' },
      { question: 'What types of fintech companies does Panasa typically work with?', answer: 'We work with issuer processors, neobanks, payment service providers, BaaS platforms, and programme managers across the UK, EU, and APAC regions.' },
      { question: 'Does Panasa help with compliance and security requirements?', answer: 'Yes. We are ISO 27001 certified and PCI-DSS aligned. Compliance is built into our engineering and operations processes from day one, not bolted on afterwards.' },
      { question: 'Can Panasa help scale platforms with high transaction volumes?', answer: 'Absolutely. We currently support platforms processing over 10 million transactions monthly, with multi-region deployments and 24x7 operational monitoring.' },
      { question: 'How is Panasa different from a typical development agency?', answer: 'We are payment specialists, not generalists. Our team has 20+ years of experience in card platforms, scheme integrations, and regulated fintech environments. We offer end-to-end ownership from engineering through to 24x7 operations.' },
    ],
  },
  testimonial: {
    quote: 'Panasa has been a great asset in developing our payment solutions, acting as a true extension of our team while enabling us to accelerate delivery and scale with confidence. We highly recommend their fintech engineering services.',
    name: 'Giovanni Santini',
    role: 'Chief Executive Officer – Osper',
    logo: 'assets/testimonial-logo-osper.svg',
    logoAlt: 'Osper',
  },
  footerCta: {
    title: 'Ready to Build Your Card Platform',
  },
};

const LEGACY_MODERNISATION_COPY = {
  hero: {
    pill: 'AI POWERED LEGACY MODERNISATION',
    title: ['Modernise legacy platforms', 'without losing the logic'],
    subtitle:
      'Your legacy system works. The problem is nobody can change it quickly, maintain it cheaply, or explain how half of it functions.',
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
    summary:
      'Most migration projects run over budget and over time. The business logic that took years to build gets lost in translation, and teams end up rebuilding what they already had. We do it differently.',
    cards: [
      {
        number: '01',
        title: 'Business logic is scattered and undocumented',
        body: 'Rules live in application code, database triggers, batch scripts, and tribal knowledge. When the people who built it leave, the understanding goes with them.',
      },
      {
        number: '02',
        title: 'Traditional rewrites take too long and break things',
        body: "Eighteen-month migration timelines that slip to thirty months are common. By the time you finish, the target architecture is already dated - and you've introduced regressions the business discovers in production.",
      },
      {
        number: '03',
        title: 'The longer you wait, the more expensive it gets',
        body: 'Maintenance costs on legacy platforms compound year over year. The engineers who can work on them become rarer and more expensive. Meanwhile, new features are impossible to ship at any reasonable pace.',
      },
    ],
  },
  howWeWork: {
    kicker: 'How We Work',
    title: ['Six Phases', 'Every rule traced end to end'],
    summary:
      'Rather than rebuilding platforms from static requirement documents, we extract business logic directly from the live environment, reconstruct it within a modern architecture, and validate behavioural parity against the original system before any transition into production takes place.',
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
      {
        heading: 'Migration patterns',
        bullets: [
          'Language and framework migration (e.g., .NET Framework to .NET Core, AngularJS to React)',
          'Platform migration - on-prem to cloud-native, monolith to microservices',
          'Database migration - Oracle to PostgreSQL, SQL Server to Aurora',
          'Integration modernisation - SOAP to REST, point-to-point to event-driven',
          'UI modernisation - thick client to web, legacy frontend to modern SPA',
        ],
      },
      {
        heading: 'Systems we understand from the inside',
        bullets: [
          'Card issuing and programme management platforms',
          'Payment processing and authorisation engines',
          'Reconciliation and settlement workflows',
          'Scheme integration and certification layers',
          'Back-office operations and reporting systems',
        ],
      },
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
    summary:
      "The goal isn't just to move code from one language to another. It's to end up with a platform that's cheaper to maintain and faster to change.",
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
  faq: {
    title: 'Frequently Asked',
    titleEmphasis: 'Questions',
    subtitle: 'Everything you need to know about Panasa. From capabilities to how we deliver results.',
    items: [
      { question: 'How does Panasa support issuer processors and fintech platforms?', answer: 'Panasa provides end-to-end engineering, infrastructure, and operations support. We help design, build, scale, and run secure financial platforms reliably.' },
      { question: 'What types of fintech companies does Panasa typically work with?', answer: 'We work with issuer processors, neobanks, payment service providers, BaaS platforms, and programme managers across the UK, EU, and APAC regions.' },
      { question: 'Does Panasa help with compliance and security requirements?', answer: 'Yes. We are ISO 27001 certified and PCI-DSS aligned. Compliance is built into our engineering and operations processes from day one, not bolted on afterwards.' },
      { question: 'Can Panasa help scale platforms with high transaction volumes?', answer: 'Absolutely. We currently support platforms processing over 10 million transactions monthly, with multi-region deployments and 24x7 operational monitoring.' },
      { question: 'How is Panasa different from a typical development agency?', answer: 'We are payment specialists, not generalists. Our team has 20+ years of experience in card platforms, scheme integrations, and regulated fintech environments. We offer end-to-end ownership from engineering through to 24x7 operations.' },
    ],
  },
  testimonial: {
    quote: 'We assigned payment platform integration work to Panasa, and they delivered to our utmost satisfaction. We wish Panasa Tech all the best for their future endeavors.',
    name: 'Aaron Holmes',
    role: 'Chief Executive Officer – Kani Payments',
    logo: 'assets/testimonial-logo-kani.svg',
    logoAlt: 'Kani Payments',
  },
  footerCta: { title: 'Ready to Build Your Card Platform' },
};

const INTELLIGENT_OPERATIONS_COPY = {
  hero: {
    pill: 'INTELLIGENT OPERATIONS',
    title: ['Fintech operations that scale', 'without scaling headcount'],
    subtitle:
      'Transaction volumes increase faster than most operational models are designed to handle, while chargeback rules continue to evolve on a quarterly basis and clients expect sub hour response times at all hours of the day. Traditional operations teams often struggle under that level of pressure. We build intelligent operational systems specifically designed to perform at that scale.',
    primaryCta: 'Talk to our team',
    secondaryCta: 'View Case Studies',
    trustedKicker: 'TRUSTED BY HIGH-GROWTH FINTECHS',
    stats: [
      { value: '99.99%', label: 'System uptime maintained' },
      { value: '<1hr', label: 'P1 incident response time' },
      { value: '30-50%', label: 'Cost reduction in-house' },
      { value: '99.9%', label: 'Dispute SLA adherence' },
    ],
  },
  challenge: {
    kicker: 'The Problem',
    title: ['Operations gets harder every', 'quarter and your team is already stretched'],
    summary: 'Transaction volumes go up. Chargeback rules change. New scheme mandates land.',
    cards: [
      { number: '01', title: 'Support tickets spike, resolution slows', body: 'As your client base grows, so does the volume of inquiries, disputes, and technical issues. Without structured L1/L2/L3 tiers and proper escalation paths, everything bottlenecks at the same small team.' },
      { number: '02', title: 'Reconciliation and reporting are manual', body: 'Settlements, chargebacks, scheme fees reconciled in spreadsheets, cross-checked by hand, and delivered late. One missed exception can cascade into regulatory reporting problems.' },
      { number: '03', title: 'Fraud slips through because nobody is watching at 2am', body: "Fraudsters don't work business hours. Without round-the-clock monitoring, rule-based detection, and a team that can act immediately, you find out about fraud from your clients - not your systems." },
    ],
  },
  domains: {
    kicker: 'What We Run',
    title: ['Six Operational Domains', 'One Team'],
    summary: "We don't just monitor dashboards. We run the full back-office — from real-time transaction monitoring through to dispute resolution.",
    cards: [
      { heading: 'Transaction monitoring and uptime', body: '24x7 service monitoring with alerting and escalation. Dashboard monitoring, investigation of alerts, immediate escalation per defined runbooks. Tools: Coralogix, Datadog, NewRelic, CloudWatch, PagerDuty.' },
      { heading: 'Fraud and risk handling', body: 'Real-time fraud detection with rule-based engines and ML models. Fraud queues, block/unblock workflows, integration with card controls and 3DS alerts. Prevention strategies and ongoing rule tuning.' },
      { heading: 'Customer and cardholder support', body: 'L1 through L3 support across voice, chat, email, and in-app channels. Inquiry handling, card status updates, dispute assistance, and social media monitoring. Feedback loop to product and analytics.' },
      { heading: 'Disputes and chargebacks', body: 'Full lifecycle chargeback management - rule-based tagging, document workflows, evidence gathering, and response generation. SLA tracking and Visa/Mastercard scheme alignment.' },
      { heading: 'Reporting and reconciliation', body: 'Daily reconciliation of transactions, settlements, and chargebacks. Exception logs, scheduled pipelines for audit-ready data, and integration with BI tools like Power BI.' },
      { heading: 'Onboarding and implementation', body: 'Platform onboarding for new clients. Merchant setup, KYC review, operations playbook creation, and weekly/monthly reporting. Secure infrastructure with role-based access.' },
    ],
  },
  deliverables: {
    kicker: 'How It Works',
    title: ['Structured support tiers', 'not ad hoc firefighting'],
    summary: 'We run multi-tier support with defined response times, escalation paths, and KPIs for every level.',
    supportTiers: [
      { heading: 'L1 operations - 24x7', bullets: ['Customer support - voice and non-voice', 'Transaction analysis and service monitoring', 'Fraud analysis and queue management', 'Implementation support and client onboarding', 'Initial triage and ticket prioritisation'] },
      { heading: 'L2 operations - 24x7', bullets: ['Production support and incident management', 'Infrastructure and network security', 'DevOps pipeline management', 'Complex issue investigation and RCA', 'Security operations and compliance support'] },
    ],
    aiAgentsKicker: 'AI Agents In Operations',
    aiAgents: [
      { heading: 'Scheme Compliance Monitoring', body: 'Automatically tracks Visa and Mastercard bulletins, classifies changes as regulatory, policy, or informational, maps impact to affected business units, and generates compliance tickets in Jira. Replaces the manual process of reading circulars and emailing teams.' },
      { heading: 'Incident Documentation Agent', body: 'Monitors DataDog, Prometheus, and PagerDuty to capture incidents automatically. Consolidates logs, metrics, and alerts into a unified timeline. Generates structured summaries, RCA skeletons, and client-ready status updates - so engineers resolve instead of documenting.' },
      { heading: 'Client Onboarding Assistant', body: 'Ingests onboarding documents, extracts and validates configuration fields across ninety-plus parameters, and promotes settings across dev, staging, and production environments with controlled approvals. Cuts manual data entry and environment mismatches.' },
      { heading: 'Due Diligence Agent', body: 'Screens entities against global sanctions, PEP watchlists, and adverse media. Generates onboarding risk summaries, maintains continuous re-screening of existing clients, and routes high-risk cases through enhanced due diligence workflows.' },
    ],
  },
  howWeBuild: {
    kicker: 'What Changes',
    title: ['Operations becomes a growth', 'function, not a cost centre'],
    summary:
      "The point isn't just to keep things running. It's to run them well enough that operations become a growth function, not a cost centre.",
    cards: [
      { heading: 'Scale without proportional headcount', body: 'AI accelerators and automation handle the volume growth. You go from ten to fifty card programmes without a linear increase in ops cost. Outcome-based pricing means you pay for results, not seats.', pill: '30-50% COST REDUCTION' },
      { heading: 'Faster resolution, better CSAT', body: 'Structured tiers, intelligent triage, and AI-assisted responses mean faster first-contact resolution. Your clients notice the difference - in response times, in accuracy, and in how quickly issues close.', pill: '9/10 CLIENT CSAT*' },
      { heading: 'Compliance handled, not chased', body: "Reconciliation, scheme reporting, AML / KYC workflows, and regulatory submissions happen on schedule - not as last-minute scrambles. Audit-ready data pipelines mean you're always prepared.", pill: 'ALWAYS AUDIT-READY' },
    ],
  },
  why: {
    kicker: 'Why Panasa',
    title: ['Why Fintechs', 'Choose Panasa'],
    summary: 'What sets us apart in the fintech development landscape',
    cards: [
      { heading: 'Payments Operations Experience', body: 'We have 20+ years working across card platforms, dispute lifecycles, scheme rules, and reconciliation workflows. This is all we do.' },
      { heading: 'Proven at Scale', body: 'We manage 800M+ transactions across clients. We understand what high-volume fintech operations demand day to day.' },
      { heading: 'Full-Stack Operations Team', body: 'We cover L1 to L3 support, fraud monitoring, disputes, reconciliation, and reporting. One team, one point of contact.' },
      { heading: 'Compliance Built In', body: 'ISO 27001 certified, PCI-DSS aligned, GDPR compliant. Reconciliation, scheme reporting, and audit pipelines run on schedule.' },
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
  faq: {
    title: 'Frequently Asked',
    titleEmphasis: 'Questions',
    subtitle: 'Everything you need to know about Panasa. From capabilities to how we deliver results.',
    items: [
      { question: 'How does Panasa support issuer processors and fintech platforms?', answer: 'Panasa provides end-to-end engineering, infrastructure, and operations support. We help design, build, scale, and run secure financial platforms reliably.' },
      { question: 'What types of fintech companies does Panasa typically work with?', answer: 'We work with issuer processors, neobanks, payment service providers, BaaS platforms, and programme managers across the UK, EU, and APAC regions.' },
      { question: 'Does Panasa help with compliance and security requirements?', answer: 'Yes. We are ISO 27001 certified and PCI-DSS aligned. Compliance is built into our engineering and operations processes from day one, not bolted on afterwards.' },
      { question: 'Can Panasa help scale platforms with high transaction volumes?', answer: 'Absolutely. We currently support platforms processing over 10 million transactions monthly, with multi-region deployments and 24x7 operational monitoring.' },
      { question: 'How is Panasa different from a typical development agency?', answer: 'We are payment specialists, not generalists. Our team has 20+ years of experience in card platforms, scheme integrations, and regulated fintech environments. We offer end-to-end ownership from engineering through to 24x7 operations.' },
    ],
  },
  testimonial: {
    quote: "Panasa allows us to focus on growing our brands. With their fintech expertise, dedication, ability to scale our operations, and meticulous attention to detail, we're able to position ourselves as one of the most cutting-edge groups in payment solutions.",
    name: 'Tom Bishop',
    role: 'Chief Commercial Officer – Cleva',
    logo: 'assets/testimonial-logo-cleava.svg',
    logoAlt: 'Cleva',
  },
  footerCta: { title: 'Ready to Build Your Card Platform' },
};

const AI_GOVERNANCE_COPY = {
  hero: {
    pill: 'AI Governance',
    title: ['AI governance for teams', "that can't afford to guess"],
    subtitle:
      'Move from scattered AI use to visible controls, clear ownership, and audit-ready governance designed for regulated fintech environments.',
    primaryCta: 'Talk to our team',
    secondaryCta: 'View Case Studies',
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
    summary:
      'Engineers are already using Copilot and ChatGPT as part of their daily workflows, while customer support teams increasingly depend on AI assistants to manage scale, responsiveness, and operational efficiency. As adoption accelerates across the enterprise, governance frameworks often struggle to keep pace with the risks, oversight requirements, and regulatory obligations that accompany production grade AI deployment.',
    cards: [
      { number: '01', title: 'Shadow AI is already running', body: 'Teams adopt AI tools faster than policies can keep up. Unsanctioned tools process customer data, generate code that goes into production, and make decisions that affect end users with no oversight and no audit trail.' },
      { number: '02', title: 'Regulators are moving faster than you think', body: 'The EU AI Act is in force. ISO 42001 is the new governance standard. DORA demands operational resilience including for AI systems. If your answer to "how do you govern AI?" is a blank stare, that\'s a problem with a deadline attached.' },
      { number: '03', title: 'A security incident is a matter of when, not if', body: "Prompt injection, data leakage through AI APIs, and model hallucinations in customer-facing systems aren't theoretical risks. Without proper controls, your AI tools are an open attack surface that nobody is monitoring." },
    ],
  },
  domains: {
    kicker: 'What We Cover',
    title: ['Seven Domains —', 'End to End'],
    summary: 'The framework covers everything from risk classification to shadow AI detection. Each domain maps directly to ISO 42001, NIST AI RMF.',
    cards: [
      { heading: 'AI Risk Management', body: 'Identify and classify every AI system by risk level. Build a risk register, run mandatory impact assessments for high-risk AI, and put vendor due diligence in place for third-party tools.', pill: 'ISO 42001 6.1 & 8.4 · NIST AI RMF: Map & Measure' },
      { heading: 'AI Security, Data Privacy & Protection', body: 'Test your AI systems against the OWASP LLM Top 10. Run adversarial and prompt injection testing. Harden models, lock down access controls, and implement DLP.', pill: 'ISO 42001 6.1 & 8.4 · OWASP Top 10 for LLMs' },
      { heading: 'Model, Tool & Lifecycle Governance', body: 'Stage-gates from design through deployment to decommission. Version control, model cards, documentation standards, and a clear change management process.', pill: 'ISO 42001 8.3 · NIST AI RMF: Govern & Manage' },
      { heading: 'Regulatory Alignment', body: 'Clause-by-clause gap mapping against ISO 42001, NIST AI RMF, EU AI Act, and GDPR. Audit-ready evidence packs and compliance reporting that your regulators will actually accept.', pill: 'ISO 42001 · NIST AI RMF · EU AI Act · GDPR' },
      { heading: 'Human-in-the-loop Controls', body: 'Mandatory human review for high-risk AI decisions. Override and escalation mechanisms for critical outputs. Full audit trail linking every AI-assisted decision to a responsible person.', pill: 'ISO 42001 8.6 · NIST AI RMF: Govern & Manage' },
      { heading: 'Data Governance, Lineage & DLP', body: 'Track data from source through training to output. Detect data poisoning, mask PII, and enforce retention and deletion policies including right-to-erasure compliance.', pill: 'ISO 42001 8.4 · GDPR · NIST AI RMF: Govern' },
      { heading: 'Shadow AI Management', body: 'Discover and inventory every unsanctioned AI tool in your organisation. Risk-score each one. Enforce an Acceptable Use Policy and roll out awareness training.', pill: 'ISO 42001 8.2 · NIST AI RMF: Map' },
    ],
  },
  deliverables: {
    kicker: 'What We Build',
    title: ['11 Audit Ready', 'Deliverables'],
    summary: 'Every engagement produces a defined set of reports, assessments, and action plans.',
    items: [
      { heading: 'AI Risk Visibility & Safe-Use Baseline', body: 'A complete inventory of every AI tool, model, and system in use and whether the basics are in place to use them safely.' },
      { heading: 'Regulatory & Compliance Gap Report', body: 'Where your AI practices fall short of what regulators expect, mapped against ISO 42001, NIST, and EU AI Act requirements.' },
      { heading: 'Model & Application Integrity Review', body: 'How your AI models were built, trained, and deployed and whether there are hidden risks in the process.' },
      { heading: 'Data Privacy & Protection Assessment', body: 'Whether the data going into your AI (and coming out of it) is handled safely, especially sensitive or personal information.' },
      { heading: 'Responsible AI Risk Findings', body: 'Whether your AI makes fair, explainable decisions and whether humans are properly in the loop to catch mistakes.' },
      { heading: 'AI Security Risk Assessment', body: 'How secure your AI is against prompt manipulation, data leakage, API abuse, and unauthorised access.' },
      { heading: 'Third-Party & Supply Chain AI Risk Report', body: 'The external AI tools, platforms, and vendors you rely on and the hidden risks that come with them.' },
      { heading: 'AI Governance & Controls Recommendations', body: 'Practical policies, roles, and processes your team should put in place to govern AI responsibly going forward.' },
      { heading: 'AI Monitoring & Audit Readiness Check', body: 'Whether you have the right logging and alerts in place to catch problems early and satisfy auditors.' },
      { heading: 'Prioritised Remediation Roadmap', body: 'A step-by-step action plan ranked by risk: what to fix first, what can wait, and how to get there.' },
      { heading: 'Executive Summary for Leadership', body: 'A jargon-free briefing covering your overall AI risk position and the top actions leadership needs to take.' },
    ],
    cadenceKicker: 'Delivery Cadence',
    cadenceCards: [
      { heading: 'Initial assessment', body: 'All eleven deliverables produced in the first engagement. Typically eight to twelve weeks.' },
      { heading: 'Recurring reviews', body: 'Annual full reviews. Bi-annual security retests. Quarterly monitoring health checks.' },
      { heading: 'Trigger-based updates', body: 'New AI deployments, regulatory changes, or incidents trigger targeted reassessments on demand.' },
    ],
  },
  howWeBuild: {
    kicker: 'How We Build',
    title: ['Twelve months', 'to full governance'],
    summary:
      'Effective governance cannot exist as a layer added after deployment. We architect AI platforms in which auditability, operational oversight, policy enforcement, and risk controls are embedded directly into the system design, ensuring governance remains enforceable as adoption scales.',
    cards: [
      { heading: 'Foundation', body: 'AI inventory and risk classification. Shadow AI audit. Appoint governance roles and human-in-the-loop reviewers. Draft Acceptable Use Policy and launch awareness programme.', pill: 'Months 1 - 3' },
      { heading: 'Controls & security', body: 'VAPT and OWASP LLM Top 10 testing. Data governance, DLP controls, and lineage mapping. Model lifecycle stage-gates and third-party risk management to the reviews.', pill: 'Months 4 - 6' },
      { heading: 'Monitoring & awareness', body: 'Deploy observability and drift detection stack. AI awareness training for all staff. Human-in-the-loop workflows, incident drills, and Acceptable Use Policy enforcement.', pill: 'Months 7 - 9' },
      { heading: 'Audit & compliance', body: 'ISO 42001 and NIST AI RMF gap audit. OWASP LLM control review. Regulatory compliance review. Publish AI Transparency Report and set next-cycle objectives.', pill: 'Months 10 - 12' },
    ],
  },
  why: {
    kicker: 'Why Panasa',
    title: ['Why Fintechs', 'Choose Panasa'],
    summary: 'What sets us apart in the fintech development landscape',
    cards: [
      { heading: 'Fintech Regulatory Knowledge', body: 'We understand the regulatory environment fintechs operate in. Our frameworks are built around EU AI Act, ISO 42001, NIST AI RMF, and DORA.' },
      { heading: 'Across the Full Governance Stack', body: 'We cover all seven governance domains, from risk classification to shadow AI detection. One engagement, end-to-end coverage.' },
      { heading: 'One Team Throughout', body: 'The same team runs your assessment, builds your framework, and supports ongoing reviews. No handoffs between consultants.' },
      { heading: 'Compliance Built In', body: 'ISO 27001 certified, PCI-DSS aligned, GDPR compliant. Audit readiness is part of how we work, not a final step.' },
    ],
  },
  fit: {
    kicker: 'Who This Is For',
    title: ['Fintechs that use AI', 'and need to prove they control it'],
    summary: '',
    bullets: [
      'Regulated fintechs preparing for EU AI Act or DORA obligations',
      'CTOs and compliance leads who need audit-ready AI governance',
      'Engineering-led organisations with growing AI tool adoption',
      'PE-backed fintechs where investors are asking about AI risk',
    ],
    engageKicker: 'How We Engage',
    engageCards: [
      { heading: 'Assessment', body: 'Eight to twelve week initial governance review.' },
      { heading: 'Implementation', body: 'Twelve month framework rollout.' },
      { heading: 'Ongoing assurance', body: 'Quarterly monitoring and annual reviews.' },
      { heading: 'Incident response', body: 'On-demand reassessment after AI incidents.' },
    ],
  },
  faq: {
    title: 'Frequently Asked',
    titleEmphasis: 'Questions',
    subtitle: 'Everything you need to know about Panasa. From capabilities to how we deliver results.',
    items: [
      { question: 'How does Panasa support issuer processors and fintech platforms?', answer: 'Panasa provides end-to-end engineering, infrastructure, and operations support. We help design, build, scale, and run secure financial platforms reliably.' },
      { question: 'What types of fintech companies does Panasa typically work with?', answer: 'We work with issuer processors, neobanks, payment service providers, BaaS platforms, and programme managers across the UK, EU, and APAC regions.' },
      { question: 'Does Panasa help with compliance and security requirements?', answer: 'Yes. We are ISO 27001 certified and PCI-DSS aligned. Compliance is built into our engineering and operations processes from day one, not bolted on afterwards.' },
      { question: 'Can Panasa help scale platforms with high transaction volumes?', answer: 'Absolutely. We currently support platforms processing over 10 million transactions monthly, with multi-region deployments and 24x7 operational monitoring.' },
      { question: 'How is Panasa different from a typical development agency?', answer: 'We are payment specialists, not generalists. Our team has 20+ years of experience in card platforms, scheme integrations, and regulated fintech environments. We offer end-to-end ownership from engineering through to 24x7 operations.' },
    ],
  },
  testimonial: {
    quote: "With it now being commonplace for most UK developers to work remotely, we've found transitioning assignments to Panasa a breeze. They're extremely conscientious, have built in guardrails for governance and pros at what they do.",
    name: 'Anil Nair',
    role: 'Co-founder – earnr',
    logo: 'assets/testimonial-logo-earnr.svg',
    logoAlt: 'earnr',
  },
  footerCta: { title: 'Ready to Build Your Card Platform' },
};

/**
 * Allowed tags and attributes for the HTML sanitizer.
 * Only these elements survive; everything else is stripped.
 */
const SAFE_TAGS = new Set([
  'div', 'span', 'em', 'strong', 'p', 'h2', 'h3', 'ul', 'ol', 'li',
  'article', 'a', 'section', 'br', 'sup', 'small',
]);
const SAFE_ATTRS = new Set([
  'class', 'aria-label', 'aria-hidden', 'data-animate', 'data-process-item',
  'data-process-step', 'data-process-panel', 'href',
]);

/**
 * Sanitise an HTML string by parsing it and only keeping whitelisted
 * tags and attributes.  Returns a DocumentFragment.
 */
const sanitizeToFragment = (html) => {
  const template = document.createElement('template');
  template.innerHTML = html;

  const walk = (root) => {
    const nodesToRemove = [];
    for (const child of root.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) continue;
      if (child.nodeType !== Node.ELEMENT_NODE) {
        nodesToRemove.push(child);
        continue;
      }
      const tag = child.tagName.toLowerCase();
      if (!SAFE_TAGS.has(tag)) {
        // Replace disallowed element with its children
        const frag = document.createDocumentFragment();
        while (child.firstChild) frag.appendChild(child.firstChild);
        root.replaceChild(frag, child);
        // Re-walk since children were moved into root
        walk(root);
        return;
      }
      // Strip disallowed attributes
      for (const attr of Array.from(child.attributes)) {
        if (!SAFE_ATTRS.has(attr.name)) {
          child.removeAttribute(attr.name);
        }
      }
      walk(child);
    }
    nodesToRemove.forEach((n) => root.removeChild(n));
  };

  walk(template.content);
  return template.content;
};

/**
 * Set the contents of `node` from a trusted HTML string using
 * a whitelist-based sanitizer.  Only tags in SAFE_TAGS survive.
 */
const setSafeHTML = (node, html) => {
  if (!node) return;
  node.textContent = '';                 // clear existing content
  node.appendChild(sanitizeToFragment(html));
};

const setText = (node, text) => {
  if (node && typeof text === 'string') node.textContent = text;
};

/* ── Firebase-backed content (CMS overrides) ─────────────────────────────
   Mirrors the fetch/sanitise pattern already used by contact.js and
   careers.js: fetch the page's Firebase-published content, strip any stray
   HTML out of plain-text fields, then deep-merge any *defined, non-empty*
   values into the relevant page's mutable COPY object before the page's
   render functions run. Empty/missing CMS fields never blank out the
   built-in defaults. */

async function fetchPageContent(path) {
  try {
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js');
    const { getDatabase, ref, get } = await import('https://www.gstatic.com/firebasejs/11.1.0/firebase-database.js');
    const app = initializeApp(firebaseConfig, 'services-reader');
    const db = getDatabase(app);
    const snapshot = await get(ref(db, path));
    return snapshot.exists() ? snapshot.val() : null;
  } catch (e) { console.warn('Firebase fetch failed', e); return null; }
}

function stripTags(str) { if (!str || typeof str !== 'string' || !str.includes('<')) return str || ''; const d = document.createElement('div'); d.innerHTML = str; return d.textContent || ''; }
function deepStripTags(obj) { if (typeof obj === 'string') return stripTags(obj); if (Array.isArray(obj)) return obj.map(deepStripTags); if (obj && typeof obj === 'object') { const o = {}; for (const k of Object.keys(obj)) o[k] = deepStripTags(obj[k]); return o; } return obj; }

/* Only overwrites keys whose source value is defined and non-empty:
   - non-empty strings replace strings
   - non-empty arrays replace arrays wholesale (repeatable admin sections
     are edited as a whole list, so partial-index merging isn't meaningful)
   - plain objects recurse key-by-key
   Never lets a blank/missing CMS field blank out working default copy. */
function deepMergeDefined(target, source) {
  if (!source || typeof source !== 'object') return target;
  Object.keys(source).forEach((key) => {
    const sv = source[key];
    if (sv === undefined || sv === null) return;
    if (typeof sv === 'string') {
      if (sv.trim() !== '') target[key] = sv;
    } else if (Array.isArray(sv)) {
      if (sv.length > 0) target[key] = sv;
    } else if (typeof sv === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      deepMergeDefined(target[key], sv);
    } else {
      target[key] = sv;
    }
  });
  return target;
}

/* The admin `label-href` field type stores CTAs as {label, href, icon}, but
   the render functions here only ever display a plain label string — resolve
   to the label (or keep the current default if the CMS value is blank). */
const ctaLabel = (v, fallback) => {
  if (typeof v === 'string' && v.trim()) return v;
  if (v && typeof v === 'object' && typeof v.label === 'string' && v.label.trim()) return v.label;
  return fallback;
};

/* Companion to ctaLabel(): resolves the href half of a `label-href` admin
   field. Returns undefined (not applied) when the CMS href is blank, so
   deepMergeDefined leaves the page's existing default href untouched. */
const ctaHref = (v) => {
  if (v && typeof v === 'object' && typeof v.href === 'string' && v.href.trim()) return v.href.trim();
  return undefined;
};

/* The admin `columns` field type stores bullets as {icon, text} objects;
   the render functions here display plain bullet strings. */
const normalizeColumnBullets = (columns) => {
  if (!Array.isArray(columns)) return undefined;
  return columns.map((col) => ({
    heading: col?.heading,
    bullets: Array.isArray(col?.bullets)
      ? col.bullets.map((b) => (typeof b === 'string' ? b : (b?.text || ''))).filter((t) => t)
      : undefined,
  }));
};

const mergeHero = (copyHero, fbHero) => {
  if (!fbHero) return;
  deepMergeDefined(copyHero, {
    pill: fbHero.pill,
    title: fbHero.title,
    subtitle: fbHero.subtitle,
    primaryCta: ctaLabel(fbHero.primaryCta, copyHero.primaryCta),
    secondaryCta: ctaLabel(fbHero.secondaryCta, copyHero.secondaryCta),
    primaryCtaHref: ctaHref(fbHero.primaryCta),
    secondaryCtaHref: ctaHref(fbHero.secondaryCta),
    trustedKicker: fbHero.trustedKicker,
    stats: fbHero.stats,
  });
};

/** Merge Firebase-published content for the current service page into the
 * relevant mutable COPY object. Called before (re-)running the page's
 * render functions so CMS edits actually reach the DOM. */
function mergeServiceFirebaseContent(mode, fb) {
  if (!fb) return;

  if (mode === 'ai-accelerated-fintech-engineering') {
    const copy = AI_ACCELERATED_COPY;
    mergeHero(copy.hero, fb.hero);
    if (fb.challenge) deepMergeDefined(copy.challenge, fb.challenge);
    if (fb.howWeWork) deepMergeDefined(copy.howWeWork, fb.howWeWork);
    if (fb.whatWeBuild) {
      deepMergeDefined(copy.whatWeBuild, {
        kicker: fb.whatWeBuild.kicker,
        title: fb.whatWeBuild.title,
        summary: fb.whatWeBuild.summary,
        // Admin defines 5 capability columns; the live page markup only has
        // 2 column slots, so only the first 2 are wired through here.
        columns: normalizeColumnBullets(fb.whatWeBuild.columns)?.slice(0, 2),
        deliveryKicker: fb.whatWeBuild.deliveryKicker,
        deliveryCards: fb.whatWeBuild.deliveryCards,
      });
    }
    if (fb.howWeBuild) deepMergeDefined(copy.howWeBuild, fb.howWeBuild);
    if (fb.why) deepMergeDefined(copy.why, fb.why);
    if (fb.fit) deepMergeDefined(copy.fit, fb.fit);
    if (fb.faq) deepMergeDefined(copy.faq, fb.faq);
    if (fb.testimonial) deepMergeDefined(copy.testimonial, fb.testimonial);
    if (fb.footerCta) deepMergeDefined(copy.footerCta, fb.footerCta);
    return;
  }

  if (mode === 'ai-powered-legacy-modernisation') {
    const copy = LEGACY_MODERNISATION_COPY;
    mergeHero(copy.hero, fb.hero);
    if (fb.challenge) deepMergeDefined(copy.challenge, fb.challenge);
    if (fb.howWeWork) deepMergeDefined(copy.howWeWork, fb.howWeWork);
    if (fb.whatWeBuild) {
      deepMergeDefined(copy.whatWeBuild, {
        kicker: fb.whatWeBuild.kicker,
        title: fb.whatWeBuild.title,
        summary: fb.whatWeBuild.summary,
        columns: normalizeColumnBullets(fb.whatWeBuild.columns),
        deliveryKicker: fb.whatWeBuild.deliveryKicker,
        deliveryCards: fb.whatWeBuild.deliveryCards,
      });
    }
    if (fb.howWeBuild) deepMergeDefined(copy.howWeBuild, fb.howWeBuild);
    if (fb.why) deepMergeDefined(copy.why, fb.why);
    if (fb.fit) deepMergeDefined(copy.fit, fb.fit);
    if (fb.faq) deepMergeDefined(copy.faq, fb.faq);
    if (fb.testimonial) deepMergeDefined(copy.testimonial, fb.testimonial);
    if (fb.footerCta) deepMergeDefined(copy.footerCta, fb.footerCta);
    return;
  }

  if (mode === 'intelligent-operations') {
    const copy = INTELLIGENT_OPERATIONS_COPY;
    mergeHero(copy.hero, fb.hero);
    if (fb.challenge) deepMergeDefined(copy.challenge, fb.challenge);
    if (fb.domains) deepMergeDefined(copy.domains, fb.domains);
    if (fb.deliverables) {
      deepMergeDefined(copy.deliverables, {
        kicker: fb.deliverables.kicker,
        title: fb.deliverables.title,
        summary: fb.deliverables.summary,
        // Admin edits support tiers as {heading, bullets:[{icon,text}]} via
        // the shared `columns` field type; the live cards only render plain
        // bullet strings, so normalise the same way whatWeBuild.columns does.
        supportTiers: normalizeColumnBullets(fb.deliverables.supportTiers),
        aiAgentsKicker: fb.deliverables.aiAgentsKicker,
        aiAgents: fb.deliverables.aiAgents,
      });
    }
    if (fb.howWeBuild) deepMergeDefined(copy.howWeBuild, fb.howWeBuild);
    if (fb.why) deepMergeDefined(copy.why, fb.why);
    if (fb.fit) deepMergeDefined(copy.fit, fb.fit);
    if (fb.faq) deepMergeDefined(copy.faq, fb.faq);
    if (fb.testimonial) deepMergeDefined(copy.testimonial, fb.testimonial);
    if (fb.footerCta) deepMergeDefined(copy.footerCta, fb.footerCta);
    return;
  }

  if (mode === 'ai-governance') {
    const copy = AI_GOVERNANCE_COPY;
    mergeHero(copy.hero, fb.hero);
    if (fb.challenge) deepMergeDefined(copy.challenge, fb.challenge);
    if (fb.domains) deepMergeDefined(copy.domains, fb.domains);
    if (fb.deliverables) deepMergeDefined(copy.deliverables, fb.deliverables);
    if (fb.howWeBuild) deepMergeDefined(copy.howWeBuild, fb.howWeBuild);
    if (fb.why) deepMergeDefined(copy.why, fb.why);
    if (fb.fit) deepMergeDefined(copy.fit, fb.fit);
    if (fb.faq) deepMergeDefined(copy.faq, fb.faq);
    if (fb.testimonial) deepMergeDefined(copy.testimonial, fb.testimonial);
    if (fb.footerCta) deepMergeDefined(copy.footerCta, fb.footerCta);
    return;
  }
}

/* ── FAQ + testimonial application (shared across all 4 pillar modes) ────
   The 5 FAQ slots and the single testimonial card are identical hardcoded
   DOM structures on every pillar page; only the copy differs per mode. */
const applyServiceFaq = (copy) => {
  const faqSection = document.querySelector('.faq-section');
  if (!faqSection || !copy.faq) return;

  const faqTitle = faqSection.querySelector('.faq-header-title h2');
  if (faqTitle && (copy.faq.title || copy.faq.titleEmphasis)) {
    setSafeHTML(faqTitle, `<span>${copy.faq.title || ''}</span><em>${copy.faq.titleEmphasis || ''}</em>`);
  }
  setText(faqSection.querySelector('.faq-header > p'), copy.faq.subtitle);

  const faqEls = faqSection.querySelectorAll('.faq-item');
  const faqItems = Array.isArray(copy.faq.items) ? copy.faq.items : [];
  // Markup only has 5 fixed FAQ slots — extra CMS items have nowhere to render.
  faqItems.slice(0, 5).forEach((f, i) => {
    const item = faqEls[i];
    if (!item) return;
    setText(item.querySelector('.faq-toggle > span:first-child'), f.question);
    setText(item.querySelector('[data-faq-panel] p'), f.answer);
  });
};

const applyServiceTestimonial = (copy) => {
  const card = document.querySelector('.service-testimonial .service-testimonial-card');
  if (!card || !copy.testimonial) return;

  setText(card.querySelector('blockquote'), copy.testimonial.quote);
  setText(card.querySelector('.service-testimonial-meta strong'), copy.testimonial.name);
  setText(card.querySelector('.service-testimonial-meta span'), copy.testimonial.role);
  const img = card.querySelector('.service-testimonial-meta img');
  if (img) {
    if (copy.testimonial.logo) img.setAttribute('src', copy.testimonial.logo);
    if (copy.testimonial.logoAlt) img.setAttribute('alt', copy.testimonial.logoAlt);
  }
};

/* Applies a mode's hero CTA hrefs on top of whatever text/href the caller
   already set, only overwriting when the CMS supplied a non-empty href —
   keeps each page's default href (e.g. "contact", or the hardcoded
   "resources?filter=case-studies" secondary link) intact otherwise. */
const applyHeroCtaHrefs = (heroSection, copyHero) => {
  if (!heroSection) return;
  const heroActionLinks = heroSection.querySelectorAll('.hero-actions a');
  if (heroActionLinks[0] && copyHero.primaryCtaHref) heroActionLinks[0].setAttribute('href', copyHero.primaryCtaHref);
  if (heroActionLinks[1] && copyHero.secondaryCtaHref) heroActionLinks[1].setAttribute('href', copyHero.secondaryCtaHref);
};

/* Applies emailCapture admin overrides to the shared email-capture modal
   markup — mirrors the pattern already used on Home (main.js) and About
   (about.js). Currently only ai-accelerated-fintech-engineering.html defines
   this admin section, but applying it generically is harmless: fb.emailCapture
   is simply absent for the other modes. */
const applyEmailCaptureOverride = (fb) => {
  const ec = fb?.emailCapture;
  if (!ec) return;
  const eh = document.querySelector('.email-capture__heading');
  const es = document.querySelector('.email-capture__subtext');
  const eb = document.querySelector('.email-capture__form button[type="submit"]');
  if (eh && ec.promptHeading) eh.textContent = ec.promptHeading;
  if (es && ec.promptSubtext) es.textContent = ec.promptSubtext;
  if (eb && ec.buttonLabel) eb.textContent = ec.buttonLabel;
};

const applyAIAcceleratedPageCopy = () => {
  const copy = AI_ACCELERATED_COPY;

  const heroSection = document.querySelector('.service-hero');
  if (heroSection) {
    setText(heroSection.querySelector('.pill'), copy.hero.pill);
    const heroHeading = heroSection.querySelector('h1');
    setSafeHTML(
      heroHeading,
      `<span>${copy.hero.title[0]}</span><em>${copy.hero.title[1]}</em>`,
    );
    setText(heroSection.querySelector('.service-hero-copy p'), copy.hero.subtitle);

    const heroButtons = heroSection.querySelectorAll('.hero-actions .hero-action-label');
    if (heroButtons[0]) heroButtons[0].textContent = copy.hero.primaryCta;
    if (heroButtons[1]) heroButtons[1].textContent = copy.hero.secondaryCta;
    applyHeroCtaHrefs(heroSection, copy.hero);

    setText(heroSection.querySelector('.trusted-kicker'), copy.hero.trustedKicker);

    const heroStats = heroSection.querySelectorAll('.hero-stat-card');
    copy.hero.stats.forEach((item, index) => {
      const card = heroStats[index];
      if (!card) return;
      setText(card.querySelector('strong'), item.value);
      setText(card.querySelector('span'), item.label);
    });
  }

  const challengeSection = document.querySelector('.challenge-section');
  if (challengeSection) {
    setText(challengeSection.querySelector('.section-kicker'), copy.challenge.kicker);
    const challengeTitle = challengeSection.querySelector('.section-title h2');
    setSafeHTML(
      challengeTitle,
      `<span>${copy.challenge.title[0]}</span><span><em>${copy.challenge.title[1]}</em></span>`,
    );
    setText(challengeSection.querySelector('.section-head p'), copy.challenge.summary);

    const cards = challengeSection.querySelectorAll('.challenge-card');
    copy.challenge.cards.forEach((item, index) => {
      const card = cards[index];
      if (!card) return;
      setText(card.querySelector('.challenge-number'), item.number);
      setText(card.querySelector('h3'), item.title);
      setText(card.querySelector('p'), item.body);
    });
  }

  const whySection = document.querySelector('.why-section');
  if (whySection) {
    setText(whySection.querySelector('.section-heading-copy .pill'), copy.why.kicker);
    const whyHeading = whySection.querySelector('.section-heading-copy h2');
    setSafeHTML(whyHeading, `${copy.why.title[0]} <span>${copy.why.title[1]}</span>`);
    setText(whySection.querySelector('.section-title-split p'), copy.why.summary);

    const featureCards = whySection.querySelectorAll('.feature-card');
    copy.why.cards.forEach((item, index) => {
      const card = featureCards[index];
      if (!card) return;
      setText(card.querySelector('h3'), item.heading);
      setText(card.querySelector('p'), item.body);
      const cardImage = card.querySelector('.card-image');
      if (cardImage && item.image) {
        cardImage.src = item.image;
        if (item.imageAlt) cardImage.alt = item.imageAlt;
      }
    });
  }

  const fitSection = document.querySelector('.fit-section');
  if (fitSection) {
    setText(fitSection.querySelector('.section-kicker'), copy.fit.kicker);
    const fitHeading = fitSection.querySelector('.section-title h2');
    setSafeHTML(
      fitHeading,
      `<span>${copy.fit.title[0]}</span><em>${copy.fit.title[1]}</em>`,
    );
    setText(fitSection.querySelector('.section-head p'), copy.fit.summary);

    const fitBullets = fitSection.querySelectorAll('.fit-item');
    copy.fit.bullets.forEach((item, index) => {
      if (fitBullets[index]) fitBullets[index].textContent = item;
    });

    setText(fitSection.querySelector('.fit-engage-kicker'), copy.fit.engageKicker);

    const fitCards = fitSection.querySelectorAll('.fit-card');
    copy.fit.engageCards.forEach((item, index) => {
      const card = fitCards[index];
      if (!card) return;
      setText(card.querySelector('h3'), item.heading);
      setText(card.querySelector('p'), item.body);
    });
  }

  applyServiceFaq(copy);
  applyServiceTestimonial(copy);

  const footerTitle = document.querySelector('[data-footer-cta-title]');
  setText(footerTitle, copy.footerCta.title);
};

/* ── FAQ Accordion (mirrors services-overview.js initFaqAccordion) ──────── */

let faqInitialized = false;

const initFaqAccordion = () => {
  const items = Array.from(document.querySelectorAll('[data-faq-item]'));
  if (!items.length) return;

  const setPanelState = (item, isOpen) => {
    const button = item.querySelector('[data-faq-toggle]');
    const panel = item.querySelector('[data-faq-panel]');
    if (!(button && panel)) return;

    item.classList.toggle('is-active', isOpen);
    button.setAttribute('aria-expanded', String(isOpen));
    panel.style.height = isOpen ? `${panel.scrollHeight}px` : '0px';
  };

  items.forEach((item) => {
    setPanelState(item, item.classList.contains('is-active'));
  });

  if (!faqInitialized) {
    faqInitialized = true;

    items.forEach((item) => {
      const button = item.querySelector('[data-faq-toggle]');
      button?.addEventListener('click', () => {
        const isCurrentlyActive = item.classList.contains('is-active');
        items.forEach((entry) => setPanelState(entry, false));
        if (!isCurrentlyActive) setPanelState(item, true);
      });
    });

    window.addEventListener('resize', () => {
      items.forEach((item) => {
        if (item.classList.contains('is-active')) setPanelState(item, true);
      });
    });
  }
};

const initProcessSteps = () => {
  const items = Array.from(document.querySelectorAll('[data-process-item]'));
  if (!items.length) return;

  const setPanelState = (item, isOpen) => {
    const button = item.querySelector('[data-process-step]');
    const panel = item.querySelector('[data-process-panel]');
    if (!(button && panel)) return;

    item.classList.toggle('is-active', isOpen);
    button.setAttribute('aria-expanded', String(isOpen));
    panel.style.height = isOpen ? `${panel.scrollHeight}px` : '0px';
  };

  items.forEach((item) => {
    setPanelState(item, item.classList.contains('is-active'));
  });

  items.forEach((item) => {
    const button = item.querySelector('[data-process-step]');
    button?.addEventListener('click', () => {
      items.forEach((entry) => setPanelState(entry, entry === item));
    });
  });

  window.addEventListener('resize', () => {
    items.forEach((item) => {
      if (item.classList.contains('is-active')) setPanelState(item, true);
    });
  });
};

const getServiceMode = () => {
  const params = new URLSearchParams(window.location.search);
  const fromParam = params.get('service');
  if (fromParam) return fromParam;

  const path = window.location.pathname;
  if (path.includes('ai-governance')) return 'ai-governance';
  if (path.includes('intelligent-operations')) return 'intelligent-operations';
  if (path.includes('ai-powered-legacy-modernisation')) return 'ai-powered-legacy-modernisation';
  return 'ai-accelerated-fintech-engineering';
};

const FB_PATH_BY_MODE = {
  'ai-accelerated-fintech-engineering': 'pages/aiAcceleratedEngineering',
  'ai-powered-legacy-modernisation': 'pages/legacyModernisation',
  'intelligent-operations': 'pages/intelligentOperations',
  'ai-governance': 'pages/aiGovernance',
};

const applyIntelligentOperationsTextOverrides = () => {
  const copy = INTELLIGENT_OPERATIONS_COPY;

  const hero = document.querySelector('.service-hero');
  if (hero) {
    const heroPill = hero.querySelector('.pill');
    const heroTitle = hero.querySelector('h1');
    const heroSummary = hero.querySelector('.service-hero-copy p');
    const heroActions = hero.querySelectorAll('.hero-action-label');
    const trustKicker = hero.querySelector('.trusted-kicker');
    const heroStatCards = hero.querySelectorAll('.hero-stat-card');

    if (heroPill) heroPill.textContent = copy.hero.pill;
    if (heroTitle) {
      setSafeHTML(heroTitle,
        `<span>${copy.hero.title[0]}</span><em>${copy.hero.title[1]}</em>`);
    }
    if (heroSummary) heroSummary.textContent = copy.hero.subtitle;
    if (heroActions[0]) heroActions[0].textContent = copy.hero.primaryCta;
    if (heroActions[1]) heroActions[1].textContent = copy.hero.secondaryCta;
    applyHeroCtaHrefs(hero, copy.hero);
    if (trustKicker) trustKicker.textContent = copy.hero.trustedKicker;

    heroStatCards.forEach((card, index) => {
      const stat = copy.hero.stats[index];
      if (!stat) return;
      const value = card.querySelector('strong');
      const label = card.querySelector('span');
      if (value) value.textContent = stat.value;
      if (label) label.textContent = stat.label;
    });
  }

  const challenge = document.querySelector('.challenge-section');
  if (challenge) {
    const challengeKicker = challenge.querySelector('.section-kicker');
    const challengeTitle = challenge.querySelector('.section-title h2');
    const challengeSummary = challenge.querySelector('.section-head p');
    const challengeCards = challenge.querySelectorAll('.challenge-card');

    if (challengeKicker) challengeKicker.textContent = copy.challenge.kicker;
    if (challengeTitle) {
      setSafeHTML(challengeTitle,
        `<span>${copy.challenge.title[0]}</span><span><em>${copy.challenge.title[1]}</em></span>`);
    }
    if (challengeSummary) challengeSummary.textContent = copy.challenge.summary;

    challengeCards.forEach((card, index) => {
      const item = copy.challenge.cards[index];
      if (!item) return;
      const title = card.querySelector('h3');
      const body = card.querySelector('p');
      if (title) title.textContent = item.title;
      if (body) body.textContent = item.body;
    });
  }

  const deliverables = document.querySelector('.deliverables-section');
  if (deliverables) {
    deliverables.classList.add('deliverables-section-operations');
    setSafeHTML(deliverables, `
      <div class="section-head section-head-dark" data-animate>
        <div class="section-title">
          <span class="section-kicker">${copy.deliverables.kicker}</span>
          <h2>
            <em>${copy.deliverables.title[0]}</em>
            <span>${copy.deliverables.title[1]}</span>
          </h2>
        </div>
        <p>
          ${copy.deliverables.summary}
        </p>
      </div>

      <div class="ops-support-grid" data-animate>
        ${copy.deliverables.supportTiers.map((tier) => `
        <article class="ops-support-card">
          <h3>${tier.heading}</h3>
          <ul class="ops-support-list">
            ${tier.bullets.map((b) => `<li>${b}</li>`).join('')}
          </ul>
        </article>`).join('')}
      </div>

      <div class="delivery-cadence" data-animate>
        <span class="delivery-cadence-kicker">${copy.deliverables.aiAgentsKicker}</span>
      </div>

      <div class="deliverables-cards ops-agent-cards" data-animate>
        ${copy.deliverables.aiAgents.map((a) => `
        <article class="deliverable-card">
          <h3>${a.heading}</h3>
          <p>
            ${a.body}
          </p>
        </article>`).join('')}
      </div>
    `);
  }

  const roadmap = document.querySelector('.roadmap-section');
  if (roadmap) {
    roadmap.classList.add('roadmap-section-operations');
    setSafeHTML(roadmap, `
      <div class="section-head" data-animate>
        <div class="section-title">
          <span class="section-kicker">${copy.howWeBuild.kicker}</span>
          <h2>
            <span>${copy.howWeBuild.title[0]}</span>
            <span><em>${copy.howWeBuild.title[1]}</em></span>
          </h2>
        </div>
        <p>
          ${copy.howWeBuild.summary}<sup>*</sup>
        </p>
        <p class="roadmap-footnote">
          <small>*Based on Panasa client feedback surveys conducted across operational engagements in 2025.</small>
        </p>
      </div>

      <div class="roadmap-grid" data-animate>
        ${copy.howWeBuild.cards.map((c) => `
        <article class="roadmap-card">
          <h3>${c.heading}</h3>
          <p>
            ${c.body}
          </p>
          <span class="roadmap-phase">${c.pill}</span>
        </article>`).join('')}
      </div>
    `);
  }

  const why = document.querySelector('.why-section');
  if (why) {
    const whyPill = why.querySelector('.section-heading-copy .pill');
    const whyTitle = why.querySelector('.section-heading-copy h2');
    const whySummary = why.querySelector('.section-title-split p');
    const whyCards = why.querySelectorAll('.feature-card');

    if (whyPill) whyPill.textContent = copy.why.kicker;
    if (whyTitle) setSafeHTML(whyTitle, `${copy.why.title[0]} <span>${copy.why.title[1]}</span>`);
    if (whySummary) whySummary.textContent = copy.why.summary;

    whyCards.forEach((card, index) => {
      const item = copy.why.cards[index];
      if (!item) return;
      const title = card.querySelector('h3');
      const body = card.querySelector('p');
      if (title) title.textContent = item.heading;
      if (body) body.textContent = item.body;
      const cardImage = card.querySelector('.card-image');
      if (cardImage && item.image) {
        cardImage.src = item.image;
        if (item.imageAlt) cardImage.alt = item.imageAlt;
      }
    });
  }

  const fit = document.querySelector('.fit-section');
  if (fit) {
    const fitKicker = fit.querySelector('.section-kicker');
    const fitTitle = fit.querySelector('.section-title h2');
    const fitSummary = fit.querySelector('.section-head p');
    const fitItems = fit.querySelectorAll('.fit-item');
    const fitEngageKicker = fit.querySelector('.fit-engage-kicker');
    const fitCards = fit.querySelectorAll('.fit-card');

    if (fitKicker) fitKicker.textContent = copy.fit.kicker;
    if (fitTitle) {
      setSafeHTML(fitTitle,
        `<em>${copy.fit.title[0]}</em><span>${copy.fit.title[1]}</span>`);
    }
    if (fitSummary) fitSummary.textContent = copy.fit.summary;

    fitItems.forEach((item, index) => {
      if (copy.fit.bullets[index]) item.textContent = copy.fit.bullets[index];
    });

    if (fitEngageKicker) fitEngageKicker.textContent = copy.fit.engageKicker;
    fitCards.forEach((card, index) => {
      const item = copy.fit.engageCards[index];
      if (!item) return;
      const title = card.querySelector('h3');
      const body = card.querySelector('p');
      if (title) title.textContent = item.heading;
      if (body) body.textContent = item.body;
    });
  }

  applyServiceFaq(copy);
  applyServiceTestimonial(copy);
};

const applyLegacyModernisationTextOverrides = () => {
  const copy = LEGACY_MODERNISATION_COPY;

  const hero = document.querySelector('.service-hero');
  if (hero) {
    const heroPill = hero.querySelector('.pill');
    const heroTitle = hero.querySelector('h1');
    const heroSummary = hero.querySelector('.service-hero-copy p');
    const heroActions = hero.querySelectorAll('.hero-action-label');
    const heroActionLinks = hero.querySelectorAll('.hero-actions a');
    const trustKicker = hero.querySelector('.trusted-kicker');
    const heroStatCards = hero.querySelectorAll('.hero-stat-card');

    if (heroPill) heroPill.textContent = copy.hero.pill;
    if (heroTitle) {
      setSafeHTML(heroTitle, `<span>${copy.hero.title[0]}</span><em>${copy.hero.title[1]}</em>`);
    }
    if (heroSummary) heroSummary.textContent = copy.hero.subtitle;
    if (heroActions[0]) heroActions[0].textContent = copy.hero.primaryCta;
    if (heroActions[1]) heroActions[1].textContent = copy.hero.secondaryCta;
    if (heroActionLinks[1]) heroActionLinks[1].setAttribute('href', 'resources?filter=case-studies');
    applyHeroCtaHrefs(hero, copy.hero);
    if (trustKicker) trustKicker.textContent = copy.hero.trustedKicker;

    heroStatCards.forEach((card, index) => {
      const stat = copy.hero.stats[index];
      if (!stat) return;
      const value = card.querySelector('strong');
      const label = card.querySelector('span');
      if (value) value.textContent = stat.value;
      if (label) label.textContent = stat.label;
    });
  }

  const challenge = document.querySelector('.challenge-section');
  if (challenge) {
    const challengeKicker = challenge.querySelector('.section-kicker');
    const challengeTitle = challenge.querySelector('.section-title h2');
    const challengeSummary = challenge.querySelector('.section-head p');
    const challengeCards = challenge.querySelectorAll('.challenge-card');

    if (challengeKicker) challengeKicker.textContent = copy.challenge.kicker;
    if (challengeTitle) {
      setSafeHTML(challengeTitle,
        `<span>${copy.challenge.title[0]}</span><span><em>${copy.challenge.title[1]}</em></span>`);
    }
    if (challengeSummary) challengeSummary.textContent = copy.challenge.summary;

    challengeCards.forEach((card, index) => {
      const item = copy.challenge.cards[index];
      if (!item) return;
      const title = card.querySelector('h3');
      const body = card.querySelector('p');
      if (title) title.textContent = item.title;
      if (body) body.textContent = item.body;
    });
  }

  const why = document.querySelector('.why-section');
  if (why) {
    const whyPill = why.querySelector('.section-heading-copy .pill');
    const whyTitle = why.querySelector('.section-heading-copy h2');
    const whySummary = why.querySelector('.section-title-split p');
    const whyCards = why.querySelectorAll('.feature-card');

    if (whyPill) whyPill.textContent = copy.why.kicker;
    if (whyTitle) setSafeHTML(whyTitle, `${copy.why.title[0]} <span>${copy.why.title[1]}</span>`);
    if (whySummary) whySummary.textContent = copy.why.summary;

    whyCards.forEach((card, index) => {
      const item = copy.why.cards[index];
      if (!item) return;
      const title = card.querySelector('h3');
      const body = card.querySelector('p');
      if (title) title.textContent = item.heading;
      if (body) body.textContent = item.body;
      const cardImage = card.querySelector('.card-image');
      if (cardImage && item.image) {
        cardImage.src = item.image;
        if (item.imageAlt) cardImage.alt = item.imageAlt;
      }
    });
  }

  const fit = document.querySelector('.fit-section');
  if (fit) {
    const fitKicker = fit.querySelector('.section-kicker');
    const fitTitle = fit.querySelector('.section-title h2');
    const fitSummary = fit.querySelector('.section-head p');
    const fitItems = fit.querySelectorAll('.fit-item');
    const fitEngageKicker = fit.querySelector('.fit-engage-kicker');
    const fitCards = fit.querySelectorAll('.fit-card');

    if (fitKicker) fitKicker.textContent = copy.fit.kicker;
    if (fitTitle) {
      setSafeHTML(fitTitle, `<em>${copy.fit.title[0]}</em><span>${copy.fit.title[1]}</span>`);
    }
    if (fitSummary) fitSummary.textContent = copy.fit.summary;

    fitItems.forEach((item, index) => {
      if (copy.fit.bullets[index]) item.textContent = copy.fit.bullets[index];
    });

    if (fitEngageKicker) fitEngageKicker.textContent = copy.fit.engageKicker;
    fitCards.forEach((card, index) => {
      const item = copy.fit.engageCards[index];
      if (!item) return;
      const title = card.querySelector('h3');
      const body = card.querySelector('p');
      if (title) title.textContent = item.heading;
      if (body) body.textContent = item.body;
    });
  }

  applyServiceFaq(copy);
  applyServiceTestimonial(copy);
};

const applyAIGovernancePageCopy = () => {
  const copy = AI_GOVERNANCE_COPY;

  const heroSection = document.querySelector('.service-hero');
  if (heroSection) {
    setText(heroSection.querySelector('.pill'), copy.hero.pill);
    const heroHeading = heroSection.querySelector('h1');
    setSafeHTML(
      heroHeading,
      `<span>${copy.hero.title[0]}</span><em>${copy.hero.title[1]}</em>`,
    );
    setText(heroSection.querySelector('.service-hero-copy p'), copy.hero.subtitle);

    const heroButtons = heroSection.querySelectorAll('.hero-actions .hero-action-label');
    if (heroButtons[0]) heroButtons[0].textContent = copy.hero.primaryCta;
    if (heroButtons[1]) heroButtons[1].textContent = copy.hero.secondaryCta;
    applyHeroCtaHrefs(heroSection, copy.hero);

    setText(heroSection.querySelector('.trusted-kicker'), copy.hero.trustedKicker);

    const heroStats = heroSection.querySelectorAll('.hero-stat-card');
    copy.hero.stats.forEach((item, index) => {
      const card = heroStats[index];
      if (!card) return;
      setText(card.querySelector('strong'), item.value);
      setText(card.querySelector('span'), item.label);
    });
  }

  const challengeSection = document.querySelector('.challenge-section');
  if (challengeSection) {
    setText(challengeSection.querySelector('.section-kicker'), copy.challenge.kicker);
    const challengeTitle = challengeSection.querySelector('.section-title h2');
    setSafeHTML(
      challengeTitle,
      `<span>${copy.challenge.title[0]}</span><span><em>${copy.challenge.title[1]}</em></span>`,
    );
    setText(challengeSection.querySelector('.section-head p'), copy.challenge.summary);

    const cards = challengeSection.querySelectorAll('.challenge-card');
    copy.challenge.cards.forEach((item, index) => {
      const card = cards[index];
      if (!card) return;
      setText(card.querySelector('.challenge-number'), item.number);
      setText(card.querySelector('h3'), item.title);
      setText(card.querySelector('p'), item.body);
    });
  }

  const whySection = document.querySelector('.why-section');
  if (whySection) {
    setText(whySection.querySelector('.section-heading-copy .pill'), copy.why.kicker);
    const whyHeading = whySection.querySelector('.section-heading-copy h2');
    setSafeHTML(whyHeading, `${copy.why.title[0]} <span>${copy.why.title[1]}</span>`);
    setText(whySection.querySelector('.section-title-split p'), copy.why.summary);

    const featureCards = whySection.querySelectorAll('.feature-card');
    copy.why.cards.forEach((item, index) => {
      const card = featureCards[index];
      if (!card) return;
      setText(card.querySelector('h3'), item.heading);
      setText(card.querySelector('p'), item.body);
      const cardImage = card.querySelector('.card-image');
      if (cardImage && item.image) {
        cardImage.src = item.image;
        if (item.imageAlt) cardImage.alt = item.imageAlt;
      }
    });
  }

  const fitSection = document.querySelector('.fit-section');
  if (fitSection) {
    setText(fitSection.querySelector('.section-kicker'), copy.fit.kicker);
    const fitHeading = fitSection.querySelector('.section-title h2');
    setSafeHTML(
      fitHeading,
      `<em>${copy.fit.title[0]}</em><span>${copy.fit.title[1]}</span>`,
    );
    setText(fitSection.querySelector('.section-head p'), copy.fit.summary);

    const fitBullets = fitSection.querySelectorAll('.fit-item');
    copy.fit.bullets.forEach((item, index) => {
      if (fitBullets[index]) fitBullets[index].textContent = item;
    });

    setText(fitSection.querySelector('.fit-engage-kicker'), copy.fit.engageKicker);

    const fitCards = fitSection.querySelectorAll('.fit-card');
    copy.fit.engageCards.forEach((item, index) => {
      const card = fitCards[index];
      if (!card) return;
      setText(card.querySelector('h3'), item.heading);
      setText(card.querySelector('p'), item.body);
    });
  }

  applyServiceFaq(copy);
  applyServiceTestimonial(copy);

  const footerTitle = document.querySelector('[data-footer-cta-title]');
  setText(footerTitle, copy.footerCta.title);
};

const applyServiceMode = () => {
  const section = document.querySelector('.domains-section');
  const title = section?.querySelector('.section-title h2');
  const kicker = section?.querySelector('.section-kicker');
  const summary = section?.querySelector('.section-head p');
  const content = section?.querySelector('.domains-grid');
  const deliverablesSection = document.querySelector('.deliverables-section');
  const roadmapSection = document.querySelector('.roadmap-section');
  if (!(section && title && kicker && summary && content && deliverablesSection && roadmapSection)) {
    return;
  }

  const mode = getServiceMode();

  const heroActions = document.querySelectorAll('.service-hero .hero-action-label');
  const heroActionLinks = document.querySelectorAll('.service-hero .hero-actions a');
  if (heroActions[1]) heroActions[1].textContent = 'View Case Studies';
  if (heroActionLinks[1]) heroActionLinks[1].setAttribute('href', 'resources?filter=case-studies');

  section.classList.remove('domains-section-process', 'domains-section-operations');
  deliverablesSection.classList.remove(
    'deliverables-section-engineering',
    'deliverables-section-operations',
  );
  roadmapSection.classList.remove(
    'roadmap-section-engineering',
    'roadmap-section-operations',
    'roadmap-section-legacy',
    'roadmap-section-governance',
  );

  if (mode === 'ai-accelerated-fintech-engineering') {
    section.classList.add('domains-section-process');
    kicker.textContent = AI_ACCELERATED_COPY.howWeWork.kicker;
    setSafeHTML(title, `<em>${AI_ACCELERATED_COPY.howWeWork.title[0]}</em><span>${AI_ACCELERATED_COPY.howWeWork.title[1]}</span>`);
    summary.textContent = AI_ACCELERATED_COPY.howWeWork.summary;

    setSafeHTML(content, `
      <div class="process-grid">
        <ol class="process-flow" aria-label="Fintech engineering process">
          ${AI_ACCELERATED_COPY.howWeWork.stages.map((stage, i) => `
          <li class="process-flow-item">
            <span class="process-flow-index" aria-hidden="true">${i + 1}</span>
            <strong>${stage.heading}</strong>
            <p>${stage.description}</p>
          </li>`).join('')}
        </ol>
      </div>
    `);

    initProcessSteps();

    deliverablesSection.classList.add('deliverables-section-engineering');
    setSafeHTML(deliverablesSection, `
      <div class="section-head section-head-dark" data-animate>
        <div class="section-title">
          <span class="section-kicker">${AI_ACCELERATED_COPY.whatWeBuild.kicker}</span>
          <h2>
            <em>${AI_ACCELERATED_COPY.whatWeBuild.title[0]}</em>
            <span>${AI_ACCELERATED_COPY.whatWeBuild.title[1]}</span>
          </h2>
        </div>
        <p>
          ${AI_ACCELERATED_COPY.whatWeBuild.summary}
        </p>
      </div>

      <div class="engineering-build-grid" data-animate>
        ${AI_ACCELERATED_COPY.whatWeBuild.columns.slice(0, 2).map((col) => `
        <article class="engineering-build-column">
          <h3>${col.heading}</h3>
          <ul class="engineering-build-list">
            ${col.bullets.map((b) => `<li>${b}</li>`).join('')}
          </ul>
        </article>`).join('')}
      </div>

      <div class="engineering-build-divider" data-animate></div>

      <div class="engineering-build-footer" data-animate>
        <span class="engineering-build-kicker">${AI_ACCELERATED_COPY.whatWeBuild.deliveryKicker}</span>
        <div class="engineering-build-cards">
          ${AI_ACCELERATED_COPY.whatWeBuild.deliveryCards.map((c) => `
          <article class="engineering-build-card">
            <h3>${c.heading}</h3>
            <p>
              ${c.body}
            </p>
          </article>`).join('')}
        </div>
      </div>
    `);

    roadmapSection.classList.add('roadmap-section-engineering');
    setSafeHTML(roadmapSection, `
      <div class="section-head" data-animate>
        <div class="section-title">
          <span class="section-kicker">${AI_ACCELERATED_COPY.howWeBuild.kicker}</span>
          <h2>
            <em>${AI_ACCELERATED_COPY.howWeBuild.title[0]}</em>
            <span>${AI_ACCELERATED_COPY.howWeBuild.title[1]}</span>
          </h2>
        </div>
        <p>
          ${AI_ACCELERATED_COPY.howWeBuild.summary}
        </p>
      </div>

      <div class="engineering-roadmap-grid" data-animate>
        ${AI_ACCELERATED_COPY.howWeBuild.cards.map((c) => `
        <article class="engineering-roadmap-card">
          <h3>${c.heading}</h3>
          <p>
            ${c.body}
          </p>
          <span class="engineering-roadmap-pill">${c.pill}</span>
        </article>`).join('')}
      </div>
    `);
    applyAIAcceleratedPageCopy();
    return;
  }

  if (mode === 'ai-powered-legacy-modernisation') {
    applyLegacyModernisationTextOverrides();
    section.classList.add('domains-section-process');
    kicker.textContent = LEGACY_MODERNISATION_COPY.howWeWork.kicker;
    setSafeHTML(title, `<em>${LEGACY_MODERNISATION_COPY.howWeWork.title[0]}</em><span>${LEGACY_MODERNISATION_COPY.howWeWork.title[1]}</span>`);
    summary.textContent = LEGACY_MODERNISATION_COPY.howWeWork.summary;

    setSafeHTML(content, `
      <div class="process-grid">
        <ol class="process-flow process-flow-six" aria-label="Legacy modernisation process">
          ${LEGACY_MODERNISATION_COPY.howWeWork.stages.map((stage, i) => `
          <li class="process-flow-item">
            <span class="process-flow-index" aria-hidden="true">${i + 1}</span>
            <strong>${stage.heading}</strong>
            <p>${stage.description}</p>
          </li>`).join('')}
        </ol>
      </div>
    `);

    initProcessSteps();

    deliverablesSection.classList.add('deliverables-section-engineering');
    setSafeHTML(deliverablesSection, `
      <div class="section-head section-head-dark" data-animate>
        <div class="section-title">
          <span class="section-kicker">${LEGACY_MODERNISATION_COPY.whatWeBuild.kicker}</span>
          <h2>
            <span>${LEGACY_MODERNISATION_COPY.whatWeBuild.title[0]}</span>
            <em>${LEGACY_MODERNISATION_COPY.whatWeBuild.title[1]}</em>
          </h2>
        </div>
        <p>
          ${LEGACY_MODERNISATION_COPY.whatWeBuild.summary}
        </p>
      </div>

      <div class="engineering-build-grid" data-animate>
        ${LEGACY_MODERNISATION_COPY.whatWeBuild.columns.map((col) => `
        <article class="engineering-build-column">
          <h3>${col.heading}</h3>
          <ul class="engineering-build-list">
            ${col.bullets.map((b) => `<li>${b}</li>`).join('')}
          </ul>
        </article>`).join('')}
      </div>

      <div class="engineering-build-divider" data-animate></div>

      <div class="engineering-build-footer" data-animate>
        <span class="engineering-build-kicker">${LEGACY_MODERNISATION_COPY.whatWeBuild.deliveryKicker}</span>
        <div class="engineering-build-cards">
          ${LEGACY_MODERNISATION_COPY.whatWeBuild.deliveryCards.map((c) => `
          <article class="engineering-build-card">
            <h3>${c.heading}</h3>
            <p>
              ${c.body}
            </p>
          </article>`).join('')}
        </div>
      </div>
    `);

    roadmapSection.classList.add('roadmap-section-legacy');
    setSafeHTML(roadmapSection, `
      <div class="section-head" data-animate>
        <div class="section-title">
          <span class="section-kicker">${LEGACY_MODERNISATION_COPY.howWeBuild.kicker}</span>
          <h2>
            <span>${LEGACY_MODERNISATION_COPY.howWeBuild.title[0]}</span>
            <em>${LEGACY_MODERNISATION_COPY.howWeBuild.title[1]}</em>
          </h2>
        </div>
        <p>
          ${LEGACY_MODERNISATION_COPY.howWeBuild.summary}
        </p>
      </div>

      <div class="roadmap-grid" data-animate>
        ${LEGACY_MODERNISATION_COPY.howWeBuild.cards.map((c) => `
        <article class="roadmap-card">
          <h3>${c.heading}</h3>
          <p>
            ${c.body}
          </p>
          <span class="roadmap-phase">${c.pill}</span>
        </article>`).join('')}
      </div>
    `);
    return;
  }

  if (mode === 'intelligent-operations') {
    section.classList.add('domains-section-operations');
    kicker.textContent = INTELLIGENT_OPERATIONS_COPY.domains.kicker;
    setSafeHTML(title, `<em>${INTELLIGENT_OPERATIONS_COPY.domains.title[0]}</em><span>${INTELLIGENT_OPERATIONS_COPY.domains.title[1]}</span>`);
    summary.textContent = INTELLIGENT_OPERATIONS_COPY.domains.summary;

    setSafeHTML(content, INTELLIGENT_OPERATIONS_COPY.domains.cards.map((c) => `
      <article class="domain-card">
        <h3>${c.heading}</h3>
        <p>${c.body}</p>
      </article>`).join(''));

    applyIntelligentOperationsTextOverrides();
    return;
  }

  if (mode === 'ai-governance') {
    roadmapSection.classList.add('roadmap-section-governance');
    kicker.textContent = AI_GOVERNANCE_COPY.domains.kicker;
    setSafeHTML(title, `<em>${AI_GOVERNANCE_COPY.domains.title[0]}</em><span>${AI_GOVERNANCE_COPY.domains.title[1]}</span>`);
    summary.textContent = AI_GOVERNANCE_COPY.domains.summary;

    setSafeHTML(content, AI_GOVERNANCE_COPY.domains.cards.map((c) => `
      <article class="domain-card">
        <h3>${c.heading}</h3>
        <p>
          ${c.body}
        </p>
        <span>${c.pill}</span>
      </article>`).join(''));

    const items = AI_GOVERNANCE_COPY.deliverables.items;
    const splitAt = Math.ceil(items.length / 2);
    const renderDeliverablesItem = (item) => `
      <article class="deliverables-item">
        <span class="deliverables-bullet" aria-hidden="true"></span>
        <div class="deliverables-copy">
          <h3>${item.heading}</h3>
          <p>
            ${item.body}
          </p>
        </div>
      </article>`;
    setSafeHTML(deliverablesSection, `
      <div class="section-head section-head-dark" data-animate>
        <div class="section-title">
          <span class="section-kicker">${AI_GOVERNANCE_COPY.deliverables.kicker}</span>
          <h2>
            <em>${AI_GOVERNANCE_COPY.deliverables.title[0]}</em>
            <span>${AI_GOVERNANCE_COPY.deliverables.title[1]}</span>
          </h2>
        </div>
        <p>
          ${AI_GOVERNANCE_COPY.deliverables.summary}
        </p>
      </div>

      <div class="deliverables-columns" data-animate>
        <div class="deliverables-list">
          ${items.slice(0, splitAt).map(renderDeliverablesItem).join('')}
        </div>
        <div class="deliverables-list">
          ${items.slice(splitAt).map(renderDeliverablesItem).join('')}
        </div>
      </div>

      <div class="delivery-cadence" data-animate>
        <span class="delivery-cadence-kicker">${AI_GOVERNANCE_COPY.deliverables.cadenceKicker}</span>
      </div>

      <div class="deliverables-cards" data-animate>
        ${AI_GOVERNANCE_COPY.deliverables.cadenceCards.map((c) => `
        <article class="deliverable-card">
          <h3>${c.heading}</h3>
          <p>
            ${c.body}
          </p>
        </article>`).join('')}
      </div>
    `);

    setSafeHTML(roadmapSection, `
      <div class="section-head" data-animate>
        <div class="section-title">
          <span class="section-kicker">${AI_GOVERNANCE_COPY.howWeBuild.kicker}</span>
          <h2>
            <em>${AI_GOVERNANCE_COPY.howWeBuild.title[0]}</em>
            <span>${AI_GOVERNANCE_COPY.howWeBuild.title[1]}</span>
          </h2>
        </div>
        <p>
          ${AI_GOVERNANCE_COPY.howWeBuild.summary}
        </p>
      </div>

      <div class="roadmap-grid" data-animate>
        ${AI_GOVERNANCE_COPY.howWeBuild.cards.map((c) => `
        <article class="roadmap-card">
          <span class="roadmap-phase">${c.pill}</span>
          <h3>${c.heading}</h3>
          <p>
            ${c.body}
          </p>
        </article>`).join('')}
      </div>
    `);

    applyAIGovernancePageCopy();
    return;
  }
};

const resolveToSiteHref = (href) => {
  if (href === '#about') return 'about';
  if (href === '#services') return 'ai-accelerated-fintech-engineering';
  if (href.startsWith('#')) return `/${href}`;
  return href;
};

const buildFooterLinks = (footer) => ({
  ...footer,
  columns: footer.columns.map((column) => ({
    ...column,
    links: column.links.map((link) => ({
      ...link,
      href: resolveToSiteHref(link.href),
    })),
  })),
  legal: {
    ...footer.legal,
    links: footer.legal.links.map((link) => ({
      ...link,
      href: resolveToSiteHref(link.href),
    })),
  },
});

const buildNav = (nav) => ({
  ...nav,
  links: nav.links.map((link) => ({
    ...link,
    href: link.label === 'Services' ? 'services' : resolveToSiteHref(link.href),
  })),
});

/** Re-run the render pass for whichever mode is currently active. Each mode's
 * text-override function reads from its own mutable COPY object, so calling
 * this again after a Firebase merge picks up any CMS edits. */
const applyModeCopy = () => {
  const mode = getServiceMode();
  if (mode === 'ai-accelerated-fintech-engineering') applyAIAcceleratedPageCopy();
  else if (mode === 'ai-powered-legacy-modernisation') applyLegacyModernisationTextOverrides();
  else if (mode === 'intelligent-operations') applyIntelligentOperationsTextOverrides();
  else if (mode === 'ai-governance') applyAIGovernancePageCopy();
};

const initServicesPage = async () => {
  initNavToggle();
  document
    .querySelector('[data-service-trusted-logos]')
    ?.classList.add('logo-marquee', 'logo-marquee-light');
  renderLogoMarquee('[data-service-trusted-logos]', TRUSTED_LOGOS);
  applyServiceMode();
  applyModeCopy();
  initFaqAccordion();
  initScrollAnimations();

  initEmailCapture({
    promptHeading: 'Want the full services breakdown?',
    promptSubtext: 'We\'ll email you our detailed overview.',
    buttonLabel: 'Get overview',
    triggerPercent: 0.5,
    storageKey: 'panasa_email_services',
    crmDescription: 'Email capture: Services overview (Services page)',
  });

  try {
    const content = await loadContent();
    renderNav(buildNav(content.nav));
    renderFooter(buildFooterLinks(content.footer));
    applyModeCopy();
  } catch (error) {
    console.error('Failed to load shared service page content', error);
    if (window.DEFAULT_CONTENT?.nav) renderNav(buildNav(window.DEFAULT_CONTENT.nav));
    if (window.DEFAULT_CONTENT?.footer) {
      renderFooter(buildFooterLinks(window.DEFAULT_CONTENT.footer));
    }
    applyModeCopy();
  }

  // Fetch CMS-published content for the active service page and re-render
  // once it arrives — mirrors the fetch/apply pattern used on contact.js and
  // careers.js. A missing/failed fetch is a silent no-op: the defaults above
  // already rendered, so the page never blanks out.
  const mode = getServiceMode();
  const fbPath = FB_PATH_BY_MODE[mode];
  if (fbPath) {
    const fbRaw = await fetchPageContent(fbPath);
    if (fbRaw) {
      const fb = deepStripTags(fbRaw);
      applySeoMeta(fb.meta);
      mergeServiceFirebaseContent(mode, fb);
      applyServiceMode();
      applyModeCopy();
      applyEmailCaptureOverride(fb);
      // Same DOM-replacement caveat as the live-preview path below: re-observe
      // the freshly-injected [data-animate] nodes so they aren't stuck at opacity:0.
      initScrollAnimations();
    }
  }
};

initServicesPage();

// Live preview hook — the admin preview iframe calls this with fresh section
// data as the editor types.
if (new URLSearchParams(window.location.search).get('preview') === 'true') {
  window.__livePreviewRender = (data) => {
    try {
      const mode = getServiceMode();
      const fb = data ? deepStripTags(data) : null;
      applySeoMeta(fb?.meta);
      mergeServiceFirebaseContent(mode, fb);
      applyServiceMode();
      applyModeCopy();
      applyEmailCaptureOverride(fb);
      // applyServiceMode()/applyModeCopy() replace section innerHTML wholesale,
      // so freshly-injected [data-animate] nodes were never seen by the
      // scroll-reveal observer and would otherwise stay stuck at opacity:0.
      initScrollAnimations();
    } catch (e) { console.warn('[live-preview] services failed:', e); }
  };
}

window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    initScrollAnimations();
  }
});
