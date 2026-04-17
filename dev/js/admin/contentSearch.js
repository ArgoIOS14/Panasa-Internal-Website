/**
 * Cross-page content search module for admin CMS.
 * Allows searching text content across all managed pages.
 */

import { db } from '../firebase-config.js';
import { ref, get } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-database.js';

let pageCache = new Map();
let searchTimer = null;
let pageRegistry = null;
let switchPageFn = null;
let globalMode = false;

/**
 * Initialize cross-page content search.
 * @param {Object} pages - Page registry { key: { label, fbPath, ... } }
 * @param {Function} switchPage - Callback to switch editor to a page
 */
export function initContentSearch(pages, switchPage) {
  pageRegistry = pages;
  switchPageFn = switchPage;

  const toggleBtn = document.getElementById('search-mode-toggle');
  const searchInput = document.getElementById('search-input');
  const resultsEl = document.getElementById('search-results');

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      globalMode = !globalMode;
      toggleBtn.classList.toggle('active', globalMode);
      toggleBtn.textContent = globalMode ? 'This page' : 'All pages';
      if (resultsEl) resultsEl.style.display = 'none';
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimer);
      const query = searchInput.value.trim();

      if (!globalMode || query.length < 3) {
        if (resultsEl) resultsEl.style.display = 'none';
        return;
      }

      searchTimer = setTimeout(() => searchAllPages(query), 300);
    });

    // Close results on click outside
    document.addEventListener('click', e => {
      if (resultsEl && !resultsEl.contains(e.target) && e.target !== searchInput) {
        resultsEl.style.display = 'none';
      }
    });
  }
}

/**
 * Search all pages for a query string.
 */
async function searchAllPages(query) {
  const resultsEl = document.getElementById('search-results');
  if (!resultsEl || !pageRegistry) return;

  resultsEl.innerHTML = '<div class="search-loading">Searching\u2026</div>';
  resultsEl.style.display = 'block';

  const results = [];
  const lowerQuery = query.toLowerCase();

  for (const [key, page] of Object.entries(pageRegistry)) {
    try {
      let data = pageCache.get(key);
      if (!data) {
        const fbPath = page.fbPath || `pages/${key}`;
        const snapshot = await get(ref(db, fbPath));
        data = snapshot.val();
        if (data) pageCache.set(key, data);
      }

      if (data) {
        const matches = searchObject(data, lowerQuery, '');
        matches.forEach(m => {
          results.push({
            pageKey: key,
            pageLabel: page.label || key,
            path: m.path,
            value: m.value,
            matchIndex: m.matchIndex,
          });
        });
      }
    } catch (e) {
      console.warn(`Search failed for ${key}:`, e);
    }
  }

  renderResults(results, query, resultsEl);
}

/**
 * Recursively search an object for string matches.
 */
function searchObject(obj, query, path) {
  const matches = [];
  if (!obj) return matches;

  if (typeof obj === 'string') {
    const idx = obj.toLowerCase().indexOf(query);
    if (idx !== -1) {
      matches.push({ path, value: obj, matchIndex: idx });
    }
  } else if (Array.isArray(obj)) {
    obj.forEach((item, i) => {
      matches.push(...searchObject(item, query, path ? `${path}[${i}]` : `[${i}]`));
    });
  } else if (typeof obj === 'object') {
    // Skip internal/meta keys
    const skipKeys = new Set(['_lastModified']);
    Object.entries(obj).forEach(([key, val]) => {
      if (skipKeys.has(key)) return;
      matches.push(...searchObject(val, query, path ? `${path}.${key}` : key));
    });
  }

  return matches;
}

/**
 * Render search results grouped by page.
 */
function renderResults(results, query, container) {
  if (results.length === 0) {
    container.innerHTML = '<div class="search-no-results">No matches found</div>';
    return;
  }

  // Limit results
  const maxResults = 20;
  const limited = results.slice(0, maxResults);

  // Group by page
  const grouped = new Map();
  limited.forEach(r => {
    if (!grouped.has(r.pageKey)) grouped.set(r.pageKey, []);
    grouped.get(r.pageKey).push(r);
  });

  container.innerHTML = '';

  grouped.forEach((items, pageKey) => {
    const group = document.createElement('div');
    group.className = 'search-result-group';

    const header = document.createElement('h4');
    header.textContent = items[0].pageLabel;
    group.appendChild(header);

    items.forEach(item => {
      const row = document.createElement('div');
      row.className = 'search-result-item';
      row.innerHTML = `<span class="search-result-path">${escHtml(item.path)}</span>: ${highlightMatch(item.value, query)}`;
      row.addEventListener('click', () => {
        if (typeof switchPageFn === 'function') {
          switchPageFn(pageKey);
        }
        container.style.display = 'none';
      });
      group.appendChild(row);
    });

    container.appendChild(group);
  });

  if (results.length > maxResults) {
    const more = document.createElement('div');
    more.className = 'search-result-more';
    more.textContent = `\u2026 and ${results.length - maxResults} more results`;
    container.appendChild(more);
  }
}

/**
 * Highlight the matched portion in a value string.
 * Shows a truncated excerpt around the match.
 */
function highlightMatch(value, query) {
  const lower = value.toLowerCase();
  const idx = lower.indexOf(query.toLowerCase());
  if (idx === -1) return escHtml(value.substring(0, 80));

  // Show excerpt: 20 chars before match, match, 40 chars after
  const start = Math.max(0, idx - 20);
  const end = Math.min(value.length, idx + query.length + 40);

  let excerpt = '';
  if (start > 0) excerpt += '\u2026';
  excerpt += escHtml(value.substring(start, idx));
  excerpt += '<span class="search-result-match">' + escHtml(value.substring(idx, idx + query.length)) + '</span>';
  excerpt += escHtml(value.substring(idx + query.length, end));
  if (end < value.length) excerpt += '\u2026';

  return excerpt;
}

/**
 * Clear the page data cache. Call after any publish.
 */
export function clearSearchCache() {
  pageCache.clear();
}

function escHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}
