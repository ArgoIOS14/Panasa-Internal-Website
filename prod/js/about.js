import { initScrollAnimations } from './Home scenes/components/animations.js';
import { loadContent } from './Home scenes/data/loadContent.js';
import { renderFooter } from './Home scenes/sections/footer.js';
import { renderLogoMarquee } from './Home scenes/sections/logoMarquee.js';
import { initNavToggle, renderNav } from './Home scenes/sections/nav.js';
import { renderSharedTestimonials } from './Home scenes/sections/sharedTestimonials.js';
import { initEmailCapture } from './Home scenes/components/email-capture.js';

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

  initEmailCapture({
    promptHeading: 'Have a question we didn\'t cover?',
    promptSubtext: 'Leave your email and we\'ll follow up.',
    buttonLabel: 'Follow up',
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
};

initAbout();

window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    initScrollAnimations();
  }
});
