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
  return params.get('service') || 'ai-governance';
};

const applyServiceMode = () => {
  const section = document.querySelector('.domains-section');
  const title = section?.querySelector('.section-title h2');
  const kicker = section?.querySelector('.section-kicker');
  const summary = section?.querySelector('.section-head p');
  const content = section?.querySelector('.domains-grid');
  if (!(section && title && kicker && summary && content)) return;

  const mode = getServiceMode();

  if (mode === 'ai-accelerated-fintech-engineering') {
    section.classList.add('domains-section-process');
    kicker.textContent = 'How We Work';
    title.innerHTML = '<em>Five stages</em><span>continuous feedback</span>';
    summary.textContent =
      "No need to hire, train, and manage multiple teams. We're your end-to-end fintech engineering and operations partner.";

    content.innerHTML = `
      <div class="process-grid">
        <div class="process-steps">
          <article class="process-step is-active" data-process-item>
            <button class="process-step-trigger" type="button" data-process-step aria-expanded="true">
              <strong>Stage 1: Scope</strong>
            </button>
            <div class="process-step-panel" data-process-panel>
              <div class="process-step-panel-inner">
                <p>Problem framing, acceptance criteria, scheme rules mapped to requirements</p>
              </div>
            </div>
          </article>
          <article class="process-step" data-process-item>
            <button class="process-step-trigger" type="button" data-process-step aria-expanded="false">
              <strong>Stage 2: Prototype</strong>
            </button>
            <div class="process-step-panel" data-process-panel>
              <div class="process-step-panel-inner">
                <p>Competing approaches built on separate branches. Working code in days, not weeks</p>
              </div>
            </div>
          </article>
          <article class="process-step" data-process-item>
            <button class="process-step-trigger" type="button" data-process-step aria-expanded="false">
              <strong>Stage 3: Validate</strong>
            </button>
            <div class="process-step-panel" data-process-panel>
              <div class="process-step-panel-inner">
                <p>Automated linting, security scans, type checks. Issues caught and fixed before review</p>
              </div>
            </div>
          </article>
          <article class="process-step" data-process-item>
            <button class="process-step-trigger" type="button" data-process-step aria-expanded="false">
              <strong>Stage 4: Test</strong>
            </button>
            <div class="process-step-panel" data-process-panel>
              <div class="process-step-panel-inner">
                <p>AI-generated test suites from acceptance criteria. 80% + coverage enforced at the pipeline level</p>
              </div>
            </div>
          </article>
          <article class="process-step" data-process-item>
            <button class="process-step-trigger" type="button" data-process-step aria-expanded="false">
              <strong>Stage 5: Deploy</strong>
            </button>
            <div class="process-step-panel" data-process-panel>
              <div class="process-step-panel-inner">
                <p>Progressive rollout with canary releases, automated rollback triggers, and full observability</p>
              </div>
            </div>
          </article>
        </div>
        <div class="process-visual-card">
          <img src="assets/about-process-visual.svg" alt="Fintech engineering workflow visual" />
        </div>
      </div>
    `;

    initProcessSteps();
    return;
  }

  if (mode === 'ai-powered-legacy-modernisation') {
    section.classList.add('domains-section-process');
    kicker.textContent = 'How We Work';
    title.innerHTML = '<em>Six Phases</em><span>Every rule traced end to end</span>';
    summary.textContent =
      "We don't rewrite systems from a requirements document. We extract the actual logic from the running system, reconstruct it in a modern stack";

    content.innerHTML = `
      <div class="process-grid">
        <div class="process-steps">
          <article class="process-step is-active" data-process-item>
            <button class="process-step-trigger" type="button" data-process-step aria-expanded="true">
              <strong>Phase 1: Extract</strong>
            </button>
            <div class="process-step-panel" data-process-panel>
              <div class="process-step-panel-inner">
                <p>Parse source code, stored procedures, configs, and runtime behaviour into a structured knowledge base</p>
              </div>
            </div>
          </article>
          <article class="process-step" data-process-item>
            <button class="process-step-trigger" type="button" data-process-step aria-expanded="false">
              <strong>Phase 2: Model</strong>
            </button>
            <div class="process-step-panel" data-process-panel>
              <div class="process-step-panel-inner">
                <p>Reconstruct domain flows, business rules, and dependencies into a traceable system model for migration planning</p>
              </div>
            </div>
          </article>
          <article class="process-step" data-process-item>
            <button class="process-step-trigger" type="button" data-process-step aria-expanded="false">
              <strong>Phase 3: Decompose</strong>
            </button>
            <div class="process-step-panel" data-process-panel>
              <div class="process-step-panel-inner">
                <p>Split monolithic workflows into services, bounded contexts, and reusable components mapped to the new target architecture</p>
              </div>
            </div>
          </article>
          <article class="process-step" data-process-item>
            <button class="process-step-trigger" type="button" data-process-step aria-expanded="false">
              <strong>Phase 4: Generate</strong>
            </button>
            <div class="process-step-panel" data-process-panel>
              <div class="process-step-panel-inner">
                <p>Generate modern code, APIs, test cases, and migration scaffolding aligned to the extracted business logic</p>
              </div>
            </div>
          </article>
          <article class="process-step" data-process-item>
            <button class="process-step-trigger" type="button" data-process-step aria-expanded="false">
              <strong>Phase 5: Validate</strong>
            </button>
            <div class="process-step-panel" data-process-panel>
              <div class="process-step-panel-inner">
                <p>Cross-check parity between legacy and modernised flows through automated testing, rule comparisons, and operator review</p>
              </div>
            </div>
          </article>
          <article class="process-step" data-process-item>
            <button class="process-step-trigger" type="button" data-process-step aria-expanded="false">
              <strong>Phase 6: Roll out</strong>
            </button>
            <div class="process-step-panel" data-process-panel>
              <div class="process-step-panel-inner">
                <p>Release in controlled stages with migration checkpoints, rollback coverage, and production monitoring from day one</p>
              </div>
            </div>
          </article>
        </div>
        <div class="process-visual-card">
          <img src="assets/about-process-visual.svg" alt="Legacy modernisation workflow visual" />
        </div>
      </div>
    `;

    initProcessSteps();
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
  initScrollAnimations();
  document
    .querySelector('[data-service-trusted-logos]')
    ?.classList.add('logo-marquee', 'logo-marquee-light');
  renderLogoMarquee('[data-service-trusted-logos]', TRUSTED_LOGOS);
  applyServiceMode();

  try {
    const content = await loadContent();
    renderNav(buildNav(content.nav));
    renderFooter(buildFooterLinks(content.footer));
  } catch (error) {
    console.error('Failed to load shared service page content', error);
    if (window.DEFAULT_CONTENT?.nav) renderNav(buildNav(window.DEFAULT_CONTENT.nav));
    if (window.DEFAULT_CONTENT?.footer) {
      renderFooter(buildFooterLinks(window.DEFAULT_CONTENT.footer));
    }
  }
};

initServicesPage();
