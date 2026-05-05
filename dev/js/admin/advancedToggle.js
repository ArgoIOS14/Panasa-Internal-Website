/**
 * Tiny global "Advanced mode" toggle for the admin UI. Persists in localStorage
 * so the editor's preference survives reloads. Subscribers re-render their fields
 * on toggle so raw textareas / form widgets swap in/out without a full page change.
 *
 * Used by:
 *   - Robots.txt page (Phase C): form rules ↔ raw textarea
 *   - Site SEO page: structured form ↔ raw <head> snippet
 *   - Per-page Structured Data section: pre-built shapes ↔ raw JSON-LD textarea
 */

const STORAGE_KEY = 'panasa_admin_advanced_mode';
const _listeners = new Set();
let _mode = false;

/** Hydrate the cached mode from localStorage on module import. */
try {
  _mode = localStorage.getItem(STORAGE_KEY) === '1';
} catch (_) {
  /* storage may be disabled in private browsing — default to off */
}

export function getAdvancedMode() {
  return _mode;
}

export function setAdvancedMode(on) {
  const next = !!on;
  if (next === _mode) return;
  _mode = next;
  try { localStorage.setItem(STORAGE_KEY, next ? '1' : '0'); } catch (_) {}
  for (const fn of _listeners) {
    try { fn(_mode); } catch (e) { /* ignore listener errors */ }
  }
}

export function onAdvancedToggle(fn) {
  _listeners.add(fn);
  /* Fire once with the current state so subscribers can mount in the right mode. */
  try { fn(_mode); } catch (e) { /* ignore */ }
  return () => _listeners.delete(fn);
}

/**
 * Wire a small toggle button to the DOM. Pass a host element (typically a
 * toolbar slot); a styled `[Advanced ▾]` button is appended that flips state
 * on click and reflects current mode in its label.
 */
export function mountAdvancedToggle(host, opts = {}) {
  if (!host) return null;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'advanced-toggle-btn';
  const baseStyle = 'background:#fff;color:#374151;border:1px solid #d1d5db;border-radius:6px;padding:6px 10px;cursor:pointer;font-weight:500;font-size:12px;display:inline-flex;align-items:center;gap:6px;';
  const onStyle   = 'background:#312e81;color:#fff;border-color:#312e81;border-radius:6px;padding:6px 10px;cursor:pointer;font-weight:600;font-size:12px;display:inline-flex;align-items:center;gap:6px;';
  const apply = () => {
    btn.style.cssText = _mode ? onStyle : baseStyle;
    btn.textContent = _mode ? '⚙ Advanced: ON' : '⚙ Advanced: off';
    btn.title = _mode
      ? 'Advanced mode is ON. Raw textareas + power-user fields are visible. Click to switch back to the guided form UI.'
      : 'Click to enable advanced mode (raw textareas for robots.txt, custom <head>, custom JSON-LD).';
  };
  apply();
  btn.addEventListener('click', () => setAdvancedMode(!_mode));
  onAdvancedToggle(apply);
  host.appendChild(btn);
  return btn;
}
