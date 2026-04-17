export const fbPath = 'pages/about';

export const defaults = {
  hero: {
    pill: 'Trusted Fintech Tech Partner',
    title: 'Building Secure & Scalable',
    titleEmphasis: 'Fintech Infrastructure',
    subtitle: 'Trusted by both established institutions and fast-moving new-age card platforms to engineer, operate, and scale modern payment systems.',
    primaryCta: { label: 'Explore Services', href: 'ai-accelerated-fintech-engineering.html', icon: 'assets/about-hero-explore-icon.svg' },
    secondaryCta: { label: 'View Open Roles', href: 'careers.html', icon: 'assets/about-hero-roles-icon.svg' },
  },
  stats: [
    { value: '20+', label: 'Years of Experience', icon: 'assets/about-stat-experience.svg' },
    { value: '300+', label: 'Team Members', icon: 'assets/about-stat-team.svg' },
    { value: 'Billions+', label: 'Transactions', icon: 'assets/about-stat-transactions.svg' },
    { value: '99.95%', label: 'Uptime', icon: 'assets/about-stat-uptime.svg' },
  ],
  delivery: {
    title: 'Global',
    titleEmphasis: 'Delivery Footprint',
    subtitle: 'We support fintech teams across regions with engineering, operations, and regulatory readiness.',
  },
  process: {
    title: 'From Idea to',
    titleEmphasis: 'Live Operations',
    subtitle: 'We accelerate fintech launches through strategy, delivery, and long-term operational ownership.',
    steps: [
      { heading: 'Scope', description: 'Problem framing, acceptance criteria, scheme rules mapped to requirements' },
      { heading: 'Prototype', description: 'Competing approaches built on separate branches. Working code in days, not weeks' },
      { heading: 'Validate', description: 'Automated linting, security scans, type checks. Issues caught and fixed before review' },
      { heading: 'Test', description: 'AI-generated test suites from acceptance criteria. 80% + coverage enforced at the pipeline level' },
      { heading: 'Deploy', description: 'Progressive rollout with canary releases, automated rollback triggers, and full observability' },
    ],
  },
  leadership: [
    { name: 'Rajesh Thaikootathil', role: 'Managing Director', bio: "Leads Panasa's delivery and growth strategy across fintech programs, with deep experience scaling secure payments platforms.", image: 'assets/leader-rajesh.webp' },
    { name: 'Deepthi Ajay', role: 'Director - Projects', bio: 'Oversees programme execution, delivery governance, and project operations for complex fintech implementation teams.', image: 'assets/leader-deepthi.webp' },
    { name: 'Moharam Kunnath', role: 'Chief Technology Officer', bio: 'Drives platform architecture, engineering quality, and technology strategy for modern card and payments infrastructure.', image: 'assets/leader-moharam.webp' },
    { name: 'Jishnu V', role: 'IT Manager', bio: 'Manages infrastructure readiness, internal systems, and secure IT operations supporting enterprise-scale delivery teams.', image: 'assets/leader-jishnu.webp' },
    { name: 'Rahul Chandra', role: 'Sales Director', bio: 'Sales Director driving pipeline growth across Europe and GCC. 15+ years in B2B tech with strengths in partnerships, solution architecture and key accounts management', image: 'assets/leader-rahul.webp' },
  ],
  testimonials: {
    title: 'Trusted by',
    titleEmphasis: 'Fintech Leaders',
    subtitle: 'What our clients say about working with Panasa across engineering and operations.',
    cards: [
      { text: 'Panasa has been a great asset in developing our payment solutions, acting as a true extension of our team while enabling scale and continuous support. We highly recommend their fintech development services.', name: 'Giovanni Santini', role: 'Chief Executive Officer', logo: 'assets/testimonial-logo-osper.svg', logoAlt: 'Osper' },
      { text: "Panasa allows us to focus on growing our brands. With their FinTech expertise, dedication, ability to scale, and meticulous attention to detail, we're able to position ourselves as one of the most cutting-edge groups in payment solutions.", name: 'Tom Bishop', role: 'Chief Commercial Officer', logo: 'assets/testimonial-logo-cleava.svg', logoAlt: 'Cleava' },
    ],
  },
  emailCapture: {
    promptHeading: "Have a question we didn't cover?",
    promptSubtext: "Leave your email and we'll follow up.",
    buttonLabel: 'Follow up',
  },
  faq: {
    title: 'Frequently Asked',
    titleEmphasis: 'Questions',
    subtitle: 'Everything you would want to know about Panasa. Find quick answers below.',
    items: [
      { question: 'How does Panasa support fintech payment and issuing platforms?', answer: 'Panasa offers engineering, platform modernisation, cloud operations, and delivery ownership tailored to regulated card and payments platforms.' },
      { question: 'What types of fintech companies does Panasa typically work with?', answer: 'We work with issuers, processors, neobanks, embedded finance teams, and payment platforms building or scaling secure transaction infrastructure.' },
      { question: 'Does Panasa help with compliance and security requirements?', answer: 'Yes. Compliance readiness, secure engineering practices, and operational governance are integrated into our delivery model.' },
      { question: 'Can Panasa help scale platforms with high transaction volumes?', answer: 'Yes. We support platforms processing large transaction volumes with resilient architecture, performance tuning, and 24/7 operations.' },
      { question: 'How is Panasa different from a traditional development agency?', answer: 'We combine fintech domain depth, engineering delivery, and live platform operations, so teams do not need to coordinate across multiple vendors.' },
    ],
  },
};

export const sections = [
  { key: 'hero', label: 'Hero Section', fields: [
    { key: 'pill', label: 'Pill badge', type: 'text' },
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'titleEmphasis', label: 'Title emphasis', type: 'text' },
    { key: 'subtitle', label: 'Subtitle', type: 'textarea' },
    { key: 'primaryCta', label: 'Primary CTA', type: 'label-href' },
    { key: 'secondaryCta', label: 'Secondary CTA', type: 'label-href' },
  ]},
  { key: 'stats', label: 'Statistics', fields: [
    { key: 'stats', label: 'Stat cards', type: 'stats', arrayAtRoot: true },
  ]},
  { key: 'delivery', label: 'Global Delivery', fields: [
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'titleEmphasis', label: 'Title emphasis', type: 'text' },
    { key: 'subtitle', label: 'Subtitle', type: 'textarea' },
  ]},
  { key: 'process', label: 'Process Steps', fields: [
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'titleEmphasis', label: 'Title emphasis', type: 'text' },
    { key: 'subtitle', label: 'Subtitle', type: 'textarea' },
    { key: 'steps', label: 'Steps', type: 'stages' },
  ]},
  { key: 'leadership', label: 'Leadership Team', fields: [
    { key: 'leadership', label: 'Team members', type: 'leader-cards', arrayAtRoot: true },
  ]},
  { key: 'testimonials', label: 'Testimonials', fields: [
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'titleEmphasis', label: 'Title emphasis', type: 'text' },
    { key: 'subtitle', label: 'Subtitle', type: 'textarea' },
    { key: 'cards', label: 'Testimonial cards', type: 'testimonial-cards' },
  ]},
  { key: 'faq', label: 'FAQ', fields: [
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'titleEmphasis', label: 'Title emphasis', type: 'text' },
    { key: 'subtitle', label: 'Subtitle', type: 'textarea' },
    { key: 'items', label: 'FAQ items', type: 'faq-items' },
  ]},
  { key: 'emailCapture', label: 'Email Capture Popup', fields: [{ key: 'promptHeading', label: 'Heading', type: 'text' }, { key: 'promptSubtext', label: 'Subtext', type: 'text' }, { key: 'buttonLabel', label: 'Button label', type: 'text' }] },
];
