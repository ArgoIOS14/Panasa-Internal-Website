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

function textArea(value) {
  const wrapper = el('div', 'quill-wrapper');
  const editorDiv = el('div', 'quill-editor-container');
  wrapper.appendChild(editorDiv);

  // Initialize Quill after DOM insertion — use setTimeout to ensure element is in DOM
  setTimeout(() => {
    if (typeof Quill === 'undefined' || !editorDiv.isConnected) return;
    try {
      const quill = new Quill(editorDiv, {
        theme: 'snow',
        modules: {
          toolbar: [['bold', 'italic'], ['link'], [{ list: 'bullet' }, { list: 'ordered' }]],
        },
        placeholder: 'Enter text...',
      });
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
function imageInput(currentUrl, className) {
  const wrapper = el('div', 'image-upload-widget');
  const hasImage = currentUrl && currentUrl.trim();

  const PLACEHOLDER = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" rx="8" fill="%23242424"/><path d="M28 52l8-10 6 7 10-13 12 16H16z" fill="%23444"/><circle cx="30" cy="32" r="5" fill="%23444"/></svg>');

  wrapper.innerHTML = `
    <input type="hidden" class="${className || 'img-url-value'}" value="${esc(currentUrl || '')}">
    <div class="img-drop-zone ${hasImage ? 'has-preview' : 'has-preview'}">
      <img src="${hasImage ? esc(currentUrl) : PLACEHOLDER}" class="img-preview ${hasImage ? '' : 'img-placeholder'}" alt="${hasImage ? 'Preview' : 'No image'}">
      <div class="img-drop-label">
        <span class="img-drop-icon">&#128247;</span>
        <span>Drop image here or <label class="img-browse-label">browse<input type="file" accept="image/*" class="img-file-input"></label></span>
      </div>
      <div class="img-uploading" style="display:none">Uploading...</div>
    </div>
    <div class="img-url-row">
      <input type="text" class="img-url-text field-input" value="${esc(currentUrl || '')}" placeholder="Or paste image URL">
      <button type="button" class="img-gallery-btn" title="Choose from gallery">Gallery</button>
      <button type="button" class="img-clear-btn" title="Remove image" style="${hasImage ? '' : 'display:none'}">Remove</button>
    </div>
  `;

  const hiddenInput = wrapper.querySelector(`.${className || 'img-url-value'}`);
  const dropZone = wrapper.querySelector('.img-drop-zone');
  const fileInput = wrapper.querySelector('.img-file-input');
  const urlText = wrapper.querySelector('.img-url-text');
  const uploading = wrapper.querySelector('.img-uploading');
  const clearBtn = wrapper.querySelector('.img-clear-btn');

  function setUrl(url) {
    hiddenInput.value = url;
    urlText.value = url;
    const existing = dropZone.querySelector('.img-preview');
    if (url) {
      dropZone.classList.add('has-preview');
      if (existing) { existing.src = url; existing.classList.remove('img-placeholder'); existing.alt = 'Preview'; }
      else {
        const img = document.createElement('img');
        img.className = 'img-preview';
        img.src = url;
        img.alt = 'Preview';
        dropZone.prepend(img);
      }
      clearBtn.style.display = '';
    } else {
      // Show placeholder instead of removing preview
      dropZone.classList.add('has-preview');
      if (existing) { existing.src = PLACEHOLDER; existing.classList.add('img-placeholder'); existing.alt = 'No image'; }
      clearBtn.style.display = 'none';
    }
  }

  async function uploadFile(file) {
    uploading.style.display = '';
    dropZone.querySelector('.img-drop-label').style.display = 'none';
    try {
      const token = await getAuthToken();
      if (!token) { alert('Not authenticated'); return; }
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/upload.php', { method: 'POST', body: form, headers: { 'Authorization': 'Bearer ' + token } });
      const json = await res.json();
      if (json.url) { setUrl(json.url); }
      else { alert(json.error || 'Upload failed'); }
    } catch (e) {
      console.error('Upload error:', e);
      alert('Upload failed');
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
  });

  // File picker
  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (file) uploadFile(file);
  });

  // URL text input
  urlText.addEventListener('change', () => setUrl(urlText.value));

  // Clear
  if (clearBtn) clearBtn.addEventListener('click', () => setUrl(''));

  // Gallery button
  const galleryBtn = wrapper.querySelector('.img-gallery-btn');
  if (galleryBtn) {
    galleryBtn.addEventListener('click', () => {
      // Set global callback for gallery selection
      window._galleryCallback = (url) => setUrl(url);
      document.getElementById('gallery-modal').style.display = '';
      document.getElementById('gallery-modal').dispatchEvent(new Event('open'));
    });
  }

  return wrapper;
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
  }

  return group;
}

function toArr(val) {
  if (Array.isArray(val)) return val;
  if (val && typeof val === 'object') return Object.values(val);
  return [];
}

// ── Shared renderers ──

function renderLabelHref(group, obj) {
  const row = el('div', 'card-row');
  row.innerHTML = `<input type="text" class="lh-label" value="${esc(obj.label || '')}" placeholder="Label"><input type="text" class="lh-href" value="${esc(obj.href || '')}" placeholder="URL / href">`;
  group.appendChild(row);
}

function renderStats(group, sectionKey, arrayKey, items, ctx) {
  const container = el('div', 'repeatable-container');
  items.forEach((s, i) => {
    const row = el('div', 'card-row');
    row.innerHTML = `<input type="text" class="rep-value" value="${esc(s.value)}" placeholder="Value (e.g. 50%)"><input type="text" class="rep-label" value="${esc(s.label)}" placeholder="Label"><button class="bullet-remove" data-idx="${i}">&times;</button>`;
    container.appendChild(row);
  });
  addButton(group, container, '+ Add stat', () => {
    ctx.data[sectionKey][arrayKey].push({ value: '', label: '' });
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
  group.appendChild(container);
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
  group.appendChild(container);
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
  group.appendChild(container);
  attachRemove(container, ctx, sectionKey, arrayKey);
}

function renderTestimonialCards(group, sectionKey, arrayKey, cards, ctx) {
  const container = el('div', 'repeatable-container');
  cards.forEach((c, i) => {
    const card = el('div', 'nested-card');
    card.innerHTML = `<div class="card-row"><input type="text" class="tc-name" value="${esc(c.name || '')}" placeholder="Name"><input type="text" class="tc-role" value="${esc(c.role || '')}" placeholder="Role"><button class="bullet-remove" data-idx="${i}">&times;</button></div><textarea class="tc-text" placeholder="Testimonial quote">${esc(c.text || '')}</textarea><div class="card-row"><input type="text" class="tc-logo" value="${esc(c.logo || '')}" placeholder="Logo path"><input type="text" class="tc-logoAlt" value="${esc(c.logoAlt || '')}" placeholder="Logo alt text"></div>`;
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
    card.innerHTML = `<div class="card-row"><input type="text" class="ec-title" value="${esc(item.title || '')}" placeholder="Title">${variantSelect(item.variant || 'light', 'ec-variant')}<button class="bullet-remove" data-idx="${i}">&times;</button></div><textarea class="ec-text" placeholder="Description">${esc(item.text || '')}</textarea><div class="card-row"><input type="text" class="ec-cta" value="${esc(item.cta || '')}" placeholder="CTA label"></div><div class="field-label" style="margin-top:6px">Bullets</div>${toArr(item.bullets).map((b, bi) => `<div class="card-row"><input type="text" class="ec-bullet" value="${esc(b)}" placeholder="Bullet"><button class="bullet-remove ec-bullet-rm" data-parent="${i}" data-idx="${bi}">&times;</button></div>`).join('')}`;
    // Image upload widget
    const ctaRow = card.querySelectorAll('.card-row')[1];
    ctaRow.parentNode.insertBefore(imageInput(item.image || '', 'ec-image'), ctaRow.nextSibling);
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
    card.innerHTML = `<div class="card-row"><input type="text" class="gc-title" value="${esc(item.title || '')}" placeholder="Title">${variantSelect(item.variant || 'light', 'gc-variant')}<button class="bullet-remove" data-idx="${i}">&times;</button></div><textarea class="gc-text" placeholder="Description">${esc(item.text || '')}</textarea><div class="card-row"><input type="text" class="gc-bestSuited" value="${esc(item.bestSuitedFor || '')}" placeholder="Best suited for"><input type="text" class="gc-cta" value="${esc(item.cta || '')}" placeholder="CTA label"></div><input type="text" class="gc-outcome field-input" value="${esc(item.outcome || '')}" placeholder="Outcome"><div class="field-label" style="margin-top:6px">Bullets</div>${toArr(item.bullets).map((b, bi) => `<div class="card-row"><input type="text" class="gc-bullet" value="${esc(b)}" placeholder="Bullet"><button class="bullet-remove gc-bullet-rm" data-parent="${i}" data-idx="${bi}">&times;</button></div>`).join('')}`;
    // Image upload widget
    card.appendChild(imageInput(item.image || '', 'gc-image'));
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
      ${toArr(s.items).map(item => `<div class="card-row"><input type="text" class="sb-item" value="${esc(item)}" placeholder="Service item"></div>`).join('')}`;
    container.appendChild(card);
  });
  group.appendChild(container);
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
  container.querySelectorAll(':scope > .nested-card > .card-row > .bullet-remove, :scope > .card-row > .bullet-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.idx);
      if (!confirmDeleteDefault(idx, sectionKey, arrayKey)) return;
      ctx.onRerender.readForms();
      const arr = ctx.data[sectionKey]?.[arrayKey] ?? ctx.data[sectionKey];
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
    const body = editorSections.querySelector(`[data-section-key="${sectionKey}"]${nestedKey ? `[data-nested-key="${nestedKey}"]` : ':not([data-nested-key])'}`);
    if (!body) continue;

    const ref = resolveDataRef(data, sectionKey, nestedKey);

    for (const field of cfg.fields) {
      const group = body.querySelector(`[data-field-key="${field.key}"]`);
      if (!group) continue;

      switch (field.type) {
        case 'text': { const input = group.querySelector('input'); if (input) ref[field.key] = input.value; break; }
        case 'textarea': { const qw = group.querySelector('.quill-wrapper'); if (qw) { ref[field.key] = readQuillValue(qw, false); } else { const ta = group.querySelector('textarea'); if (ta) ref[field.key] = ta.value; } break; }
        case 'title': { const inputs = group.querySelectorAll('input'); if (inputs.length >= 2) ref[field.key] = [inputs[0].value, inputs[1].value]; break; }
        case 'label-href': { const l = group.querySelector('.lh-label'); const h = group.querySelector('.lh-href'); if (l && h) ref[field.key] = { label: l.value, href: h.value }; break; }
        case 'stats': { ref[field.key] = Array.from(group.querySelectorAll('.card-row')).map(r => ({ value: r.querySelector('.rep-value')?.value || '', label: r.querySelector('.rep-label')?.value || '' })); break; }
        case 'numbered-cards': { ref.cards = Array.from(group.querySelectorAll('.nested-card')).map(c => ({ number: c.querySelector('.nc-number')?.value || '', title: c.querySelector('.nc-title')?.value || '', body: c.querySelector('.nc-body')?.value || '' })); break; }
        case 'stages': { ref[field.key] = Array.from(group.querySelectorAll('.nested-card')).map(c => ({ heading: c.querySelector('.rep-heading')?.value || '', description: c.querySelector('.rep-description')?.value || '' })); break; }
        case 'columns': { ref.columns = Array.from(group.querySelectorAll('.section-card')).map(card => ({ heading: card.querySelector('.col-heading')?.value || '', bullets: Array.from(card.querySelectorAll('.bullet-row')).map(row => ({ icon: row.querySelector('.icon-input')?.value || null, text: row.querySelector('.bullet-text')?.value || '' })) })); break; }
        case 'heading-body-cards': case 'pill-cards': { ref[field.key] = Array.from(group.querySelectorAll('.nested-card')).map(c => { const obj = { heading: c.querySelector('.hb-heading')?.value || '', body: c.querySelector('.hb-body')?.value || '' }; const pill = c.querySelector('.hb-pill'); if (pill) obj.pill = pill.value; return obj; }); break; }
        case 'string-list': { ref[field.key] = Array.from(group.querySelectorAll('.card-row')).map(r => r.querySelector('.str-item')?.value || ''); break; }
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
      }
    }
  }
}
