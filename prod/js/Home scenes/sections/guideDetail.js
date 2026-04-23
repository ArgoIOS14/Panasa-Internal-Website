import { createEl, setText } from '../utils/dom.js';

/* Guide body reuses the same CMS-authored HTML block type as blog detail.
   Sanitise with DOMPurify; fall back to stripping tags if the CDN fails. */
const sanitizerPromise = import('https://cdn.jsdelivr.net/npm/dompurify@3.1.6/+esm')
  .then((mod) => mod.default || mod)
  .catch((err) => {
    console.warn('[guideDetail] DOMPurify failed to load; HTML blocks will render as plain text', err);
    return null;
  });

const CATEGORY_CLASS_MAP = {
  'Blog': 'resource-tag-blog',
  'Blogs': 'resource-tag-blog',
  'Insights': 'resource-tag-insights',
  'Insight': 'resource-tag-insights',
  'Guide': 'resource-tag-guide',
  'Guides': 'resource-tag-guide',
  'Case Study': 'resource-tag-case-study',
  'Case Studies': 'resource-tag-case-study',
};

const tagClassFor = (category) =>
  CATEGORY_CLASS_MAP[category] || 'resource-tag-guide';

const categoryLabel = (category) => (category || '').toUpperCase();

const READMORE_ARROW_BY_CATEGORY = {
  'Blog':         'readmore-blog.svg',
  'Blogs':        'readmore-blog.svg',
  'Insights':     'readmore-insights.svg',
  'Insight':      'readmore-insights.svg',
  'Guide':        'readmore-guide.svg',
  'Guides':       'readmore-guide.svg',
  'Case Study':   'readmore-casestudies.svg',
  'Case Studies': 'readmore-casestudies.svg',
};
const readMoreArrowFor = (category) =>
  READMORE_ARROW_BY_CATEGORY[category] || 'readmore-blog.svg';

/* Guide pages live one level deep (/guides/<slug>) — same relative-path
   convention as blog detail. */
const resolveRelativePath = (path, fallback = null) => {
  if (!path) return fallback;
  if (path.startsWith('..') || path.startsWith('/') || path.startsWith('http')) return path;
  if (path.startsWith('#')) return path;
  if (path.startsWith('data:')) return path;
  return `../${path}`;
};

/* ── Shared resource card for the "More Guides" grid (same vocabulary as the
   Resources listing). */
const renderResourceCard = (item) => {
  const card = createEl('a', 'resource-card');
  card.href = resolveRelativePath(item.href || 'resources', '../resources');

  const imgWrap = createEl('div', 'resource-card-image');
  if (item.image) {
    const img = createEl('img');
    img.src = resolveRelativePath(item.image, item.image);
    img.alt = item.title || '';
    imgWrap.appendChild(img);
  }
  card.appendChild(imgWrap);

  const body = createEl('div', 'resource-card-body');

  const tag = createEl('span', `resource-tag ${tagClassFor(item.category)}`);
  tag.textContent = categoryLabel(item.category);
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
  readMore.innerHTML = `Read More <img src="../assets/${readMoreArrowFor(item.category)}" alt="" aria-hidden="true" />`;
  body.appendChild(readMore);

  card.appendChild(body);
  return card;
};

/* ── Callout block (same model as blog detail) */
const renderCallout = (block) => {
  const callout = createEl('div', 'blog-callout');
  const copy = createEl('div', 'blog-callout-copy');

  const title = createEl('span', 'blog-callout-title');
  title.textContent = block.title || '';
  copy.appendChild(title);

  if (block.text) {
    const text = createEl('span', 'blog-callout-text');
    text.textContent = block.text;
    copy.appendChild(text);
  }
  callout.appendChild(copy);

  if (block.cta?.label) {
    const btn = createEl('a', 'blog-callout-cta');
    btn.href = resolveRelativePath(block.cta.href || 'contact', '../contact');

    const variant = (block.cta.variant || '').toLowerCase();
    let resolved = variant;
    if (variant !== 'ghost' && variant !== 'dark') {
      const label = (block.cta.label || '').toLowerCase();
      resolved = (label.includes('view') || label.includes('case study')) ? 'ghost' : 'dark';
    }
    btn.classList.add(`blog-callout-cta--${resolved}`);

    const iconFile = resolved === 'ghost' ? 'casestudy-colored.svg' : 'taltoteam-colored.svg';
    const icon = createEl('img', 'blog-callout-cta-icon');
    icon.src = `../assets/${iconFile}`;
    icon.alt = '';
    icon.setAttribute('aria-hidden', 'true');
    btn.appendChild(icon);

    const label = createEl('span', 'blog-callout-cta-label');
    label.textContent = block.cta.label;
    btn.appendChild(label);

    callout.appendChild(btn);
  }

  return callout;
};

/* ── Rich-HTML block (sanitised) */
const renderHtmlBlock = (block, purifier) => {
  const el = createEl('div', 'blog-body-block');
  const raw = block.content || '';
  if (purifier && typeof purifier.sanitize === 'function') {
    el.innerHTML = purifier.sanitize(raw, { USE_PROFILES: { html: true } });
  } else {
    el.textContent = raw.replace(/<[^>]*>/g, '');
  }
  return el;
};

/* ── Subheading and note variants (guide-specific primitives) */
const renderSubheading = (block) => {
  const h = createEl('h3', 'guide-subheading');
  h.textContent = block.text || '';
  return h;
};

const NOTE_VARIANT_CLASS = {
  'key-insight': 'guide-note--key-insight',
  'practitioner': 'guide-note--practitioner',
  'field': 'guide-note--field',
};

const renderNote = (block) => {
  const variant = (block.variant || 'key-insight').toLowerCase();
  const note = createEl('aside', `guide-note ${NOTE_VARIANT_CLASS[variant] || 'guide-note--key-insight'}`);
  note.setAttribute('role', 'note');

  const body = createEl('div', 'guide-note-body');
  if (block.label) {
    const label = createEl('span', 'guide-note-label');
    label.textContent = block.label;
    body.appendChild(label);
  }
  if (block.text) {
    const p = createEl('p', 'guide-note-text');
    p.textContent = block.text;
    body.appendChild(p);
  }
  note.appendChild(body);
  return note;
};

/* ── Render one child block inside a guide section */
const renderInlineBlock = (block, purifier) => {
  if (!block || !block.type) return null;
  switch (block.type) {
    case 'html':        return renderHtmlBlock(block, purifier);
    case 'callout':     return renderCallout(block);
    case 'note':        return renderNote(block);
    case 'subheading':  return renderSubheading(block);
    default:            return null;
  }
};

/* ── Intro block (above the numbered sections) */
const renderIntro = (intro, purifier) => {
  if (!intro) return null;
  const wrapper = createEl('section', 'guide-intro');
  if (intro.heading) {
    const h = createEl('h2', 'guide-intro-heading');
    h.textContent = intro.heading;
    wrapper.appendChild(h);
  }
  (intro.blocks || []).forEach((block) => {
    const el = renderInlineBlock(block, purifier);
    if (el) wrapper.appendChild(el);
  });
  return wrapper;
};

/* ── One numbered guide section */
const renderSection = (section, purifier) => {
  const wrapper = createEl('section', 'guide-section');
  if (section.slug) wrapper.id = section.slug;
  wrapper.setAttribute('data-guide-section', section.slug || '');

  const title = createEl('h2', 'guide-section-title');
  if (typeof section.number === 'number') {
    const num = createEl('span', 'guide-section-number');
    num.textContent = `${section.number}.`;
    title.appendChild(num);
  }
  const label = document.createTextNode(section.title || '');
  title.appendChild(label);
  wrapper.appendChild(title);

  (section.blocks || []).forEach((block) => {
    const el = renderInlineBlock(block, purifier);
    if (el) wrapper.appendChild(el);
  });
  return wrapper;
};

const renderGuideBody = async (data) => {
  const bodyEl = document.querySelector('[data-guide-body]');
  if (!bodyEl) return;

  const sections = Array.isArray(data.sections) ? data.sections : [];
  const intro = data.introduction;

  const needsPurifier =
    (intro?.blocks || []).some((b) => b?.type === 'html') ||
    sections.some((s) => (s.blocks || []).some((b) => b?.type === 'html'));
  const purifier = needsPurifier ? await sanitizerPromise : null;

  bodyEl.innerHTML = '';

  const introEl = renderIntro(intro, purifier);
  if (introEl) bodyEl.appendChild(introEl);

  sections.forEach((section) => {
    const el = renderSection(section, purifier);
    if (el) bodyEl.appendChild(el);
  });
};

/* ── Sticky section-tabs strip: renders tabs from the sections array and
   wires click-to-scroll + IntersectionObserver-driven active highlight. */
const renderSectionTabs = (data) => {
  const tabsEl = document.querySelector('[data-guide-tabs]');
  if (!tabsEl) return;
  const sections = Array.isArray(data.sections) ? data.sections : [];
  if (!sections.length) {
    tabsEl.hidden = true;
    return;
  }
  tabsEl.hidden = false;

  const inner = createEl('div', 'guide-section-tabs-inner');
  const tabsBySlug = new Map();

  const setActive = (slug) => {
    tabsBySlug.forEach((tab, s) => {
      tab.classList.toggle('is-active', s === slug);
    });
  };

  sections.forEach((section, idx) => {
    const slug = section.slug || `section-${idx + 1}`;
    const tab = createEl('a', 'guide-section-tab');
    tab.href = `#${slug}`;
    tab.dataset.guideTab = slug;

    const num = createEl('span', 'guide-section-tab-number');
    num.textContent = String(section.number ?? idx + 1);
    const label = createEl('span', 'guide-section-tab-label');
    label.textContent = (section.title || '').toUpperCase();
    tab.append(num, label);

    tab.addEventListener('click', (event) => {
      event.preventDefault();
      // Highlight immediately so the click feels responsive — observer will
      // confirm the selection once the scroll settles.
      setActive(slug);
      const target = document.getElementById(slug);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.replaceState(null, '', `#${slug}`);
      }
    });
    inner.appendChild(tab);
    tabsBySlug.set(slug, tab);
  });

  tabsEl.innerHTML = '';
  tabsEl.appendChild(inner);

  setActive(sections[0].slug);

  // IntersectionObserver for active-tab highlight. rootMargin top bias so
  // the section is considered "active" slightly before its heading hits the
  // viewport edge — matches expected reading cadence.
  if (!('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver((entries) => {
    // Pick the entry closest to the top that is intersecting
    const visible = entries
      .filter((e) => e.isIntersecting)
      .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
    if (visible[0]) {
      const slug = visible[0].target.getAttribute('data-guide-section');
      if (slug) setActive(slug);
    }
  }, {
    rootMargin: '-20% 0px -60% 0px',
    threshold: 0,
  });

  sections.forEach((section) => {
    const el = document.getElementById(section.slug);
    if (el) observer.observe(el);
  });
};

/* ── Share buttons (same pattern as blog detail) */
const buildShareUrls = (title) => {
  const url = encodeURIComponent(window.location.href);
  const text = encodeURIComponent(title || document.title || '');
  return {
    twitter: `https://x.com/intent/tweet?url=${url}&text=${text}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
  };
};

const wireShare = (title) => {
  const shareUrls = buildShareUrls(title);

  const copyBtn = document.querySelector('[data-share="copy"]');
  if (copyBtn instanceof HTMLElement) {
    copyBtn.setAttribute('aria-live', 'polite');
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(window.location.href);
      } catch (err) {
        const temp = document.createElement('textarea');
        temp.value = window.location.href;
        document.body.appendChild(temp);
        temp.select();
        try { document.execCommand('copy'); } catch (_) {}
        document.body.removeChild(temp);
      }
      // Update only the label span so the leading icon is preserved.
      const labelEl = copyBtn.querySelector('[data-share-label]') || copyBtn;
      const originalLabel = copyBtn.dataset.originalLabel || labelEl.textContent || 'Copy Link';
      copyBtn.dataset.originalLabel = originalLabel;
      labelEl.textContent = 'Copied ✓';
      copyBtn.classList.add('is-copied');
      window.setTimeout(() => {
        labelEl.textContent = originalLabel;
        copyBtn.classList.remove('is-copied');
      }, 1500);
    });
  }

  const twitterLink = document.querySelector('[data-share="twitter"]');
  if (twitterLink instanceof HTMLAnchorElement) twitterLink.href = shareUrls.twitter;

  const linkedinLink = document.querySelector('[data-share="linkedin"]');
  if (linkedinLink instanceof HTMLAnchorElement) linkedinLink.href = shareUrls.linkedin;
};

/* ── Hero image (same srcset wiring as blog detail) */
const wireHeroImage = (data) => {
  const img = document.querySelector('[data-guide-hero-image]');
  if (!(img instanceof HTMLImageElement)) return;

  if (data.heroImage) img.src = data.heroImage;
  if (data.heroImageAlt) img.alt = data.heroImageAlt;
  else if (data.title) img.alt = data.title;

  const sources = [];
  if (data.heroImageMobile) sources.push(`${data.heroImageMobile} 640w`);
  if (data.heroImageTablet) sources.push(`${data.heroImageTablet} 900w`);
  if (data.heroImage) sources.push(`${data.heroImage} 1440w`);
  if (sources.length > 1) {
    img.srcset = sources.join(', ');
    img.sizes = '(max-width: 640px) 260px, (max-width: 900px) 320px, 320px';
  }
};

/* ── Hero title: replaces title text while preserving the accent highlight
   span if titleHighlight is supplied. */
const wireHeroTitle = (data) => {
  const titleEl = document.querySelector('[data-guide-title]');
  if (!titleEl) return;
  const full = data.title || '';
  const accent = data.titleHighlight;
  titleEl.innerHTML = '';
  if (accent && full.includes(accent)) {
    const beforeText = full.slice(0, full.indexOf(accent));
    const before = document.createTextNode(beforeText);
    const span = createEl('span', 'guide-hero-title-accent');
    span.textContent = accent;
    titleEl.append(before, span);
  } else {
    titleEl.textContent = full;
  }
};

/* ── Related items for "More Guides" grid — prefers relatedSlugs, falls back
   to same-category items from Resources index. */
const resolveRelated = (guideData, resourcesData) => {
  const items = resourcesData?.items || [];
  const currentSlug = guideData.slug;

  if (Array.isArray(guideData.relatedSlugs) && guideData.relatedSlugs.length) {
    const mapped = guideData.relatedSlugs
      .map((slug) => items.find((item) => item.slug === slug))
      .filter(Boolean);
    if (mapped.length) return mapped.slice(0, 3);
  }

  const norm = (v) => String(v || '').toLowerCase().replace(/s$/, '');
  const currentCat = guideData.category || 'Guide';
  const notSelf = items.filter((item) => item.slug !== currentSlug);
  const sameCat = notSelf.filter((item) => norm(item.category) === norm(currentCat));
  const rest = notSelf.filter((item) => norm(item.category) !== norm(currentCat));
  return [...sameCat, ...rest].slice(0, 3);
};

/* ── SEO meta helpers (same behaviour as blog detail) */
const setMeta = (selector, value) => {
  if (!value) return;
  const el = document.querySelector(selector);
  if (el) el.setAttribute('content', value);
};

const ensureMeta = (attr, name, value) => {
  if (!value) return;
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', value);
};

const setLinkRel = (rel, href) => {
  if (!href) return;
  let el = document.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
};

const updateSeoMeta = (data) => {
  const title = data.meta?.title || data.title;
  const description = data.meta?.description;
  const url = data.meta?.canonical || window.location.href.split('#')[0].split('?')[0];
  const image = data.meta?.ogImage || 'https://www.panasatech.com/assets/blog-hero-desktop.webp';

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
  setLinkRel('canonical', url);

  ensureMeta('property', 'og:type', 'article');
  if (data.datePublished) ensureMeta('property', 'article:published_time', data.datePublished);
  if (data.dateModified || data.datePublished) {
    ensureMeta('property', 'article:modified_time', data.dateModified || data.datePublished);
  }
  if (data.author) ensureMeta('property', 'article:author', data.author);
  const section = data.category || data.tag;
  if (section) ensureMeta('property', 'article:section', section);
  if (Array.isArray(data.tags)) {
    document.querySelectorAll('meta[property="article:tag"]').forEach((el) => el.remove());
    data.tags.forEach((t) => {
      if (!t) return;
      const m = document.createElement('meta');
      m.setAttribute('property', 'article:tag');
      m.setAttribute('content', t);
      document.head.appendChild(m);
    });
  }
};

const updateJsonLdArticle = (data) => {
  const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
  const match = scripts.find((s) => {
    try {
      const obj = JSON.parse(s.textContent || '{}');
      return obj && (obj['@type'] === 'TechArticle' || obj['@type'] === 'Article' || obj['@type'] === 'BlogPosting');
    } catch (_) { return false; }
  });
  if (!match) return;

  try {
    const obj = JSON.parse(match.textContent || '{}');
    if (data.title) obj.headline = data.title;
    if (data.meta?.description) obj.description = data.meta.description;
    if (data.datePublished) obj.datePublished = data.datePublished;
    if (data.dateModified || data.datePublished) obj.dateModified = data.dateModified || data.datePublished;
    if (data.category || data.tag) obj.articleSection = data.category || data.tag;
    if (data.meta?.ogImage) obj.image = data.meta.ogImage;
    const canonical = data.meta?.canonical;
    if (canonical) obj.mainEntityOfPage = canonical;
    if (data.author) {
      obj.author = { '@type': 'Person', name: data.author };
    }
    match.textContent = JSON.stringify(obj);
  } catch (err) {
    console.warn('[guideDetail] could not update JSON-LD', err);
  }
};

/* ── Main renderer */
export const renderGuideDetail = (data, resourcesData) => {
  if (!data) return;

  updateSeoMeta(data);
  updateJsonLdArticle(data);

  // Hero
  const tagEl = document.querySelector('[data-guide-tag]');
  if (tagEl) {
    tagEl.textContent = data.tag || 'GUIDE';
    const tagCategory = data.category || 'Guide';
    tagEl.className = `resource-tag ${tagClassFor(tagCategory)}`;
  }
  wireHeroTitle(data);
  setText('[data-guide-description]', data.description);
  setText('[data-guide-date]', data.date);
  setText('[data-guide-read-time]', data.readTime);
  setText('[data-guide-author]', data.author || 'Panasa Team');
  wireHeroImage(data);

  // Section tabs (sticky scroll-spy)
  renderSectionTabs(data);

  // Body (async — DOMPurify awaited only when html blocks exist)
  renderGuideBody(data);

  // Share buttons
  wireShare(data.title);

  // More Guides grid
  const moreEl = document.querySelector('[data-more-guides]');
  if (moreEl) {
    moreEl.innerHTML = '';
    const related = resolveRelated(data, resourcesData);
    related.forEach((item) => moreEl.appendChild(renderResourceCard(item)));

    const moreSection = moreEl.closest('.more-blogs');
    if (moreSection instanceof HTMLElement) {
      moreSection.hidden = related.length === 0;
    }
  }
};
