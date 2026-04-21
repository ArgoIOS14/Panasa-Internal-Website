/**
 * Role-based access control for admin CMS.
 *
 * Roles: 'superadmin' | 'approver' | 'editor'
 *   - superadmin: everything, including user management. Publishes instantly.
 *   - approver: can publish/approve reviews. Cannot manage users.
 *   - editor: can only draft content + submit for review.
 *
 * Roles are stored in Firebase RTDB at `users/{uid}`. Client-side gating is
 * UX only — real enforcement is in `firebase.rules.json`.
 *
 * Bootstrap: the first user in SEED_SUPERADMINS to ever log in will be
 * auto-created as a superadmin. All other users must be invited via the
 * Users modal (which writes to `invites/{sanitizedEmail}`).
 */

import { db, auth } from '../firebase-config.js';
import { ref, get, set, update, onValue } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-database.js';

// Seed list — the first of these to log in is auto-created as superadmin.
export const SEED_SUPERADMINS = ['arjun.g@panasatech.com'];

let _currentUserRecord = null; // { uid, email, role, active, ... }
let _roleListeners = new Set();

/**
 * Sanitize email for use as a Firebase key. Firebase disallows
 * `.`, `#`, `$`, `[`, `]`, `/` in keys. We percent-encode each distinct
 * illegal char so no two different emails can collide on the same key
 * (e.g. `a.b@x.com` vs `a_b@x.com` used to collide under a naive
 * replacement to `_`).
 */
export function sanitizeEmailKey(email) {
  return String(email || '').toLowerCase()
    .replace(/%/g, '%25')  // escape existing % first
    .replace(/\./g, '%2E')
    .replace(/#/g,  '%23')
    .replace(/\$/g, '%24')
    .replace(/\[/g, '%5B')
    .replace(/\]/g, '%5D')
    .replace(/\//g, '%2F');
}

/** Legacy sanitization used by older invites. Kept only for lookup fallback. */
function legacyEmailKey(email) {
  return String(email || '').toLowerCase().replace(/[.#$\[\]\/]/g, '_');
}

/**
 * Load role for the given auth user, creating a record if needed.
 * Returns { uid, email, role, active, ... } or throws if not allowed.
 */
export async function loadUserRole(user) {
  if (!user) throw new Error('Not authenticated');
  const { uid, email } = user;

  // 1. Check existing user record
  const userRef = ref(db, `users/${uid}`);
  let snap;
  try {
    snap = await get(userRef);
  } catch (err) {
    // Permission-denied on a brand-new DB with strict rules: fall through
    // so bootstrap/invite logic can still try to write this record.
    console.warn('users/{uid} read failed, attempting bootstrap:', err.message);
    snap = { exists: () => false };
  }
  if (snap.exists()) {
    const rec = { uid, ...snap.val() };
    if (rec.active === false) {
      throw new Error('Your account has been disabled. Contact an administrator.');
    }
    // Update last active timestamp (best effort, non-blocking).
    update(userRef, { lastActive: Date.now() }).catch(() => {});
    _currentUserRecord = rec;
    _notifyRoleListeners();
    return rec;
  }

  // 2. Check if there's a pending invite for this email.
  // Try new encoding first, then the legacy encoding (for invites created
  // before the collision fix).
  const inviteKey = sanitizeEmailKey(email);
  const legacyKey = legacyEmailKey(email);
  let inviteRef = ref(db, `invites/${inviteKey}`);
  let inviteSnap;
  try {
    inviteSnap = await get(inviteRef);
    if (!inviteSnap.exists() && legacyKey !== inviteKey) {
      inviteRef = ref(db, `invites/${legacyKey}`);
      inviteSnap = await get(inviteRef);
    }
  } catch (err) {
    inviteSnap = { exists: () => false };
  }
  if (inviteSnap.exists()) {
    const invite = inviteSnap.val();
    const role = (invite.role === 'superadmin' || invite.role === 'approver' || invite.role === 'editor')
      ? invite.role
      : 'editor';
    const newRec = {
      email,
      role,
      active: true,
      createdAt: Date.now(),
      lastActive: Date.now(),
      invitedBy: invite.invitedBy || 'system',
    };
    await set(userRef, newRec);
    await set(inviteRef, null);
    const rec = { uid, ...newRec };
    _currentUserRecord = rec;
    _notifyRoleListeners();
    return rec;
  }

  // 3. Seed bootstrap — first superadmin
  if (SEED_SUPERADMINS.includes(String(email || '').toLowerCase())) {
    const newRec = {
      email,
      role: 'superadmin',
      active: true,
      createdAt: Date.now(),
      lastActive: Date.now(),
      invitedBy: 'seed',
    };
    await set(userRef, newRec);
    const rec = { uid, ...newRec };
    _currentUserRecord = rec;
    _notifyRoleListeners();
    return rec;
  }

  // 4. Rejected
  throw new Error('Your account has not been invited. Please contact an administrator.');
}

/** Clear cached role on sign-out. */
export function clearUserRole() {
  _currentUserRecord = null;
  _notifyRoleListeners();
}

/** Get the currently-loaded user record, or null. */
export function currentUserRecord() {
  return _currentUserRecord;
}

export function currentRole() {
  return _currentUserRecord?.role || null;
}

export function isSuperAdmin() {
  return currentRole() === 'superadmin';
}

export function isApprover() {
  return currentRole() === 'approver';
}

export function isEditor() {
  return currentRole() === 'editor';
}

/** Can this user publish directly (bypassing review)? */
export function canPublish() {
  const r = currentRole();
  return r === 'superadmin' || r === 'approver';
}

/** Can this user review/approve editor submissions? */
export function canReview() {
  return canPublish();
}

/** Can this user manage other users and roles? */
export function canManageUsers() {
  return isSuperAdmin();
}

/**
 * Subscribe to role changes in this session. Useful for reacting to
 * role updates pushed from another tab (e.g. a superadmin promoted you).
 */
export function onRoleChange(fn) {
  _roleListeners.add(fn);
  fn(_currentUserRecord);
  return () => _roleListeners.delete(fn);
}

function _notifyRoleListeners() {
  for (const fn of _roleListeners) {
    try { fn(_currentUserRecord); } catch (e) { /* ignore */ }
  }
}

/** Live-watch the current user's record so role changes apply without re-login. */
export function watchOwnRecord() {
  const user = auth.currentUser;
  if (!user) return () => {};
  const r = ref(db, `users/${user.uid}`);
  return onValue(r, snap => {
    if (!snap.exists()) return;
    _currentUserRecord = { uid: user.uid, ...snap.val() };
    _notifyRoleListeners();
    if (_currentUserRecord.active === false) {
      // Force reload so auth logic rejects next tick.
      setTimeout(() => location.reload(), 500);
    }
  });
}

/** Friendly label for display. */
export function roleLabel(role) {
  if (role === 'superadmin') return 'Super Admin';
  if (role === 'approver') return 'Approver';
  if (role === 'editor') return 'Editor';
  return role || '\u2014';
}
