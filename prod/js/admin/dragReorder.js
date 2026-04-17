/**
 * Drag-to-reorder module for array fields in admin CMS.
 * Adds drag handles and HTML5 DnD to all repeatable item containers.
 * Call initDragReorder() after each renderEditor().
 */

let draggedEl = null;
let draggedContainer = null;

/**
 * Initialize drag-to-reorder on all repeatable array containers.
 * Safe to call multiple times (idempotent).
 */
export function initDragReorder() {
  // Find all repeatable containers (they hold .nested-card or .card-row children)
  const containers = document.querySelectorAll('.repeatable-container');

  containers.forEach(container => {
    const items = getReorderableItems(container);
    if (items.length < 2) return; // No point dragging a single item

    items.forEach(item => {
      // Skip if already initialized
      if (item.querySelector('.drag-handle')) return;

      // Add drag handle
      const handle = document.createElement('span');
      handle.className = 'drag-handle';
      handle.textContent = '\u2807'; // ⠿ braille dots
      handle.title = 'Drag to reorder';
      item.insertBefore(handle, item.firstChild);

      // Make item draggable
      item.setAttribute('draggable', 'true');

      // Drag events on item
      item.addEventListener('dragstart', onDragStart);
      item.addEventListener('dragend', onDragEnd);
    });

    // Drop events on container
    if (!container.dataset.dragInit) {
      container.addEventListener('dragover', onDragOver);
      container.addEventListener('drop', onDrop);
      container.addEventListener('dragleave', onDragLeave);
      container.dataset.dragInit = 'true';
    }
  });
}

/**
 * Get reorderable child items of a container.
 */
function getReorderableItems(container) {
  return Array.from(container.children).filter(
    el => el.classList.contains('nested-card') ||
          el.classList.contains('card-row') ||
          el.classList.contains('section-card') ||
          el.classList.contains('string-list-row')
  );
}

function onDragStart(e) {
  draggedEl = e.currentTarget;
  draggedContainer = draggedEl.parentElement;
  draggedEl.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  // Need to set some data for Firefox
  e.dataTransfer.setData('text/plain', '');
}

function onDragEnd(e) {
  if (draggedEl) {
    draggedEl.classList.remove('dragging');
  }
  // Remove all drop indicators
  document.querySelectorAll('.drag-over-top, .drag-over-bottom').forEach(el => {
    el.classList.remove('drag-over-top', 'drag-over-bottom');
  });
  draggedEl = null;
  draggedContainer = null;
}

function onDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';

  if (!draggedEl || !draggedContainer) return;

  const target = getDropTarget(e.target, draggedContainer);
  if (!target || target === draggedEl) return;

  // Remove previous indicators
  draggedContainer.querySelectorAll('.drag-over-top, .drag-over-bottom').forEach(el => {
    el.classList.remove('drag-over-top', 'drag-over-bottom');
  });

  // Determine if dropping above or below
  const rect = target.getBoundingClientRect();
  const midY = rect.top + rect.height / 2;
  if (e.clientY < midY) {
    target.classList.add('drag-over-top');
  } else {
    target.classList.add('drag-over-bottom');
  }
}

function onDragLeave(e) {
  const target = getDropTarget(e.target, draggedContainer);
  if (target) {
    target.classList.remove('drag-over-top', 'drag-over-bottom');
  }
}

function onDrop(e) {
  e.preventDefault();
  if (!draggedEl || !draggedContainer) return;

  const target = getDropTarget(e.target, draggedContainer);
  if (!target || target === draggedEl) return;

  // Determine insertion point
  const rect = target.getBoundingClientRect();
  const midY = rect.top + rect.height / 2;

  if (e.clientY < midY) {
    draggedContainer.insertBefore(draggedEl, target);
  } else {
    draggedContainer.insertBefore(draggedEl, target.nextSibling);
  }

  // Clean up indicators
  target.classList.remove('drag-over-top', 'drag-over-bottom');

  // Dispatch custom event so main.js can push undo state
  draggedContainer.dispatchEvent(new CustomEvent('reorder', { bubbles: true }));
}

/**
 * Walk up from event target to find the direct reorderable child of container.
 */
function getDropTarget(el, container) {
  while (el && el !== container && el.parentElement !== container) {
    el = el.parentElement;
  }
  if (el && el.parentElement === container && el !== draggedEl) {
    return el;
  }
  return null;
}
