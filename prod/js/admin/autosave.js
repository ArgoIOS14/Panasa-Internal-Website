/**
 * Auto-save module for admin CMS.
 * Periodically saves drafts to Firebase when changes are detected.
 */

import { db } from '../firebase-config.js';
import { ref, set } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-database.js';

const AUTOSAVE_INTERVAL = 30000; // 30 seconds

let interval = null;
let getDataFn = null;
let getFbPathFn = null;
let lastSavedHash = null;
let statusEl = null;
let statusTimer = null;

/**
 * Initialize auto-save.
 * @param {Function} getData - Returns current page data (after reading forms)
 * @param {Function} getFbPath - Returns current Firebase draft path
 */
export function initAutosave(getData, getFbPath) {
  getDataFn = getData;
  getFbPathFn = getFbPath;
  statusEl = document.getElementById('autosave-status');

  // Initial hash
  try {
    const data = getData();
    lastSavedHash = computeHash(data);
  } catch (e) { /* */ }

  // Start periodic save
  stopAutosave();
  interval = setInterval(doAutosave, AUTOSAVE_INTERVAL);

  // Save on page hide (tab switch, minimize)
  document.addEventListener('visibilitychange', onVisibilityChange);
}

/**
 * Stop auto-save. Call on page switch or logout.
 */
export function stopAutosave() {
  if (interval) {
    clearInterval(interval);
    interval = null;
  }
  document.removeEventListener('visibilitychange', onVisibilityChange);
}

/**
 * Reset the saved hash to current data state.
 * Call after manual save/publish so autosave doesn't re-save identical data.
 */
export function resetAutosaveHash() {
  try {
    const data = getDataFn?.();
    if (data) lastSavedHash = computeHash(data);
  } catch (e) { /* */ }
}

/**
 * Core auto-save logic.
 */
async function doAutosave() {
  if (!getDataFn || !getFbPathFn) return;

  try {
    const data = getDataFn();
    if (!data) return;

    const currentHash = computeHash(data);
    if (currentHash === lastSavedHash) return; // No changes

    const fbPath = getFbPathFn();
    if (!fbPath) return;

    // Derive draft path (same logic as state.js)
    const draftPath = fbPath.startsWith('pages/')
      ? `drafts/${fbPath.replace('pages/', '')}`
      : `drafts/${fbPath}`;

    await set(ref(db, draftPath), data);
    lastSavedHash = currentHash;
    showStatus('Auto-saved');
  } catch (err) {
    console.warn('Auto-save failed:', err);
    showStatus('Auto-save failed');
  }
}

function onVisibilityChange() {
  if (document.visibilityState === 'hidden') {
    doAutosave(); // Fire-and-forget on page hide
  }
}

/**
 * Show a temporary status message.
 */
function showStatus(message) {
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.style.opacity = '1';

  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => {
    statusEl.style.opacity = '0';
  }, 3000);
}

/**
 * Compute a fast (non-cryptographic) hash of the data.
 */
function computeHash(data) {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) & 0xFFFFFFFF;
  }
  return str.length + '_' + (hash >>> 0).toString(36);
}
