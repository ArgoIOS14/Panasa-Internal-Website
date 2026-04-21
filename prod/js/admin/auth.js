import { auth } from '../firebase-config.js';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js';
import { loadUserRole, clearUserRole, currentUserRecord, watchOwnRecord, roleLabel } from './roles.js';

const ERROR_MAP = {
  'auth/invalid-email': 'Invalid email address.',
  'auth/user-not-found': 'No account found with this email.',
  'auth/wrong-password': 'Incorrect password.',
  'auth/invalid-credential': 'Invalid email or password.',
  'auth/too-many-requests': 'Too many attempts. Try again later.',
};

let _stopWatch = null;

export function initAuth({ onLogin, onLogout }) {
  const loginScreen = document.getElementById('login-screen');
  const adminPanel = document.getElementById('admin-panel');
  const loginForm = document.getElementById('login-form');
  const loginEmail = document.getElementById('login-email');
  const loginPassword = document.getElementById('login-password');
  const loginError = document.getElementById('login-error');
  const loginBtn = document.getElementById('login-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const adminUser = document.getElementById('admin-user');
  const roleBadge = document.getElementById('admin-role-badge');
  const forgotLink = document.getElementById('forgot-password-link');

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        const record = await loadUserRole(user);
        loginScreen.classList.add('admin-hidden');
        adminPanel.classList.remove('admin-hidden');
        adminUser.textContent = user.email;
        if (roleBadge) {
          roleBadge.textContent = roleLabel(record.role);
          roleBadge.dataset.role = record.role;
          roleBadge.style.display = '';
        }
        if (_stopWatch) _stopWatch();
        _stopWatch = watchOwnRecord();
        await onLogin();
      } catch (err) {
        // Role check failed — sign out and show error on login screen.
        console.warn('Role check failed:', err.message);
        loginError.textContent = err.message || 'Access denied.';
        loginError.classList.add('visible');
        loginScreen.classList.remove('admin-hidden');
        adminPanel.classList.add('admin-hidden');
        try { await signOut(auth); } catch (e) { /* ignore */ }
        clearUserRole();
      }
    } else {
      loginScreen.classList.remove('admin-hidden');
      adminPanel.classList.add('admin-hidden');
      clearUserRole();
      if (_stopWatch) { _stopWatch(); _stopWatch = null; }
      if (roleBadge) roleBadge.style.display = 'none';
      if (onLogout) onLogout();
    }
  });

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.classList.remove('visible');
    loginBtn.disabled = true;
    loginBtn.textContent = 'Signing in...';
    try {
      await signInWithEmailAndPassword(auth, loginEmail.value, loginPassword.value);
    } catch (err) {
      loginError.textContent = ERROR_MAP[err.code] || 'Sign in failed. Please try again.';
      loginError.classList.add('visible');
    } finally {
      loginBtn.disabled = false;
      loginBtn.textContent = 'Sign in';
    }
  });

  if (forgotLink) {
    forgotLink.addEventListener('click', async (e) => {
      e.preventDefault();
      const email = (loginEmail.value || '').trim();
      if (!email) {
        loginError.textContent = 'Enter your email, then click "Forgot password".';
        loginError.classList.add('visible');
        return;
      }
      try {
        await sendPasswordResetEmail(auth, email);
        loginError.textContent = 'Password reset email sent. Check your inbox.';
        loginError.classList.add('visible');
        loginError.style.color = '#16a34a';
      } catch (err) {
        loginError.textContent = ERROR_MAP[err.code] || 'Could not send reset email.';
        loginError.classList.add('visible');
        loginError.style.color = '';
      }
    });
  }

  logoutBtn.addEventListener('click', () => signOut(auth));
}

export { currentUserRecord };
