/**
 * Field validation module for admin CMS.
 * Provides inline validation on blur and summary before publish.
 */

const URL_REGEX = /^(https?:\/\/[^\s]+|\/[^\s]*|[a-z0-9-]+\.html(#[^\s]*)?)$/i;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[\d\s+().\-]+$/;
const IMAGE_EXT_REGEX = /\.(svg|webp|png|jpg|jpeg|gif)(\?.*)?$/i;

/**
 * Initialize validation — attach blur listeners via event delegation.
 */
export function initValidation() {
  const editor = document.querySelector('.admin-editor') || document.getElementById('editor-sections');
  if (!editor || editor.dataset.validationInit) return;
  editor.dataset.validationInit = 'true';

  editor.addEventListener('focusout', e => {
    const input = e.target;
    if (!input.matches('input[type="text"], input[type="url"], input[type="email"], textarea')) return;
    validateSingleField(input);
  });
}

/**
 * Validate a single field and show/clear inline error.
 */
function validateSingleField(input) {
  // Skip inputs inside image upload widgets — they manage their own state
  if (input.closest('.image-upload-widget')) {
    clearFieldError(input);
    return null;
  }

  // Skip empty inputs whose field-group is explicitly marked required —
  // those are reported by the dedicated required-field pass in
  // `validateAllFields`, and we don't want to double-render the message.
  const group = input.closest('.field-group');
  if (group?.dataset.required === '1' && !input.value.trim()) {
    return null;
  }

  const type = detectFieldType(input);
  const value = input.value.trim();
  let error = null;

  // Allow empty for optional fields
  if (!value) {
    if (isRequiredField(input)) {
      error = 'This field is required';
    } else {
      clearFieldError(input);
      return null;
    }
  }

  if (!error && value) {
    switch (type) {
      case 'url':
        if (!URL_REGEX.test(value) && !value.startsWith('#')) {
          error = 'Enter a valid URL or relative path (e.g., about.html)';
        }
        break;
      case 'email':
        if (!EMAIL_REGEX.test(value)) {
          error = 'Enter a valid email address';
        }
        break;
      case 'phone':
        if (!PHONE_REGEX.test(value)) {
          error = 'Enter a valid phone number';
        }
        break;
      case 'image':
        if (value && !IMAGE_EXT_REGEX.test(value) && !value.includes('firebasestorage.app')) {
          error = 'Enter a valid image URL (.svg, .webp, .png, .jpg, .gif)';
        }
        break;
    }
  }

  if (error) {
    showFieldError(input, error);
  } else {
    clearFieldError(input);
  }

  return error;
}

/**
 * Detect field type from context.
 * Uses class names and input attributes rather than parent-class heuristics
 * (parent-class matching incorrectly flagged CTA labels as URLs).
 */
function detectFieldType(input) {
  // Class-based — most reliable
  if (input.classList.contains('lh-label')) return 'text';       // CTA label is free text
  if (input.classList.contains('lh-href'))  return 'url';        // CTA URL/path field
  if (input.classList.contains('lh-icon'))  return 'image';      // CTA icon inside image widget (skipped anyway)

  const name = (input.name || '').toLowerCase();
  const label = getFieldLabel(input).toLowerCase();

  // Attribute / name / label heuristics
  if (name.includes('href') || name.includes('url') || label.includes('url') || label.includes('link')) {
    return 'url';
  }
  if (name.includes('email') || label.includes('email')) {
    return 'email';
  }
  if (name.includes('phone') || label.includes('phone') || label.includes('tel')) {
    return 'phone';
  }
  if (input.classList.contains('image-url-input') || name.includes('image') ||
      name.includes('icon') || name.includes('logo') || name.includes('src')) {
    return 'image';
  }
  return 'text';
}

/**
 * Check if field is required (meta title, meta description).
 */
function isRequiredField(input) {
  const label = getFieldLabel(input).toLowerCase();
  const section = input.closest('.editor-section');
  const sectionTitle = section?.querySelector('.editor-section-toggle')?.textContent?.toLowerCase() || '';

  return (sectionTitle.includes('meta') || sectionTitle.includes('seo')) &&
         (label.includes('title') || label.includes('description'));
}

/**
 * Get the label text for a field. Fields are wrapped in .field-group
 * with a preceding .field-label element (see fields.js renderField).
 */
function getFieldLabel(input) {
  const group = input.closest('.field-group');
  if (group) {
    const lbl = group.querySelector('.field-label');
    if (lbl) return lbl.textContent;
    // Fallback: field-group's data-field-key attribute
    if (group.dataset?.fieldKey) return group.dataset.fieldKey;
  }
  // Fallback to placeholder / name
  return input.placeholder || input.name || '';
}

/**
 * Show inline error below a field.
 */
function showFieldError(input, message) {
  input.classList.add('field-invalid');
  let errorSpan = input.parentElement?.querySelector('.field-error');
  if (!errorSpan) {
    errorSpan = document.createElement('span');
    errorSpan.className = 'field-error';
    input.insertAdjacentElement('afterend', errorSpan);
  }
  errorSpan.textContent = message;
}

/**
 * Clear inline error from a field.
 */
function clearFieldError(input) {
  input.classList.remove('field-invalid');
  const errorSpan = input.parentElement?.querySelector('.field-error');
  if (errorSpan) errorSpan.remove();
}

/**
 * Validate all visible fields and return array of issues.
 *
 * In addition to the per-field type checks (URL/email/phone/image regexes),
 * this scans every `.field-group[data-required="1"]` and reports any whose
 * bound value is empty (empty string, empty array, or null/undefined). Each
 * empty required field gets an inline `.field-error` message and the
 * `.has-error` class on its field-group.
 *
 * @returns {Array<{sectionKey: string, fieldKey: string, field: string, message: string}>}
 */
export function validateAllFields() {
  const issues = [];
  const editor = document.querySelector('.admin-editor') || document.getElementById('editor-sections');
  if (!editor) return issues;

  // ── 1. Required-field check (data-required="1" on .field-group) ──
  editor.querySelectorAll('.field-group[data-required="1"]').forEach(group => {
    if (group.offsetParent === null) return; // skip hidden groups
    if (!isFieldGroupEmpty(group)) {
      group.classList.remove('has-error');
      const existing = group.querySelector(':scope > .field-error.required-error');
      if (existing) existing.remove();
      return;
    }
    group.classList.add('has-error');
    // Avoid stacking duplicate messages on repeated calls
    let errEl = group.querySelector(':scope > .field-error.required-error');
    if (!errEl) {
      errEl = document.createElement('div');
      errEl.className = 'field-error required-error';
      errEl.textContent = 'This field is required';
      group.appendChild(errEl);
    }
    issues.push({
      sectionKey: group.dataset.sectionKey || '',
      fieldKey:   group.dataset.fieldKey   || '',
      field:      getFieldGroupLabel(group),
      message:    'This field is required',
    });
  });

  // ── 2. Per-input format checks (URL/email/phone/image) ──
  editor.querySelectorAll('input[type="text"], input[type="url"], input[type="email"], textarea').forEach(input => {
    // Skip hidden inputs
    if (input.offsetParent === null) return;
    const error = validateSingleField(input);
    if (error) {
      issues.push({
        sectionKey: input.closest('.field-group')?.dataset.sectionKey || '',
        fieldKey:   input.closest('.field-group')?.dataset.fieldKey   || '',
        field: getFieldLabel(input) || 'Unknown field',
        message: error,
      });
    }
  });

  return issues;
}

/**
 * Determine if a field-group's bound value is empty, using the same DOM
 * conventions as `readAllForms` in fields.js.
 */
function isFieldGroupEmpty(group) {
  // Text input
  const txt = group.querySelector(':scope > input[type="text"], :scope > input[type="url"], :scope > input[type="email"]');
  if (txt) return !txt.value || !txt.value.trim();

  // Plain textarea (rare — most are Quill)
  const ta = group.querySelector(':scope > textarea');
  if (ta) return !ta.value || !ta.value.trim();

  // Quill-backed textarea
  const quill = group.querySelector(':scope > .quill-wrapper');
  if (quill) {
    const ed = quill.querySelector('.ql-editor');
    if (!ed) return true;
    const text = (ed.textContent || '').trim();
    return text.length === 0;
  }

  // Image input widget — value lives in .field-image hidden input
  const img = group.querySelector('.field-image');
  if (img) return !img.value || !img.value.trim();

  // Title pair — both lines must be present? Treat as empty only if both blank.
  const titleInputs = group.querySelectorAll(':scope > input');
  if (titleInputs.length >= 2) {
    return Array.from(titleInputs).every(i => !i.value || !i.value.trim());
  }

  // String / repeatable lists — empty if no cards / rows
  const cards = group.querySelectorAll('.nested-card, .card-row, .section-card, .image-list-card, .guide-section-card, .block-card');
  if (cards.length > 0) return false;

  // Fallback — look for ANY input with a value
  const anyInput = group.querySelector('input, textarea');
  if (anyInput) return !anyInput.value || !anyInput.value.trim();

  return true;
}

/** Get the field-group's label text (without the required asterisk). */
function getFieldGroupLabel(group) {
  const lbl = group.querySelector(':scope > .field-label');
  if (!lbl) return group.dataset.fieldKey || 'Unknown field';
  // Clone to strip the asterisk before reading text
  const clone = lbl.cloneNode(true);
  clone.querySelectorAll('.field-required-star').forEach(s => s.remove());
  return clone.textContent.trim();
}

/**
 * Clear all validation errors from the editor.
 */
export function clearValidationErrors() {
  document.querySelectorAll('.field-invalid').forEach(el => el.classList.remove('field-invalid'));
  document.querySelectorAll('.field-error').forEach(el => el.remove());
}
