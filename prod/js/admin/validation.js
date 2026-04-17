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
 */
function detectFieldType(input) {
  const name = (input.name || '').toLowerCase();
  const label = getFieldLabel(input).toLowerCase();
  const parentClass = input.parentElement?.className || '';

  if (name.includes('href') || name.includes('url') || label.includes('url') || label.includes('link') ||
      parentClass.includes('label-href')) {
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
 * Get the label text for a field.
 */
function getFieldLabel(input) {
  const row = input.closest('.field-row');
  if (row) {
    const label = row.querySelector('label');
    if (label) return label.textContent;
  }
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
 * @returns {Array<{field: string, message: string}>}
 */
export function validateAllFields() {
  const issues = [];
  const editor = document.querySelector('.admin-editor') || document.getElementById('editor-sections');
  if (!editor) return issues;

  editor.querySelectorAll('input[type="text"], input[type="url"], input[type="email"], textarea').forEach(input => {
    // Skip hidden inputs
    if (input.offsetParent === null) return;
    const error = validateSingleField(input);
    if (error) {
      issues.push({
        field: getFieldLabel(input) || 'Unknown field',
        message: error,
      });
    }
  });

  return issues;
}

/**
 * Clear all validation errors from the editor.
 */
export function clearValidationErrors() {
  document.querySelectorAll('.field-invalid').forEach(el => el.classList.remove('field-invalid'));
  document.querySelectorAll('.field-error').forEach(el => el.remove());
}
