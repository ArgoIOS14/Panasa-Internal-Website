import { initScrollAnimations } from './Home scenes/components/animations.js';
import { loadContent } from './Home scenes/data/loadContent.js';
import { renderFooter } from './Home scenes/sections/footer.js';
import { renderLogoMarquee } from './Home scenes/sections/logoMarquee.js';
import { initNavToggle, renderNav } from './Home scenes/sections/nav.js';
import { renderSharedTestimonials } from './Home scenes/sections/sharedTestimonials.js';

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
  subtitle: 'What our clients say about working with Panasa',
  cards: [
    {
      text: "Panasa allows us to focus on growing our brands. With their FinTech expertise, dedication, ability to scale, and meticulous attention to detail, we're able to position ourselves as one of the most cutting-edge groups in payment solutions.",
      name: 'Tom Bishop',
      role: 'Chief Commercial Officer',
      logo: 'assets/logo-globalbank.svg',
      logoAlt: 'GlobalBank',
    },
    {
      text: 'We eliminated multiple vendor relationships by consolidating with Panasa. From development to 24x7 operations, they handle everything with true payment domain expertise.',
      name: 'Sarah Miller',
      role: 'Head of Operations',
      logo: 'assets/logo-segment.svg',
      logoAlt: 'Segment',
    },
    {
      text: 'Panasa gave our team a dependable operating partner that could move from launch planning into live delivery without losing speed or quality.',
      name: 'Priya Menon',
      role: 'Chief Operating Officer',
      logo: 'assets/logo-capsule.svg',
      logoAlt: 'Capsule',
    },
    {
      text: 'Their engineering and operations rhythm reduced handoffs, tightened compliance coordination, and gave us a stronger delivery backbone as we scaled.',
      name: 'James Carter',
      role: 'VP Engineering',
      logo: 'assets/logo-commandr.svg',
      logoAlt: 'Command+R',
    },
  ],
};

const resolveToSiteHref = (href) => {
  if (href === '#about') return 'about.html';
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
});

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
    icon.textContent = isOpen ? 'x' : '+';
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
