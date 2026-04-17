/**
 * Undo/Redo module for admin CMS.
 * Stores deep-cloned snapshots of page data.
 */

const MAX_HISTORY = 50;
let stack = [];
let pointer = -1;

/**
 * Push current data state onto the undo stack.
 * Truncates any redo history beyond current pointer.
 */
export function pushUndoState(data) {
  if (!data) return;
  const snapshot = JSON.parse(JSON.stringify(data));

  // If pointer isn't at the end, truncate redo history
  if (pointer < stack.length - 1) {
    stack = stack.slice(0, pointer + 1);
  }

  stack.push(snapshot);

  // Cap at max
  if (stack.length > MAX_HISTORY) {
    stack.shift();
  }

  pointer = stack.length - 1;
  updateButtons();
}

/**
 * Undo — return previous data snapshot, or null if at start.
 */
export function undo() {
  if (!canUndo()) return null;
  pointer--;
  updateButtons();
  return JSON.parse(JSON.stringify(stack[pointer]));
}

/**
 * Redo — return next data snapshot, or null if at end.
 */
export function redo() {
  if (!canRedo()) return null;
  pointer++;
  updateButtons();
  return JSON.parse(JSON.stringify(stack[pointer]));
}

/**
 * Clear undo history (call on page switch).
 */
export function clearUndoHistory() {
  stack = [];
  pointer = -1;
  updateButtons();
}

export function canUndo() {
  return pointer > 0;
}

export function canRedo() {
  return pointer < stack.length - 1;
}

/**
 * Update undo/redo button disabled state.
 */
function updateButtons() {
  const undoBtn = document.getElementById('undo-btn');
  const redoBtn = document.getElementById('redo-btn');
  if (undoBtn) undoBtn.disabled = !canUndo();
  if (redoBtn) redoBtn.disabled = !canRedo();
}
