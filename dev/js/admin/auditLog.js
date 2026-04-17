/**
 * Audit log module for admin CMS.
 * Tracks publish/save actions with user attribution.
 */

import { db, auth } from '../firebase-config.js';
import { ref, set, get, query, orderByKey, limitToLast } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-database.js';

/**
 * Log an action to the audit trail.
 * Non-blocking — errors are silently caught.
 *
 * @param {'publish'|'save_draft'|'revert'|'restore_history'|'bulk_publish'|'bulk_rebuild'|'bulk_discard'} action
 * @param {string} pageKey
 * @param {Object} details - Optional { label, sectionsChanged, ... }
 */
export function logAction(action, pageKey, details = {}) {
  const user = auth.currentUser;
  if (!user) return;

  const timestamp = Date.now();
  const entry = {
    action,
    pageKey,
    user: user.email || user.uid,
    timestamp,
    date: new Date(timestamp).toISOString(),
    ...details,
  };

  set(ref(db, `audit/${timestamp}`), entry).catch(err => {
    console.warn('Audit log write failed:', err);
  });
}

/**
 * Initialize audit log UI. Wire button.
 */
export function initAuditLog() {
  const btn = document.getElementById('audit-btn');
  if (btn) btn.addEventListener('click', showAuditLogModal);
}

/**
 * Load audit log entries from Firebase.
 * @param {number} limit - Max entries to fetch
 * @returns {Promise<Array>}
 */
export async function loadAuditLog(limit = 50) {
  try {
    const auditRef = query(ref(db, 'audit'), orderByKey(), limitToLast(limit));
    const snap = await get(auditRef);
    if (!snap.exists()) return [];

    const entries = [];
    snap.forEach(child => entries.push(child.val()));
    return entries.reverse(); // newest first
  } catch (e) {
    console.error('Failed to load audit log:', e);
    return [];
  }
}

/**
 * Show the audit log modal.
 */
export async function showAuditLogModal() {
  let modal = document.getElementById('audit-modal');
  if (!modal) {
    modal = createAuditModal();
    document.body.appendChild(modal);
  }

  modal.style.display = 'flex';
  const body = modal.querySelector('.audit-body');
  body.innerHTML = '<div class="audit-loading">Loading audit log\u2026</div>';

  // Escape to close
  const onEscape = e => { if (e.key === 'Escape') hideAuditModal(); };
  document.addEventListener('keydown', onEscape);
  modal._escHandler = onEscape;

  const entries = await loadAuditLog(50);

  if (entries.length === 0) {
    body.innerHTML = '<div class="audit-empty">No audit entries yet. Actions will be logged when content is published or saved.</div>';
    return;
  }

  let html = '<table class="audit-table"><thead><tr><th>Time</th><th>User</th><th>Action</th><th>Page</th><th>Note</th></tr></thead><tbody>';

  for (const entry of entries) {
    const time = formatTimeAgo(entry.timestamp);
    const user = esc(entry.user || 'Unknown');
    const action = entry.action || '';
    const badgeCls = getBadgeClass(action);
    const page = esc(entry.pageKey || '');
    const note = esc(entry.label || entry.details?.label || '\u2014');

    html += `<tr>
      <td class="audit-time">${time}</td>
      <td class="audit-user">${user}</td>
      <td><span class="audit-badge ${badgeCls}">${formatAction(action)}</span></td>
      <td>${page}</td>
      <td class="audit-note">${note}</td>
    </tr>`;
  }

  html += '</tbody></table>';
  body.innerHTML = html;
}

function hideAuditModal() {
  const modal = document.getElementById('audit-modal');
  if (!modal) return;
  modal.style.display = 'none';
  if (modal._escHandler) {
    document.removeEventListener('keydown', modal._escHandler);
    modal._escHandler = null;
  }
}

function createAuditModal() {
  const modal = document.createElement('div');
  modal.id = 'audit-modal';
  modal.className = 'modal-overlay';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.style.display = 'none';

  modal.innerHTML = `
    <div class="modal-content audit-modal-content">
      <div class="modal-header">
        <h2>Audit Log</h2>
        <button class="modal-close" aria-label="Close dialog">&times;</button>
      </div>
      <div class="audit-body"></div>
    </div>
  `;

  // Close handlers
  modal.querySelector('.modal-close').addEventListener('click', hideAuditModal);
  modal.addEventListener('click', e => { if (e.target === modal) hideAuditModal(); });

  return modal;
}

function formatAction(action) {
  const labels = {
    publish: 'Published',
    save_draft: 'Saved Draft',
    revert: 'Reverted',
    restore_history: 'Restored',
    bulk_publish: 'Bulk Published',
    bulk_rebuild: 'Bulk Rebuilt',
    bulk_discard: 'Bulk Discarded',
  };
  return labels[action] || action;
}

function getBadgeClass(action) {
  const map = {
    publish: 'audit-badge-publish',
    save_draft: 'audit-badge-draft',
    revert: 'audit-badge-revert',
    restore_history: 'audit-badge-restore',
    bulk_publish: 'audit-badge-publish',
    bulk_rebuild: 'audit-badge-draft',
    bulk_discard: 'audit-badge-revert',
  };
  return map[action] || '';
}

function formatTimeAgo(timestamp) {
  if (!timestamp) return '\u2014';
  const diff = Math.floor((Date.now() - timestamp) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  if (diff < 604800) return Math.floor(diff / 86400) + 'd ago';
  return new Date(timestamp).toLocaleDateString();
}

function esc(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}
