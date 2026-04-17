/**
 * Animation utilities for admin CMS.
 * Provides smooth modal transitions, toast notifications,
 * and accordion animation helpers.
 */

/* ═══════════════════════════════════════════════
   Modal show / hide with fade + slide
   ═══════════════════════════════════════════════ */

/**
 * Show a modal overlay with fade + slide animation.
 * @param {HTMLElement} modalEl — The .modal-overlay element
 */
export function showModal(modalEl) {
  if (!modalEl) return;
  modalEl.style.display = 'flex';
  // Force reflow so transition triggers
  void modalEl.offsetHeight;
  requestAnimationFrame(() => {
    modalEl.classList.add('modal-visible');
  });
}

/**
 * Hide a modal overlay with fade + slide animation.
 * @param {HTMLElement} modalEl — The .modal-overlay element
 */
export function hideModal(modalEl) {
  if (!modalEl) return;
  modalEl.classList.remove('modal-visible');

  const onEnd = () => {
    modalEl.style.display = 'none';
    modalEl.removeEventListener('transitionend', onEnd);
  };
  modalEl.addEventListener('transitionend', onEnd);

  // Fallback in case transitionend doesn't fire
  setTimeout(() => {
    if (modalEl.style.display !== 'none') {
      modalEl.style.display = 'none';
    }
  }, 400);
}

/* ═══════════════════════════════════════════════
   Toast notifications
   ═══════════════════════════════════════════════ */

let toastContainer = null;

/**
 * Show a toast notification at the top of the screen.
 * @param {string} message
 * @param {'success'|'error'|'info'} type
 * @param {number} duration — ms before auto-dismiss (default 3000)
 */
export function showToast(message, type = 'info', duration = 3000) {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  toastContainer.appendChild(toast);

  // Trigger enter animation
  requestAnimationFrame(() => {
    toast.classList.add('toast-visible');
  });

  // Auto-dismiss
  setTimeout(() => {
    dismissToast(toast);
  }, duration);
}

function dismissToast(toast) {
  toast.classList.remove('toast-visible');
  toast.classList.add('toast-exit');
  setTimeout(() => toast.remove(), 300);
}

/* ═══════════════════════════════════════════════
   Skeleton loading placeholders
   ═══════════════════════════════════════════════ */

/**
 * Show skeleton loading placeholders in the editor area.
 * @param {HTMLElement} container — The editor sections container
 * @param {number} count — Number of skeleton sections to show
 */
export function showSkeleton(container, count = 4) {
  if (!container) return;
  container.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const skeleton = document.createElement('div');
    skeleton.className = 'skeleton-section';
    skeleton.innerHTML = `
      <div class="skeleton skeleton-title"></div>
      <div class="skeleton skeleton-line"></div>
      <div class="skeleton skeleton-line short"></div>
    `;
    container.appendChild(skeleton);
  }
}

/**
 * Remove skeleton placeholders.
 * @param {HTMLElement} container
 */
export function clearSkeleton(container) {
  if (!container) return;
  container.querySelectorAll('.skeleton-section').forEach(el => el.remove());
}
