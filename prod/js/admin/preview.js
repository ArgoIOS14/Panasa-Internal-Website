/**
 * Live preview panel for admin CMS.
 *
 * Two update channels:
 *  1. LIVE (primary)    — postMessage current data to the iframe on every
 *                          field change (debounced 150ms). No reload, no
 *                          Firebase roundtrip. Updates appear instantly.
 *  2. FALLBACK (backup) — if the iframe doesn't have live-preview-receiver,
 *                          fall back to save-draft + iframe reload (old
 *                          behavior, ~1s delay). Triggered if we haven't
 *                          heard a "ready" handshake from the iframe.
 */

let previewActive = false;
let iframe = null;
let liveTimer = null;
let fallbackTimer = null;
let getUrlFn = null;
let getDataFn = null;
let saveFn = null;
let livePreviewReady = false; // true once iframe sends the ready handshake

/**
 * @param {Function} getPreviewUrl - Returns current page's preview URL
 * @param {Function} saveDraftFn   - async: saves current draft (fallback only)
 * @param {Function} getCurrentData - Returns the current in-memory data object
 */
export function initPreview(getPreviewUrl, saveDraftFn, getCurrentData) {
  getUrlFn = getPreviewUrl;
  saveFn = saveDraftFn;
  getDataFn = getCurrentData;

  const toggleBtn = document.getElementById('preview-toggle');
  const closeBtn = document.getElementById('preview-close');
  iframe = document.getElementById('preview-iframe');

  if (toggleBtn) toggleBtn.addEventListener('click', togglePreview);
  if (closeBtn) closeBtn.addEventListener('click', closePreview);

  document.querySelectorAll('[data-device]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-device]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (iframe) {
        iframe.className = 'preview-iframe ' + (btn.dataset.device !== 'desktop' ? btn.dataset.device : '');
      }
    });
  });

  // Listen for live-preview-ready handshake from the iframe
  window.addEventListener('message', onIframeMessage);

  // Listen for editor changes
  const editor = document.querySelector('.admin-editor') || document.getElementById('editor-sections');
  if (editor) {
    editor.addEventListener('input', onEditorChange);
    editor.addEventListener('change', onEditorChange);
  }
}

function onIframeMessage(event) {
  if (!event.data || typeof event.data !== 'object') return;
  if (event.data.type === 'panasa-live-preview-ready') {
    livePreviewReady = true;
    console.log('[live-preview] Handshake received from iframe');
  }
}

function onEditorChange() {
  if (!previewActive) return;

  if (livePreviewReady) {
    // LIVE: debounced postMessage (fast)
    clearTimeout(liveTimer);
    liveTimer = setTimeout(sendLiveUpdate, 150);
  } else {
    console.log('[live-preview] editor changed but handshake not received yet — falling back to save+reload');
    // FALLBACK: debounced save-draft + reload (slow)
    clearTimeout(fallbackTimer);
    fallbackTimer = setTimeout(fallbackRefresh, 1000);
  }
}

function sendLiveUpdate() {
  if (!iframe || !iframe.contentWindow || !getDataFn) return;
  try {
    const data = getDataFn();
    if (!data) return;
    console.log('[live-preview] Sending update to iframe', Object.keys(data));
    iframe.contentWindow.postMessage({
      type: 'panasa-live-preview',
      data,
    }, '*');
  } catch (e) {
    // If postMessage fails (e.g., cross-origin), fall back
    livePreviewReady = false;
    fallbackRefresh();
  }
}

async function fallbackRefresh() {
  if (!previewActive) return;
  if (typeof saveFn === 'function') {
    try { await saveFn(); } catch (e) { /* non-blocking */ }
  }
  loadIframe();
}

export function togglePreview() {
  if (previewActive) closePreview();
  else openPreview();
}

function openPreview() {
  previewActive = true;
  livePreviewReady = false; // Reset handshake; iframe will announce when ready
  document.body.classList.add('preview-active');
  const panel = document.getElementById('preview-panel');
  if (panel) panel.style.display = 'flex';

  const toggleBtn = document.getElementById('preview-toggle');
  if (toggleBtn) toggleBtn.classList.add('active');

  loadIframe();
}

export function closePreview() {
  previewActive = false;
  livePreviewReady = false;
  clearTimeout(liveTimer);
  clearTimeout(fallbackTimer);
  liveTimer = null;
  fallbackTimer = null;
  document.body.classList.remove('preview-active');
  const panel = document.getElementById('preview-panel');
  if (panel) panel.style.display = 'none';

  const toggleBtn = document.getElementById('preview-toggle');
  if (toggleBtn) toggleBtn.classList.remove('active');

  if (iframe) iframe.src = 'about:blank';
}

export function refreshPreview() {
  if (!previewActive) return;
  loadIframe();
}

function loadIframe() {
  if (!iframe || !getUrlFn) return;
  let url = getUrlFn();
  if (!url) return;
  // Strip .html so we hit the clean-URL path directly, avoiding a redirect
  // that could drop the query string and prevent live preview from loading.
  url = url.replace(/\.html(?=\?|$)/, '');
  const separator = url.includes('?') ? '&' : '?';
  iframe.src = url + separator + 'preview=true&t=' + Date.now();
  // Reset handshake — new iframe load will announce readiness
  livePreviewReady = false;
}
