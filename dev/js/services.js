import { initScrollAnimations } from './Home scenes/components/animations.js';
import { loadContent } from './Home scenes/data/loadContent.js';
import { renderFooter } from './Home scenes/sections/footer.js';
import { renderLogoMarquee } from './Home scenes/sections/logoMarquee.js';
import { initNavToggle, renderNav } from './Home scenes/sections/nav.js';
import { initEmailCapture } from './Home scenes/components/email-capture.js';
import { firebaseConfig } from './firebase-config.js';

const _pageCache = {};

async function fetchPageContent(path) {
  if (_pageCache[path] !== undefined) return _pageCache[path];
  try {
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js');
    const { getDatabase, ref, get } = await import('https://www.gstatic.com/firebasejs/11.1.0/firebase-database.js');
    const app = initializeApp(firebaseConfig, 'services-reader');
    const db = getDatabase(app);
    const snapshot = await get(ref(db, path));
    _pageCache[path] = snapshot.exists() ? snapshot.val() : null;
  } catch (e) {
    console.warn(`Firebase fetch failed for ${path}`, e);
    _pageCache[path] = null;
  }
  return _pageCache[path];
}

let _firebaseContent = null;
let _firebaseFetched = false;

async function fetchFirebaseContent() {
  if (_firebaseFetched) return _firebaseContent;
  _firebaseFetched = true;
  try {
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js');
    const { getDatabase, ref, get } = await import('https://www.gstatic.com/firebasejs/11.1.0/firebase-database.js');
    const app = initializeApp(firebaseConfig, 'services-reader');
    const db = getDatabase(app);
    const snapshot = await get(ref(db, 'content'));
    if (snapshot.exists()) {
      _firebaseContent = snapshot.val();
    }
  } catch (e) {
    console.warn('Firebase fetch failed, using fallback data', e);
  }
  return _firebaseContent;
}

function deepStripTags(obj) {
  if (typeof obj === 'string') return stripTags(obj);
  if (Array.isArray(obj)) return obj.map(deepStripTags);
  if (obj && typeof obj === 'object') {
    const out = {};
    for (const k of Object.keys(obj)) out[k] = deepStripTags(obj[k]);
    return out;
  }
  return obj;
}

function getSection(fbContent, key, fallback) {
  const section = fbContent?.[key];
  if (!section) return fallback;
  const merged = { ...fallback };
  for (const k of Object.keys(fallback)) {
    if (section[k] !== undefined && section[k] !== null) {
      let val = section[k];
      // Normalize Firebase objects back to arrays
      if (Array.isArray(fallback[k]) && !Array.isArray(val)) {
        val = Object.values(val);
      }
      // Deep-normalize columns bullets
      if (k === 'columns' && Array.isArray(val)) {
        val = val.map(col => ({
          heading: col.heading || '',
          bullets: (Array.isArray(col.bullets) ? col.bullets : Object.values(col.bullets || {})).map(b => ({
            icon: b.icon || null,
            text: b.text || '',
          })),
        }));
      }
      merged[k] = val;
    }
  }
  return deepStripTags(merged);
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
      'We build card programmes, payment engines, and issuing platforms for regulated fintechs. Our teams use AI tooling to cut delivery timelines in half',
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
          { icon: null, text: 'Card issuing and programme management' },
          { icon: null, text: 'Authorisation and payment processing engines' },
          { icon: null, text: 'Visa and Mastercard scheme integrations' },
          { icon: null, text: 'Tokenisation and digital wallet enablement' },
          { icon: null, text: 'Open banking and embedded finance APIs' },
        ],
      },
      {
        heading: 'Platform Architecture',
        bullets: [
          { icon: null, text: 'API-first microservices for composability' },
          { icon: null, text: 'Event-driven workflows for real-time processing' },
          { icon: null, text: 'Multi-tenant design for programme managers' },
          { icon: null, text: 'Zero-trust partner integrations' },
        ],
      },
      {
        heading: 'Security & Compliance',
        bullets: [
          { icon: null, text: 'PCI DSS Level 1 certified infrastructure' },
          { icon: null, text: 'Real-time fraud detection and prevention' },
          { icon: null, text: 'KYC/AML screening and monitoring' },
          { icon: null, text: 'GDPR and data residency controls' },
        ],
      },
      {
        heading: 'Integration & Analytics',
        bullets: [
          { icon: null, text: 'RESTful and GraphQL API gateway' },
          { icon: null, text: 'Webhook-based event notifications' },
          { icon: null, text: 'Real-time transaction dashboards' },
          { icon: null, text: 'Custom reporting and data exports' },
        ],
      },
      {
        heading: 'Operations & Monitoring',
        bullets: [
          { icon: null, text: '24/7 incident response and escalation' },
          { icon: null, text: 'Automated alerting and anomaly detection' },
          { icon: null, text: 'SLA tracking and uptime reporting' },
          { icon: null, text: 'Capacity planning and load management' },
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
    title: ["Why Fintechs", 'Choose Panasa'],
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

/**
 * Allowed tags and attributes for the HTML sanitizer.
 * Only these elements survive; everything else is stripped.
 */
const SAFE_TAGS = new Set([
  'div', 'span', 'em', 'strong', 'p', 'h2', 'h3', 'ul', 'ol', 'li',
  'article', 'a', 'section', 'br', 'img',
]);
const SAFE_ATTRS = new Set([
  'class', 'aria-label', 'aria-hidden', 'data-animate', 'data-process-item',
  'data-process-step', 'data-process-panel', 'href', 'src', 'alt',
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

const stripTags = (str) => {
  if (!str || typeof str !== 'string' || !str.includes('<')) return str || '';
  const d = document.createElement('div');
  d.innerHTML = str;
  return d.textContent || '';
};

const setText = (node, text) => {
  if (node && typeof text === 'string') node.textContent = stripTags(text);
};

const applyAIAcceleratedPageCopy = async () => {
  const fbContent = await fetchFirebaseContent();
  const copy = {
    hero: getSection(fbContent, 'hero', AI_ACCELERATED_COPY.hero),
    challenge: getSection(fbContent, 'challenge', AI_ACCELERATED_COPY.challenge),
    why: getSection(fbContent, 'why', AI_ACCELERATED_COPY.why),
    fit: getSection(fbContent, 'fit', AI_ACCELERATED_COPY.fit),
    footerCta: getSection(fbContent, 'footerCta', AI_ACCELERATED_COPY.footerCta),
  };

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
  const fromParam = params.get('service');
  if (fromParam) return fromParam;

  const path = window.location.pathname;
  if (path.includes('ai-governance')) return 'ai-governance';
  if (path.includes('intelligent-operations')) return 'intelligent-operations';
  if (path.includes('ai-powered-legacy-modernisation')) return 'ai-powered-legacy-modernisation';
  return 'ai-accelerated-fintech-engineering';
};

const applyIntelligentOperationsTextOverrides = async () => {
  const fbRaw = await fetchPageContent('pages/intelligentOperations');
  const fb = fbRaw ? deepStripTags(fbRaw) : null;
  const h = fb?.hero || {};
  const hero = document.querySelector('.service-hero');
  if (hero) {
    const heroPill = hero.querySelector('.pill');
    const heroTitle = hero.querySelector('h1');
    const heroSummary = hero.querySelector('.service-hero-copy p');
    const heroActions = hero.querySelectorAll('.hero-action-label');
    const trustKicker = hero.querySelector('.trusted-kicker');
    const heroStatCards = hero.querySelectorAll('.hero-stat-card');

    if (heroPill) heroPill.textContent = h.pill || 'INTELLIGENT OPERATIONS';
    if (heroTitle) {
      const t = h.title || ['Fintech operations that scale', 'without scaling headcount'];
      const ta = Array.isArray(t) ? t : Object.values(t);
      setSafeHTML(heroTitle, `<span>${ta[0]}</span><em>${ta[1]}</em>`);
    }
    if (heroSummary) heroSummary.textContent = h.subtitle || 'Transaction volumes double. Chargebacks, rules change quarterly. Your clients expect sub-hour response times around the clock.';
    if (heroActions[0]) heroActions[0].textContent = h.primaryCta || 'Talk to our team';
    if (heroActions[1]) heroActions[1].textContent = h.secondaryCta || 'View Case Studies';
    if (trustKicker) trustKicker.textContent = h.trustedKicker || 'TRUSTED BY HIGH-GROWTH FINTECHS';

    const heroStats = Array.isArray(h.stats) ? h.stats : (h.stats ? Object.values(h.stats) : [
      { value: '99.99%', label: 'System uptime maintained' },
      { value: '<1hr', label: 'P1 incident response time' },
      { value: '30-50%', label: 'Cost reduction in-house' },
      { value: '800M+', label: 'Transactions managed' },
    ]);
    heroStatCards.forEach((card, index) => {
      const stat = heroStats[index];
      if (!stat) return;
      const value = card.querySelector('strong');
      const label = card.querySelector('span');
      if (value) value.textContent = stat.value;
      if (label) label.textContent = stat.label;
    });
  }

  const ch = fb?.challenge || {};
  const challenge = document.querySelector('.challenge-section');
  if (challenge) {
    const challengeKicker = challenge.querySelector('.section-kicker');
    const challengeTitle = challenge.querySelector('.section-title h2');
    const challengeSummary = challenge.querySelector('.section-head p');
    const challengeCards = challenge.querySelectorAll('.challenge-card');

    if (challengeKicker) challengeKicker.textContent = ch.kicker || 'The Problem';
    if (challengeTitle) {
      const ct = ch.title || ['Operations gets harder every', 'quarter and your team is already stretched'];
      const cta = Array.isArray(ct) ? ct : Object.values(ct);
      setSafeHTML(challengeTitle, `<span>${cta[0]}</span><span><em>${cta[1]}</em></span>`);
    }
    if (challengeSummary) challengeSummary.textContent = ch.summary || 'Transaction volumes go up. Chargeback rules change. New scheme mandates land.';

    const challengeCopy = Array.isArray(ch.cards) ? ch.cards : (ch.cards ? Object.values(ch.cards) : [
      { title: 'Support tickets spike, resolution slows', body: 'As your client base grows, so does the volume of inquiries, disputes, and technical issues. Without structured L1/L2/L3 tiers and proper escalation paths, everything bottlenecks at the same small team.' },
      { title: 'Reconciliation and reporting are manual', body: 'Settlements, chargebacks, scheme fees reconciled in spreadsheets, cross-checked by hand, and delivered late. One missed exception can cascade into regulatory reporting problems.' },
      { title: "Fraud slips through because nobody is watching at 2am", body: "Fraudsters don't work business hours. Without round-the-clock monitoring, rule-based detection, and a team that can act immediately, you find out about fraud from your clients - not your systems." },
    ]);

    challengeCards.forEach((card, index) => {
      const copy = challengeCopy[index];
      if (!copy) return;
      const title = card.querySelector('h3');
      const body = card.querySelector('p');
      if (title) title.textContent = copy.title;
      if (body) body.textContent = copy.body;
    });
  }

  const dom = fb?.domains || {};
  const domains = document.querySelector('.domains-section');
  if (domains) {
    const domainSummary = domains.querySelector('.section-head p');
    const domainCards = domains.querySelectorAll('.domain-card');

    if (domainSummary) domainSummary.textContent = dom.summary || "We don't just monitor dashboards. We run the full back-office - from real-time transaction monitoring through to dispute resolution.";

    const domainCopy = Array.isArray(dom.cards) ? dom.cards : (dom.cards ? Object.values(dom.cards) : [
      { heading: 'Transaction monitoring and uptime', body: '24x7 service monitoring with alerting and escalation. Dashboard monitoring, investigation of alerts, immediate escalation per defined runbooks. Tools: Coralogix, Datadog, NewRelic, CloudWatch, PagerDuty.' },
      { heading: 'Fraud and risk handling', body: 'Real-time fraud detection with rule-based engines and ML models. Fraud queues, block/unblock workflows, integration with card controls and 3DS alerts. Prevention strategies and ongoing rule tuning.' },
      { heading: 'Customer and cardholder support', body: 'L1 through L3 support across voice, chat, email, and in-app channels. Inquiry handling, card status updates, dispute assistance, and social media monitoring. Feedback loop to product and analytics.' },
      { heading: 'Disputes and chargebacks', body: 'Full lifecycle chargeback management - rule-based tagging, document workflows, evidence gathering, and response generation. SLA tracking and Visa/Mastercard scheme alignment.' },
      { heading: 'Reporting and reconciliation', body: 'Daily reconciliation of transactions, settlements, and chargebacks. Exception logs, scheduled pipelines for audit-ready data, and integration with BI tools like Power BI.' },
      { heading: 'Onboarding and implementation', body: 'Platform onboarding for new clients. Merchant setup, KYC review, operations playbook creation, and weekly/monthly reporting. Secure infrastructure with role-based access.' },
    ]);

    domainCards.forEach((card, index) => {
      const copy = domainCopy[index];
      if (!copy) return;
      const t = card.querySelector('h3');
      const b = card.querySelector('p');
      if (t) t.textContent = copy.heading || copy.title || '';
      if (b) b.textContent = copy.body || '';
    });
  }

  const deliverables = document.querySelector('.deliverables-section');
  if (deliverables) {
    deliverables.classList.add('deliverables-section-operations');
    setSafeHTML(deliverables, `
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
    `);
  }

  const roadmap = document.querySelector('.roadmap-section');
  if (roadmap) {
    roadmap.classList.add('roadmap-section-operations');
    setSafeHTML(roadmap, `
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
    `);
  }

  const w = fb?.why || {};
  const why = document.querySelector('.why-section');
  if (why) {
    const whyPill = why.querySelector('.section-heading-copy .pill');
    const whyTitle = why.querySelector('.section-heading-copy h2');
    const whySummary = why.querySelector('.section-title-split p');
    const whyCards = why.querySelectorAll('.feature-card');

    if (whyPill) whyPill.textContent = w.kicker || 'Why Panasa';
    if (whyTitle) {
      const wt = w.title || ['Why Fintechs', 'Choose Panasa'];
      const wta = Array.isArray(wt) ? wt : Object.values(wt);
      setSafeHTML(whyTitle, `${wta[0]} <span>${wta[1]}</span>`);
    }
    if (whySummary) whySummary.textContent = w.summary || 'What sets us apart in the fintech development landscape';

    const whyCopy = Array.isArray(w.cards) ? w.cards : (w.cards ? Object.values(w.cards) : [
      { heading: 'Payment Experts, Not Generalists', body: '20+ years building card platforms, not generic software. We speak authorization flows, 3DS, and scheme integrations fluently.' },
      { heading: 'Proven at scale', body: "Supporting platforms processing 10M+ transactions monthly. We've been there, scaled that." },
      { heading: 'Full-Stack Team', body: 'From strategy to 24x7 ops-no vendor juggling needed. One team, end-to-end ownership.' },
      { heading: 'Compliance-First Approach', body: 'ISO 27001 certified, PCI-DSS aligned, GDPR compliant. Built-in audit readiness from day one.' },
    ]);

    whyCards.forEach((card, index) => {
      const copy = whyCopy[index];
      if (!copy) return;
      const t = card.querySelector('h3');
      const b = card.querySelector('p');
      if (t) t.textContent = copy.heading || copy.title || '';
      if (b) b.textContent = copy.body || '';
    });
  }

  const f = fb?.fit || {};
  const fit = document.querySelector('.fit-section');
  if (fit) {
    const fitKicker = fit.querySelector('.section-kicker');
    const fitTitle = fit.querySelector('.section-title h2');
    const fitSummary = fit.querySelector('.section-head p');
    const fitItems = fit.querySelectorAll('.fit-item');
    const fitEngageKicker = fit.querySelector('.fit-engage-kicker');
    const fitCards = fit.querySelectorAll('.fit-card');

    if (fitKicker) fitKicker.textContent = f.kicker || 'Who This Is For';
    if (fitTitle) {
      const ft = f.title || ['Fintechs that need operations', 'to keep pace with growth'];
      const fta = Array.isArray(ft) ? ft : Object.values(ft);
      setSafeHTML(fitTitle, `<em>${fta[0]}</em><span>${fta[1]}</span>`);
    }
    if (fitSummary) fitSummary.textContent = f.summary || '';

    const fitBullets = Array.isArray(f.bullets) ? f.bullets : (f.bullets ? Object.values(f.bullets) : [
      'Issuer processors scaling transaction volumes and client count',
      'Card platforms where fraud and disputes are growing faster than headcount',
      "PSPs that need 24x7 monitoring they can't staff in-house",
      'Fintechs looking to reduce ops cost without reducing service quality',
    ]);
    fitItems.forEach((item, index) => { if (fitBullets[index]) item.textContent = fitBullets[index]; });

    if (fitEngageKicker) fitEngageKicker.textContent = f.engageKicker || 'How We Engage';
    const fitCardCopy = Array.isArray(f.engageCards) ? f.engageCards : (f.engageCards ? Object.values(f.engageCards) : [
      { heading: 'Managed services', body: 'full 24x7 ops with SLA-backed outcomes' },
      { heading: 'Team extension', body: 'embed ops specialists into your existing team' },
      { heading: 'Project-based', body: 'set up monitoring, fraud systems, or reconciliation pipelines' },
      { heading: 'Flex support', body: 'shared resources, 30-day rolling, scale when ready' },
    ]);
    fitCards.forEach((card, index) => {
      const copy = fitCardCopy[index];
      if (!copy) return;
      const t = card.querySelector('h3');
      const b = card.querySelector('p');
      if (t) t.textContent = copy.heading || copy.title || '';
      if (b) b.textContent = copy.body || '';
    });
  }
};

const applyLegacyModernisationTextOverrides = async () => {
  const fbRaw2 = await fetchPageContent('pages/legacyModernisation');
  const fb = fbRaw2 ? deepStripTags(fbRaw2) : null;
  const h = fb?.hero || {};
  const hero = document.querySelector('.service-hero');
  if (hero) {
    const heroPill = hero.querySelector('.pill');
    const heroTitle = hero.querySelector('h1');
    const heroSummary = hero.querySelector('.service-hero-copy p');
    const heroActions = hero.querySelectorAll('.hero-action-label');
    const heroActionLinks = hero.querySelectorAll('.hero-actions a');
    const trustKicker = hero.querySelector('.trusted-kicker');
    const heroStatCards = hero.querySelectorAll('.hero-stat-card');

    if (heroPill) heroPill.textContent = h.pill || 'AI POWERED LEGACY MODERNISATION';
    if (heroTitle) {
      const t = h.title || ['Modernise legacy platforms', 'without losing the logic'];
      const ta = Array.isArray(t) ? t : Object.values(t);
      setSafeHTML(heroTitle, `<span>${ta[0]}</span><em>${ta[1]}</em>`);
    }
    if (heroSummary) heroSummary.textContent = h.subtitle || 'Your legacy system works. The problem is nobody can change it quickly, maintain it cheaply, or explain how half of it functions.';
    if (heroActions[0]) heroActions[0].textContent = h.primaryCta || 'Talk to our team';
    if (heroActions[1]) heroActions[1].textContent = h.secondaryCta || 'View Case Studies';
    if (heroActionLinks[1]) heroActionLinks[1].setAttribute('href', 'index.html#case-studies');
    if (trustKicker) trustKicker.textContent = h.trustedKicker || 'TRUSTED BY HIGH-GROWTH FINTECHS';

    const heroStats = Array.isArray(h.stats) ? h.stats : (h.stats ? Object.values(h.stats) : [
      { value: '30-60%', label: 'Faster migration delivery' },
      { value: '60-75%', label: 'Shorter dev and review cycles' },
      { value: '2-3x', label: 'Engineer productivity uplift' },
      { value: '>90%', label: 'Business logic accuracy retained' },
    ]);
    heroStatCards.forEach((card, index) => {
      const stat = heroStats[index];
      if (!stat) return;
      const value = card.querySelector('strong');
      const label = card.querySelector('span');
      if (value) value.textContent = stat.value;
      if (label) label.textContent = stat.label;
    });
  }

  const ch = fb?.challenge || {};
  const challenge = document.querySelector('.challenge-section');
  if (challenge) {
    const challengeKicker = challenge.querySelector('.section-kicker');
    const challengeTitle = challenge.querySelector('.section-title h2');
    const challengeSummary = challenge.querySelector('.section-head p');
    const challengeCards = challenge.querySelectorAll('.challenge-card');

    if (challengeKicker) challengeKicker.textContent = ch.kicker || 'The Problem';
    if (challengeTitle) {
      const ct = ch.title || ['Legacy migration is', 'expensive, slow, and risky'];
      const cta = Array.isArray(ct) ? ct : Object.values(ct);
      setSafeHTML(challengeTitle, `<span>${cta[0]}</span><span><em>${cta[1]}</em></span>`);
    }
    if (challengeSummary) challengeSummary.textContent = ch.summary || 'Most migration projects run over budget and over time. The business logic that took years to build.';

    const challengeCopy = Array.isArray(ch.cards) ? ch.cards : (ch.cards ? Object.values(ch.cards) : [
      { title: 'Business logic is scattered and undocumented', body: 'Rules live in application code, database triggers, batch scripts, and tribal knowledge. When the people who built it leave, the understanding goes with them.' },
      { title: 'Traditional rewrites take too long and break things', body: "Eighteen-month migration timelines that slip to thirty months are common. By the time you finish, the target architecture is already dated - and you've introduced regressions the business discovers in production." },
      { title: 'The longer you wait, the more expensive it gets', body: 'Maintenance costs on legacy platforms compound year over year. The engineers who can work on them become rarer and more expensive. Meanwhile, new features are impossible to ship at any reasonable pace.' },
    ]);

    challengeCards.forEach((card, index) => {
      const copy = challengeCopy[index];
      if (!copy) return;
      const title = card.querySelector('h3');
      const body = card.querySelector('p');
      if (title) title.textContent = copy.title;
      if (body) body.textContent = copy.body;
    });
  }

  const f = fb?.fit || {};
  const fit = document.querySelector('.fit-section');
  if (fit) {
    const fitKicker = fit.querySelector('.section-kicker');
    const fitTitle = fit.querySelector('.section-title h2');
    const fitSummary = fit.querySelector('.section-head p');
    const fitItems = fit.querySelectorAll('.fit-item');
    const fitEngageKicker = fit.querySelector('.fit-engage-kicker');
    const fitCards = fit.querySelectorAll('.fit-card');

    if (fitKicker) fitKicker.textContent = f.kicker || 'Who This Is For';
    if (fitTitle) {
      const ft = f.title || ['Fintechs that need operations', 'to keep pace with growth'];
      const fta = Array.isArray(ft) ? ft : Object.values(ft);
      setSafeHTML(fitTitle, `<em>${fta[0]}</em><span>${fta[1]}</span>`);
    }
    if (fitSummary) fitSummary.textContent = f.summary || '';

    const fitBullets = Array.isArray(f.bullets) ? f.bullets : (f.bullets ? Object.values(f.bullets) : [
      'Issuer processors scaling transaction volumes and client count',
      "Card platforms where fraud and disputes are growing faster than headcount",
      "PSPs that need 24x7 monitoring they can't staff in-house",
      'Fintechs looking to reduce ops cost without reducing service quality',
    ]);
    fitItems.forEach((item, index) => { if (fitBullets[index]) item.textContent = fitBullets[index]; });

    if (fitEngageKicker) fitEngageKicker.textContent = f.engageKicker || 'How We Engage';
    const fitCardCopy = Array.isArray(f.engageCards) ? f.engageCards : (f.engageCards ? Object.values(f.engageCards) : [
      { heading: 'Managed services', body: 'full 24x7 ops with SLA-backed outcomes' },
      { heading: 'Team extension', body: 'embed ops specialists into your existing team' },
      { heading: 'Project-based', body: 'set up monitoring, fraud systems, or reconciliation pipelines' },
      { heading: 'Flex support', body: 'shared resources, 30-day rolling, scale when ready' },
    ]);
    fitCards.forEach((card, index) => {
      const copy = fitCardCopy[index];
      if (!copy) return;
      const t = card.querySelector('h3');
      const b = card.querySelector('p');
      if (t) t.textContent = copy.heading || copy.title || '';
      if (b) b.textContent = copy.body || '';
    });
  }
};

const applyServiceMode = async () => {
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
  if (heroActionLinks[1]) heroActionLinks[1].setAttribute('href', 'index.html#case-studies');

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
  if (mode === 'ai-governance') {
    roadmapSection.classList.add('roadmap-section-governance');
    // Apply Firebase content for AI Governance
    const govFbRaw = await fetchPageContent('pages/aiGovernance');
    const govFb = govFbRaw ? deepStripTags(govFbRaw) : null;
    if (govFb) {
      const gh = govFb.hero || {};
      const heroSection = document.querySelector('.service-hero');
      if (heroSection) {
        const pill = heroSection.querySelector('.pill');
        const h1 = heroSection.querySelector('h1');
        const p = heroSection.querySelector('.service-hero-copy p');
        const actions = heroSection.querySelectorAll('.hero-action-label');
        const trust = heroSection.querySelector('.trusted-kicker');
        const statCards = heroSection.querySelectorAll('.hero-stat-card');
        if (pill && gh.pill) pill.textContent = gh.pill;
        if (h1 && gh.title) { const t = Array.isArray(gh.title) ? gh.title : Object.values(gh.title); setSafeHTML(h1, `<span>${t[0]}</span><em>${t[1]}</em>`); }
        if (p && gh.subtitle) p.textContent = gh.subtitle;
        if (actions[0] && gh.primaryCta) actions[0].textContent = gh.primaryCta;
        if (actions[1] && gh.secondaryCta) actions[1].textContent = gh.secondaryCta;
        if (trust && gh.trustedKicker) trust.textContent = gh.trustedKicker;
        const stats = Array.isArray(gh.stats) ? gh.stats : (gh.stats ? Object.values(gh.stats) : []);
        stats.forEach((s, i) => { if (statCards[i]) { const v = statCards[i].querySelector('strong'); const l = statCards[i].querySelector('span'); if (v) v.textContent = s.value; if (l) l.textContent = s.label; } });
      }
      const gc = govFb.challenge || {};
      const challengeEl = document.querySelector('.challenge-section');
      if (challengeEl && (gc.kicker || gc.title || gc.summary || gc.cards)) {
        const ck = challengeEl.querySelector('.section-kicker');
        const ct = challengeEl.querySelector('.section-title h2');
        const cs = challengeEl.querySelector('.section-head p');
        const cc = challengeEl.querySelectorAll('.challenge-card');
        if (ck && gc.kicker) ck.textContent = gc.kicker;
        if (ct && gc.title) { const t = Array.isArray(gc.title) ? gc.title : Object.values(gc.title); setSafeHTML(ct, `<span>${t[0]}</span><span><em>${t[1]}</em></span>`); }
        if (cs && gc.summary) cs.textContent = gc.summary;
        const cards = Array.isArray(gc.cards) ? gc.cards : (gc.cards ? Object.values(gc.cards) : []);
        cards.forEach((c, i) => { if (!cc[i]) return; const tt = cc[i].querySelector('h3'); const bb = cc[i].querySelector('p'); if (tt) tt.textContent = c.title; if (bb) bb.textContent = c.body; });
      }
      const gw = govFb.why || {};
      const whyEl = document.querySelector('.why-section');
      if (whyEl && (gw.kicker || gw.cards)) {
        const wp = whyEl.querySelector('.section-heading-copy .pill');
        const wt = whyEl.querySelector('.section-heading-copy h2');
        const ws = whyEl.querySelector('.section-title-split p');
        const wc = whyEl.querySelectorAll('.feature-card');
        if (wp && gw.kicker) wp.textContent = gw.kicker;
        if (wt && gw.title) { const t = Array.isArray(gw.title) ? gw.title : Object.values(gw.title); setSafeHTML(wt, `${t[0]} <span>${t[1]}</span>`); }
        if (ws && gw.summary) ws.textContent = gw.summary;
        const cards = Array.isArray(gw.cards) ? gw.cards : (gw.cards ? Object.values(gw.cards) : []);
        cards.forEach((c, i) => { if (!wc[i]) return; const tt = wc[i].querySelector('h3'); const bb = wc[i].querySelector('p'); if (tt) tt.textContent = c.heading || ''; if (bb) bb.textContent = c.body || ''; });
      }
      const gf = govFb.fit || {};
      const fitEl = document.querySelector('.fit-section');
      if (fitEl && (gf.kicker || gf.bullets)) {
        const fk = fitEl.querySelector('.section-kicker');
        const ft = fitEl.querySelector('.section-title h2');
        const fi = fitEl.querySelectorAll('.fit-item');
        const fek = fitEl.querySelector('.fit-engage-kicker');
        const fc = fitEl.querySelectorAll('.fit-card');
        if (fk && gf.kicker) fk.textContent = gf.kicker;
        if (ft && gf.title) { const t = Array.isArray(gf.title) ? gf.title : Object.values(gf.title); setSafeHTML(ft, `<em>${t[0]}</em><span>${t[1]}</span>`); }
        const bullets = Array.isArray(gf.bullets) ? gf.bullets : (gf.bullets ? Object.values(gf.bullets) : []);
        bullets.forEach((b, i) => { if (fi[i]) fi[i].textContent = b; });
        if (fek && gf.engageKicker) fek.textContent = gf.engageKicker;
        const ecards = Array.isArray(gf.engageCards) ? gf.engageCards : (gf.engageCards ? Object.values(gf.engageCards) : []);
        ecards.forEach((c, i) => { if (!fc[i]) return; const tt = fc[i].querySelector('h3'); const bb = fc[i].querySelector('p'); if (tt) tt.textContent = c.heading || ''; if (bb) bb.textContent = c.body || ''; });
      }
    }
  }

  const fbContent = await fetchFirebaseContent();

  if (mode === 'ai-accelerated-fintech-engineering') {
    const howWeWork = getSection(fbContent, 'howWeWork', AI_ACCELERATED_COPY.howWeWork);
    section.classList.add('domains-section-process');
    kicker.textContent = howWeWork.kicker;
    setSafeHTML(title, `<em>${howWeWork.title[0]}</em><span>${howWeWork.title[1]}</span>`);
    summary.textContent = howWeWork.summary;

    const stages = Array.isArray(howWeWork.stages) ? howWeWork.stages : Object.values(howWeWork.stages || {});
    setSafeHTML(content, `
      <div class="process-grid">
        <ol class="process-flow" aria-label="Fintech engineering process">
          ${stages.map((s, i) => `
          <li class="process-flow-item">
            <span class="process-flow-index" aria-hidden="true">${i + 1}</span>
            <strong>${s.heading}</strong>
            <p>${s.description}</p>
          </li>`).join('')}
        </ol>
      </div>
    `);

    initProcessSteps();

    const whatWeBuild = getSection(fbContent, 'whatWeBuild', AI_ACCELERATED_COPY.whatWeBuild);
    const deliveryCards = Array.isArray(whatWeBuild.deliveryCards) ? whatWeBuild.deliveryCards : Object.values(whatWeBuild.deliveryCards || {});
    deliverablesSection.classList.add('deliverables-section-engineering');
    setSafeHTML(deliverablesSection, `
      <div class="section-head section-head-dark" data-animate>
        <div class="section-title">
          <span class="section-kicker">${whatWeBuild.kicker}</span>
          <h2>
            <em>${whatWeBuild.title[0]}</em>
            <span>${whatWeBuild.title[1]}</span>
          </h2>
        </div>
        <p>
          ${whatWeBuild.summary}
        </p>
      </div>

      <div class="engineering-build-grid" data-animate>
        ${whatWeBuild.columns.map(col => `
        <article class="engineering-build-column">
          <h3>${col.heading}</h3>
          <ul class="engineering-build-list">
            ${col.bullets.map(b => `<li${b.icon ? ' class="has-custom-icon"' : ''}>${b.icon ? `<img src="${b.icon}" alt="" class="bullet-icon">` : ''}${b.text}</li>`).join('')}
          </ul>
        </article>`).join('')}
      </div>

      <div class="engineering-build-divider" data-animate></div>

      <div class="engineering-build-footer" data-animate>
        <span class="engineering-build-kicker">${whatWeBuild.deliveryKicker}</span>
        <div class="engineering-build-cards">
          ${deliveryCards.map(c => `
          <article class="engineering-build-card">
            <h3>${c.heading}</h3>
            <p>${c.body}</p>
          </article>`).join('')}
        </div>
      </div>
    `);

    const howWeBuild = getSection(fbContent, 'howWeBuild', AI_ACCELERATED_COPY.howWeBuild);
    const hwbCards = Array.isArray(howWeBuild.cards) ? howWeBuild.cards : Object.values(howWeBuild.cards || {});
    roadmapSection.classList.add('roadmap-section-engineering');
    setSafeHTML(roadmapSection, `
      <div class="section-head" data-animate>
        <div class="section-title">
          <span class="section-kicker">${howWeBuild.kicker}</span>
          <h2>
            <em>${howWeBuild.title[0]}</em>
            <span>${howWeBuild.title[1]}</span>
          </h2>
        </div>
        <p>
          ${howWeBuild.summary}
        </p>
      </div>

      <div class="engineering-roadmap-grid" data-animate>
        ${hwbCards.map(c => `
        <article class="engineering-roadmap-card">
          <h3>${c.heading}</h3>
          <p>${c.body}</p>
          <span class="engineering-roadmap-pill">${c.pill}</span>
        </article>`).join('')}
      </div>
    `);
    await applyAIAcceleratedPageCopy();
    return;
  }

  if (mode === 'ai-powered-legacy-modernisation') {
    await applyLegacyModernisationTextOverrides();
    section.classList.add('domains-section-process');
    kicker.textContent = 'How We Work';
    setSafeHTML(title, '<em>Six Phases</em><span>Every rule traced end to end</span>');
    summary.textContent =
      "We don't rewrite systems from a requirements document. We extract the actual logic from the running system, reconstruct it in a modern stack.";

    setSafeHTML(content, `
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
    `);

    initProcessSteps();

    deliverablesSection.classList.add('deliverables-section-engineering');
    setSafeHTML(deliverablesSection, `
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
    `);

    roadmapSection.classList.add('roadmap-section-legacy');
    setSafeHTML(roadmapSection, `
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
    `);
    return;
  }

  if (mode === 'intelligent-operations') {
    section.classList.add('domains-section-operations');
    kicker.textContent = 'What We Run';
    setSafeHTML(title, '<em>Six Operational Domains</em><span>One Team</span>');
    summary.textContent =
      "We don't just monitor dashboards. We run the full back-office — from real-time transaction monitoring through to dispute resolution.";

    setSafeHTML(content, `
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
    `);

    await applyIntelligentOperationsTextOverrides();
  }
};

const resolveToSiteHref = (href) => {
  if (href === '#about') return 'about.html';
  if (href === '#services') return 'ai-accelerated-fintech-engineering.html';
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
  await applyServiceMode();
  if (getServiceMode() === 'ai-accelerated-fintech-engineering') {
    await applyAIAcceleratedPageCopy();
  }
  initScrollAnimations();

  initEmailCapture({
    promptHeading: 'Want the full services breakdown?',
    promptSubtext: 'We\'ll email you our detailed overview.',
    buttonLabel: 'Get overview',
    triggerPercent: 0.5,
    storageKey: 'panasa_email_services',
    crmDescription: 'Email capture: Services overview (Services page)',
  });

  // Override email capture from Firebase
  const ecFb = await fetchPageContent('content');
  const ec = ecFb?.emailCapture;
  if (ec) {
    const h = document.querySelector('.email-capture__heading');
    const s = document.querySelector('.email-capture__subtext');
    const b = document.querySelector('.email-capture__form button[type="submit"]');
    if (h && ec.promptHeading) h.textContent = ec.promptHeading;
    if (s && ec.promptSubtext) s.textContent = ec.promptSubtext;
    if (b && ec.buttonLabel) b.textContent = ec.buttonLabel;
  }

  try {
    const content = await loadContent();
    renderNav(buildNav(content.nav));
    renderFooter(buildFooterLinks(content.footer));
    if (getServiceMode() === 'ai-accelerated-fintech-engineering') {
      await applyAIAcceleratedPageCopy();
    }
  } catch (error) {
    console.error('Failed to load shared service page content', error);
    if (window.DEFAULT_CONTENT?.nav) renderNav(buildNav(window.DEFAULT_CONTENT.nav));
    if (window.DEFAULT_CONTENT?.footer) {
      renderFooter(buildFooterLinks(window.DEFAULT_CONTENT.footer));
    }
    if (getServiceMode() === 'ai-accelerated-fintech-engineering') {
      await applyAIAcceleratedPageCopy();
    }
  }
};

initServicesPage();

window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    initScrollAnimations();
  }
});
