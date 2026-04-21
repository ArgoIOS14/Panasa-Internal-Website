/**
 * Rebuild status badge for admin CMS header.
 * Tracks whether static HTML is in sync with published content.
 */

let badgeEl = null;
let currentPageKey = null;

/**
 * Initialize rebuild status badge.
 */
export function initRebuildStatus() {
  badgeEl = document.getElementById('rebuild-status');

  const rebuildBtn = document.getElementById('rebuild-btn');
  if (rebuildBtn) {
    rebuildBtn.addEventListener('click', () => {
      // Manual rebuild triggered via custom event
      document.dispatchEvent(new CustomEvent('manual-rebuild'));
    });
  }

  // Click the failed badge to retry the rebuild
  if (badgeEl) {
    badgeEl.addEventListener('click', () => {
      if (badgeEl.classList.contains('failed')) {
        document.dispatchEvent(new CustomEvent('manual-rebuild'));
      }
    });
  }
}

/**
 * Set the rebuild state for a page.
 * @param {'idle'|'rebuilding'|'success'|'failed'} state
 * @param {string} pageKey
 */
export function setRebuildState(state, pageKey) {
  currentPageKey = pageKey;

  if (!badgeEl) return;

  badgeEl.className = 'rebuild-badge ' + state;

  switch (state) {
    case 'idle':
      badgeEl.innerHTML = '';
      badgeEl.style.display = 'none';
      break;
    case 'rebuilding':
      badgeEl.innerHTML = '<span class="dot"></span> Rebuilding\u2026';
      badgeEl.style.display = 'inline-flex';
      break;
    case 'success':
      badgeEl.innerHTML = '<span class="dot"></span> HTML synced';
      badgeEl.style.display = 'inline-flex';
      sessionStorage.setItem('rebuild_' + pageKey, 'success');
      break;
    case 'failed':
      badgeEl.innerHTML = '<span class="dot"></span> <span class="rebuild-retry">Rebuild failed \u2014 click to retry</span>';
      badgeEl.style.display = 'inline-flex';
      badgeEl.style.cursor = 'pointer';
      sessionStorage.setItem('rebuild_' + pageKey, 'failed');
      break;
  }
}

/**
 * Restore rebuild state from sessionStorage on page switch.
 */
export function restoreRebuildState(pageKey) {
  currentPageKey = pageKey;
  const stored = sessionStorage.getItem('rebuild_' + pageKey);
  if (stored === 'success' || stored === 'failed') {
    setRebuildState(stored, pageKey);
  } else {
    setRebuildState('idle', pageKey);
  }
}

/**
 * Trigger a manual rebuild via the API.
 * @param {string} pageKey
 * @param {object} data
 * @param {Function} getToken - async function returning Firebase ID token
 */
export async function triggerManualRebuild(pageKey, data, getToken) {
  setRebuildState('rebuilding', pageKey);
  try {
    const token = await getToken();
    const res = await fetch('/api/rebuild.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + (token || ''),
      },
      body: JSON.stringify({ pageKey, data }),
    });
    const result = await res.json();
    setRebuildState(result.status === 'success' ? 'success' : 'failed', pageKey);
    return result;
  } catch (err) {
    console.warn('Manual rebuild failed:', err);
    setRebuildState('failed', pageKey);
    return { status: 'error', message: err.message };
  }
}
