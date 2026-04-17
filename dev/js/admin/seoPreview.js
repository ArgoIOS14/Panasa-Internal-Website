/**
 * SEO preview module for admin CMS.
 * Shows live Google SERP preview and flags SEO issues.
 */

const BASE_URL = 'https://www.panasatech.com';
let debounceTimer = null;
let previewEl = null;
let currentPageUrl = '';

/**
 * Initialize SEO preview. Call after editor renders.
 * Attaches listeners to meta section fields.
 */
export function initSeoPreview() {
  const editor = document.querySelector('.admin-editor') || document.getElementById('editor-sections');
  if (!editor) return;

  // Use event delegation — listen for input in meta section
  editor.addEventListener('input', e => {
    const input = e.target;
    if (!input.matches('input[type="text"], textarea')) return;

    // Check if this input is inside the meta/seo section
    const section = input.closest('.editor-section');
    const sectionKey = section?.querySelector('.editor-section-body')?.dataset?.sectionKey;
    if (sectionKey !== 'meta') return;

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => readAndUpdate(section), 200);
  });
}

/**
 * Set the current page URL for the preview.
 */
export function setSeoPageUrl(pageUrl) {
  currentPageUrl = pageUrl || '';
}

/**
 * Read meta fields from the DOM and update the preview.
 */
function readAndUpdate(metaSection) {
  if (!metaSection) return;
  const titleInput = metaSection.querySelector('[data-field-key="title"] input');
  const descInput = metaSection.querySelector('[data-field-key="description"] input, [data-field-key="description"] textarea');

  if (!titleInput && !descInput) return;

  updateSeoPreview({
    title: titleInput?.value || '',
    description: descInput?.value || '',
  });
}

/**
 * Update or create the SEO preview panel.
 */
export function updateSeoPreview(meta) {
  const title = meta.title || '';
  const desc = meta.description || '';

  // Find or create the preview container
  if (!previewEl) {
    previewEl = document.getElementById('seo-preview');
    if (!previewEl) {
      previewEl = document.createElement('div');
      previewEl.id = 'seo-preview';
      previewEl.className = 'seo-preview';
      // Insert after the meta section
      const metaSection = findMetaSection();
      if (metaSection) {
        metaSection.insertAdjacentElement('afterend', previewEl);
      } else {
        return;
      }
    }
  }

  const pageUrl = currentPageUrl ? BASE_URL + currentPageUrl : BASE_URL;
  const truncTitle = title.length > 60 ? title.substring(0, 60) + '\u2026' : title;
  const truncDesc = desc.length > 160 ? desc.substring(0, 160) + '\u2026' : desc;

  // Score calculations
  const titleScore = getScore(title.length, 30, 60, 70);
  const descScore = getScore(desc.length, 120, 160, 200);

  previewEl.innerHTML = `
    <h4 class="seo-preview-heading">SEO Preview</h4>

    <div class="seo-serp">
      <div class="seo-serp-title">${esc(truncTitle) || '<em>No title set</em>'}</div>
      <div class="seo-serp-url">${esc(pageUrl)}</div>
      <div class="seo-serp-desc">${esc(truncDesc) || '<em>No description set</em>'}</div>
    </div>

    <div class="seo-score">
      <div class="seo-score-item">
        <span>Title:</span>
        <span class="seo-score-count ${titleScore.cls}">${title.length}/60 chars ${titleScore.icon}</span>
      </div>
      <div class="seo-score-item">
        <span>Description:</span>
        <span class="seo-score-count ${descScore.cls}">${desc.length}/160 chars ${descScore.icon}</span>
      </div>
    </div>

    <div class="seo-social-preview">
      <div class="seo-social-card">
        <div class="seo-social-image">OG Image</div>
        <div class="seo-social-body">
          <div class="seo-social-domain">panasatech.com</div>
          <div class="seo-social-title">${esc(title) || 'Page title'}</div>
          <div class="seo-social-desc">${esc(desc ? desc.substring(0, 100) : 'Page description')}</div>
        </div>
      </div>
    </div>
  `;

  previewEl.style.display = '';
}

/**
 * Hide the SEO preview.
 */
export function hideSeoPreview() {
  if (previewEl) previewEl.style.display = 'none';
  previewEl = null;
}

/**
 * Get score status for a character count.
 */
function getScore(len, idealMin, idealMax, warnMax) {
  if (len === 0) return { cls: 'seo-bad', icon: '\u274c' };
  if (len >= idealMin && len <= idealMax) return { cls: 'seo-good', icon: '\u2705' };
  if (len < idealMin || (len > idealMax && len <= warnMax)) return { cls: 'seo-warn', icon: '\u26a0\ufe0f' };
  return { cls: 'seo-bad', icon: '\u274c' };
}

function findMetaSection() {
  const bodies = document.querySelectorAll('.editor-section-body');
  for (const body of bodies) {
    if (body.dataset.sectionKey === 'meta') {
      return body.closest('.editor-section');
    }
  }
  return null;
}

function esc(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}
