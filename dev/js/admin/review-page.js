/**
 * Dedicated full-page review view.
 * Opens from admin's Reviews modal via review.html?id={reviewId}.
 *
 * Responsibilities:
 *  - Authenticate current user (redirect to admin.html if not signed in)
 *  - Verify reviewer permission (canReview)
 *  - Load the review + current live content
 *  - Render full-viewport iframe with Current/Proposed toggle
 *  - Re-render field-level diff and wire approve/reject actions
 */

import { db, auth } from '../firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js';
import { ref, get, update } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-database.js';
import { loadUserRole, canReview, roleLabel } from './roles.js';
import { normalizeData, publishToLive, saveHistory } from './state.js';
import { renderDiffView } from './historyDiff.js';
import { logAction } from './auditLog.js';

// Page registry (mirrors admin main.js — only label, fbPath, previewUrl, defaults).
import * as aiEngPage from './pages/ai-engineering.js';
import * as homePage from './pages/home.js';
import * as aboutPage from './pages/about.js';
import * as legacyPage from './pages/legacy-modernisation.js';
import * as opsPage from './pages/intelligent-operations.js';
import * as govPage from './pages/ai-governance.js';
import * as contactPage from './pages/contact.js';
import * as careersPage from './pages/careers.js';
import * as servicesOverviewPage from './pages/services-overview.js';
import * as privacyPage from './pages/privacy-policy.js';

const PAGES = {
  aiAcceleratedEngineering: { label: 'AI Accelerated Engineering', ...aiEngPage, previewUrl: '/ai-accelerated-fintech-engineering.html' },
  home: { label: 'Home Page', ...homePage, previewUrl: '/index.html' },
  about: { label: 'About Us', ...aboutPage, previewUrl: '/about.html' },
  legacyModernisation: { label: 'Legacy Modernisation', ...legacyPage, previewUrl: '/ai-powered-legacy-modernisation.html' },
  intelligentOperations: { label: 'Intelligent Operations', ...opsPage, previewUrl: '/intelligent-operations.html' },
  aiGovernance: { label: 'AI Governance', ...govPage, previewUrl: '/ai-governance.html' },
  servicesOverview: { label: 'Services Overview', ...servicesOverviewPage, previewUrl: '/services.html' },
  contact: { label: 'Contact', ...contactPage, previewUrl: '/contact.html' },
  careers: { label: 'Careers', ...careersPage, previewUrl: '/careers.html' },
  privacyPolicy: { label: 'Privacy Policy', ...privacyPage, previewUrl: '/privacy-policy.html' },
};

const root = document.getElementById('review-root');
const reviewId = new URLSearchParams(location.search).get('id');

if (!reviewId) {
  root.innerHTML = '<div class="review-page-error">Missing review id in URL.</div>';
} else {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      // Send them to admin login then back here.
      location.href = '/admin.html';
      return;
    }
    try {
      await loadUserRole(user);
    } catch (err) {
      root.innerHTML = `<div class="review-page-error">${esc(err.message)}</div>`;
      return;
    }
    if (!canReview()) {
      root.innerHTML = '<div class="review-page-error">You do not have permission to review submissions.</div>';
      return;
    }
    await mount();
  });
}

async function mount() {
  const snap = await get(ref(db, `reviews/${reviewId}`));
  if (!snap.exists()) {
    root.innerHTML = '<div class="review-page-error">Review not found.</div>';
    return;
  }
  const review = { id: reviewId, ...snap.val() };
  const page = PAGES[review.pageKey];
  if (!page) {
    root.innerHTML = '<div class="review-page-error">Unknown page: ' + esc(review.pageKey) + '</div>';
    return;
  }
  const canAct = review.status === 'pending';

  // Fetch current live baseline.
  let currentLive = review.baseData || {};
  try {
    const defaults = typeof page.getDefaults === 'function' ? await page.getDefaults() : page.defaults;
    const liveSnap = await get(ref(db, page.fbPath));
    const raw = liveSnap.exists() ? liveSnap.val() : {};
    currentLive = normalizeData(raw, page.sections, defaults);
  } catch (e) { /* fall back to review.baseData */ }

  const changedCount = countChangedSections(currentLive, review.proposedData);

  root.innerHTML = `
    <div class="review-page-shell">
      <header class="review-page-header">
        <div class="review-page-title">
          <a href="/admin.html" class="review-page-back" title="Back to admin">&larr;</a>
          <h1>Review: ${esc(page.label)}</h1>
          <span class="review-status status-${review.status}">${review.status}</span>
          <span class="${changedCount > 0 ? 'review-change-count' : 'review-change-count-none'}">
            ${changedCount > 0 ? `${changedCount} section${changedCount === 1 ? '' : 's'} changed` : 'No changes vs current live'}
          </span>
        </div>
        <div class="review-mode-toggle" role="tablist">
          <button class="review-mode-btn" data-mode="current">Current live</button>
          <button class="review-mode-btn active" data-mode="proposed">Proposed changes</button>
        </div>
        <div class="review-page-header-right">
          <div class="preview-devices review-preview-devices">
            <button class="preview-device active" data-review-device="desktop">Desktop</button>
            <button class="preview-device" data-review-device="tablet">Tablet</button>
            <button class="preview-device" data-review-device="mobile">Mobile</button>
          </div>
          <button id="review-diff-toggle" class="btn btn-secondary btn-small">Hide changes panel</button>
        </div>
      </header>

      <div class="review-page-meta">
        <span><strong>Submitted by:</strong> ${esc(review.submittedBy?.email || '—')}</span>
        <span><strong>Submitted:</strong> ${formatTimeAgo(review.submittedAt)}</span>
        <span><strong>Note:</strong> ${esc(review.title || '')}</span>
        ${review.reviewedBy ? `<span><strong>Reviewed by:</strong> ${esc(review.reviewedBy.email)} · ${formatTimeAgo(review.reviewedAt)}</span>` : ''}
        ${review.reviewNote ? `<span><strong>Review note:</strong> ${esc(review.reviewNote)}</span>` : ''}
      </div>

      <div class="review-page-body is-proposed">
        <div class="review-page-preview-pane">
          <iframe id="review-page-iframe" class="review-page-iframe" title="Review preview"></iframe>
        </div>
        <aside class="review-page-diff-pane">
          <div class="review-page-diff-header">What changed (field-level)</div>
          <div class="review-page-diff"></div>
          ${canAct ? `
            <div class="review-page-actions">
              <input id="review-action-note" type="text" placeholder="Optional note to the editor" class="review-note-input" maxlength="200">
              <button class="btn btn-publish" id="review-approve-btn">Approve &amp; Publish</button>
              <button class="btn btn-secondary" id="review-reject-btn">Reject</button>
            </div>
          ` : ''}
        </aside>
      </div>
    </div>
  `;

  // Diff
  const diffEl = root.querySelector('.review-page-diff');
  try { renderDiffView(currentLive, review.proposedData || {}, diffEl); } catch (e) { diffEl.innerHTML = '<div class="audit-empty">Diff unavailable.</div>'; }

  // Make each section row clickable → scroll the iframe to that section.
  // Put focus on *changed* rows (skip the "unchanged" ones) by styling,
  // but all rows are clickable so reviewers can also jump to unchanged sections.
  diffEl.querySelectorAll('.diff-section').forEach(sec => {
    const keyEl = sec.querySelector('.diff-section-header strong');
    const key = keyEl?.textContent?.trim();
    if (!key) return;
    sec.classList.add('diff-section-clickable');
    if (sec.classList.contains('unchanged')) sec.classList.add('diff-section-unchanged');
    sec.addEventListener('click', () => {
      diffEl.querySelectorAll('.diff-section.is-active').forEach(x => x.classList.remove('is-active'));
      sec.classList.add('is-active');
      try { iframe.contentWindow?.postMessage({ type: 'panasa-scroll-to', key }, '*'); } catch (_) {}
    });
  });

  // Iframe + postMessage live-preview wiring
  const iframe = root.querySelector('#review-page-iframe');
  let mode = 'proposed';
  let ready = false;

  window.addEventListener('message', (ev) => {
    if (ev.data?.type === 'panasa-live-preview-ready') {
      ready = true;
      sendMode();
    }
  });
  function sendMode() {
    if (!ready || !iframe.contentWindow) return;
    const data = mode === 'current' ? currentLive : (review.proposedData || {});
    try { iframe.contentWindow.postMessage({ type: 'panasa-live-preview', data }, '*'); } catch (_) {}
  }
  root.querySelectorAll('.review-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      root.querySelectorAll('.review-mode-btn').forEach(x => x.classList.remove('active'));
      btn.classList.add('active');
      mode = btn.dataset.mode;
      root.querySelector('.review-page-body')?.classList.toggle('is-proposed', mode === 'proposed');
      sendMode();
    });
  });
  root.querySelectorAll('[data-review-device]').forEach(btn => {
    btn.addEventListener('click', () => {
      root.querySelectorAll('[data-review-device]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const d = btn.dataset.reviewDevice;
      iframe.className = 'review-page-iframe ' + (d !== 'desktop' ? d : '');
    });
  });

  // Diff panel toggle
  const diffToggle = root.querySelector('#review-diff-toggle');
  if (diffToggle) {
    diffToggle.addEventListener('click', () => {
      const collapsed = root.querySelector('.review-page-body').classList.toggle('diff-collapsed');
      diffToggle.textContent = collapsed ? 'Show changes panel' : 'Hide changes panel';
    });
  }

  // Load iframe
  let url = (page.previewUrl || '').replace(/\.html(?=\?|$)/, '');
  const sep = url.includes('?') ? '&' : '?';
  iframe.src = url + sep + 'preview=true&review=1&t=' + Date.now();

  // Actions
  if (canAct) {
    root.querySelector('#review-approve-btn').addEventListener('click', async () => {
      const note = root.querySelector('#review-action-note').value.trim();
      await approveReview(review, page, note);
    });
    root.querySelector('#review-reject-btn').addEventListener('click', async () => {
      const note = root.querySelector('#review-action-note').value.trim();
      if (!note && !confirm('Reject without a reason? Consider leaving a note for the editor.')) return;
      await rejectReview(review, note);
    });
  }
}

async function approveReview(review, page, note) {
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
      label: review.title, reviewId: review.id, submittedBy: review.submittedBy?.email,
    });
    try {
      const token = await user.getIdToken();
      await fetch('/api/rebuild.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (token || '') },
        body: JSON.stringify({ pageKey: review.pageKey, data }),
      });
    } catch (_) { /* non-blocking */ }
    closeOrFallback('Approved and published. You can close this tab.');
  } catch (err) {
    alert('Approve failed: ' + err.message);
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
      label: review.title, reviewId: review.id, submittedBy: review.submittedBy?.email, reason: note,
    });
    closeOrFallback('Review rejected. You can close this tab.');
  } catch (err) {
    alert('Reject failed: ' + err.message);
  }
}

/**
 * Close the tab after an approval/rejection. Notify the opener window
 * so its Reviews modal can refresh automatically. If close is blocked
 * (rare — only if the tab wasn't opened via window.open), show a
 * lightweight banner instead of a redirect loop through login.
 */
function closeOrFallback(message) {
  try {
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage({ type: 'panasa-review-resolved' }, '*');
    }
  } catch (_) { /* ignore */ }
  try { window.close(); } catch (_) { /* ignore */ }
  // Fallback: if close was blocked, show a non-blocking banner.
  setTimeout(() => {
    if (!document.hidden) {
      root.innerHTML = `<div class="review-page-done">
        <div class="review-page-done-card">
          <div class="review-page-done-check">✓</div>
          <div>${esc(message)}</div>
          <button class="btn btn-secondary btn-small" onclick="window.close()">Close tab</button>
        </div>
      </div>`;
    }
  }, 200);
}

function countChangedSections(base, proposed) {
  const b = base || {}, p = proposed || {};
  const keys = new Set([...Object.keys(b), ...Object.keys(p)]);
  const skip = new Set(['_lastModified']);
  let n = 0;
  keys.forEach(k => { if (!skip.has(k) && JSON.stringify(b[k]) !== JSON.stringify(p[k])) n++; });
  return n;
}
function esc(s) { const d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }
function formatTimeAgo(ts) {
  if (!ts) return '—';
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  if (diff < 604800) return Math.floor(diff / 86400) + 'd ago';
  return new Date(ts).toLocaleDateString();
}
