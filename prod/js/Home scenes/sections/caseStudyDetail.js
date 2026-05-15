import { createEl, setText } from '../utils/dom.js';
import { renderBentoGrid } from '../components/bento-grid.js';

/* Case Study Detail renderer.
   - Mirrors the blogDetail / guideDetail data flow (JSON in, DOM out).
   - Builds a sectioned page from data.sections[] in order, so the admin can
     rearrange or omit any section without code changes.
   - Includes a shared "More Case Studies" grid powered by Resources index. */

const sanitizerPromise = import('https://cdn.jsdelivr.net/npm/dompurify@3.1.6/+esm')
  .then((mod) => mod.default || mod)
  .catch((err) => {
    console.warn('[caseStudyDetail] DOMPurify failed to load; HTML blocks will render as plain text', err);
    return null;
  });

const resolveAsset = (path) => {
  if (!path) return path;
  if (path.startsWith('..') || path.startsWith('/') || path.startsWith('http') || path.startsWith('data:')) return path;
  return `../${path}`;
};

const resolveLink = (href, fallback = null) => {
  if (!href) return fallback;
  if (href.startsWith('..') || href.startsWith('/') || href.startsWith('http') || href.startsWith('#') || href.startsWith('data:')) return href;
  return `../${href}`;
};

/* ── SEO: keep <title>/<meta>/JSON-LD in sync with JSON content. */
const setMeta = (selector, value) => {
  if (!value) return;
  const el = document.querySelector(selector);
  if (el) el.setAttribute('content', value);
};

const updateSeoMeta = (data) => {
  const title = data.meta?.title || data.hero?.title;
  const description = data.meta?.description;
  const url = data.meta?.canonical || window.location.href.split('#')[0].split('?')[0];
  const image = data.meta?.ogImage || 'https://www.panasatech.com/assets/og-image.png';

  if (title) {
    document.title = title;
    setMeta('meta[property="og:title"]', title);
    setMeta('meta[name="twitter:title"]', title);
  }
  if (description) {
    setMeta('meta[name="description"]', description);
    setMeta('meta[property="og:description"]', description);
    setMeta('meta[name="twitter:description"]', description);
  }
  setMeta('meta[property="og:url"]', url);
  setMeta('meta[property="og:image"]', image);
  setMeta('meta[name="twitter:image"]', image);
};

/* ── Hero (dark green client card with eyebrow + title + accent + logo). */
const renderHero = (hero) => {
  if (!hero) return;
  setText('[data-case-eyebrow]', hero.eyebrow || 'CASE STUDY');

  const titleEl = document.querySelector('[data-case-title]');
  if (titleEl) {
    titleEl.textContent = '';
    if (hero.title) {
      titleEl.appendChild(document.createTextNode(hero.title));
    }
    if (hero.titleAccent) {
      if (hero.title) titleEl.appendChild(document.createTextNode(' '));
      const accent = createEl('span', 'case-hero-title-accent');
      accent.textContent = hero.titleAccent;
      titleEl.appendChild(accent);
    }
    if (hero.titleSuffix) {
      titleEl.appendChild(document.createTextNode(' ' + hero.titleSuffix));
    }
  }

  const cardEl = document.querySelector('[data-case-hero-card]');
  if (cardEl && hero.background) {
    cardEl.style.backgroundImage = `url("${resolveAsset(hero.background)}")`;
  }
};

/* ── Meta tiles strip (icon + label + value, 1–5 tiles). */
const renderMetaTiles = (tiles) => {
  const root = document.querySelector('[data-case-meta-tiles]');
  if (!root) return;
  root.innerHTML = '';
  const list = Array.isArray(tiles) ? tiles.slice(0, 5) : [];
  if (!list.length) {
    root.hidden = true;
    return;
  }
  root.hidden = false;
  list.forEach((tile) => {
    const item = createEl('div', 'case-meta-tile');
    if (tile.icon) {
      const wrap = createEl('span', 'case-meta-tile-icon');
      const img = createEl('img');
      img.src = resolveAsset(tile.icon);
      img.alt = '';
      img.setAttribute('aria-hidden', 'true');
      wrap.appendChild(img);
      item.appendChild(wrap);
    }
    if (tile.label) {
      const label = createEl('span', 'case-meta-tile-label');
      label.textContent = tile.label;
      item.appendChild(label);
    }
    if (tile.value) {
      const value = createEl('strong', 'case-meta-tile-value');
      value.textContent = tile.value;
      item.appendChild(value);
    }
    root.appendChild(item);
  });
};

/* ── Section header (title + optional summary). Returns a fragment that
     section renderers prepend to their own content. */
const renderSectionHeader = (section) => {
  const head = createEl('header', 'case-section-head');
  if (section.title) {
    const h2 = createEl('h2', 'case-section-title');
    h2.textContent = section.title;
    head.appendChild(h2);
  }
  if (section.summary) {
    const p = createEl('p', 'case-section-summary');
    p.textContent = section.summary;
    head.appendChild(p);
  }
  return head;
};

/* ── Sanitised HTML block for prose sections (overview, conclusion). */
const renderHtml = (raw, purifier) => {
  const el = createEl('div', 'case-prose');
  const html = raw || '';
  if (purifier && typeof purifier.sanitize === 'function') {
    el.innerHTML = purifier.sanitize(html, { USE_PROFILES: { html: true } });
  } else {
    el.textContent = html.replace(/<[^>]*>/g, '');
  }
  return el;
};

const renderOverview = (section, purifier) => {
  const wrap = createEl('section', 'case-section case-section--overview');
  wrap.appendChild(renderSectionHeader(section));
  wrap.appendChild(renderHtml(section.body, purifier));
  return wrap;
};

const renderConclusion = (section, purifier) => {
  const wrap = createEl('section', 'case-section case-section--conclusion');
  wrap.appendChild(renderSectionHeader(section));
  wrap.appendChild(renderHtml(section.body, purifier));
  return wrap;
};

/* ── Card grid (e.g. Business Challenge): icon + title + body, 2–4 cards. */
const renderCardGrid = (section) => {
  const wrap = createEl('section', 'case-section case-section--cards');
  wrap.appendChild(renderSectionHeader(section));

  const grid = createEl('div', 'case-card-grid');
  grid.dataset.count = String((section.items || []).length);
  (section.items || []).forEach((item) => {
    const card = createEl('article', 'case-card');
    if (item.icon) {
      const iconWrap = createEl('span', 'case-card-icon');
      const img = createEl('img');
      img.src = resolveAsset(item.icon);
      img.alt = '';
      img.setAttribute('aria-hidden', 'true');
      iconWrap.appendChild(img);
      card.appendChild(iconWrap);
    }
    if (item.title) {
      const t = createEl('h3', 'case-card-title');
      t.textContent = item.title;
      card.appendChild(t);
    }
    if (item.body) {
      const b = createEl('p', 'case-card-body');
      b.textContent = item.body;
      card.appendChild(b);
    }
    grid.appendChild(card);
  });
  wrap.appendChild(grid);
  return wrap;
};

/* ── Pillar grid (Solution Brief): label "PILLAR XX" + title + body. */
const renderPillarGrid = (section) => {
  const wrap = createEl('section', 'case-section case-section--pillars');
  wrap.appendChild(renderSectionHeader(section));
  const grid = createEl('div', 'case-pillar-grid');
  grid.dataset.count = String((section.items || []).length);
  (section.items || []).forEach((item, idx) => {
    const card = createEl('article', 'case-pillar');
    const label = createEl('span', 'case-pillar-label');
    label.textContent = item.label || `PILLAR ${String(idx + 1).padStart(2, '0')}`;
    card.appendChild(label);
    if (item.title) {
      const t = createEl('h3', 'case-pillar-title');
      t.textContent = item.title;
      card.appendChild(t);
    }
    if (item.body) {
      const b = createEl('p', 'case-pillar-body');
      b.textContent = item.body;
      card.appendChild(b);
    }
    grid.appendChild(card);
  });
  wrap.appendChild(grid);
  return wrap;
};

/* ── Mint or salmon callout (CTA optional — salmon variant skips the button). */
const renderCallout = (section) => {
  const variant = section.variant === 'salmon' ? 'salmon' : 'mint';
  const wrap = createEl('aside', `case-callout case-callout--${variant}`);

  const copy = createEl('div', 'case-callout-copy');
  if (section.title) {
    const t = createEl('span', 'case-callout-title');
    t.textContent = section.title;
    copy.appendChild(t);
  }
  if (section.text) {
    const p = createEl('span', 'case-callout-text');
    p.textContent = section.text;
    copy.appendChild(p);
  }
  wrap.appendChild(copy);

  if (variant === 'mint' && section.cta?.label) {
    const btn = createEl('a', 'case-callout-cta');
    btn.href = resolveLink(section.cta.href || 'contact', '../contact');
    const ctaVariant = (section.cta.variant || '').toLowerCase();
    let resolved = ctaVariant;
    if (ctaVariant !== 'ghost' && ctaVariant !== 'dark') {
      const lbl = (section.cta.label || '').toLowerCase();
      resolved = (lbl.includes('view') || lbl.includes('case study')) ? 'ghost' : 'dark';
    }
    btn.classList.add(`case-callout-cta--${resolved}`);

    const iconFile = resolved === 'ghost' ? 'casestudy-colored.svg' : 'taltoteam-colored.svg';
    const icon = createEl('img', 'case-callout-cta-icon');
    icon.src = `../assets/${iconFile}`;
    icon.alt = '';
    icon.setAttribute('aria-hidden', 'true');
    btn.appendChild(icon);
    const lbl = createEl('span', 'case-callout-cta-label');
    lbl.textContent = section.cta.label;
    btn.appendChild(lbl);
    wrap.appendChild(btn);
  }

  return wrap;
};

/* ── Approach (toggleable: horizontal numbered steps OR shared bento grid). */
const renderApproach = (section) => {
  const wrap = createEl('section', 'case-section case-section--approach');
  wrap.appendChild(renderSectionHeader(section));

  const mode = section.renderMode === 'bento' ? 'bento' : 'steps';
  wrap.dataset.renderMode = mode;

  if (mode === 'bento') {
    wrap.appendChild(renderBentoGrid(section.bento || [], { variant: 'approach' }));
    return wrap;
  }

  const card = createEl('div', 'case-approach-card');
  const summary = section.cardSummary || section.cardEyebrow;
  if (summary) {
    const head = createEl('div', 'case-approach-card-head');
    if (section.cardEyebrow) {
      const e = createEl('span', 'case-approach-card-eyebrow');
      e.textContent = section.cardEyebrow;
      head.appendChild(e);
    }
    if (section.cardSummary) {
      const p = createEl('p', 'case-approach-card-summary');
      p.textContent = section.cardSummary;
      head.appendChild(p);
    }
    card.appendChild(head);
  }
  const flow = createEl('div', 'case-approach-flow');
  flow.dataset.count = String((section.steps || []).length);
  (section.steps || []).forEach((step, idx) => {
    const item = createEl('div', 'case-approach-step');
    const num = createEl('span', 'case-approach-step-num');
    num.textContent = step.index || String(idx + 1).padStart(2, '0');
    item.appendChild(num);
    if (step.title) {
      const t = createEl('strong', 'case-approach-step-title');
      t.textContent = step.title;
      item.appendChild(t);
    }
    if (step.body) {
      const b = createEl('p', 'case-approach-step-body');
      b.textContent = step.body;
      item.appendChild(b);
    }
    flow.appendChild(item);
  });
  card.appendChild(flow);
  wrap.appendChild(card);
  return wrap;
};

/* ── Tech Stack: grouped logo rows. */
const renderTechStack = (section) => {
  const wrap = createEl('section', 'case-section case-section--tech');
  wrap.appendChild(renderSectionHeader(section));
  const groups = createEl('div', 'case-tech-groups');
  (section.groups || []).forEach((group) => {
    const col = createEl('div', 'case-tech-group');
    if (group.label) {
      const label = createEl('span', 'case-tech-group-label');
      label.textContent = group.label;
      col.appendChild(label);
    }
    if (Array.isArray(group.logos) && group.logos.length) {
      const row = createEl('div', 'case-tech-logos');
      group.logos.forEach((logo) => {
        const tile = createEl('span', 'case-tech-logo');
        const img = createEl('img');
        img.src = resolveAsset(typeof logo === 'string' ? logo : logo.src);
        img.alt = (typeof logo === 'object' && logo.alt) ? logo.alt : '';
        tile.appendChild(img);
        row.appendChild(tile);
      });
      col.appendChild(row);
    } else if (group.description) {
      const desc = createEl('p', 'case-tech-description');
      desc.textContent = group.description;
      col.appendChild(desc);
    }
    groups.appendChild(col);
  });
  wrap.appendChild(groups);
  return wrap;
};

/* ── Business Impact grid: title + metric + label + tag chip, 1–6 cards. */
const renderImpactGrid = (section) => {
  const wrap = createEl('section', 'case-section case-section--impact');
  wrap.appendChild(renderSectionHeader(section));
  const grid = createEl('div', 'case-impact-grid');
  grid.dataset.count = String((section.items || []).length);
  (section.items || []).forEach((item) => {
    const card = createEl('article', 'case-impact-card');
    if (item.title) {
      const t = createEl('h3', 'case-impact-card-title');
      t.textContent = item.title;
      card.appendChild(t);
    }
    if (item.metric) {
      const m = createEl('strong', 'case-impact-card-metric');
      m.textContent = item.metric;
      card.appendChild(m);
    }
    if (item.label) {
      const l = createEl('p', 'case-impact-card-label');
      l.textContent = item.label;
      card.appendChild(l);
    }
    if (item.tag) {
      const tag = createEl('span', 'case-impact-card-tag');
      tag.textContent = item.tag;
      card.appendChild(tag);
    }
    grid.appendChild(card);
  });
  wrap.appendChild(grid);
  return wrap;
};

/* ── Differentiators: shared bento grid (1–5 mixed-media tiles). */
const renderDifferentiators = (section) => {
  const wrap = createEl('section', 'case-section case-section--differentiators');
  wrap.appendChild(renderSectionHeader(section));
  wrap.appendChild(renderBentoGrid(section.tiles || [], { variant: 'differentiators' }));
  return wrap;
};

const SECTION_RENDERERS = {
  overview: renderOverview,
  conclusion: renderConclusion,
  cardGrid: renderCardGrid,
  pillarGrid: renderPillarGrid,
  callout: renderCallout,
  approach: renderApproach,
  techStack: renderTechStack,
  impactGrid: renderImpactGrid,
  differentiators: renderDifferentiators,
};

const renderSections = async (data) => {
  const root = document.querySelector('[data-case-sections]');
  if (!root) return;
  const sections = Array.isArray(data.sections) ? data.sections : [];
  const hasHtml = sections.some(
    (s) => (s?.type === 'overview' || s?.type === 'conclusion') && /<\w+/.test(s.body || ''),
  );
  const purifier = hasHtml ? await sanitizerPromise : null;

  root.innerHTML = '';
  sections.forEach((section) => {
    if (!section || !section.type) return;
    const renderer = SECTION_RENDERERS[section.type];
    if (!renderer) return;
    /* purifier is only forwarded to renderers that need it. */
    const node = renderer.length === 2 ? renderer(section, purifier) : renderer(section);
    if (node) root.appendChild(node);
  });
};

/* ── Share buttons (delegates to the shared blog-style data attributes). */
const wireShare = (title) => {
  const url = encodeURIComponent(window.location.href);
  const text = encodeURIComponent(title || document.title || '');

  const copyBtn = document.querySelector('[data-share="copy"]');
  if (copyBtn instanceof HTMLElement) {
    copyBtn.setAttribute('aria-live', 'polite');
    copyBtn.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(window.location.href); }
      catch (_) {
        const tmp = document.createElement('textarea');
        tmp.value = window.location.href;
        document.body.appendChild(tmp);
        tmp.select();
        try { document.execCommand('copy'); } catch (__) {}
        document.body.removeChild(tmp);
      }
      const labelEl = copyBtn.querySelector('[data-share-label]') || copyBtn;
      const original = copyBtn.dataset.originalLabel || labelEl.textContent || 'Copy Link';
      copyBtn.dataset.originalLabel = original;
      labelEl.textContent = 'Copied ✓';
      copyBtn.classList.add('is-copied');
      window.setTimeout(() => {
        labelEl.textContent = original;
        copyBtn.classList.remove('is-copied');
      }, 1500);
    });
  }

  const twitter = document.querySelector('[data-share="twitter"]');
  if (twitter instanceof HTMLAnchorElement) {
    twitter.href = `https://x.com/intent/tweet?url=${url}&text=${text}`;
  }
  const linkedin = document.querySelector('[data-share="linkedin"]');
  if (linkedin instanceof HTMLAnchorElement) {
    linkedin.href = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
  }
};

/* ── More Case Studies grid (reuses .resource-card vocabulary). */
const renderMoreCaseStudies = (data, resourcesData) => {
  const root = document.querySelector('[data-more-case-studies]');
  if (!root) return;
  const items = (resourcesData?.items || []).filter(
    (item) => /case/i.test(item.category || '') && item.slug !== data.slug,
  );

  const explicit = Array.isArray(data.relatedSlugs) && data.relatedSlugs.length
    ? data.relatedSlugs
        .map((slug) => (resourcesData?.items || []).find((item) => item.slug === slug))
        .filter(Boolean)
    : [];

  const ordered = (explicit.length ? explicit : items).slice(0, 3);

  root.innerHTML = '';
  ordered.forEach((item) => {
    const card = createEl('a', 'resource-card resource-card--case-study');
    card.href = resolveLink(item.href || 'resources', '../resources');

    const imgWrap = createEl('div', 'resource-card-image');
    if (item.image) {
      const img = createEl('img');
      img.src = resolveAsset(item.image);
      img.alt = item.title || '';
      imgWrap.appendChild(img);
    }
    card.appendChild(imgWrap);

    const body = createEl('div', 'resource-card-body');
    const tag = createEl('span', 'resource-tag resource-tag-case-study');
    tag.textContent = (item.category || 'Case Study').toUpperCase();
    body.appendChild(tag);

    const h3 = createEl('h3', 'resource-card-title');
    h3.textContent = item.title || '';
    body.appendChild(h3);

    const p = createEl('p', 'resource-card-excerpt');
    p.textContent = item.excerpt || '';
    body.appendChild(p);

    const meta = createEl('div', 'resource-card-meta');
    const date = createEl('span', 'resource-card-date');
    date.textContent = item.date || '';
    const dot = createEl('span', 'resource-card-meta-dot');
    dot.textContent = '•';
    const author = createEl('span', 'resource-card-author');
    author.textContent = item.author || '';
    meta.append(date, dot, author);
    body.appendChild(meta);

    const readMore = createEl('span', 'resource-card-read-more');
    readMore.innerHTML = `Read More <img src="../assets/readmore-casestudies.svg" alt="" aria-hidden="true" />`;
    body.appendChild(readMore);

    card.appendChild(body);
    root.appendChild(card);
  });

  const wrap = root.closest('.more-blogs');
  if (wrap instanceof HTMLElement) wrap.hidden = ordered.length === 0;
};

export const renderCaseStudyDetail = (data, resourcesData) => {
  if (!data) return;

  updateSeoMeta(data);
  renderHero(data.hero);
  renderMetaTiles(data.metaTiles);
  renderSections(data);
  wireShare(data.hero?.title);

  if (data.newsletter) {
    setText('[data-case-newsletter-eyebrow]', data.newsletter.eyebrow);
    setText('[data-case-newsletter-title]',   data.newsletter.title);
    setText('[data-case-newsletter-accent]',  data.newsletter.titleAccent);
    /* `description` is the new field; fall back to `subtitle` for older content. */
    setText('[data-case-newsletter-subtitle]', data.newsletter.description || data.newsletter.subtitle);
    setText('[data-case-newsletter-note]',    data.newsletter.formNote);
    setText('[data-case-newsletter-submit]',  data.newsletter.submitLabel);
    const input = document.querySelector('[data-case-newsletter] input[type="email"]');
    if (input instanceof HTMLInputElement && data.newsletter.placeholder) {
      input.placeholder = data.newsletter.placeholder;
    }
  }

  renderMoreCaseStudies(data, resourcesData);
};
