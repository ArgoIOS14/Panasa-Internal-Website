/**
 * History diff module for admin CMS.
 * Adds comparison between history versions and current published data.
 */

let getPublishedFn = null;

/**
 * Initialize the history diff feature.
 * @param {Function} getPublishedDataFn - async function returning current published data
 */
export function initHistoryDiff(getPublishedDataFn) {
  getPublishedFn = getPublishedDataFn;
}

/**
 * Enhance history modal entries with Compare buttons.
 * Call this after the history modal is rendered.
 * @param {HTMLElement} modalBody - The modal body containing history entries
 * @param {Array} historyEntries - Array of { timestamp, date, label, data }
 */
export function enhanceHistoryEntries(modalBody, historyEntries) {
  if (!modalBody || !historyEntries) return;

  const entries = modalBody.querySelectorAll('.history-entry');
  entries.forEach((entryEl, i) => {
    // Skip if already enhanced
    if (entryEl.querySelector('.btn-compare')) return;

    const compareBtn = document.createElement('button');
    compareBtn.className = 'btn btn-sm btn-compare';
    compareBtn.textContent = 'Compare';
    compareBtn.addEventListener('click', async () => {
      // Toggle diff panel
      const existing = entryEl.querySelector('.diff-panel');
      if (existing) {
        existing.remove();
        compareBtn.textContent = 'Compare';
        return;
      }

      compareBtn.textContent = 'Loading\u2026';
      try {
        const published = typeof getPublishedFn === 'function' ? await getPublishedFn() : {};
        const oldData = historyEntries[i]?.data || {};

        const panel = document.createElement('div');
        panel.className = 'diff-panel';
        renderDiffView(oldData, published, panel);
        entryEl.appendChild(panel);
        compareBtn.textContent = 'Hide';
      } catch (err) {
        compareBtn.textContent = 'Compare';
        console.error('Diff failed:', err);
      }
    });

    // Add button next to existing buttons
    const actions = entryEl.querySelector('.history-actions') || entryEl;
    actions.appendChild(compareBtn);

    // Show version label if present
    const entry = historyEntries[i];
    if (entry?.label) {
      const labelSpan = document.createElement('span');
      labelSpan.className = 'history-label';
      labelSpan.textContent = entry.label;
      const dateEl = entryEl.querySelector('.history-date') || entryEl.firstChild;
      if (dateEl && dateEl.nextSibling) {
        dateEl.parentNode.insertBefore(labelSpan, dateEl.nextSibling);
      } else {
        entryEl.insertBefore(labelSpan, entryEl.firstChild?.nextSibling);
      }
    }
  });
}

/**
 * Render a diff view comparing old and new data.
 */
export function renderDiffView(oldData, newData, container) {
  container.innerHTML = '';

  const allKeys = new Set([...Object.keys(oldData || {}), ...Object.keys(newData || {})]);
  // Skip internal keys
  const skipKeys = new Set(['_lastModified']);

  allKeys.forEach(key => {
    if (skipKeys.has(key)) return;

    const oldVal = oldData?.[key];
    const newVal = newData?.[key];
    const oldJson = JSON.stringify(oldVal);
    const newJson = JSON.stringify(newVal);

    const section = document.createElement('div');
    section.className = 'diff-section';

    const header = document.createElement('div');
    header.className = 'diff-section-header';
    header.innerHTML = '<strong>' + escHtml(key) + '</strong>';

    if (oldJson === newJson) {
      section.classList.add('unchanged');
      header.innerHTML += ' <span class="diff-tag">No changes</span>';
      section.appendChild(header);
    } else if (oldVal === undefined) {
      section.classList.add('added');
      header.innerHTML += ' <span class="diff-tag">Added</span>';
      section.appendChild(header);
      section.appendChild(renderValue(newVal, 'add'));
    } else if (newVal === undefined) {
      section.classList.add('removed');
      header.innerHTML += ' <span class="diff-tag">Removed</span>';
      section.appendChild(header);
      section.appendChild(renderValue(oldVal, 'remove'));
    } else {
      section.classList.add('modified');
      header.innerHTML += ' <span class="diff-tag">Modified</span>';
      section.appendChild(header);
      section.appendChild(renderChanges(oldVal, newVal));
    }

    container.appendChild(section);
  });

  if (container.children.length === 0) {
    container.innerHTML = '<div class="diff-section unchanged">No differences found</div>';
  }
}

/**
 * Render changes between two values.
 */
function renderChanges(oldVal, newVal) {
  const wrap = document.createElement('div');
  wrap.className = 'diff-changes';

  if (typeof oldVal === 'string' && typeof newVal === 'string') {
    // Word-level diff for strings
    wrap.innerHTML = diffWordsHtml(oldVal, newVal);
  } else if (Array.isArray(oldVal) && Array.isArray(newVal)) {
    // Array comparison
    wrap.innerHTML = `<span class="diff-info">${oldVal.length} items \u2192 ${newVal.length} items</span>`;
    if (oldVal.length !== newVal.length) {
      const diff = newVal.length - oldVal.length;
      wrap.innerHTML += ` <span class="diff-info">(${diff > 0 ? '+' : ''}${diff})</span>`;
    }
  } else if (typeof oldVal === 'object' && typeof newVal === 'object' && oldVal && newVal) {
    // Object comparison — list changed keys
    const allSubKeys = new Set([...Object.keys(oldVal), ...Object.keys(newVal)]);
    let changedCount = 0;
    allSubKeys.forEach(k => {
      if (JSON.stringify(oldVal[k]) !== JSON.stringify(newVal[k])) changedCount++;
    });
    wrap.innerHTML = `<span class="diff-info">${changedCount} field${changedCount !== 1 ? 's' : ''} changed</span>`;
  } else {
    // Primitive comparison
    wrap.innerHTML =
      '<span class="diff-word-remove">' + escHtml(String(oldVal)) + '</span> \u2192 ' +
      '<span class="diff-word-add">' + escHtml(String(newVal)) + '</span>';
  }

  return wrap;
}

function renderValue(val, type) {
  const el = document.createElement('div');
  el.className = 'diff-value';
  if (typeof val === 'string') {
    el.innerHTML = `<span class="diff-word-${type}">${escHtml(val)}</span>`;
  } else if (Array.isArray(val)) {
    el.textContent = `[${val.length} items]`;
  } else if (typeof val === 'object' && val) {
    el.textContent = `{${Object.keys(val).length} fields}`;
  } else {
    el.textContent = String(val);
  }
  return el;
}

/**
 * Simple word-level diff rendering.
 * Uses a basic approach: find common prefix/suffix, mark middle as changed.
 */
function diffWordsHtml(oldStr, newStr) {
  const oldWords = oldStr.split(/\s+/);
  const newWords = newStr.split(/\s+/);

  // Find common prefix
  let prefixLen = 0;
  while (prefixLen < oldWords.length && prefixLen < newWords.length &&
         oldWords[prefixLen] === newWords[prefixLen]) {
    prefixLen++;
  }

  // Find common suffix (from end, not overlapping prefix)
  let suffixLen = 0;
  while (suffixLen < (oldWords.length - prefixLen) &&
         suffixLen < (newWords.length - prefixLen) &&
         oldWords[oldWords.length - 1 - suffixLen] === newWords[newWords.length - 1 - suffixLen]) {
    suffixLen++;
  }

  const prefix = oldWords.slice(0, prefixLen).map(escHtml).join(' ');
  const suffix = oldWords.slice(oldWords.length - suffixLen).map(escHtml).join(' ');
  const removedMiddle = oldWords.slice(prefixLen, oldWords.length - suffixLen).map(escHtml).join(' ');
  const addedMiddle = newWords.slice(prefixLen, newWords.length - suffixLen).map(escHtml).join(' ');

  let html = '';
  if (prefix) html += prefix + ' ';
  if (removedMiddle) html += '<span class="diff-word-remove">' + removedMiddle + '</span> ';
  if (addedMiddle) html += '<span class="diff-word-add">' + addedMiddle + '</span> ';
  if (suffix) html += suffix;

  return html.trim();
}

function escHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
