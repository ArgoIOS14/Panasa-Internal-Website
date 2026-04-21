/**
 * Live preview receiver — thin dispatcher.
 *
 * Loaded only when URL has ?preview=true. Listens for postMessage from
 * the admin iframe parent and dispatches the data to
 * `window.__livePreviewRender(data)`, which each page script is
 * responsible for defining using its own renderers.
 *
 * This keeps the receiver page-agnostic — home, service detail pages,
 * about, contact, etc. each wire up their own render logic.
 *
 * Message protocol:
 *   window.parent.postMessage({
 *     type: 'panasa-live-preview',
 *     data: { ... page-specific data ... },
 *   }, '*');
 */

function onMessage(event) {
  const msg = event.data;
  if (!msg || typeof msg !== 'object') return;

  if (msg.type === 'panasa-live-preview') {
    console.log('[live-preview receiver] Received update', Object.keys(msg.data || {}));
    if (typeof window.__livePreviewRender === 'function') {
      try {
        window.__livePreviewRender(msg.data);
        console.log('[live-preview receiver] Render complete');
      } catch (err) {
        console.warn('[live-preview] render failed:', err);
      }
    } else {
      console.warn('[live-preview] no render handler registered on this page');
    }
    return;
  }

  if (msg.type === 'panasa-scroll-to') {
    scrollToSection(msg.key);
    return;
  }
}

/**
 * Try to locate a section element by its data key and scroll it into view.
 * Strategies, in order:
 *   1. [data-section="key"]                          — explicit annotation
 *   2. #{key}, #{key}-section                        — id match
 *   3. section.{key}, .{key}-section, section[data-key="{key}"]
 *   4. First element whose class list includes the key (case-insensitive)
 */
function scrollToSection(key) {
  if (!key) return;
  const safe = String(key).replace(/[^a-zA-Z0-9_-]/g, '');
  if (!safe) return;
  const candidates = [
    `[data-section="${safe}"]`,
    `#${safe}`,
    `#${safe}-section`,
    `section.${safe}`,
    `.${safe}-section`,
    `section[data-key="${safe}"]`,
    `[data-key="${safe}"]`,
  ];
  let el = null;
  for (const sel of candidates) {
    try { el = document.querySelector(sel); if (el) break; } catch (_) { /* invalid selector */ }
  }
  if (!el) {
    // Fallback: scan class names
    const lower = safe.toLowerCase();
    const all = document.querySelectorAll('section, [class*="' + lower + '"]');
    for (const node of all) {
      const cls = (node.className || '').toString().toLowerCase();
      if (cls.split(/\s+/).some(c => c === lower || c.startsWith(lower + '-') || c.endsWith('-' + lower))) {
        el = node;
        break;
      }
    }
  }
  if (el) {
    try {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Brief highlight so the reviewer sees where it jumped.
      const prev = el.style.outline;
      el.style.outline = '3px solid #10b981';
      el.style.outlineOffset = '4px';
      el.style.transition = 'outline-color 0.6s ease';
      setTimeout(() => { el.style.outline = prev || ''; el.style.outlineOffset = ''; }, 1500);
    } catch (e) { /* ignore */ }
  } else {
    console.warn('[live-preview receiver] No element found for section key:', key);
  }
}

export function initLivePreviewReceiver() {
  window.addEventListener('message', onMessage);
  console.log('[live-preview receiver] Initialized, sending handshake to parent');

  // Announce to parent that we're ready to receive updates.
  // The page script may register __livePreviewRender synchronously or
  // asynchronously; the admin will retry the handshake if needed.
  try {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'panasa-live-preview-ready' }, '*');
      console.log('[live-preview receiver] Handshake sent');
    } else {
      console.warn('[live-preview receiver] No parent window — preview not in iframe?');
    }
  } catch (e) {
    console.warn('[live-preview receiver] Handshake failed', e);
  }
}

if (!window.__livePreviewInit) {
  window.__livePreviewInit = true;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLivePreviewReceiver);
  } else {
    initLivePreviewReceiver();
  }
}
