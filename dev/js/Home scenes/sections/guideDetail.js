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

const categoryLabel = (category) => {
  const label = String(category || '').toUpperCase();
  return label === 'INSIGHTS' ? 'INSIGHT' : label;
};

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

const CARD_MODIFIER_BY_CATEGORY = {
  'Blog':         'blog',
  'Blogs':        'blog',
  'Insights':     'insights',
  'Insight':      'insights',
  'Guide':        'guide',
  'Guides':       'guide',
  'Case Study':   'case-study',
  'Case Studies': 'case-study',
};
const cardModifierFor = (category) =>
  CARD_MODIFIER_BY_CATEGORY[category] || 'blog';

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
  const card = createEl('a', `resource-card resource-card--${cardModifierFor(item.category)}`);
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

/* AbortController held across renderSectionTabs() calls so that a
   subsequent render (e.g. fresh CMS fetch landing after the fallback
   already painted) cleans up the previous batch's window-level listeners.
   Without this each render leaks one scroll + one resize listener bound
   to a stale tabsBySlug map. */
let tabsAbortController = null;

/* ── Sticky section-tabs strip: renders tabs from the sections array and
   wires click-to-scroll + scroll-driven active highlight. Idempotent —
   safe to call repeatedly when content re-renders. */
const renderSectionTabs = (data) => {
  const tabsEl = document.querySelector('[data-guide-tabs]');
  if (!tabsEl) return;
  const sections = Array.isArray(data.sections) ? data.sections : [];

  // Clean up listeners from any previous render before wiring fresh ones.
  if (tabsAbortController) tabsAbortController.abort();
  tabsAbortController = new AbortController();
  const { signal } = tabsAbortController;

  if (!sections.length) {
    tabsEl.hidden = true;
    tabsEl.innerHTML = '';
    return;
  }
  tabsEl.hidden = false;

  const inner = createEl('div', 'guide-section-tabs-inner');
  const indicator = createEl('div', 'guide-section-tabs-indicator');
  inner.appendChild(indicator);
  const tabsBySlug = new Map();
  let currentSlug = null;

  /* Click-scroll offset: nav (~72px) + sticky tabs (~56px) + ~30px gap.
     Lenis honours this via `data-scroll-offset` on the anchor link (see
     smooth-scroll.js). CSS `scroll-margin-top: 160px` on `.guide-section`
     mirrors this for non-Lenis fallback paths and deep-linked hashes. */
  const GUIDE_SCROLL_OFFSET = -160;

  /* During a click-triggered scroll Lenis animates for ~2.5s and multiple
     intermediate sections pass through the observer band, which causes the
     active tab to flicker. We suppress observer-driven updates for a hair
     longer than that duration; the click itself has already set the active
     state synchronously. */
  let suppressObserver = false;
  let suppressTimer = 0;
  const SUPPRESS_MS = 2700;

  /* Position the sliding indicator under the active tab. Called from both
     setActive() and the resize listener so the white bar tracks layout
     reflows (font load, viewport changes). Uses offsetLeft/offsetWidth so
     the calculation is unaffected by the parent's scroll position. */
  const positionIndicator = (slug) => {
    const tab = tabsBySlug.get(slug);
    if (!tab) return;
    indicator.style.transform = `translateX(${tab.offsetLeft}px)`;
    indicator.style.width = `${tab.offsetWidth}px`;
  };

  /* Toggle the edge fade hints (see guide-detail.css) based on how far the
     strip is scrolled, so a clipped first/last tab reads as "scrolls" rather
     than "cut off". No-op visually when the strip fits (max <= 0). */
  const updateOverflowHints = () => {
    const max = inner.scrollWidth - inner.clientWidth;
    tabsEl.dataset.overflowLeft = inner.scrollLeft > 2 ? 'true' : 'false';
    tabsEl.dataset.overflowRight = max > 2 && inner.scrollLeft < max - 2 ? 'true' : 'false';
  };

  /* Keep the active tab within the visible scroll window so its label is
     never stranded (and clipped) at an edge as the reader moves through the
     article. */
  const scrollActiveIntoView = (slug) => {
    const tab = tabsBySlug.get(slug);
    if (!tab) return;
    const pad = 16;
    const left = tab.offsetLeft;
    const right = left + tab.offsetWidth;
    const viewLeft = inner.scrollLeft;
    const viewRight = viewLeft + inner.clientWidth;
    if (left < viewLeft + pad) {
      inner.scrollTo({ left: Math.max(0, left - pad), behavior: 'smooth' });
    } else if (right > viewRight - pad) {
      inner.scrollTo({ left: right - inner.clientWidth + pad, behavior: 'smooth' });
    }
  };

  const setActive = (slug) => {
    if (slug === currentSlug) return;
    currentSlug = slug;
    tabsBySlug.forEach((tab, s) => {
      tab.classList.toggle('is-active', s === slug);
    });
    positionIndicator(slug);
    scrollActiveIntoView(slug);
  };

  sections.forEach((section, idx) => {
    const slug = section.slug || `section-${idx + 1}`;
    const tab = createEl('a', 'guide-section-tab');
    tab.href = `#${slug}`;
    tab.dataset.guideTab = slug;
    tab.dataset.scrollOffset = String(GUIDE_SCROLL_OFFSET);

    const num = createEl('span', 'guide-section-tab-number');
    num.textContent = String(section.number ?? idx + 1);
    const label = createEl('span', 'guide-section-tab-label');
    label.textContent = (section.title || '').toUpperCase();
    tab.append(num, label);

    tab.addEventListener('click', () => {
      // Highlight immediately so the click feels responsive. Do NOT call
      // preventDefault here — Lenis' document-level interceptor handles the
      // smooth scroll using the data-scroll-offset attr set above, and needs
      // the click to bubble to it. For environments without Lenis (touch /
      // reduced-motion) the browser's native hash-anchor jump kicks in and
      // `scroll-margin-top: 160px` on `.guide-section` keeps it aligned.
      setActive(slug);
      suppressObserver = true;
      window.clearTimeout(suppressTimer);
      suppressTimer = window.setTimeout(() => {
        suppressObserver = false;
        // Re-evaluate after the smooth scroll has settled so the active tab
        // matches whatever section the user actually landed on (handles cases
        // where they kept scrolling during the animation).
        if (typeof evaluateActive === 'function') evaluateActive();
      }, SUPPRESS_MS);
    });
    inner.appendChild(tab);
    tabsBySlug.set(slug, tab);
  });

  tabsEl.innerHTML = '';
  tabsEl.appendChild(inner);

  // Update the edge fade hints as the strip is scrolled (drag, wheel, or the
  // programmatic scrollActiveIntoView above).
  inner.addEventListener('scroll', updateOverflowHints, { passive: true, signal });

  // Initial position — wait for layout/fonts so the indicator measurement
  // is accurate. requestAnimationFrame catches the first layout pass.
  requestAnimationFrame(() => { setActive(sections[0].slug); updateOverflowHints(); });
  if (document.fonts?.ready?.then) {
    document.fonts.ready.then(() => { positionIndicator(currentSlug || sections[0].slug); updateOverflowHints(); });
  }

  // Reposition the indicator on viewport resize so it tracks tab widths.
  let resizeRaf = 0;
  window.addEventListener('resize', () => {
    if (resizeRaf) cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(() => {
      if (currentSlug) positionIndicator(currentSlug);
      updateOverflowHints();
    });
  }, { signal });

  /* Scroll-driven scroll-spy. We use a scroll listener instead of
     IntersectionObserver because the observer only fires on intersection
     state CHANGES — if a scroll happens during the click-suppression window
     (e.g. user clicks then keeps scrolling) the next state change can be
     missed and the active tab stalls. A scroll listener is rock-solid.

     The "active section" is the last one whose top has crossed the reading
     line (30% of viewport from top). This matches the user's mental model
     of "what am I currently reading". */
  const READING_LINE_PCT = 0.3;

  const evaluateActive = () => {
    if (suppressObserver) return;
    const lineY = window.innerHeight * READING_LINE_PCT;
    let active = sections[0].slug;
    for (const section of sections) {
      const el = document.getElementById(section.slug);
      if (!el) continue;
      if (el.getBoundingClientRect().top <= lineY) active = section.slug;
    }
    setActive(active);
  };

  let scrollRaf = 0;
  const onScroll = () => {
    if (scrollRaf) return;
    scrollRaf = requestAnimationFrame(() => {
      scrollRaf = 0;
      evaluateActive();
    });
  };

  window.addEventListener('scroll', onScroll, { passive: true, signal });

  /* Watch the body for height changes (image lazy-load, CMS content swap,
     fonts loading) so the indicator + active section recalculate against
     the new layout. Lenis' own limit is kept in sync globally by
     smooth-scroll.js; here we only care about the tab-strip state. */
  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver(() => {
      if (currentSlug) positionIndicator(currentSlug);
      evaluateActive();
    });
    ro.observe(document.body);
    signal.addEventListener('abort', () => ro.disconnect());
  }

  evaluateActive();
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
   span if titleHighlight is supplied. Uses the shared .feature-card-title-accent
   class so the accent colour matches the feature-card component. */
const wireHeroTitle = (data) => {
  const titleEl = document.querySelector('[data-guide-title]');
  if (!titleEl) return;
  const full = data.title || '';
  const accent = data.titleHighlight;
  titleEl.innerHTML = '';
  if (accent && full.includes(accent)) {
    const beforeText = full.slice(0, full.indexOf(accent));
    const before = document.createTextNode(beforeText);
    const span = createEl('span', 'feature-card-title-accent');
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
    // The eyebrow pill uses the shared .feature-card-eyebrow class only
    tagEl.className = 'feature-card-eyebrow';
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
