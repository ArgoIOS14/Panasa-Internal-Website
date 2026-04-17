/**
 * Live preview panel for admin CMS.
 * Shows an iframe with the page being edited in a split view.
 */

let previewActive = false;
let iframe = null;
let refreshTimer = null;
let getUrlFn = null;
let saveFn = null;

/**
 * Initialize preview system.
 * @param {Function} getPreviewUrl - Returns current page's preview URL
 * @param {Function} saveDraftFn - Saves the current draft (async)
 */
export function initPreview(getPreviewUrl, saveDraftFn) {
  getUrlFn = getPreviewUrl;
  saveFn = saveDraftFn;

  const toggleBtn = document.getElementById('preview-toggle');
  const closeBtn = document.getElementById('preview-close');
  iframe = document.getElementById('preview-iframe');

  if (toggleBtn) toggleBtn.addEventListener('click', togglePreview);
  if (closeBtn) closeBtn.addEventListener('click', closePreview);

  // Device toggle buttons
  document.querySelectorAll('[data-device]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-device]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (iframe) {
        iframe.className = 'preview-iframe ' + (btn.dataset.device !== 'desktop' ? btn.dataset.device : '');
      }
    });
  });

  // Listen for editor changes to auto-refresh preview
  const editor = document.querySelector('.admin-editor') || document.getElementById('editor-sections');
  if (editor) {
    editor.addEventListener('input', debounceRefresh);
    editor.addEventListener('change', debounceRefresh);
  }
}

/**
 * Toggle preview panel on/off.
 */
export function togglePreview() {
  if (previewActive) {
    closePreview();
  } else {
    openPreview();
  }
}

function openPreview() {
  previewActive = true;
  document.body.classList.add('preview-active');
  const panel = document.getElementById('preview-panel');
  if (panel) panel.style.display = 'flex';

  const toggleBtn = document.getElementById('preview-toggle');
  if (toggleBtn) toggleBtn.classList.add('active');

  loadIframe();
}

/**
 * Close preview panel.
 */
export function closePreview() {
  previewActive = false;
  clearTimeout(refreshTimer);
  refreshTimer = null;
  document.body.classList.remove('preview-active');
  const panel = document.getElementById('preview-panel');
  if (panel) panel.style.display = 'none';

  const toggleBtn = document.getElementById('preview-toggle');
  if (toggleBtn) toggleBtn.classList.remove('active');

  if (iframe) iframe.src = 'about:blank';
}

/**
 * Refresh the preview iframe (debounced).
 */
export function refreshPreview() {
  if (!previewActive) return;
  loadIframe();
}

function loadIframe() {
  if (!iframe || !getUrlFn) return;
  const url = getUrlFn();
  if (!url) return;
  const separator = url.includes('?') ? '&' : '?';
  iframe.src = url + separator + 'preview=true&t=' + Date.now();
}

function debounceRefresh() {
  if (!previewActive) return;
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(async () => {
    if (typeof saveFn === 'function') {
      try { await saveFn(); } catch (e) { /* non-blocking */ }
    }
    loadIframe();
  }, 1000);
}
