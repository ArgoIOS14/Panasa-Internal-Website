/**
 * Review workflow for editor submissions.
 *
 * Firebase path: `reviews/{reviewId}`
 *   { pageKey, pageLabel, submittedBy: {uid,email}, submittedAt,
 *     title, baseData, proposedData,
 *     status: 'pending'|'approved'|'rejected'|'withdrawn',
 *     reviewedBy?: {uid,email}, reviewedAt?, reviewNote? }
 */

import { db, auth } from '../firebase-config.js';
import { ref, push, set, update, get, query, orderByChild, equalTo } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-database.js';
import { publishToLive, saveHistory, normalizeData } from './state.js';
import { logAction } from './auditLog.js';
import { renderDiffView } from './historyDiff.js';
import { showModal, hideModal, showToast } from './animations.js';
import { canReview, currentUserRecord } from './roles.js';

let _pagesRegistry = {};
let _onApproved = null;

/**
 * Initialize the reviews module.
 * @param {Object} pagesRegistry - The PAGES map from main.js
 * @param {Function} onApproved - Called after approval so main.js can refresh current-page view.
 */
export function initReviews(pagesRegistry, onApproved) {
  _pagesRegistry = pagesRegistry || {};
  _onApproved = onApproved;

  const reviewsBtn = document.getElementById('reviews-btn');
  if (reviewsBtn) reviewsBtn.addEventListener('click', showReviewsModal);

  const mySubsBtn = document.getElementById('my-submissions-btn');
  if (mySubsBtn) mySubsBtn.addEventListener('click', showMySubmissionsModal);

  // When a review tab resolves (approve/reject), refresh the queue badge
  // and, if the Reviews modal is open, re-render its current tab.
  window.addEventListener('message', (ev) => {
    if (ev.data?.type !== 'panasa-review-resolved') return;
    refreshPendingBadge();
    if (typeof _onApproved === 'function') _onApproved();
    const modal = document.getElementById('reviews-modal');
    if (modal && modal.style.display !== 'none') renderReviewsList(modal);
  });

  // Keep the reviews nav button badge updated with pending count.
  refreshPendingBadge();
}

/**
 * Submit editor changes for review.
 * @param {string} pageKey - page registry key
 * @param {Object} proposedData - the new data
 * @param {string} note - optional version note
 * @returns {Promise<string>} reviewId
 */
export async function submitForReview(pageKey, proposedData, note) {
  const user = auth.currentUser;
  const record = currentUserRecord();
  if (!user || !record) throw new Error('Not signed in');

  const page = _pagesRegistry[pageKey];
  if (!page) throw new Error('Unknown page: ' + pageKey);

  // Snapshot the LIVE published content as the baseline. We must not use
  // `loadFromFirebase` here because it prefers drafts — and the editor
  // may have already saved a draft containing their edits, which would
  // make the diff empty.
  let baseData = {};
  try {
    const defaults = typeof page.getDefaults === 'function' ? await page.getDefaults() : page.defaults;
    const liveSnap = await get(ref(db, page.fbPath));
    const raw = liveSnap.exists() ? liveSnap.val() : {};
    baseData = normalizeData(raw, page.sections, defaults);
  } catch (e) { /* best effort */ }

  const payload = {
    pageKey,
    pageLabel: page.label || pageKey,
    submittedBy: { uid: user.uid, email: user.email },
    submittedAt: Date.now(),
    title: (note || '').trim() || '(no note)',
    baseData,
    proposedData,
    status: 'pending',
  };

  const listRef = ref(db, 'reviews');
  const newRef = push(listRef);
  await set(newRef, payload);

  // Per-user index so editors can list their own submissions without needing
  // read access on the top-level `reviews` collection (which is restricted
  // by security rules to superadmin/approver).
  try {
    await set(ref(db, `userReviews/${user.uid}/${newRef.key}`), true);
  } catch (e) { console.warn('userReviews index write failed:', e.message); }

  logAction('submit_review', pageKey, { label: payload.title, reviewId: newRef.key });
  refreshPendingBadge();
  return newRef.key;
}

/**
 * Load all reviews (newest first). Optionally filter by status.
 */
async function loadReviews(statusFilter) {
  const snap = await get(ref(db, 'reviews'));
  if (!snap.exists()) return [];
  const list = [];
  snap.forEach(child => {
    const v = child.val();
    list.push({ id: child.key, ...v });
  });
  list.sort((a, b) => (b.submittedAt || 0) - (a.submittedAt || 0));
  if (statusFilter) return list.filter(r => r.status === statusFilter);
  return list;
}

/** Count of pending reviews — used for nav badge. */
async function countPending() {
  const list = await loadReviews('pending');
  return list.length;
}

export async function refreshPendingBadge() {
  const badge = document.getElementById('reviews-badge');
  if (!badge) return;
  if (!canReview()) { badge.style.display = 'none'; return; }
  try {
    const n = await countPending();
    if (n > 0) {
      badge.textContent = String(n);
      badge.style.display = '';
    } else {
      badge.style.display = 'none';
    }
  } catch (e) { /* ignore */ }
}

/* ── Reviewer-side UI (superadmin/approver) ─────────────────── */

async function showReviewsModal() {
  if (!canReview()) {
    showToast('You do not have permission to review changes.', 'error');
    return;
  }
  let modal = document.getElementById('reviews-modal');
  if (!modal) {
    modal = buildReviewsModal();
    document.body.appendChild(modal);
  }
  showModal(modal);
  await renderReviewsList(modal);
}

function buildReviewsModal() {
  const m = document.createElement('div');
  m.id = 'reviews-modal';
  m.className = 'modal-overlay';
  m.setAttribute('role', 'dialog');
  m.setAttribute('aria-modal', 'true');
  m.style.display = 'none';
  m.innerHTML = `
    <div class="modal-content reviews-modal-content">
      <div class="modal-header">
        <h2>Review Queue</h2>
        <div class="reviews-tabs">
          <button class="reviews-tab active" data-filter="pending">Pending</button>
          <button class="reviews-tab" data-filter="approved">Approved</button>
          <button class="reviews-tab" data-filter="rejected">Rejected</button>
          <button class="reviews-tab" data-filter="all">All</button>
        </div>
        <button class="modal-close" aria-label="Close dialog">&times;</button>
      </div>
      <div class="reviews-body"></div>
    </div>
  `;
  m.querySelector('.modal-close').addEventListener('click', () => hideModal(m));
  m.addEventListener('click', e => { if (e.target === m) hideModal(m); });
  m.querySelectorAll('.reviews-tab').forEach(t => {
    t.addEventListener('click', () => {
      m.querySelectorAll('.reviews-tab').forEach(x => x.classList.remove('active'));
      t.classList.add('active');
      renderReviewsList(m);
    });
  });
  return m;
}

async function renderReviewsList(modal) {
  const body = modal.querySelector('.reviews-body');
  body.innerHTML = '<div class="audit-loading">Loading reviews\u2026</div>';
  const filter = modal.querySelector('.reviews-tab.active')?.dataset.filter || 'pending';
  const list = await loadReviews(filter === 'all' ? null : filter);
  if (!list.length) {
    body.innerHTML = `<div class="audit-empty">No ${filter === 'all' ? '' : filter} reviews.</div>`;
    return;
  }
  let html = '<table class="audit-table reviews-table"><thead><tr><th>Page</th><th>Submitted by</th><th>Submitted</th><th>Note</th><th>Status</th><th></th></tr></thead><tbody>';
  for (const r of list) {
    html += `<tr>
      <td>${esc(r.pageLabel || r.pageKey)}</td>
      <td>${esc(r.submittedBy?.email || '\u2014')}</td>
      <td>${formatTimeAgo(r.submittedAt)}</td>
      <td>${esc(r.title || '')}</td>
      <td><span class="review-status status-${r.status}">${r.status}</span></td>
      <td><button class="btn btn-sm btn-open-review" data-id="${r.id}">Open</button></td>
    </tr>`;
  }
  html += '</tbody></table>';
  body.innerHTML = html;
  body.querySelectorAll('.btn-open-review').forEach(b => {
    b.addEventListener('click', () => {
      // Open in a new tab so reviewer keeps the queue open.
      window.open(`/review.html?id=${encodeURIComponent(b.dataset.id)}`, '_blank');
    });
  });
}

async function openReviewDetail(reviewId) {
  const snap = await get(ref(db, `reviews/${reviewId}`));
  if (!snap.exists()) { showToast('Review not found.', 'error'); return; }
  const review = { id: reviewId, ...snap.val() };

  const page = _pagesRegistry[review.pageKey];
  const previewUrl = page?.previewUrl || '';

  let modal = document.getElementById('review-detail-modal');
  if (modal) modal.remove();
  modal = document.createElement('div');
  modal.id = 'review-detail-modal';
  modal.className = 'modal-overlay';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.style.display = 'none';
  const canAct = review.status === 'pending' && canReview();

  // Count changed sections for the header badge.
  const changedCount = countChangedSections(review.baseData, review.proposedData);

  modal.innerHTML = `
    <div class="modal-content review-detail-content review-detail-wide">
      <div class="modal-header">
        <h2>Review: ${esc(review.pageLabel || review.pageKey)}</h2>
        <div class="review-mode-toggle" role="tablist" aria-label="Preview mode">
          <button class="review-mode-btn" data-mode="current" role="tab">Current live</button>
          <button class="review-mode-btn active" data-mode="proposed" role="tab">Proposed changes</button>
        </div>
        <button class="modal-close" aria-label="Close dialog">&times;</button>
      </div>
      <div class="review-meta">
        <div><strong>Submitted by:</strong> ${esc(review.submittedBy?.email || '\u2014')}</div>
        <div><strong>Submitted:</strong> ${formatTimeAgo(review.submittedAt)}</div>
        <div><strong>Note:</strong> ${esc(review.title || '')}</div>
        <div><strong>Status:</strong> <span class="review-status status-${review.status}">${review.status}</span> ${changedCount > 0 ? `<span class="review-change-count">${changedCount} section${changedCount === 1 ? '' : 's'} changed</span>` : '<span class="review-change-count-none">No changes detected</span>'}</div>
        ${review.reviewedBy ? `<div><strong>Reviewed by:</strong> ${esc(review.reviewedBy.email)} &middot; ${formatTimeAgo(review.reviewedAt)}</div>` : ''}
        ${review.reviewNote ? `<div><strong>Review note:</strong> ${esc(review.reviewNote)}</div>` : ''}
      </div>
      <div class="review-split">
        <div class="review-preview-pane">
          <div class="review-preview-toolbar">
            <span class="review-preview-label" id="review-preview-label">Showing: <strong>Proposed changes</strong></span>
            <div class="preview-devices review-preview-devices">
              <button class="preview-device active" data-review-device="desktop">Desktop</button>
              <button class="preview-device" data-review-device="tablet">Tablet</button>
              <button class="preview-device" data-review-device="mobile">Mobile</button>
            </div>
          </div>
          <div class="review-iframe-wrap">
            ${previewUrl
              ? `<iframe id="review-preview-iframe" class="review-preview-iframe" title="Preview"></iframe>`
              : '<div class="audit-empty">No preview URL configured for this page.</div>'}
          </div>
        </div>
        <div class="review-diff-pane">
          <details class="review-diff-details" open>
            <summary>What changed (field-level)</summary>
            <div class="review-diff"><div class="audit-loading">Rendering diff\u2026</div></div>
          </details>
        </div>
      </div>
      ${canAct ? `
      <div class="review-actions">
        <input id="review-action-note" type="text" placeholder="Optional note to the editor" class="review-note-input" maxlength="200">
        <button class="btn btn-publish" id="review-approve-btn">Approve &amp; Publish</button>
        <button class="btn btn-secondary" id="review-reject-btn">Reject</button>
      </div>
      ` : ''}
    </div>
  `;
  document.body.appendChild(modal);
  modal.querySelector('.modal-close').addEventListener('click', () => hideModal(modal));
  modal.addEventListener('click', e => { if (e.target === modal) hideModal(modal); });
  showModal(modal);

  // Render field diff (baseData → proposedData)
  const diffEl = modal.querySelector('.review-diff');
  diffEl.innerHTML = '';
  try {
    renderDiffView(review.baseData || {}, review.proposedData || {}, diffEl);
  } catch (e) {
    diffEl.innerHTML = '<div class="audit-empty">Diff unavailable.</div>';
  }

  // Visual preview: iframe + Current / Proposed toggle via postMessage.
  const iframe = modal.querySelector('#review-preview-iframe');
  if (iframe && previewUrl) {
    let mode = 'proposed'; // default
    let ready = false;

    // Fetch the CURRENT live content at view time (not review.baseData, which
    // may be stale for old reviews or equal to proposedData for submissions
    // made before the baseline-capture fix).
    let currentLiveData = review.baseData || {};
    (async () => {
      try {
        const defaults = typeof page.getDefaults === 'function' ? await page.getDefaults() : page.defaults;
        const liveSnap = await get(ref(db, page.fbPath));
        const raw = liveSnap.exists() ? liveSnap.val() : {};
        currentLiveData = normalizeData(raw, page.sections, defaults);
        // Update the change badge in the header based on the fresh baseline.
        const fresh = countChangedSections(currentLiveData, review.proposedData);
        const badge = modal.querySelector('.review-change-count, .review-change-count-none');
        if (badge) {
          badge.className = fresh > 0 ? 'review-change-count' : 'review-change-count-none';
          badge.textContent = fresh > 0
            ? `${fresh} section${fresh === 1 ? '' : 's'} changed (vs. current live)`
            : 'No changes vs. current live';
        }
        // Re-render the field diff with the fresh baseline too.
        const diffEl2 = modal.querySelector('.review-diff');
        if (diffEl2) {
          diffEl2.innerHTML = '';
          try { renderDiffView(currentLiveData, review.proposedData || {}, diffEl2); } catch (_) {}
        }
        // If iframe already handshook, push the latest view again so "Current"
        // reflects up-to-date live content.
        if (mode === 'current') sendMode();
      } catch (e) { /* best effort */ }
    })();

    const handshake = (ev) => {
      // Note: strict `ev.source === iframe.contentWindow` check can fail in
      // some browsers during iframe navigation. Accept any ready ping.
      if (ev.data?.type === 'panasa-live-preview-ready') {
        ready = true;
        sendMode();
      }
    };
    window.addEventListener('message', handshake);
    const teardown = () => window.removeEventListener('message', handshake);
    modal.addEventListener('click', (e) => { if (e.target === modal) teardown(); });
    modal.querySelector('.modal-close').addEventListener('click', teardown);

    function sendMode() {
      if (!ready || !iframe.contentWindow) return;
      const data = mode === 'current' ? currentLiveData : (review.proposedData || {});
      try {
        iframe.contentWindow.postMessage({ type: 'panasa-live-preview', data }, '*');
      } catch (e) { /* ignore */ }
    }

    modal.querySelectorAll('.review-mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        modal.querySelectorAll('.review-mode-btn').forEach(x => x.classList.remove('active'));
        btn.classList.add('active');
        mode = btn.dataset.mode;
        const label = modal.querySelector('#review-preview-label');
        if (label) label.innerHTML = 'Showing: <strong>' + (mode === 'current' ? 'Current live' : 'Proposed changes') + '</strong>';
        modal.querySelector('.review-preview-pane')?.classList.toggle('is-proposed', mode === 'proposed');
        sendMode();
      });
    });
    modal.querySelector('.review-preview-pane')?.classList.add('is-proposed');

    modal.querySelectorAll('[data-review-device]').forEach(btn => {
      btn.addEventListener('click', () => {
        modal.querySelectorAll('[data-review-device]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const d = btn.dataset.reviewDevice;
        iframe.className = 'review-preview-iframe ' + (d !== 'desktop' ? d : '');
      });
    });

    // Load the iframe with ?preview=true so live-preview-receiver.js runs there.
    let url = previewUrl.replace(/\.html(?=\?|$)/, '');
    const sep = url.includes('?') ? '&' : '?';
    iframe.src = url + sep + 'preview=true&review=1&t=' + Date.now();
  }

  if (canAct) {
    modal.querySelector('#review-approve-btn').addEventListener('click', async () => {
      const note = modal.querySelector('#review-action-note').value.trim();
      await approveReview(review, note);
      hideModal(modal);
    });
    modal.querySelector('#review-reject-btn').addEventListener('click', async () => {
      const note = modal.querySelector('#review-action-note').value.trim();
      if (!note) {
        if (!confirm('Reject without a reason? Consider leaving a note for the editor.')) return;
      }
      await rejectReview(review, note);
      hideModal(modal);
    });
  }
}

/** Count sections whose JSON serialization differs between base and proposed. */
function countChangedSections(base, proposed) {
  const b = base || {}, p = proposed || {};
  const keys = new Set([...Object.keys(b), ...Object.keys(p)]);
  const skip = new Set(['_lastModified']);
  let n = 0;
  keys.forEach(k => {
    if (skip.has(k)) return;
    if (JSON.stringify(b[k]) !== JSON.stringify(p[k])) n++;
  });
  return n;
}

async function approveReview(review, note) {
  const page = _pagesRegistry[review.pageKey];
  if (!page) { showToast('Unknown page.', 'error'); return; }
  const user = auth.currentUser;
  const data = review.proposedData || {};

  try {
    await publishToLive(page.fbPath, data);
    await saveHistory(review.pageKey, data, `Approved: ${review.title || ''} (by ${review.submittedBy?.email || 'editor'})`);
    await update(ref(db, `reviews/${review.id}`), {
      status: 'approved',
      reviewedBy: { uid: user.uid, email: user.email },
      reviewedAt: Date.now(),
      reviewNote: note || '',
    });
    logAction('approve_review', review.pageKey, {
      label: review.title,
      reviewId: review.id,
      submittedBy: review.submittedBy?.email,
    });

    // Trigger rebuild (best-effort)
    try {
      const token = await auth.currentUser?.getIdToken();
      await fetch('/api/rebuild.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (token || '') },
        body: JSON.stringify({ pageKey: review.pageKey, data }),
      });
    } catch (e) { /* non-blocking */ }

    showToast('Approved and published.', 'success');
    refreshPendingBadge();
    if (typeof _onApproved === 'function') _onApproved(review.pageKey);
  } catch (err) {
    console.error('Approve failed:', err);
    showToast('Approve failed: ' + err.message, 'error');
  }
}

async function rejectReview(review, note) {
  const user = auth.currentUser;
  try {
    await update(ref(db, `reviews/${review.id}`), {
      status: 'rejected',
      reviewedBy: { uid: user.uid, email: user.email },
      reviewedAt: Date.now(),
      reviewNote: note || '',
    });
    logAction('reject_review', review.pageKey, {
      label: review.title,
      reviewId: review.id,
      submittedBy: review.submittedBy?.email,
      reason: note,
    });
    showToast('Review rejected.', 'success');
    refreshPendingBadge();
  } catch (err) {
    showToast('Reject failed: ' + err.message, 'error');
  }
}

/* ── Editor-side UI: my submissions ────────────────────────── */

async function showMySubmissionsModal() {
  const user = auth.currentUser;
  if (!user) return;

  let modal = document.getElementById('my-submissions-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'my-submissions-modal';
    modal.className = 'modal-overlay';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.style.display = 'none';
    modal.innerHTML = `
      <div class="modal-content reviews-modal-content">
        <div class="modal-header">
          <h2>My Submissions</h2>
          <button class="modal-close" aria-label="Close dialog">&times;</button>
        </div>
        <div class="my-subs-body"></div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector('.modal-close').addEventListener('click', () => hideModal(modal));
    modal.addEventListener('click', e => { if (e.target === modal) hideModal(modal); });
  }
  showModal(modal);

  const body = modal.querySelector('.my-subs-body');
  body.innerHTML = '<div class="audit-loading">Loading\u2026</div>';
  // Read per-user index first (editors only have read access to their own
  // index and individual reviews — not the top-level reviews collection).
  let list = [];
  try {
    const idxSnap = await get(ref(db, `userReviews/${user.uid}`));
    const ids = [];
    if (idxSnap.exists()) idxSnap.forEach(c => ids.push(c.key));
    const fetched = await Promise.all(ids.map(async (id) => {
      try {
        const s = await get(ref(db, `reviews/${id}`));
        return s.exists() ? { id, ...s.val() } : null;
      } catch (_) { return null; }
    }));
    list = fetched.filter(Boolean);
  } catch (e) {
    body.innerHTML = '<div class="audit-empty">Unable to load your submissions: ' + esc(e.message) + '</div>';
    return;
  }
  // Fallback for reviewers: if index is empty but they can query, still show
  // all their submissions by scanning.
  if (list.length === 0 && canReview()) {
    try {
      const snap = await get(ref(db, 'reviews'));
      if (snap.exists()) snap.forEach(c => {
        const v = c.val();
        if (v?.submittedBy?.uid === user.uid) list.push({ id: c.key, ...v });
      });
    } catch (_) { /* ignore */ }
  }
  list.sort((a, b) => (b.submittedAt || 0) - (a.submittedAt || 0));

  if (!list.length) {
    body.innerHTML = '<div class="audit-empty">You haven\u2019t submitted any changes yet.</div>';
    return;
  }
  let html = '<table class="audit-table reviews-table"><thead><tr><th>Page</th><th>Submitted</th><th>Note</th><th>Status</th><th>Review note</th></tr></thead><tbody>';
  for (const r of list) {
    html += `<tr>
      <td>${esc(r.pageLabel || r.pageKey)}</td>
      <td>${formatTimeAgo(r.submittedAt)}</td>
      <td>${esc(r.title || '')}</td>
      <td><span class="review-status status-${r.status}">${r.status}</span></td>
      <td>${esc(r.reviewNote || '\u2014')}</td>
    </tr>`;
  }
  html += '</tbody></table>';
  body.innerHTML = html;
}

/* ── utils ───────────────────────────────────────────────── */

function esc(s) {
  const d = document.createElement('div');
  d.textContent = s == null ? '' : String(s);
  return d.innerHTML;
}

function formatTimeAgo(ts) {
  if (!ts) return '\u2014';
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  if (diff < 604800) return Math.floor(diff / 86400) + 'd ago';
  return new Date(ts).toLocaleDateString();
}
