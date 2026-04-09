import { auth } from '../firebase-config.js';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js';

const ERROR_MAP = {
  'auth/invalid-email': 'Invalid email address.',
  'auth/user-not-found': 'No account found with this email.',
  'auth/wrong-password': 'Incorrect password.',
  'auth/invalid-credential': 'Invalid email or password.',
  'auth/too-many-requests': 'Too many attempts. Try again later.',
};

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

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      loginScreen.classList.add('admin-hidden');
      adminPanel.classList.remove('admin-hidden');
      adminUser.textContent = user.email;
      await onLogin();
    } else {
      loginScreen.classList.remove('admin-hidden');
      adminPanel.classList.add('admin-hidden');
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

  logoutBtn.addEventListener('click', () => signOut(auth));
}
