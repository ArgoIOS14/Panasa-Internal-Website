import { createEl, setText } from '../utils/dom.js';

/* ── Single source of truth for categories ─────────────────────────────
   Each entry wires together:
     • `category`  — the value stored on resource items in content JSON
     • `aliases`   — other strings that should be treated as the same category
     • `tagClass`  — CSS modifier on the resource-tag pill
     • `filter`    — the pluralised label used in the filter-tab row
     • `slug`      — the query-param slug (`?filter=blogs`)
   Adding a new category means editing ONE array, not three maps.
────────────────────────────────────────────────────────────────────── */
const CATEGORIES = [
  { category: 'Blog',       aliases: ['Blogs'],       tagClass: 'resource-tag-blog',       filter: 'Blogs',       slug: 'blogs' },
  { category: 'Insights',   aliases: ['Insight'],     tagClass: 'resource-tag-insights',   filter: 'Insights',    slug: 'insights' },
  { category: 'Guide',      aliases: ['Guides'],      tagClass: 'resource-tag-guide',      filter: 'Guides',      slug: 'guides' },
  { category: 'Case Study', aliases: ['Case Studies'], tagClass: 'resource-tag-case-study', filter: 'Case Studies', slug: 'case-studies' },
];

const findByAnyLabel = (label) =>
  CATEGORIES.find((c) => c.category === label || c.aliases.includes(label));
const findByFilter = (label) => CATEGORIES.find((c) => c.filter === label);
const findBySlug = (slug) => CATEGORIES.find((c) => c.slug === slug);

const slugify = (label) =>
  String(label || '')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

const categoryLabel = (category) => {
  const label = String(category || '').toUpperCase();
  return label === 'INSIGHTS' ? 'INSIGHT' : label;
};

const tagClassFor = (category) =>
  findByAnyLabel(category)?.tagClass || 'resource-tag-blog';

/* Resolve the per-category read-more arrow asset. The 4 arrows share shape
   and stroke width; only the stroke colour changes to match the category pill. */
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

const itemMatchesFilter = (item, filterLabel) => {
  if (filterLabel === 'All') return true;
  const cat = findByFilter(filterLabel);
  if (!cat) return true;
  return item.category === cat.category || cat.aliases.includes(item.category);
};

/* ── Single source of truth for animation timings ─────────────────────
   CSS `.resources-grid` transition is 220ms; keep these aligned if the
   CSS changes. Reads from a CSS custom property when available so the
   two stay in lockstep. */
const readMs = (varName, fallback) => {
  const root = document.documentElement;
  const raw = getComputedStyle(root).getPropertyValue(varName).trim();
  const match = /^([0-9.]+)(ms|s)?$/.exec(raw);
  if (!match) return fallback;
  const value = Number(match[1]);
  return match[2] === 's' ? value * 1000 : value;
};

/* ── URL state helpers ────────────────────────────────────────────── */
const updateUrl = (filterSlug, page) => {
  const params = new URLSearchParams(window.location.search);
  if (filterSlug && filterSlug !== 'all') params.set('filter', filterSlug);
  else params.delete('filter');
  if (page && page > 1) params.set('page', String(page));
  else params.delete('page');
  const search = params.toString();
  const next = `${window.location.pathname}${search ? `?${search}` : ''}${window.location.hash}`;
  window.history.replaceState({}, '', next);
};

// Keep the page <title> in sync with the active filter so browser history /
// tab labels reflect the current view. Base title is whatever the HTML / meta
// already set (e.g. "Resources | Panasa"); filtered views get prefixed with
// the filter label, e.g. "Blogs | Resources | Panasa".
const updateDocumentTitle = (filterLabel) => {
  const base = document.body?.dataset.resourcesBaseTitle || document.title;
  if (document.body && !document.body.dataset.resourcesBaseTitle) {
    document.body.dataset.resourcesBaseTitle = base;
  }
  document.title = !filterLabel || filterLabel === 'All' ? base : `${filterLabel} | ${base}`;
};

const getInitialFilter = (filters) => {
  const params = new URLSearchParams(window.location.search);
  const raw = (params.get('filter') || '').toLowerCase();
  if (!raw) return filters?.[0] || 'All';
  const cat = findBySlug(raw);
  if (cat && filters?.includes(cat.filter)) return cat.filter;
  return filters?.[0] || 'All';
};

const getInitialPage = () => {
  const params = new URLSearchParams(window.location.search);
  const raw = Number(params.get('page'));
  return Number.isFinite(raw) && raw > 0 ? raw : 1;
};

/* ── Viewport → column count ──────────────────────────────────────── */
const detectColumns = () => {
  const w = window.innerWidth;
  if (w <= 640) return 1;
  if (w <= 900) return 2;
  return 3;
};

export const renderResources = (data) => {
  if (!data) return;

  // ── Hero ──────────────────────────────────────────
  setText('[data-resources-hero-line1]', data.hero?.titleLine1);
  setText('[data-resources-hero-line2]', data.hero?.titleLine2);
  setText('[data-resources-hero-subtitle]', data.hero?.subtitle);

  // ── Filter tabs + grid + pagination ───────────────
  const filtersEl = document.querySelector('[data-resources-filters]');
  const gridEl = document.querySelector('[data-resources-grid]');
  const pageFirst = document.querySelector('[data-page-first]');
  const pagePrev = document.querySelector('[data-page-prev]');
  const pageNext = document.querySelector('[data-page-next]');
  const pageLast = document.querySelector('[data-page-last]');
  const pageIndicator = document.querySelector('[data-page-indicator]');
  const paginationEl = document.querySelector('[data-resources-pagination]');
  if (!filtersEl || !gridEl) return;

  // a11y: announce page changes via screen reader
  if (pageIndicator && !pageIndicator.hasAttribute('aria-live')) {
    pageIndicator.setAttribute('aria-live', 'polite');
    pageIndicator.setAttribute('aria-atomic', 'true');
  }

  const filters = data.filters || ['All'];
  const items = data.items || [];
  let activeFilter = getInitialFilter(filters);
  let currentPage = getInitialPage();

  // ── Featured card (dynamic) ───────────────────────
  // Picks the most recent item matching the active filter (sorted by
  // datePublished, lexicographic order matches chronological for ISO dates).
  // When "All" is active, picks the latest across the whole catalog.
  // Hides the section when no item matches (e.g. an empty filter).
  const featuredSection = document.querySelector('.resources-featured');

  const pickFeaturedItem = (filterLabel) => {
    const pool = items.filter((it) => itemMatchesFilter(it, filterLabel));
    if (!pool.length) return null;
    // Stable sort by datePublished desc; preserves source order on ties
    return [...pool].sort((a, b) =>
      String(b.datePublished || '').localeCompare(String(a.datePublished || ''))
    )[0] || null;
  };

  const renderFeatured = (item) => {
    if (!featuredSection) return;
    if (!item) {
      featuredSection.hidden = true;
      return;
    }
    featuredSection.hidden = false;

    // Eyebrow tag
    const featuredTagEl = featuredSection.querySelector('[data-featured-tag]');
    if (featuredTagEl) {
      featuredTagEl.textContent = categoryLabel(item.category);
    }

    // Title — accent span if titleAccent is present and title starts with it
    const featuredTitleEl = featuredSection.querySelector('[data-featured-title]');
    if (featuredTitleEl) {
      featuredTitleEl.innerHTML = '';
      if (item.titleAccent && item.title && item.title.startsWith(item.titleAccent)) {
        const accentSpan = document.createElement('span');
        accentSpan.className = 'feature-card-title-accent';
        accentSpan.textContent = item.titleAccent;
        const remainder = document.createTextNode(item.title.slice(item.titleAccent.length));
        featuredTitleEl.appendChild(accentSpan);
        featuredTitleEl.appendChild(remainder);
      } else {
        featuredTitleEl.textContent = item.title || '';
      }
    }

    // Date
    const featuredDateEl = featuredSection.querySelector('[data-featured-date]');
    if (featuredDateEl) featuredDateEl.textContent = item.date || '';

    // Read time — hide the meta item if missing
    const featuredReadEl = featuredSection.querySelector('[data-featured-read]');
    if (featuredReadEl) {
      const readMetaItem = featuredReadEl.closest('.feature-card-meta-item');
      if (item.readTime) {
        featuredReadEl.textContent = item.readTime;
        if (readMetaItem) readMetaItem.hidden = false;
      } else {
        if (readMetaItem) readMetaItem.hidden = true;
      }
    }

    // CTA href + label
    const featuredCtaEl = featuredSection.querySelector('[data-featured-cta]');
    if (featuredCtaEl instanceof HTMLAnchorElement) {
      featuredCtaEl.href = item.href || '#';
    }
    const featuredCtaLabelEl = featuredSection.querySelector('[data-featured-cta-label]');
    if (featuredCtaLabelEl) {
      const CTA_LABEL_BY_CATEGORY = {
        'Blog':         'Read Full Blog',
        'Blogs':        'Read Full Blog',
        'Insights':     'Read Full Insight',
        'Insight':      'Read Full Insight',
        'Guide':        'Read Full Guide',
        'Guides':       'Read Full Guide',
        'Case Study':   'Read Full Case Study',
        'Case Studies': 'Read Full Case Study',
      };
      featuredCtaLabelEl.textContent = CTA_LABEL_BY_CATEGORY[item.category] || 'Read More';
    }

    // Image
    const featuredImgEl = featuredSection.querySelector('[data-featured-image]');
    if (featuredImgEl instanceof HTMLImageElement) {
      featuredImgEl.src = item.image || 'assets/resources-card-placeholder.webp';
      featuredImgEl.alt = item.title || '';
    }
  };

  renderFeatured(pickFeaturedItem(activeFilter));

  const ROWS_PER_PAGE = 2;

  // #1 + #2: column count matches the CSS grid responsive rules
  let columns = detectColumns();

  const itemsPerPage = () => ROWS_PER_PAGE * columns;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const OUT_MS = readMs('--motion-duration-reveal-fast', 220);
  const IN_MS = readMs('--motion-duration-reveal', 320);
  let transitionToken = 0;

  const filterItems = (filter) => items.filter((item) => itemMatchesFilter(item, filter));

  const renderCard = (item) => {
    const card = createEl('a', `resource-card resource-card--${cardModifierFor(item.category)}`);
    card.href = item.href || 'contact';

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
    readMore.innerHTML = `Read More <img src="assets/${readMoreArrowFor(item.category)}" alt="" aria-hidden="true" />`;
    body.appendChild(readMore);

    card.appendChild(body);
    return card;
  };

  const totalPages = (filtered) =>
    Math.max(1, Math.ceil(filtered.length / itemsPerPage()));

  const setDisabled = (btn, disabled) => {
    if (!(btn instanceof HTMLButtonElement)) return;
    btn.disabled = disabled;
    btn.setAttribute('aria-disabled', String(disabled));
  };

  // First-paint flag: the HTML ships a pre-rendered grid that the SEO crawl
  // sees. If the very first JS render would produce the same cards (default
  // filter, page 1, and counts match), skip the innerHTML wipe so the user
  // doesn't see a flicker. Any subsequent render — filter click, page
  // change, resize that crosses a column breakpoint — rebuilds normally.
  let isFirstRender = true;
  const matchesStaticGrid = (slice) => {
    if (gridEl.children.length !== slice.length) return false;
    return Array.from(gridEl.children).every((child, i) => {
      const expectedHref = slice[i]?.href;
      const actualHref = child.getAttribute('href');
      return expectedHref && actualHref && actualHref.replace(/^\/+/, '') === expectedHref.replace(/^\/+/, '');
    });
  };

  const renderGrid = () => {
    const filtered = filterItems(activeFilter);
    const pages = totalPages(filtered);
    if (currentPage > pages) currentPage = pages;
    if (currentPage < 1) currentPage = 1;

    const perPage = itemsPerPage();
    const start = (currentPage - 1) * perPage;
    const slice = filtered.slice(start, start + perPage);

    const canReuseStatic = isFirstRender && slice.length > 0 && matchesStaticGrid(slice);
    isFirstRender = false;

    if (!canReuseStatic) {
      gridEl.innerHTML = '';
      if (filtered.length === 0) {
        const empty = createEl('div', 'resources-empty');
        empty.innerHTML = `
          <img class="resources-empty-illustration"
               src="assets/resources-empty-illustration.webp"
               alt=""
               aria-hidden="true" />
          <h3 class="resources-empty-title">Nothing to explore yet</h3>
          <p class="resources-empty-text">We don't have any content in this section right now.<br />Please check back later for new updates.</p>
        `;
        gridEl.appendChild(empty);
      } else {
        slice.forEach((item) => gridEl.appendChild(renderCard(item)));
      }
    }

    // Hide pagination when it serves no purpose — no results, or everything
    // fits on one page.
    if (paginationEl instanceof HTMLElement) {
      paginationEl.hidden = filtered.length === 0 || pages <= 1;
    }

    if (pageIndicator) pageIndicator.textContent = `${currentPage} of ${pages}`;
    setDisabled(pageFirst, currentPage <= 1);
    setDisabled(pagePrev, currentPage <= 1);
    setDisabled(pageNext, currentPage >= pages);
    setDisabled(pageLast, currentPage >= pages);

    // #6: keep the URL in sync
    const slug = findByFilter(activeFilter)?.slug || 'all';
    updateUrl(slug, currentPage);
    updateDocumentTitle(activeFilter);
  };

  const animatedRender = () => {
    if (reducedMotion) {
      renderGrid();
      return;
    }
    const token = ++transitionToken;
    gridEl.classList.remove('is-transition-in');
    gridEl.classList.add('is-transition-out');
    window.setTimeout(() => {
      if (token !== transitionToken) return;
      renderGrid();
      gridEl.classList.remove('is-transition-out');
      gridEl.classList.add('is-transition-in');
      window.setTimeout(() => {
        if (token !== transitionToken) return;
        gridEl.classList.remove('is-transition-in');
      }, IN_MS);
    }, OUT_MS);
  };

  // ── Filter buttons ────────────────────────────────
  // The green "active" pill is a single ::before on the filters row driven by
  // --filter-indicator-x / --filter-indicator-w. We measure the active button
  // and update those vars so the pill glides to the new tab with a CSS
  // transition, rather than the background jumping instantly.
  const moveIndicatorTo = (btn) => {
    if (!(btn instanceof HTMLElement) || !(filtersEl instanceof HTMLElement)) return;
    filtersEl.style.setProperty('--filter-indicator-x', `${btn.offsetLeft}px`);
    filtersEl.style.setProperty('--filter-indicator-w', `${btn.offsetWidth}px`);
  };

  const renderFilterButtons = () => {
    filtersEl.innerHTML = '';
    filters.forEach((filter) => {
      const btn = createEl('button', `resources-filter${filter === activeFilter ? ' active' : ''}`);
      btn.type = 'button';
      btn.textContent = filter;
      btn.dataset.filter = slugify(filter);
      btn.setAttribute('aria-pressed', String(filter === activeFilter));
      btn.addEventListener('click', () => {
        if (filter === activeFilter) return;
        activeFilter = filter;
        currentPage = 1;
        filtersEl.querySelectorAll('.resources-filter').forEach((b) => {
          const match = b.textContent === activeFilter;
          b.classList.toggle('active', match);
          b.setAttribute('aria-pressed', String(match));
        });
        const nextActive = filtersEl.querySelector('.resources-filter.active');
        moveIndicatorTo(nextActive);
        renderFeatured(pickFeaturedItem(activeFilter));
        animatedRender();
      });
      filtersEl.appendChild(btn);
    });

    // First paint — glide the pill in from width 0 to the active tab width.
    const initialActive = filtersEl.querySelector('.resources-filter.active');
    requestAnimationFrame(() => moveIndicatorTo(initialActive));
  };

  renderFilterButtons();

  // Keep the indicator aligned if the filter row reflows (viewport resize
  // or font-loading completes).
  let indicatorRaf = 0;
  const realignIndicator = () => {
    if (indicatorRaf) cancelAnimationFrame(indicatorRaf);
    indicatorRaf = requestAnimationFrame(() => {
      const active = filtersEl.querySelector('.resources-filter.active');
      if (active) moveIndicatorTo(active);
    });
  };
  window.addEventListener('resize', realignIndicator);
  if (document.fonts && typeof document.fonts.ready?.then === 'function') {
    document.fonts.ready.then(realignIndicator);
  }

  // ── Pagination controls ───────────────────────────
  if (pageFirst instanceof HTMLButtonElement) {
    pageFirst.addEventListener('click', () => {
      if (currentPage === 1) return;
      currentPage = 1;
      animatedRender();
    });
  }
  if (pagePrev instanceof HTMLButtonElement) {
    pagePrev.addEventListener('click', () => {
      if (currentPage <= 1) return;
      currentPage -= 1;
      animatedRender();
    });
  }
  if (pageNext instanceof HTMLButtonElement) {
    pageNext.addEventListener('click', () => {
      const pages = totalPages(filterItems(activeFilter));
      if (currentPage >= pages) return;
      currentPage += 1;
      animatedRender();
    });
  }
  if (pageLast instanceof HTMLButtonElement) {
    pageLast.addEventListener('click', () => {
      const pages = totalPages(filterItems(activeFilter));
      if (currentPage === pages) return;
      currentPage = pages;
      animatedRender();
    });
  }
  // #2: recompute items-per-page when the viewport crosses a breakpoint
  let resizeRaf = 0;
  window.addEventListener('resize', () => {
    if (resizeRaf) cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(() => {
      const nextCols = detectColumns();
      if (nextCols === columns) return;
      columns = nextCols;
      // Keep the user on roughly the same set of items by remapping current page
      const filtered = filterItems(activeFilter);
      const pages = totalPages(filtered);
      if (currentPage > pages) currentPage = pages;
      renderGrid();
    });
  });

  // ── Initial render ────────────────────────────────
  renderGrid();
};
