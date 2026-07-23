import { db, auth } from '../firebase-config.js';
import { ref, get, set } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-database.js';
import { logAction } from './auditLog.js';
import { canPublish } from './roles.js';

/**
 * Bulk operations module for admin CMS.
 * Provides batch publish, rebuild, and draft management across all pages.
 */

let registry = null;
let panelEl = null;
let cancelRequested = false;
let operationInProgress = false;

/* ═══════════════════════════════════════════════
   Init
   ═══════════════════════════════════════════════ */

export function initBulkOps(pageRegistry) {
  registry = pageRegistry;

  const btn = document.getElementById('bulk-ops-btn');
  if (btn) {
    btn.addEventListener('click', () => {
      if (!canPublish()) {
        alert('Only approvers and super admins can run bulk operations.');
        return;
      }
      if (panelEl && panelEl.style.display !== 'none') {
        hideBulkOpsPanel();
      } else {
        showBulkOpsPanel();
      }
    });
  }
}

/* ═══════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════ */

function getDraftPath(fbPath) {
  return fbPath.startsWith('pages/')
    ? `drafts/${fbPath.replace('pages/', '')}`
    : `drafts/${fbPath}`;
}

function timeAgo(ts) {
  if (!ts) return 'Never published';
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

async function getAuthToken() {
  try {
    const user = auth.currentUser;
    if (user) return await user.getIdToken();
  } catch (e) { /* ignore */ }
  return '';
}

async function fetchPageStatus(key, page) {
  const fbPath = page.fbPath;
  const draftPath = getDraftPath(fbPath);

  let published = null;
  let lastModified = null;
  let hasDraft = false;

  try {
    const liveSnap = await get(ref(db, fbPath));
    if (liveSnap.exists()) {
      published = liveSnap.val();
      lastModified = published._lastModified || null;
    }
  } catch (e) { /* no published data */ }

  try {
    const draftSnap = await get(ref(db, draftPath));
    if (draftSnap.exists()) {
      const draftData = draftSnap.val();
      // Draft exists if it differs from published or if there's no published version
      if (!published || JSON.stringify(draftData) !== JSON.stringify(published)) {
        hasDraft = true;
      }
    }
  } catch (e) { /* no draft */ }

  return { key, label: page.label, lastModified, hasDraft, fbPath };
}

/* ═══════════════════════════════════════════════
   Panel rendering
   ═══════════════════════════════════════════════ */

export function showBulkOpsPanel() {
  if (!registry) return;

  // Create overlay if needed
  if (!panelEl) {
    panelEl = document.createElement('div');
    panelEl.className = 'bulk-ops-panel';
    panelEl.innerHTML = `
      <div class="bulk-ops-overlay"></div>
      <div class="bulk-ops-modal">
        <div class="bulk-ops-header">
          <h2>Bulk Operations</h2>
          <button class="bulk-ops-close" aria-label="Close">&times;</button>
        </div>
        <div class="bulk-ops-body">
          <div class="bulk-ops-select-actions">
            <button class="btn btn-sm bulk-ops-select-all">Select All</button>
            <button class="btn btn-sm bulk-ops-deselect-all">Deselect All</button>
          </div>
          <div class="bulk-ops-pages"></div>
          <div class="bulk-ops-actions">
            <button class="btn btn-primary bulk-ops-publish" disabled>Publish All Selected</button>
            <button class="btn btn-secondary bulk-ops-rebuild" disabled>Rebuild All Selected</button>
            <button class="btn btn-danger bulk-ops-discard" disabled>Discard All Drafts</button>
            <button class="btn btn-cancel bulk-ops-cancel-btn" style="display:none">Cancel</button>
          </div>
          <div class="bulk-ops-progress" style="display:none"></div>
          <div class="bulk-ops-result" style="display:none"></div>
        </div>
      </div>
    `;
    document.body.appendChild(panelEl);

    // Close handlers
    panelEl.querySelector('.bulk-ops-close').addEventListener('click', hideBulkOpsPanel);
    panelEl.querySelector('.bulk-ops-overlay').addEventListener('click', hideBulkOpsPanel);

    // Select/deselect all
    panelEl.querySelector('.bulk-ops-select-all').addEventListener('click', () => toggleAll(true));
    panelEl.querySelector('.bulk-ops-deselect-all').addEventListener('click', () => toggleAll(false));

    // Action buttons
    panelEl.querySelector('.bulk-ops-publish').addEventListener('click', runPublishAll);
    panelEl.querySelector('.bulk-ops-rebuild').addEventListener('click', runRebuildAll);
    panelEl.querySelector('.bulk-ops-discard').addEventListener('click', runDiscardAll);
    panelEl.querySelector('.bulk-ops-cancel-btn').addEventListener('click', () => { cancelRequested = true; });
  }

  panelEl.style.display = '';
  document.addEventListener('keydown', onEscKey);
  loadPageList();
}

export function hideBulkOpsPanel() {
  if (panelEl) panelEl.style.display = 'none';
  document.removeEventListener('keydown', onEscKey);
}

function onEscKey(e) {
  if (e.key === 'Escape') hideBulkOpsPanel();
}

async function loadPageList() {
  const pagesContainer = panelEl.querySelector('.bulk-ops-pages');
  pagesContainer.innerHTML = '<div class="bulk-ops-loading">Loading page status...</div>';

  // Clear previous results
  const resultEl = panelEl.querySelector('.bulk-ops-result');
  resultEl.style.display = 'none';
  resultEl.innerHTML = '';
  const progressEl = panelEl.querySelector('.bulk-ops-progress');
  progressEl.style.display = 'none';
  progressEl.innerHTML = '';

  // Fetch all page statuses in parallel
  const keys = Object.keys(registry);
  const statuses = await Promise.all(
    keys.map(key => fetchPageStatus(key, registry[key]))
  );

  pagesContainer.innerHTML = '';
  for (const status of statuses) {
    const row = document.createElement('label');
    row.className = 'bulk-ops-page-row';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'bulk-ops-checkbox';
    checkbox.dataset.pageKey = status.key;
    checkbox.addEventListener('change', updateActionButtons);

    const label = document.createElement('span');
    label.className = 'bulk-ops-page-label';
    label.textContent = status.label;

    const badges = document.createElement('span');
    badges.className = 'bulk-ops-page-badges';

    const pubBadge = document.createElement('span');
    pubBadge.className = 'bulk-ops-badge bulk-ops-badge-published';
    pubBadge.textContent = status.lastModified ? `Published ${timeAgo(status.lastModified)}` : 'Never published';
    badges.appendChild(pubBadge);

    if (status.hasDraft) {
      const draftBadge = document.createElement('span');
      draftBadge.className = 'bulk-ops-badge bulk-ops-badge-draft';
      draftBadge.textContent = 'Has draft';
      badges.appendChild(draftBadge);
    }

    row.appendChild(checkbox);
    row.appendChild(label);
    row.appendChild(badges);
    pagesContainer.appendChild(row);
  }

  updateActionButtons();
}

function getSelectedKeys() {
  if (!panelEl) return [];
  const checkboxes = panelEl.querySelectorAll('.bulk-ops-checkbox:checked');
  return Array.from(checkboxes).map(cb => cb.dataset.pageKey);
}

function toggleAll(checked) {
  if (!panelEl) return;
  panelEl.querySelectorAll('.bulk-ops-checkbox').forEach(cb => { cb.checked = checked; });
  updateActionButtons();
}

function updateActionButtons() {
  const count = getSelectedKeys().length;
  const disabled = count === 0 || operationInProgress;
  panelEl.querySelector('.bulk-ops-publish').disabled = disabled;
  panelEl.querySelector('.bulk-ops-rebuild').disabled = disabled;
  panelEl.querySelector('.bulk-ops-discard').disabled = disabled;
}

/* ═══════════════════════════════════════════════
   Operation runner
   ═══════════════════════════════════════════════ */

function setOperationState(active) {
  operationInProgress = active;
  cancelRequested = false;

  const publishBtn = panelEl.querySelector('.bulk-ops-publish');
  const rebuildBtn = panelEl.querySelector('.bulk-ops-rebuild');
  const discardBtn = panelEl.querySelector('.bulk-ops-discard');
  const cancelBtn = panelEl.querySelector('.bulk-ops-cancel-btn');

  publishBtn.disabled = active;
  rebuildBtn.disabled = active;
  discardBtn.disabled = active;
  cancelBtn.style.display = active ? '' : 'none';
}

function showProgress(text) {
  const el = panelEl.querySelector('.bulk-ops-progress');
  el.style.display = '';
  el.textContent = text;
}

function appendResult(html) {
  const el = panelEl.querySelector('.bulk-ops-result');
  el.style.display = '';
  el.innerHTML += html;
}

function clearResults() {
  const resultEl = panelEl.querySelector('.bulk-ops-result');
  resultEl.style.display = 'none';
  resultEl.innerHTML = '';
}

/* ═══════════════════════════════════════════════
   Publish all selected
   ═══════════════════════════════════════════════ */

async function runPublishAll() {
  if (!canPublish()) {
    alert('Only approvers and super admins can run bulk operations.');
    return;
  }
  const keys = getSelectedKeys();
  if (!keys.length) return;

  setOperationState(true);
  clearResults();

  const total = keys.length;
  let published = 0;
  let failed = 0;
  let skipped = 0;

  for (const key of keys) {
    if (cancelRequested) {
      appendResult(`<div class="bulk-ops-result-row result-skip">Cancelled remaining operations</div>`);
      break;
    }

    const page = registry[key];
    if (!page) { skipped++; continue; }

    showProgress(`Publishing ${published + failed + skipped + 1}/${total}...`);

    try {
      const fbPath = page.fbPath;
      const draftPath = getDraftPath(fbPath);

      // 1. Read draft
      const draftSnap = await get(ref(db, draftPath));
      if (!draftSnap.exists()) {
        appendResult(`<div class="bulk-ops-result-row result-skip">-- ${page.label} (skipped: no draft)</div>`);
        skipped++;
        continue;
      }

      const draftData = draftSnap.val();

      // 2. Check if draft differs from published
      const liveSnap = await get(ref(db, fbPath));
      if (liveSnap.exists() && JSON.stringify(draftData) === JSON.stringify(liveSnap.val())) {
        appendResult(`<div class="bulk-ops-result-row result-skip">-- ${page.label} (skipped: no changes)</div>`);
        skipped++;
        continue;
      }

      // 3. Write draft to live path
      const publishData = { ...draftData, _lastModified: Date.now() };
      await set(ref(db, fbPath), publishData);

      // 4. Sync draft
      await set(ref(db, draftPath), publishData);

      // 5. Trigger rebuild
      const token = await getAuthToken();
      await fetch('/api/rebuild.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token,
        },
        body: JSON.stringify({ pageKey: key, data: publishData }),
      });

      appendResult(`<div class="bulk-ops-result-row result-ok">OK ${page.label} (published)</div>`);
      logAction('bulk_publish', key);
      published++;
    } catch (err) {
      console.error(`Bulk publish failed for ${key}:`, err);
      appendResult(`<div class="bulk-ops-result-row result-fail">FAIL ${page.label} (${err.message})</div>`);
      failed++;
    }
  }

  showProgress('');
  const progressEl = panelEl.querySelector('.bulk-ops-progress');
  progressEl.style.display = 'none';
  appendResult(`<div class="bulk-ops-summary">${published} published, ${failed} failed, ${skipped} skipped</div>`);
  setOperationState(false);
}

/* ═══════════════════════════════════════════════
   Rebuild all selected
   ═══════════════════════════════════════════════ */

async function runRebuildAll() {
  if (!canPublish()) {
    alert('Only approvers and super admins can run bulk operations.');
    return;
  }
  const keys = getSelectedKeys();
  if (!keys.length) return;

  setOperationState(true);
  clearResults();

  const total = keys.length;
  let rebuilt = 0;
  let failed = 0;
  let skipped = 0;

  for (const key of keys) {
    if (cancelRequested) {
      appendResult(`<div class="bulk-ops-result-row result-skip">Cancelled remaining operations</div>`);
      break;
    }

    const page = registry[key];
    if (!page) { skipped++; continue; }

    showProgress(`Rebuilding ${rebuilt + failed + skipped + 1}/${total}...`);

    try {
      const fbPath = page.fbPath;

      // 1. Read published data
      const liveSnap = await get(ref(db, fbPath));
      if (!liveSnap.exists()) {
        appendResult(`<div class="bulk-ops-result-row result-skip">-- ${page.label} (skipped: no published data)</div>`);
        skipped++;
        continue;
      }

      const data = liveSnap.val();

      // 2. POST to rebuild
      const token = await getAuthToken();
      const res = await fetch('/api/rebuild.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token,
        },
        body: JSON.stringify({ pageKey: key, data }),
      });

      const result = await res.json();
      if (result.status === 'success') {
        appendResult(`<div class="bulk-ops-result-row result-ok">OK ${page.label} (rebuilt)</div>`);
        logAction('bulk_rebuild', key);
        rebuilt++;
      } else {
        appendResult(`<div class="bulk-ops-result-row result-fail">FAIL ${page.label} (${result.message || 'rebuild error'})</div>`);
        failed++;
      }
    } catch (err) {
      console.error(`Bulk rebuild failed for ${key}:`, err);
      appendResult(`<div class="bulk-ops-result-row result-fail">FAIL ${page.label} (${err.message})</div>`);
      failed++;
    }
  }

  showProgress('');
  const progressEl = panelEl.querySelector('.bulk-ops-progress');
  progressEl.style.display = 'none';
  appendResult(`<div class="bulk-ops-summary">${rebuilt} rebuilt, ${failed} failed, ${skipped} skipped</div>`);
  setOperationState(false);
}

/* ═══════════════════════════════════════════════
   Discard all drafts
   ═══════════════════════════════════════════════ */

async function runDiscardAll() {
  if (!canPublish()) {
    alert('Only approvers and super admins can run bulk operations.');
    return;
  }
  const keys = getSelectedKeys();
  if (!keys.length) return;

  const labels = keys.map(k => registry[k]?.label || k).join(', ');
  if (!confirm(`Discard drafts for: ${labels}?\n\nThis will reset drafts to the current published version.`)) {
    return;
  }

  setOperationState(true);
  clearResults();

  const total = keys.length;
  let discarded = 0;
  let failed = 0;
  let skipped = 0;

  for (const key of keys) {
    if (cancelRequested) {
      appendResult(`<div class="bulk-ops-result-row result-skip">Cancelled remaining operations</div>`);
      break;
    }

    const page = registry[key];
    if (!page) { skipped++; continue; }

    showProgress(`Discarding ${discarded + failed + skipped + 1}/${total}...`);

    try {
      const fbPath = page.fbPath;
      const draftPath = getDraftPath(fbPath);

      // 1. Read published data
      const liveSnap = await get(ref(db, fbPath));
      if (!liveSnap.exists()) {
        appendResult(`<div class="bulk-ops-result-row result-skip">-- ${page.label} (skipped: no published data to restore)</div>`);
        skipped++;
        continue;
      }

      const publishedData = liveSnap.val();

      // 2. Overwrite draft with published
      await set(ref(db, draftPath), publishedData);

      appendResult(`<div class="bulk-ops-result-row result-ok">OK ${page.label} (draft discarded)</div>`);
      discarded++;
    } catch (err) {
      console.error(`Bulk discard failed for ${key}:`, err);
      appendResult(`<div class="bulk-ops-result-row result-fail">FAIL ${page.label} (${err.message})</div>`);
      failed++;
    }
  }

  showProgress('');
  const progressEl = panelEl.querySelector('.bulk-ops-progress');
  progressEl.style.display = 'none';
  appendResult(`<div class="bulk-ops-summary">${discarded} discarded, ${failed} failed, ${skipped} skipped</div>`);
  setOperationState(false);
}
