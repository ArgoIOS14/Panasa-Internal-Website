/**
 * UI enhancement module for admin CMS.
 * Handles progressive disclosure: Tools dropdown, save bar overflow,
 * section field counts, and improved visual hierarchy.
 */

/**
 * Initialize all UI enhancements.
 */
export function initUiEnhancements() {
  initToolsDropdown();
  initSaveBarOverflow();
}

/* ═══════════════════════════════════════════════
   Tools dropdown in header
   ═══════════════════════════════════════════════ */

function initToolsDropdown() {
  const btn = document.getElementById('tools-menu-btn');
  const dropdown = document.getElementById('tools-dropdown');
  if (!btn || !dropdown) return;

  btn.addEventListener('click', e => {
    e.stopPropagation();
    const isOpen = dropdown.classList.contains('tools-open');
    dropdown.classList.toggle('tools-open', !isOpen);
    btn.setAttribute('aria-expanded', String(!isOpen));
  });

  // Close on click outside
  document.addEventListener('click', e => {
    if (!e.target.closest('.header-tools-menu')) {
      dropdown.classList.remove('tools-open');
      btn?.setAttribute('aria-expanded', 'false');
    }
  });

  // Close on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && dropdown.classList.contains('tools-open')) {
      dropdown.classList.remove('tools-open');
      btn.setAttribute('aria-expanded', 'false');
      btn.focus();
    }
  });
}

/* ═══════════════════════════════════════════════
   Save bar overflow ("More" dropdown)
   ═══════════════════════════════════════════════ */

function initSaveBarOverflow() {
  const btn = document.getElementById('save-bar-more');
  const overflow = document.getElementById('save-bar-overflow');
  if (!btn || !overflow) return;

  btn.addEventListener('click', e => {
    e.stopPropagation();
    const isOpen = overflow.classList.contains('overflow-open');
    overflow.classList.toggle('overflow-open', !isOpen);
    btn.setAttribute('aria-expanded', String(!isOpen));
  });

  document.addEventListener('click', e => {
    if (!e.target.closest('.save-bar-right')) {
      overflow.classList.remove('overflow-open');
      btn?.setAttribute('aria-expanded', 'false');
    }
  });
}

/* ═══════════════════════════════════════════════
   Section field count badges
   ═══════════════════════════════════════════════ */

/**
 * Add field count badges to section headers.
 * Call after renderEditor().
 */
export function updateSectionBadges() {
  document.querySelectorAll('.editor-section').forEach(section => {
    const body = section.querySelector('.editor-section-body');
    const header = section.querySelector('.editor-section-toggle');
    if (!body || !header) return;

    // Count field groups
    const fieldCount = body.querySelectorAll('.field-group, .field-row, .nested-card').length;

    // Find or create badge
    let badge = header.querySelector('.section-field-count');
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'section-field-count';
      header.appendChild(badge);
    }
    badge.textContent = fieldCount > 0 ? `${fieldCount} fields` : '';
  });
}
