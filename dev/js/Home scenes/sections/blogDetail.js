import { createEl, setText } from '../utils/dom.js';

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

const categoryLabel = (category) => (category || '').toUpperCase();

/* Blog pages live one level deep (`/blog/<slug>`), so any link targeting a
   sibling page like `blog/<slug>` or `contact` must be prefixed with `../`. */
const resolveRelativeHref = (href) => {
  if (!href) return '../resources';
  if (href.startsWith('..') || href.startsWith('/') || href.startsWith('http')) return href;
  if (href.startsWith('#')) return href;
  return `../${href}`;
};

/* ── Render one resource card for "More Blogs" — same visual vocabulary as
   the Resources grid. */
const renderResourceCard = (item) => {
  const card = createEl('a', 'resource-card');
  card.href = resolveRelativeHref(item.href || 'resources');

  const imgWrap = createEl('div', 'resource-card-image');
  if (item.image) {
    const img = createEl('img');
    img.src = item.image;
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
  readMore.innerHTML = 'Read More <img src="../assets/resources-read-more-arrow.svg" alt="" aria-hidden="true" />';
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
    btn.href = resolveRelativeHref(block.cta.href || 'contact');
    btn.textContent = block.cta.label;
    const variant = (block.cta.variant || '').toLowerCase();
    if (variant === 'ghost') btn.classList.add('blog-callout-cta--ghost');
    else if (variant === 'dark') btn.classList.add('blog-callout-cta--dark');
    else {
      // Default heuristic: View Case Study → ghost; everything else → dark
      const label = (block.cta.label || '').toLowerCase();
      if (label.includes('view') || label.includes('case study')) {
        btn.classList.add('blog-callout-cta--ghost');
      } else {
        btn.classList.add('blog-callout-cta--dark');
      }
    }
    callout.appendChild(btn);
  }

  return callout;
};

/* ── Rich-HTML block renderer */
const renderHtmlBlock = (block) => {
  const el = createEl('div', 'blog-body-block');
  el.innerHTML = block.content || '';
  return el;
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
      const originalLabel = copyBtn.dataset.originalLabel || copyBtn.textContent || 'Copy Link';
      copyBtn.dataset.originalLabel = originalLabel;
      copyBtn.textContent = 'Copied ✓';
      copyBtn.classList.add('is-copied');
      window.setTimeout(() => {
        copyBtn.textContent = originalLabel;
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

/* ── Resolve related items from relatedSlugs[] OR fall back to latest BLOG items */
const resolveRelated = (blogData, resourcesData) => {
  const items = resourcesData?.items || [];
  const currentSlug = blogData.slug;

  if (Array.isArray(blogData.relatedSlugs) && blogData.relatedSlugs.length) {
    const mapped = blogData.relatedSlugs
      .map((slug) => items.find((item) => item.slug === slug))
      .filter(Boolean);
    if (mapped.length) return mapped.slice(0, 3);
  }

  // Default: 3 most-recent items that aren't the current article
  return items.filter((item) => item.slug !== currentSlug).slice(0, 3);
};

/* ── Main renderer */
export const renderBlogDetail = (data, resourcesData) => {
  if (!data) return;

  // ── Meta (doc title + description)
  if (data.meta?.title) document.title = data.meta.title;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc && data.meta?.description) {
    metaDesc.setAttribute('content', data.meta.description);
  }

  // ── Hero
  const tagEl = document.querySelector('[data-blog-tag]');
  if (tagEl) {
    tagEl.textContent = data.tag || 'BLOG';
    tagEl.className = `resource-tag ${tagClassFor(data.tag === 'BLOG' ? 'Blog' : (data.tag || 'Blog'))}`;
  }
  setText('[data-blog-title]', data.title);
  setText('[data-blog-date]', data.date);
  setText('[data-blog-read-time]', data.readTime);
  setText('[data-blog-author]', data.author || 'Panasa Team');
  wireHeroImage(data);

  // ── Article body
  const bodyEl = document.querySelector('[data-blog-body]');
  if (bodyEl) {
    bodyEl.innerHTML = '';
    (data.body || []).forEach((block) => {
      if (!block || !block.type) return;
      if (block.type === 'callout') {
        bodyEl.appendChild(renderCallout(block));
      } else if (block.type === 'html') {
        bodyEl.appendChild(renderHtmlBlock(block));
      }
    });
  }

  // ── Share buttons
  wireShare(data.title);

  // ── More Blogs
  const moreBlogsEl = document.querySelector('[data-more-blogs]');
  if (moreBlogsEl) {
    moreBlogsEl.innerHTML = '';
    const related = resolveRelated(data, resourcesData);
    related.forEach((item) => moreBlogsEl.appendChild(renderResourceCard(item)));

    // Hide section if no related items
    const moreBlogsSection = moreBlogsEl.closest('.more-blogs');
    if (moreBlogsSection instanceof HTMLElement) {
      moreBlogsSection.hidden = related.length === 0;
    }
  }
};
