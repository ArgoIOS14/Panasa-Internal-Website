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

const categoryLabel = (category) => (category || '').toUpperCase();

const tagClassFor = (category) =>
  findByAnyLabel(category)?.tagClass || 'resource-tag-blog';

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

  // ── Featured card ─────────────────────────────────
  const featured = data.featured || {};
  const featuredCard = document.querySelector('[data-featured-card]');
  if (featuredCard instanceof HTMLAnchorElement && featured.href) {
    featuredCard.href = featured.href;
  }
  setText('[data-featured-tag]', featured.tag);
  const featuredTagEl = document.querySelector('[data-featured-tag]');
  if (featuredTagEl) {
    const tagClass = featured.tagClass
      ? `resource-tag-${featured.tagClass}`
      : tagClassFor(featured.tag);
    featuredTagEl.className = `resource-tag ${tagClass}`;
  }
  setText('[data-featured-title]', featured.title);
  setText('[data-featured-date]', featured.date);
  setText('[data-featured-author]', featured.author);
  const featuredImg = document.querySelector('[data-featured-image]');
  if (featuredImg instanceof HTMLImageElement && featured.image) {
    featuredImg.src = featured.image;
    featuredImg.alt = featured.title || '';
  }

  // ── Filter tabs + grid + pagination ───────────────
  const filtersEl = document.querySelector('[data-resources-filters]');
  const gridEl = document.querySelector('[data-resources-grid]');
  const rowsSelect = document.querySelector('[data-rows-per-page]');
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

  // #8: explicit check — treat only finite positive numbers as valid overrides
  const defaultRows = data.pagination?.defaultRowsPerPage;
  const hasExplicitDefault = Number.isFinite(defaultRows) && defaultRows > 0;
  let rowsPerPage = hasExplicitDefault ? Number(defaultRows) : 2;

  // #3: render <select> options from JSON (fallback to the HTML-defined options if not provided)
  const rowsOptions =
    Array.isArray(data.pagination?.rowsPerPageOptions) &&
    data.pagination.rowsPerPageOptions.length
      ? data.pagination.rowsPerPageOptions
      : null;
  if (rowsSelect instanceof HTMLSelectElement) {
    if (rowsOptions) {
      rowsSelect.innerHTML = '';
      rowsOptions.forEach((n) => {
        const opt = createEl('option');
        opt.value = String(n);
        opt.textContent = String(n);
        rowsSelect.appendChild(opt);
      });
    }
    rowsSelect.value = String(rowsPerPage);
  }

  // #1 + #2: column count matches the CSS grid responsive rules
  let columns = detectColumns();
  const itemsPerPage = () => rowsPerPage * columns;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const OUT_MS = readMs('--motion-duration-reveal-fast', 220);
  const IN_MS = readMs('--motion-duration-reveal', 320);
  let transitionToken = 0;

  const filterItems = (filter) => items.filter((item) => itemMatchesFilter(item, filter));

  const renderCard = (item) => {
    const card = createEl('a', 'resource-card');
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
    readMore.innerHTML = 'Read More <img src="assets/resources-read-more-arrow.svg" alt="" aria-hidden="true" />';
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

  const renderGrid = () => {
    const filtered = filterItems(activeFilter);
    const pages = totalPages(filtered);
    if (currentPage > pages) currentPage = pages;
    if (currentPage < 1) currentPage = 1;

    const perPage = itemsPerPage();
    const start = (currentPage - 1) * perPage;
    const slice = filtered.slice(start, start + perPage);

    gridEl.innerHTML = '';
    if (filtered.length === 0) {
      const empty = createEl('p', 'resources-empty');
      empty.textContent = 'No resources yet in this category.';
      gridEl.appendChild(empty);
    } else {
      slice.forEach((item) => gridEl.appendChild(renderCard(item)));
    }

    // #7: hide pagination row entirely when there are no results
    if (paginationEl instanceof HTMLElement) {
      paginationEl.hidden = filtered.length === 0;
    }

    if (pageIndicator) pageIndicator.textContent = `${currentPage} of ${pages}`;
    setDisabled(pageFirst, currentPage <= 1);
    setDisabled(pagePrev, currentPage <= 1);
    setDisabled(pageNext, currentPage >= pages);
    setDisabled(pageLast, currentPage >= pages);

    // #6: keep the URL in sync
    const slug = findByFilter(activeFilter)?.slug || 'all';
    updateUrl(slug, currentPage);
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
        animatedRender();
      });
      filtersEl.appendChild(btn);
    });
  };

  renderFilterButtons();

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
  if (rowsSelect instanceof HTMLSelectElement) {
    rowsSelect.addEventListener('change', () => {
      const next = Number(rowsSelect.value);
      if (!Number.isFinite(next) || next < 1) return;
      rowsPerPage = next;
      currentPage = 1;
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
