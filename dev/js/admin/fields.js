import { getAuth } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js';
import { auth } from '../firebase-config.js';

async function getAuthToken() {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}

/* ═══════════════════════════════════════════════
   Field Renderers — shared across all page configs
   ═══════════════════════════════════════════════ */

// ── DOM helpers ──

export function el(tag, className) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  return e;
}

function textInput(value, placeholder) {
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'field-input';
  input.value = value;
  if (placeholder) input.placeholder = placeholder;
  return input;
}

const _quillInstances = [];

function textArea(value, opts = {}) {
  const wrapper = el('div', 'quill-wrapper');
  const editorDiv = el('div', 'quill-editor-container');
  wrapper.appendChild(editorDiv);

  const fullToolbar = [
    [{ header: [2, 3, false] }],
    ['bold', 'italic'],
    ['blockquote', 'code-block'],
    ['link', 'image'],
    ['code'],
    [{ list: 'bullet' }, { list: 'ordered' }],
  ];
  const inlineToolbar = [['bold', 'italic'], ['link'], [{ list: 'bullet' }, { list: 'ordered' }]];
  const toolbar = opts.inline ? inlineToolbar : fullToolbar;

  // Initialize Quill after DOM insertion — use setTimeout to ensure element is in DOM
  setTimeout(() => {
    if (typeof Quill === 'undefined' || !editorDiv.isConnected) return;
    try {
      const quill = new Quill(editorDiv, {
        theme: 'snow',
        modules: { toolbar },
        placeholder: 'Enter text...',
      });
      // Custom image handler — opens existing gallery modal and inserts URL via insertEmbed.
      // Capture insertion index BEFORE the modal opens (modal steals focus, invalidating
      // selection). Fall back to end-of-doc if Quill had no selection.
      const tb = quill.getModule('toolbar');
      if (tb && typeof tb.addHandler === 'function') {
        tb.addHandler('image', () => {
          const sel = quill.getSelection(true);
          const insertIndex = sel ? sel.index : quill.getLength();
          window._galleryCallback = (url) => {
            window._galleryCallback = null;
            if (!url) return;
            try {
              quill.insertEmbed(insertIndex, 'image', url, 'user');
              quill.setSelection(insertIndex + 1, 0, 'user');
            } catch (err) {
              console.warn('Quill image insert failed:', err);
            }
          };
          const modal = document.getElementById('gallery-modal');
          if (modal) modal.dispatchEvent(new Event('open'));
          else console.warn('gallery-modal element not found in admin page');
        });
      }
      if (value && value.trim()) {
        if (value.includes('<') && value.includes('>')) {
          quill.root.innerHTML = value;
        } else {
          quill.setText(value);
        }
      }
      wrapper._quill = quill;
      _quillInstances.push(quill);
    } catch (e) { console.warn('Quill init failed:', e); }
  }, 100);

  // Hidden input for plain text fallback
  const hidden = document.createElement('input');
  hidden.type = 'hidden';
  hidden.className = 'quill-value';
  hidden.value = value || '';
  wrapper.appendChild(hidden);

  return wrapper;
}

export function readQuillValue(wrapper, asHtml = false) {
  if (wrapper._quill) {
    if (asHtml) {
      const html = wrapper._quill.root.innerHTML;
      return html === '<p><br></p>' ? '' : html;
    }
    // Return plain text — strip all HTML tags
    const text = wrapper._quill.getText().trim();
    return text;
  }
  return wrapper.querySelector('.quill-value')?.value || '';
}

export function esc(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Image upload widget — drag-drop, file picker, URL fallback, preview.
 * Returns a container element with a hidden input holding the URL value.
 */
const MAX_UPLOAD_SIZE = 5 * 1024 * 1024; // 5MB

function imageInput(currentUrl, className) {
  const wrapper = el('div', 'image-upload-widget');
  const hasImage = currentUrl && currentUrl.trim();

  const PLACEHOLDER = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" rx="8" fill="%23e5e7eb"/><path d="M28 52l8-10 6 7 10-13 12 16H16z" fill="%23d1d5db"/><circle cx="30" cy="32" r="5" fill="%23d1d5db"/></svg>');

  wrapper.innerHTML = `
    <input type="hidden" class="${className || 'img-url-value'}" value="${esc(currentUrl || '')}">
    <div class="img-drop-zone ${hasImage ? 'has-preview' : ''}">
      <img src="${hasImage ? esc(currentUrl) : PLACEHOLDER}" class="img-preview ${hasImage ? '' : 'img-placeholder'}" alt="${hasImage ? 'Preview' : 'No image'}" onerror="this.src='${PLACEHOLDER}';this.classList.add('img-placeholder');this.parentElement.classList.add('img-error')">
      <div class="img-drop-label">
        <span>Drop image here or <label class="img-browse-label">browse<input type="file" accept="image/*" class="img-file-input"></label></span>
      </div>
      <div class="img-uploading" style="display:none"><span class="img-spinner"></span> Uploading\u2026</div>
      <div class="img-error-msg" style="display:none">Image failed to load</div>
    </div>
    <div class="img-url-row">
      <button type="button" class="img-gallery-btn" title="Choose from gallery">Gallery</button>
      <button type="button" class="img-paste-btn" title="Paste image URL">Paste URL</button>
      <button type="button" class="img-clear-btn" title="Remove image" style="${hasImage ? '' : 'display:none'}">Remove</button>
    </div>
    <div class="img-paste-row" style="display:none">
      <input type="text" class="img-url-text field-input" value="${esc(currentUrl || '')}" placeholder="Paste image URL and press Enter">
      <button type="button" class="img-paste-apply">Apply</button>
    </div>
  `;

  const hiddenInput = wrapper.querySelector(`.${className || 'img-url-value'}`);
  const dropZone = wrapper.querySelector('.img-drop-zone');
  const fileInput = wrapper.querySelector('.img-file-input');
  const urlText = wrapper.querySelector('.img-url-text');
  const uploading = wrapper.querySelector('.img-uploading');
  const errorMsg = wrapper.querySelector('.img-error-msg');
  const clearBtn = wrapper.querySelector('.img-clear-btn');
  const pasteBtn = wrapper.querySelector('.img-paste-btn');
  const pasteRow = wrapper.querySelector('.img-paste-row');
  const pasteApply = wrapper.querySelector('.img-paste-apply');

  function setUrl(url) {
    hiddenInput.value = url;
    urlText.value = url;
    errorMsg.style.display = 'none';
    dropZone.classList.remove('img-error');
    const existing = dropZone.querySelector('.img-preview');
    if (url) {
      dropZone.classList.add('has-preview');
      if (existing) { existing.src = url; existing.classList.remove('img-placeholder'); existing.alt = 'Preview'; }
      else {
        const img = document.createElement('img');
        img.className = 'img-preview';
        img.src = url;
        img.alt = 'Preview';
        img.onerror = () => { img.src = PLACEHOLDER; img.classList.add('img-placeholder'); dropZone.classList.add('img-error'); errorMsg.style.display = ''; };
        dropZone.prepend(img);
      }
      clearBtn.style.display = '';
      // Hide paste row after applying
      pasteRow.style.display = 'none';
    } else {
      dropZone.classList.remove('has-preview');
      if (existing) { existing.src = PLACEHOLDER; existing.classList.add('img-placeholder'); existing.alt = 'No image'; }
      clearBtn.style.display = 'none';
    }
    // Dispatch bubbling events so listeners on the editor container (live
    // preview, autosave, etc.) pick up image changes. `input` is what
    // regular text inputs emit; `change` is for alt-text auto-fill.
    hiddenInput.dispatchEvent(new Event('input', { bubbles: true }));
    hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function showFeedback(msg, type) {
    // Use toast if available, otherwise inline
    if (typeof window.showToast === 'function') {
      window.showToast(msg, type);
    } else {
      const fb = wrapper.querySelector('.img-feedback') || document.createElement('div');
      fb.className = 'img-feedback img-feedback-' + type;
      fb.textContent = msg;
      if (!fb.parentElement) wrapper.appendChild(fb);
      setTimeout(() => fb.remove(), 4000);
    }
  }

  async function uploadFile(file) {
    // Client-side file size check
    if (file.size > MAX_UPLOAD_SIZE) {
      showFeedback(`File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max 5MB.`, 'error');
      return;
    }

    uploading.style.display = '';
    dropZone.querySelector('.img-drop-label').style.display = 'none';
    errorMsg.style.display = 'none';
    try {
      const token = await getAuthToken();
      if (!token) { showFeedback('Not authenticated', 'error'); return; }
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/upload.php', { method: 'POST', body: form, headers: { 'Authorization': 'Bearer ' + token } });
      const json = await res.json();
      if (json.url) {
        setUrl(json.url);
        showFeedback('Image uploaded', 'success');
      } else {
        showFeedback(json.error || 'Upload failed', 'error');
      }
    } catch (e) {
      console.error('Upload error:', e);
      showFeedback('Upload failed — check your connection', 'error');
    } finally {
      uploading.style.display = 'none';
      dropZone.querySelector('.img-drop-label').style.display = '';
    }
  }

  // Drag and drop
  dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) uploadFile(file);
    else if (file) showFeedback('Only image files accepted', 'error');
  });

  // File picker
  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (file) uploadFile(file);
  });

  // Paste URL toggle
  pasteBtn.addEventListener('click', () => {
    const isVisible = pasteRow.style.display !== 'none';
    pasteRow.style.display = isVisible ? 'none' : 'flex';
    if (!isVisible) urlText.focus();
  });

  // Apply pasted URL
  pasteApply.addEventListener('click', () => setUrl(urlText.value.trim()));
  urlText.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); setUrl(urlText.value.trim()); } });
  // Auto-apply on blur so typed URLs aren't silently lost when user tabs away
  urlText.addEventListener('blur', () => {
    const val = urlText.value.trim();
    if (val && val !== hiddenInput.value) setUrl(val);
  });

  // Clear
  if (clearBtn) clearBtn.addEventListener('click', () => setUrl(''));

  // Gallery button
  const galleryBtn = wrapper.querySelector('.img-gallery-btn');
  if (galleryBtn) {
    galleryBtn.addEventListener('click', () => {
      window._galleryCallback = (url) => setUrl(url);
      document.getElementById('gallery-modal').dispatchEvent(new Event('open'));
    });
  }

  return wrapper;
}

// Expose showToast globally for image upload feedback
if (typeof window !== 'undefined') {
  import('./animations.js').then(m => { window.showToast = m.showToast; }).catch(() => {});
}

// ── YouTube helpers ──
const YOUTUBE_ID_RE = /^[A-Za-z0-9_-]{11}$/;
export function extractYouTubeId(input) {
  if (!input) return '';
  const s = String(input).trim();
  if (YOUTUBE_ID_RE.test(s)) return s;
  const m = s.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([A-Za-z0-9_-]{11})/);
  return m ? m[1] : '';
}

// ── Render a single field ──

export function renderField(sectionKey, field, value, data, onRerender) {
  const group = el('div', 'field-group');
  group.dataset.sectionKey = sectionKey;
  group.dataset.fieldKey = field.key;

  const label = el('label', 'field-label');
  label.textContent = field.label;
  group.appendChild(label);

  const ctx = { data, sectionKey, onRerender };

  switch (field.type) {
    case 'text': group.appendChild(textInput(value || '')); break;
    case 'image': group.appendChild(imageInput(value || '', 'field-image')); break;
    case 'textarea': group.appendChild(textArea(value || '')); break;
    case 'title': group.appendChild(textInput(value?.[0] || '', 'Line 1 (highlighted)')); group.appendChild(textInput(value?.[1] || '', 'Line 2')); break;
    case 'label-href': renderLabelHref(group, value || {}); break;
    case 'stats': renderStats(group, sectionKey, field.key, toArr(value), ctx); break;
    case 'numbered-cards': renderNumberedCards(group, sectionKey, toArr(value), ctx); break;
    case 'stages': renderStages(group, sectionKey, field.key, toArr(value), ctx); break;
    case 'columns': renderColumns(group, sectionKey, toArr(value), ctx); break;
    case 'heading-body-cards': renderHBCards(group, sectionKey, field.key, toArr(value), ctx); break;
    case 'pill-cards': renderPillCards(group, sectionKey, field.key, toArr(value), ctx); break;
    case 'string-list': renderStringList(group, sectionKey, field.key, toArr(value), ctx); break;
    case 'image-list': renderImageList(group, sectionKey, field.key, toArr(value), ctx); break;
    case 'service-cards': renderServiceCards(group, sectionKey, field.key, toArr(value), ctx); break;
    case 'why-cards': renderWhyCards(group, sectionKey, field.key, toArr(value), ctx); break;
    case 'case-slides': renderCaseSlides(group, sectionKey, field.key, toArr(value), ctx); break;
    case 'testimonial-cards': renderTestimonialCards(group, sectionKey, field.key, toArr(value), ctx); break;
    case 'engagement-cards': renderEngagementCards(group, sectionKey, field.key, toArr(value), ctx); break;
    case 'growth-cards': renderGrowthCards(group, sectionKey, field.key, toArr(value), ctx); break;
    case 'leader-cards': renderLeaderCards(group, sectionKey, field.key, toArr(value), ctx); break;
    case 'faq-items': renderFaqItems(group, sectionKey, field.key, toArr(value), ctx); break;
    case 'office-cards': renderOfficeCards(group, sectionKey, field.key, toArr(value), ctx); break;
    case 'job-cards': renderJobCards(group, sectionKey, field.key, toArr(value), ctx); break;
    case 'service-blocks': renderServiceBlocks(group, sectionKey, field.key, toArr(value), ctx); break;
    case 'blocks': renderBlocks(group, sectionKey, field.key, toArr(value), ctx, field.allowedTypes || ['html', 'callout', 'youtube']); break;
    case 'guide-sections': renderGuideSections(group, sectionKey, field.key, toArr(value), ctx); break;
    case 'article-picker': renderArticlePicker(group, field.key, value || {}, ctx); break;
    case 'related-articles': renderRelatedArticles(group, field.key, toArr(value), ctx); break;
  }

  return group;
}

function toArr(val) {
  if (Array.isArray(val)) return val;
  if (val && typeof val === 'object') return Object.values(val);
  return [];
}

// ── Shared renderers ──

const SITE_PAGES = [
  { value: 'index.html', label: 'Home' },
  { value: 'about.html', label: 'About Us' },
  { value: 'services.html', label: 'Services Overview' },
  { value: 'ai-accelerated-fintech-engineering.html', label: 'AI Accelerated Fintech Engineering' },
  { value: 'ai-powered-legacy-modernisation.html', label: 'AI Powered Legacy Modernisation' },
  { value: 'ai-governance.html', label: 'AI Governance' },
  { value: 'intelligent-operations.html', label: 'Intelligent Operations' },
  { value: 'contact.html', label: 'Contact' },
  { value: 'careers.html', label: 'Careers' },
  { value: 'privacy-policy.html', label: 'Privacy Policy' },
];

function renderLabelHref(group, obj) {
  const row = el('div', 'card-row label-href-row');
  const currentHref = obj.href || '';
  // Detect if the current value matches a known site page; if not (e.g.
  // mailto:, tel:, #anchor, external URL), preserve it as a custom option
  // so the user's custom URL isn't silently overwritten.
  const isKnown = SITE_PAGES.some(p => p.value === currentHref);
  const knownOptions = SITE_PAGES.map(p =>
    `<option value="${esc(p.value)}"${currentHref === p.value ? ' selected' : ''}>${esc(p.label)}</option>`
  ).join('');
  const customOption = (!isKnown && currentHref)
    ? `<option value="${esc(currentHref)}" selected>Custom: ${esc(currentHref)}</option>`
    : '';
  const customChoice = `<option value="__custom__">— Custom URL… —</option>`;
  const labelInput = `<input type="text" class="lh-label" value="${esc(obj.label || '')}" placeholder="Button text">`;
  const hrefSelect = `<select class="lh-href lh-href-select">${knownOptions}${customOption}${customChoice}</select>`;
  row.innerHTML = labelInput + hrefSelect;
  group.appendChild(row);

  // Hidden custom-URL input revealed when user picks "— Custom URL… —"
  const customRow = el('div', 'card-row lh-custom-row');
  customRow.style.display = 'none';
  customRow.style.marginTop = '6px';
  customRow.innerHTML = `<input type="text" class="lh-custom-input field-input" placeholder="Custom URL (mailto:, tel:, #anchor, https://…)" value="${esc(!isKnown ? currentHref : '')}">`;
  group.appendChild(customRow);

  const select = row.querySelector('.lh-href-select');
  const customInput = customRow.querySelector('.lh-custom-input');
  select.addEventListener('change', () => {
    if (select.value === '__custom__') {
      customRow.style.display = '';
      customInput.focus();
    } else {
      customRow.style.display = 'none';
    }
  });
  // Mirror custom input into the select's value so readAllForms sees it
  customInput.addEventListener('input', () => {
    const val = customInput.value.trim();
    if (!val) return;
    // Keep/update a custom option on the select
    let opt = select.querySelector('option[data-custom="1"]');
    if (!opt) {
      opt = document.createElement('option');
      opt.dataset.custom = '1';
      select.insertBefore(opt, select.querySelector('option[value="__custom__"]'));
    }
    opt.value = val;
    opt.textContent = 'Custom: ' + val;
    opt.selected = true;
  });

  // Always show icon upload for CTAs (allows adding/changing button icons)
  const iconLabel = el('div', 'field-label');
  iconLabel.textContent = 'Button icon (optional)';
  iconLabel.style.marginTop = '6px';
  iconLabel.style.fontSize = '12px';
  group.appendChild(iconLabel);
  group.appendChild(imageInput(obj.icon || '', 'lh-icon'));
}

function renderStats(group, sectionKey, arrayKey, items, ctx) {
  const container = el('div', 'repeatable-container');
  items.forEach((s, i) => {
    const card = el('div', 'nested-card');
    const row = el('div', 'card-row');
    row.innerHTML = `<input type="text" class="rep-value" value="${esc(s.value)}" placeholder="Value (e.g. 50%)"><input type="text" class="rep-label" value="${esc(s.label)}" placeholder="Label"><button class="bullet-remove" data-idx="${i}">&times;</button>`;
    card.appendChild(row);
    // Icon upload (optional)
    const iconLabel = el('div', 'field-label');
    iconLabel.textContent = 'Icon (optional)';
    iconLabel.style.fontSize = '12px';
    iconLabel.style.marginTop = '4px';
    card.appendChild(iconLabel);
    card.appendChild(imageInput(s.icon || '', 'rep-icon'));
    container.appendChild(card);
  });
  addButton(group, container, '+ Add stat', () => {
    ctx.data[sectionKey][arrayKey].push({ value: '', label: '', icon: '' });
    ctx.onRerender();
  });
  attachRemove(container, ctx, sectionKey, arrayKey);
}

function renderNumberedCards(group, sectionKey, cards, ctx) {
  const container = el('div', 'repeatable-container');
  cards.forEach((c, i) => {
    const card = el('div', 'nested-card');
    card.innerHTML = `<div class="card-row"><input type="text" class="nc-number" value="${esc(c.number)}" placeholder="Number" style="width:60px"><input type="text" class="nc-title" value="${esc(c.title)}" placeholder="Title"><button class="bullet-remove" data-idx="${i}">&times;</button></div><textarea class="nc-body" placeholder="Body">${esc(c.body)}</textarea>`;
    container.appendChild(card);
  });
  addButton(group, container, '+ Add card', () => {
    ctx.data[sectionKey].cards.push({ number: String(ctx.data[sectionKey].cards.length + 1).padStart(2, '0'), title: '', body: '' });
    ctx.onRerender();
  });
  attachRemove(container, ctx, sectionKey, 'cards');
}

function renderStages(group, sectionKey, arrayKey, items, ctx) {
  const container = el('div', 'repeatable-container');
  items.forEach((s, i) => {
    const card = el('div', 'nested-card');
    card.innerHTML = `<div class="card-row"><input type="text" class="rep-heading" value="${esc(s.heading)}" placeholder="Stage name"><button class="bullet-remove" data-idx="${i}">&times;</button></div><textarea class="rep-description" placeholder="Description">${esc(s.description)}</textarea>`;
    container.appendChild(card);
  });
  addButton(group, container, '+ Add stage', () => {
    ctx.data[sectionKey][arrayKey].push({ heading: '', description: '' });
    ctx.onRerender();
  });
  attachRemove(container, ctx, sectionKey, arrayKey);
}

function renderColumns(group, sectionKey, columns, ctx) {
  const container = el('div', 'repeatable-container');
  columns.forEach((col, ci) => {
    const card = el('div', 'section-card');
    card.innerHTML = `<div class="section-card-header"><input type="text" class="col-heading" value="${esc(col.heading)}" placeholder="Section heading"><button class="btn btn-danger btn-small remove-col-btn" data-idx="${ci}">Remove</button></div>`;
    const bulletsDiv = el('div', 'bullets-container');
    (toArr(col.bullets)).forEach((b, bi) => {
      const row = el('div', 'bullet-row');
      const textIn = document.createElement('input');
      textIn.type = 'text';
      textIn.className = 'bullet-text';
      textIn.value = b.text || '';
      textIn.placeholder = 'Bullet text';
      row.appendChild(textIn);
      row.appendChild(imageInput(b.icon || '', 'icon-input'));
      const removeBtn = document.createElement('button');
      removeBtn.className = 'bullet-remove';
      removeBtn.innerHTML = '&times;';
      removeBtn.addEventListener('click', () => { if (!confirmDeleteDefault(bi, sectionKey, 'columns')) return; ctx.onRerender.readForms(); ctx.data[sectionKey].columns[ci].bullets.splice(bi, 1); ctx.onRerender(); });
      row.appendChild(removeBtn);
      bulletsDiv.appendChild(row);
    });
    card.appendChild(bulletsDiv);
    const addBulletBtn = el('button', 'add-bullet-btn');
    addBulletBtn.textContent = '+ Add bullet';
    addBulletBtn.addEventListener('click', () => { ctx.onRerender.readForms(); ctx.data[sectionKey].columns[ci].bullets.push({ icon: null, text: '' }); ctx.onRerender(); });
    card.appendChild(addBulletBtn);
    container.appendChild(card);
  });
  container.querySelectorAll('.remove-col-btn').forEach(btn => {
    btn.addEventListener('click', () => { if (!confirmDeleteDefault(Number(btn.dataset.idx), sectionKey, 'columns')) return; ctx.onRerender.readForms(); ctx.data[sectionKey].columns.splice(Number(btn.dataset.idx), 1); ctx.onRerender(); });
  });
  const addBtn = el('button', 'add-section-btn');
  addBtn.textContent = '+ Add Column';
  addBtn.addEventListener('click', () => { ctx.onRerender.readForms(); ctx.data[sectionKey].columns.push({ heading: '', bullets: [{ icon: null, text: '' }] }); ctx.onRerender(); });
  group.appendChild(container);
  group.appendChild(addBtn);
}

function renderHBCards(group, sectionKey, arrayKey, items, ctx) {
  const container = el('div', 'repeatable-container');
  items.forEach((c, i) => {
    const card = el('div', 'nested-card');
    card.innerHTML = `<div class="card-row"><input type="text" class="hb-heading" value="${esc(c.heading || '')}" placeholder="Heading"><button class="bullet-remove" data-idx="${i}">&times;</button></div><textarea class="hb-body" placeholder="Body">${esc(c.body || '')}</textarea>`;
    container.appendChild(card);
  });
  addButton(group, container, '+ Add card', () => {
    ctx.data[sectionKey][arrayKey].push({ heading: '', body: '' });
    ctx.onRerender();
  });
  attachRemove(container, ctx, sectionKey, arrayKey);
}

function renderPillCards(group, sectionKey, arrayKey, items, ctx) {
  const container = el('div', 'repeatable-container');
  items.forEach((c, i) => {
    const card = el('div', 'nested-card');
    card.innerHTML = `<div class="card-row"><input type="text" class="hb-heading" value="${esc(c.heading || '')}" placeholder="Heading"><input type="text" class="hb-pill" value="${esc(c.pill || '')}" placeholder="Pill label"><button class="bullet-remove" data-idx="${i}">&times;</button></div><textarea class="hb-body" placeholder="Body">${esc(c.body || '')}</textarea>`;
    container.appendChild(card);
  });
  addButton(group, container, '+ Add card', () => {
    ctx.data[sectionKey][arrayKey].push({ heading: '', body: '', pill: '' });
    ctx.onRerender();
  });
  attachRemove(container, ctx, sectionKey, arrayKey);
}

function renderStringList(group, sectionKey, arrayKey, items, ctx) {
  const container = el('div', 'repeatable-container');
  items.forEach((s, i) => {
    const row = el('div', 'card-row');
    row.innerHTML = `<input type="text" class="str-item" value="${esc(s)}" placeholder="Item"><button class="bullet-remove" data-idx="${i}">&times;</button>`;
    container.appendChild(row);
  });
  addButton(group, container, '+ Add item', () => {
    ctx.data[sectionKey][arrayKey].push('');
    ctx.onRerender();
  });
  attachRemove(container, ctx, sectionKey, arrayKey);
}

function renderImageList(group, sectionKey, arrayKey, items, ctx) {
  const container = el('div', 'repeatable-container');
  items.forEach((item, i) => {
    const card = el('div', 'nested-card image-list-card');
    const src = typeof item === 'string' ? item : (item.src || '');
    const alt = typeof item === 'string' ? '' : (item.alt || '');
    // Image upload widget
    const imgWidget = imageInput(src, 'il-src');
    card.appendChild(imgWidget);
    // Alt text row
    const altRow = el('div', 'card-row');
    altRow.innerHTML = `<input type="text" class="il-alt" value="${esc(alt)}" placeholder="Alt text / label"><button class="bullet-remove" data-idx="${i}">&times;</button>`;
    card.appendChild(altRow);
    // Auto-fill alt text from filename when image changes (if alt is empty)
    const hiddenInput = imgWidget.querySelector('.il-src');
    if (hiddenInput) {
      const observer = new MutationObserver(() => {
        const altInput = card.querySelector('.il-alt');
        if (altInput && !altInput.value.trim() && hiddenInput.value) {
          // Derive alt from filename: "assets/badge-gdpr.svg" → "Gdpr"
          const filename = hiddenInput.value.split('/').pop().replace(/\.[^.]+$/, '');
          const cleaned = filename.replace(/^(badge|logo|icon|about|asset|img)[_-]/i, '').replace(/[_-]/g, ' ');
          altInput.value = cleaned.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        }
      });
      observer.observe(hiddenInput, { attributes: true, attributeFilter: ['value'] });
      // Also listen for programmatic value changes via input event
      hiddenInput.addEventListener('change', () => {
        const altInput = card.querySelector('.il-alt');
        if (altInput && !altInput.value.trim() && hiddenInput.value) {
          const filename = hiddenInput.value.split('/').pop().replace(/\.[^.]+$/, '');
          const cleaned = filename.replace(/^(badge|logo|icon|about|asset|img)[_-]/i, '').replace(/[_-]/g, ' ');
          altInput.value = cleaned.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        }
      });
    }
    container.appendChild(card);
  });
  addButton(group, container, '+ Add image', () => {
    ctx.data[sectionKey][arrayKey].push({ src: '', alt: '' });
    ctx.onRerender();
  });
  attachRemove(container, ctx, sectionKey, arrayKey);
}

// ── Home page specific ──

function renderServiceCards(group, sectionKey, arrayKey, items, ctx) {
  const container = el('div', 'repeatable-container');
  items.forEach((item, i) => {
    const card = el('div', 'nested-card');
    card.innerHTML = `
      <div class="card-row"><input type="text" class="sc-eyebrow" value="${esc(item.eyebrow || '')}" placeholder="Eyebrow"><input type="text" class="sc-title" value="${esc(item.title || '')}" placeholder="Service title"><button class="bullet-remove" data-idx="${i}">&times;</button></div>
      <div class="card-row"><input type="text" class="sc-href" value="${esc(item.href || '')}" placeholder="Link URL"></div>
      <div class="sc-bullets">${toArr(item.bullets).map((b, bi) => `<div class="card-row"><input type="text" class="sc-bullet" value="${esc(b)}" placeholder="Bullet ${bi + 1}"></div>`).join('')}</div>`;
    // Image upload for icon
    const hrefRow = card.querySelectorAll('.card-row')[1];
    hrefRow.parentNode.insertBefore(imageInput(item.icon || '', 'sc-icon'), hrefRow.nextSibling);
    container.appendChild(card);
  });
  addButton(group, container, '+ Add service card', () => {
    ctx.data[sectionKey][arrayKey].push({ eyebrow: '', title: '', href: '', icon: '', bullets: [''] });
    ctx.onRerender();
  });
  attachRemove(container, ctx, sectionKey, arrayKey);
}

function renderWhyCards(group, sectionKey, arrayKey, cards, ctx) {
  const container = el('div', 'repeatable-container');
  cards.forEach((c, i) => {
    const card = el('div', 'nested-card');
    card.innerHTML = `<div class="card-row"><input type="text" class="wc-title" value="${esc(c.title || '')}" placeholder="Card title"><input type="text" class="wc-style" value="${esc(c.style || 'light')}" placeholder="Style" style="width:120px"><button class="bullet-remove" data-idx="${i}">&times;</button></div><textarea class="wc-text" placeholder="Card text">${esc(c.text || '')}</textarea>`;
    card.appendChild(imageInput(c.image || '', 'wc-image'));
    container.appendChild(card);
  });
  addButton(group, container, '+ Add card', () => {
    ctx.data[sectionKey][arrayKey].push({ title: '', text: '', style: 'light', image: '', imageType: 'image' });
    ctx.onRerender();
  });
  attachRemove(container, ctx, sectionKey, arrayKey);
}

function renderCaseSlides(group, sectionKey, arrayKey, slides, ctx) {
  const container = el('div', 'repeatable-container');
  slides.forEach((s, i) => {
    const metrics = toArr(s.metrics);
    const card = el('div', 'nested-card');
    card.innerHTML = `
      <div class="card-row"><input type="text" class="cs-eyebrow" value="${esc(s.eyebrow || '')}" placeholder="Eyebrow"><button class="bullet-remove" data-idx="${i}">&times;</button></div>
      <input type="text" class="cs-title field-input" value="${esc(s.title || '')}" placeholder="Title">
      <textarea class="cs-text" placeholder="Summary">${esc(s.text || '')}</textarea>
      <div class="card-row"><input type="text" class="cs-cta-label" value="${esc(s.cta?.label || '')}" placeholder="CTA label"><input type="text" class="cs-cta-href" value="${esc(s.cta?.href || '')}" placeholder="CTA href"></div>`;
    card.appendChild(imageInput(s.image || '', 'cs-image'));
    const metricsLabel = el('div', 'field-label');
    metricsLabel.style.marginTop = '8px';
    metricsLabel.textContent = 'Metrics';
    card.appendChild(metricsLabel);
    metrics.forEach(m => {
      const row = el('div', 'card-row');
      row.innerHTML = `<input type="text" class="cs-metric-value" value="${esc(m.value || '')}" placeholder="Value" style="width:80px"><input type="text" class="cs-metric-label" value="${esc(m.label || '')}" placeholder="Label">`;
      card.appendChild(row);
    });
    container.appendChild(card);
  });
  addButton(group, container, '+ Add case study', () => {
    ctx.data[sectionKey][arrayKey].push({ eyebrow: '', title: '', text: '', image: '', cta: { label: 'Read Full Case Study', href: 'contact.html' }, metrics: [] });
    ctx.onRerender();
  });
  attachRemove(container, ctx, sectionKey, arrayKey);
}

function renderTestimonialCards(group, sectionKey, arrayKey, cards, ctx) {
  const container = el('div', 'repeatable-container');
  cards.forEach((c, i) => {
    const card = el('div', 'nested-card');
    card.innerHTML = `<div class="card-row"><input type="text" class="tc-name" value="${esc(c.name || '')}" placeholder="Name"><input type="text" class="tc-role" value="${esc(c.role || '')}" placeholder="Role"><button class="bullet-remove" data-idx="${i}">&times;</button></div><textarea class="tc-text" placeholder="Testimonial quote">${esc(c.text || '')}</textarea><div class="card-row"><input type="text" class="tc-logoAlt" value="${esc(c.logoAlt || '')}" placeholder="Logo alt text"></div>`;
    // Add image upload widget for logo (instead of plain text input)
    const altRow = card.querySelector('.card-row:last-child');
    card.insertBefore(imageInput(c.logo || '', 'tc-logo'), altRow);
    container.appendChild(card);
  });
  addButton(group, container, '+ Add testimonial', () => {
    ctx.data[sectionKey][arrayKey].push({ text: '', name: '', role: '', logo: '', logoAlt: '' });
    ctx.onRerender();
  });
  attachRemove(container, ctx, sectionKey, arrayKey);
}

function variantSelect(value, className) {
  return `<select class="${className}" style="width:120px;padding:8px 10px;background:var(--admin-surface-2);border:1px solid var(--admin-border);border-radius:8px;color:var(--admin-text);font-size:14px;font-family:inherit">
    <option value="light"${value === 'light' ? ' selected' : ''}>Light</option>
    <option value="featured"${value === 'featured' ? ' selected' : ''}>Featured</option>
    <option value="dark"${value === 'dark' ? ' selected' : ''}>Dark</option>
  </select>`;
}

function renderEngagementCards(group, sectionKey, arrayKey, items, ctx) {
  const container = el('div', 'repeatable-container');
  items.forEach((item, i) => {
    const card = el('div', 'nested-card');
    card.innerHTML = `<div class="card-row"><input type="text" class="ec-title" value="${esc(item.title || '')}" placeholder="Title">${variantSelect(item.variant || 'light', 'ec-variant')}<button class="bullet-remove" data-idx="${i}">&times;</button></div><textarea class="ec-text" placeholder="Description">${esc(item.text || '')}</textarea><div class="card-row"><input type="text" class="ec-cta" value="${esc(item.cta || '')}" placeholder="CTA label"></div>`;
    // Image upload widget — after CTA, before bullets
    card.appendChild(imageInput(item.image || '', 'ec-image'));
    // Bullets section with clear separator
    const ecBulletsLabel = el('div', 'field-label');
    ecBulletsLabel.textContent = 'Bullets';
    ecBulletsLabel.style.marginTop = '12px';
    ecBulletsLabel.style.paddingTop = '12px';
    ecBulletsLabel.style.borderTop = '1px solid var(--admin-border)';
    card.appendChild(ecBulletsLabel);
    toArr(item.bullets).forEach((b, bi) => {
      const bRow = el('div', 'card-row');
      bRow.innerHTML = `<input type="text" class="ec-bullet" value="${esc(b)}" placeholder="Bullet"><button class="bullet-remove ec-bullet-rm" data-parent="${i}" data-idx="${bi}">&times;</button>`;
      card.appendChild(bRow);
    });
    // Add bullet button
    const addBulletBtn = el('button', 'add-bullet-btn');
    addBulletBtn.textContent = '+ Add bullet';
    addBulletBtn.addEventListener('click', () => {
      ctx_readForms();
      const r = resolveDataRef(ctx.data, sectionKey);
      const arr = r[arrayKey];
      if (Array.isArray(arr) && arr[i]) { arr[i].bullets = toArr(arr[i].bullets); arr[i].bullets.push(''); }
      ctx.onRerender();
    });
    card.appendChild(addBulletBtn);
    // Bullet remove handlers
    card.querySelectorAll('.ec-bullet-rm').forEach(btn => {
      btn.addEventListener('click', () => {
        ctx_readForms();
        const r = resolveDataRef(ctx.data, sectionKey);
        const arr = r[arrayKey];
        if (Array.isArray(arr) && arr[Number(btn.dataset.parent)]) { arr[Number(btn.dataset.parent)].bullets.splice(Number(btn.dataset.idx), 1); }
        ctx.onRerender();
      });
    });
    container.appendChild(card);
  });
  addButton(group, container, '+ Add engagement model', () => {
    const r = resolveDataRef(ctx.data, sectionKey);
    r[arrayKey].push({ title: '', text: '', variant: 'light', image: '', cta: 'Talk to us', bullets: [] });
    ctx.onRerender();
  });
  attachRemove(container, ctx, sectionKey, arrayKey);
}

function renderGrowthCards(group, sectionKey, arrayKey, items, ctx) {
  const container = el('div', 'repeatable-container');
  items.forEach((item, i) => {
    const card = el('div', 'nested-card');
    card.innerHTML = `<div class="card-row"><input type="text" class="gc-title" value="${esc(item.title || '')}" placeholder="Title">${variantSelect(item.variant || 'light', 'gc-variant')}<button class="bullet-remove" data-idx="${i}">&times;</button></div><textarea class="gc-text" placeholder="Description">${esc(item.text || '')}</textarea><div class="card-row"><input type="text" class="gc-bestSuited" value="${esc(item.bestSuitedFor || '')}" placeholder="Best suited for"><input type="text" class="gc-cta" value="${esc(item.cta || '')}" placeholder="CTA label"></div><input type="text" class="gc-outcome field-input" value="${esc(item.outcome || '')}" placeholder="Outcome">`;
    // Image upload widget — placed after outcome, before bullets
    card.appendChild(imageInput(item.image || '', 'gc-image'));
    // Bullets section with clear separator
    const bulletsLabel = el('div', 'field-label');
    bulletsLabel.textContent = 'Bullets';
    bulletsLabel.style.marginTop = '12px';
    bulletsLabel.style.paddingTop = '12px';
    bulletsLabel.style.borderTop = '1px solid var(--admin-border)';
    card.appendChild(bulletsLabel);
    toArr(item.bullets).forEach((b, bi) => {
      const bRow = el('div', 'card-row');
      bRow.innerHTML = `<input type="text" class="gc-bullet" value="${esc(b)}" placeholder="Bullet"><button class="bullet-remove gc-bullet-rm" data-parent="${i}" data-idx="${bi}">&times;</button>`;
      card.appendChild(bRow);
    });
    // Add bullet button
    const gcAddBullet = el('button', 'add-bullet-btn');
    gcAddBullet.textContent = '+ Add bullet';
    gcAddBullet.addEventListener('click', () => {
      ctx_readForms();
      const r = resolveDataRef(ctx.data, sectionKey);
      const arr = r[arrayKey];
      if (Array.isArray(arr) && arr[i]) { arr[i].bullets = toArr(arr[i].bullets); arr[i].bullets.push(''); }
      ctx.onRerender();
    });
    card.appendChild(gcAddBullet);
    // Bullet remove handlers
    card.querySelectorAll('.gc-bullet-rm').forEach(btn => {
      btn.addEventListener('click', () => {
        ctx_readForms();
        const r = resolveDataRef(ctx.data, sectionKey);
        const arr = r[arrayKey];
        if (Array.isArray(arr) && arr[Number(btn.dataset.parent)]) { arr[Number(btn.dataset.parent)].bullets.splice(Number(btn.dataset.idx), 1); }
        ctx.onRerender();
      });
    });
    container.appendChild(card);
  });
  addButton(group, container, '+ Add growth package', () => {
    const r = resolveDataRef(ctx.data, sectionKey);
    r[arrayKey].push({ title: '', text: '', variant: 'light', bestSuitedFor: '', cta: 'Talk to us', outcome: '', bullets: [] });
    ctx.onRerender();
  });
  attachRemove(container, ctx, sectionKey, arrayKey);
}

// ── About page specific ──

function renderLeaderCards(group, sectionKey, arrayKey, items, ctx) {
  const container = el('div', 'repeatable-container');
  items.forEach((l, i) => {
    const card = el('div', 'nested-card');
    card.innerHTML = `
      <div class="card-row"><input type="text" class="ld-name" value="${esc(l.name || '')}" placeholder="Name"><input type="text" class="ld-role" value="${esc(l.role || '')}" placeholder="Role"><button class="bullet-remove" data-idx="${i}">&times;</button></div>
      <textarea class="ld-bio" placeholder="Bio">${esc(l.bio || '')}</textarea>`;
    card.appendChild(imageInput(l.image || '', 'ld-image'));
    container.appendChild(card);
  });
  addButton(group, container, '+ Add team member', () => {
    ctx.data[sectionKey].push({ name: '', role: '', bio: '', image: '' });
    ctx.onRerender();
  });
  attachRemove(container, ctx, sectionKey, arrayKey);
}

function renderFaqItems(group, sectionKey, arrayKey, items, ctx) {
  const container = el('div', 'repeatable-container');
  items.forEach((f, i) => {
    const card = el('div', 'nested-card');
    card.innerHTML = `
      <div class="card-row"><input type="text" class="fq-question" value="${esc(f.question || '')}" placeholder="Question"><button class="bullet-remove" data-idx="${i}">&times;</button></div>
      <textarea class="fq-answer" placeholder="Answer">${esc(f.answer || '')}</textarea>`;
    container.appendChild(card);
  });
  addButton(group, container, '+ Add FAQ', () => {
    ctx.data[sectionKey][arrayKey].push({ question: '', answer: '' });
    ctx.onRerender();
  });
  attachRemove(container, ctx, sectionKey, arrayKey);
}

// ── Contact, Careers, Services Overview specific ──

function renderOfficeCards(group, sectionKey, arrayKey, items, ctx) {
  const container = el('div', 'repeatable-container');
  items.forEach((o, i) => {
    const card = el('div', 'nested-card');
    card.innerHTML = `<div class="card-row"><input type="text" class="oc-country" value="${esc(o.country || '')}" placeholder="Country"><button class="bullet-remove" data-idx="${i}">&times;</button></div><textarea class="oc-address" placeholder="Address">${esc(o.address || '')}</textarea>`;
    container.appendChild(card);
  });
  addButton(group, container, '+ Add office', () => {
    ctx.data[sectionKey][arrayKey].push({ country: '', address: '' });
    ctx.onRerender();
  });
  attachRemove(container, ctx, sectionKey, arrayKey);
}

function renderJobCards(group, sectionKey, arrayKey, items, ctx) {
  const container = el('div', 'repeatable-container');
  items.forEach((j, i) => {
    const card = el('div', 'nested-card');
    card.innerHTML = `
      <div class="card-row"><input type="text" class="jc-title" value="${esc(j.title || '')}" placeholder="Job title"><button class="bullet-remove" data-idx="${i}">&times;</button></div>
      <div class="card-row"><input type="text" class="jc-jobId" value="${esc(j.jobId || '')}" placeholder="Job ID" style="width:100px"><input type="text" class="jc-department" value="${esc(j.department || '')}" placeholder="Department"><input type="text" class="jc-locationType" value="${esc(j.locationType || '')}" placeholder="Type (Remote/In-Office)"></div>
      <div class="card-row"><input type="text" class="jc-location" value="${esc(j.location || '')}" placeholder="Location"><input type="text" class="jc-experience" value="${esc(j.experience || '')}" placeholder="Experience (e.g. 3 - 8 years)"></div>`;
    container.appendChild(card);
  });
  addButton(group, container, '+ Add job', () => {
    ctx.data[sectionKey][arrayKey].push({ title: '', jobId: '', department: '', locationType: '', location: '', experience: '' });
    ctx.onRerender();
  });
  attachRemove(container, ctx, sectionKey, arrayKey);
}

function renderServiceBlocks(group, sectionKey, arrayKey, items, ctx) {
  const container = el('div', 'repeatable-container');
  items.forEach((s, i) => {
    const card = el('div', 'nested-card');
    card.innerHTML = `
      <div class="card-row"><input type="text" class="sb-kicker" value="${esc(s.kicker || '')}" placeholder="Kicker"><input type="text" class="sb-heading" value="${esc(s.heading || '')}" placeholder="Heading"><button class="bullet-remove" data-idx="${i}">&times;</button></div>
      <div class="card-row"><input type="text" class="sb-href" value="${esc(s.href || '')}" placeholder="Link URL"></div>
      <div class="field-label" style="margin-top:6px">Items</div>
      ${toArr(s.items).map((item, bi) => `<div class="card-row"><input type="text" class="sb-item" value="${esc(item)}" placeholder="Service item"><button class="bullet-remove sb-item-rm" data-parent="${i}" data-idx="${bi}">&times;</button></div>`).join('')}`;
    // Per-item remove buttons
    card.querySelectorAll('.sb-item-rm').forEach(btn => {
      btn.addEventListener('click', () => {
        ctx_readForms();
        const r = resolveDataRef(ctx.data, sectionKey);
        const arr = Array.isArray(r[arrayKey]) ? r[arrayKey] : (r[arrayKey] ? Object.values(r[arrayKey]) : []);
        if (arr[Number(btn.dataset.parent)]) {
          arr[Number(btn.dataset.parent)].items = toArr(arr[Number(btn.dataset.parent)].items);
          arr[Number(btn.dataset.parent)].items.splice(Number(btn.dataset.idx), 1);
          r[arrayKey] = arr;
        }
        ctx.onRerender();
      });
    });
    // + Add item per block
    const addItem = el('button', 'add-bullet-btn');
    addItem.textContent = '+ Add item';
    addItem.addEventListener('click', () => {
      ctx_readForms();
      const r = resolveDataRef(ctx.data, sectionKey);
      const arr = Array.isArray(r[arrayKey]) ? r[arrayKey] : (r[arrayKey] ? Object.values(r[arrayKey]) : []);
      if (arr[i]) { arr[i].items = toArr(arr[i].items); arr[i].items.push(''); r[arrayKey] = arr; }
      ctx.onRerender();
    });
    card.appendChild(addItem);
    container.appendChild(card);
  });
  addButton(group, container, '+ Add block', () => {
    const r = resolveDataRef(ctx.data, sectionKey);
    const arr = Array.isArray(r[arrayKey]) ? r[arrayKey] : (r[arrayKey] ? Object.values(r[arrayKey]) : []);
    arr.push({ kicker: '', heading: '', href: '', items: [''] });
    r[arrayKey] = arr;
    ctx.onRerender();
  });
  attachRemove(container, ctx, sectionKey, arrayKey);
}

// ── Utilities ──

function addButton(group, container, text, onClick) {
  const btn = el('button', 'add-bullet-btn');
  btn.textContent = text;
  btn.addEventListener('click', () => { ctx_readForms(); onClick(); });
  group.appendChild(container);
  group.appendChild(btn);
}

let ctx_readForms = () => {};
export function setReadForms(fn) { ctx_readForms = fn; }

/* ═══════════════════════════════════════════════
   blocks — typed body block list (HTML / Callout / Note / Subheading / YouTube)
   ═══════════════════════════════════════════════ */

const BLOCK_TYPE_LABELS = {
  html: 'Rich Text',
  callout: 'Callout',
  note: 'Note',
  subheading: 'Subheading',
  youtube: 'YouTube Video',
};

const NOTE_VARIANTS = [
  { value: 'key-insight',  label: 'Key Insight' },
  { value: 'practitioner', label: 'Practitioner' },
  { value: 'field',        label: 'From the Field' },
];

const CALLOUT_VARIANTS = [
  { value: 'dark',  label: 'Dark (filled)' },
  { value: 'ghost', label: 'Ghost (outline)' },
];

// Common destinations for callout CTAs on article pages (one level deep, so '../').
const ARTICLE_CTA_HREFS = [
  { value: '../contact', label: 'Contact' },
  { value: '../about', label: 'About Us' },
  { value: '../services', label: 'Services Overview' },
  { value: '../resources', label: 'Resources' },
  { value: '../careers', label: 'Careers' },
  { value: '../ai-accelerated-fintech-engineering', label: 'AI Accelerated Fintech Engineering' },
  { value: '../ai-powered-legacy-modernisation', label: 'AI Powered Legacy Modernisation' },
  { value: '../ai-governance', label: 'AI Governance' },
  { value: '../intelligent-operations', label: 'Intelligent Operations' },
];

function newBlock(type) {
  switch (type) {
    case 'html':       return { type: 'html', content: '' };
    case 'callout':    return { type: 'callout', title: '', text: '', cta: { label: '', href: '../contact', variant: 'dark' } };
    case 'note':       return { type: 'note', variant: 'key-insight', label: '', text: '' };
    case 'subheading': return { type: 'subheading', text: '' };
    case 'youtube':    return { type: 'youtube', videoId: '', caption: '' };
    default:           return { type };
  }
}

function renderBlockCard(block, idx, allowedTypes, total) {
  const card = el('div', 'block-card nested-card');
  card.dataset.blockIdx = String(idx);
  card.dataset.blockType = block.type;

  // Header: position + badge + move up/down + drag handle + delete
  const header = el('div', 'block-card-header');
  header.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:8px;';

  const position = el('span', 'block-card-position');
  position.style.cssText = 'font-size:12px;color:#6b7280;font-weight:600;min-width:48px;';
  position.textContent = total ? `${idx + 1} / ${total}` : `#${idx + 1}`;
  header.appendChild(position);

  const badge = el('span', 'block-card-badge');
  badge.style.cssText = 'background:#1f2937;color:#fff;font-size:11px;font-weight:600;padding:3px 8px;border-radius:4px;text-transform:uppercase;letter-spacing:0.4px;';
  badge.textContent = BLOCK_TYPE_LABELS[block.type] || block.type;
  header.appendChild(badge);

  const spacer = el('span', '');
  spacer.style.cssText = 'flex:1;';
  header.appendChild(spacer);

  const upBtn = el('button', 'block-move-up');
  upBtn.type = 'button';
  upBtn.dataset.idx = String(idx);
  upBtn.title = 'Move up';
  upBtn.disabled = idx === 0;
  upBtn.style.cssText = 'background:none;border:1px solid #ddd;border-radius:4px;width:26px;height:26px;cursor:pointer;font-size:13px;color:#374151;line-height:1;padding:0;';
  upBtn.innerHTML = '&#9650;';
  header.appendChild(upBtn);

  const downBtn = el('button', 'block-move-down');
  downBtn.type = 'button';
  downBtn.dataset.idx = String(idx);
  downBtn.title = 'Move down';
  downBtn.disabled = total != null && idx >= total - 1;
  downBtn.style.cssText = 'background:none;border:1px solid #ddd;border-radius:4px;width:26px;height:26px;cursor:pointer;font-size:13px;color:#374151;line-height:1;padding:0;';
  downBtn.innerHTML = '&#9660;';
  header.appendChild(downBtn);

  const drag = el('span', 'block-drag-handle');
  drag.setAttribute('data-reorder-handle', '');
  drag.title = 'Drag to reorder';
  drag.style.cssText = 'cursor:grab;color:#888;font-size:18px;line-height:1;user-select:none;padding:0 4px;';
  drag.textContent = '⠿';
  header.appendChild(drag);

  const del = el('button', 'bullet-remove block-delete');
  del.type = 'button';
  del.dataset.idx = String(idx);
  del.innerHTML = '&times;';
  header.appendChild(del);
  card.appendChild(header);

  // Body — type-specific
  const body = el('div', 'block-card-body');
  if (block.type === 'html') {
    const ta = textArea(block.content || '');
    ta.classList.add('blk-html');
    body.appendChild(ta);
  } else if (block.type === 'callout') {
    body.appendChild(labelInput('Title', textInput(block.title || '', 'Callout title'), 'blk-callout-title'));
    body.appendChild(labelInput('Text', plainTextarea(block.text || '', 'Callout body'), 'blk-callout-text'));
    body.appendChild(labelInput('CTA label', textInput(block.cta?.label || '', 'CTA button text'), 'blk-callout-cta-label'));
    body.appendChild(renderHrefSelect('CTA href', block.cta?.href || '../contact', 'blk-callout-cta-href'));
    body.appendChild(labelSelect('CTA variant', CALLOUT_VARIANTS, block.cta?.variant || 'dark', 'blk-callout-cta-variant'));
  } else if (block.type === 'note') {
    body.appendChild(labelSelect('Variant', NOTE_VARIANTS, block.variant || 'key-insight', 'blk-note-variant'));
    body.appendChild(labelInput('Label', textInput(block.label || '', 'e.g. KEY INSIGHT'), 'blk-note-label'));
    body.appendChild(labelInput('Text', plainTextarea(block.text || '', 'Note body'), 'blk-note-text'));
  } else if (block.type === 'subheading') {
    body.appendChild(labelInput('Subheading', textInput(block.text || '', 'Subheading text'), 'blk-sub-text'));
  } else if (block.type === 'youtube') {
    body.appendChild(renderYouTubeWidget(block));
  }
  card.appendChild(body);
  return card;
}

function plainTextarea(value, placeholder) {
  const ta = document.createElement('textarea');
  ta.className = 'field-input';
  ta.rows = 3;
  ta.value = value || '';
  if (placeholder) ta.placeholder = placeholder;
  return ta;
}

function labelInput(labelText, inputEl, className) {
  const wrap = el('div', 'blk-row');
  wrap.style.cssText = 'margin:6px 0;';
  const lbl = el('div', 'field-label');
  lbl.style.cssText = 'font-size:12px;margin-bottom:2px;';
  lbl.textContent = labelText;
  wrap.appendChild(lbl);
  inputEl.classList.add(className);
  wrap.appendChild(inputEl);
  return wrap;
}

function labelSelect(labelText, options, current, className) {
  const wrap = el('div', 'blk-row');
  wrap.style.cssText = 'margin:6px 0;';
  const lbl = el('div', 'field-label');
  lbl.style.cssText = 'font-size:12px;margin-bottom:2px;';
  lbl.textContent = labelText;
  wrap.appendChild(lbl);
  const sel = document.createElement('select');
  sel.className = `field-input ${className}`;
  options.forEach(o => {
    const opt = document.createElement('option');
    opt.value = o.value;
    opt.textContent = o.label;
    if (o.value === current) opt.selected = true;
    sel.appendChild(opt);
  });
  wrap.appendChild(sel);
  return wrap;
}

/**
 * HREF dropdown — common article-page destinations + a "Custom URL" fallback
 * with a hidden text input revealed when the user picks "Custom".
 */
function renderHrefSelect(labelText, currentHref, className) {
  const wrap = el('div', 'blk-row');
  wrap.style.cssText = 'margin:6px 0;';
  const lbl = el('div', 'field-label');
  lbl.style.cssText = 'font-size:12px;margin-bottom:2px;';
  lbl.textContent = labelText;
  wrap.appendChild(lbl);

  const sel = document.createElement('select');
  sel.className = `field-input ${className}`;
  const isKnown = ARTICLE_CTA_HREFS.some((p) => p.value === currentHref);
  ARTICLE_CTA_HREFS.forEach((o) => {
    const opt = document.createElement('option');
    opt.value = o.value;
    opt.textContent = o.label;
    if (o.value === currentHref) opt.selected = true;
    sel.appendChild(opt);
  });
  if (!isKnown && currentHref) {
    const opt = document.createElement('option');
    opt.value = currentHref;
    opt.textContent = `Custom: ${currentHref}`;
    opt.dataset.custom = '1';
    opt.selected = true;
    sel.appendChild(opt);
  }
  const customChoice = document.createElement('option');
  customChoice.value = '__custom__';
  customChoice.textContent = '— Custom URL… —';
  sel.appendChild(customChoice);
  wrap.appendChild(sel);

  const customRow = el('div', '');
  customRow.style.cssText = `margin-top:6px;display:${(!isKnown && currentHref) ? 'block' : 'none'};`;
  const customIn = textInput(!isKnown ? currentHref : '', 'Custom URL (../path, mailto:, https://…)');
  customIn.classList.add(`${className}-custom`);
  customRow.appendChild(customIn);
  wrap.appendChild(customRow);

  sel.addEventListener('change', () => {
    if (sel.value === '__custom__') {
      customRow.style.display = '';
      customIn.focus();
    } else {
      customRow.style.display = 'none';
    }
  });
  customIn.addEventListener('input', () => {
    const val = customIn.value.trim();
    if (!val) return;
    let opt = sel.querySelector('option[data-custom="1"]');
    if (!opt) {
      opt = document.createElement('option');
      opt.dataset.custom = '1';
      sel.insertBefore(opt, sel.querySelector('option[value="__custom__"]'));
    }
    opt.value = val;
    opt.textContent = `Custom: ${val}`;
    opt.selected = true;
  });

  return wrap;
}

function renderYouTubeWidget(block) {
  const wrap = el('div', 'yt-widget');
  wrap.style.cssText = 'display:flex;flex-direction:column;gap:6px;';
  const lbl = el('div', 'field-label');
  lbl.style.cssText = 'font-size:12px;';
  lbl.textContent = 'YouTube URL or 11-character video ID';
  wrap.appendChild(lbl);
  const input = textInput(block.videoId || '', 'https://www.youtube.com/watch?v=… or 11-char ID');
  input.classList.add('blk-yt-input');
  wrap.appendChild(input);
  const captionLbl = el('div', 'field-label');
  captionLbl.style.cssText = 'font-size:12px;';
  captionLbl.textContent = 'Caption (optional)';
  wrap.appendChild(captionLbl);
  const cap = textInput(block.caption || '', 'Optional caption shown below the video');
  cap.classList.add('blk-yt-caption');
  wrap.appendChild(cap);
  // Preview iframe
  const previewWrap = el('div', 'yt-preview');
  previewWrap.style.cssText = 'margin-top:6px;aspect-ratio:16/9;background:#111;border-radius:6px;overflow:hidden;display:none;';
  wrap.appendChild(previewWrap);
  const updatePreview = () => {
    const id = extractYouTubeId(input.value);
    previewWrap.innerHTML = '';
    if (id) {
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.youtube-nocookie.com/embed/${id}`;
      iframe.style.cssText = 'width:100%;height:100%;border:0;';
      iframe.loading = 'lazy';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      iframe.allowFullscreen = true;
      previewWrap.appendChild(iframe);
      previewWrap.style.display = '';
    } else {
      previewWrap.style.display = 'none';
    }
  };
  input.addEventListener('blur', updatePreview);
  input.addEventListener('change', updatePreview);
  if (block.videoId) setTimeout(updatePreview, 0);
  return wrap;
}

function readBlockCard(card) {
  const type = card.dataset.blockType;
  const block = { type };
  if (type === 'html') {
    const qw = card.querySelector('.blk-html');
    block.content = qw ? readQuillValue(qw, true) : '';
  } else if (type === 'callout') {
    const sel = card.querySelector('.blk-callout-cta-href');
    let href = sel?.value || '';
    if (href === '__custom__') {
      href = card.querySelector('.blk-callout-cta-href-custom')?.value?.trim() || '';
    }
    block.title = card.querySelector('.blk-callout-title')?.value || '';
    block.text = card.querySelector('.blk-callout-text')?.value || '';
    block.cta = {
      label: card.querySelector('.blk-callout-cta-label')?.value || '',
      href,
      variant: card.querySelector('.blk-callout-cta-variant')?.value || 'dark',
    };
  } else if (type === 'note') {
    block.variant = card.querySelector('.blk-note-variant')?.value || 'key-insight';
    block.label = card.querySelector('.blk-note-label')?.value || '';
    block.text = card.querySelector('.blk-note-text')?.value || '';
  } else if (type === 'subheading') {
    block.text = card.querySelector('.blk-sub-text')?.value || '';
  } else if (type === 'youtube') {
    block.videoId = extractYouTubeId(card.querySelector('.blk-yt-input')?.value || '');
    block.caption = card.querySelector('.blk-yt-caption')?.value || '';
  }
  return block;
}

/**
 * Resolve the array that a `blocks` field writes into. Handles two shapes:
 *  - Root field: data[arrayKey] IS the array (sectionKey === arrayKey).
 *  - Nested field: data[sectionKey][arrayKey].
 */
function resolveBlocksArray(ctx, sectionKey, arrayKey) {
  if (sectionKey === arrayKey) {
    if (!Array.isArray(ctx.data[sectionKey])) ctx.data[sectionKey] = [];
    return ctx.data[sectionKey];
  }
  const ref = resolveDataRef(ctx.data, sectionKey);
  if (!Array.isArray(ref[arrayKey])) ref[arrayKey] = [];
  return ref[arrayKey];
}

function renderBlocks(group, sectionKey, arrayKey, blocks, ctx, allowedTypes) {
  const list = el('div', 'block-list repeatable-container');
  list.setAttribute('data-reorder-list', '');
  list.dataset.section = sectionKey;
  list.dataset.array = arrayKey;
  const total = blocks.length;
  blocks.forEach((b, i) => list.appendChild(renderBlockCard(b, i, allowedTypes, total)));
  group.appendChild(list);

  // Add-block toolbar
  const addRow = el('div', 'block-add-row');
  addRow.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-top:8px;';
  allowedTypes.forEach((t) => {
    const btn = el('button', 'add-bullet-btn');
    btn.type = 'button';
    btn.textContent = `+ ${BLOCK_TYPE_LABELS[t] || t}`;
    btn.title = `Add a new ${BLOCK_TYPE_LABELS[t] || t} block at the end (use ▲▼ or drag to reposition)`;
    btn.addEventListener('click', () => {
      ctx_readForms();
      const arr = resolveBlocksArray(ctx, sectionKey, arrayKey);
      arr.push(newBlock(t));
      ctx.onRerender();
    });
    addRow.appendChild(btn);
  });
  const hint = el('span', '');
  hint.style.cssText = 'font-size:12px;color:#6b7280;margin-left:8px;';
  hint.textContent = total
    ? `New blocks add at the end (position ${total + 1}). Use ▲▼ or drag to reorder.`
    : 'Click a button above to add the first block.';
  addRow.appendChild(hint);
  group.appendChild(addRow);

  // Wire delete buttons (re-render after splice)
  list.querySelectorAll('.block-delete').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.idx);
      if (!confirm('Delete this block?')) return;
      ctx_readForms();
      const arr = resolveBlocksArray(ctx, sectionKey, arrayKey);
      if (idx < arr.length) {
        arr.splice(idx, 1);
        ctx.onRerender();
      }
    });
  });

  // Wire move up/down buttons
  list.querySelectorAll('.block-move-up').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.idx);
      if (idx <= 0) return;
      ctx_readForms();
      const arr = resolveBlocksArray(ctx, sectionKey, arrayKey);
      [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
      ctx.onRerender();
    });
  });
  list.querySelectorAll('.block-move-down').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.idx);
      ctx_readForms();
      const arr = resolveBlocksArray(ctx, sectionKey, arrayKey);
      if (idx >= arr.length - 1) return;
      [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
      ctx.onRerender();
    });
  });
}

/* ── Numbered guide sections (each contains its own blocks list) ── */
function renderGuideSections(group, sectionKey, arrayKey, sections, ctx) {
  const container = el('div', 'guide-sections-container repeatable-container');
  container.setAttribute('data-reorder-list', '');
  sections.forEach((section, i) => {
    const card = el('div', 'guide-section-card section-card');
    card.style.cssText = 'border:1px solid #ddd;border-radius:8px;padding:12px;margin-bottom:12px;';
    card.dataset.sectionIdx = String(i);

    const header = el('div', 'gs-header');
    header.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:8px;';
    const badge = el('span', 'gs-badge');
    badge.style.cssText = 'background:#0ea5e9;color:#fff;padding:3px 8px;border-radius:4px;font-size:11px;font-weight:600;';
    badge.textContent = `SECTION ${section.number || (i + 1)}`;
    header.appendChild(badge);
    const drag = el('span', '');
    drag.setAttribute('data-reorder-handle', '');
    drag.style.cssText = 'cursor:grab;color:#888;font-size:18px;line-height:1;user-select:none;margin-left:auto;';
    drag.textContent = '⠿';
    header.appendChild(drag);
    const del = el('button', 'bullet-remove gs-delete');
    del.type = 'button';
    del.dataset.idx = String(i);
    del.innerHTML = '&times;';
    header.appendChild(del);
    card.appendChild(header);

    const numRow = el('div', 'card-row');
    numRow.style.cssText = 'display:grid;grid-template-columns:80px 1fr;gap:8px;margin-bottom:8px;';
    const numIn = textInput(String(section.number || (i + 1)), 'No.');
    numIn.classList.add('gs-number');
    numIn.type = 'number';
    numRow.appendChild(numIn);
    const titleIn = textInput(section.title || '', 'Section title');
    titleIn.classList.add('gs-title');
    numRow.appendChild(titleIn);
    card.appendChild(numRow);

    // Hidden slug — auto-derived from title; never shown to the user
    const slugIn = document.createElement('input');
    slugIn.type = 'hidden';
    slugIn.className = 'gs-slug';
    slugIn.value = section.slug || slugify(section.title || '');
    card.appendChild(slugIn);

    titleIn.addEventListener('input', () => {
      slugIn.value = slugify(titleIn.value);
    });

    // Embedded blocks list
    const blocksLabel = el('div', 'field-label');
    blocksLabel.textContent = 'Blocks';
    blocksLabel.style.cssText = 'margin-top:6px;';
    card.appendChild(blocksLabel);

    const blocksGroup = el('div', '');
    const subBlocks = Array.isArray(section.blocks) ? section.blocks : [];
    const subList = el('div', 'block-list repeatable-container');
    subList.setAttribute('data-reorder-list', '');
    subBlocks.forEach((b, j) => subList.appendChild(renderBlockCard(b, j, ['html', 'callout', 'note', 'subheading', 'youtube'], subBlocks.length)));
    blocksGroup.appendChild(subList);

    const addRow = el('div', 'block-add-row');
    addRow.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;margin-top:8px;';
    ['html', 'callout', 'note', 'subheading', 'youtube'].forEach((t) => {
      const btn = el('button', 'add-bullet-btn');
      btn.type = 'button';
      btn.textContent = `+ ${BLOCK_TYPE_LABELS[t]}`;
      btn.addEventListener('click', () => {
        ctx_readForms();
        const arr = resolveBlocksArray(ctx, sectionKey, arrayKey);
        if (!arr[i]) arr[i] = { slug: '', number: i + 1, title: '', blocks: [] };
        if (!Array.isArray(arr[i].blocks)) arr[i].blocks = [];
        arr[i].blocks.push(newBlock(t));
        ctx.onRerender();
      });
      addRow.appendChild(btn);
    });
    blocksGroup.appendChild(addRow);
    card.appendChild(blocksGroup);

    // Wire sub-block delete
    subList.querySelectorAll('.block-delete').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.idx);
        if (!confirm('Delete this block?')) return;
        ctx_readForms();
        const arr = resolveBlocksArray(ctx, sectionKey, arrayKey);
        if (arr[i] && Array.isArray(arr[i].blocks)) {
          arr[i].blocks.splice(idx, 1);
          ctx.onRerender();
        }
      });
    });
    // Wire sub-block move up/down
    subList.querySelectorAll('.block-move-up').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.idx);
        if (idx <= 0) return;
        ctx_readForms();
        const arr = resolveBlocksArray(ctx, sectionKey, arrayKey);
        if (!arr[i]?.blocks) return;
        const blocks = arr[i].blocks;
        [blocks[idx - 1], blocks[idx]] = [blocks[idx], blocks[idx - 1]];
        ctx.onRerender();
      });
    });
    subList.querySelectorAll('.block-move-down').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.idx);
        ctx_readForms();
        const arr = resolveBlocksArray(ctx, sectionKey, arrayKey);
        if (!arr[i]?.blocks) return;
        const blocks = arr[i].blocks;
        if (idx >= blocks.length - 1) return;
        [blocks[idx], blocks[idx + 1]] = [blocks[idx + 1], blocks[idx]];
        ctx.onRerender();
      });
    });

    container.appendChild(card);
  });
  group.appendChild(container);

  // Wire section-level delete
  container.querySelectorAll('.gs-delete').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.idx);
      if (!confirm('Delete this section?')) return;
      ctx_readForms();
      const arr = resolveBlocksArray(ctx, sectionKey, arrayKey);
      if (idx < arr.length) {
        arr.splice(idx, 1);
        ctx.onRerender();
      }
    });
  });

  // Add section button
  const add = el('button', 'add-bullet-btn');
  add.type = 'button';
  add.textContent = '+ Add section';
  add.addEventListener('click', () => {
    ctx_readForms();
    const arr = resolveBlocksArray(ctx, sectionKey, arrayKey);
    arr.push({ slug: '', number: arr.length + 1, title: '', blocks: [] });
    ctx.onRerender();
  });
  group.appendChild(add);
}

/* ── Related articles multi-select (pick by title, store slugs) ── */
function renderRelatedArticles(group, fieldKey, currentSlugs, ctx) {
  const wrap = el('div', 'related-articles');
  wrap.style.cssText = 'border:1px solid #e5e7eb;border-radius:8px;padding:10px;background:#fafbfc;';
  const help = el('div', '');
  help.style.cssText = 'font-size:12px;color:#6b7280;margin-bottom:8px;';
  help.textContent = 'Loading published articles…';
  wrap.appendChild(help);

  const list = el('div', 'related-articles-list');
  list.style.cssText = 'display:flex;flex-direction:column;gap:6px;max-height:280px;overflow-y:auto;';
  wrap.appendChild(list);

  fetch('content/Resources/articles-index.json', { cache: 'no-store' })
    .then((r) => r.ok ? r.json() : { items: [] })
    .then((idx) => {
      const items = (idx.items || []).filter((it) => it.slug);
      if (!items.length) {
        help.textContent = 'No published articles yet — once you publish some, they\'ll appear here.';
        return;
      }
      help.textContent = `Tick the articles you want to feature in the "More …" section at the bottom of this article.`;
      const selected = new Set(currentSlugs);
      items.forEach((it) => {
        const row = el('label', 'related-articles-row');
        row.style.cssText = 'display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:4px;cursor:pointer;background:#fff;border:1px solid #eee;';
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.className = 'related-article-cb';
        cb.value = it.slug;
        cb.checked = selected.has(it.slug);
        const label = el('span', '');
        const cat = it.category || '';
        label.innerHTML = `<strong>${esc(it.title || '(untitled)')}</strong> <span style="color:#6b7280;font-size:12px;">— ${esc(cat)}${it.date ? ' · ' + esc(it.date) : ''}</span>`;
        row.appendChild(cb);
        row.appendChild(label);
        list.appendChild(row);
      });
    })
    .catch(() => {
      help.textContent = 'Could not load articles list.';
    });

  group.appendChild(wrap);
}

/* ── Article picker (Resources featured card) ── */
export function slugify(s) {
  return String(s || '').toLowerCase().trim()
    .replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function renderArticlePicker(group, fieldKey, value, ctx) {
  const wrap = el('div', 'article-picker');
  const sel = document.createElement('select');
  sel.className = 'field-input article-picker-select';
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = '— Select an article —';
  sel.appendChild(placeholder);
  wrap.appendChild(sel);
  const note = el('div', '');
  note.style.cssText = 'font-size:12px;color:#666;margin-top:4px;';
  note.textContent = 'Loading articles…';
  wrap.appendChild(note);

  const currentValue = (value && value.type && value.slug) ? `${value.type}:${value.slug}` : '';

  // Load index from articles-index.json (synced by rebuild.php)
  fetch('content/Resources/articles-index.json', { cache: 'no-store' })
    .then((r) => r.ok ? r.json() : { items: [] })
    .then((idx) => {
      const items = (idx.items || []).filter(Boolean);
      if (!items.length) {
        note.textContent = 'No published articles yet. Publish one to populate this list.';
        return;
      }
      items.forEach((it) => {
        const opt = document.createElement('option');
        const type = it.href?.startsWith('blog/') ? 'blog' : it.href?.startsWith('insights/') ? 'insights' : it.href?.startsWith('guides/') ? 'guides' : '';
        if (!type || !it.slug) return;
        opt.value = `${type}:${it.slug}`;
        opt.textContent = `[${it.category || type}] ${it.title} ${it.date ? '(' + it.date + ')' : ''}`;
        if (opt.value === currentValue) opt.selected = true;
        sel.appendChild(opt);
      });
      note.textContent = '';
    })
    .catch(() => {
      note.textContent = 'Could not load articles index.';
    });

  group.appendChild(wrap);
}

function isDefaultItem(sectionKey, arrayKey, idx) {
  try {
    const defaults = window._adminCurrentDefaults?.();
    if (!defaults) return false;
    const parts = sectionKey.split('.');
    let ref = defaults;
    for (const p of parts) { if (!ref?.[p]) return false; ref = ref[p]; }
    const arr = arrayKey ? ref[arrayKey] : ref;
    return Array.isArray(arr) && idx < arr.length;
  } catch (e) { return false; }
}

function confirmDeleteDefault(idx, sectionKey, arrayKey) {
  if (isDefaultItem(sectionKey, arrayKey, idx)) {
    return confirm('This is a default item that came with the original site content.\n\nAre you sure you want to remove it?\n\nYou can always restore it using "Revert to Default".');
  }
  return true;
}

function attachRemove(container, ctx, sectionKey, arrayKey) {
  // Only top-level card remove buttons — exclude bullet-remove buttons that
  // are nested inside a card's inner repeatable (ec-bullet-rm, gc-bullet-rm,
  // sb-item-rm) which have their own click handlers. Those sub-item buttons
  // all have an extra class alongside .bullet-remove (e.g. .ec-bullet-rm)
  // and carry a data-parent attribute to identify their parent card.
  container.querySelectorAll(
    ':scope > .nested-card > .card-row > .bullet-remove:not([data-parent]), ' +
    ':scope > .card-row > .bullet-remove:not([data-parent])'
  ).forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.idx);
      if (!confirmDeleteDefault(idx, sectionKey, arrayKey)) return;
      ctx.onRerender.readForms();
      const ref = resolveDataRef(ctx.data, sectionKey);
      const arr = Array.isArray(ref[arrayKey]) ? ref[arrayKey] :
                  Array.isArray(ref) ? ref :
                  ref[arrayKey];
      if (Array.isArray(arr)) { arr.splice(idx, 1); ctx.onRerender(); }
    });
  });
}

/* ═══════════════════════════════════════════════
   readAllForms — reads form state back into data
   ═══════════════════════════════════════════════ */

function resolveDataRef(data, sectionKey, nestedKey) {
  if (nestedKey) {
    if (!data[sectionKey]) data[sectionKey] = {};
    if (!data[sectionKey][nestedKey]) data[sectionKey][nestedKey] = {};
    return data[sectionKey][nestedKey];
  }
  if (sectionKey.includes('.')) {
    const parts = sectionKey.split('.');
    let ref = data;
    for (const p of parts) { if (!ref[p]) ref[p] = {}; ref = ref[p]; }
    return ref;
  }
  if (!data[sectionKey]) data[sectionKey] = {};
  return data[sectionKey];
}

export function readAllForms(editorSections, sections, data) {
  for (const cfg of sections) {
    const sectionKey = cfg.parentKey || cfg.key;
    const nestedKey = cfg.nestedKey;
    // _root: section body is identified by cfg.key in the DOM but writes to data root
    const queryKey = sectionKey === '_root' ? cfg.key : sectionKey;
    const body = editorSections.querySelector(`[data-section-key="${queryKey}"]${nestedKey ? `[data-nested-key="${nestedKey}"]` : ':not([data-nested-key])'}`);
    if (!body) continue;

    const ref = sectionKey === '_root' ? data : resolveDataRef(data, sectionKey, nestedKey);

    for (const field of cfg.fields) {
      const group = body.querySelector(`[data-field-key="${field.key}"]`);
      if (!group) continue;

      switch (field.type) {
        case 'text': { const input = group.querySelector('input'); if (input) ref[field.key] = input.value; break; }
        case 'image': { const img = group.querySelector('.field-image'); if (img) ref[field.key] = img.value; break; }
        case 'textarea': { const qw = group.querySelector('.quill-wrapper'); if (qw) { ref[field.key] = readQuillValue(qw, false); } else { const ta = group.querySelector('textarea'); if (ta) ref[field.key] = ta.value; } break; }
        case 'title': { const inputs = group.querySelectorAll('input'); if (inputs.length >= 2) ref[field.key] = [inputs[0].value, inputs[1].value]; break; }
        case 'label-href': { const l = group.querySelector('.lh-label'); const h = group.querySelector('.lh-href'); const ic = group.querySelector('.lh-icon'); if (l && h) { let href = h.value; if (href === '__custom__') href = group.querySelector('.lh-custom-input')?.value?.trim() || ''; const obj = { label: l.value, href }; if (ic && ic.value) obj.icon = ic.value; ref[field.key] = obj; } break; }
        case 'stats': { ref[field.key] = Array.from(group.querySelectorAll('.nested-card')).map(c => ({ value: c.querySelector('.rep-value')?.value || '', label: c.querySelector('.rep-label')?.value || '', icon: c.querySelector('.rep-icon')?.value || '' })); break; }
        case 'numbered-cards': { ref.cards = Array.from(group.querySelectorAll('.nested-card')).map(c => ({ number: c.querySelector('.nc-number')?.value || '', title: c.querySelector('.nc-title')?.value || '', body: c.querySelector('.nc-body')?.value || '' })); break; }
        case 'stages': { ref[field.key] = Array.from(group.querySelectorAll('.nested-card')).map(c => ({ heading: c.querySelector('.rep-heading')?.value || '', description: c.querySelector('.rep-description')?.value || '' })); break; }
        case 'columns': { ref.columns = Array.from(group.querySelectorAll('.section-card')).map(card => ({ heading: card.querySelector('.col-heading')?.value || '', bullets: Array.from(card.querySelectorAll('.bullet-row')).map(row => ({ icon: row.querySelector('.icon-input')?.value || null, text: row.querySelector('.bullet-text')?.value || '' })) })); break; }
        case 'heading-body-cards': case 'pill-cards': { ref[field.key] = Array.from(group.querySelectorAll('.nested-card')).map(c => { const obj = { heading: c.querySelector('.hb-heading')?.value || '', body: c.querySelector('.hb-body')?.value || '' }; const pill = c.querySelector('.hb-pill'); if (pill) obj.pill = pill.value; return obj; }); break; }
        case 'string-list': { ref[field.key] = Array.from(group.querySelectorAll('.card-row')).map(r => r.querySelector('.str-item')?.value || ''); break; }
        case 'image-list': { ref[field.key] = Array.from(group.querySelectorAll('.image-list-card')).map(c => ({ src: c.querySelector('.il-src')?.value || '', alt: c.querySelector('.il-alt')?.value || '' })); break; }
        case 'service-cards': { ref[field.key] = Array.from(group.querySelectorAll('.nested-card')).map((c, i) => { const existing = ref[field.key]?.[i] || {}; return { ...existing, eyebrow: c.querySelector('.sc-eyebrow')?.value || '', title: c.querySelector('.sc-title')?.value || '', href: c.querySelector('.sc-href')?.value || '', icon: c.querySelector('.sc-icon')?.value || '', bullets: Array.from(c.querySelectorAll('.sc-bullet')).map(b => b.value) }; }); break; }
        case 'why-cards': { ref[field.key] = Array.from(group.querySelectorAll('.nested-card')).map((c, i) => { const existing = ref[field.key]?.[i] || {}; return { ...existing, title: c.querySelector('.wc-title')?.value || '', text: c.querySelector('.wc-text')?.value || '', style: c.querySelector('.wc-style')?.value || 'light', image: c.querySelector('.wc-image')?.value || '' }; }); break; }
        case 'case-slides': { ref[field.key] = Array.from(group.querySelectorAll('.nested-card')).map((c, i) => { const existing = ref[field.key]?.[i] || {}; const mvs = c.querySelectorAll('.cs-metric-value'); const mls = c.querySelectorAll('.cs-metric-label'); return { ...existing, eyebrow: c.querySelector('.cs-eyebrow')?.value || '', title: c.querySelector('.cs-title')?.value || '', text: c.querySelector('.cs-text')?.value || '', image: c.querySelector('.cs-image')?.value || '', cta: { label: c.querySelector('.cs-cta-label')?.value || '', href: c.querySelector('.cs-cta-href')?.value || '' }, metrics: Array.from(mvs).map((mv, mi) => ({ value: mv.value, label: mls[mi]?.value || '' })) }; }); break; }
        case 'testimonial-cards': { ref[field.key] = Array.from(group.querySelectorAll('.nested-card')).map(c => ({ text: c.querySelector('.tc-text')?.value || '', name: c.querySelector('.tc-name')?.value || '', role: c.querySelector('.tc-role')?.value || '', logo: c.querySelector('.tc-logo')?.value || '', logoAlt: c.querySelector('.tc-logoAlt')?.value || '' })); break; }
        case 'engagement-cards': { ref[field.key] = Array.from(group.querySelectorAll('.nested-card')).map((c, i) => { const existing = ref[field.key]?.[i] || {}; return { ...existing, title: c.querySelector('.ec-title')?.value || '', text: c.querySelector('.ec-text')?.value || '', variant: c.querySelector('.ec-variant')?.value || 'light', image: c.querySelector('.ec-image')?.value || '', cta: c.querySelector('.ec-cta')?.value || '', bullets: Array.from(c.querySelectorAll('.ec-bullet')).map(b => b.value) }; }); break; }
        case 'growth-cards': { ref[field.key] = Array.from(group.querySelectorAll('.nested-card')).map((c, i) => { const existing = ref[field.key]?.[i] || {}; return { ...existing, title: c.querySelector('.gc-title')?.value || '', text: c.querySelector('.gc-text')?.value || '', variant: c.querySelector('.gc-variant')?.value || 'light', bestSuitedFor: c.querySelector('.gc-bestSuited')?.value || '', cta: c.querySelector('.gc-cta')?.value || '', outcome: c.querySelector('.gc-outcome')?.value || '', bullets: Array.from(c.querySelectorAll('.gc-bullet')).map(b => b.value) }; }); break; }
        case 'leader-cards': { ref[field.key] = Array.from(group.querySelectorAll('.nested-card')).map(c => ({ name: c.querySelector('.ld-name')?.value || '', role: c.querySelector('.ld-role')?.value || '', bio: c.querySelector('.ld-bio')?.value || '', image: c.querySelector('.ld-image')?.value || '' })); break; }
        case 'faq-items': { ref[field.key] = Array.from(group.querySelectorAll('.nested-card')).map(c => ({ question: c.querySelector('.fq-question')?.value || '', answer: c.querySelector('.fq-answer')?.value || '' })); break; }
        case 'office-cards': { ref[field.key] = Array.from(group.querySelectorAll('.nested-card')).map(c => ({ country: c.querySelector('.oc-country')?.value || '', address: c.querySelector('.oc-address')?.value || '' })); break; }
        case 'job-cards': { ref[field.key] = Array.from(group.querySelectorAll('.nested-card')).map(c => ({ title: c.querySelector('.jc-title')?.value || '', jobId: c.querySelector('.jc-jobId')?.value || '', department: c.querySelector('.jc-department')?.value || '', locationType: c.querySelector('.jc-locationType')?.value || '', location: c.querySelector('.jc-location')?.value || '', experience: c.querySelector('.jc-experience')?.value || '' })); break; }
        case 'service-blocks': { ref[field.key] = Array.from(group.querySelectorAll('.nested-card')).map((c, i) => { const existing = (Array.isArray(ref[field.key]) ? ref[field.key] : Object.values(ref[field.key] || {}))[i] || {}; return { ...existing, kicker: c.querySelector('.sb-kicker')?.value || '', heading: c.querySelector('.sb-heading')?.value || '', href: c.querySelector('.sb-href')?.value || '', items: Array.from(c.querySelectorAll('.sb-item')).map(b => b.value) }; }); break; }
        case 'blocks': {
          const list = group.querySelector('.block-list');
          if (list) ref[field.key] = Array.from(list.querySelectorAll(':scope > .block-card')).map((c) => readBlockCard(c));
          break;
        }
        case 'guide-sections': {
          ref[field.key] = Array.from(group.querySelectorAll('.guide-section-card')).map((c, i) => {
            const list = c.querySelector('.block-list');
            const blocks = list ? Array.from(list.querySelectorAll(':scope > .block-card')).map((b) => readBlockCard(b)) : [];
            return {
              slug: c.querySelector('.gs-slug')?.value || '',
              number: Number(c.querySelector('.gs-number')?.value || (i + 1)),
              title: c.querySelector('.gs-title')?.value || '',
              blocks,
            };
          });
          break;
        }
        case 'article-picker': {
          const sel = group.querySelector('.article-picker-select');
          const v = sel?.value || '';
          const m = v ? v.split(':') : [];
          ref[field.key] = m.length === 2 ? { type: m[0], slug: m[1] } : null;
          break;
        }
        case 'related-articles': {
          ref[field.key] = Array.from(group.querySelectorAll('.related-article-cb:checked')).map((cb) => cb.value);
          break;
        }
      }

      // arrayAtRoot fix: the case handler wrote to ref[field.key], but the
      // live site expects the array directly at data[sectionKey]. Promote
      // the value to the right location.
      if (field.arrayAtRoot && !nestedKey && Array.isArray(ref[field.key])) {
        data[sectionKey] = ref[field.key];
      }
    }
  }
}
