/**
 * Image enhancement module for admin CMS.
 * Adds gallery search, batch upload, duplicate detection, and metadata tooltips.
 */

let batchAuthTokenFn = null;
let galleryRefreshFn = null;

/**
 * Initialize image enhancements.
 * @param {Function} getAuthToken - async function returning Firebase ID token
 * @param {Function} refreshGallery - function to refresh gallery contents
 */
export function initImageEnhancements(getAuthToken, refreshGallery) {
  batchAuthTokenFn = getAuthToken;
  galleryRefreshFn = refreshGallery;
  initGallerySearch();
  initBatchUpload();
  initImageMetadata();
}

/**
 * Gallery search/filter by filename.
 */
function initGallerySearch() {
  const searchInput = document.getElementById('gallery-search');
  if (!searchInput || searchInput.dataset.init) return;
  searchInput.dataset.init = 'true';

  let timer = null;
  searchInput.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => filterGallery(searchInput.value.trim()), 200);
  });
}

function filterGallery(query) {
  const grid = document.querySelector('.gallery-grid') || document.getElementById('gallery-grid');
  if (!grid) return;

  const items = grid.querySelectorAll('.gallery-item');
  const headers = grid.querySelectorAll('.gallery-category-header');
  let visibleCount = 0;
  const lowerQuery = query.toLowerCase();

  items.forEach(item => {
    if (!query) {
      item.style.display = '';
      visibleCount++;
      return;
    }
    const img = item.querySelector('img');
    const label = item.querySelector('.gallery-item-info') || item;
    const filename = (img?.getAttribute('alt') || img?.src || label?.textContent || '').toLowerCase();

    if (filename.includes(lowerQuery)) {
      item.style.display = '';
      visibleCount++;
    } else {
      item.style.display = 'none';
    }
  });

  // Show/hide category headers based on whether they have visible items after them
  headers.forEach(header => {
    if (!query) { header.style.display = ''; return; }
    let next = header.nextElementSibling;
    let hasVisible = false;
    while (next && !next.classList.contains('gallery-category-header')) {
      if (next.classList.contains('gallery-item') && next.style.display !== 'none') hasVisible = true;
      next = next.nextElementSibling;
    }
    header.style.display = hasVisible ? '' : 'none';
  });

  // Show/remove no-results message
  let noResults = grid.querySelector('.gallery-no-results');
  if (visibleCount === 0 && query) {
    if (!noResults) {
      noResults = document.createElement('div');
      noResults.className = 'gallery-no-results';
      grid.appendChild(noResults);
    }
    noResults.textContent = 'No images match "' + query + '"';
    noResults.style.display = '';
  } else if (noResults) {
    noResults.style.display = 'none';
  }
}

/**
 * Batch upload multiple images at once.
 */
function initBatchUpload() {
  const btn = document.getElementById('batch-upload-btn');
  const fileInput = document.getElementById('batch-file-input');
  if (!btn || !fileInput || btn.dataset.init) return;
  btn.dataset.init = 'true';

  btn.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', async () => {
    const files = Array.from(fileInput.files);
    if (files.length === 0) return;

    // Show progress
    const grid = document.querySelector('.gallery-grid');
    let progress = document.querySelector('.batch-progress');
    if (!progress && grid) {
      progress = document.createElement('div');
      progress.className = 'batch-progress';
      grid.parentElement.insertBefore(progress, grid);
    }

    let completed = 0;
    const total = files.length;

    const updateProgress = () => {
      if (progress) {
        progress.innerHTML = `Uploading ${completed}/${total}\u2026` +
          '<div class="batch-progress-bar"><div class="batch-progress-fill" style="width:' +
          Math.round((completed / total) * 100) + '%"></div></div>';
      }
    };
    updateProgress();

    let token = '';
    if (typeof batchAuthTokenFn === 'function') {
      try { token = await batchAuthTokenFn(); } catch (e) { /* */ }
    }

    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append('image', file);

        await fetch('/api/upload.php', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + token },
          body: formData,
        });
      } catch (err) {
        console.warn('Batch upload failed for', file.name, err);
      }
      completed++;
      updateProgress();
    }

    // Done — remove progress and refresh gallery
    if (progress) {
      progress.textContent = 'Upload complete!';
      setTimeout(() => progress.remove(), 2000);
    }

    fileInput.value = '';

    if (typeof galleryRefreshFn === 'function') {
      galleryRefreshFn();
    }
  });
}

/**
 * Check for duplicate image before upload.
 * @param {File} file
 * @returns {Promise<string|null>} Existing filename if duplicate, null otherwise
 */
export async function checkDuplicate(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const chunk = new Uint8Array(reader.result);
      const fingerprint = file.size + '_' + simpleHash(chunk);

      const stored = JSON.parse(sessionStorage.getItem('img_fingerprints') || '{}');
      if (stored[fingerprint]) {
        resolve(stored[fingerprint]);
      } else {
        stored[fingerprint] = file.name;
        sessionStorage.setItem('img_fingerprints', JSON.stringify(stored));
        resolve(null);
      }
    };
    reader.onerror = () => resolve(null);
    // Read first 1KB
    reader.readAsArrayBuffer(file.slice(0, 1024));
  });
}

/**
 * Simple hash of a byte array (sum of bytes mod 2^32, as hex).
 */
function simpleHash(bytes) {
  let hash = 0;
  for (let i = 0; i < bytes.length; i++) {
    hash = (hash + bytes[i] * (i + 1)) & 0xFFFFFFFF;
  }
  return hash.toString(16);
}

/**
 * Image metadata tooltips on gallery hover.
 */
function initImageMetadata() {
  const grid = document.querySelector('.gallery-grid');
  if (!grid || grid.dataset.metaInit) return;
  grid.dataset.metaInit = 'true';

  let tooltip = null;

  grid.addEventListener('mouseenter', e => {
    const item = e.target.closest('.gallery-item');
    if (!item) return;

    const img = item.querySelector('img');
    const nameEl = item.querySelector('.gallery-name');
    const sizeEl = item.querySelector('.gallery-size');

    const info = [];
    if (nameEl) info.push(nameEl.textContent.trim());
    if (sizeEl) info.push(sizeEl.textContent.trim());
    if (img && img.naturalWidth) {
      info.push(img.naturalWidth + ' \u00d7 ' + img.naturalHeight + 'px');
    }

    if (info.length === 0) return;

    tooltip = document.createElement('div');
    tooltip.className = 'img-tooltip';
    tooltip.textContent = info.join(' \u2022 ');
    item.style.position = 'relative';
    item.appendChild(tooltip);
  }, true);

  grid.addEventListener('mouseleave', e => {
    const item = e.target.closest('.gallery-item');
    if (item && tooltip) {
      tooltip.remove();
      tooltip = null;
    }
  }, true);
}
