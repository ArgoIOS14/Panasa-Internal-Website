/**
 * Multi-user conflict detection for admin CMS.
 * Uses Firebase presence tracking to detect concurrent editors.
 */

import { db, auth } from '../firebase-config.js';
import { ref, set, get, onValue, off, onDisconnect } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-database.js';

let presenceRef = null;
let editingRef = null;
let unsubscribe = null;
let heartbeatInterval = null;
let loadedTimestamp = null;
let currentPageKey = null;

/**
 * Initialize conflict detection for a page.
 * Call on page load/switch.
 */
export async function initConflictDetection(pageKey) {
  // Clean up previous page's presence
  await cleanupPresence();

  const user = auth.currentUser;
  if (!user || !pageKey) return;

  currentPageKey = pageKey;
  loadedTimestamp = Date.now();

  const uid = user.uid;
  const email = user.email || 'Unknown user';

  // Write presence
  presenceRef = ref(db, `editing/${pageKey}/${uid}`);
  const presenceData = { email, timestamp: Date.now() };

  try {
    await set(presenceRef, presenceData);
    // Auto-remove presence on disconnect
    onDisconnect(presenceRef).remove();
  } catch (e) {
    console.warn('Failed to set presence:', e);
    return;
  }

  // Heartbeat — update timestamp every 30s
  heartbeatInterval = setInterval(() => {
    if (presenceRef) {
      set(presenceRef, { email, timestamp: Date.now() }).catch(() => {});
    }
  }, 30000);

  // Watch for other editors
  editingRef = ref(db, `editing/${pageKey}`);
  unsubscribe = onValue(editingRef, snapshot => {
    const editors = snapshot.val();
    if (!editors) {
      hideConflictBanner();
      return;
    }

    const otherEditors = [];
    const staleThreshold = 60000; // 1 minute

    Object.entries(editors).forEach(([editorUid, data]) => {
      if (editorUid === uid) return;
      // Only show if active within last minute
      if (Date.now() - (data.timestamp || 0) < staleThreshold) {
        otherEditors.push(data);
      }
    });

    if (otherEditors.length > 0) {
      showConflictBanner(otherEditors);
    } else {
      hideConflictBanner();
    }
  });
}

/**
 * Clean up presence and listeners for current page.
 */
export async function cleanupPresence() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }

  if (presenceRef) {
    try { await set(presenceRef, null); } catch (e) { /* ignore */ }
    presenceRef = null;
  }

  if (unsubscribe && typeof unsubscribe === 'function') {
    unsubscribe();
    unsubscribe = null;
    editingRef = null;
  } else if (editingRef) {
    off(editingRef);
    editingRef = null;
  }

  hideConflictBanner();
}

/**
 * Check if the page was modified by someone else since we loaded it.
 * Call before save/publish.
 * @returns {{ hasConflict: boolean, lastModified: number|null }}
 */
export async function checkForConflicts(pageKey) {
  if (!pageKey) return { hasConflict: false };

  try {
    // Determine the Firebase path for this page
    const fbPath = getPageFbPath(pageKey);
    if (!fbPath) return { hasConflict: false };

    const snapshot = await get(ref(db, fbPath + '/_lastModified'));
    const lastModified = snapshot.val();

    if (lastModified && loadedTimestamp && lastModified > loadedTimestamp) {
      return { hasConflict: true, lastModified };
    }
  } catch (e) {
    console.warn('Conflict check failed:', e);
  }

  return { hasConflict: false };
}

/**
 * Show the conflict warning banner.
 */
function showConflictBanner(otherEditors) {
  let banner = document.getElementById('conflict-banner');
  if (!banner) return;

  const names = otherEditors.map(e => `<strong>${escHtml(e.email)}</strong>`).join(', ');
  const timeAgo = otherEditors.length > 0 ? formatTimeAgo(otherEditors[0].timestamp) : '';

  banner.innerHTML = `\u26a0\ufe0f ${names} is also editing this page${timeAgo ? ' (active ' + timeAgo + ')' : ''}`;
  banner.style.display = 'flex';
}

function hideConflictBanner() {
  const banner = document.getElementById('conflict-banner');
  if (banner) {
    banner.style.display = 'none';
    banner.innerHTML = '';
  }
}

function formatTimeAgo(timestamp) {
  if (!timestamp) return '';
  const diff = Math.floor((Date.now() - timestamp) / 1000);
  if (diff < 10) return 'just now';
  if (diff < 60) return diff + 's ago';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  return Math.floor(diff / 3600) + 'h ago';
}

function getPageFbPath(pageKey) {
  // Mirror the PageRegistry mapping
  const paths = {
    home: 'pages/home',
    about: 'pages/about',
    aiAcceleratedEngineering: 'content',
    aiGovernance: 'pages/aiGovernance',
    legacyModernisation: 'pages/legacyModernisation',
    intelligentOperations: 'pages/intelligentOperations',
    servicesOverview: 'pages/servicesOverview',
    contact: 'pages/contact',
    careers: 'pages/careers',
    privacyPolicy: 'pages/privacyPolicy',
  };
  return paths[pageKey] || null;
}

function escHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (presenceRef) {
      // Use navigator.sendBeacon pattern — but for Firebase, just try sync remove
      try { set(presenceRef, null); } catch (e) { /* best effort */ }
    }
  });
}
