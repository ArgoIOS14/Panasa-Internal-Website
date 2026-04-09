import { initAuth } from './auth.js';
import { loadFromFirebase, saveDraft, publishToLive, saveHistory, loadHistory } from './state.js';
import { renderField, readAllForms, readQuillValue, el, setReadForms } from './fields.js';
import { auth } from '../firebase-config.js';

import * as aiEngPage from './pages/ai-engineering.js';
import * as homePage from './pages/home.js';
import * as aboutPage from './pages/about.js';
import * as legacyPage from './pages/legacy-modernisation.js';
import * as opsPage from './pages/intelligent-operations.js';
import * as govPage from './pages/ai-governance.js';
import * as contactPage from './pages/contact.js';
import * as careersPage from './pages/careers.js';
import * as servicesOverviewPage from './pages/services-overview.js';
import * as privacyPage from './pages/privacy-policy.js';

/* ═══════════════════════════════════════════════
   Page registry
   ═══════════════════════════════════════════════ */

const PAGES = {
  aiAcceleratedEngineering: { label: 'AI Accelerated Engineering', ...aiEngPage, previewUrl: '/ai-accelerated-fintech-engineering.html' },
  home: { label: 'Home Page', ...homePage, previewUrl: '/index.html' },
  about: { label: 'About Us', ...aboutPage, previewUrl: '/about.html' },
  legacyModernisation: { label: 'Legacy Modernisation', ...legacyPage, previewUrl: '/ai-powered-legacy-modernisation.html' },
  intelligentOperations: { label: 'Intelligent Operations', ...opsPage, previewUrl: '/intelligent-operations.html' },
  aiGovernance: { label: 'AI Governance', ...govPage, previewUrl: '/ai-governance.html' },
  servicesOverview: { label: 'Services Overview', ...servicesOverviewPage, previewUrl: '/services.html' },
  contact: { label: 'Contact', ...contactPage, previewUrl: '/contact.html' },
  careers: { label: 'Careers', ...careersPage, previewUrl: '/careers.html' },
  privacyPolicy: { label: 'Privacy Policy', ...privacyPage, previewUrl: '/privacy-policy.html' },
};

/* ═══════════════════════════════════════════════
   State
   ═══════════════════════════════════════════════ */

let currentPage = 'aiAcceleratedEngineering';
let data = {};
let currentDefaults = {}; // immutable defaults for current page
let dataSource = 'defaults'; // 'draft' | 'published' | 'defaults'

/* ═══════════════════════════════════════════════
   DOM
   ═══════════════════════════════════════════════ */

const pageSelect = document.getElementById('page-select');
const editorSections = document.getElementById('editor-sections');
const saveBtn = document.getElementById('save-btn');
const publishBtn = document.getElementById('publish-btn');
const previewBtn = document.getElementById('preview-btn');
const saveStatus = document.getElementById('save-status');
const autosaveStatus = document.getElementById('autosave-status');
const pageStatus = document.getElementById('page-status');
const searchInput = document.getElementById('search-input');
const validationSummary = document.getElementById('validation-summary');
const historyBtn = document.getElementById('history-btn');
const revertBtn = document.getElementById('revert-btn');

/* ═══════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════ */

function getPage() { return PAGES[currentPage]; }

async function getDefaults() {
  const page = getPage();
  if (page.getDefaults) return await page.getDefaults();
  return page.defaults;
}

function doReadForms() {
  readAllForms(editorSections, getPage().sections, data);
}

setReadForms(doReadForms);

function updatePageStatus() {
  pageStatus.className = 'page-status';
  if (dataSource === 'draft') {
    pageStatus.textContent = 'Draft';
    pageStatus.classList.add('status-draft');
  } else if (dataSource === 'published') {
    pageStatus.textContent = 'Published';
    pageStatus.classList.add('status-published');
  } else {
    pageStatus.textContent = 'Default';
    pageStatus.classList.add('status-draft');
  }
}

/* ═══════════════════════════════════════════════
   Auto-save to localStorage
   ═══════════════════════════════════════════════ */

let autoSaveTimer = null;

function scheduleAutoSave() {
  clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(() => {
    doReadForms();
    const key = `panasa_admin_draft_${currentPage}`;
    try {
      localStorage.setItem(key, JSON.stringify(data));
      autosaveStatus.textContent = 'Auto-saved ' + new Date().toLocaleTimeString();
    } catch (e) { /* storage full */ }
  }, 2000);
}

function checkLocalDraft() {
  const key = `panasa_admin_draft_${currentPage}`;
  const stored = localStorage.getItem(key);
  if (!stored) return;
  const prompt = document.getElementById('restore-prompt');
  prompt.style.display = '';
  document.getElementById('restore-yes').onclick = () => {
    try { data = JSON.parse(stored); } catch (e) { /* corrupted */ }
    renderEditor();
    prompt.style.display = 'none';
    localStorage.removeItem(key);
  };
  document.getElementById('restore-no').onclick = () => {
    localStorage.removeItem(key);
    prompt.style.display = 'none';
  };
}

function clearLocalDraft() {
  localStorage.removeItem(`panasa_admin_draft_${currentPage}`);
  autosaveStatus.textContent = '';
}

// Listen for input changes to trigger auto-save
editorSections.addEventListener('input', scheduleAutoSave);

/* ═══════════════════════════════════════════════
   Validation
   ═══════════════════════════════════════════════ */

function validateFields() {
  const issues = [];
  editorSections.querySelectorAll('.field-group').forEach(group => {
    group.classList.remove('field-invalid');
  });

  // Check text inputs that are empty in important fields
  const page = getPage();
  for (const cfg of page.sections) {
    for (const field of cfg.fields) {
      if (field.type !== 'text' && field.type !== 'textarea') continue;
      const sectionKey = cfg.parentKey || cfg.key;
      const body = editorSections.querySelector(`[data-section-key="${sectionKey}"]${cfg.nestedKey ? `[data-nested-key="${cfg.nestedKey}"]` : ':not([data-nested-key])'}`);
      if (!body) continue;
      const group = body.querySelector(`[data-field-key="${field.key}"]`);
      if (!group) continue;
      const input = group.querySelector('input[type="text"], .quill-wrapper');
      if (!input) continue;
      let val = '';
      if (input.classList?.contains('quill-wrapper')) {
        val = readQuillValue(input);
      } else {
        val = input.value;
      }
      if (!val || !val.trim() || val === '<p><br></p>') {
        group.classList.add('field-invalid');
        issues.push(`${cfg.label}: ${field.label} is empty`);
      }
    }
  }

  if (issues.length) {
    validationSummary.innerHTML = `<strong>${issues.length} empty field${issues.length > 1 ? 's' : ''}:</strong> ${issues.slice(0, 5).join(', ')}${issues.length > 5 ? ` and ${issues.length - 5} more` : ''}`;
    validationSummary.style.display = '';
  } else {
    validationSummary.style.display = 'none';
  }
  return issues;
}

/* ═══════════════════════════════════════════════
   Load / Save / Publish
   ═══════════════════════════════════════════════ */

async function loadData() {
  const page = getPage();
  const defaults = await getDefaults();
  currentDefaults = JSON.parse(JSON.stringify(defaults)); // store immutable copy
  const result = await loadFromFirebase(page.fbPath, page.sections, defaults);
  data = result.data;
  dataSource = result.source;
  updatePageStatus();
  renderEditor();
  checkLocalDraft();
}

// Make defaults available globally for fields.js delete confirmations
window._adminCurrentDefaults = () => currentDefaults;

async function handleSave() {
  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving...';
  saveStatus.textContent = '';
  saveStatus.className = 'save-status';
  try {
    doReadForms();
    validateFields();
    await saveDraft(getPage().fbPath, data);
    dataSource = 'draft';
    updatePageStatus();
    clearLocalDraft();
    saveStatus.textContent = 'Draft saved';
    saveStatus.classList.add('success');
  } catch (err) {
    console.error('Save failed:', err);
    saveStatus.textContent = 'Save failed — ' + err.message;
    saveStatus.classList.add('error');
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Draft';
  }
}

async function handlePublish() {
  publishBtn.disabled = true;
  publishBtn.textContent = 'Publishing...';
  saveStatus.textContent = '';
  saveStatus.className = 'save-status';
  try {
    doReadForms();
    const issues = validateFields();
    await publishToLive(getPage().fbPath, data);
    await saveHistory(currentPage, data);
    dataSource = 'published';
    updatePageStatus();
    clearLocalDraft();
    saveStatus.textContent = 'Published successfully' + (issues.length ? ` (${issues.length} warnings)` : '');
    saveStatus.classList.add('success');
  } catch (err) {
    console.error('Publish failed:', err);
    saveStatus.textContent = 'Publish failed — ' + err.message;
    saveStatus.classList.add('error');
  } finally {
    publishBtn.disabled = false;
    publishBtn.textContent = 'Publish';
  }
}

function handlePreview() {
  const page = getPage();
  if (page.previewUrl) {
    doReadForms();
    // Save draft first so preview can read it
    saveDraft(page.fbPath, data).then(() => {
      window.open(page.previewUrl + '?preview=true', '_blank');
    });
  }
}

/* ═══════════════════════════════════════════════
   Search
   ═══════════════════════════════════════════════ */

function handleSearch() {
  const query = searchInput.value.toLowerCase().trim();
  editorSections.querySelectorAll('.editor-section').forEach(section => {
    if (!query) {
      section.classList.remove('search-hidden');
      return;
    }
    const label = section.querySelector('.editor-section-toggle span')?.textContent?.toLowerCase() || '';
    const content = section.querySelector('.editor-section-body')?.textContent?.toLowerCase() || '';
    if (label.includes(query) || content.includes(query)) {
      section.classList.remove('search-hidden');
    } else {
      section.classList.add('search-hidden');
    }
  });
}

searchInput.addEventListener('input', handleSearch);

/* ═══════════════════════════════════════════════
   Gallery
   ═══════════════════════════════════════════════ */

const galleryModal = document.getElementById('gallery-modal');
const galleryGrid = document.getElementById('gallery-grid');
const galleryLoading = document.getElementById('gallery-loading');
document.getElementById('gallery-close').addEventListener('click', () => galleryModal.style.display = 'none');
galleryModal.addEventListener('click', (e) => { if (e.target === galleryModal) galleryModal.style.display = 'none'; });

galleryModal.addEventListener('open', async () => {
  galleryGrid.innerHTML = '';
  galleryLoading.style.display = '';
  try {
    const token = await auth.currentUser?.getIdToken();
    const res = await fetch('/api/gallery.php', { headers: { 'Authorization': 'Bearer ' + (token || '') } });
    const json = await res.json();
    galleryLoading.style.display = 'none';
    if (!json.images?.length) {
      galleryGrid.innerHTML = '<p style="padding:20px;color:var(--admin-text-muted)">No images uploaded yet.</p>';
      return;
    }
    for (const img of json.images) {
      const item = el('div', 'gallery-item');
      const sizeKb = Math.round(img.size / 1024);
      item.innerHTML = `<img src="${img.url}" alt="${img.name}"><div class="gallery-item-info">${img.name} (${sizeKb}KB)</div><button class="gallery-item-delete" title="Delete">&times;</button>`;
      // Select image
      item.querySelector('img').addEventListener('click', () => {
        if (window._galleryCallback) window._galleryCallback(img.url);
        galleryModal.style.display = 'none';
      });
      // Delete image
      item.querySelector('.gallery-item-delete').addEventListener('click', async (e) => {
        e.stopPropagation();
        if (!confirm(`Delete ${img.name}?`)) return;
        const delToken = await auth.currentUser?.getIdToken();
        await fetch('/api/gallery.php', { method: 'DELETE', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (delToken || '') }, body: JSON.stringify({ filename: img.name }) });
        item.remove();
      });
      galleryGrid.appendChild(item);
    }
  } catch (e) {
    galleryLoading.textContent = 'Failed to load gallery.';
  }
});

/* ═══════════════════════════════════════════════
   History
   ═══════════════════════════════════════════════ */

const historyModal = document.getElementById('history-modal');
const historyList = document.getElementById('history-list');
const historyLoading = document.getElementById('history-loading');
document.getElementById('history-close').addEventListener('click', () => historyModal.style.display = 'none');
historyModal.addEventListener('click', (e) => { if (e.target === historyModal) historyModal.style.display = 'none'; });

historyBtn.addEventListener('click', async () => {
  historyModal.style.display = '';
  historyList.innerHTML = '';
  historyLoading.style.display = '';
  const entries = await loadHistory(currentPage);
  historyLoading.style.display = 'none';
  if (!entries.length) {
    historyList.innerHTML = '<p style="padding:20px;color:var(--admin-text-muted)">No history yet. Publish to create history entries.</p>';
    return;
  }
  for (const entry of entries) {
    const div = el('div', 'history-entry');
    const date = new Date(entry.timestamp);
    div.innerHTML = `<div><div class="history-entry-time">${date.toLocaleDateString()} ${date.toLocaleTimeString()}</div><div class="history-entry-meta">${Object.keys(entry.data || {}).length} sections</div></div>`;
    const btn = el('button', 'btn btn-secondary btn-small');
    btn.textContent = 'Restore';
    btn.addEventListener('click', () => {
      if (!confirm('Restore this version? Current changes will be lost.')) return;
      data = entry.data;
      renderEditor();
      historyModal.style.display = 'none';
      saveStatus.textContent = 'Restored from history — save or publish to apply';
      saveStatus.className = 'save-status';
    });
    div.appendChild(btn);
    historyList.appendChild(div);
  }
});

/* ═══════════════════════════════════════════════
   Editor rendering
   ═══════════════════════════════════════════════ */

let _openSections = new Set();

function renderEditor(focusSectionKey) {
  const page = getPage();

  const currentOpen = new Set();
  editorSections.querySelectorAll('.editor-section.is-open').forEach(s => {
    if (s.dataset.editorKey) currentOpen.add(s.dataset.editorKey);
  });
  if (currentOpen.size > 0) _openSections = currentOpen;

  editorSections.innerHTML = '';

  for (const cfg of page.sections) {
    const sectionKey = cfg.parentKey || cfg.key;
    const nestedKey = cfg.nestedKey;
    const section = nestedKey ? (data[sectionKey] || {})[nestedKey] || {} : data[sectionKey] || {};
    const editorKey = cfg.key;

    const wrapper = el('div', 'editor-section');
    wrapper.dataset.editorKey = editorKey;
    const header = el('button', 'editor-section-toggle');
    header.type = 'button';
    header.innerHTML = `<span>${cfg.label}</span><span class="toggle-arrow">&#9660;</span>`;
    header.addEventListener('click', () => {
      wrapper.classList.toggle('is-open');
      if (wrapper.classList.contains('is-open')) _openSections.add(editorKey);
      else _openSections.delete(editorKey);
    });
    wrapper.appendChild(header);

    const body = el('div', 'editor-section-body');
    body.dataset.sectionKey = sectionKey;
    if (nestedKey) body.dataset.nestedKey = nestedKey;

    for (const field of cfg.fields) {
      const rerender = (focusKey) => { renderEditor(focusKey || editorKey); };
      rerender.readForms = doReadForms;
      body.appendChild(renderField(nestedKey ? `${sectionKey}.${nestedKey}` : sectionKey, field, section[field.key], data, rerender));
    }

    wrapper.appendChild(body);

    if (_openSections.has(editorKey)) {
      wrapper.classList.add('is-open');
    }

    editorSections.appendChild(wrapper);
  }

  if (_openSections.size === 0) {
    const first = editorSections.querySelector('.editor-section');
    if (first) {
      first.classList.add('is-open');
      const key = first.querySelector('.editor-section-body')?.dataset.sectionKey;
      if (key) _openSections.add(key);
    }
  }

  if (focusSectionKey) {
    const target = editorSections.querySelector(`[data-editor-key="${focusSectionKey}"]`);
    if (target) requestAnimationFrame(() => target.scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
  }

  // Re-apply search filter
  handleSearch();
}

/* ═══════════════════════════════════════════════
   Event listeners
   ═══════════════════════════════════════════════ */

pageSelect.addEventListener('change', async () => {
  doReadForms();
  currentPage = pageSelect.value;
  _openSections = new Set();
  searchInput.value = '';
  validationSummary.style.display = 'none';
  await loadData();
});

saveBtn.addEventListener('click', handleSave);
publishBtn.addEventListener('click', handlePublish);
previewBtn.addEventListener('click', handlePreview);

revertBtn.addEventListener('click', async () => {
  if (!confirm('Are you sure you want to revert ALL content on this page to the original defaults?\n\nThis will discard all your changes. The default content will be restored.\n\nThis action cannot be undone.')) return;

  // Save current state to history first as a backup
  try {
    doReadForms();
    await saveHistory(currentPage, data);
  } catch (e) { /* history save is best-effort */ }

  // Reset data to defaults
  data = JSON.parse(JSON.stringify(currentDefaults));

  // Save defaults to both draft and live
  try {
    await publishToLive(getPage().fbPath, data);
    dataSource = 'published';
    updatePageStatus();
    clearLocalDraft();
    saveStatus.textContent = 'Reverted to defaults and published';
    saveStatus.className = 'save-status success';
  } catch (err) {
    saveStatus.textContent = 'Revert failed — ' + err.message;
    saveStatus.className = 'save-status error';
  }

  renderEditor();
});

/* ═══════════════════════════════════════════════
   Init
   ═══════════════════════════════════════════════ */

initAuth({
  onLogin: loadData,
});
