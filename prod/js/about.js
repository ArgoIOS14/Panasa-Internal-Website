import { initScrollAnimations } from './Home scenes/components/animations.js';
import './smooth-scroll.js';
import { loadContent } from './Home scenes/data/loadContent.js';
import { renderFooter } from './Home scenes/sections/footer.js';
import { renderLogoMarquee } from './Home scenes/sections/logoMarquee.js';
import { initNavToggle, renderNav } from './Home scenes/sections/nav.js';
import { renderSharedTestimonials } from './Home scenes/sections/sharedTestimonials.js';
import { initEmailCapture } from './Home scenes/components/email-capture.js';
import { firebaseConfig } from './firebase-config.js';


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

const ABOUT_TESTIMONIALS = {
  subtitle: 'Feedback from fintech partners delivering secure, scalable, compliant card platforms.',
  cards: [
    {
      text: 'Panasa has been a great asset in developing our payment solutions, acting as a true extension of our team while enabling scale and continuous support. We highly recommend their fintech development services.',
      name: 'Giovanni Santini',
      role: 'Chief Executive Officer',
      logo: 'assets/testimonial-logo-osper.svg',
      logoAlt: 'Osper',
    },
    {
      text: "Panasa allows us to focus on growing our brands. With their FinTech expertise, dedication, ability to scale, and meticulous attention to detail, we're able to position ourselves as one of the most cutting-edge groups in payment solutions.",
      name: 'Tom Bishop',
      role: 'Chief Commercial Officer',
      logo: 'assets/testimonial-logo-cleava.svg',
      logoAlt: 'Cleava',
    },
    {
      text: 'We assigned payment platform integration work to Panasa, and they delivered to our utmost satisfaction. We wish Panasa Tech all the best for their future endeavors.',
      name: 'Aaron Holmes',
      role: 'Chief Executive Officer',
      logo: 'assets/testimonial-logo-kani.svg',
      logoAlt: 'Kani Payments',
    },
    {
      text: "With it now being commonplace for most UK developers to work remotely, we've found transitioning assignments to Panasa a breeze. They're extremely conscientious, have built in guardrails for governance and pros at what they do.",
      name: 'Anil Nair',
      role: 'Co-founder',
      logo: 'assets/testimonial-logo-earnr.svg',
      logoAlt: 'earnr',
    },
  ],
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
});

const createFaqSvg = (isOpen) => {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('width', '28');
  svg.setAttribute('height', '28');
  svg.setAttribute('viewBox', '0 0 28 28');
  svg.setAttribute('fill', 'none');

  const hLine = document.createElementNS(NS, 'path');
  hLine.setAttribute('d', isOpen ? 'M23.3332 14H4.6665' : 'M23.3332 14H4.6665');
  hLine.setAttribute('stroke', '#141414');
  hLine.setAttribute('stroke-width', '2.5');
  hLine.setAttribute('stroke-linecap', 'round');
  hLine.setAttribute('stroke-linejoin', 'round');
  svg.appendChild(hLine);

  if (isOpen) {
    const hLine2 = document.createElementNS(NS, 'path');
    hLine2.setAttribute('d', 'M23.3384 13.9961L4.67171 13.9961');
    hLine2.setAttribute('stroke', '#141414');
    hLine2.setAttribute('stroke-width', '2.5');
    hLine2.setAttribute('stroke-linecap', 'round');
    hLine2.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(hLine2);
  } else {
    const vLine = document.createElementNS(NS, 'path');
    vLine.setAttribute('d', 'M14.0015 4.66797L14.0015 23.3346');
    vLine.setAttribute('stroke', '#141414');
    vLine.setAttribute('stroke-width', '2.5');
    vLine.setAttribute('stroke-linecap', 'round');
    vLine.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(vLine);
  }

  return svg;
};

const initFaq = () => {
  const items = Array.from(document.querySelectorAll('.faq-item'));
  if (!items.length) return;

  const setPanelState = (item, isOpen) => {
    const button = item.querySelector('[data-faq-toggle]');
    const icon = item.querySelector('.faq-icon');
    const panel = item.querySelector('[data-faq-panel]');
    if (!(button && icon && panel)) return;

    item.classList.toggle('is-open', isOpen);
    button.setAttribute('aria-expanded', String(isOpen));
    icon.textContent = '';
    icon.appendChild(createFaqSvg(isOpen));
    panel.style.height = isOpen ? `${panel.scrollHeight}px` : '0px';
  };

  items.forEach((item) => setPanelState(item, false));

  items.forEach((item) => {
    const button = item.querySelector('[data-faq-toggle]');
    button?.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');

      items.forEach((entry) => setPanelState(entry, false));

      if (!isOpen) {
        setPanelState(item, true);
      }
    });
  });

  window.addEventListener('resize', () => {
    items.forEach((item) => {
      if (item.classList.contains('is-open')) setPanelState(item, true);
    });
  });
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

async function fetchAboutContent() {
  try {
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js');
    const { getDatabase, ref, get } = await import('https://www.gstatic.com/firebasejs/11.1.0/firebase-database.js');
    const app = initializeApp(firebaseConfig, 'about-reader');
    const db = getDatabase(app);
    const snapshot = await get(ref(db, 'pages/about'));
    if (snapshot.exists()) return snapshot.val();
  } catch (e) {
    console.warn('Firebase fetch failed for about page', e);
  }
  return null;
}

function stripTags(str) { if (!str || typeof str !== 'string' || !str.includes('<')) return str || ''; const d = document.createElement('div'); d.innerHTML = str; return d.textContent || ''; }
function deepStripTags(obj) { if (typeof obj === 'string') return stripTags(obj); if (Array.isArray(obj)) return obj.map(deepStripTags); if (obj && typeof obj === 'object') { const o = {}; for (const k of Object.keys(obj)) o[k] = deepStripTags(obj[k]); return o; } return obj; }
function setText(el, text) { if (el && text) el.textContent = stripTags(text); }

function applyAboutContent(content) {
  if (!content) return;

  // Hero
  const hero = content.hero;
  if (hero) {
    setText(document.querySelector('.about-hero .pill'), hero.pill);
    const h1 = document.querySelector('.about-hero-copy h1');
    if (h1 && (hero.title || hero.titleEmphasis)) {
      h1.innerHTML = `<span>${hero.title || ''}</span> <em>${hero.titleEmphasis || ''}</em>`;
    }
    setText(document.querySelector('.about-hero-copy p'), hero.subtitle);
    const ctas = document.querySelectorAll('.about-hero .hero-actions a');
    if (ctas[0] && hero.primaryCta) {
      const label = ctas[0].querySelector('.hero-action-label');
      if (label) label.textContent = hero.primaryCta.label || '';
      if (hero.primaryCta.href) ctas[0].setAttribute('href', hero.primaryCta.href);
    }
    if (ctas[1] && hero.secondaryCta) {
      const label = ctas[1].querySelector('.hero-action-label');
      if (label) label.textContent = hero.secondaryCta.label || '';
      if (hero.secondaryCta.href) ctas[1].setAttribute('href', hero.secondaryCta.href);
    }
  }

  // Stats
  const stats = content.stats;
  if (Array.isArray(stats)) {
    const cards = document.querySelectorAll('.about-stats .stat-card');
    stats.forEach((s, i) => {
      if (!cards[i]) return;
      setText(cards[i].querySelector('strong'), s.value);
      setText(cards[i].querySelector('span:last-child'), s.label);
    });
  }

  // Global Delivery
  const delivery = content.delivery;
  if (delivery) {
    const section = document.querySelector('.presence-section');
    if (section) {
      const h2 = section.querySelector('.section-title h2');
      if (h2) h2.innerHTML = `<span>${delivery.title || ''}</span> <em>${delivery.titleEmphasis || ''}</em>`;
      setText(section.querySelector('.section-head p'), delivery.subtitle);
    }
  }

  // Process
  const process = content.process;
  if (process) {
    const section = document.querySelector('.process-section');
    if (section) {
      const h2 = section.querySelector('.section-title h2');
      if (h2) h2.innerHTML = `<span>${process.title || ''}</span> <em>${process.titleEmphasis || ''}</em>`;
      setText(section.querySelector('.section-head p'), process.subtitle);
      const steps = Array.isArray(process.steps) ? process.steps : Object.values(process.steps || {});
      const items = section.querySelectorAll('.process-flow-item');
      steps.forEach((s, i) => {
        if (!items[i]) return;
        setText(items[i].querySelector('strong'), s.heading);
        setText(items[i].querySelector('p'), s.description);
      });
    }
  }

  // Leadership
  const leadership = content.leadership;
  if (Array.isArray(leadership) || (leadership && typeof leadership === 'object')) {
    const leaders = Array.isArray(leadership) ? leadership : Object.values(leadership);
    const cards = document.querySelectorAll('.leadership-section .leader-card');
    leaders.forEach((l, i) => {
      if (!cards[i]) return;
      setText(cards[i].querySelector('.leader-summary h3'), l.name);
      setText(cards[i].querySelector('.leader-summary p'), l.role);
      setText(cards[i].querySelector('.leader-detail h3'), l.name);
      const detailRole = cards[i].querySelector('.leader-detail p:first-of-type');
      if (detailRole) detailRole.textContent = l.role;
      const detailBio = cards[i].querySelector('.leader-detail p:last-of-type');
      if (detailBio && detailBio !== detailRole) detailBio.textContent = l.bio;
    });
  }

  // Testimonials (override the hardcoded object)
  const testimonials = content.testimonials;
  if (testimonials?.cards) {
    const tCards = Array.isArray(testimonials.cards) ? testimonials.cards : Object.values(testimonials.cards);
    // Re-render testimonials with Firebase data
    renderSharedTestimonials({ subtitle: testimonials.subtitle || ABOUT_TESTIMONIALS.subtitle, cards: tCards }, {
      subtitleSelector: '.about-testimonials .section-head p',
      trackSelector: '[data-testimonial-track]',
      prevSelector: '[data-testimonial-prev]',
      nextSelector: '[data-testimonial-next]',
      dotsSelector: '[data-testimonial-dots]',
    });
    if (testimonials.title || testimonials.titleEmphasis) {
      const h2 = document.querySelector('.about-testimonials .section-title-split h2');
      if (h2) h2.innerHTML = `${testimonials.title || 'Trusted by'} <span>${testimonials.titleEmphasis || 'Fintech Leaders'}</span>`;
    }
  }

  // FAQ
  const faq = content.faq;
  if (faq) {
    const section = document.querySelector('.faq-section');
    if (section) {
      const h2 = section.querySelector('.section-title h2');
      if (h2 && (faq.title || faq.titleEmphasis)) {
        h2.innerHTML = `<span>${faq.title || ''}</span> <em>${faq.titleEmphasis || ''}</em>`;
      }
      setText(section.querySelector('.section-head p'), faq.subtitle);
      const items = Array.isArray(faq.items) ? faq.items : Object.values(faq.items || {});
      const faqItems = section.querySelectorAll('.faq-item');
      items.forEach((f, i) => {
        if (!faqItems[i]) return;
        const qBtn = faqItems[i].querySelector('.faq-question');
        const qSpan = qBtn?.querySelector('span:first-child');
        if (qSpan && f.question) qSpan.textContent = f.question;
        const answer = faqItems[i].querySelector('[data-faq-panel] p');
        if (answer) answer.textContent = f.answer;
      });
    }
  }
}

const initAbout = async () => {
  initNavToggle();
  initScrollAnimations();
  initFaq();
  initProcessSteps();
  renderLogoMarquee('[data-partner-logos]', TRUSTED_LOGOS);
  renderSharedTestimonials(ABOUT_TESTIMONIALS, {
    subtitleSelector: '.about-testimonials .section-head p',
    trackSelector: '[data-testimonial-track]',
    prevSelector: '[data-testimonial-prev]',
    nextSelector: '[data-testimonial-next]',
    dotsSelector: '[data-testimonial-dots]',
  });

  // Email capture — will be overridden by Firebase data below
  const defaultEmailCapture = {
    promptHeading: 'Have a question we didn\'t cover?',
    promptSubtext: 'Leave your email and we\'ll follow up.',
    buttonLabel: 'Follow up',
  };
  initEmailCapture({
    ...defaultEmailCapture,
    triggerPercent: 0.75,
    storageKey: 'panasa_email_about',
    crmDescription: 'Email capture: FAQ follow-up (About page)',
  });

  try {
    const content = await loadContent();
    renderNav(content.nav);
    renderFooter(buildFooterLinks(content.footer));
  } catch (error) {
    console.error('Failed to load about page shared content', error);
    if (window.DEFAULT_CONTENT?.nav) renderNav(window.DEFAULT_CONTENT.nav);
    if (window.DEFAULT_CONTENT?.footer) {
      renderFooter(buildFooterLinks(window.DEFAULT_CONTENT.footer));
    }
  }

  // Apply Firebase content (overrides hardcoded HTML if data exists)
  const aboutContentRaw = await fetchAboutContent();
  const aboutContent = aboutContentRaw ? deepStripTags(aboutContentRaw) : null;
  applyAboutContent(aboutContent);

  // Override email capture popup text if Firebase has data
  const ec = aboutContent?.emailCapture;
  if (ec) {
    const heading = document.querySelector('.email-capture__heading');
    const subtext = document.querySelector('.email-capture__subtext');
    const btn = document.querySelector('.email-capture__form button[type="submit"]');
    if (heading && ec.promptHeading) heading.textContent = ec.promptHeading;
    if (subtext && ec.promptSubtext) subtext.textContent = ec.promptSubtext;
    if (btn && ec.buttonLabel) btn.textContent = ec.buttonLabel;
  }
};

initAbout();

// Live preview hook
if (new URLSearchParams(window.location.search).get('preview') === 'true') {
  window.__livePreviewRender = (data) => {
    try { applyAboutContent(data); }
    catch (e) { console.warn('[live-preview] about failed:', e); }
  };
}

window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    initScrollAnimations();
  }
});
