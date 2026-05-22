import { createEl, setText } from '../utils/dom.js';

/* Blog body can contain `{type:"html", content:"…"}` blocks written by the
   admin CMS, which are ultimately rendered via innerHTML. Sanitise every such
   block with DOMPurify before insertion. If the sanitiser fails to load, the
   renderer falls back to stripping all tags (fail-closed). */
const sanitizerPromise = import('https://cdn.jsdelivr.net/npm/dompurify@3.1.6/+esm')
  .then((mod) => mod.default || mod)
  .catch((err) => {
    console.warn('[blogDetail] DOMPurify failed to load; HTML blocks will render as plain text', err);
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
  CATEGORY_CLASS_MAP[category] || 'resource-tag-blog';

const categoryLabel = (category) => {
  const label = String(category || '').toUpperCase();
  return label === 'INSIGHTS' ? 'INSIGHT' : label;
};

/* Per-category read-more arrow — same pattern as resources.js so cards
   rendered on the Resources page and cards rendered inside the "More X"
   grid on detail pages stay visually aligned. */
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

/* Blog pages live one level deep (`/blog/<slug>`), so any link or asset path
   targeting a sibling (e.g. `blog/<slug>`, `contact`, `assets/foo.webp`) must
   be prefixed with `../`. Leaves already-resolved paths alone. */
const resolveRelativePath = (path, fallback = null) => {
  if (!path) return fallback;
  if (path.startsWith('..') || path.startsWith('/') || path.startsWith('http')) return path;
  if (path.startsWith('#')) return path;
  if (path.startsWith('data:')) return path;
  return `../${path}`;
};

/* ── Render one resource card for "More Blogs" — same visual vocabulary as
   the Resources grid. */
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

/* ── Callout block renderer for inline CTA cards inside the article */
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

    // Prepend matching icon. talktoteam-colored for the default CTA,
    // casestudy-colored for the ghost "View Case Study" variant.
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

/* ── Rich-HTML block renderer (sanitises CMS-authored HTML) */
const renderHtmlBlock = (block, purifier) => {
  const el = createEl('div', 'blog-body-block');
  const raw = block.content || '';
  if (purifier && typeof purifier.sanitize === 'function') {
    el.innerHTML = purifier.sanitize(raw, { USE_PROFILES: { html: true } });
  } else {
    // Fail-closed: strip tags rather than risk executing untrusted HTML
    el.textContent = raw.replace(/<[^>]*>/g, '');
  }
  return el;
};

/* Render body blocks. Awaits DOMPurify only when an `html` block is present,
   so callout-only articles paint without the sanitiser round-trip. */
const renderBlogBody = async (data) => {
  const bodyEl = document.querySelector('[data-blog-body]');
  if (!bodyEl) return;
  const blocks = Array.isArray(data.body) ? data.body : [];
  const hasHtml = blocks.some((b) => b?.type === 'html');
  const purifier = hasHtml ? await sanitizerPromise : null;
  bodyEl.innerHTML = '';
  blocks.forEach((block) => {
    if (!block || !block.type) return;
    if (block.type === 'callout') bodyEl.appendChild(renderCallout(block));
    else if (block.type === 'html') bodyEl.appendChild(renderHtmlBlock(block, purifier));
  });
};

/* ── Share buttons */
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
    // Announce the "Copied ✓" feedback to assistive tech on change
    copyBtn.setAttribute('aria-live', 'polite');
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(window.location.href);
      } catch (err) {
        // Fallback for older browsers
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
  if (twitterLink instanceof HTMLAnchorElement) {
    twitterLink.href = shareUrls.twitter;
  }

  const linkedinLink = document.querySelector('[data-share="linkedin"]');
  if (linkedinLink instanceof HTMLAnchorElement) {
    linkedinLink.href = shareUrls.linkedin;
  }
};

/* ── Hero image (responsive sources) */
const wireHeroImage = (data) => {
  const img = document.querySelector('[data-blog-hero-image]');
  if (!(img instanceof HTMLImageElement)) return;

  if (data.heroImage) img.src = data.heroImage;
  if (data.heroImageAlt) img.alt = data.heroImageAlt;
  else if (data.title) img.alt = data.title;

  // Build srcset if multiple sizes provided
  const sources = [];
  if (data.heroImageMobile) sources.push(`${data.heroImageMobile} 640w`);
  if (data.heroImageTablet) sources.push(`${data.heroImageTablet} 900w`);
  if (data.heroImage) sources.push(`${data.heroImage} 1440w`);
  if (sources.length > 1) {
    img.srcset = sources.join(', ');
    img.sizes = '(max-width: 640px) 260px, (max-width: 900px) 320px, 320px';
  }
};

/* Categories that an article can belong to. Keeps the related-items filter
   and the "More X" section heading in lock-step. */
const CATEGORY_TO_HEADING = {
  'Blog': 'More Blogs',
  'Blogs': 'More Blogs',
  'Insights': 'More Insights',
  'Insight': 'More Insights',
  'Guide': 'More Guides',
  'Guides': 'More Guides',
  'Case Study': 'More Case Studies',
  'Case Studies': 'More Case Studies',
};

const sameCategory = (a, b) => {
  if (!a || !b) return false;
  if (a === b) return true;
  // Treat Blog/Blogs, Insights/Insight, etc. as the same
  const norm = (v) => String(v).toLowerCase().replace(/s$/, '');
  return norm(a) === norm(b);
};

/* ── Resolve related items from relatedSlugs[] OR fall back to latest items.
   When falling back, prefer items of the same category as the current article. */
const resolveRelated = (blogData, resourcesData) => {
  const items = resourcesData?.items || [];
  const currentSlug = blogData.slug;

  if (Array.isArray(blogData.relatedSlugs) && blogData.relatedSlugs.length) {
    const mapped = blogData.relatedSlugs
      .map((slug) => items.find((item) => item.slug === slug))
      .filter(Boolean);
    if (mapped.length) return mapped.slice(0, 3);
  }

  // Fallback: 3 most-recent items, preferring the same category, excluding self
  const currentCategory = blogData.category || blogData.tag || 'Blog';
  const notSelf = items.filter((item) => item.slug !== currentSlug);
  const sameCat = notSelf.filter((item) => sameCategory(item.category, currentCategory));
  const rest = notSelf.filter((item) => !sameCategory(item.category, currentCategory));
  return [...sameCat, ...rest].slice(0, 3);
};

const resolveRelatedHeading = (blogData) => {
  if (blogData.relatedHeading) return blogData.relatedHeading;
  const cat = blogData.category || blogData.tag || 'Blog';
  // Handle exact match first, then normalise plural/singular
  if (CATEGORY_TO_HEADING[cat]) return CATEGORY_TO_HEADING[cat];
  const normalised = String(cat).toLowerCase();
  if (normalised.includes('insight')) return 'More Insights';
  if (normalised.includes('guide')) return 'More Guides';
  if (normalised.includes('case')) return 'More Case Studies';
  return 'More Blogs';
};

/* ── SEO meta helpers */
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
  setLinkRel('canonical', url);

  // Article-specific OG tags
  ensureMeta('property', 'og:type', 'article');
  if (data.datePublished) ensureMeta('property', 'article:published_time', data.datePublished);
  if (data.dateModified || data.datePublished) {
    ensureMeta('property', 'article:modified_time', data.dateModified || data.datePublished);
  }
  if (data.author) ensureMeta('property', 'article:author', data.author);
  const section = data.category || data.tag;
  if (section) ensureMeta('property', 'article:section', section);
  if (Array.isArray(data.tags)) {
    // Clear previous article:tag entries, then append one fresh <meta> per tag.
    // We can't use ensureMeta here because it updates the first match instead
    // of creating a new element, which would collapse N tags into 1.
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

/* Update the JSON-LD BlogPosting block (the `type="application/ld+json"` script
   containing `@type: "BlogPosting"`) with fresh data on render, so CMS edits
   flow through to structured data without a rebuild. */
const updateJsonLdBlogPosting = (data) => {
  const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
  const match = scripts.find((s) => {
    try {
      const obj = JSON.parse(s.textContent || '{}');
      return obj && (obj['@type'] === 'BlogPosting' || obj['@type'] === 'Article');
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
    console.warn('[blogDetail] could not update JSON-LD', err);
  }
};

/* ── Main renderer */
export const renderBlogDetail = (data, resourcesData) => {
  if (!data) return;

  // ── SEO: <title>, <meta description>, OG tags, Twitter Card, canonical,
  //        article:* OG meta, JSON-LD BlogPosting
  updateSeoMeta(data);
  updateJsonLdBlogPosting(data);

  // ── Hero
  const tagEl = document.querySelector('[data-blog-tag]');
  if (tagEl) {
    tagEl.textContent = data.tag || 'BLOG';
    const tagCategory = data.category || (data.tag === 'BLOG' ? 'Blog' : (data.tag || 'Blog'));
    tagEl.className = `resource-tag ${tagClassFor(tagCategory)}`;
  }
  setText('[data-blog-title]', data.title);
  setText('[data-blog-date]', data.date);
  setText('[data-blog-read-time]', data.readTime);
  setText('[data-blog-author]', data.author || 'Panasa Team');
  wireHeroImage(data);

  // ── Article body (async — DOMPurify awaited only when html blocks exist)
  renderBlogBody(data);

  // ── Share buttons
  wireShare(data.title);

  // ── Related articles section ("More Blogs" / "More Insights" / etc.)
  const moreBlogsEl = document.querySelector('[data-more-blogs]');
  if (moreBlogsEl) {
    moreBlogsEl.innerHTML = '';
    const related = resolveRelated(data, resourcesData);
    related.forEach((item) => moreBlogsEl.appendChild(renderResourceCard(item)));

    const moreBlogsSection = moreBlogsEl.closest('.more-blogs');
    if (moreBlogsSection instanceof HTMLElement) {
      moreBlogsSection.hidden = related.length === 0;
      // Heading — e.g. "More Insights" for an Insights article. Defaults to
      // "More Blogs" if no category is set.
      const headingEl = moreBlogsSection.querySelector('h2');
      if (headingEl) headingEl.textContent = resolveRelatedHeading(data);
    }
  }
};
