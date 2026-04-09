import { db, auth } from './firebase-config.js';
import {
  ref,
  get,
  set,
} from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-database.js';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js';

/* ═══════════════════════════════════════════════
   PAGE CONFIGS — defines sections per page
   ═══════════════════════════════════════════════ */

// ── AI Accelerated Engineering defaults ──

const AI_ENG_DEFAULTS = {
  hero: { pill: 'AI Accelerated Fintech Engineering', title: ['Ship fintech', 'platforms faster'], subtitle: 'We build card programmes, payment engines, and issuing platforms for regulated fintechs. Our teams use AI tooling to cut delivery timelines in half', primaryCta: 'Talk to our team', secondaryCta: 'View Case Studies', trustedKicker: 'Trusted by High-Growth Fintechs', stats: [{ value: '50%', label: 'Faster delivery vs traditional teams' }, { value: '75%', label: 'Shorter code review cycles' }, { value: '3x', label: 'Engineer productivity with AI tooling' }, { value: '800M+', label: 'Transactions managed across clients' }] },
  challenge: { kicker: 'The Problem', title: ['Fintech teams are stuck', 'maintaining instead of building'], summary: 'Most engineering organisations we work with are spending 60-70% of their time on maintenance and compliance remediation', cards: [{ number: '01', title: 'Scale breaks manual processes', body: 'What works at a million transactions falls apart at ten million. Exception handling, edge cases, and reconciliation gaps multiply faster than teams can patch them.' }, { number: '02', title: 'Compliance slows every release', body: 'PCI recertification, scheme mandate updates, FCA reporting changes — each one adds weeks to your release cycle when bolted on at the end instead of built in from the start.' }, { number: '03', title: 'Tech debt compounds quietly', body: 'Legacy code written three years ago now consumes most of your sprint capacity. New features get squeezed into whatever time remains, and quality suffers.' }] },
  howWeWork: { kicker: 'How We Work', title: ['Five stages', 'continuous feedback'], summary: "No need to hire, train, and manage multiple teams. We're your end-to-end fintech engineering and operations partner.", stages: [{ heading: 'Scope', description: 'Problem framing, acceptance criteria, scheme rules mapped to requirements' }, { heading: 'Prototype', description: 'Competing approaches built on separate branches. Working code in days, not weeks' }, { heading: 'Validate', description: 'Automated linting, security scans, type checks. Issues caught and fixed before review' }, { heading: 'Test', description: 'AI-generated test suites from acceptance criteria. 80%+ coverage enforced at the pipeline level' }, { heading: 'Deploy', description: 'Progressive rollout with canary releases, automated rollback triggers, and full observability' }] },
  whatWeBuild: { kicker: 'What We Build', title: ['Payment Infrastructure', 'for Regulated Platforms'], summary: 'Core payment and platform capabilities delivered for issuers, programme managers, and embedded finance products.', columns: [{ heading: 'Payment & Issuing', bullets: [{ icon: null, text: 'Card issuing and programme management' }, { icon: null, text: 'Authorisation and payment processing engines' }, { icon: null, text: 'Visa and Mastercard scheme integrations' }, { icon: null, text: 'Tokenisation and digital wallet enablement' }, { icon: null, text: 'Open banking and embedded finance APIs' }] }, { heading: 'Platform Architecture', bullets: [{ icon: null, text: 'API-first microservices for composability' }, { icon: null, text: 'Event-driven workflows for real-time processing' }, { icon: null, text: 'Multi-tenant design for programme managers' }, { icon: null, text: 'Zero-trust partner integrations' }] }, { heading: 'Security & Compliance', bullets: [{ icon: null, text: 'PCI DSS Level 1 certified infrastructure' }, { icon: null, text: 'Real-time fraud detection and prevention' }, { icon: null, text: 'KYC/AML screening and monitoring' }, { icon: null, text: 'GDPR and data residency controls' }] }, { heading: 'Integration & Analytics', bullets: [{ icon: null, text: 'RESTful and GraphQL API gateway' }, { icon: null, text: 'Webhook-based event notifications' }, { icon: null, text: 'Real-time transaction dashboards' }, { icon: null, text: 'Custom reporting and data exports' }] }, { heading: 'Operations & Monitoring', bullets: [{ icon: null, text: '24/7 incident response and escalation' }, { icon: null, text: 'Automated alerting and anomaly detection' }, { icon: null, text: 'SLA tracking and uptime reporting' }, { icon: null, text: 'Capacity planning and load management' }] }], deliveryKicker: 'What Makes Delivery Faster', deliveryCards: [{ heading: 'Specs generated from requirements', body: 'Business requirements become implementation-ready specs with automated consistency checks across service boundaries. Less ambiguity, fewer rounds of clarification.' }, { heading: 'Tests written alongside features', body: "Test suites are generated in parallel with code, not queued after it. The QA bottleneck that delays most fintech releases doesn't exist in our process." }, { heading: 'Scheme playbooks, not guesswork', body: 'We maintain runbooks for Visa and Mastercard certification, partner onboarding sequences, and compliance checkpoints. Repeatable process, fewer surprises.' }] },
  howWeBuild: { kicker: 'How We Build', title: ['Production-grade', 'from sprint one'], summary: "We don't build prototypes that need to be rebuilt for production. Every platform is architected for the transaction", cards: [{ heading: 'High availability', body: 'Multi-region deployment, failover routing, and observability stacks that give your ops team clear signal not noise at any transaction volume.', pill: '99.99% UPTIME' }, { heading: 'Operational visibility', body: 'Real-time dashboards, immutable audit logs, and traceable workflows. When something goes wrong at 2am, your on-call team can diagnose it in minutes.', pill: 'FULL TRACEABILITY' }, { heading: 'Compliance from day one', body: 'PCI DSS controls, FCA reporting hooks, and GDPR data handling designed into the architecture not discovered as gaps during your next audit.', pill: 'PCI & FCA READY' }] },
  why: { kicker: 'Why Panasa', title: ["Why Fintechs", 'Choose Panasa'], summary: 'What sets us apart in the fintech development landscape', cards: [{ heading: 'Payment Experts, Not Generalists', body: '20+ years building card platforms, not generic software. We speak authorization flows, 3DS, and scheme integrations fluently.' }, { heading: 'Proven at scale', body: "Supporting platforms processing 10M+ transactions monthly. We've been there, scaled that." }, { heading: 'Full-Stack Team', body: 'From strategy to 24x7 ops-no vendor juggling needed. One team, end-to-end ownership.' }, { heading: 'Compliance-First Approach', body: 'ISO 27001 certified, PCI-DSS aligned, GDPR compliant. Built-in audit readiness from day one.' }] },
  fit: { kicker: 'Who This Is For', title: ['Built for regulated', 'high-growth fintechs'], summary: '', bullets: ['Issuer processors scaling card programme volume', 'PSPs and acquirers modernising legacy stacks', 'Neobanks expanding into new markets and schemes', 'BaaS providers managing complex partner integrations'], engageKicker: 'How We Engage', engageCards: [{ heading: 'Engineering squads', body: 'month-to-month, flexible' }, { heading: 'Project-based', body: 'fixed scope, milestone billing' }, { heading: 'Managed services', body: '24x7, SLA-backed' }, { heading: 'GCC delivery', body: 'your own offshore hub' }] },
  footerCta: { title: 'Ready to Build Your Card Platform' },
};

const AI_ENG_SECTIONS = [
  { key: 'hero', label: 'Hero Section', fields: [{ key: 'pill', label: 'Pill text', type: 'text' }, { key: 'title', label: 'Title (line 1 | line 2)', type: 'title' }, { key: 'subtitle', label: 'Subtitle', type: 'textarea' }, { key: 'primaryCta', label: 'Primary CTA', type: 'text' }, { key: 'secondaryCta', label: 'Secondary CTA', type: 'text' }, { key: 'trustedKicker', label: 'Trusted kicker', type: 'text' }, { key: 'stats', label: 'Stats', type: 'stats' }] },
  { key: 'challenge', label: 'The Problem', fields: [{ key: 'kicker', label: 'Kicker', type: 'text' }, { key: 'title', label: 'Title (line 1 | line 2)', type: 'title' }, { key: 'summary', label: 'Summary', type: 'textarea' }, { key: 'cards', label: 'Problem cards', type: 'numbered-cards' }] },
  { key: 'howWeWork', label: 'How We Work', fields: [{ key: 'kicker', label: 'Kicker', type: 'text' }, { key: 'title', label: 'Title (line 1 | line 2)', type: 'title' }, { key: 'summary', label: 'Summary', type: 'textarea' }, { key: 'stages', label: 'Process stages', type: 'stages' }] },
  { key: 'whatWeBuild', label: 'What We Build', fields: [{ key: 'kicker', label: 'Kicker', type: 'text' }, { key: 'title', label: 'Title (line 1 | line 2)', type: 'title' }, { key: 'summary', label: 'Summary', type: 'textarea' }, { key: 'columns', label: 'Capability columns', type: 'columns' }, { key: 'deliveryKicker', label: 'Delivery kicker', type: 'text' }, { key: 'deliveryCards', label: 'Delivery cards', type: 'heading-body-cards' }] },
  { key: 'howWeBuild', label: 'How We Build', fields: [{ key: 'kicker', label: 'Kicker', type: 'text' }, { key: 'title', label: 'Title (line 1 | line 2)', type: 'title' }, { key: 'summary', label: 'Summary', type: 'textarea' }, { key: 'cards', label: 'Architecture cards', type: 'pill-cards' }] },
  { key: 'why', label: 'Why Panasa', fields: [{ key: 'kicker', label: 'Kicker', type: 'text' }, { key: 'title', label: 'Title (line 1 | line 2)', type: 'title' }, { key: 'summary', label: 'Summary', type: 'textarea' }, { key: 'cards', label: 'Reason cards', type: 'heading-body-cards' }] },
  { key: 'fit', label: 'Who This Is For', fields: [{ key: 'kicker', label: 'Kicker', type: 'text' }, { key: 'title', label: 'Title (line 1 | line 2)', type: 'title' }, { key: 'summary', label: 'Summary', type: 'textarea' }, { key: 'bullets', label: 'Audience bullets', type: 'string-list' }, { key: 'engageKicker', label: 'Engage kicker', type: 'text' }, { key: 'engageCards', label: 'Engagement models', type: 'heading-body-cards' }] },
  { key: 'footerCta', label: 'Footer CTA', fields: [{ key: 'title', label: 'CTA title', type: 'text' }] },
];

// ── Home Page defaults (loaded from content.json on first use) ──

let HOME_DEFAULTS = null;

async function getHomeDefaults() {
  if (HOME_DEFAULTS) return HOME_DEFAULTS;
  try {
    const res = await fetch('content/Home page/content.json');
    HOME_DEFAULTS = await res.json();
  } catch (e) {
    console.warn('Failed to load home content.json fallback', e);
    HOME_DEFAULTS = {};
  }
  return HOME_DEFAULTS;
}

const HOME_SECTIONS = [
  { key: 'meta', label: 'Meta / SEO', fields: [{ key: 'title', label: 'Page title', type: 'text' }, { key: 'description', label: 'Meta description', type: 'textarea' }] },
  { key: 'hero', label: 'Hero Section', fields: [{ key: 'pill', label: 'Pill text', type: 'text' }, { key: 'title', label: 'Title', type: 'text' }, { key: 'titleEmphasis', label: 'Title emphasis line', type: 'text' }, { key: 'subtitle', label: 'Subtitle', type: 'textarea' }, { key: 'trustedLabel', label: 'Trusted label', type: 'text' }] },
  { key: 'hero_ctas', label: 'Hero CTAs', parentKey: 'hero', fields: [{ key: 'primaryCta', label: 'Primary CTA', type: 'label-href' }, { key: 'secondaryCta', label: 'Secondary CTA', type: 'label-href' }] },
  { key: 'services', label: 'Services Section', fields: [{ key: 'title', label: 'Section title', type: 'text' }, { key: 'subtitle', label: 'Subtitle', type: 'textarea' }, { key: 'learnMoreLabel', label: 'Learn more label', type: 'text' }, { key: 'items', label: 'Service cards', type: 'service-cards' }] },
  { key: 'why', label: 'Why Section', fields: [{ key: 'title', label: 'Section title', type: 'text' }, { key: 'subtitle', label: 'Subtitle', type: 'textarea' }, { key: 'cards', label: 'Why cards', type: 'why-cards' }] },
  { key: 'caseStudies', label: 'Case Studies', fields: [{ key: 'title', label: 'Section title', type: 'text' }, { key: 'subtitle', label: 'Subtitle', type: 'textarea' }, { key: 'slides', label: 'Case study slides', type: 'case-slides' }] },
  { key: 'testimonials', label: 'Testimonials', fields: [{ key: 'title', label: 'Section title', type: 'text' }, { key: 'subtitle', label: 'Subtitle', type: 'textarea' }, { key: 'cards', label: 'Testimonial cards', type: 'testimonial-cards' }] },
  { key: 'engagement', label: 'Engagement Models', fields: [{ key: 'title', label: 'Section title', type: 'text' }, { key: 'subtitle', label: 'Subtitle', type: 'textarea' }, { key: 'note', label: 'Footer note', type: 'text' }, { key: 'items', label: 'Engagement models', type: 'engagement-cards' }, { key: 'growthPackages', label: 'Growth packages', type: 'growth-cards' }] },
  { key: 'footer', label: 'Footer', fields: [{ key: 'ctaTitle', label: 'CTA title', type: 'text' }, { key: 'ctaText', label: 'CTA text', type: 'textarea' }, { key: 'ctaButton', label: 'CTA button label', type: 'text' }, { key: 'brandText', label: 'Brand text', type: 'textarea' }, { key: 'email', label: 'Email', type: 'text' }, { key: 'phones', label: 'Phone numbers', type: 'string-list' }] },
];

// ── Page registry ──

const PAGES = {
  aiAcceleratedEngineering: { label: 'AI Accelerated Engineering', sections: AI_ENG_SECTIONS, defaults: AI_ENG_DEFAULTS, fbPath: 'content' },
  home: { label: 'Home Page', sections: HOME_SECTIONS, defaults: null, fbPath: 'pages/home' },
};

/* ═══════════════════════════════════════════════
   DOM references
   ═══════════════════════════════════════════════ */

const loginScreen = document.getElementById('login-screen');
const adminPanel = document.getElementById('admin-panel');
const loginForm = document.getElementById('login-form');
const loginEmail = document.getElementById('login-email');
const loginPassword = document.getElementById('login-password');
const loginError = document.getElementById('login-error');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const adminUser = document.getElementById('admin-user');
const pageSelect = document.getElementById('page-select');
const editorSections = document.getElementById('editor-sections');
const saveBtn = document.getElementById('save-btn');
const saveStatus = document.getElementById('save-status');

/* ═══════════════════════════════════════════════
   State
   ═══════════════════════════════════════════════ */

let currentPage = 'aiAcceleratedEngineering';
let data = {};

/* ═══════════════════════════════════════════════
   Auth
   ═══════════════════════════════════════════════ */

onAuthStateChanged(auth, async (user) => {
  if (user) {
    loginScreen.classList.add('admin-hidden');
    adminPanel.classList.remove('admin-hidden');
    adminUser.textContent = user.email;
    await loadData();
  } else {
    loginScreen.classList.remove('admin-hidden');
    adminPanel.classList.add('admin-hidden');
  }
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.classList.remove('visible');
  loginBtn.disabled = true;
  loginBtn.textContent = 'Signing in...';
  try {
    await signInWithEmailAndPassword(auth, loginEmail.value, loginPassword.value);
  } catch (err) {
    loginError.textContent = friendlyAuthError(err.code);
    loginError.classList.add('visible');
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = 'Sign in';
  }
});

logoutBtn.addEventListener('click', () => signOut(auth));

function friendlyAuthError(code) {
  const map = {
    'auth/invalid-email': 'Invalid email address.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/invalid-credential': 'Invalid email or password.',
    'auth/too-many-requests': 'Too many attempts. Try again later.',
  };
  return map[code] || 'Sign in failed. Please try again.';
}

/* ═══════════════════════════════════════════════
   Page switching
   ═══════════════════════════════════════════════ */

pageSelect.addEventListener('change', async () => {
  // Save form state before switching
  readAllForms();
  currentPage = pageSelect.value;
  await loadData();
});

/* ═══════════════════════════════════════════════
   Data – Load / Save
   ═══════════════════════════════════════════════ */

function getPageConfig() {
  return PAGES[currentPage];
}

async function getDefaults() {
  const page = getPageConfig();
  if (currentPage === 'home') {
    return await getHomeDefaults();
  }
  return page.defaults;
}

function normalizeData(raw, sections, defaults) {
  const out = {};
  for (const cfg of sections) {
    const sectionKey = cfg.parentKey || cfg.key;
    const section = raw?.[sectionKey];
    if (!section) {
      out[sectionKey] = JSON.parse(JSON.stringify(defaults[sectionKey] || {}));
      continue;
    }
    if (!out[sectionKey]) out[sectionKey] = {};
    for (const f of cfg.fields) {
      let val = section[f.key];
      if (val === undefined || val === null) {
        out[sectionKey][f.key] = JSON.parse(JSON.stringify((defaults[sectionKey] || {})[f.key] ?? ''));
        continue;
      }
      // Normalize Firebase objects → arrays
      const defaultVal = (defaults[sectionKey] || {})[f.key];
      if (Array.isArray(defaultVal) && !Array.isArray(val)) {
        val = Object.values(val);
      }
      if (f.type === 'columns' && Array.isArray(val)) {
        val = val.map(col => ({
          heading: col.heading || '',
          bullets: (Array.isArray(col.bullets) ? col.bullets : Object.values(col.bullets || {})).map(b => ({ icon: b.icon || null, text: b.text || '' })),
        }));
      }
      out[sectionKey][f.key] = val;
    }
    // Preserve extra keys not in fields (like logos, certBadges, etc.)
    for (const k of Object.keys(section)) {
      if (!(k in out[sectionKey])) {
        out[sectionKey][k] = section[k];
      }
    }
  }
  // Preserve extra top-level keys from defaults not covered by sections
  for (const k of Object.keys(defaults)) {
    if (!(k in out)) {
      out[k] = raw?.[k] ?? JSON.parse(JSON.stringify(defaults[k]));
    }
  }
  return out;
}

async function loadData() {
  const page = getPageConfig();
  const defaults = await getDefaults();
  try {
    const snapshot = await get(ref(db, page.fbPath));
    if (snapshot.exists()) {
      data = normalizeData(snapshot.val(), page.sections, defaults);
    } else {
      data = JSON.parse(JSON.stringify(defaults));
    }
  } catch (err) {
    console.error('Failed to load data:', err);
    data = JSON.parse(JSON.stringify(defaults));
  }
  renderEditor();
}

async function saveData() {
  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving...';
  saveStatus.textContent = '';
  saveStatus.className = 'save-status';
  try {
    readAllForms();
    const page = getPageConfig();
    await set(ref(db, page.fbPath), data);
    saveStatus.textContent = 'Saved successfully';
    saveStatus.classList.add('success');
  } catch (err) {
    console.error('Save failed:', err);
    saveStatus.textContent = 'Save failed — ' + err.message;
    saveStatus.classList.add('error');
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Changes';
  }
}

saveBtn.addEventListener('click', saveData);

/* ═══════════════════════════════════════════════
   Editor – Render
   ═══════════════════════════════════════════════ */

function renderEditor() {
  const page = getPageConfig();
  editorSections.innerHTML = '';

  for (const cfg of page.sections) {
    const sectionKey = cfg.parentKey || cfg.key;
    const section = data[sectionKey] || {};
    const wrapper = el('div', 'editor-section');
    const header = el('button', 'editor-section-toggle');
    header.type = 'button';
    header.innerHTML = `<span>${cfg.label}</span><span class="toggle-arrow">&#9660;</span>`;
    header.addEventListener('click', () => wrapper.classList.toggle('is-open'));
    wrapper.appendChild(header);

    const body = el('div', 'editor-section-body');
    body.dataset.sectionKey = sectionKey;

    for (const field of cfg.fields) {
      body.appendChild(renderField(sectionKey, field, section[field.key]));
    }

    wrapper.appendChild(body);
    editorSections.appendChild(wrapper);
  }

  editorSections.querySelector('.editor-section')?.classList.add('is-open');
}

function renderField(sectionKey, field, value) {
  const group = el('div', 'field-group');
  group.dataset.sectionKey = sectionKey;
  group.dataset.fieldKey = field.key;

  const label = el('label', 'field-label');
  label.textContent = field.label;
  group.appendChild(label);

  switch (field.type) {
    case 'text': group.appendChild(textInput(value || '')); break;
    case 'textarea': group.appendChild(textArea(value || '')); break;
    case 'title': group.appendChild(textInput(value?.[0] || '', 'Line 1 (highlighted)')); group.appendChild(textInput(value?.[1] || '', 'Line 2')); break;
    case 'label-href': renderLabelHref(group, value || {}); break;
    case 'stats': renderRepeatable(group, sectionKey, field.key, value || [], ['value', 'label'], ['Value (e.g. 50%)', 'Label']); break;
    case 'numbered-cards': renderNumberedCards(group, sectionKey, value || []); break;
    case 'stages': renderRepeatable(group, sectionKey, field.key, value || [], ['heading', 'description'], ['Stage name', 'Description'], true); break;
    case 'columns': renderColumns(group, sectionKey, value || []); break;
    case 'heading-body-cards': renderRepeatableTextarea(group, sectionKey, field.key, value || [], ['heading', 'body'], ['Heading', 'Body']); break;
    case 'pill-cards': renderRepeatableTextarea(group, sectionKey, field.key, value || [], ['heading', 'body', 'pill'], ['Heading', 'Body', 'Pill label']); break;
    case 'string-list': renderStringList(group, sectionKey, field.key, value || []); break;
    // Home page specific types
    case 'service-cards': renderServiceCards(group, sectionKey, field.key, value || []); break;
    case 'why-cards': renderWhyCards(group, sectionKey, field.key, value || []); break;
    case 'case-slides': renderCaseSlides(group, sectionKey, field.key, value || []); break;
    case 'testimonial-cards': renderTestimonialCards(group, sectionKey, field.key, value || []); break;
    case 'engagement-cards': renderEngagementCards(group, sectionKey, field.key, value || []); break;
    case 'growth-cards': renderGrowthCards(group, sectionKey, field.key, value || []); break;
  }

  return group;
}

/* ═══════════════════════════════════════════════
   Field renderers — shared
   ═══════════════════════════════════════════════ */

function renderLabelHref(group, obj) {
  const container = el('div', 'card-row');
  container.innerHTML = `
    <input type="text" class="lh-label" value="${esc(obj.label || '')}" placeholder="Label">
    <input type="text" class="lh-href" value="${esc(obj.href || '')}" placeholder="URL / href">
  `;
  group.appendChild(container);
}

function renderRepeatable(group, sectionKey, arrayKey, items, keys, placeholders, hasTextarea) {
  const container = el('div', 'repeatable-container');
  items.forEach((item, i) => {
    const card = hasTextarea ? el('div', 'nested-card') : el('div', 'card-row');
    let html = '<div class="card-row">';
    keys.forEach((k, ki) => {
      if (hasTextarea && ki > 0) return;
      html += `<input type="text" class="rep-${k}" value="${esc(typeof item === 'object' ? item[k] : item)}" placeholder="${placeholders[ki]}">`;
    });
    html += `<button class="bullet-remove" data-idx="${i}">&times;</button></div>`;
    if (hasTextarea && keys.length > 1) {
      html += `<textarea class="rep-${keys[1]}" placeholder="${placeholders[1]}">${esc(item[keys[1]] || '')}</textarea>`;
    }
    card.innerHTML = html;
    container.appendChild(card);
  });
  const addBtn = el('button', 'add-bullet-btn');
  addBtn.textContent = '+ Add item';
  addBtn.addEventListener('click', () => {
    readAllForms();
    const empty = {};
    keys.forEach(k => empty[k] = '');
    data[sectionKey][arrayKey].push(empty);
    renderEditor();
  });
  group.appendChild(container);
  group.appendChild(addBtn);
  attachRemoveListeners(container, sectionKey, arrayKey);
}

function renderNumberedCards(group, sectionKey, cards) {
  const container = el('div', 'repeatable-container');
  cards.forEach((c, i) => {
    const card = el('div', 'nested-card');
    card.innerHTML = `
      <div class="card-row">
        <input type="text" class="nc-number" value="${esc(c.number)}" placeholder="Number" style="width:60px">
        <input type="text" class="nc-title" value="${esc(c.title)}" placeholder="Title">
        <button class="bullet-remove" data-idx="${i}">&times;</button>
      </div>
      <textarea class="nc-body" placeholder="Body">${esc(c.body)}</textarea>
    `;
    container.appendChild(card);
  });
  const addBtn = el('button', 'add-bullet-btn');
  addBtn.textContent = '+ Add card';
  addBtn.addEventListener('click', () => {
    readAllForms();
    data[sectionKey].cards.push({ number: String(data[sectionKey].cards.length + 1).padStart(2, '0'), title: '', body: '' });
    renderEditor();
  });
  group.appendChild(container);
  group.appendChild(addBtn);
  attachRemoveListeners(container, sectionKey, 'cards');
}

function renderRepeatableTextarea(group, sectionKey, arrayKey, items, keys, placeholders) {
  const container = el('div', 'repeatable-container');
  items.forEach((item, i) => {
    const card = el('div', 'nested-card');
    let inputsHtml = '';
    keys.forEach((k, ki) => {
      if (k === 'body') return;
      inputsHtml += `<input type="text" class="hb-${k}" value="${esc(item[k] || '')}" placeholder="${placeholders[ki]}">`;
    });
    card.innerHTML = `
      <div class="card-row">${inputsHtml}<button class="bullet-remove" data-idx="${i}">&times;</button></div>
      ${keys.includes('body') ? `<textarea class="hb-body" placeholder="Body">${esc(item.body || '')}</textarea>` : ''}
    `;
    container.appendChild(card);
  });
  const addBtn = el('button', 'add-bullet-btn');
  addBtn.textContent = '+ Add card';
  addBtn.addEventListener('click', () => {
    readAllForms();
    const empty = {};
    keys.forEach(k => empty[k] = '');
    data[sectionKey][arrayKey].push(empty);
    renderEditor();
  });
  group.appendChild(container);
  group.appendChild(addBtn);
  attachRemoveListeners(container, sectionKey, arrayKey);
}

function renderColumns(group, sectionKey, columns) {
  const container = el('div', 'repeatable-container');
  columns.forEach((col, ci) => {
    const card = el('div', 'section-card');
    card.innerHTML = `<div class="section-card-header"><input type="text" class="col-heading" value="${esc(col.heading)}" placeholder="Section heading"><button class="btn btn-danger btn-small remove-col-btn" data-idx="${ci}">Remove</button></div>`;
    const bulletsDiv = el('div', 'bullets-container');
    col.bullets.forEach((b, bi) => {
      const row = el('div', 'bullet-row');
      row.innerHTML = `<input type="text" class="bullet-text" value="${esc(b.text)}" placeholder="Bullet text"><input type="text" class="icon-input" value="${esc(b.icon || '')}" placeholder="Icon URL (optional)"><button class="bullet-remove">&times;</button>`;
      row.querySelector('.bullet-remove').addEventListener('click', () => { readAllForms(); data[sectionKey].columns[ci].bullets.splice(bi, 1); renderEditor(); });
      bulletsDiv.appendChild(row);
    });
    card.appendChild(bulletsDiv);
    const addBulletBtn = el('button', 'add-bullet-btn');
    addBulletBtn.textContent = '+ Add bullet';
    addBulletBtn.addEventListener('click', () => { readAllForms(); data[sectionKey].columns[ci].bullets.push({ icon: null, text: '' }); renderEditor(); });
    card.appendChild(addBulletBtn);
    container.appendChild(card);
  });
  container.querySelectorAll('.remove-col-btn').forEach(btn => {
    btn.addEventListener('click', () => { readAllForms(); data[sectionKey].columns.splice(Number(btn.dataset.idx), 1); renderEditor(); });
  });
  const addBtn = el('button', 'add-section-btn');
  addBtn.textContent = '+ Add Column';
  addBtn.addEventListener('click', () => { readAllForms(); data[sectionKey].columns.push({ heading: '', bullets: [{ icon: null, text: '' }] }); renderEditor(); });
  group.appendChild(container);
  group.appendChild(addBtn);
}

function renderStringList(group, sectionKey, arrayKey, items) {
  const container = el('div', 'repeatable-container');
  items.forEach((s, i) => {
    const row = el('div', 'card-row');
    row.innerHTML = `<input type="text" class="str-item" value="${esc(s)}" placeholder="Item"><button class="bullet-remove" data-idx="${i}">&times;</button>`;
    container.appendChild(row);
  });
  const addBtn = el('button', 'add-bullet-btn');
  addBtn.textContent = '+ Add item';
  addBtn.addEventListener('click', () => { readAllForms(); data[sectionKey][arrayKey].push(''); renderEditor(); });
  group.appendChild(container);
  group.appendChild(addBtn);
  attachRemoveListeners(container, sectionKey, arrayKey);
}

/* ═══════════════════════════════════════════════
   Field renderers — Home page specific
   ═══════════════════════════════════════════════ */

function renderServiceCards(group, sectionKey, arrayKey, items) {
  const container = el('div', 'repeatable-container');
  (Array.isArray(items) ? items : Object.values(items)).forEach((item, i) => {
    const card = el('div', 'nested-card');
    card.innerHTML = `
      <div class="card-row">
        <input type="text" class="sc-eyebrow" value="${esc(item.eyebrow || '')}" placeholder="Eyebrow (e.g. Core Build)">
        <input type="text" class="sc-title" value="${esc(item.title || '')}" placeholder="Service title">
        <button class="bullet-remove" data-idx="${i}">&times;</button>
      </div>
      <div class="card-row">
        <input type="text" class="sc-href" value="${esc(item.href || '')}" placeholder="Link URL">
        <input type="text" class="sc-icon" value="${esc(item.icon || '')}" placeholder="Icon image path">
      </div>
      <div class="sc-bullets">${(Array.isArray(item.bullets) ? item.bullets : []).map((b, bi) => `<div class="card-row"><input type="text" class="sc-bullet" value="${esc(b)}" placeholder="Bullet ${bi + 1}"><button class="bullet-remove sc-bullet-remove" data-parent="${i}" data-idx="${bi}">&times;</button></div>`).join('')}</div>
      <button class="add-bullet-btn sc-add-bullet" data-idx="${i}">+ Add bullet</button>
    `;
    container.appendChild(card);
  });
  group.appendChild(container);
  attachRemoveListeners(container, sectionKey, arrayKey);
  container.querySelectorAll('.sc-bullet-remove').forEach(btn => {
    btn.addEventListener('click', (e) => { e.stopPropagation(); readAllForms(); const pi = Number(btn.dataset.parent); const bi = Number(btn.dataset.idx); data[sectionKey][arrayKey][pi].bullets.splice(bi, 1); renderEditor(); });
  });
  container.querySelectorAll('.sc-add-bullet').forEach(btn => {
    btn.addEventListener('click', () => { readAllForms(); data[sectionKey][arrayKey][Number(btn.dataset.idx)].bullets.push(''); renderEditor(); });
  });
}

function renderWhyCards(group, sectionKey, arrayKey, cards) {
  const container = el('div', 'repeatable-container');
  (Array.isArray(cards) ? cards : Object.values(cards)).forEach((c, i) => {
    const card = el('div', 'nested-card');
    card.innerHTML = `
      <div class="card-row">
        <input type="text" class="wc-title" value="${esc(c.title || '')}" placeholder="Card title">
        <input type="text" class="wc-style" value="${esc(c.style || 'light')}" placeholder="Style (light/dark/photo)" style="width:120px">
        <button class="bullet-remove" data-idx="${i}">&times;</button>
      </div>
      <textarea class="wc-text" placeholder="Card text">${esc(c.text || '')}</textarea>
      <div class="card-row"><input type="text" class="wc-image" value="${esc(c.image || '')}" placeholder="Image path"></div>
    `;
    container.appendChild(card);
  });
  group.appendChild(container);
  attachRemoveListeners(container, sectionKey, arrayKey);
}

function renderCaseSlides(group, sectionKey, arrayKey, slides) {
  const container = el('div', 'repeatable-container');
  (Array.isArray(slides) ? slides : Object.values(slides)).forEach((s, i) => {
    const metrics = Array.isArray(s.metrics) ? s.metrics : Object.values(s.metrics || {});
    const card = el('div', 'nested-card');
    card.innerHTML = `
      <div class="card-row">
        <input type="text" class="cs-eyebrow" value="${esc(s.eyebrow || '')}" placeholder="Eyebrow">
        <button class="bullet-remove" data-idx="${i}">&times;</button>
      </div>
      <input type="text" class="cs-title field-input" value="${esc(s.title || '')}" placeholder="Title">
      <textarea class="cs-text" placeholder="Summary text">${esc(s.text || '')}</textarea>
      <div class="card-row"><input type="text" class="cs-image" value="${esc(s.image || '')}" placeholder="Image path"><input type="text" class="cs-cta-label" value="${esc(s.cta?.label || '')}" placeholder="CTA label"><input type="text" class="cs-cta-href" value="${esc(s.cta?.href || '')}" placeholder="CTA href"></div>
      <div class="field-label" style="margin-top:8px">Metrics</div>
      ${metrics.map((m, mi) => `<div class="card-row"><input type="text" class="cs-metric-value" value="${esc(m.value || '')}" placeholder="Value" style="width:80px"><input type="text" class="cs-metric-label" value="${esc(m.label || '')}" placeholder="Label"></div>`).join('')}
    `;
    container.appendChild(card);
  });
  group.appendChild(container);
  attachRemoveListeners(container, sectionKey, arrayKey);
}

function renderTestimonialCards(group, sectionKey, arrayKey, cards) {
  const container = el('div', 'repeatable-container');
  (Array.isArray(cards) ? cards : Object.values(cards)).forEach((c, i) => {
    const card = el('div', 'nested-card');
    card.innerHTML = `
      <div class="card-row">
        <input type="text" class="tc-name" value="${esc(c.name || '')}" placeholder="Name">
        <input type="text" class="tc-role" value="${esc(c.role || '')}" placeholder="Role">
        <button class="bullet-remove" data-idx="${i}">&times;</button>
      </div>
      <textarea class="tc-text" placeholder="Testimonial quote">${esc(c.text || '')}</textarea>
      <div class="card-row"><input type="text" class="tc-logo" value="${esc(c.logo || '')}" placeholder="Logo path"><input type="text" class="tc-logoAlt" value="${esc(c.logoAlt || '')}" placeholder="Logo alt text"></div>
    `;
    container.appendChild(card);
  });
  const addBtn = el('button', 'add-bullet-btn');
  addBtn.textContent = '+ Add testimonial';
  addBtn.addEventListener('click', () => { readAllForms(); data[sectionKey][arrayKey].push({ text: '', name: '', role: '', logo: '', logoAlt: '' }); renderEditor(); });
  group.appendChild(container);
  group.appendChild(addBtn);
  attachRemoveListeners(container, sectionKey, arrayKey);
}

function renderEngagementCards(group, sectionKey, arrayKey, items) {
  const container = el('div', 'repeatable-container');
  (Array.isArray(items) ? items : Object.values(items)).forEach((item, i) => {
    const card = el('div', 'nested-card');
    card.innerHTML = `
      <div class="card-row">
        <input type="text" class="ec-title" value="${esc(item.title || '')}" placeholder="Title">
        <input type="text" class="ec-variant" value="${esc(item.variant || 'light')}" placeholder="Variant" style="width:100px">
        <button class="bullet-remove" data-idx="${i}">&times;</button>
      </div>
      <textarea class="ec-text" placeholder="Description">${esc(item.text || '')}</textarea>
      <div class="card-row"><input type="text" class="ec-image" value="${esc(item.image || '')}" placeholder="Image path"><input type="text" class="ec-cta" value="${esc(item.cta || '')}" placeholder="CTA label"></div>
      <div class="field-label" style="margin-top:6px">Bullets</div>
      ${(Array.isArray(item.bullets) ? item.bullets : []).map((b, bi) => `<div class="card-row"><input type="text" class="ec-bullet" value="${esc(b)}" placeholder="Bullet"></div>`).join('')}
    `;
    container.appendChild(card);
  });
  group.appendChild(container);
  attachRemoveListeners(container, sectionKey, arrayKey);
}

function renderGrowthCards(group, sectionKey, arrayKey, items) {
  const container = el('div', 'repeatable-container');
  (Array.isArray(items) ? items : Object.values(items)).forEach((item, i) => {
    const card = el('div', 'nested-card');
    card.innerHTML = `
      <div class="card-row">
        <input type="text" class="gc-title" value="${esc(item.title || '')}" placeholder="Title">
        <input type="text" class="gc-variant" value="${esc(item.variant || 'light')}" placeholder="Variant" style="width:100px">
        <button class="bullet-remove" data-idx="${i}">&times;</button>
      </div>
      <textarea class="gc-text" placeholder="Description">${esc(item.text || '')}</textarea>
      <div class="card-row"><input type="text" class="gc-bestSuited" value="${esc(item.bestSuitedFor || '')}" placeholder="Best suited for"><input type="text" class="gc-cta" value="${esc(item.cta || '')}" placeholder="CTA label"></div>
      <input type="text" class="gc-outcome field-input" value="${esc(item.outcome || '')}" placeholder="Outcome">
      <div class="field-label" style="margin-top:6px">Bullets</div>
      ${(Array.isArray(item.bullets) ? item.bullets : []).map(b => `<div class="card-row"><input type="text" class="gc-bullet" value="${esc(b)}" placeholder="Bullet"></div>`).join('')}
    `;
    container.appendChild(card);
  });
  group.appendChild(container);
  attachRemoveListeners(container, sectionKey, arrayKey);
}

/* ═══════════════════════════════════════════════
   Remove helpers
   ═══════════════════════════════════════════════ */

function attachRemoveListeners(container, sectionKey, arrayKey) {
  container.querySelectorAll(':scope > .nested-card > .card-row > .bullet-remove, :scope > .card-row > .bullet-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      readAllForms();
      const arr = data[sectionKey][arrayKey];
      if (Array.isArray(arr)) { arr.splice(Number(btn.dataset.idx), 1); renderEditor(); }
    });
  });
}

/* ═══════════════════════════════════════════════
   Read all form state back into data
   ═══════════════════════════════════════════════ */

function readAllForms() {
  const page = getPageConfig();

  for (const cfg of page.sections) {
    const sectionKey = cfg.parentKey || cfg.key;
    const body = editorSections.querySelector(`[data-section-key="${sectionKey}"]`);
    if (!body) continue;

    for (const field of cfg.fields) {
      const group = body.querySelector(`[data-field-key="${field.key}"]`);
      if (!group) continue;

      switch (field.type) {
        case 'text': { const input = group.querySelector('input'); if (input) data[sectionKey][field.key] = input.value; break; }
        case 'textarea': { const ta = group.querySelector('textarea'); if (ta) data[sectionKey][field.key] = ta.value; break; }
        case 'title': { const inputs = group.querySelectorAll('input'); if (inputs.length >= 2) data[sectionKey][field.key] = [inputs[0].value, inputs[1].value]; break; }
        case 'label-href': {
          const lbl = group.querySelector('.lh-label');
          const href = group.querySelector('.lh-href');
          if (lbl && href) data[sectionKey][field.key] = { label: lbl.value, href: href.value };
          break;
        }
        case 'stats': {
          data[sectionKey].stats = Array.from(group.querySelectorAll('.card-row')).map(r => ({ value: r.querySelector('.rep-value')?.value || '', label: r.querySelector('.rep-label')?.value || '' }));
          break;
        }
        case 'numbered-cards': {
          data[sectionKey].cards = Array.from(group.querySelectorAll('.nested-card')).map(c => ({ number: c.querySelector('.nc-number')?.value || '', title: c.querySelector('.nc-title')?.value || '', body: c.querySelector('.nc-body')?.value || '' }));
          break;
        }
        case 'stages': {
          data[sectionKey].stages = Array.from(group.querySelectorAll('.nested-card, .card-row')).filter(c => c.querySelector('.rep-heading')).map(c => ({ heading: c.querySelector('.rep-heading')?.value || '', description: c.querySelector('.rep-description')?.value || '' }));
          break;
        }
        case 'columns': {
          data[sectionKey].columns = Array.from(group.querySelectorAll('.section-card')).map(card => ({ heading: card.querySelector('.col-heading')?.value || '', bullets: Array.from(card.querySelectorAll('.bullet-row')).map(row => ({ icon: row.querySelector('.icon-input')?.value || null, text: row.querySelector('.bullet-text')?.value || '' })) }));
          break;
        }
        case 'heading-body-cards': case 'pill-cards': {
          data[sectionKey][field.key] = Array.from(group.querySelectorAll('.nested-card')).map(c => {
            const obj = { heading: c.querySelector('.hb-heading')?.value || '', body: c.querySelector('.hb-body')?.value || '' };
            const pill = c.querySelector('.hb-pill');
            if (pill) obj.pill = pill.value;
            return obj;
          });
          break;
        }
        case 'string-list': {
          data[sectionKey][field.key] = Array.from(group.querySelectorAll('.card-row')).map(r => r.querySelector('.str-item')?.value || '');
          break;
        }
        // Home page types
        case 'service-cards': {
          data[sectionKey][field.key] = Array.from(group.querySelectorAll('.nested-card')).map(c => {
            const existing = data[sectionKey][field.key]?.[Array.from(c.parentElement.children).indexOf(c)] || {};
            return { ...existing, eyebrow: c.querySelector('.sc-eyebrow')?.value || '', title: c.querySelector('.sc-title')?.value || '', href: c.querySelector('.sc-href')?.value || '', icon: c.querySelector('.sc-icon')?.value || '', bullets: Array.from(c.querySelectorAll('.sc-bullet')).map(b => b.value) };
          });
          break;
        }
        case 'why-cards': {
          data[sectionKey][field.key] = Array.from(group.querySelectorAll('.nested-card')).map((c, i) => {
            const existing = data[sectionKey][field.key]?.[i] || {};
            return { ...existing, title: c.querySelector('.wc-title')?.value || '', text: c.querySelector('.wc-text')?.value || '', style: c.querySelector('.wc-style')?.value || 'light', image: c.querySelector('.wc-image')?.value || '' };
          });
          break;
        }
        case 'case-slides': {
          data[sectionKey][field.key] = Array.from(group.querySelectorAll('.nested-card')).map((c, i) => {
            const existing = data[sectionKey][field.key]?.[i] || {};
            const metricRows = c.querySelectorAll('.cs-metric-value');
            const metricLabels = c.querySelectorAll('.cs-metric-label');
            const metrics = Array.from(metricRows).map((mv, mi) => ({ value: mv.value, label: metricLabels[mi]?.value || '' }));
            return { ...existing, eyebrow: c.querySelector('.cs-eyebrow')?.value || '', title: c.querySelector('.cs-title')?.value || '', text: c.querySelector('.cs-text')?.value || '', image: c.querySelector('.cs-image')?.value || '', cta: { label: c.querySelector('.cs-cta-label')?.value || '', href: c.querySelector('.cs-cta-href')?.value || '' }, metrics };
          });
          break;
        }
        case 'testimonial-cards': {
          data[sectionKey][field.key] = Array.from(group.querySelectorAll('.nested-card')).map(c => ({ text: c.querySelector('.tc-text')?.value || '', name: c.querySelector('.tc-name')?.value || '', role: c.querySelector('.tc-role')?.value || '', logo: c.querySelector('.tc-logo')?.value || '', logoAlt: c.querySelector('.tc-logoAlt')?.value || '' }));
          break;
        }
        case 'engagement-cards': {
          data[sectionKey][field.key] = Array.from(group.querySelectorAll('.nested-card')).map((c, i) => {
            const existing = data[sectionKey][field.key]?.[i] || {};
            return { ...existing, title: c.querySelector('.ec-title')?.value || '', text: c.querySelector('.ec-text')?.value || '', variant: c.querySelector('.ec-variant')?.value || 'light', image: c.querySelector('.ec-image')?.value || '', cta: c.querySelector('.ec-cta')?.value || '', bullets: Array.from(c.querySelectorAll('.ec-bullet')).map(b => b.value) };
          });
          break;
        }
        case 'growth-cards': {
          data[sectionKey][field.key] = Array.from(group.querySelectorAll('.nested-card')).map((c, i) => {
            const existing = data[sectionKey][field.key]?.[i] || {};
            return { ...existing, title: c.querySelector('.gc-title')?.value || '', text: c.querySelector('.gc-text')?.value || '', variant: c.querySelector('.gc-variant')?.value || 'light', bestSuitedFor: c.querySelector('.gc-bestSuited')?.value || '', cta: c.querySelector('.gc-cta')?.value || '', outcome: c.querySelector('.gc-outcome')?.value || '', bullets: Array.from(c.querySelectorAll('.gc-bullet')).map(b => b.value) };
          });
          break;
        }
      }
    }
  }
}

/* ═══════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════ */

function el(tag, className) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  return e;
}

function textInput(value, placeholder) {
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'field-input';
  input.value = value;
  if (placeholder) input.placeholder = placeholder;
  return input;
}

function textArea(value) {
  const ta = document.createElement('textarea');
  ta.className = 'field-textarea';
  ta.value = value;
  return ta;
}

function esc(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
