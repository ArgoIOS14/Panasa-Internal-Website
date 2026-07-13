import { SEO_META_EXTRAS } from './seoMetaFields.js';
import { STRUCTURED_DATA_SECTION } from './structuredDataSection.js';

export const fbPath = 'pages/intelligentOperations';

export const defaults = {
  meta: {
    title: 'Intelligent Operations | Panasa',
    description: 'Fintech operations that scale without scaling headcount. 24x7 monitoring, fraud handling, disputes, reconciliation and onboarding for regulated platforms.',
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
    pill: 'INTELLIGENT OPERATIONS',
    title: ['Fintech operations that scale', 'without scaling headcount'],
    subtitle: 'Transaction volumes increase faster than most operational models are designed to handle, while chargeback rules continue to evolve on a quarterly basis and clients expect sub hour response times at all hours of the day. Traditional operations teams often struggle under that level of pressure. We build intelligent operational systems specifically designed to perform at that scale.',
    primaryCta: { label: 'Talk to our team', href: 'contact.html' },
    secondaryCta: { label: 'View Case Studies', href: '#careers' },
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
      { heading: 'L1 operations - 24x7', bullets: [{ icon: null, text: 'Customer support - voice and non-voice' }, { icon: null, text: 'Transaction analysis and service monitoring' }, { icon: null, text: 'Fraud analysis and queue management' }, { icon: null, text: 'Implementation support and client onboarding' }, { icon: null, text: 'Initial triage and ticket prioritisation' }] },
      { heading: 'L2 operations - 24x7', bullets: [{ icon: null, text: 'Production support and incident management' }, { icon: null, text: 'Infrastructure and network security' }, { icon: null, text: 'DevOps pipeline management' }, { icon: null, text: 'Complex issue investigation and RCA' }, { icon: null, text: 'Security operations and compliance support' }] },
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
    title: ['Operations becomes a growth', 'function not a cost centre'],
    summary: "The point isn't just to keep things running. It's to run them well enough that operations become a growth function, not a cost centre.",
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
  testimonial: { quote: "Panasa allows us to focus on growing our brands. With their fintech expertise, dedication, ability to scale our operations, and meticulous attention to detail, we're able to position ourselves as one of the most cutting-edge groups in payment solutions.", name: 'Tom Bishop', role: 'Chief Commercial Officer – Cleva', logo: 'assets/testimonial-logo-cleava.svg', logoAlt: 'Cleva' },
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
  { key: 'domains', label: 'Operational Domains', fields: [{ key: 'kicker', label: 'Kicker', type: 'text' }, { key: 'title', label: 'Title (line 1 | line 2)', type: 'title' }, { key: 'summary', label: 'Summary', type: 'textarea' }, { key: 'cards', label: 'Domain cards', type: 'heading-body-cards' }] },
  { key: 'deliverables', label: 'Deliverables', fields: [{ key: 'kicker', label: 'Kicker', type: 'text' }, { key: 'title', label: 'Title (line 1 | line 2)', type: 'title' }, { key: 'summary', label: 'Summary', type: 'textarea' }, { key: 'supportTiers', label: 'Support tiers', type: 'columns', help: 'Each tier renders as a card with a heading and a bulleted list — add as many tiers/bullets as you need, the section rebuilds to fit.' }, { key: 'aiAgentsKicker', label: 'AI Agents kicker', type: 'text' }, { key: 'aiAgents', label: 'AI Agent cards', type: 'heading-body-cards' }] },
  { key: 'howWeBuild', label: 'What Changes', fields: [{ key: 'kicker', label: 'Kicker', type: 'text' }, { key: 'title', label: 'Title (line 1 | line 2)', type: 'title' }, { key: 'summary', label: 'Summary', type: 'textarea' }, { key: 'cards', label: 'Outcome cards', type: 'pill-cards' }] },
  { key: 'why', label: 'Why Panasa', fields: [{ key: 'kicker', label: 'Kicker', type: 'text' }, { key: 'title', label: 'Title (line 1 | line 2)', type: 'title' }, { key: 'summary', label: 'Summary', type: 'textarea' }, { key: 'cards', label: 'Reason cards', type: 'heading-body-cards' }] },
  { key: 'fit', label: 'Who This Is For', fields: [{ key: 'kicker', label: 'Kicker', type: 'text' }, { key: 'title', label: 'Title (line 1 | line 2)', type: 'title' }, { key: 'summary', label: 'Summary', type: 'textarea' }, { key: 'bullets', label: 'Audience bullets', type: 'string-list' }, { key: 'engageKicker', label: 'Engage kicker', type: 'text' }, { key: 'engageCards', label: 'Engagement models', type: 'heading-body-cards' }] },
  { key: 'testimonial', label: 'Testimonial', fields: [{ key: 'quote', label: 'Quote', type: 'textarea' }, { key: 'name', label: 'Name', type: 'text' }, { key: 'role', label: 'Role / company', type: 'text' }, { key: 'logo', label: 'Logo image', type: 'image' }, { key: 'logoAlt', label: 'Logo alt text', type: 'text' }] },
  { key: 'faq', label: 'FAQ', fields: [{ key: 'title', label: 'Title', type: 'text' }, { key: 'titleEmphasis', label: 'Title (emphasised word)', type: 'text' }, { key: 'subtitle', label: 'Subtitle', type: 'textarea' }, { key: 'items', label: 'FAQ items', type: 'faq-items', help: 'The page only has 5 FAQ slots — only the first 5 items render.' }] },
  { key: 'footerCta', label: 'Footer CTA', fields: [{ key: 'title', label: 'CTA title', type: 'text' }] },
  STRUCTURED_DATA_SECTION,
];
