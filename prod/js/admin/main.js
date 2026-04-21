import { initAuth } from './auth.js';
import { loadFromFirebase, saveDraft, publishToLive, saveHistory, loadHistory } from './state.js';
import { renderField, readAllForms, readQuillValue, el, setReadForms } from './fields.js';
import { auth } from '../firebase-config.js';

// ── New feature modules ──
import { initDragReorder } from './dragReorder.js';
import { pushUndoState, undo, redo, clearUndoHistory } from './undoRedo.js';
import { initShortcuts, shortcutLabel } from './shortcuts.js';
import { initPreview, refreshPreview, closePreview } from './preview.js';
import { initRebuildStatus, setRebuildState, restoreRebuildState, triggerManualRebuild } from './rebuildStatus.js';
import { initHistoryDiff, enhanceHistoryEntries } from './historyDiff.js';
import { initValidation, validateAllFields, clearValidationErrors } from './validation.js';
import { initConflictDetection, cleanupPresence, checkForConflicts } from './conflicts.js';
import { initContentSearch, clearSearchCache } from './contentSearch.js';
import { initA11y } from './a11y.js';
import { initImageEnhancements } from './imageEnhancements.js';

// ── Round 2 feature modules ──
import { initAnalytics } from './analytics.js';
import { initSeoPreview, setSeoPageUrl, hideSeoPreview } from './seoPreview.js';
import { initAutosave, stopAutosave, resetAutosaveHash } from './autosave.js';
import { initAuditLog, logAction } from './auditLog.js';
import { initBulkOps } from './bulkOps.js';

// ── Multi-user / role modules ──
import { canPublish, canReview, canManageUsers, isEditor, isSuperAdmin, currentRole, roleLabel, onRoleChange } from './roles.js';
import { initReviews, submitForReview, refreshPendingBadge } from './reviews.js';
import { initUsers } from './users.js';
import { initActivityDashboard } from './activityDashboard.js';

// ── Round 3 UI/UX modules ──
import { showModal, hideModal, showToast, showSkeleton } from './animations.js';
import { initTutorial } from './tutorial.js';
import { initUiEnhancements, updateSectionBadges } from './uiEnhancements.js';

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

// Validation now handled by validation.js module (validateAllFields)

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
  clearUndoHistory();
  pushUndoState(data);
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
    pushUndoState(data);
    const issues = validateAllFields();
    await saveDraft(getPage().fbPath, data);
    dataSource = 'draft';
    updatePageStatus();
    clearLocalDraft();
    saveStatus.textContent = 'Draft saved' + (issues.length ? ` (${issues.length} warnings)` : '');
    saveStatus.classList.add('success');
    showToast('Draft saved', 'success');
    resetAutosaveHash();
    logAction('save_draft', currentPage);
  } catch (err) {
    console.error('Save failed:', err);
    saveStatus.textContent = 'Save failed — ' + err.message;
    saveStatus.classList.add('error');
    showToast('Save failed: ' + err.message, 'error');
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Draft';
  }
}

async function handlePublish() {
  // Editors route to the review submission flow instead of direct publish.
  if (!canPublish()) {
    return handleSubmitForReview();
  }
  publishBtn.disabled = true;
  publishBtn.textContent = 'Publishing...';
  saveStatus.textContent = '';
  saveStatus.className = 'save-status';
  try {
    doReadForms();
    pushUndoState(data);
    const issues = validateAllFields();

    // Check for conflicts before publishing
    const conflictCheck = await checkForConflicts(currentPage);
    if (conflictCheck.hasConflict) {
      if (!confirm('This page was updated by someone else since you loaded it.\n\nPublish anyway and overwrite their changes?')) {
        publishBtn.disabled = false;
        publishBtn.textContent = 'Publish';
        return;
      }
    }

    // Get version note
    const versionNoteInput = document.getElementById('version-note');
    const versionNote = versionNoteInput?.value?.trim() || '';

    await publishToLive(getPage().fbPath, data);
    await saveHistory(currentPage, data, versionNote);
    dataSource = 'published';
    updatePageStatus();
    clearLocalDraft();
    clearSearchCache();
    if (versionNoteInput) versionNoteInput.value = '';

    // Trigger static HTML rebuild for SEO
    setRebuildState('rebuilding', currentPage);
    try {
      const token = await auth.currentUser?.getIdToken();
      const rebuildRes = await fetch('/api/rebuild.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + (token || ''),
        },
        body: JSON.stringify({ pageKey: currentPage, data }),
      });
      const rebuildResult = await rebuildRes.json();
      if (rebuildResult.status === 'success') {
        setRebuildState('success', currentPage);
      } else {
        setRebuildState('failed', currentPage);
        // Show validation errors if any
        if (rebuildResult.errors?.length) {
          console.warn('HTML rebuild validation failed:', rebuildResult.errors);
          showToast('HTML rebuild blocked: validation failed. Original file preserved.', 'error', 5000);
        }
      }
    } catch (rebuildErr) {
      console.warn('HTML rebuild failed (non-blocking):', rebuildErr);
      setRebuildState('failed', currentPage);
    }

    saveStatus.textContent = 'Published successfully' + (issues.length ? ` (${issues.length} warnings)` : '');
    saveStatus.classList.add('success');
    showToast('Published successfully!', 'success');
    resetAutosaveHash();
    logAction('publish', currentPage, { label: versionNote });
  } catch (err) {
    console.error('Publish failed:', err);
    saveStatus.textContent = 'Publish failed — ' + err.message;
    saveStatus.classList.add('error');
    showToast('Publish failed: ' + err.message, 'error');
  } finally {
    publishBtn.disabled = false;
    publishBtn.textContent = 'Publish';
  }
}

/** Editor submission flow — writes to reviews/ instead of publishing directly. */
async function handleSubmitForReview() {
  const submitBtn = document.getElementById('submit-review-btn') || publishBtn;
  const origText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting...';
  saveStatus.textContent = '';
  saveStatus.className = 'save-status';
  try {
    doReadForms();
    pushUndoState(data);
    validateAllFields();
    const versionNoteInput = document.getElementById('version-note');
    const versionNote = versionNoteInput?.value?.trim() || '';
    // Also save a private draft so the editor keeps their local copy.
    try { await saveDraft(getPage().fbPath, data); } catch (e) { /* best effort */ }
    const reviewId = await submitForReview(currentPage, data, versionNote);
    if (versionNoteInput) versionNoteInput.value = '';
    clearLocalDraft();
    saveStatus.textContent = 'Submitted for review';
    saveStatus.classList.add('success');
    showToast('Submitted for review \u2014 an approver will be notified.', 'success');
    resetAutosaveHash();
  } catch (err) {
    console.error('Submit for review failed:', err);
    saveStatus.textContent = 'Submit failed \u2014 ' + err.message;
    saveStatus.classList.add('error');
    showToast('Submit failed: ' + err.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = origText;
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
document.getElementById('gallery-close').addEventListener('click', () => hideModal(galleryModal));
galleryModal.addEventListener('click', (e) => { if (e.target === galleryModal) hideModal(galleryModal); });

galleryModal.addEventListener('open', async () => {
  showModal(galleryModal);
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
        hideModal(galleryModal);
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

// Gallery tab switching
document.querySelectorAll('.gallery-tab').forEach(tab => {
  tab.addEventListener('click', async () => {
    document.querySelectorAll('.gallery-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const tabType = tab.dataset.tab;

    if (tabType === 'uploads') {
      // Re-trigger the uploads gallery (reuse the existing 'open' handler)
      galleryModal.dispatchEvent(new Event('open'));
    } else if (tabType === 'assets') {
      // Load static assets
      galleryGrid.innerHTML = '';
      galleryLoading.style.display = '';
      try {
        const token = await auth.currentUser?.getIdToken();
        const res = await fetch('/api/assets.php', { headers: { 'Authorization': 'Bearer ' + (token || '') } });
        const json = await res.json();
        galleryLoading.style.display = 'none';
        if (!json.assets?.length) {
          galleryGrid.innerHTML = '<p style="padding:20px;color:var(--admin-text-muted)">No static assets found.</p>';
          return;
        }
        let currentCategory = '';
        for (const asset of json.assets) {
          // Category header
          if (asset.category !== currentCategory) {
            currentCategory = asset.category;
            const header = document.createElement('div');
            header.className = 'gallery-category-header';
            header.textContent = currentCategory;
            galleryGrid.appendChild(header);
          }
          const item = el('div', 'gallery-item');
          const sizeKb = Math.round(asset.size / 1024);
          item.innerHTML = `<img src="${asset.url}" alt="${asset.name}"><div class="gallery-item-info">${asset.name} (${sizeKb}KB)</div>`;
          // Select asset (no delete button for static assets)
          item.querySelector('img').addEventListener('click', () => {
            if (window._galleryCallback) window._galleryCallback(asset.url);
            hideModal(galleryModal);
          });
          galleryGrid.appendChild(item);
        }
      } catch (e) {
        galleryLoading.textContent = 'Failed to load assets.';
      }
    }
  });
});

/* ═══════════════════════════════════════════════
   History
   ═══════════════════════════════════════════════ */

const historyModal = document.getElementById('history-modal');
const historyList = document.getElementById('history-list');
const historyLoading = document.getElementById('history-loading');
document.getElementById('history-close').addEventListener('click', () => hideModal(historyModal));
historyModal.addEventListener('click', (e) => { if (e.target === historyModal) hideModal(historyModal); });

historyBtn.addEventListener('click', async () => {
  showModal(historyModal);
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
    const labelText = entry.label ? ` — ${entry.label}` : '';
    div.innerHTML = `<div class="history-date"><div class="history-entry-time">${date.toLocaleDateString()} ${date.toLocaleTimeString()}${labelText}</div><div class="history-entry-meta">${Object.keys(entry.data || {}).length} sections</div></div>`;
    const actions = el('div', 'history-actions');
    const btn = el('button', 'btn btn-secondary btn-small');
    btn.textContent = 'Restore';
    btn.addEventListener('click', () => {
      if (!confirm('Restore this version? Current changes will be lost.')) return;
      data = entry.data;
      pushUndoState(data);
      renderEditor();
      hideModal(historyModal);
      saveStatus.textContent = 'Restored from history — save or publish to apply';
      saveStatus.className = 'save-status';
    });
    actions.appendChild(btn);
    div.appendChild(actions);
    historyList.appendChild(div);
  }
  // Enhance with diff compare buttons
  enhanceHistoryEntries(historyList, entries);
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

    // Inner wrapper for smooth accordion animation (grid-template-rows transition)
    const bodyInner = el('div', 'section-body-inner');
    for (const field of cfg.fields) {
      const rerender = (focusKey) => { renderEditor(focusKey || editorKey); };
      rerender.readForms = doReadForms;
      bodyInner.appendChild(renderField(nestedKey ? `${sectionKey}.${nestedKey}` : sectionKey, field, section[field.key], data, rerender));
    }
    body.appendChild(bodyInner);

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

  // Initialize new feature modules after render
  initDragReorder();
  initA11y();
  initValidation();
  updateSectionBadges();
}

/* ═══════════════════════════════════════════════
   Event listeners
   ═══════════════════════════════════════════════ */

pageSelect.addEventListener('change', async () => {
  doReadForms();
  cleanupPresence();
  clearValidationErrors();
  closePreview();
  stopAutosave();
  hideSeoPreview();
  currentPage = pageSelect.value;
  _openSections = new Set();
  searchInput.value = '';
  validationSummary.style.display = 'none';
  clearUndoHistory();
  await loadData();
  restoreRebuildState(currentPage);
  initConflictDetection(currentPage);
  setSeoPageUrl(getPage().previewUrl);
  initAutosave(
    () => { doReadForms(); return data; },
    () => getPage().fbPath
  );
});

saveBtn.addEventListener('click', handleSave);
publishBtn.addEventListener('click', handlePublish);
previewBtn.addEventListener('click', handlePreview);
const submitReviewBtn = document.getElementById('submit-review-btn');
if (submitReviewBtn) submitReviewBtn.addEventListener('click', handleSubmitForReview);

revertBtn.addEventListener('click', async () => {
  if (!canPublish()) {
    showToast('Only approvers and super admins can revert to defaults.', 'error');
    return;
  }
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
    logAction('revert', currentPage);
  } catch (err) {
    saveStatus.textContent = 'Revert failed — ' + err.message;
    saveStatus.className = 'save-status error';
  }

  renderEditor();
});

/* ═══════════════════════════════════════════════
   Role-driven UI gating
   ═══════════════════════════════════════════════ */

function applyRoleUi() {
  const role = currentRole();
  const reviewerUI = canReview();
  const manageUI = canManageUsers();
  const publishUI = canPublish();

  // Publish vs Submit-for-review button swap
  const submitBtn = document.getElementById('submit-review-btn');
  if (publishUI) {
    publishBtn.style.display = '';
    publishBtn.textContent = 'Publish';
    if (submitBtn) submitBtn.style.display = 'none';
  } else {
    publishBtn.style.display = 'none';
    if (submitBtn) submitBtn.style.display = '';
  }

  // Revert is destructive — only publishers
  if (revertBtn) revertBtn.style.display = publishUI ? '' : 'none';
  const rebuildBtn = document.getElementById('rebuild-btn');
  if (rebuildBtn) rebuildBtn.style.display = publishUI ? '' : 'none';

  // Reviewer / super-admin nav buttons
  const reviewsBtn = document.getElementById('reviews-btn');
  if (reviewsBtn) reviewsBtn.style.display = reviewerUI ? '' : 'none';
  const usersBtn = document.getElementById('users-btn');
  if (usersBtn) usersBtn.style.display = manageUI ? '' : 'none';
  const activityBtn = document.getElementById('activity-btn');
  if (activityBtn) activityBtn.style.display = manageUI ? '' : 'none';

  // Editor-only "My submissions"
  const mySubsBtn = document.getElementById('my-submissions-btn');
  if (mySubsBtn) mySubsBtn.style.display = (!publishUI) ? '' : 'none';

  // Tools dropdown items that hit privileged data — editors can't read these.
  const auditBtn = document.getElementById('audit-btn');
  if (auditBtn) auditBtn.style.display = reviewerUI ? '' : 'none';
  const analyticsBtn = document.getElementById('analytics-btn');
  if (analyticsBtn) analyticsBtn.style.display = reviewerUI ? '' : 'none';
  const bulkOpsBtn = document.getElementById('bulk-ops-btn');
  if (bulkOpsBtn) bulkOpsBtn.style.display = publishUI ? '' : 'none';

  // Search across all pages — only for reviewers/super admins.
  const searchModeToggle = document.getElementById('search-mode-toggle');
  if (searchModeToggle) searchModeToggle.style.display = reviewerUI ? '' : 'none';

  // Role badge
  const roleBadge = document.getElementById('admin-role-badge');
  if (roleBadge && role) {
    roleBadge.textContent = roleLabel(role);
    roleBadge.dataset.role = role;
    roleBadge.style.display = '';
  }
}

/* ═══════════════════════════════════════════════
   Init
   ═══════════════════════════════════════════════ */

initAuth({
  onLogin: async () => {
    await loadData();

    // Initialize new feature modules
    initShortcuts({
      onSave: handleSave,
      onPublish: handlePublish,
      onUndo: () => {
        const prev = undo();
        if (prev) { data = prev; renderEditor(); }
      },
      onRedo: () => {
        const next = redo();
        if (next) { data = next; renderEditor(); }
      },
    });

    initPreview(
      () => getPage().previewUrl,
      () => saveDraft(getPage().fbPath, data),
      () => { doReadForms(); return data; }  // live-preview data getter
    );

    initRebuildStatus();
    restoreRebuildState(currentPage);

    // Manual rebuild button — gated to publishers.
    document.addEventListener('manual-rebuild', () => {
      if (!canPublish()) {
        showToast('Only approvers and super admins can rebuild HTML.', 'error');
        return;
      }
      doReadForms();
      triggerManualRebuild(currentPage, data, () => auth.currentUser?.getIdToken());
    });

    // Multi-user modules
    initReviews(PAGES, async (pageKey) => {
      // After approval, if approver is viewing the same page, refresh its data.
      if (pageKey === currentPage) await loadData();
      refreshPendingBadge();
    });
    initUsers();
    initActivityDashboard();
    applyRoleUi();
    onRoleChange(() => applyRoleUi());

    initHistoryDiff(async () => {
      const page = getPage();
      const result = await loadFromFirebase(page.fbPath, page.sections, currentDefaults);
      return result.data;
    });

    initValidation();

    initConflictDetection(currentPage);

    initContentSearch(PAGES, async (pageKey) => {
      pageSelect.value = pageKey;
      currentPage = pageKey;
      _openSections = new Set();
      searchInput.value = '';
      await loadData();
    });

    initImageEnhancements(
      () => auth.currentUser?.getIdToken(),
      () => { /* gallery refresh handled by existing gallery code */ }
    );

    initA11y();

    // ── Round 3 UI/UX modules ──
    initUiEnhancements();
    initTutorial();

    // ── Round 2 modules ──
    initAnalytics(PAGES);
    initSeoPreview();
    setSeoPageUrl(getPage().previewUrl);
    initAutosave(
      () => { doReadForms(); return data; },
      () => getPage().fbPath
    );
    initAuditLog();
    initBulkOps(PAGES);

    // Undo/Redo button click handlers
    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');
    if (undoBtn) undoBtn.addEventListener('click', () => {
      const prev = undo();
      if (prev) { data = prev; renderEditor(); }
    });
    if (redoBtn) redoBtn.addEventListener('click', () => {
      const next = redo();
      if (next) { data = next; renderEditor(); }
    });

    // Keyboard hint labels
    const saveKbd = saveBtn?.querySelector('kbd');
    const pubKbd = publishBtn?.querySelector('kbd');
    if (saveKbd) saveKbd.textContent = shortcutLabel('save');
    if (pubKbd) pubKbd.textContent = shortcutLabel('publish');
    if (undoBtn) undoBtn.title = `Undo (${shortcutLabel('undo')})`;
    if (redoBtn) redoBtn.title = `Redo (${shortcutLabel('redo')})`;

    // Push undo state on drag reorder
    document.addEventListener('reorder', () => {
      doReadForms();
      pushUndoState(data);
    });
  },
});
