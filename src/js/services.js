import { initScrollAnimations } from './Home scenes/components/animations.js';
import { loadContent } from './Home scenes/data/loadContent.js';
import { renderFooter } from './Home scenes/sections/footer.js';
import { renderLogoMarquee } from './Home scenes/sections/logoMarquee.js';
import { initNavToggle, renderNav } from './Home scenes/sections/nav.js';

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
      'We build card programmes, payment engines, and issuing platforms for regulated fintechs. Our teams use AI tooling to cut delivery timelines in half',
    primaryCta: 'Explore Services',
    secondaryCta: 'View Open Roles',
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
    title: ['Five stages', 'continuous feedback'],
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
      "We don't build prototypes that need to be rebuilt for production. Every platform is architected for the transaction",
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
    title: ["Why Fintech's", 'Choose Panasa'],
    summary:
      'What sets us apart in the fintech development landscape',
    cards: [
      {
        heading: 'Payment Experts, Not Generalists',
        body: '20+ years building card platforms, not generic software. We speak authorization flows, 3DS, and scheme integrations fluently.',
      },
      {
        heading: 'Proven at scale',
        body: "Supporting platforms processing 10M+ transactions monthly. We've been there, scaled that.",
      },
      {
        heading: 'Full-Stack Team',
        body: 'From strategy to 24x7 ops-no vendor juggling needed. One team, end-to-end ownership.',
      },
      {
        heading: 'Compliance-First Approach',
        body: 'ISO 27001 certified, PCI-DSS aligned, GDPR compliant. Built-in audit readiness from day one.',
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
  footerCta: {
    title: 'Ready to Build Your Card Platform',
  },
};

const setHTML = (node, html) => {
  if (node) node.innerHTML = html;
};

const setText = (node, text) => {
  if (node && typeof text === 'string') node.textContent = text;
};

const applyAIAcceleratedPageCopy = () => {
  const copy = AI_ACCELERATED_COPY;

  const heroSection = document.querySelector('.service-hero');
  if (heroSection) {
    setText(heroSection.querySelector('.pill'), copy.hero.pill);
    const heroHeading = heroSection.querySelector('h1');
    setHTML(
      heroHeading,
      `<span>${copy.hero.title[0]}</span><em>${copy.hero.title[1]}</em>`,
    );
    setText(heroSection.querySelector('.service-hero-copy p'), copy.hero.subtitle);

    const heroButtons = heroSection.querySelectorAll('.hero-actions .hero-action-label');
    if (heroButtons[0]) heroButtons[0].textContent = copy.hero.primaryCta;
    if (heroButtons[1]) heroButtons[1].textContent = copy.hero.secondaryCta;

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
    setHTML(
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
    setHTML(whyHeading, `${copy.why.title[0]} <span>${copy.why.title[1]}</span>`);
    setText(whySection.querySelector('.section-title-split p'), copy.why.summary);

    const featureCards = whySection.querySelectorAll('.feature-card');
    copy.why.cards.forEach((item, index) => {
      const card = featureCards[index];
      if (!card) return;
      setText(card.querySelector('h3'), item.heading);
      setText(card.querySelector('p'), item.body);
    });
  }

  const fitSection = document.querySelector('.fit-section');
  if (fitSection) {
    setText(fitSection.querySelector('.section-kicker'), copy.fit.kicker);
    const fitHeading = fitSection.querySelector('.section-title h2');
    setHTML(
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

  const footerTitle = document.querySelector('[data-footer-cta-title]');
  setText(footerTitle, copy.footerCta.title);
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
  return params.get('service') || 'ai-accelerated-fintech-engineering';
};

const applyIntelligentOperationsTextOverrides = () => {
  const hero = document.querySelector('.service-hero');
  if (hero) {
    const heroPill = hero.querySelector('.pill');
    const heroTitle = hero.querySelector('h1');
    const heroSummary = hero.querySelector('.service-hero-copy p');
    const heroActions = hero.querySelectorAll('.hero-action-label');
    const trustKicker = hero.querySelector('.trusted-kicker');
    const heroStatCards = hero.querySelectorAll('.hero-stat-card');

    if (heroPill) heroPill.textContent = 'INTELLIGENT OPERATIONS';
    if (heroTitle) {
      heroTitle.innerHTML =
        '<span>Fintech operations that scale</span><em>without scaling headcount</em>';
    }
    if (heroSummary) {
      heroSummary.textContent =
        'Transaction volumes double. Chargebacks, rules change quarterly. Your clients expect sub-hour response times around the clock.';
    }
    if (heroActions[0]) heroActions[0].textContent = 'Explore Services';
    if (heroActions[1]) heroActions[1].textContent = 'View Open Roles';
    if (trustKicker) trustKicker.textContent = 'TRUSTED BY HIGH-GROWTH FINTECHS';

    const heroStats = [
      { value: '99.99%', label: 'System uptime maintained' },
      { value: '<1hr', label: 'P1 incident response time' },
      { value: '30-50%', label: 'Cost reduction in-house' },
      { value: '800M+', label: 'Transactions managed' },
    ];
    heroStatCards.forEach((card, index) => {
      const stat = heroStats[index];
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

    if (challengeKicker) challengeKicker.textContent = 'The Problem';
    if (challengeTitle) {
      challengeTitle.innerHTML =
        '<span>Operations gets harder every</span><span>quarter and <em>your team is already stretched</em></span>';
    }
    if (challengeSummary) {
      challengeSummary.textContent =
        'Transaction volumes go up. Chargeback rules change. New scheme mandates land.';
    }

    const challengeCopy = [
      {
        title: 'Support tickets spike, resolution slows',
        body: 'As your client base grows, so does the volume of inquiries, disputes, and technical issues. Without structured L1/L2/L3 tiers and proper escalation paths, everything bottlenecks at the same small team.',
      },
      {
        title: 'Reconciliation and reporting are manual',
        body: 'Settlements, chargebacks, scheme fees reconciled in spreadsheets, cross-checked by hand, and delivered late. One missed exception can cascade into regulatory reporting problems.',
      },
      {
        title: "Fraud slips through because nobody is watching at 2am",
        body: "Fraudsters don't work business hours. Without round-the-clock monitoring, rule-based detection, and a team that can act immediately, you find out about fraud from your clients - not your systems.",
      },
    ];

    challengeCards.forEach((card, index) => {
      const copy = challengeCopy[index];
      if (!copy) return;
      const title = card.querySelector('h3');
      const body = card.querySelector('p');
      if (title) title.textContent = copy.title;
      if (body) body.textContent = copy.body;
    });
  }

  const domains = document.querySelector('.domains-section');
  if (domains) {
    const domainSummary = domains.querySelector('.section-head p');
    const domainCards = domains.querySelectorAll('.domain-card');

    if (domainSummary) {
      domainSummary.textContent =
        "We don't just monitor dashboards. We run the full back-office - from real-time transaction monitoring through to dispute resolution.";
    }

    const domainCopy = [
      {
        title: 'Transaction monitoring and uptime',
        body: '24x7 service monitoring with alerting and escalation. Dashboard monitoring, investigation of alerts, immediate escalation per defined runbooks. Tools: Coralogix, Datadog, NewRelic, CloudWatch, PagerDuty.',
      },
      {
        title: 'Fraud and risk handling',
        body: 'Real-time fraud detection with rule-based engines and ML models. Fraud queues, block/unblock workflows, integration with card controls and 3DS alerts. Prevention strategies and ongoing rule tuning.',
      },
      {
        title: 'Customer and cardholder support',
        body: 'L1 through L3 support across voice, chat, email, and in-app channels. Inquiry handling, card status updates, dispute assistance, and social media monitoring. Feedback loop to product and analytics.',
      },
      {
        title: 'Disputes and chargebacks',
        body: 'Full lifecycle chargeback management - rule-based tagging, document workflows, evidence gathering, and response generation. SLA tracking and Visa/Mastercard scheme alignment.',
      },
      {
        title: 'Reporting and reconciliation',
        body: 'Daily reconciliation of transactions, settlements, and chargebacks. Exception logs, scheduled pipelines for audit-ready data, and integration with BI tools like Power BI.',
      },
      {
        title: 'Onboarding and implementation',
        body: 'Platform onboarding for new clients. Merchant setup, KYC review, operations playbook creation, and weekly/monthly reporting. Secure infrastructure with role-based access.',
      },
    ];

    domainCards.forEach((card, index) => {
      const copy = domainCopy[index];
      if (!copy) return;
      const title = card.querySelector('h3');
      const body = card.querySelector('p');
      if (title) title.textContent = copy.title;
      if (body) body.textContent = copy.body;
    });
  }

  const deliverables = document.querySelector('.deliverables-section');
  if (deliverables) {
    deliverables.classList.add('deliverables-section-operations');
    deliverables.innerHTML = `
      <div class="section-head section-head-dark" data-animate>
        <div class="section-title">
          <span class="section-kicker">How It Works</span>
          <h2>
            <em>Structured support tiers</em>
            <span>not ad hoc firefighting</span>
          </h2>
        </div>
        <p>
          We run multi-tier support with defined response times, escalation paths, and KPIs for every level.
        </p>
      </div>

      <div class="ops-support-grid" data-animate>
        <article class="ops-support-card">
          <h3>L1 operations - 24x7</h3>
          <ul class="ops-support-list">
            <li>Customer support - voice and non-voice</li>
            <li>Transaction analysis and service monitoring</li>
            <li>Fraud analysis and queue management</li>
            <li>Implementation support and client onboarding</li>
            <li>Initial triage and ticket prioritisation</li>
          </ul>
        </article>
        <article class="ops-support-card">
          <h3>L2 operations - 24x7</h3>
          <ul class="ops-support-list">
            <li>Production support and incident management</li>
            <li>Infrastructure and network security</li>
            <li>DevOps pipeline management</li>
            <li>Complex issue investigation and RCA</li>
            <li>Security operations and compliance support</li>
          </ul>
        </article>
      </div>

      <div class="delivery-cadence" data-animate>
        <span class="delivery-cadence-kicker">AI Agents In Operations</span>
      </div>

      <div class="deliverables-cards ops-agent-cards" data-animate>
        <article class="deliverable-card">
          <h3>Scheme Compliance Monitoring</h3>
          <p>
            Automatically tracks Visa and Mastercard bulletins, classifies changes as regulatory, policy, or informational, maps impact to affected business units, and generates compliance tickets in Jira. Replaces the manual process of reading circulars and emailing teams.
          </p>
        </article>
        <article class="deliverable-card">
          <h3>Incident Documentation Agent</h3>
          <p>
            Monitors DataDog, Prometheus, and PagerDuty to capture incidents automatically. Consolidates logs, metrics, and alerts into a unified timeline. Generates structured summaries, RCA skeletons, and client-ready status updates - so engineers resolve instead of documenting.
          </p>
        </article>
        <article class="deliverable-card">
          <h3>Client Onboarding Assistant</h3>
          <p>
            Ingests onboarding documents, extracts and validates configuration fields across ninety-plus parameters, and promotes settings across dev, staging, and production environments with controlled approvals. Cuts manual data entry and environment mismatches.
          </p>
        </article>
        <article class="deliverable-card">
          <h3>Due Diligence Agent</h3>
          <p>
            Screens entities against global sanctions, PEP watchlists, and adverse media. Generates onboarding risk summaries, maintains continuous re-screening of existing clients, and routes high-risk cases through enhanced due diligence workflows.
          </p>
        </article>
      </div>
    `;
  }

  const roadmap = document.querySelector('.roadmap-section');
  if (roadmap) {
    roadmap.classList.add('roadmap-section-operations');
    roadmap.innerHTML = `
      <div class="section-head" data-animate>
        <div class="section-title">
          <span class="section-kicker">What Changes</span>
          <h2>
            <span>Operations becomes a growth</span>
            <span>function <em>not a cost centre</em></span>
          </h2>
        </div>
        <p>
          The point isn't just to keep things running.
          It's to run them well enough that operations.
        </p>
      </div>

      <div class="roadmap-grid" data-animate>
        <article class="roadmap-card">
          <h3>Scale without proportional headcount</h3>
          <p>
            AI accelerators and automation handle the volume growth. You go from ten to fifty card programmes without a linear increase in ops cost. Outcome-based pricing means you pay for results, not seats.
          </p>
          <span class="roadmap-phase">30-50% COST REDUCTION</span>
        </article>
        <article class="roadmap-card">
          <h3>Faster resolution, better CSAT</h3>
          <p>
            Structured tiers, intelligent triage, and AI-assisted responses mean faster first-contact resolution. Your clients notice the difference - in response times, in accuracy, and in how quickly issues close.
          </p>
          <span class="roadmap-phase">9/10 CLIENT CSAT</span>
        </article>
        <article class="roadmap-card">
          <h3>Compliance handled, not chased</h3>
          <p>
            Reconciliation, scheme reporting, AML / KYC workflows, and regulatory submissions happen on schedule - not as last-minute scrambles. Audit-ready data pipelines mean you're always prepared.
          </p>
          <span class="roadmap-phase">ALWAYS AUDIT-READY</span>
        </article>
      </div>
    `;
  }

  const why = document.querySelector('.why-section');
  if (why) {
    const whyPill = why.querySelector('.section-heading-copy .pill');
    const whyTitle = why.querySelector('.section-heading-copy h2');
    const whySummary = why.querySelector('.section-title-split p');
    const whyCards = why.querySelectorAll('.feature-card');

    if (whyPill) whyPill.textContent = 'Why Panasa';
    if (whyTitle) whyTitle.innerHTML = "Why Fintech's <span>Choose Panasa</span>";
    if (whySummary) {
      whySummary.textContent = 'What sets us apart in the fintech development landscape';
    }

    const whyCopy = [
      {
        title: 'Payment Experts, Not Generalists',
        body: '20+ years building card platforms, not generic software. We speak authorization flows, 3DS, and scheme integrations fluently.',
      },
      {
        title: 'Proven at scale',
        body: "Supporting platforms processing 10M+ transactions monthly. We've been there, scaled that.",
      },
      {
        title: 'Full-Stack Team',
        body: 'From strategy to 24x7 ops-no vendor juggling needed. One team, end-to-end ownership.',
      },
      {
        title: 'Compliance-First Approach',
        body: 'ISO 27001 certified, PCI-DSS aligned, GDPR compliant. Built-in audit readiness from day one.',
      },
    ];

    whyCards.forEach((card, index) => {
      const copy = whyCopy[index];
      if (!copy) return;
      const title = card.querySelector('h3');
      const body = card.querySelector('p');
      if (title) title.textContent = copy.title;
      if (body) body.textContent = copy.body;
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

    if (fitKicker) fitKicker.textContent = 'Who This Is For';
    if (fitTitle) {
      fitTitle.innerHTML =
        '<em>Fintechs that need operations</em><span>to keep pace with growth</span>';
    }
    if (fitSummary) {
      fitSummary.textContent = '';
    }

    const fitItemCopy = [
      'Issuer processors scaling transaction volumes and client count',
      'Card platforms where fraud and disputes are growing faster than headcount',
      "PSPs that need 24x7 monitoring they can't staff in-house",
      'Fintechs looking to reduce ops cost without reducing service quality',
    ];
    fitItems.forEach((item, index) => {
      if (fitItemCopy[index]) item.textContent = fitItemCopy[index];
    });

    if (fitEngageKicker) fitEngageKicker.textContent = 'How We Engage';
    const fitCardCopy = [
      {
        title: 'Managed services',
        body: 'full 24x7 ops with SLA-backed outcomes',
      },
      {
        title: 'Team extension',
        body: 'embed ops specialists into your existing team',
      },
      {
        title: 'Project-based',
        body: 'set up monitoring, fraud systems, or reconciliation pipelines',
      },
      {
        title: 'Flex support',
        body: 'shared resources, 30-day rolling, scale when ready',
      },
    ];
    fitCards.forEach((card, index) => {
      const copy = fitCardCopy[index];
      if (!copy) return;
      const title = card.querySelector('h3');
      const body = card.querySelector('p');
      if (title) title.textContent = copy.title;
      if (body) body.textContent = copy.body;
    });
  }
};

const applyLegacyModernisationTextOverrides = () => {
  const hero = document.querySelector('.service-hero');
  if (hero) {
    const heroPill = hero.querySelector('.pill');
    const heroTitle = hero.querySelector('h1');
    const heroSummary = hero.querySelector('.service-hero-copy p');
    const heroActions = hero.querySelectorAll('.hero-action-label');
    const heroActionLinks = hero.querySelectorAll('.hero-actions a');
    const trustKicker = hero.querySelector('.trusted-kicker');
    const heroStatCards = hero.querySelectorAll('.hero-stat-card');

    if (heroPill) heroPill.textContent = 'AI POWERED LEGACY MODERNISATION';
    if (heroTitle) {
      heroTitle.innerHTML = '<span>Modernise legacy platforms</span><em>without losing the logic</em>';
    }
    if (heroSummary) {
      heroSummary.textContent =
        'Your legacy system works. The problem is nobody can change it quickly, maintain it cheaply, or explain how half of it functions.';
    }
    if (heroActions[0]) heroActions[0].textContent = 'Explore Services';
    if (heroActions[1]) heroActions[1].textContent = 'View Open Roles';
    if (heroActionLinks[1]) heroActionLinks[1].setAttribute('href', 'careers.html');
    if (trustKicker) trustKicker.textContent = 'TRUSTED BY HIGH-GROWTH FINTECHS';

    const heroStats = [
      { value: '30-60%', label: 'Faster migration delivery' },
      { value: '60-75%', label: 'Shorter dev and review cycles' },
      { value: '2-3x', label: 'Engineer productivity uplift' },
      { value: '>90%', label: 'Business logic accuracy retained' },
    ];
    heroStatCards.forEach((card, index) => {
      const stat = heroStats[index];
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

    if (challengeKicker) challengeKicker.textContent = 'The Problem';
    if (challengeTitle) {
      challengeTitle.innerHTML =
        '<span>Legacy migration is</span><span><em>expensive, slow, and risky</em></span>';
    }
    if (challengeSummary) {
      challengeSummary.textContent =
        'Most migration projects run over budget and over time. The business logic that took years to build.';
    }

    const challengeCopy = [
      {
        title: 'Business logic is scattered and undocumented',
        body: 'Rules live in application code, database triggers, batch scripts, and tribal knowledge. When the people who built it leave, the understanding goes with them.',
      },
      {
        title: 'Traditional rewrites take too long and break things',
        body: "Eighteen-month migration timelines that slip to thirty months are common. By the time you finish, the target architecture is already dated - and you've introduced regressions the business discovers in production.",
      },
      {
        title: 'The longer you wait, the more expensive it gets',
        body: 'Maintenance costs on legacy platforms compound year over year. The engineers who can work on them become rarer and more expensive. Meanwhile, new features are impossible to ship at any reasonable pace.',
      },
    ];

    challengeCards.forEach((card, index) => {
      const copy = challengeCopy[index];
      if (!copy) return;
      const title = card.querySelector('h3');
      const body = card.querySelector('p');
      if (title) title.textContent = copy.title;
      if (body) body.textContent = copy.body;
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

    if (fitKicker) fitKicker.textContent = 'Who This Is For';
    if (fitTitle) {
      fitTitle.innerHTML = '<em>Fintechs that need operations</em><span>to keep pace with growth</span>';
    }
    if (fitSummary) fitSummary.textContent = '';

    const fitItemCopy = [
      'Issuer processors scaling transaction volumes and client count',
      "Card platforms where fraud and disputes are growing faster than headcount",
      "PSPs that need 24x7 monitoring they can't staff in-house",
      'Fintechs looking to reduce ops cost without reducing service quality',
    ];
    fitItems.forEach((item, index) => {
      if (fitItemCopy[index]) item.textContent = fitItemCopy[index];
    });

    if (fitEngageKicker) fitEngageKicker.textContent = 'How We Engage';
    const fitCardCopy = [
      {
        title: 'Managed services',
        body: 'full 24x7 ops with SLA-backed outcomes',
      },
      {
        title: 'Team extension',
        body: 'embed ops specialists into your existing team',
      },
      {
        title: 'Project-based',
        body: 'set up monitoring, fraud systems, or reconciliation pipelines',
      },
      {
        title: 'Flex support',
        body: 'shared resources, 30-day rolling, scale when ready',
      },
    ];
    fitCards.forEach((card, index) => {
      const copy = fitCardCopy[index];
      if (!copy) return;
      const title = card.querySelector('h3');
      const body = card.querySelector('p');
      if (title) title.textContent = copy.title;
      if (body) body.textContent = copy.body;
    });
  }
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
  if (heroActions[1]) heroActions[1].textContent = 'View Open Roles';
  if (heroActionLinks[1]) heroActionLinks[1].setAttribute('href', 'careers.html');

  section.classList.remove('domains-section-process', 'domains-section-operations');
  deliverablesSection.classList.remove(
    'deliverables-section-engineering',
    'deliverables-section-operations',
  );
  roadmapSection.classList.remove(
    'roadmap-section-engineering',
    'roadmap-section-operations',
    'roadmap-section-legacy',
  );

  if (mode === 'ai-accelerated-fintech-engineering') {
    section.classList.add('domains-section-process');
    kicker.textContent = AI_ACCELERATED_COPY.howWeWork.kicker;
    title.innerHTML = `<em>${AI_ACCELERATED_COPY.howWeWork.title[0]}</em><span>${AI_ACCELERATED_COPY.howWeWork.title[1]}</span>`;
    summary.textContent = AI_ACCELERATED_COPY.howWeWork.summary;

    content.innerHTML = `
      <div class="process-grid">
        <ol class="process-flow" aria-label="Fintech engineering process">
          <li class="process-flow-item">
            <span class="process-flow-index" aria-hidden="true">1</span>
            <strong>${AI_ACCELERATED_COPY.howWeWork.stages[0].heading}</strong>
            <p>${AI_ACCELERATED_COPY.howWeWork.stages[0].description}</p>
          </li>
          <li class="process-flow-item">
            <span class="process-flow-index" aria-hidden="true">2</span>
            <strong>${AI_ACCELERATED_COPY.howWeWork.stages[1].heading}</strong>
            <p>${AI_ACCELERATED_COPY.howWeWork.stages[1].description}</p>
          </li>
          <li class="process-flow-item">
            <span class="process-flow-index" aria-hidden="true">3</span>
            <strong>${AI_ACCELERATED_COPY.howWeWork.stages[2].heading}</strong>
            <p>${AI_ACCELERATED_COPY.howWeWork.stages[2].description}</p>
          </li>
          <li class="process-flow-item">
            <span class="process-flow-index" aria-hidden="true">4</span>
            <strong>${AI_ACCELERATED_COPY.howWeWork.stages[3].heading}</strong>
            <p>${AI_ACCELERATED_COPY.howWeWork.stages[3].description}</p>
          </li>
          <li class="process-flow-item">
            <span class="process-flow-index" aria-hidden="true">5</span>
            <strong>${AI_ACCELERATED_COPY.howWeWork.stages[4].heading}</strong>
            <p>${AI_ACCELERATED_COPY.howWeWork.stages[4].description}</p>
          </li>
        </ol>
      </div>
    `;

    initProcessSteps();

    deliverablesSection.classList.add('deliverables-section-engineering');
    deliverablesSection.innerHTML = `
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
        <article class="engineering-build-column">
          <h3>${AI_ACCELERATED_COPY.whatWeBuild.columns[0].heading}</h3>
          <ul class="engineering-build-list">
            <li>${AI_ACCELERATED_COPY.whatWeBuild.columns[0].bullets[0]}</li>
            <li>${AI_ACCELERATED_COPY.whatWeBuild.columns[0].bullets[1]}</li>
            <li>${AI_ACCELERATED_COPY.whatWeBuild.columns[0].bullets[2]}</li>
            <li>${AI_ACCELERATED_COPY.whatWeBuild.columns[0].bullets[3]}</li>
            <li>${AI_ACCELERATED_COPY.whatWeBuild.columns[0].bullets[4]}</li>
          </ul>
        </article>
        <article class="engineering-build-column">
          <h3>${AI_ACCELERATED_COPY.whatWeBuild.columns[1].heading}</h3>
          <ul class="engineering-build-list">
            <li>${AI_ACCELERATED_COPY.whatWeBuild.columns[1].bullets[0]}</li>
            <li>${AI_ACCELERATED_COPY.whatWeBuild.columns[1].bullets[1]}</li>
            <li>${AI_ACCELERATED_COPY.whatWeBuild.columns[1].bullets[2]}</li>
            <li>${AI_ACCELERATED_COPY.whatWeBuild.columns[1].bullets[3]}</li>
          </ul>
        </article>
      </div>

      <div class="engineering-build-divider" data-animate></div>

      <div class="engineering-build-footer" data-animate>
        <span class="engineering-build-kicker">${AI_ACCELERATED_COPY.whatWeBuild.deliveryKicker}</span>
        <div class="engineering-build-cards">
          <article class="engineering-build-card">
            <h3>${AI_ACCELERATED_COPY.whatWeBuild.deliveryCards[0].heading}</h3>
            <p>
              ${AI_ACCELERATED_COPY.whatWeBuild.deliveryCards[0].body}
            </p>
          </article>
          <article class="engineering-build-card">
            <h3>${AI_ACCELERATED_COPY.whatWeBuild.deliveryCards[1].heading}</h3>
            <p>
              ${AI_ACCELERATED_COPY.whatWeBuild.deliveryCards[1].body}
            </p>
          </article>
          <article class="engineering-build-card">
            <h3>${AI_ACCELERATED_COPY.whatWeBuild.deliveryCards[2].heading}</h3>
            <p>
              ${AI_ACCELERATED_COPY.whatWeBuild.deliveryCards[2].body}
            </p>
          </article>
        </div>
      </div>
    `;

    roadmapSection.classList.add('roadmap-section-engineering');
    roadmapSection.innerHTML = `
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
        <article class="engineering-roadmap-card">
          <h3>${AI_ACCELERATED_COPY.howWeBuild.cards[0].heading}</h3>
          <p>
            ${AI_ACCELERATED_COPY.howWeBuild.cards[0].body}
          </p>
          <span class="engineering-roadmap-pill">${AI_ACCELERATED_COPY.howWeBuild.cards[0].pill}</span>
        </article>
        <article class="engineering-roadmap-card">
          <h3>${AI_ACCELERATED_COPY.howWeBuild.cards[1].heading}</h3>
          <p>
            ${AI_ACCELERATED_COPY.howWeBuild.cards[1].body}
          </p>
          <span class="engineering-roadmap-pill">${AI_ACCELERATED_COPY.howWeBuild.cards[1].pill}</span>
        </article>
        <article class="engineering-roadmap-card">
          <h3>${AI_ACCELERATED_COPY.howWeBuild.cards[2].heading}</h3>
          <p>
            ${AI_ACCELERATED_COPY.howWeBuild.cards[2].body}
          </p>
          <span class="engineering-roadmap-pill">${AI_ACCELERATED_COPY.howWeBuild.cards[2].pill}</span>
        </article>
      </div>
    `;
    applyAIAcceleratedPageCopy();
    return;
  }

  if (mode === 'ai-powered-legacy-modernisation') {
    applyLegacyModernisationTextOverrides();
    section.classList.add('domains-section-process');
    kicker.textContent = 'How We Work';
    title.innerHTML = '<em>Six Phases</em><span>Every rule traced end to end</span>';
    summary.textContent =
      "We don't rewrite systems from a requirements document. We extract the actual logic from the running system, reconstruct it in a modern stack.";

    content.innerHTML = `
      <div class="process-grid">
        <ol class="process-flow process-flow-six" aria-label="Legacy modernisation process">
          <li class="process-flow-item">
            <span class="process-flow-index" aria-hidden="true">1</span>
            <strong>Extract</strong>
            <p>Parse source code, stored procedures, configs, and runtime behaviour into a structured knowledge base</p>
          </li>
          <li class="process-flow-item">
            <span class="process-flow-index" aria-hidden="true">2</span>
            <strong>Model</strong>
            <p>Map extracted business rules, dependencies, and data flows. Validate with SMEs to catch undocumented behaviour</p>
          </li>
          <li class="process-flow-item">
            <span class="process-flow-index" aria-hidden="true">3</span>
            <strong>Decompose</strong>
            <p>Break the system into independent migration work units that can be built and tested in parallel</p>
          </li>
          <li class="process-flow-item">
            <span class="process-flow-index" aria-hidden="true">4</span>
            <strong>Generate</strong>
            <p>AI produces target code and test suites using pattern-driven templates, with business rules as context</p>
          </li>
          <li class="process-flow-item">
            <span class="process-flow-index" aria-hidden="true">5</span>
            <strong>Validate</strong>
            <p>Five levels of equivalence testing - unit, integration, business process, performance, and UAT</p>
          </li>
          <li class="process-flow-item">
            <span class="process-flow-index" aria-hidden="true">6</span>
            <strong>Roll out</strong>
            <p>Phased deployment with rollback triggers, dual-run comparison, and hypercare monitoring</p>
          </li>
        </ol>
      </div>
    `;

    initProcessSteps();

    deliverablesSection.classList.add('deliverables-section-engineering');
    deliverablesSection.innerHTML = `
      <div class="section-head section-head-dark" data-animate>
        <div class="section-title">
          <span class="section-kicker">What We Build</span>
          <h2>
            <span>Platform modernisation</span>
            <em>for regulated fintechs</em>
          </h2>
        </div>
        <p>
          We work with the kinds of legacy systems fintech companies actually run.
        </p>
      </div>

      <div class="engineering-build-grid" data-animate>
        <article class="engineering-build-column">
          <h3>Migration patterns</h3>
          <ul class="engineering-build-list">
            <li>Language and framework migration (e.g., .NET Framework to .NET Core, AngularJS to React)</li>
            <li>Platform migration - on-prem to cloud-native, monolith to microservices</li>
            <li>Database migration - Oracle to PostgreSQL, SQL Server to Aurora</li>
            <li>Integration modernisation - SOAP to REST, point-to-point to event-driven</li>
            <li>UI modernisation - thick client to web, legacy frontend to modern SPA</li>
          </ul>
        </article>
        <article class="engineering-build-column">
          <h3>Systems we understand from the inside</h3>
          <ul class="engineering-build-list">
            <li>Card issuing and programme management platforms</li>
            <li>Payment processing and authorisation engines</li>
            <li>Reconciliation and settlement workflows</li>
            <li>Scheme integration and certification layers</li>
            <li>Back-office operations and reporting systems</li>
          </ul>
        </article>
      </div>

      <div class="engineering-build-divider" data-animate></div>

      <div class="engineering-build-footer" data-animate>
        <span class="engineering-build-kicker">WHAT MAKES IT FASTER</span>
        <div class="engineering-build-cards">
          <article class="engineering-build-card">
            <h3>Automated extraction, not manual discovery</h3>
            <p>
              AI agents parse your codebase, stored procedures, and runtime behaviour to build a structured knowledge base. What traditionally takes months of SME interviews happens in weeks.
            </p>
          </article>
          <article class="engineering-build-card">
            <h3>Parallel work units, not sequential phases</h3>
            <p>
              The system is decomposed into independent migration units that can be built, tested, and deployed in parallel. Five teams working simultaneously instead of one team working sequentially.
            </p>
          </article>
          <article class="engineering-build-card">
            <h3>Proven equivalence, not hopeful testing</h3>
            <p>
              We run the legacy and migrated systems side by side on the same inputs and compare outputs. No release happens without proven behavioural equivalence across all business scenarios.
            </p>
          </article>
        </div>
      </div>
    `;

    roadmapSection.classList.add('roadmap-section-legacy');
    roadmapSection.innerHTML = `
      <div class="section-head" data-animate>
        <div class="section-title">
          <span class="section-kicker">How We Build</span>
          <h2>
            <span>A modern platform</span>
            <em>not just a rewrite</em>
          </h2>
        </div>
        <p>
          The goal isn't just to move code from one language to another. It's to end up with a platform that's cheaper to maintain faster.
        </p>
      </div>

      <div class="roadmap-grid" data-animate>
        <article class="roadmap-card">
          <h3>Faster feature delivery</h3>
          <p>
            Once migration completes, your engineering team can ship new features in weeks instead of months. The modern stack removes the constraints that made every change expensive.
          </p>
          <span class="roadmap-phase">POST-MIGRATION VELOCITY</span>
        </article>
        <article class="roadmap-card">
          <h3>Lower maintenance costs</h3>
          <p>
            Eliminate the premium you're paying for engineers who can work on legacy technology. Modern stacks have larger talent pools, better tooling, and lower operational overhead.
          </p>
          <span class="roadmap-phase">REDUCED SME DEPENDENCY</span>
        </article>
        <article class="roadmap-card">
          <h3>Zero logic loss</h3>
          <p>
            Every business rule is traced from the legacy system through extraction, generation, and validation. A complete traceability matrix is maintained throughout and delivered at the end.
          </p>
          <span class="roadmap-phase">FULL AUDIT TRAIL</span>
        </article>
      </div>
    `;
    return;
  }

  if (mode === 'intelligent-operations') {
    section.classList.add('domains-section-operations');
    kicker.textContent = 'What We Run';
    title.innerHTML = '<em>Six Operational Domains</em><span>One Team</span>';
    summary.textContent =
      "We don't just monitor dashboards. We run the full back-office — from real-time transaction monitoring through to dispute resolution.";

    content.innerHTML = `
      <article class="domain-card">
        <h3>Transaction monitoring and uptime</h3>
        <p>24×7 service monitoring with alerting and escalation. Dashboard monitoring, investigation of alerts, immediate escalation per defined runbooks. Tools: Coralogix, Datadog, NewRelic, CloudWatch, PagerDuty.</p>
      </article>
      <article class="domain-card">
        <h3>Fraud and risk handling</h3>
        <p>Real-time fraud detection with rule-based engines and ML models. Fraud queues, block/unblock workflows, integration with card controls and 3DS alerts. Prevention strategies and ongoing rule tuning.</p>
      </article>
      <article class="domain-card">
        <h3>Customer and cardholder support</h3>
        <p>L1 through L3 support across voice, chat, email, and in-app channels. Inquiry handling, card status updates, dispute assistance, and social media monitoring. Feedback loop to product and analytics.</p>
      </article>
      <article class="domain-card">
        <h3>Disputes and chargebacks</h3>
        <p>Full lifecycle chargeback management — rule-based tagging, document workflows, evidence gathering, and response generation. SLA tracking and Visa/Mastercard scheme alignment.</p>
      </article>
      <article class="domain-card">
        <h3>Reporting and reconciliation</h3>
        <p>Daily reconciliation of transactions, settlements, and chargebacks. Exception logs, scheduled pipelines for audit-ready data, and integration with BI tools like Power BI.</p>
      </article>
      <article class="domain-card">
        <h3>Onboarding and implementation</h3>
        <p>Platform onboarding for new clients. Merchant setup, KYC review, operations playbook creation, and weekly/monthly reporting. Secure infrastructure with role-based access.</p>
      </article>
    `;

    applyIntelligentOperationsTextOverrides();
  }
};

const resolveToSiteHref = (href) => {
  if (href === '#about') return 'about.html';
  if (href === '#services') return 'services.html';
  if (href.startsWith('#')) return `index.html${href}`;
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
    href: link.label === 'Services' ? 'services.html' : resolveToSiteHref(link.href),
  })),
});

const initServicesPage = async () => {
  initNavToggle();
  document
    .querySelector('[data-service-trusted-logos]')
    ?.classList.add('logo-marquee', 'logo-marquee-light');
  renderLogoMarquee('[data-service-trusted-logos]', TRUSTED_LOGOS);
  applyServiceMode();
  if (getServiceMode() === 'ai-accelerated-fintech-engineering') {
    applyAIAcceleratedPageCopy();
  }
  initScrollAnimations();

  try {
    const content = await loadContent();
    renderNav(buildNav(content.nav));
    renderFooter(buildFooterLinks(content.footer));
    if (getServiceMode() === 'ai-accelerated-fintech-engineering') {
      applyAIAcceleratedPageCopy();
    }
  } catch (error) {
    console.error('Failed to load shared service page content', error);
    if (window.DEFAULT_CONTENT?.nav) renderNav(buildNav(window.DEFAULT_CONTENT.nav));
    if (window.DEFAULT_CONTENT?.footer) {
      renderFooter(buildFooterLinks(window.DEFAULT_CONTENT.footer));
    }
    if (getServiceMode() === 'ai-accelerated-fintech-engineering') {
      applyAIAcceleratedPageCopy();
    }
  }
};

initServicesPage();

window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    initScrollAnimations();
  }
});
