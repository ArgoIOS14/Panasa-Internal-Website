/**
 * Accessibility module for admin CMS.
 * Call initA11y() after DOM ready and after each renderEditor().
 */

let skipLinkAdded = false;
let focusReturnTarget = null;

/**
 * Initialize all accessibility improvements.
 */
export function initA11y() {
  fixModalAccessibility();
  fixAccordionAccessibility();
  fixSaveStatusAnnouncements();
  fixRemoveButtons();
  fixValidationAnnouncements();
  if (!skipLinkAdded) addSkipLink();
}

/**
 * Fix modal accessibility: ARIA roles, focus trap, Escape to close.
 */
function fixModalAccessibility() {
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    if (!overlay.getAttribute('role')) overlay.setAttribute('role', 'dialog');
    if (!overlay.getAttribute('aria-modal')) overlay.setAttribute('aria-modal', 'true');
  });

  // Fix close buttons
  document.querySelectorAll('.modal-overlay button, .modal-box button').forEach(btn => {
    const text = btn.textContent.trim();
    if ((text === '\u00d7' || text === '\u2715' || text === 'X' || btn.classList.contains('modal-close')) &&
        !btn.getAttribute('aria-label')) {
      btn.setAttribute('aria-label', 'Close dialog');
    }
  });

  // Escape key to close modals
  if (!document._a11yEscapeInit) {
    document._a11yEscapeInit = true;
    document.addEventListener('keydown', e => {
      if (e.key !== 'Escape') return;
      const visibleModal = document.querySelector('.modal-overlay[style*="display: flex"], .modal-overlay[style*="display:flex"], .modal-overlay:not([style*="display: none"]):not([style*="display:none"])');
      if (visibleModal && visibleModal.offsetParent !== null) {
        const closeBtn = visibleModal.querySelector('[aria-label="Close dialog"], .modal-close');
        if (closeBtn) closeBtn.click();
      }
    });
  }

  // Focus trap and management — observe for modals becoming visible
  if (!document._a11yModalObserver) {
    document._a11yModalObserver = new MutationObserver(mutations => {
      mutations.forEach(m => {
        if (m.type === 'attributes' && m.attributeName === 'style') {
          const el = m.target;
          if (el.classList.contains('modal-overlay') && el.style.display !== 'none' && el.offsetParent !== null) {
            onModalOpen(el);
          }
        }
      });
    });
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      document._a11yModalObserver.observe(overlay, { attributes: true, attributeFilter: ['style'] });
    });
  }
}

/**
 * When a modal opens: store focus target and focus first focusable element.
 */
function onModalOpen(modal) {
  focusReturnTarget = document.activeElement;

  const focusable = getFocusableElements(modal);
  if (focusable.length > 0) {
    setTimeout(() => focusable[0].focus(), 50);
  }

  // Set up focus trap
  modal._a11yTrap = e => {
    if (e.key !== 'Tab') return;
    const elements = getFocusableElements(modal);
    if (elements.length === 0) return;

    const first = elements[0];
    const last = elements[elements.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };
  modal.addEventListener('keydown', modal._a11yTrap);
}

/**
 * Restore focus when modal closes. Call from modal close handler.
 */
export function onModalClose() {
  if (focusReturnTarget && typeof focusReturnTarget.focus === 'function') {
    focusReturnTarget.focus();
    focusReturnTarget = null;
  }
}

function getFocusableElements(container) {
  return Array.from(container.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )).filter(el => el.offsetParent !== null);
}

/**
 * Fix accordion sections with ARIA attributes.
 */
function fixAccordionAccessibility() {
  document.querySelectorAll('.editor-section-toggle').forEach((header, i) => {
    const btn = header.querySelector('button') || header;
    const content = header.nextElementSibling;

    if (!content) return;

    // Generate id if needed
    if (!content.id) content.id = 'accordion-panel-' + i;

    const isOpen = !content.classList.contains('collapsed') &&
                   content.style.display !== 'none';

    btn.setAttribute('aria-expanded', String(isOpen));
    btn.setAttribute('aria-controls', content.id);
    content.setAttribute('role', 'region');

    // Update on click (if not already hooked)
    if (!btn.dataset.a11yToggle) {
      btn.dataset.a11yToggle = 'true';
      btn.addEventListener('click', () => {
        const expanded = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!expanded));
      });
    }
  });
}

/**
 * Make save status announcements live for screen readers.
 */
function fixSaveStatusAnnouncements() {
  const status = document.querySelector('.save-status') || document.getElementById('save-status');
  if (status) {
    status.setAttribute('aria-live', 'polite');
    status.setAttribute('role', 'status');
  }
}

/**
 * Add warning icon and alert role to validation summaries.
 */
function fixValidationAnnouncements() {
  const warnings = document.querySelectorAll('.validation-warning, .validation-summary');
  warnings.forEach(el => {
    el.setAttribute('role', 'alert');
    // Prepend warning icon if not present
    if (!el.dataset.a11yIcon) {
      el.dataset.a11yIcon = 'true';
      const icon = document.createElement('span');
      icon.textContent = '\u26a0\ufe0f ';
      icon.setAttribute('aria-hidden', 'true');
      el.insertBefore(icon, el.firstChild);
    }
  });
}

/**
 * Add descriptive titles to remove buttons.
 */
function fixRemoveButtons() {
  document.querySelectorAll('.repeatable-container button').forEach(btn => {
    const text = btn.textContent.trim().toLowerCase();
    if ((text.includes('remove') || text === '\u2715' || text === '\u00d7' || btn.classList.contains('bullet-remove')) &&
        !btn.getAttribute('title')) {
      btn.setAttribute('title', 'Remove this item (cannot be undone)');
    }
  });
}

/**
 * Add skip-to-editor link.
 */
function addSkipLink() {
  skipLinkAdded = true;

  // Ensure editor has an id
  const editor = document.querySelector('.admin-editor') || document.getElementById('editor-sections');
  if (editor && !editor.id) editor.id = 'editor-sections';

  const link = document.createElement('a');
  link.href = '#editor-sections';
  link.className = 'sr-only skip-link';
  link.textContent = 'Skip to editor';
  document.body.insertBefore(link, document.body.firstChild);
}

/**
 * Focus the first input in a newly added array item.
 * Call after adding a new item to an array field.
 */
export function focusNewItem(container) {
  if (!container) return;
  const lastItem = container.lastElementChild;
  if (lastItem) {
    const firstInput = lastItem.querySelector('input, textarea, select');
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 50);
    }
  }
}
