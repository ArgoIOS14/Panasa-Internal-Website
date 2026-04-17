/**
 * Keyboard shortcuts module for admin CMS.
 *
 * Ctrl/Cmd+S       → Save draft
 * Ctrl/Cmd+Shift+P → Publish
 * Ctrl/Cmd+Z       → Undo
 * Ctrl/Cmd+Shift+Z → Redo
 */

const isMac = typeof navigator !== 'undefined' &&
  (/Mac/.test(navigator.platform) || /Mac/.test(navigator.userAgent));

let initialized = false;

/**
 * Initialize keyboard shortcuts. Safe to call only once.
 * @param {{ onSave: Function, onPublish: Function, onUndo: Function, onRedo: Function }} handlers
 */
export function initShortcuts({ onSave, onPublish, onUndo, onRedo }) {
  if (initialized) return;
  initialized = true;

  document.addEventListener('keydown', e => {
    const mod = isMac ? e.metaKey : e.ctrlKey;
    if (!mod) return;

    // Ctrl/Cmd+S → Save
    if (e.key === 's' && !e.shiftKey) {
      e.preventDefault();
      if (typeof onSave === 'function') onSave();
      return;
    }

    // Ctrl/Cmd+Shift+P → Publish
    if ((e.key === 'p' || e.key === 'P') && e.shiftKey) {
      e.preventDefault();
      if (typeof onPublish === 'function') onPublish();
      return;
    }

    // Skip undo/redo if focused inside Quill editor (let Quill handle it)
    const active = document.activeElement;
    if (active && active.closest('.ql-editor')) return;

    // Ctrl/Cmd+Shift+Z → Redo
    if ((e.key === 'z' || e.key === 'Z') && e.shiftKey) {
      e.preventDefault();
      if (typeof onRedo === 'function') onRedo();
      return;
    }

    // Ctrl/Cmd+Z → Undo
    if (e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      if (typeof onUndo === 'function') onUndo();
      return;
    }
  });
}

/**
 * Get the display string for a shortcut (for UI hints).
 */
export function shortcutLabel(action) {
  const mod = isMac ? '⌘' : 'Ctrl';
  const labels = {
    save: `${mod}+S`,
    publish: `${mod}+Shift+P`,
    undo: `${mod}+Z`,
    redo: `${mod}+Shift+Z`,
  };
  return labels[action] || '';
}
