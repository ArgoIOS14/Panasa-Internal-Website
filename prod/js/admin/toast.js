/**
 * Toast notification system for the Panasa admin CMS.
 *
 * Single fixed-position container in the top-right of the viewport.
 * Slide-in / fade-out animation. Max 3 visible at once — older toasts
 * are dismissed when a 4th arrives.
 *
 *   import { toast, friendlyError } from './toast.js';
 *
 *   toast.success('Saved!');
 *   toast.error('Save failed', { detail: friendlyError(err) });
 *   toast.show('Heads up', { kind: 'warn', duration: 0, action: { label: 'Undo', onClick: () => …} });
 */

const CONTAINER_ID = 'panasa-toasts';
const MAX_VISIBLE = 3;
const DEFAULT_DURATIONS = { info: 4000, success: 4000, warn: 8000, error: 8000 };
const KIND_COLORS = {
  info: '#3b82f6',
  success: '#10b981',
  warn: '#f59e0b',
  error: '#ef4444',
};

/* track currently-mounted toasts in insertion order so we can evict the oldest */
const _liveToasts = [];

function _ensureContainer() {
  let el = document.getElementById(CONTAINER_ID);
  if (el) return el;
  el = document.createElement('div');
  el.id = CONTAINER_ID;
  el.style.cssText = [
    'position: fixed',
    'top: 16px',
    'right: 16px',
    'z-index: 100100',
    'display: flex',
    'flex-direction: column',
    'gap: 8px',
    'pointer-events: none',
  ].join('; ');
  document.body.appendChild(el);
  return el;
}

function _dismiss(node) {
  if (!node || node._dismissed) return;
  node._dismissed = true;
  if (node._timerId) {
    clearTimeout(node._timerId);
    node._timerId = null;
  }
  // Animate out
  node.style.transition = 'opacity 180ms ease, transform 180ms ease';
  node.style.opacity = '0';
  node.style.transform = 'translateX(24px)';
  const idx = _liveToasts.indexOf(node);
  if (idx !== -1) _liveToasts.splice(idx, 1);
  setTimeout(() => {
    if (node.parentNode) node.parentNode.removeChild(node);
  }, 220);
}

function _build(message, opts) {
  const kind = (opts && opts.kind) || 'info';
  const accent = KIND_COLORS[kind] || KIND_COLORS.info;
  const duration =
    opts && Object.prototype.hasOwnProperty.call(opts, 'duration')
      ? opts.duration
      : DEFAULT_DURATIONS[kind] != null
        ? DEFAULT_DURATIONS[kind]
        : 4000;

  const node = document.createElement('div');
  node.setAttribute('role', 'status');
  node.setAttribute('aria-live', kind === 'error' ? 'assertive' : 'polite');
  node.style.cssText = [
    'pointer-events: auto',
    'background: #ffffff',
    'color: #1f2937',
    `border-left: 4px solid ${accent}`,
    'border-radius: 6px',
    'box-shadow: 0 6px 18px rgba(15, 23, 42, 0.12), 0 2px 4px rgba(15, 23, 42, 0.06)',
    'font: 13px/1.45 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    'max-width: 360px',
    'min-width: 220px',
    'padding: 12px 14px',
    'display: flex',
    'align-items: flex-start',
    'gap: 10px',
    'opacity: 0',
    'transform: translateX(24px)',
    'transition: opacity 200ms ease, transform 200ms ease',
  ].join('; ');

  // Body
  const body = document.createElement('div');
  body.style.cssText = 'flex: 1 1 auto; min-width: 0;';

  const msgEl = document.createElement('div');
  msgEl.textContent = message == null ? '' : String(message);
  msgEl.style.cssText = 'font-weight: 500; word-break: break-word;';
  body.appendChild(msgEl);

  if (opts && opts.detail) {
    const detailEl = document.createElement('div');
    detailEl.textContent = String(opts.detail);
    detailEl.style.cssText = 'margin-top: 4px; font-size: 12px; color: #4b5563; word-break: break-word;';
    body.appendChild(detailEl);
  }

  if (opts && opts.action && opts.action.label) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = opts.action.label;
    btn.style.cssText = [
      'margin-top: 8px',
      'background: transparent',
      `color: ${accent}`,
      'border: none',
      'padding: 0',
      'font: inherit',
      'font-weight: 600',
      'cursor: pointer',
      'text-decoration: underline',
    ].join('; ');
    btn.addEventListener('click', (ev) => {
      try {
        if (typeof opts.action.onClick === 'function') opts.action.onClick(ev);
      } finally {
        _dismiss(node);
      }
    });
    body.appendChild(btn);
  }

  node.appendChild(body);

  // Close button
  const close = document.createElement('button');
  close.type = 'button';
  close.setAttribute('aria-label', 'Dismiss notification');
  close.textContent = '×';
  close.style.cssText = [
    'flex: 0 0 auto',
    'background: transparent',
    'border: none',
    'color: #9ca3af',
    'cursor: pointer',
    'font-size: 18px',
    'line-height: 1',
    'padding: 0 2px',
    'margin-left: 4px',
  ].join('; ');
  close.addEventListener('click', () => _dismiss(node));
  node.appendChild(close);

  // Auto-dismiss
  if (duration && Number(duration) > 0) {
    node._timerId = setTimeout(() => _dismiss(node), Number(duration));
  }

  return node;
}

function show(message, opts) {
  if (typeof document === 'undefined' || !document.body) return null;
  const container = _ensureContainer();
  const node = _build(message, opts);
  container.appendChild(node);
  _liveToasts.push(node);

  // Evict oldest while above cap
  while (_liveToasts.length > MAX_VISIBLE) {
    const oldest = _liveToasts[0];
    _dismiss(oldest);
  }

  // Trigger slide-in on next frame
  requestAnimationFrame(() => {
    node.style.opacity = '1';
    node.style.transform = 'translateX(0)';
  });

  return node;
}

export const toast = {
  show,
  success(message, opts) {
    return show(message, Object.assign({}, opts, { kind: 'success' }));
  },
  error(message, opts) {
    return show(message, Object.assign({}, opts, { kind: 'error' }));
  },
  warn(message, opts) {
    return show(message, Object.assign({}, opts, { kind: 'warn' }));
  },
  info(message, opts) {
    return show(message, Object.assign({}, opts, { kind: 'info' }));
  },
};

/**
 * Map common backend / network errors to a friendly user-facing string.
 */
export function friendlyError(err) {
  if (!err) return 'Something went wrong.';
  const code = err.code || err.error || '';
  const msg = err.message || (typeof err === 'string' ? err : '') || '';
  const blob = `${code} ${msg}`.toLowerCase();

  if (blob.includes('permission_denied') || blob.includes('permission denied')) {
    return "You don't have permission to do this — ask an approver.";
  }
  if (
    blob.includes('failed to fetch') ||
    blob.includes('networkerror') ||
    blob.includes('network error') ||
    blob.includes('network request failed') ||
    blob.includes('err_internet_disconnected') ||
    blob.includes('err_network')
  ) {
    return 'Connection lost — try again in a moment.';
  }
  return msg || String(err);
}

export default toast;
