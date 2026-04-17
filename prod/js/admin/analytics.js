import { db } from '../firebase-config.js';
import { ref, get, query, orderByKey, limitToLast } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-database.js';

/**
 * Content analytics dashboard module.
 * Shows page health overview: last published dates, edit frequency, stale pages, pending drafts.
 */

/* ═══════════════════════════════════════════════
   Module state
   ═══════════════════════════════════════════════ */

let registry = null;
let cachedData = null;

const STALE_DAYS = 14;
const OUTDATED_DAYS = 30;
const MS_PER_DAY = 86400000;

/* ═══════════════════════════════════════════════
   Init
   ═══════════════════════════════════════════════ */

export function initAnalytics(pageRegistry) {
  registry = pageRegistry;

  const btn = document.getElementById('analytics-btn');
  if (btn) {
    btn.addEventListener('click', () => {
      const panel = document.getElementById('analytics-panel');
      if (panel && panel.classList.contains('visible')) {
        hideDashboard();
      } else {
        showDashboard();
      }
    });
  }
}

/* ═══════════════════════════════════════════════
   Show / Hide
   ═══════════════════════════════════════════════ */

export async function showDashboard() {
  let panel = document.getElementById('analytics-panel');
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'analytics-panel';
    panel.className = 'analytics-panel';
    document.body.appendChild(panel);
  }

  panel.innerHTML = '<div class="analytics-loading">Loading analytics...</div>';
  panel.classList.add('visible');

  // Close on Escape
  const onEsc = (e) => {
    if (e.key === 'Escape') hideDashboard();
  };
  document.addEventListener('keydown', onEsc);
  panel.dataset._escHandler = 'true';
  panel._escHandler = onEsc;

  try {
    const data = await fetchAllData();
    cachedData = data;
    render(panel, data);
  } catch (err) {
    console.error('[analytics] Failed to load data:', err);
    panel.innerHTML = '<div class="analytics-error">Failed to load analytics. Please try again.</div>';
  }
}

export function hideDashboard() {
  const panel = document.getElementById('analytics-panel');
  if (panel) {
    panel.classList.remove('visible');
    if (panel._escHandler) {
      document.removeEventListener('keydown', panel._escHandler);
      panel._escHandler = null;
    }
  }
  cachedData = null;
}

/* ═══════════════════════════════════════════════
   Data fetching
   ═══════════════════════════════════════════════ */

async function fetchAllData() {
  const keys = Object.keys(registry);

  const promises = keys.map(async (key) => {
    const page = registry[key];
    const fbPath = page.fbPath;
    const publishedPath = fbPath; // e.g. 'pages/home' or 'content'
    const pageKey = fbPath.startsWith('pages/') ? fbPath.replace('pages/', '') : fbPath;
    const historyPath = `history/${key}`;
    const draftPath = fbPath.startsWith('pages/')
      ? `drafts/${fbPath.replace('pages/', '')}`
      : `drafts/${fbPath}`;

    const [publishedSnap, historySnap, draftSnap] = await Promise.all([
      get(ref(db, `${publishedPath}/_lastModified`)),
      get(query(ref(db, historyPath), orderByKey(), limitToLast(50))),
      get(ref(db, `${draftPath}/_lastModified`)),
    ]);

    const publishedTs = publishedSnap.exists() ? publishedSnap.val() : null;
    const draftTs = draftSnap.exists() ? draftSnap.val() : null;

    // Parse history entries
    const historyEntries = [];
    if (historySnap.exists()) {
      historySnap.forEach((child) => {
        const entry = child.val();
        historyEntries.push({
          key: child.key,
          timestamp: entry.timestamp || parseInt(child.key, 10),
          date: entry.date || null,
          label: entry.label || null,
          pageKey: key,
          pageLabel: page.label,
        });
      });
    }

    // Count edits in last 30 days
    const thirtyDaysAgo = Date.now() - (30 * MS_PER_DAY);
    const recentEdits = historyEntries.filter(e => e.timestamp > thirtyDaysAgo).length;

    // Draft status
    const hasUnpublishedDraft = draftTs && (!publishedTs || draftTs > publishedTs);

    return {
      key,
      label: page.label,
      publishedTs,
      draftTs,
      historyEntries,
      recentEdits,
      hasUnpublishedDraft,
    };
  });

  const pages = await Promise.all(promises);

  // Merge all history entries and sort descending
  const allHistory = pages
    .flatMap(p => p.historyEntries)
    .sort((a, b) => b.timestamp - a.timestamp);

  return { pages, allHistory };
}

/* ═══════════════════════════════════════════════
   Rendering
   ═══════════════════════════════════════════════ */

function render(panel, data) {
  const { pages, allHistory } = data;
  const now = Date.now();

  // Quick stats
  const totalPages = pages.length;
  const unpublishedDrafts = pages.filter(p => p.hasUnpublishedDraft).length;
  const stalePages = pages.filter(p => {
    if (!p.publishedTs) return true;
    return (now - p.publishedTs) > OUTDATED_DAYS * MS_PER_DAY;
  }).length;
  const weekAgo = now - (7 * MS_PER_DAY);
  const publishesThisWeek = allHistory.filter(e => e.timestamp > weekAgo).length;

  panel.innerHTML = `
    <div class="analytics-header">
      <h2>Content Analytics</h2>
      <button class="analytics-close" aria-label="Close analytics">&times;</button>
    </div>

    <section class="analytics-stats">
      <div class="analytics-stat-card">
        <span class="analytics-stat-value">${totalPages}</span>
        <span class="analytics-stat-label">Total pages</span>
      </div>
      <div class="analytics-stat-card">
        <span class="analytics-stat-value">${unpublishedDrafts}</span>
        <span class="analytics-stat-label">Unpublished drafts</span>
      </div>
      <div class="analytics-stat-card">
        <span class="analytics-stat-value">${stalePages}</span>
        <span class="analytics-stat-label">Stale pages (30+ days)</span>
      </div>
      <div class="analytics-stat-card">
        <span class="analytics-stat-value">${publishesThisWeek}</span>
        <span class="analytics-stat-label">Publishes this week</span>
      </div>
    </section>

    <section class="analytics-section">
      <h3>Page Health Overview</h3>
      <div class="analytics-table-wrap">
        <table class="analytics-table">
          <thead>
            <tr>
              <th>Page</th>
              <th>Status</th>
              <th>Last Published</th>
              <th>Edits (30d)</th>
              <th>Draft</th>
            </tr>
          </thead>
          <tbody>
            ${pages.map(p => renderPageRow(p, now)).join('')}
          </tbody>
        </table>
      </div>
    </section>

    <section class="analytics-section">
      <h3>Recent Activity</h3>
      <div class="analytics-activity">
        ${allHistory.length === 0
          ? '<p class="analytics-empty">No publish history found.</p>'
          : allHistory.slice(0, 10).map(e => renderActivityItem(e, now)).join('')
        }
      </div>
    </section>
  `;

  // Wire close button
  const closeBtn = panel.querySelector('.analytics-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', hideDashboard);
  }
}

function renderPageRow(page, now) {
  const { label, publishedTs, recentEdits, hasUnpublishedDraft } = page;
  const { statusText, statusClass } = getStatus(publishedTs, now);
  const lastPublished = publishedTs ? formatTimeAgo(publishedTs, now) : 'Never';
  const draftText = hasUnpublishedDraft
    ? '<span class="analytics-draft-warn">Unpublished changes</span>'
    : '&mdash;';

  return `
    <tr>
      <td>${label}</td>
      <td><span class="analytics-status ${statusClass}">${statusText}</span></td>
      <td>${lastPublished}</td>
      <td>${recentEdits}</td>
      <td>${draftText}</td>
    </tr>
  `;
}

function renderActivityItem(entry, now) {
  const timeAgo = formatTimeAgo(entry.timestamp, now);
  const labelText = entry.label ? `"${entry.label}"` : '<span class="analytics-no-label">(no label)</span>';
  return `
    <div class="analytics-activity-item">
      <span class="analytics-activity-time">${timeAgo}</span>
      <span class="analytics-activity-sep">&mdash;</span>
      <span class="analytics-activity-page">${entry.pageLabel}</span>
      <span class="analytics-activity-sep">&mdash;</span>
      <span class="analytics-activity-label">${labelText}</span>
    </div>
  `;
}

/* ═══════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════ */

function getStatus(publishedTs, now) {
  if (!publishedTs) {
    return { statusText: 'Never published', statusClass: 'status-grey' };
  }
  const daysAgo = (now - publishedTs) / MS_PER_DAY;
  if (daysAgo <= STALE_DAYS) {
    return { statusText: 'Fresh', statusClass: 'status-green' };
  }
  if (daysAgo <= OUTDATED_DAYS) {
    return { statusText: 'Stale', statusClass: 'status-yellow' };
  }
  return { statusText: 'Outdated', statusClass: 'status-red' };
}

function formatTimeAgo(timestamp, now) {
  if (!now) now = Date.now();
  const diffMs = now - timestamp;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / MS_PER_DAY);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
  }
  const months = Math.floor(diffDays / 30);
  return `${months} month${months === 1 ? '' : 's'} ago`;
}
