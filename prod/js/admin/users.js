/**
 * Super admin user management module.
 *
 * Firebase paths:
 *   users/{uid}       — actual user records
 *   invites/{emailKey} — pending invites (consumed on first login)
 */

import { db, auth, firebaseConfig } from '../firebase-config.js';
import { ref, get, set, update } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-database.js';
import { initializeApp, getApp, deleteApp } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js';
import { getAuth, sendPasswordResetEmail, createUserWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js';
import { showModal, hideModal, showToast } from './animations.js';
import { canManageUsers, sanitizeEmailKey, roleLabel } from './roles.js';
import { logAction } from './auditLog.js';

export function initUsers() {
  const btn = document.getElementById('users-btn');
  if (btn) btn.addEventListener('click', showUsersModal);
}

/**
 * Disable/re-enable the target's underlying Firebase Auth account so
 * deactivation actually revokes access, not just the RTDB-backed SPA.
 * Best-effort: the RTDB active flag (already set by the caller) remains the
 * primary, immediately-effective gate even if this call fails.
 */
async function setAuthDisabled(uid, disabled) {
  try {
    const idToken = await auth.currentUser.getIdToken();
    const res = await fetch('/api/manage-user.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({ uid, disabled }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || `HTTP ${res.status}`);
    }
  } catch (e) {
    console.warn('setAuthDisabled failed (RTDB active flag still applied):', e.message);
    showToast('Account flag updated, but revoking the login session failed: ' + e.message, 'error');
  }
}

async function showUsersModal() {
  if (!canManageUsers()) {
    showToast('Only super admins can manage users.', 'error');
    return;
  }
  let modal = document.getElementById('users-modal');
  if (!modal) {
    modal = buildUsersModal();
    document.body.appendChild(modal);
  }
  showModal(modal);
  await renderUsersList(modal);
}

function buildUsersModal() {
  const m = document.createElement('div');
  m.id = 'users-modal';
  m.className = 'modal-overlay';
  m.setAttribute('role', 'dialog');
  m.setAttribute('aria-modal', 'true');
  m.style.display = 'none';
  m.innerHTML = `
    <div class="modal-content users-modal-content">
      <div class="modal-header">
        <h2>Users</h2>
        <button class="modal-close" aria-label="Close dialog">&times;</button>
      </div>
      <div class="users-invite">
        <h3>Invite a new user</h3>
        <p class="users-hint">Firebase will send them a password-reset link so they can set their own password on first login.</p>
        <form id="invite-form" class="invite-form">
          <input type="email" id="invite-email" placeholder="name@panasatech.com" required autocomplete="off">
          <select id="invite-role">
            <option value="editor">Editor (draft only)</option>
            <option value="approver">Approver (can publish)</option>
            <option value="superadmin">Super Admin (full control)</option>
          </select>
          <button type="submit" class="btn btn-primary">Send invite</button>
        </form>
        <div id="invite-status" class="invite-status"></div>
      </div>
      <div class="users-body"></div>
      <div class="invites-body"></div>
    </div>
  `;
  m.querySelector('.modal-close').addEventListener('click', () => hideModal(m));
  m.addEventListener('click', e => { if (e.target === m) hideModal(m); });
  m.querySelector('#invite-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = m.querySelector('#invite-email').value.trim().toLowerCase();
    const role = m.querySelector('#invite-role').value;
    const status = m.querySelector('#invite-status');
    if (!email) return;
    status.textContent = 'Creating user\u2026';
    status.className = 'invite-status';
    status.innerHTML = '';
    try {
      const result = await inviteUser(email, role);
      m.querySelector('#invite-email').value = '';
      // Always show a manual-share block so the super admin isn't dependent
      // on Firebase email delivery (which is frequently silently blocked).
      let html = '<div class="invite-success-block">';
      html += '<div class="invite-success-title">\u2713 Invite created for <strong>' + escHtml(email) + '</strong></div>';
      if (result.tempPassword) {
        html += '<div class="invite-creds">';
        html += '<div class="invite-creds-label">Temporary password (share with the user):</div>';
        html += '<div class="invite-creds-pw"><code id="invite-pw-display">' + escHtml(result.tempPassword) + '</code>';
        html += '<button type="button" class="btn btn-sm" id="invite-pw-copy">Copy</button></div>';
        html += '<div class="invite-creds-hint">They should sign in with this password, then change it immediately. Or they can use the reset-email link if it arrives.</div>';
        html += '</div>';
      } else {
        html += '<div class="invite-creds-hint">This Firebase Auth user already existed. Use "Resend reset" from the table below if needed.</div>';
      }
      html += '<div class="invite-delivery">';
      html += result.resetEmailSent
        ? '<span class="delivery-ok">\u2709 Password-reset email dispatched by Firebase</span> &mdash; if the user doesn\u2019t see it in inbox or spam within a few minutes, use the temporary password above.'
        : '<span class="delivery-fail">\u26A0 Password-reset email could not be sent</span> &mdash; share the temporary password above instead.';
      html += '</div></div>';
      status.innerHTML = html;
      status.classList.add('success');
      const copyBtn = status.querySelector('#invite-pw-copy');
      if (copyBtn) copyBtn.addEventListener('click', () => {
        navigator.clipboard?.writeText(result.tempPassword);
        copyBtn.textContent = 'Copied!';
        setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1500);
      });
      await renderUsersList(m);
    } catch (err) {
      status.textContent = 'Invite failed: ' + err.message;
      status.classList.add('error');
    }
  });
  return m;
}

/**
 * Generate a cryptographically-random throwaway password. The user will
 * reset it immediately via the reset-email link, so it only needs to
 * satisfy Firebase's 6-char minimum and be unguessable.
 */
function randomPassword() {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  return 'Pw!' + Array.from(bytes).map(b => b.toString(36)).join('').slice(0, 20);
}

/**
 * Create a Firebase Auth user without signing the super admin out.
 * Uses a secondary named app instance so `currentUser` on the primary
 * `auth` is untouched.
 */
async function createAuthUserIsolated(email, password) {
  const APP_NAME = 'panasa-admin-secondary';
  let secondaryApp;
  try { secondaryApp = getApp(APP_NAME); }
  catch (_) { secondaryApp = initializeApp(firebaseConfig, APP_NAME); }
  const secondaryAuth = getAuth(secondaryApp);
  try {
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    await signOut(secondaryAuth);
    return cred.user;
  } finally {
    try { await deleteApp(secondaryApp); } catch (_) { /* ignore */ }
  }
}

async function inviteUser(email, role) {
  if (!canManageUsers()) throw new Error('Not authorised');
  const validRole = ['editor', 'approver', 'superadmin'].includes(role) ? role : 'editor';
  const inviter = auth.currentUser;
  const key = sanitizeEmailKey(email);
  const existing = await get(ref(db, `invites/${key}`));
  const record = {
    email,
    role: validRole,
    invitedBy: inviter?.email || 'unknown',
    createdAt: Date.now(),
  };
  await set(ref(db, `invites/${key}`), record);

  // Step 1 — ensure a Firebase Auth user exists for this email. Generate
  // a human-shareable temporary password so the super admin can hand it
  // off manually if the reset email never arrives (Firebase's built-in
  // delivery is sometimes blocked by corporate spam filters).
  const tempPassword = randomPassword();
  let userCreated = false;
  try {
    await createAuthUserIsolated(email, tempPassword);
    userCreated = true;
  } catch (err) {
    if (err?.code !== 'auth/email-already-in-use') {
      throw new Error('Could not create auth user: ' + (err?.message || err));
    }
    // already-in-use → we can't know their password; fall through to reset email only.
  }

  // Step 2 — also try sending the password reset email (best effort).
  let resetEmailSent = false;
  try {
    await sendPasswordResetEmail(auth, email);
    resetEmailSent = true;
  } catch (err) {
    console.warn('sendPasswordResetEmail failed:', err.message);
  }

  logAction('invite_user', null, {
    targetUser: email,
    role: validRole,
    resent: existing.exists(),
    authUserCreated: userCreated,
    resetEmailSent,
  });

  return {
    userCreated,
    resetEmailSent,
    tempPassword: userCreated ? tempPassword : null,
  };
}

async function renderUsersList(modal) {
  const body = modal.querySelector('.users-body');
  const invitesBody = modal.querySelector('.invites-body');
  body.innerHTML = '<h3>Active users</h3><div class="audit-loading">Loading\u2026</div>';
  invitesBody.innerHTML = '';

  let users = [];
  try {
    const snap = await get(ref(db, 'users'));
    if (snap.exists()) snap.forEach(c => users.push({ uid: c.key, ...c.val() }));
  } catch (e) {
    body.innerHTML = '<div class="audit-empty">Failed to load users.</div>';
    return;
  }
  users.sort((a, b) => (a.email || '').localeCompare(b.email || ''));

  let html = '<h3>Users</h3>';
  if (!users.length) {
    html += '<div class="audit-empty">No users yet.</div>';
  } else {
    html += '<table class="audit-table users-table"><thead><tr><th>Email</th><th>Role</th><th>Status</th><th>Last active</th><th>Actions</th></tr></thead><tbody>';
    const selfUid = auth.currentUser?.uid;
    for (const u of users) {
      const isSelf = u.uid === selfUid;
      const disabled = u.active === false;
      html += `<tr data-uid="${esc(u.uid)}" class="${disabled ? 'row-disabled' : ''}">
        <td>${esc(u.email)}${isSelf ? ' <span class="user-self-tag">you</span>' : ''}</td>
        <td>
          <select class="user-role-select" ${isSelf ? 'disabled' : ''}>
            <option value="editor" ${u.role === 'editor' ? 'selected' : ''}>Editor</option>
            <option value="approver" ${u.role === 'approver' ? 'selected' : ''}>Approver</option>
            <option value="superadmin" ${u.role === 'superadmin' ? 'selected' : ''}>Super Admin</option>
          </select>
        </td>
        <td>${disabled ? '<span class="status-disabled">Disabled</span>' : '<span class="status-active">Active</span>'}</td>
        <td>${u.lastActive ? formatTimeAgo(u.lastActive) : '\u2014'}</td>
        <td>
          ${isSelf ? '' :
            (disabled
              ? '<button class="btn btn-sm user-reactivate">Reactivate</button>'
              : '<button class="btn btn-sm user-deactivate">Deactivate</button>')
          }
          <button class="btn btn-sm user-resend" title="Resend password-reset email">Resend reset</button>
        </td>
      </tr>`;
    }
    html += '</tbody></table>';
  }
  body.innerHTML = html;

  body.querySelectorAll('.user-role-select').forEach(sel => {
    sel.addEventListener('change', async () => {
      const tr = sel.closest('tr');
      const uid = tr.dataset.uid;
      const newRole = sel.value;
      try {
        await update(ref(db, `users/${uid}`), { role: newRole });
        const targetEmail = users.find(u => u.uid === uid)?.email;
        logAction('change_role', null, { targetUser: targetEmail, role: newRole });
        showToast('Role updated.', 'success');
      } catch (e) {
        showToast('Failed to update role: ' + e.message, 'error');
      }
    });
  });

  body.querySelectorAll('.user-deactivate').forEach(btn => {
    btn.addEventListener('click', async () => {
      const tr = btn.closest('tr');
      const uid = tr.dataset.uid;
      const targetEmail = users.find(u => u.uid === uid)?.email;
      if (!confirm(`Deactivate ${targetEmail}? They will be unable to sign in.`)) return;
      try {
        await update(ref(db, `users/${uid}`), { active: false });
        await setAuthDisabled(uid, true);
        logAction('deactivate_user', null, { targetUser: targetEmail });
        showToast('User deactivated.', 'success');
        renderUsersList(modal);
      } catch (e) {
        showToast('Failed: ' + e.message, 'error');
      }
    });
  });
  body.querySelectorAll('.user-reactivate').forEach(btn => {
    btn.addEventListener('click', async () => {
      const tr = btn.closest('tr');
      const uid = tr.dataset.uid;
      const targetEmail = users.find(u => u.uid === uid)?.email;
      try {
        await update(ref(db, `users/${uid}`), { active: true });
        await setAuthDisabled(uid, false);
        logAction('reactivate_user', null, { targetUser: targetEmail });
        showToast('User reactivated.', 'success');
        renderUsersList(modal);
      } catch (e) {
        showToast('Failed: ' + e.message, 'error');
      }
    });
  });
  body.querySelectorAll('.user-resend').forEach(btn => {
    btn.addEventListener('click', async () => {
      const tr = btn.closest('tr');
      const uid = tr.dataset.uid;
      const email = users.find(u => u.uid === uid)?.email;
      if (!email) return;
      try {
        await sendPasswordResetEmail(auth, email);
        showToast('Password-reset email sent to ' + email + ' (check spam)', 'success');
      } catch (e) {
        showToast('Failed: ' + e.message + ' \u2014 the auth user may not exist. Try re-inviting.', 'error');
      }
    });
  });

  // Pending invites list
  try {
    const invSnap = await get(ref(db, 'invites'));
    if (invSnap.exists()) {
      const invites = [];
      invSnap.forEach(c => invites.push({ key: c.key, ...c.val() }));
      if (invites.length) {
        let h = '<h3>Pending invites</h3><table class="audit-table"><thead><tr><th>Email</th><th>Role</th><th>Invited by</th><th>Sent</th><th></th></tr></thead><tbody>';
        for (const inv of invites) {
          h += `<tr data-invite-key="${esc(inv.key)}">
            <td>${esc(inv.email)}</td>
            <td>${roleLabel(inv.role)}</td>
            <td>${esc(inv.invitedBy || '\u2014')}</td>
            <td>${inv.createdAt ? formatTimeAgo(inv.createdAt) : '\u2014'}</td>
            <td><button class="btn btn-sm invite-cancel">Cancel</button></td>
          </tr>`;
        }
        h += '</tbody></table>';
        invitesBody.innerHTML = h;
        invitesBody.querySelectorAll('.invite-cancel').forEach(b => {
          b.addEventListener('click', async () => {
            const key = b.closest('tr').dataset.inviteKey;
            await set(ref(db, `invites/${key}`), null);
            renderUsersList(modal);
          });
        });
      }
    }
  } catch (e) { /* ignore */ }
}

function esc(s) {
  const d = document.createElement('div');
  d.textContent = s == null ? '' : String(s);
  return d.innerHTML;
}
const escHtml = esc;

function formatTimeAgo(ts) {
  if (!ts) return '\u2014';
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  if (diff < 604800) return Math.floor(diff / 86400) + 'd ago';
  return new Date(ts).toLocaleDateString();
}
