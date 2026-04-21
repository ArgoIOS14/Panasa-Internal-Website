/**
 * Super admin activity dashboard.
 * Aggregates data from `audit/` and `users/` and `reviews/`.
 */

import { db } from '../firebase-config.js';
import { ref, get, query, orderByKey, limitToLast } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-database.js';
import { showModal, hideModal, showToast } from './animations.js';
import { canManageUsers, roleLabel } from './roles.js';

export function initActivityDashboard() {
  const btn = document.getElementById('activity-btn');
  if (btn) btn.addEventListener('click', showActivityModal);
}

async function showActivityModal() {
  if (!canManageUsers()) {
    showToast('Super admin only.', 'error');
    return;
  }
  let modal = document.getElementById('activity-modal');
  if (!modal) {
    modal = buildModal();
    document.body.appendChild(modal);
  }
  showModal(modal);
  await renderOverview(modal);
}

function buildModal() {
  const m = document.createElement('div');
  m.id = 'activity-modal';
  m.className = 'modal-overlay';
  m.setAttribute('role', 'dialog');
  m.setAttribute('aria-modal', 'true');
  m.style.display = 'none';
  m.innerHTML = `
    <div class="modal-content activity-modal-content">
      <div class="modal-header">
        <h2>Activity</h2>
        <div class="activity-tabs">
          <button class="activity-tab active" data-view="overview">Overview</button>
          <button class="activity-tab" data-view="byUser">By user</button>
          <button class="activity-tab" data-view="byPage">By page</button>
        </div>
        <button class="modal-close" aria-label="Close dialog">&times;</button>
      </div>
      <div class="activity-body"></div>
    </div>
  `;
  m.querySelector('.modal-close').addEventListener('click', () => hideModal(m));
  m.addEventListener('click', e => { if (e.target === m) hideModal(m); });
  m.querySelectorAll('.activity-tab').forEach(t => {
    t.addEventListener('click', async () => {
      m.querySelectorAll('.activity-tab').forEach(x => x.classList.remove('active'));
      t.classList.add('active');
      const view = t.dataset.view;
      if (view === 'overview') renderOverview(m);
      if (view === 'byUser') renderByUser(m);
      if (view === 'byPage') renderByPage(m);
    });
  });
  return m;
}

async function loadData() {
  const [auditSnap, usersSnap, reviewsSnap] = await Promise.all([
    get(query(ref(db, 'audit'), orderByKey(), limitToLast(500))),
    get(ref(db, 'users')),
    get(ref(db, 'reviews')),
  ]);
  const audit = [];
  if (auditSnap.exists()) auditSnap.forEach(c => audit.push(c.val()));
  audit.reverse();
  const users = [];
  if (usersSnap.exists()) usersSnap.forEach(c => users.push({ uid: c.key, ...c.val() }));
  const reviews = [];
  if (reviewsSnap.exists()) reviewsSnap.forEach(c => reviews.push({ id: c.key, ...c.val() }));
  return { audit, users, reviews };
}

async function renderOverview(modal) {
  const body = modal.querySelector('.activity-body');
  body.innerHTML = '<div class="audit-loading">Loading\u2026</div>';
  const { audit, users, reviews } = await loadData();

  const weekAgo = Date.now() - 7 * 86400 * 1000;
  const publishesThisWeek = audit.filter(e => (e.action === 'publish' || e.action === 'approve_review') && (e.timestamp || 0) >= weekAgo).length;
  const pending = reviews.filter(r => r.status === 'pending').length;
  const approved = reviews.filter(r => r.status === 'approved').length;
  const rejected = reviews.filter(r => r.status === 'rejected').length;

  // Most active editor (by # of submit_review + save_draft)
  const activityByUser = {};
  for (const e of audit) {
    const u = e.user || 'unknown';
    activityByUser[u] = (activityByUser[u] || 0) + 1;
  }
  const topUsers = Object.entries(activityByUser).sort((a, b) => b[1] - a[1]).slice(0, 5);

  body.innerHTML = `
    <div class="activity-overview">
      <div class="stat-grid">
        <div class="stat-card"><div class="stat-value">${users.length}</div><div class="stat-label">Users</div></div>
        <div class="stat-card"><div class="stat-value">${publishesThisWeek}</div><div class="stat-label">Publishes (7d)</div></div>
        <div class="stat-card"><div class="stat-value">${pending}</div><div class="stat-label">Pending reviews</div></div>
        <div class="stat-card"><div class="stat-value">${approved}</div><div class="stat-label">Approved</div></div>
        <div class="stat-card"><div class="stat-value">${rejected}</div><div class="stat-label">Rejected</div></div>
      </div>
      <h3>Most active</h3>
      <table class="audit-table"><thead><tr><th>User</th><th>Actions (last 500)</th></tr></thead><tbody>
        ${topUsers.map(([u, n]) => `<tr><td>${esc(u)}</td><td>${n}</td></tr>`).join('')}
      </tbody></table>
      <h3>Recent activity</h3>
      ${renderAuditRows(audit.slice(0, 30))}
    </div>
  `;
}

async function renderByUser(modal) {
  const body = modal.querySelector('.activity-body');
  body.innerHTML = '<div class="audit-loading">Loading\u2026</div>';
  const { audit, users } = await loadData();

  const options = ['<option value="">Select a user\u2026</option>']
    .concat(users.map(u => `<option value="${esc(u.email)}">${esc(u.email)} (${roleLabel(u.role)})</option>`));
  body.innerHTML = `
    <div class="activity-filter">
      <select id="activity-user-select">${options.join('')}</select>
    </div>
    <div id="activity-user-results"></div>
  `;
  const sel = body.querySelector('#activity-user-select');
  const results = body.querySelector('#activity-user-results');
  sel.addEventListener('change', () => {
    const email = sel.value;
    if (!email) { results.innerHTML = ''; return; }
    const list = audit.filter(e => e.user === email);
    results.innerHTML = list.length ? renderAuditRows(list) : '<div class="audit-empty">No activity.</div>';
  });
}

async function renderByPage(modal) {
  const body = modal.querySelector('.activity-body');
  body.innerHTML = '<div class="audit-loading">Loading\u2026</div>';
  const { audit } = await loadData();
  const pages = [...new Set(audit.map(e => e.pageKey).filter(Boolean))];
  body.innerHTML = `
    <div class="activity-filter">
      <select id="activity-page-select">
        <option value="">Select a page\u2026</option>
        ${pages.map(p => `<option value="${esc(p)}">${esc(p)}</option>`).join('')}
      </select>
    </div>
    <div id="activity-page-results"></div>
  `;
  const sel = body.querySelector('#activity-page-select');
  const results = body.querySelector('#activity-page-results');
  sel.addEventListener('change', () => {
    const p = sel.value;
    if (!p) { results.innerHTML = ''; return; }
    const list = audit.filter(e => e.pageKey === p);
    results.innerHTML = list.length ? renderAuditRows(list) : '<div class="audit-empty">No activity.</div>';
  });
}

function renderAuditRows(list) {
  if (!list.length) return '<div class="audit-empty">No activity.</div>';
  let h = '<table class="audit-table"><thead><tr><th>Time</th><th>User</th><th>Action</th><th>Page</th><th>Note</th></tr></thead><tbody>';
  for (const e of list) {
    h += `<tr>
      <td>${formatTimeAgo(e.timestamp)}</td>
      <td>${esc(e.user || '\u2014')}</td>
      <td>${esc(e.action || '')}</td>
      <td>${esc(e.pageKey || '\u2014')}</td>
      <td>${esc(e.label || e.reason || e.targetUser || '')}</td>
    </tr>`;
  }
  h += '</tbody></table>';
  return h;
}

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
