import { getAuth } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js';
import { auth } from '../firebase-config.js';
import { attachCharCounter } from './charCounter.js';

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

/* Native date picker. Stores value as YYYY-MM-DD (the ISO format the rebuild
   pipeline expects for datePublished / dateModified). If the incoming value
   is not a valid YYYY-MM-DD, the input renders empty and the editor picks one. */
function dateInput(value) {
  const input = document.createElement('input');
  input.type = 'date';
  input.className = 'field-input field-date';
  input.value = /^\d{4}-\d{2}-\d{2}$/.test(value || '') ? value : '';
  input.style.maxWidth = '200px';
  return input;
}

/* Simple <select> dropdown. Accepts options as either ['a','b'] or [{value,label}]. */
function selectInput(options, current) {
  const sel = document.createElement('select');
  sel.className = 'field-input field-select';
  sel.style.maxWidth = '320px';
  const opts = Array.isArray(options) ? options : [];
  opts.forEach((o) => {
    const opt = document.createElement('option');
    if (typeof o === 'string') {
      opt.value = o;
      opt.textContent = o;
    } else if (o && typeof o === 'object') {
      opt.value = o.value ?? '';
      opt.textContent = o.label ?? o.value ?? '';
    }
    if (opt.value === current) opt.selected = true;
    sel.appendChild(opt);
  });
  return sel;
}

/* Boolean toggle styled as a checkbox. Stored as true/false. */
function toggleInput(value) {
  const wrap = el('label', 'field-toggle');
  wrap.style.cssText = 'display:inline-flex;align-items:center;gap:8px;cursor:pointer;user-select:none;';
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.className = 'field-toggle-input';
  input.checked = value === true || value === 'true' || value === 1;
  input.style.cssText = 'width:18px;height:18px;cursor:pointer;';
  wrap.appendChild(input);
  const lbl = el('span', '');
  lbl.style.cssText = 'font-size:13px;color:#374151;';
  lbl.textContent = input.checked ? 'On' : 'Off';
  input.addEventListener('change', () => { lbl.textContent = input.checked ? 'On' : 'Off'; });
  wrap.appendChild(lbl);
  return wrap;
}

/* Composite postal-address field. Five sub-inputs. Stored as an object. */
function addressInput(value) {
  const wrap = el('div', 'field-address');
  wrap.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:8px;max-width:540px;';
  const v = value && typeof value === 'object' ? value : {};
  const sub = (cls, placeholder, current, span) => {
    const cell = el('div', '');
    if (span) cell.style.gridColumn = '1 / -1';
    const inp = document.createElement('input');
    inp.type = 'text';
    inp.className = `field-input ${cls}`;
    inp.placeholder = placeholder;
    inp.value = current || '';
    cell.appendChild(inp);
    return cell;
  };
  wrap.appendChild(sub('addr-street',  'Street address',           v.street,  true));
  wrap.appendChild(sub('addr-city',    'City',                     v.city,    false));
  wrap.appendChild(sub('addr-region',  'Region / State',           v.region,  false));
  wrap.appendChild(sub('addr-postal',  'Postal code',              v.postal,  false));
  wrap.appendChild(sub('addr-country', 'Country (e.g. United Kingdom)', v.country, false));
  return wrap;
}

/* Hreflang alternates: repeatable rows of {locale, url}. */
function renderHreflangList(group, sectionKey, arrayKey, items, ctx) {
  const list = el('div', 'hreflang-list repeatable-container');
  list.setAttribute('data-reorder-list', '');
  items.forEach((item, idx) => {
    const row = el('div', 'nested-card hreflang-row');
    row.dataset.itemIdx = String(idx);
    row.style.cssText = 'display:grid;grid-template-columns:140px 1fr auto;gap:8px;align-items:center;border:1px solid #e5e7eb;border-radius:6px;padding:6px;margin-bottom:6px;background:#fff;';
    const loc = textInput(item.locale || '', 'en-GB');
    loc.classList.add('hl-locale');
    row.appendChild(loc);
    const url = textInput(item.url || '', 'https://www.panasatech.com/de/');
    url.classList.add('hl-url');
    row.appendChild(url);
    const del = el('button', 'hl-del');
    del.type = 'button';
    del.dataset.idx = String(idx);
    del.innerHTML = '&times;';
    del.setAttribute('aria-label', 'Delete alternate');
    del.style.cssText = 'background:#fee2e2;color:#b91c1c;border:0;border-radius:4px;width:24px;height:24px;cursor:pointer;font-weight:700;';
    row.appendChild(del);
    list.appendChild(row);
  });
  group.appendChild(list);

  list.querySelectorAll('.hl-del').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.idx);
      ctx_readForms();
      const arr = resolveBlocksArray(ctx, sectionKey, arrayKey);
      arr.splice(idx, 1);
      ctx.onRerender();
    });
  });

  const add = el('button', 'add-bullet-btn');
  add.type = 'button';
  add.textContent = '+ Add alternate';
  add.addEventListener('click', () => {
    ctx_readForms();
    const arr = resolveBlocksArray(ctx, sectionKey, arrayKey);
    arr.push({ locale: '', url: '' });
    ctx.onRerender();
  });
  group.appendChild(add);
}

/* FAQPage Q&A pairs. Repeatable rows of {question, answer}. */
function renderFaqPairs(group, sectionKey, arrayKey, items, ctx) {
  const list = el('div', 'faq-pairs-list repeatable-container');
  list.setAttribute('data-reorder-list', '');
  items.forEach((item, idx) => {
    const row = el('div', 'nested-card faq-pair');
    row.dataset.itemIdx = String(idx);
    row.style.cssText = 'border:1px solid #e5e7eb;border-radius:6px;padding:8px;margin-bottom:8px;background:#fff;';

    const head = el('div', '');
    head.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:6px;';
    const num = el('span', '');
    num.style.cssText = 'font-size:12px;font-weight:600;color:#6b7280;';
    num.textContent = `Q${idx + 1}`;
    head.appendChild(num);
    const drag = el('span', '');
    drag.setAttribute('data-reorder-handle', '');
    drag.setAttribute('role', 'button');
    drag.setAttribute('aria-label', 'Drag to reorder');
    drag.tabIndex = 0;
    drag.style.cssText = 'cursor:grab;color:#888;font-size:18px;line-height:1;user-select:none;margin-left:auto;';
    drag.textContent = '⠿';
    head.appendChild(drag);
    const del = el('button', 'faq-del');
    del.type = 'button';
    del.dataset.idx = String(idx);
    del.innerHTML = '&times;';
    del.setAttribute('aria-label', 'Delete FAQ');
    del.style.cssText = 'background:#fee2e2;color:#b91c1c;border:0;border-radius:4px;width:22px;height:22px;cursor:pointer;font-weight:700;';
    head.appendChild(del);
    row.appendChild(head);

    row.appendChild(labelInput('Question', textInput(item.question || ''), 'faq-q'));
    row.appendChild(labelInput('Answer',   plainTextarea(item.answer || ''), 'faq-a'));
    list.appendChild(row);
  });
  group.appendChild(list);

  list.querySelectorAll('.faq-del').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.idx);
      if (!confirm('Delete this FAQ entry?')) return;
      ctx_readForms();
      const arr = resolveBlocksArray(ctx, sectionKey, arrayKey);
      arr.splice(idx, 1);
      ctx.onRerender();
    });
  });

  const add = el('button', 'add-bullet-btn');
  add.type = 'button';
  add.textContent = '+ Add FAQ';
  add.addEventListener('click', () => {
    ctx_readForms();
    const arr = resolveBlocksArray(ctx, sectionKey, arrayKey);
    arr.push({ question: '', answer: '' });
    ctx.onRerender();
  });
  group.appendChild(add);
}

/* Sitemap extras: repeatable {loc, lastmod, priority, changefreq} rows. */
function renderSitemapExtras(group, sectionKey, arrayKey, items, ctx) {
  const list = el('div', 'sitemap-extras-list repeatable-container');
  list.setAttribute('data-reorder-list', '');

  items.forEach((item, idx) => {
    const row = el('div', 'nested-card sitemap-extra');
    row.dataset.itemIdx = String(idx);
    row.style.cssText = 'display:grid;grid-template-columns:2.4fr 1fr 0.7fr 1fr auto;gap:6px;align-items:center;border:1px solid #e5e7eb;border-radius:6px;padding:6px;margin-bottom:6px;background:#fff;';

    const loc = textInput(item.loc || '', 'https://www.panasatech.com/sub/page');
    loc.classList.add('se-loc');
    row.appendChild(loc);

    const lastmod = textInput(item.lastmod || '', 'YYYY-MM-DD');
    lastmod.classList.add('se-lastmod');
    row.appendChild(lastmod);

    const priority = selectInput(['', '0.4', '0.5', '0.6', '0.7', '0.8', '0.9', '1.0'], String(item.priority || ''));
    priority.classList.add('se-priority');
    row.appendChild(priority);

    const changefreq = selectInput(['', 'never', 'yearly', 'monthly', 'weekly', 'daily', 'always'], String(item.changefreq || ''));
    changefreq.classList.add('se-changefreq');
    row.appendChild(changefreq);

    const del = el('button', 'se-del');
    del.type = 'button';
    del.dataset.idx = String(idx);
    del.innerHTML = '&times;';
    del.setAttribute('aria-label', 'Delete URL');
    del.style.cssText = 'background:#fee2e2;color:#b91c1c;border:0;border-radius:4px;width:24px;height:24px;cursor:pointer;font-weight:700;';
    row.appendChild(del);

    list.appendChild(row);
  });
  group.appendChild(list);

  list.querySelectorAll('.se-del').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.idx);
      ctx_readForms();
      const arr = resolveBlocksArray(ctx, sectionKey, arrayKey);
      arr.splice(idx, 1);
      ctx.onRerender();
    });
  });

  const add = el('button', 'add-bullet-btn');
  add.type = 'button';
  add.textContent = '+ Add URL';
  add.addEventListener('click', () => {
    ctx_readForms();
    const arr = resolveBlocksArray(ctx, sectionKey, arrayKey);
    arr.push({ loc: '', lastmod: '', priority: '0.5', changefreq: 'monthly' });
    ctx.onRerender();
  });
  group.appendChild(add);
}

/* Robots.txt rule card. Each rule = { userAgent, allow:[], disallow:[], crawlDelay? }.
   `allow` and `disallow` are textareas, one path per line — the reader splits by newline. */
function renderRobotsRules(group, sectionKey, arrayKey, rules, ctx) {
  const list = el('div', 'robots-rules-list repeatable-container');
  list.setAttribute('data-reorder-list', '');

  rules.forEach((rule, idx) => {
    const card = el('div', 'nested-card robots-rule');
    card.dataset.itemIdx = String(idx);
    card.style.cssText = 'border:1px solid #e5e7eb;border-radius:6px;padding:10px;margin-bottom:10px;background:#fff;';

    const head = el('div', '');
    head.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:8px;';
    const num = el('span', '');
    num.style.cssText = 'font-size:11px;font-weight:700;color:#6b7280;';
    num.textContent = `Rule ${idx + 1}`;
    head.appendChild(num);
    const drag = el('span', '');
    drag.setAttribute('data-reorder-handle', '');
    drag.setAttribute('role', 'button');
    drag.setAttribute('aria-label', 'Drag to reorder');
    drag.tabIndex = 0;
    drag.style.cssText = 'cursor:grab;color:#888;font-size:18px;line-height:1;user-select:none;margin-left:auto;';
    drag.textContent = '⠿';
    head.appendChild(drag);
    const del = el('button', 'rr-del');
    del.type = 'button';
    del.dataset.idx = String(idx);
    del.innerHTML = '&times;';
    del.setAttribute('aria-label', 'Delete rule');
    del.style.cssText = 'background:#fee2e2;color:#b91c1c;border:0;border-radius:4px;width:22px;height:22px;cursor:pointer;font-weight:700;';
    head.appendChild(del);
    card.appendChild(head);

    card.appendChild(labelInput('User-agent', textInput(rule.userAgent || '*', '* (all bots) or e.g. GPTBot'), 'rr-ua'));
    card.appendChild(labelInput('Allow paths — one per line', plainTextarea((rule.allow || []).join('\n'), '/'), 'rr-allow'));
    card.appendChild(labelInput('Disallow paths — one per line', plainTextarea((rule.disallow || []).join('\n'), '/admin\n/api'), 'rr-disallow'));
    card.appendChild(labelInput('Crawl-delay (optional, seconds)', textInput(rule.crawlDelay ? String(rule.crawlDelay) : '', '5'), 'rr-crawl'));

    list.appendChild(card);
  });
  group.appendChild(list);

  list.querySelectorAll('.rr-del').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.idx);
      if (!confirm('Delete this rule?')) return;
      ctx_readForms();
      const arr = resolveBlocksArray(ctx, sectionKey, arrayKey);
      arr.splice(idx, 1);
      ctx.onRerender();
    });
  });

  const add = el('button', 'add-bullet-btn');
  add.type = 'button';
  add.textContent = '+ Add rule';
  add.addEventListener('click', () => {
    ctx_readForms();
    const arr = resolveBlocksArray(ctx, sectionKey, arrayKey);
    arr.push({ userAgent: '*', allow: ['/'], disallow: [], crawlDelay: '' });
    ctx.onRerender();
  });
  group.appendChild(add);
}

/* Read-only preview of the generated robots.txt. The robotsTxt page mounts this
   alongside the rules editor; main.js wires a re-render listener so this updates
   live as rules change. */
function robotsPreview(value) {
  const ta = document.createElement('textarea');
  ta.readOnly = true;
  ta.className = 'field-input field-robots-preview';
  ta.rows = 14;
  ta.spellcheck = false;
  ta.value = value || '# Save and republish — preview will appear here.';
  ta.style.cssText = 'font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;background:#f9fafb;color:#111827;';
  return ta;
}

/* Redirect rule card. Each rule = { from, to, status (301|302|307|308), exact? }. */
function renderRedirectRules(group, sectionKey, arrayKey, rules, ctx) {
  const list = el('div', 'redirect-rules-list repeatable-container');
  list.setAttribute('data-reorder-list', '');

  rules.forEach((rule, idx) => {
    const card = el('div', 'nested-card redirect-rule');
    card.dataset.itemIdx = String(idx);
    card.style.cssText = 'display:grid;grid-template-columns:1fr 1fr 110px 90px auto;gap:8px;align-items:center;border:1px solid #e5e7eb;border-radius:6px;padding:8px;margin-bottom:8px;background:#fff;';

    const fromIn = textInput(rule.from || '', 'From: /old-path');
    fromIn.classList.add('rd-from');
    card.appendChild(fromIn);

    const toIn = textInput(rule.to || '', 'To: /new-path or https://…');
    toIn.classList.add('rd-to');
    card.appendChild(toIn);

    const statusSel = selectInput([
      { value: '301', label: '301 Permanent' },
      { value: '302', label: '302 Temporary' },
      { value: '307', label: '307 Temporary (preserve method)' },
      { value: '308', label: '308 Permanent (preserve method)' },
    ], String(rule.status || '301'));
    statusSel.classList.add('rd-status');
    card.appendChild(statusSel);

    const exactWrap = el('label', '');
    exactWrap.style.cssText = 'display:inline-flex;align-items:center;gap:4px;font-size:12px;';
    const exactCb = document.createElement('input');
    exactCb.type = 'checkbox';
    exactCb.className = 'rd-exact';
    exactCb.checked = rule.exact !== false; // default true
    exactWrap.appendChild(exactCb);
    const exactLbl = el('span', '');
    exactLbl.textContent = 'Exact match';
    exactWrap.appendChild(exactLbl);
    card.appendChild(exactWrap);

    const del = el('button', 'rd-del');
    del.type = 'button';
    del.dataset.idx = String(idx);
    del.innerHTML = '&times;';
    del.setAttribute('aria-label', 'Delete redirect');
    del.style.cssText = 'background:#fee2e2;color:#b91c1c;border:0;border-radius:4px;width:24px;height:24px;cursor:pointer;font-weight:700;';
    card.appendChild(del);

    list.appendChild(card);
  });
  group.appendChild(list);

  list.querySelectorAll('.rd-del').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.idx);
      if (!confirm('Delete this redirect?')) return;
      ctx_readForms();
      const arr = resolveBlocksArray(ctx, sectionKey, arrayKey);
      arr.splice(idx, 1);
      ctx.onRerender();
    });
  });

  const add = el('button', 'add-bullet-btn');
  add.type = 'button';
  add.textContent = '+ Add redirect';
  add.addEventListener('click', () => {
    ctx_readForms();
    const arr = resolveBlocksArray(ctx, sectionKey, arrayKey);
    arr.push({ from: '/', to: '/', status: 301, exact: true });
    ctx.onRerender();
  });
  group.appendChild(add);
}

/* Raw JSON-LD textarea (for advanced editors). Live-validates JSON and shows
   a small inline error indicator when the text doesn't parse. The save reader
   stores the trimmed text — StructuredDataApplier validates again server-side
   and silently drops invalid JSON to avoid breaking the page. */
function jsonLdTextarea(value, field) {
  const wrap = el('div', 'field-jsonld');
  wrap.style.cssText = 'display:flex;flex-direction:column;gap:6px;';

  const ta = document.createElement('textarea');
  ta.className = 'field-input field-jsonld-input';
  ta.rows = 8;
  ta.spellcheck = false;
  ta.value = value || '';
  ta.placeholder = `e.g.
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Panasa Engineering Squad"
}`;
  ta.style.cssText = 'font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px;line-height:1.45;tab-size:2;';
  wrap.appendChild(ta);

  const status = el('div', 'field-jsonld-status');
  status.style.cssText = 'font-size:11px;color:#6b7280;';
  wrap.appendChild(status);

  const validate = () => {
    const v = ta.value.trim();
    if (v === '') {
      status.textContent = 'Empty — no custom JSON-LD will be emitted.';
      status.style.color = '#6b7280';
      ta.style.borderColor = '';
      return;
    }
    try {
      JSON.parse(v);
      status.textContent = '✓ Valid JSON.';
      status.style.color = '#059669';
      ta.style.borderColor = '#10b981';
    } catch (e) {
      status.textContent = '⚠ Invalid JSON — block will be dropped on save: ' + e.message;
      status.style.color = '#b91c1c';
      ta.style.borderColor = '#dc2626';
    }
  };
  validate();
  ta.addEventListener('input', validate);
  return wrap;
}

/* Inline help icon ("?") that surfaces field-level guidance for non-technical
   editors. Hover shows a native title tooltip; click toggles a small expanded
   panel beneath the field label so the text stays visible while editing. */
function renderHelpIcon(text) {
  const wrap = el('span', 'field-help-wrap');
  wrap.style.cssText = 'display:inline-flex;align-items:center;margin-left:6px;vertical-align:middle;';

  const btn = el('button', 'field-help-btn');
  btn.type = 'button';
  btn.setAttribute('aria-label', 'Show help for this field');
  btn.title = text;
  btn.style.cssText = 'background:#e0e7ff;color:#1e40af;border:0;width:18px;height:18px;border-radius:50%;font-size:11px;font-weight:700;cursor:pointer;line-height:1;display:inline-flex;align-items:center;justify-content:center;padding:0;';
  btn.textContent = '?';
  wrap.appendChild(btn);

  const panel = el('div', 'field-help-panel');
  panel.style.cssText = 'display:none;background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;padding:8px 10px;margin:6px 0;font-size:12px;color:#1e3a8a;line-height:1.5;font-weight:400;';
  panel.textContent = text;

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    /* Insert the panel right after the label (which contains this icon). */
    const label = btn.closest('.field-label');
    if (!label) return;
    if (panel.parentNode) {
      panel.remove();
    } else {
      label.insertAdjacentElement('afterend', panel);
    }
  });

  return wrap;
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
  if (field.advancedOnly) group.dataset.advancedOnly = '1';
  if (field.required === true) group.dataset.required = '1';

  const label = el('label', 'field-label');
  label.textContent = field.label;
  if (field.required === true) {
    /* Red asterisk after the label. The renderField output gets aria-hidden
       on this glyph because validation already announces "This field is
       required" via the inline error message. */
    const star = el('span', 'field-required-star');
    star.textContent = ' *';
    star.setAttribute('aria-hidden', 'true');
    label.appendChild(star);
  }
  if (field.advancedOnly) {
    const tag = el('span', 'field-adv-tag');
    tag.style.cssText = 'background:#312e81;color:#fff;font-size:10px;font-weight:600;padding:1px 6px;border-radius:3px;margin-left:6px;letter-spacing:0.4px;';
    tag.textContent = 'ADV';
    label.appendChild(tag);
  }
  if (field.help) label.appendChild(renderHelpIcon(field.help));
  group.appendChild(label);

  const ctx = { data, sectionKey, onRerender };
  /* Track the primary input element for char-counter wiring (text + textarea only). */
  let primaryInputEl = null;

  switch (field.type) {
    case 'text': { const input = textInput(value || ''); group.appendChild(input); primaryInputEl = input; break; }
    case 'date': group.appendChild(dateInput(value || '')); break;
    case 'image': group.appendChild(imageInput(value || '', 'field-image')); break;
    case 'textarea': { const wrap = textArea(value || ''); group.appendChild(wrap); primaryInputEl = wrap; break; }
    case 'select': group.appendChild(selectInput(field.options || [], value || '')); break;
    case 'toggle': group.appendChild(toggleInput(value)); break;
    case 'address': group.appendChild(addressInput(value || {})); break;
    case 'hreflang-list': renderHreflangList(group, sectionKey, field.key, toArr(value), ctx); break;
    case 'faq-pairs': renderFaqPairs(group, sectionKey, field.key, toArr(value), ctx); break;
    case 'json-ld-textarea': group.appendChild(jsonLdTextarea(value || '', field)); break;
    case 'robots-rules': renderRobotsRules(group, sectionKey, field.key, toArr(value), ctx); break;
    case 'robots-preview': group.appendChild(robotsPreview(value || '')); break;
    case 'redirect-rules': renderRedirectRules(group, sectionKey, field.key, toArr(value), ctx); break;
    case 'sitemap-extras': renderSitemapExtras(group, sectionKey, field.key, toArr(value), ctx); break;
    case 'title': group.appendChild(textInput(value?.[0] || '', 'Line 1 (highlighted)')); group.appendChild(textInput(value?.[1] || '', 'Line 2')); break;
    case 'label-href': renderLabelHref(group, value || {}); break;
    case 'stats': renderStats(group, sectionKey, field.key, toArr(value), ctx); break;
    case 'numbered-cards': renderNumberedCards(group, sectionKey, toArr(value), ctx); break;
    case 'stages': renderStages(group, sectionKey, field.key, toArr(value), ctx); break;
    case 'columns': renderColumns(group, sectionKey, field.key, toArr(value), ctx); break;
    case 'heading-body-cards': renderHBCards(group, sectionKey, field.key, toArr(value), ctx); break;
    case 'pill-cards': renderPillCards(group, sectionKey, field.key, toArr(value), ctx); break;
    case 'string-list': renderStringList(group, sectionKey, field.key, toArr(value), ctx); break;
    case 'link-list': renderLinkList(group, sectionKey, field.key, toArr(value), ctx); break;
    case 'image-list': renderImageList(group, sectionKey, field.key, toArr(value), ctx); break;
    case 'cert-single-image': group.appendChild(renderCertSingleImage(value || {})); break;
    case 'service-cards': renderServiceCards(group, sectionKey, field.key, toArr(value), ctx); break;
    case 'why-cards': renderWhyCards(group, sectionKey, field.key, toArr(value), ctx); break;
    case 'case-slides': renderCaseSlides(group, sectionKey, field.key, toArr(value), ctx); break;
    case 'testimonial-cards': renderTestimonialCards(group, sectionKey, field.key, toArr(value), ctx); break;
    case 'engagement-cards': renderEngagementCards(group, sectionKey, field.key, toArr(value), ctx); break;
    case 'growth-cards': renderGrowthCards(group, sectionKey, field.key, toArr(value), ctx); break;
    case 'nav-links': renderNavLinks(group, sectionKey, field.key, toArr(value), ctx); break;
    case 'footer-columns': renderFooterColumns(group, sectionKey, field.key, toArr(value), ctx); break;
    case 'leader-cards': renderLeaderCards(group, sectionKey, field.key, toArr(value), ctx); break;
    case 'faq-items': renderFaqItems(group, sectionKey, field.key, toArr(value), ctx); break;
    case 'knowledge-cards': renderKnowledgeCards(group, sectionKey, field.key, toArr(value), ctx); break;
    case 'home-faq-items': renderHomeFaqItems(group, sectionKey, field.key, toArr(value), ctx); break;
    case 'office-cards': renderOfficeCards(group, sectionKey, field.key, toArr(value), ctx); break;
    case 'job-cards': renderJobCards(group, sectionKey, field.key, toArr(value), ctx); break;
    case 'service-blocks': renderServiceBlocks(group, sectionKey, field.key, toArr(value), ctx); break;
    case 'blocks': renderBlocks(group, sectionKey, field.key, toArr(value), ctx, field.allowedTypes || ['html', 'callout', 'youtube']); break;
    case 'guide-sections': renderGuideSections(group, sectionKey, field.key, toArr(value), ctx); break;
    case 'case-sections': renderCaseSections(group, sectionKey, field.key, toArr(value), ctx); break;
    case 'meta-tiles': renderMetaTiles(group, sectionKey, field.key, toArr(value), ctx); break;
    case 'article-picker': renderArticlePicker(group, field.key, value || {}, ctx); break;
    case 'related-articles': renderRelatedArticles(group, field.key, toArr(value), ctx); break;
  }

  /* Optional character counter — wired only for text + textarea fields whose
     schema declares { charCount: { min, max } }. The counter element renders
     directly under the input and colours green/amber/red against the bounds. */
  if (field.charCount && primaryInputEl) {
    try { attachCharCounter(primaryInputEl, field.charCount); } catch (_) { /* non-critical */ }
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

function renderColumns(group, sectionKey, arrayKey, columns, ctx) {
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
      removeBtn.setAttribute('aria-label', 'Delete bullet');
      removeBtn.addEventListener('click', () => { if (!confirmDeleteDefault(bi, sectionKey, arrayKey)) return; ctx.onRerender.readForms(); ctx.data[sectionKey][arrayKey][ci].bullets.splice(bi, 1); ctx.onRerender(); });
      row.appendChild(removeBtn);
      bulletsDiv.appendChild(row);
    });
    card.appendChild(bulletsDiv);
    const addBulletBtn = el('button', 'add-bullet-btn');
    addBulletBtn.textContent = '+ Add bullet';
    addBulletBtn.addEventListener('click', () => { ctx.onRerender.readForms(); ctx.data[sectionKey][arrayKey][ci].bullets.push({ icon: null, text: '' }); ctx.onRerender(); });
    card.appendChild(addBulletBtn);
    container.appendChild(card);
  });
  container.querySelectorAll('.remove-col-btn').forEach(btn => {
    btn.addEventListener('click', () => { if (!confirmDeleteDefault(Number(btn.dataset.idx), sectionKey, arrayKey)) return; ctx.onRerender.readForms(); ctx.data[sectionKey][arrayKey].splice(Number(btn.dataset.idx), 1); ctx.onRerender(); });
  });
  const addBtn = el('button', 'add-section-btn');
  addBtn.textContent = '+ Add Column';
  addBtn.addEventListener('click', () => { ctx.onRerender.readForms(); ctx.data[sectionKey][arrayKey].push({ heading: '', bullets: [{ icon: null, text: '' }] }); ctx.onRerender(); });
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

// Repeater for {label, href}[] arrays — e.g. footer.legal.links.
function renderLinkList(group, sectionKey, arrayKey, items, ctx) {
  const container = el('div', 'repeatable-container');
  items.forEach((item, i) => {
    const obj = (item && typeof item === 'object') ? item : { label: '', href: '' };
    const row = el('div', 'card-row link-list-row');
    row.innerHTML = `<input type="text" class="ll-label" value="${esc(obj.label || '')}" placeholder="Label (e.g. Privacy Policy)"><input type="text" class="ll-href" value="${esc(obj.href || '')}" placeholder="Link (e.g. privacy-policy)"><button class="bullet-remove" data-idx="${i}">&times;</button>`;
    container.appendChild(row);
  });
  addButton(group, container, '+ Add link', () => {
    // Push into the resolved data ref so it works for nested sections too
    // (e.g. footer.legal.links).
    const ref = resolveDataRef(ctx.data, sectionKey);
    if (!Array.isArray(ref[arrayKey])) ref[arrayKey] = [];
    ref[arrayKey].push({ label: '', href: '' });
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

/* Single {src, alt} image field — non-repeatable. Used for hero.certImage,
   an existing-but-previously-unwired alternate render path in hero.js that
   swaps the cert badge row for one single image when set. Left empty (no
   src), the field reads back as `undefined` so hero.js's `if (data.certImage)`
   check stays falsy and the default certBadges list keeps rendering. */
function renderCertSingleImage(value) {
  const wrap = el('div', 'nested-card cert-single-image');
  const v = value && typeof value === 'object' ? value : {};
  wrap.appendChild(imageInput(v.src || '', 'ci-src'));
  const altRow = el('div', 'card-row');
  altRow.style.marginTop = '6px';
  altRow.innerHTML = `<input type="text" class="ci-alt" value="${esc(v.alt || '')}" placeholder="Alt text">`;
  wrap.appendChild(altRow);
  return wrap;
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
    // Visual type toggle — 'tags' is an existing render path in why.js
    // (renders a chip-tags list instead of an image) that previously had
    // no admin input, so new/edited cards always fell back to 'image'.
    const imgType = c.imageType === 'tags' ? 'tags' : 'image';
    const typeRow = el('div', 'card-row');
    typeRow.style.cssText = 'margin-top:6px;align-items:center;';
    typeRow.innerHTML = `<label style="font-size:12px;color:var(--admin-text-muted,#6b7280);display:inline-flex;align-items:center;gap:6px;">Visual type
      <select class="wc-imageType" style="max-width:160px;padding:6px 8px;">
        <option value="image"${imgType === 'image' ? ' selected' : ''}>Image</option>
        <option value="tags"${imgType === 'tags' ? ' selected' : ''}>Tag chips</option>
      </select>
    </label>`;
    card.appendChild(typeRow);
    card.appendChild(imageInput(c.image || '', 'wc-image'));
    const tagsLabel = el('div', 'field-label');
    tagsLabel.textContent = 'Tag chips (used when Visual type = "Tag chips") — one per line';
    tagsLabel.style.cssText = 'margin-top:8px;font-size:12px;';
    card.appendChild(tagsLabel);
    const tagsTa = document.createElement('textarea');
    tagsTa.className = 'wc-tags field-input';
    tagsTa.rows = 3;
    tagsTa.placeholder = 'Card platforms\nScheme integrations\nAuthorization flows';
    tagsTa.value = toArr(c.tags).join('\n');
    card.appendChild(tagsTa);
    container.appendChild(card);
  });
  addButton(group, container, '+ Add card', () => {
    ctx.data[sectionKey][arrayKey].push({ title: '', text: '', style: 'light', image: '', imageType: 'image', tags: [] });
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
      <div class="card-row"><input type="text" class="cs-date" value="${esc(s.date || '')}" placeholder="Date (e.g. 26 May 2025)"><input type="text" class="cs-readTime" value="${esc(s.readTime || '')}" placeholder="Read time (e.g. 20 Mins Read)"></div>
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
    ctx.data[sectionKey][arrayKey].push({ eyebrow: '', title: '', date: '', readTime: '', text: '', image: '', cta: { label: 'Read Full Case Study', href: 'contact.html' }, metrics: [] });
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
    card.innerHTML = `<div class="card-row"><input type="text" class="ec-title" value="${esc(item.title || '')}" placeholder="Title">${variantSelect(item.variant || 'light', 'ec-variant')}<button class="bullet-remove" data-idx="${i}">&times;</button></div><textarea class="ec-text" placeholder="Description">${esc(item.text || '')}</textarea><div class="card-row"><input type="text" class="ec-bestSuited" value="${esc(item.bestSuitedFor || '')}" placeholder="Best suited for"><input type="text" class="ec-cta" value="${esc(item.cta || '')}" placeholder="CTA label"></div><input type="text" class="ec-outcome field-input" value="${esc(item.outcome || '')}" placeholder="Outcome">`;
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
    r[arrayKey].push({ title: '', text: '', variant: 'light', image: '', bestSuitedFor: '', cta: 'Talk to us', outcome: '', bullets: [] });
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

function renderNavLinks(group, sectionKey, arrayKey, items, ctx) {
  const container = el('div', 'repeatable-container');
  items.forEach((item, i) => {
    const card = el('div', 'nested-card');
    card.innerHTML = `<div class="card-row"><input type="text" class="nl-label" value="${esc(item.label || '')}" placeholder="Label"><input type="text" class="nl-href" value="${esc(item.href || '')}" placeholder="Link (e.g. about)"><button class="bullet-remove" data-idx="${i}">&times;</button></div>`;
    const childrenLabel = el('div', 'field-label');
    childrenLabel.textContent = 'Dropdown links (optional)';
    childrenLabel.style.marginTop = '8px';
    childrenLabel.style.paddingTop = '8px';
    childrenLabel.style.borderTop = '1px solid var(--admin-border)';
    card.appendChild(childrenLabel);
    toArr(item.children).forEach((child, ci) => {
      const row = el('div', 'card-row nl-child-row');
      row.innerHTML = `<input type="text" class="nl-child-label" value="${esc(child.label || '')}" placeholder="Child label"><input type="text" class="nl-child-href" value="${esc(child.href || '')}" placeholder="Child link"><button class="bullet-remove nl-child-rm" data-parent="${i}" data-idx="${ci}">&times;</button>`;
      card.appendChild(row);
    });
    const addChildBtn = el('button', 'add-bullet-btn');
    addChildBtn.textContent = '+ Add dropdown link';
    addChildBtn.addEventListener('click', () => {
      ctx_readForms();
      const r = resolveDataRef(ctx.data, sectionKey);
      const arr = r[arrayKey];
      if (Array.isArray(arr) && arr[i]) { arr[i].children = toArr(arr[i].children); arr[i].children.push({ label: '', href: '' }); }
      ctx.onRerender();
    });
    card.appendChild(addChildBtn);
    container.appendChild(card);
  });
  addButton(group, container, '+ Add nav link', () => {
    ctx.data[sectionKey][arrayKey].push({ label: '', href: '', children: [] });
    ctx.onRerender();
  });
  attachRemove(container, ctx, sectionKey, arrayKey);
  container.querySelectorAll('.nl-child-rm').forEach((btn) => {
    btn.addEventListener('click', () => {
      ctx_readForms();
      const r = resolveDataRef(ctx.data, sectionKey);
      const arr = r[arrayKey];
      if (Array.isArray(arr) && arr[Number(btn.dataset.parent)]) {
        arr[Number(btn.dataset.parent)].children.splice(Number(btn.dataset.idx), 1);
      }
      ctx.onRerender();
    });
  });
}

function renderFooterColumns(group, sectionKey, arrayKey, columns, ctx) {
  const container = el('div', 'repeatable-container');
  columns.forEach((col, i) => {
    const card = el('div', 'nested-card');
    card.innerHTML = `<div class="card-row"><input type="text" class="fc-title" value="${esc(col.title || '')}" placeholder="Column title"><label style="display:inline-flex;align-items:center;gap:4px;font-size:12px;white-space:nowrap;"><input type="checkbox" class="fc-col-visible"${col.visible !== false ? ' checked' : ''}>Visible</label><button class="bullet-remove" data-idx="${i}">&times;</button></div>`;
    const linksLabel = el('div', 'field-label');
    linksLabel.textContent = 'Links';
    linksLabel.style.marginTop = '8px';
    linksLabel.style.paddingTop = '8px';
    linksLabel.style.borderTop = '1px solid var(--admin-border)';
    card.appendChild(linksLabel);
    toArr(col.links).forEach((link, li) => {
      const row = el('div', 'card-row fc-link-row');
      row.innerHTML = `<input type="text" class="fc-link-label" value="${esc(link.label || '')}" placeholder="Label"><input type="text" class="fc-link-href" value="${esc(link.href || '')}" placeholder="Link"><input type="text" class="fc-link-badge-type" value="${esc(link.badge || '')}" placeholder="Badge type (e.g. hiring, new)" style="max-width:130px"><input type="text" class="fc-link-badge" value="${esc(link.badgeText || '')}" placeholder="Badge text (optional)" style="max-width:120px"><label style="display:inline-flex;align-items:center;gap:4px;font-size:12px;white-space:nowrap;"><input type="checkbox" class="fc-link-visible"${link.visible !== false ? ' checked' : ''}>Visible</label><button class="bullet-remove fc-link-rm" data-parent="${i}" data-idx="${li}">&times;</button>`;
      card.appendChild(row);
    });
    const addLinkBtn = el('button', 'add-bullet-btn');
    addLinkBtn.textContent = '+ Add link';
    addLinkBtn.addEventListener('click', () => {
      ctx_readForms();
      const r = resolveDataRef(ctx.data, sectionKey);
      const arr = r[arrayKey];
      if (Array.isArray(arr) && arr[i]) { arr[i].links = toArr(arr[i].links); arr[i].links.push({ label: '', href: '', visible: true }); }
      ctx.onRerender();
    });
    card.appendChild(addLinkBtn);
    container.appendChild(card);
  });
  addButton(group, container, '+ Add column', () => {
    ctx.data[sectionKey][arrayKey].push({ title: '', visible: true, links: [] });
    ctx.onRerender();
  });
  attachRemove(container, ctx, sectionKey, arrayKey);
  container.querySelectorAll('.fc-link-rm').forEach((btn) => {
    btn.addEventListener('click', () => {
      ctx_readForms();
      const r = resolveDataRef(ctx.data, sectionKey);
      const arr = r[arrayKey];
      if (Array.isArray(arr) && arr[Number(btn.dataset.parent)]) {
        arr[Number(btn.dataset.parent)].links.splice(Number(btn.dataset.idx), 1);
      }
      ctx.onRerender();
    });
  });
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

function renderKnowledgeCards(group, sectionKey, arrayKey, cards, ctx) {
  const container = el('div', 'repeatable-container');
  cards.forEach((c, i) => {
    const card = el('div', 'nested-card');
    card.innerHTML = `
      <div class="card-row"><input type="text" class="kc-category" value="${esc(c.category || '')}" placeholder="Category (e.g. Blog, Guide, Insights)"><button class="bullet-remove" data-idx="${i}">&times;</button></div>
      <input type="text" class="kc-title field-input" value="${esc(c.title || '')}" placeholder="Title">
      <div class="card-row"><input type="text" class="kc-date" value="${esc(c.date || '')}" placeholder="Date (e.g. 16 APR 2026)"><input type="text" class="kc-href" value="${esc(c.href || '')}" placeholder="Link (e.g. blog/anatomy-of-a-swipe)"></div>`;
    card.appendChild(imageInput(c.image || '', 'kc-image'));
    container.appendChild(card);
  });
  addButton(group, container, '+ Add card', () => {
    ctx.data[sectionKey][arrayKey].push({ category: '', title: '', date: '', image: '', href: '' });
    ctx.onRerender();
  });
  attachRemove(container, ctx, sectionKey, arrayKey);
}

function renderHomeFaqItems(group, sectionKey, arrayKey, items, ctx) {
  const container = el('div', 'repeatable-container');
  items.forEach((f, i) => {
    const card = el('div', 'nested-card');
    card.innerHTML = `
      <div class="card-row"><input type="text" class="hfq-q" value="${esc(f.q || '')}" placeholder="Question"><button class="bullet-remove" data-idx="${i}">&times;</button></div>
      <textarea class="hfq-a" placeholder="Answer">${esc(f.a || '')}</textarea>`;
    container.appendChild(card);
  });
  addButton(group, container, '+ Add FAQ', () => {
    ctx.data[sectionKey][arrayKey].push({ q: '', a: '' });
    ctx.onRerender();
  });
  attachRemove(container, ctx, sectionKey, arrayKey);
}

// ── Contact, Careers, Services Overview specific ──

function renderOfficeCards(group, sectionKey, arrayKey, items, ctx) {
  const container = el('div', 'repeatable-container');
  items.forEach((o, i) => {
    const card = el('div', 'nested-card');
    card.innerHTML = `<div class="card-row"><input type="text" class="oc-country" value="${esc(o.country || '')}" placeholder="Country"><button class="bullet-remove" data-idx="${i}">&times;</button></div><textarea class="oc-address" placeholder="Address (use a new line to separate the street and city/postcode lines)">${esc(o.address || '')}</textarea>`;
    const photoLabel = el('div', 'field-label');
    photoLabel.textContent = 'Office photo (optional)';
    photoLabel.style.fontSize = '12px';
    photoLabel.style.marginTop = '4px';
    card.appendChild(photoLabel);
    card.appendChild(imageInput(o.photo || '', 'oc-photo'));
    container.appendChild(card);
  });
  addButton(group, container, '+ Add office', () => {
    ctx.data[sectionKey][arrayKey].push({ country: '', address: '', photo: '' });
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
  upBtn.setAttribute('aria-label', 'Move block up');
  upBtn.disabled = idx === 0;
  upBtn.style.cssText = 'background:none;border:1px solid #ddd;border-radius:4px;width:26px;height:26px;cursor:pointer;font-size:13px;color:#374151;line-height:1;padding:0;';
  upBtn.innerHTML = '&#9650;';
  header.appendChild(upBtn);

  const downBtn = el('button', 'block-move-down');
  downBtn.type = 'button';
  downBtn.dataset.idx = String(idx);
  downBtn.title = 'Move down';
  downBtn.setAttribute('aria-label', 'Move block down');
  downBtn.disabled = total != null && idx >= total - 1;
  downBtn.style.cssText = 'background:none;border:1px solid #ddd;border-radius:4px;width:26px;height:26px;cursor:pointer;font-size:13px;color:#374151;line-height:1;padding:0;';
  downBtn.innerHTML = '&#9660;';
  header.appendChild(downBtn);

  const drag = el('span', 'block-drag-handle');
  drag.setAttribute('data-reorder-handle', '');
  drag.setAttribute('role', 'button');
  drag.setAttribute('aria-label', 'Drag to reorder');
  drag.tabIndex = 0;
  drag.title = 'Drag to reorder';
  drag.style.cssText = 'cursor:grab;color:#888;font-size:18px;line-height:1;user-select:none;padding:0 4px;';
  drag.textContent = '⠿';
  header.appendChild(drag);

  const del = el('button', 'bullet-remove block-delete');
  del.type = 'button';
  del.dataset.idx = String(idx);
  del.innerHTML = '&times;';
  del.setAttribute('aria-label', 'Delete block');
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
  /* `_root` sentinel: the section was authored with parentKey:'_root', meaning
     the field writes directly to data root. Match readAllForms which also
     treats '_root' as data itself. Returning ctx.data[arrayKey] keeps Add
     buttons + re-render in sync (both read/write the same root path). */
  if (sectionKey === '_root') {
    if (!Array.isArray(ctx.data[arrayKey])) ctx.data[arrayKey] = [];
    return ctx.data[arrayKey];
  }
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
    drag.setAttribute('role', 'button');
    drag.setAttribute('aria-label', 'Drag to reorder');
    drag.tabIndex = 0;
    drag.style.cssText = 'cursor:grab;color:#888;font-size:18px;line-height:1;user-select:none;margin-left:auto;';
    drag.textContent = '⠿';
    header.appendChild(drag);
    const del = el('button', 'bullet-remove gs-delete');
    del.type = 'button';
    del.dataset.idx = String(i);
    del.innerHTML = '&times;';
    del.setAttribute('aria-label', 'Delete section');
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

/* ═══════════════════════════════════════════════
   case-sections — typed section list for Case Study articles.
   Section types: overview, cardGrid, pillarGrid, callout, approach,
   techStack, impactGrid, differentiators, conclusion.
   ═══════════════════════════════════════════════ */

const CASE_SECTION_TYPES = [
  'overview', 'cardGrid', 'pillarGrid', 'callout',
  'approach', 'techStack', 'impactGrid', 'differentiators', 'conclusion',
];

const CASE_SECTION_LABELS = {
  overview:        'Overview',
  cardGrid:        'Card Grid',
  pillarGrid:      'Pillar Grid',
  callout:         'Callout',
  approach:        'Approach',
  techStack:       'Tech Stack',
  impactGrid:      'Impact Grid',
  differentiators: 'Differentiators',
  conclusion:      'Conclusion',
};

const CASE_SECTION_BADGE = {
  overview:        '#0ea5e9',
  cardGrid:        '#0284c7',
  pillarGrid:      '#0369a1',
  callout:         '#16a34a',
  approach:        '#7c3aed',
  techStack:       '#475569',
  impactGrid:      '#dc2626',
  differentiators: '#d97706',
  conclusion:      '#1f2937',
};

const CASE_CALLOUT_VARIANTS = [
  { value: 'mint',   label: 'Mint (with optional CTA)' },
  { value: 'salmon', label: 'Salmon (no CTA)' },
];

const CASE_CALLOUT_CTA_VARIANTS = [
  { value: 'dark',  label: 'Dark (filled)' },
  { value: 'ghost', label: 'Ghost (outline)' },
];

const CASE_APPROACH_RENDER_MODES = [
  { value: 'steps', label: 'Steps (numbered horizontal strip)' },
  { value: 'bento', label: 'Bento (mixed-media grid)' },
];

const BENTO_KINDS = [
  { value: 'image', label: 'Image' },
  { value: 'stat',  label: 'Stat' },
];

function newCaseSection(type) {
  switch (type) {
    case 'overview':        return { type, title: 'Overview', body: '' };
    case 'conclusion':      return { type, title: 'Conclusion', body: '' };
    case 'cardGrid':        return { type, title: '', summary: '', items: [] };
    case 'pillarGrid':      return { type, title: '', summary: '', items: [] };
    case 'callout':         return { type, variant: 'mint', title: '', text: '', cta: { label: '', href: '../contact', variant: 'dark' } };
    case 'approach':        return { type, title: '', renderMode: 'steps', cardEyebrow: '', cardSummary: '', steps: [], bento: [] };
    case 'techStack':       return { type, title: '', groups: [] };
    case 'impactGrid':      return { type, title: '', summary: '', items: [] };
    case 'differentiators': return { type, title: '', summary: '', tiles: [] };
    default:                return { type };
  }
}

function newBentoTile(kind = 'image') {
  if (kind === 'stat') return { kind: 'stat', eyebrow: '', title: '', metric: '', label: '' };
  return { kind, src: '', alt: '', title: '', caption: '' };
}

/* Resolve the case-sections array from the data tree. The case-sections field
   always lives at data[sectionKey][arrayKey] OR data[sectionKey] when sectionKey===arrayKey
   (matching how guide-sections / blocks resolve). */
function resolveCaseSectionsArray(ctx, sectionKey, arrayKey) {
  return resolveBlocksArray(ctx, sectionKey, arrayKey);
}

/* ── Per-type body renderers ── */

function csHeading(text) {
  const h = el('div', 'field-label');
  h.style.cssText = 'margin-top:8px;font-weight:600;font-size:12px;color:#374151;';
  h.textContent = text;
  return h;
}

/* overview / conclusion: title + Quill body */
function renderCaseProseBody(body, section) {
  body.appendChild(labelInput('Title', textInput(section.title || '', 'Section title'), 'cs-title'));
  body.appendChild(csHeading('Body (rich text — sanitised on render)'));
  const ta = textArea(section.body || '');
  ta.classList.add('cs-body-quill');
  body.appendChild(ta);
}

/* repeatable item-row helper used by cardGrid / pillarGrid / impactGrid items
   and also by techStack groups + tech-group logos. Each row is a `.nested-card`
   so the existing dragReorder utility picks it up automatically. */
function renderCaseItemRows(host, items, fields, addLabel, onAddItem, onDeleteItem) {
  const list = el('div', 'cs-item-list repeatable-container');
  list.setAttribute('data-reorder-list', '');

  items.forEach((item, idx) => {
    const row = el('div', 'nested-card cs-item');
    row.dataset.itemIdx = String(idx);
    row.style.cssText = 'border:1px solid #e5e7eb;border-radius:6px;padding:8px;margin-bottom:8px;background:#fff;';

    const head = el('div', '');
    head.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:6px;';
    const pos = el('span', '');
    pos.style.cssText = 'font-size:12px;color:#6b7280;font-weight:600;';
    pos.textContent = `${idx + 1}`;
    head.appendChild(pos);
    const drag = el('span', '');
    drag.setAttribute('data-reorder-handle', '');
    drag.setAttribute('role', 'button');
    drag.setAttribute('aria-label', 'Drag to reorder');
    drag.tabIndex = 0;
    drag.style.cssText = 'cursor:grab;color:#888;font-size:18px;line-height:1;user-select:none;margin-left:auto;';
    drag.textContent = '⠿';
    head.appendChild(drag);
    const del = el('button', 'cs-item-del');
    del.type = 'button';
    del.dataset.idx = String(idx);
    del.innerHTML = '&times;';
    del.setAttribute('aria-label', 'Delete item');
    del.style.cssText = 'background:#fee2e2;color:#b91c1c;border:0;border-radius:4px;width:22px;height:22px;cursor:pointer;font-weight:700;';
    head.appendChild(del);
    row.appendChild(head);

    fields(row, item, idx);
    list.appendChild(row);
  });
  host.appendChild(list);

  list.querySelectorAll('.cs-item-del').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.idx);
      if (!confirm('Delete this item?')) return;
      onDeleteItem(idx);
    });
  });

  const addBtn = el('button', 'add-bullet-btn');
  addBtn.type = 'button';
  addBtn.textContent = addLabel;
  addBtn.addEventListener('click', () => onAddItem());
  host.appendChild(addBtn);
}

/* cardGrid: title, summary, items[] of {icon (image), title, body} */
function renderCaseCardGridBody(body, section, sectionIdx, ctx, sectionKey, arrayKey) {
  body.appendChild(labelInput('Title', textInput(section.title || ''), 'cs-title'));
  body.appendChild(labelInput('Summary', plainTextarea(section.summary || ''), 'cs-summary'));
  body.appendChild(csHeading('Cards'));

  const items = Array.isArray(section.items) ? section.items : [];
  renderCaseItemRows(body, items, (row, item) => {
    const iconWrap = el('div', '');
    iconWrap.style.cssText = 'margin:6px 0;';
    const iconLbl = el('div', 'field-label');
    iconLbl.style.cssText = 'font-size:12px;margin-bottom:2px;';
    iconLbl.textContent = 'Icon';
    iconWrap.appendChild(iconLbl);
    const ic = imageInput(item.icon || '', 'cs-cg-icon');
    iconWrap.appendChild(ic);
    row.appendChild(iconWrap);

    row.appendChild(labelInput('Title', textInput(item.title || ''), 'cs-cg-title'));
    row.appendChild(labelInput('Body', plainTextarea(item.body || ''), 'cs-cg-body'));
  }, '+ Add Card', () => {
    ctx_readForms();
    const arr = resolveCaseSectionsArray(ctx, sectionKey, arrayKey);
    if (!Array.isArray(arr[sectionIdx].items)) arr[sectionIdx].items = [];
    arr[sectionIdx].items.push({ icon: '', title: '', body: '' });
    ctx.onRerender();
  }, (idx) => {
    ctx_readForms();
    const arr = resolveCaseSectionsArray(ctx, sectionKey, arrayKey);
    arr[sectionIdx].items.splice(idx, 1);
    ctx.onRerender();
  });
}

/* pillarGrid: title, summary, items[] of {label, title, body} */
function renderCasePillarGridBody(body, section, sectionIdx, ctx, sectionKey, arrayKey) {
  body.appendChild(labelInput('Title', textInput(section.title || ''), 'cs-title'));
  body.appendChild(labelInput('Summary', plainTextarea(section.summary || ''), 'cs-summary'));
  body.appendChild(csHeading('Pillars'));

  const items = Array.isArray(section.items) ? section.items : [];
  renderCaseItemRows(body, items, (row, item, idx) => {
    const placeholder = `PILLAR ${String(idx + 1).padStart(2, '0')}`;
    row.appendChild(labelInput('Label (blank → auto)', textInput(item.label || '', placeholder), 'cs-pg-label'));
    row.appendChild(labelInput('Title', textInput(item.title || ''), 'cs-pg-title'));
    row.appendChild(labelInput('Body', plainTextarea(item.body || ''), 'cs-pg-body'));
  }, '+ Add Pillar', () => {
    ctx_readForms();
    const arr = resolveCaseSectionsArray(ctx, sectionKey, arrayKey);
    if (!Array.isArray(arr[sectionIdx].items)) arr[sectionIdx].items = [];
    arr[sectionIdx].items.push({ label: '', title: '', body: '' });
    ctx.onRerender();
  }, (idx) => {
    ctx_readForms();
    const arr = resolveCaseSectionsArray(ctx, sectionKey, arrayKey);
    arr[sectionIdx].items.splice(idx, 1);
    ctx.onRerender();
  });
}

/* callout: variant (mint|salmon), title, text, cta.{label,href,variant}.
   Salmon hides the CTA fields (renderer drops them). Toggling variant back
   to mint re-shows them with their previous values preserved. */
function renderCaseCalloutBody(body, section, sectionIdx, ctx, sectionKey, arrayKey) {
  const variantSel = labelSelect('Variant', CASE_CALLOUT_VARIANTS, section.variant || 'mint', 'cs-cl-variant');
  body.appendChild(variantSel);
  body.appendChild(labelInput('Title', textInput(section.title || ''), 'cs-cl-title'));
  body.appendChild(labelInput('Text (optional)', plainTextarea(section.text || ''), 'cs-cl-text'));

  const ctaWrap = el('div', 'cs-cl-cta-wrap');
  ctaWrap.style.cssText = 'border-top:1px dashed #e5e7eb;margin-top:8px;padding-top:8px;';
  ctaWrap.appendChild(csHeading('CTA (mint variant only — salmon drops the button)'));
  const cta = section.cta || {};
  ctaWrap.appendChild(labelInput('CTA label', textInput(cta.label || ''), 'cs-cl-cta-label'));
  ctaWrap.appendChild(renderHrefSelect('CTA href', cta.href || '../contact', 'cs-cl-cta-href'));
  ctaWrap.appendChild(labelSelect('CTA variant', CASE_CALLOUT_CTA_VARIANTS, cta.variant || 'dark', 'cs-cl-cta-variant'));
  body.appendChild(ctaWrap);

  const applyVariantVisibility = () => {
    const sel = variantSel.querySelector('select');
    ctaWrap.style.display = sel && sel.value === 'salmon' ? 'none' : '';
  };
  applyVariantVisibility();
  variantSel.querySelector('select')?.addEventListener('change', applyVariantVisibility);
}

/* approach: title, renderMode (steps|bento), cardEyebrow, cardSummary,
   steps[] of {index,title,body}, bento[] of bento tiles (max 5).
   Both editors always rendered so toggling renderMode preserves data. */
function renderCaseApproachBody(body, section, sectionIdx, ctx, sectionKey, arrayKey) {
  body.appendChild(labelInput('Title', textInput(section.title || ''), 'cs-title'));
  body.appendChild(labelSelect('Render mode', CASE_APPROACH_RENDER_MODES, section.renderMode || 'steps', 'cs-ap-mode'));
  body.appendChild(labelInput('Card eyebrow (steps mode)', textInput(section.cardEyebrow || ''), 'cs-ap-eyebrow'));
  body.appendChild(labelInput('Card summary (steps mode)', plainTextarea(section.cardSummary || ''), 'cs-ap-summary'));

  /* Steps editor */
  const stepsHost = el('div', 'cs-ap-steps-host');
  stepsHost.style.cssText = 'border:1px dashed #d1d5db;border-radius:6px;padding:8px;margin-top:8px;';
  stepsHost.appendChild(csHeading('Steps (renderMode = steps)'));
  const steps = Array.isArray(section.steps) ? section.steps : [];
  renderCaseItemRows(stepsHost, steps, (row, step) => {
    row.appendChild(labelInput('Index', textInput(step.index || ''), 'cs-ap-step-index'));
    row.appendChild(labelInput('Title', textInput(step.title || ''), 'cs-ap-step-title'));
    row.appendChild(labelInput('Body', plainTextarea(step.body || ''), 'cs-ap-step-body'));
  }, '+ Add Step', () => {
    ctx_readForms();
    const arr = resolveCaseSectionsArray(ctx, sectionKey, arrayKey);
    if (!Array.isArray(arr[sectionIdx].steps)) arr[sectionIdx].steps = [];
    const n = arr[sectionIdx].steps.length + 1;
    arr[sectionIdx].steps.push({ index: String(n).padStart(2, '0'), title: '', body: '' });
    ctx.onRerender();
  }, (idx) => {
    ctx_readForms();
    const arr = resolveCaseSectionsArray(ctx, sectionKey, arrayKey);
    arr[sectionIdx].steps.splice(idx, 1);
    ctx.onRerender();
  });
  body.appendChild(stepsHost);

  /* Bento editor (capped at 5) */
  const bentoHost = el('div', 'cs-ap-bento-host');
  bentoHost.style.cssText = 'border:1px dashed #d1d5db;border-radius:6px;padding:8px;margin-top:8px;';
  bentoHost.appendChild(csHeading('Bento tiles (renderMode = bento, max 5)'));
  renderBentoTilesEditor(bentoHost, section.bento || [], 'bento', sectionIdx, ctx, sectionKey, arrayKey);
  body.appendChild(bentoHost);
}

/* techStack: title, groups[] of {label, logos[] of {src,alt}} */
function renderCaseTechStackBody(body, section, sectionIdx, ctx, sectionKey, arrayKey) {
  body.appendChild(labelInput('Title', textInput(section.title || ''), 'cs-title'));
  body.appendChild(csHeading('Groups'));

  const groups = Array.isArray(section.groups) ? section.groups : [];
  renderCaseItemRows(body, groups, (row, group, gIdx) => {
    row.appendChild(labelInput('Label', textInput(group.label || ''), 'cs-ts-group-label'));
    const logosHost = el('div', '');
    logosHost.style.cssText = 'margin-top:6px;padding-left:8px;border-left:2px solid #e5e7eb;';
    const logosLbl = el('div', 'field-label');
    logosLbl.style.cssText = 'font-size:12px;color:#374151;margin-bottom:4px;';
    logosLbl.textContent = 'Logos';
    logosHost.appendChild(logosLbl);

    const logos = Array.isArray(group.logos) ? group.logos : [];
    const logosList = el('div', 'cs-ts-logos-list repeatable-container');
    logosList.setAttribute('data-reorder-list', '');
    logos.forEach((logo, lIdx) => {
      const lrow = el('div', 'nested-card cs-ts-logo');
      lrow.dataset.itemIdx = String(lIdx);
      lrow.style.cssText = 'border:1px solid #f3f4f6;border-radius:4px;padding:6px;margin-bottom:6px;background:#fafbfc;display:grid;grid-template-columns:1fr 1fr auto;gap:6px;align-items:center;';
      const srcWrap = el('div', '');
      srcWrap.appendChild(imageInput(logo.src || '', 'cs-ts-logo-src'));
      lrow.appendChild(srcWrap);
      const altIn = textInput(logo.alt || '', 'Alt');
      altIn.classList.add('cs-ts-logo-alt');
      lrow.appendChild(altIn);
      const ldel = el('button', 'cs-ts-logo-del');
      ldel.type = 'button';
      ldel.dataset.gIdx = String(gIdx);
      ldel.dataset.lIdx = String(lIdx);
      ldel.innerHTML = '&times;';
      ldel.setAttribute('aria-label', 'Delete logo');
      ldel.style.cssText = 'background:#fee2e2;color:#b91c1c;border:0;border-radius:4px;width:24px;height:24px;cursor:pointer;';
      lrow.appendChild(ldel);
      logosList.appendChild(lrow);
    });
    logosHost.appendChild(logosList);

    const addLogo = el('button', 'add-bullet-btn');
    addLogo.type = 'button';
    addLogo.textContent = '+ Add logo';
    addLogo.addEventListener('click', () => {
      ctx_readForms();
      const arr = resolveCaseSectionsArray(ctx, sectionKey, arrayKey);
      if (!Array.isArray(arr[sectionIdx].groups[gIdx].logos)) arr[sectionIdx].groups[gIdx].logos = [];
      arr[sectionIdx].groups[gIdx].logos.push({ src: '', alt: '' });
      ctx.onRerender();
    });
    logosHost.appendChild(addLogo);

    logosList.querySelectorAll('.cs-ts-logo-del').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (!confirm('Delete this logo?')) return;
        ctx_readForms();
        const arr = resolveCaseSectionsArray(ctx, sectionKey, arrayKey);
        const lIdx = Number(btn.dataset.lIdx);
        arr[sectionIdx].groups[gIdx].logos.splice(lIdx, 1);
        ctx.onRerender();
      });
    });

    row.appendChild(logosHost);
  }, '+ Add Group', () => {
    ctx_readForms();
    const arr = resolveCaseSectionsArray(ctx, sectionKey, arrayKey);
    if (!Array.isArray(arr[sectionIdx].groups)) arr[sectionIdx].groups = [];
    arr[sectionIdx].groups.push({ label: '', logos: [] });
    ctx.onRerender();
  }, (idx) => {
    ctx_readForms();
    const arr = resolveCaseSectionsArray(ctx, sectionKey, arrayKey);
    arr[sectionIdx].groups.splice(idx, 1);
    ctx.onRerender();
  });
}

/* impactGrid: title, summary, items[] of {title, metric, label, tag} */
function renderCaseImpactGridBody(body, section, sectionIdx, ctx, sectionKey, arrayKey) {
  body.appendChild(labelInput('Title', textInput(section.title || ''), 'cs-title'));
  body.appendChild(labelInput('Summary', plainTextarea(section.summary || ''), 'cs-summary'));
  body.appendChild(csHeading('Impact items'));

  const items = Array.isArray(section.items) ? section.items : [];
  renderCaseItemRows(body, items, (row, item) => {
    row.appendChild(labelInput('Title', textInput(item.title || ''), 'cs-ig-title'));
    row.appendChild(labelInput('Metric', textInput(item.metric || ''), 'cs-ig-metric'));
    row.appendChild(labelInput('Label', plainTextarea(item.label || ''), 'cs-ig-label'));
    row.appendChild(labelInput('Tag (chip)', textInput(item.tag || ''), 'cs-ig-tag'));
  }, '+ Add Impact', () => {
    ctx_readForms();
    const arr = resolveCaseSectionsArray(ctx, sectionKey, arrayKey);
    if (!Array.isArray(arr[sectionIdx].items)) arr[sectionIdx].items = [];
    arr[sectionIdx].items.push({ title: '', metric: '', label: '', tag: '' });
    ctx.onRerender();
  }, (idx) => {
    ctx_readForms();
    const arr = resolveCaseSectionsArray(ctx, sectionKey, arrayKey);
    arr[sectionIdx].items.splice(idx, 1);
    ctx.onRerender();
  });
}

/* differentiators: title, summary, tiles[] (bento, max 5) */
function renderCaseDifferentiatorsBody(body, section, sectionIdx, ctx, sectionKey, arrayKey) {
  body.appendChild(labelInput('Title', textInput(section.title || ''), 'cs-title'));
  body.appendChild(labelInput('Summary', plainTextarea(section.summary || ''), 'cs-summary'));
  body.appendChild(csHeading('Bento tiles (max 5)'));
  renderBentoTilesEditor(body, section.tiles || [], 'tiles', sectionIdx, ctx, sectionKey, arrayKey);
}

/* Bento tiles editor — used by approach.bento and differentiators.tiles.
   The `arrayName` is either 'bento' or 'tiles' (key on the section object). */
function renderBentoTilesEditor(host, tiles, arrayName, sectionIdx, ctx, sectionKey, arrayKey) {
  const list = el('div', 'cs-bento-list repeatable-container');
  list.setAttribute('data-reorder-list', '');
  list.dataset.bentoArray = arrayName;

  tiles.forEach((tile, idx) => {
    const row = el('div', 'nested-card cs-bento-tile');
    row.dataset.itemIdx = String(idx);
    row.dataset.tileKind = tile.kind || 'image';
    row.style.cssText = 'border:1px solid #e5e7eb;border-radius:6px;padding:8px;margin-bottom:8px;background:#fff;';

    const head = el('div', '');
    head.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:6px;';
    const pos = el('span', '');
    pos.style.cssText = 'font-size:12px;color:#6b7280;font-weight:600;';
    pos.textContent = `${idx + 1} / ${tiles.length}`;
    head.appendChild(pos);
    const drag = el('span', '');
    drag.setAttribute('data-reorder-handle', '');
    drag.setAttribute('role', 'button');
    drag.setAttribute('aria-label', 'Drag to reorder');
    drag.tabIndex = 0;
    drag.style.cssText = 'cursor:grab;color:#888;font-size:18px;line-height:1;user-select:none;margin-left:auto;';
    drag.textContent = '⠿';
    head.appendChild(drag);
    const del = el('button', 'cs-bento-del');
    del.type = 'button';
    del.dataset.idx = String(idx);
    del.innerHTML = '&times;';
    del.setAttribute('aria-label', 'Delete tile');
    del.style.cssText = 'background:#fee2e2;color:#b91c1c;border:0;border-radius:4px;width:22px;height:22px;cursor:pointer;font-weight:700;';
    head.appendChild(del);
    row.appendChild(head);

    const kindSel = labelSelect('Kind', BENTO_KINDS, tile.kind || 'image', 'cs-bento-kind');
    row.appendChild(kindSel);

    /* Image/chart sub-fields. Tile content stacks at the top of the rendered
       card (eyebrow → title → description), with the source image filling the
       bottom of the tile. The legacy `caption` field is kept for backward
       compatibility but new content should use `description`. */
    const imageWrap = el('div', 'cs-bento-image-fields');
    imageWrap.appendChild(labelInput('Eyebrow (small uppercase tag at the top)', textInput(tile.eyebrow || '', 'e.g. UNIFIED MONITORING'), 'cs-bento-img-eyebrow'));
    imageWrap.appendChild(labelInput('Title', textInput(tile.title || '', 'Tile heading'), 'cs-bento-title'));
    imageWrap.appendChild(labelInput('Description', plainTextarea(tile.description || tile.caption || '', 'Short paragraph explaining the tile'), 'cs-bento-desc'));
    const ic = el('div', '');
    ic.style.cssText = 'margin:6px 0;';
    const icLbl = el('div', 'field-label');
    icLbl.style.cssText = 'font-size:12px;margin-bottom:2px;';
    icLbl.textContent = 'Source image (renders at the bottom of the tile)';
    ic.appendChild(icLbl);
    ic.appendChild(imageInput(tile.src || '', 'cs-bento-src'));
    imageWrap.appendChild(ic);
    imageWrap.appendChild(labelInput('Alt text', textInput(tile.alt || ''), 'cs-bento-alt'));
    row.appendChild(imageWrap);

    /* Stat sub-fields */
    const statWrap = el('div', 'cs-bento-stat-fields');
    statWrap.appendChild(labelInput('Eyebrow', textInput(tile.eyebrow || ''), 'cs-bento-eyebrow'));
    statWrap.appendChild(labelInput('Title', textInput(tile.title || ''), 'cs-bento-stat-title'));
    statWrap.appendChild(labelInput('Metric', textInput(tile.metric || ''), 'cs-bento-metric'));
    statWrap.appendChild(labelInput('Label', plainTextarea(tile.label || ''), 'cs-bento-stat-label'));
    row.appendChild(statWrap);

    const applyKindVisibility = () => {
      const sel = kindSel.querySelector('select');
      const k = sel ? sel.value : 'image';
      row.dataset.tileKind = k;
      imageWrap.style.display = k === 'stat' ? 'none' : '';
      statWrap.style.display  = k === 'stat' ? '' : 'none';
    };
    applyKindVisibility();
    kindSel.querySelector('select')?.addEventListener('change', applyKindVisibility);

    list.appendChild(row);
  });
  host.appendChild(list);

  list.querySelectorAll('.cs-bento-del').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.idx);
      if (!confirm('Delete this tile?')) return;
      ctx_readForms();
      const arr = resolveCaseSectionsArray(ctx, sectionKey, arrayKey);
      const target = arr[sectionIdx][arrayName];
      if (Array.isArray(target)) target.splice(idx, 1);
      ctx.onRerender();
    });
  });

  const addRow = el('div', '');
  addRow.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-top:6px;';
  const addLbl = el('span', '');
  addLbl.style.cssText = 'font-size:12px;color:#6b7280;';
  addLbl.textContent = '+ Add tile:';
  addRow.appendChild(addLbl);
  ['image', 'stat'].forEach((k) => {
    const btn = el('button', 'add-bullet-btn');
    btn.type = 'button';
    btn.textContent = k.charAt(0).toUpperCase() + k.slice(1);
    btn.addEventListener('click', () => {
      ctx_readForms();
      const arr = resolveCaseSectionsArray(ctx, sectionKey, arrayKey);
      if (!Array.isArray(arr[sectionIdx][arrayName])) arr[sectionIdx][arrayName] = [];
      if (arr[sectionIdx][arrayName].length >= 5) {
        alert('Bento grid is capped at 5 tiles. Remove one before adding another.');
        return;
      }
      arr[sectionIdx][arrayName].push(newBentoTile(k));
      ctx.onRerender();
    });
    addRow.appendChild(btn);
  });
  host.appendChild(addRow);
}

/* Read a single bento tile back from a `.cs-bento-tile` row. */
function readBentoTile(row) {
  const kind = row.querySelector('.cs-bento-kind')?.value || 'image';
  if (kind === 'stat') {
    return {
      kind: 'stat',
      eyebrow: row.querySelector('.cs-bento-eyebrow')?.value || '',
      title:   row.querySelector('.cs-bento-stat-title')?.value || '',
      metric:  row.querySelector('.cs-bento-metric')?.value || '',
      label:   row.querySelector('.cs-bento-stat-label')?.value || '',
    };
  }
  return {
    kind,
    eyebrow:     row.querySelector('.cs-bento-img-eyebrow')?.value || '',
    title:       row.querySelector('.cs-bento-title')?.value || '',
    description: row.querySelector('.cs-bento-desc')?.value || '',
    src:         row.querySelector('.cs-bento-src')?.value || '',
    alt:         row.querySelector('.cs-bento-alt')?.value || '',
  };
}

/* Read a single case-section card back. */
function readCaseSection(card) {
  const type = card.dataset.sectionType;
  switch (type) {
    case 'overview':
    case 'conclusion': {
      const qw = card.querySelector('.cs-body-quill.quill-wrapper, .cs-body-quill');
      const body = qw ? readQuillValue(qw, false) : '';
      return {
        type,
        title: card.querySelector('.cs-title')?.value || '',
        body,
      };
    }
    case 'cardGrid': {
      const items = Array.from(card.querySelectorAll('.cs-item-list > .cs-item')).map((row) => ({
        icon:  row.querySelector('.cs-cg-icon')?.value || '',
        title: row.querySelector('.cs-cg-title')?.value || '',
        body:  row.querySelector('.cs-cg-body')?.value || '',
      }));
      return {
        type,
        title:   card.querySelector('.cs-title')?.value || '',
        summary: card.querySelector('.cs-summary')?.value || '',
        items,
      };
    }
    case 'pillarGrid': {
      const items = Array.from(card.querySelectorAll('.cs-item-list > .cs-item')).map((row) => ({
        label: row.querySelector('.cs-pg-label')?.value || '',
        title: row.querySelector('.cs-pg-title')?.value || '',
        body:  row.querySelector('.cs-pg-body')?.value || '',
      }));
      return {
        type,
        title:   card.querySelector('.cs-title')?.value || '',
        summary: card.querySelector('.cs-summary')?.value || '',
        items,
      };
    }
    case 'callout': {
      const variant = card.querySelector('.cs-cl-variant')?.value || 'mint';
      const result = {
        type,
        variant,
        title: card.querySelector('.cs-cl-title')?.value || '',
        text:  card.querySelector('.cs-cl-text')?.value || '',
      };
      // Always preserve CTA fields in the data so toggling variant doesn't destroy them.
      const ctaHrefSel = card.querySelector('.cs-cl-cta-href');
      let ctaHref = ctaHrefSel?.value || '';
      if (ctaHref === '__custom__') ctaHref = card.querySelector('.cs-cl-cta-href-custom')?.value?.trim() || '';
      result.cta = {
        label:   card.querySelector('.cs-cl-cta-label')?.value || '',
        href:    ctaHref,
        variant: card.querySelector('.cs-cl-cta-variant')?.value || 'dark',
      };
      return result;
    }
    case 'approach': {
      const stepsHost = card.querySelector('.cs-ap-steps-host');
      const steps = stepsHost
        ? Array.from(stepsHost.querySelectorAll('.cs-item-list > .cs-item')).map((row) => ({
            index: row.querySelector('.cs-ap-step-index')?.value || '',
            title: row.querySelector('.cs-ap-step-title')?.value || '',
            body:  row.querySelector('.cs-ap-step-body')?.value || '',
          }))
        : [];
      const bentoHost = card.querySelector('.cs-ap-bento-host');
      const bento = bentoHost
        ? Array.from(bentoHost.querySelectorAll('.cs-bento-list > .cs-bento-tile')).map(readBentoTile)
        : [];
      return {
        type,
        title:        card.querySelector('.cs-title')?.value || '',
        renderMode:   card.querySelector('.cs-ap-mode')?.value || 'steps',
        cardEyebrow:  card.querySelector('.cs-ap-eyebrow')?.value || '',
        cardSummary:  card.querySelector('.cs-ap-summary')?.value || '',
        steps,
        bento,
      };
    }
    case 'techStack': {
      const groups = Array.from(card.querySelectorAll('.cs-item-list > .cs-item')).map((row) => ({
        label: row.querySelector('.cs-ts-group-label')?.value || '',
        logos: Array.from(row.querySelectorAll('.cs-ts-logos-list > .cs-ts-logo')).map((lrow) => ({
          src: lrow.querySelector('.cs-ts-logo-src')?.value || '',
          alt: lrow.querySelector('.cs-ts-logo-alt')?.value || '',
        })),
      }));
      return {
        type,
        title:  card.querySelector('.cs-title')?.value || '',
        groups,
      };
    }
    case 'impactGrid': {
      const items = Array.from(card.querySelectorAll('.cs-item-list > .cs-item')).map((row) => ({
        title:  row.querySelector('.cs-ig-title')?.value || '',
        metric: row.querySelector('.cs-ig-metric')?.value || '',
        label:  row.querySelector('.cs-ig-label')?.value || '',
        tag:    row.querySelector('.cs-ig-tag')?.value || '',
      }));
      return {
        type,
        title:   card.querySelector('.cs-title')?.value || '',
        summary: card.querySelector('.cs-summary')?.value || '',
        items,
      };
    }
    case 'differentiators': {
      const tiles = Array.from(card.querySelectorAll('.cs-bento-list > .cs-bento-tile')).map(readBentoTile);
      return {
        type,
        title:   card.querySelector('.cs-title')?.value || '',
        summary: card.querySelector('.cs-summary')?.value || '',
        tiles,
      };
    }
    default:
      return { type };
  }
}

function renderCaseSectionCard(section, idx, sectionKey, arrayKey, ctx) {
  const card = el('div', 'case-section-card section-card');
  card.dataset.sectionIdx = String(idx);
  card.dataset.sectionType = section.type;
  card.style.cssText = 'border:1px solid #d1d5db;border-radius:8px;padding:12px;margin-bottom:12px;background:#fafbfc;';

  const header = el('div', 'cs-card-header');
  header.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:8px;';
  const badge = el('span', 'cs-badge');
  const badgeColor = CASE_SECTION_BADGE[section.type] || '#1f2937';
  badge.style.cssText = `background:${badgeColor};color:#fff;padding:3px 8px;border-radius:4px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.4px;`;
  badge.textContent = CASE_SECTION_LABELS[section.type] || section.type;
  header.appendChild(badge);
  const pos = el('span', '');
  pos.style.cssText = 'font-size:12px;color:#6b7280;font-weight:600;margin-left:6px;';
  pos.textContent = `#${idx + 1}`;
  header.appendChild(pos);
  const drag = el('span', '');
  drag.setAttribute('data-reorder-handle', '');
  drag.setAttribute('role', 'button');
  drag.setAttribute('aria-label', 'Drag to reorder');
  drag.tabIndex = 0;
  drag.style.cssText = 'cursor:grab;color:#888;font-size:18px;line-height:1;user-select:none;margin-left:auto;';
  drag.textContent = '⠿';
  header.appendChild(drag);
  const del = el('button', 'cs-section-del');
  del.type = 'button';
  del.dataset.idx = String(idx);
  del.innerHTML = '&times;';
  del.setAttribute('aria-label', 'Delete section');
  del.style.cssText = 'background:#fee2e2;color:#b91c1c;border:0;border-radius:4px;width:24px;height:24px;cursor:pointer;font-weight:700;';
  header.appendChild(del);
  card.appendChild(header);

  const body = el('div', 'cs-card-body');
  switch (section.type) {
    case 'overview':
    case 'conclusion':
      renderCaseProseBody(body, section);
      break;
    case 'cardGrid':
      renderCaseCardGridBody(body, section, idx, ctx, sectionKey, arrayKey);
      break;
    case 'pillarGrid':
      renderCasePillarGridBody(body, section, idx, ctx, sectionKey, arrayKey);
      break;
    case 'callout':
      renderCaseCalloutBody(body, section, idx, ctx, sectionKey, arrayKey);
      break;
    case 'approach':
      renderCaseApproachBody(body, section, idx, ctx, sectionKey, arrayKey);
      break;
    case 'techStack':
      renderCaseTechStackBody(body, section, idx, ctx, sectionKey, arrayKey);
      break;
    case 'impactGrid':
      renderCaseImpactGridBody(body, section, idx, ctx, sectionKey, arrayKey);
      break;
    case 'differentiators':
      renderCaseDifferentiatorsBody(body, section, idx, ctx, sectionKey, arrayKey);
      break;
  }
  card.appendChild(body);
  return card;
}

/* One-line, plain-English description of each section type. Surfaced in the
   "+ Add section" picker modal so non-technical editors know what to pick. */
const CASE_SECTION_DESCRIPTIONS = {
  overview:        'Short intro paragraph at the top. Plain rich text — bold, links, lists supported.',
  cardGrid:        '3–4 icon cards. Used for "Business Challenge" or feature grids.',
  pillarGrid:      '4 numbered pillars labelled PILLAR 01..04 (auto-padded if you leave the label blank).',
  callout:         'Banner with a title + optional body. Mint = green with a CTA button. Salmon = warm, no button (use as a pull-quote).',
  approach:        'Either a numbered horizontal strip OR a bento grid (toggle anytime). Both editors stay in sync so you can switch without losing data.',
  techStack:       'Grouped logo rows. One label per group, multiple logos per row.',
  impactGrid:      'KPI tiles with title + metric + description + tag chip. 1–6 tiles work.',
  differentiators: 'Mixed-media bento grid (1–5 tiles). Mix images and stat cards.',
  conclusion:      'Closing paragraph at the end of the case study.',
};

/* Open a modal that lets the editor pick a section type. Resolves with the
   chosen type or null if the user cancels. */
function openCaseSectionPicker() {
  return new Promise((resolve) => {
    const overlay = el('div', 'cs-picker-overlay');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:100050;display:flex;align-items:center;justify-content:center;padding:24px;';

    const card = el('div', 'cs-picker-card');
    card.style.cssText = 'background:#fff;border-radius:12px;max-width:720px;width:100%;max-height:80vh;overflow:auto;box-shadow:0 20px 50px rgba(0,0,0,0.25);';

    const head = el('div', '');
    head.style.cssText = 'padding:18px 24px;border-bottom:1px solid #e5e7eb;display:flex;align-items:center;gap:12px;';
    const h = el('h3', '');
    h.style.cssText = 'margin:0;font-size:18px;color:#111827;flex:1;';
    h.textContent = 'Add a section';
    head.appendChild(h);
    const closeBtn = el('button', '');
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Close dialog');
    closeBtn.style.cssText = 'background:transparent;border:0;font-size:22px;line-height:1;cursor:pointer;color:#6b7280;padding:0 8px;';
    closeBtn.innerHTML = '&times;';
    closeBtn.title = 'Close';
    head.appendChild(closeBtn);
    card.appendChild(head);

    const sub = el('p', '');
    sub.style.cssText = 'margin:0;padding:12px 24px 0;font-size:13px;color:#6b7280;';
    sub.textContent = 'Pick a section type to insert. You can drag-reorder or delete sections after adding.';
    card.appendChild(sub);

    const grid = el('div', 'cs-picker-grid');
    grid.style.cssText = 'padding:16px 24px 24px;display:grid;grid-template-columns:1fr 1fr;gap:10px;';

    CASE_SECTION_TYPES.forEach((t) => {
      const item = el('button', 'cs-picker-item');
      item.type = 'button';
      item.style.cssText = 'text-align:left;background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:12px;cursor:pointer;display:flex;flex-direction:column;gap:6px;font-family:inherit;transition:border-color 0.15s, box-shadow 0.15s;';
      item.addEventListener('mouseenter', () => {
        item.style.borderColor = CASE_SECTION_BADGE[t] || '#0ea5e9';
        item.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
      });
      item.addEventListener('mouseleave', () => {
        item.style.borderColor = '#e5e7eb';
        item.style.boxShadow = 'none';
      });

      const headRow = el('div', '');
      headRow.style.cssText = 'display:flex;align-items:center;gap:8px;';
      const swatch = el('span', '');
      swatch.style.cssText = `display:inline-block;width:10px;height:10px;border-radius:50%;background:${CASE_SECTION_BADGE[t] || '#1f2937'};flex-shrink:0;`;
      headRow.appendChild(swatch);
      const name = el('strong', '');
      name.style.cssText = 'font-size:14px;color:#111827;';
      name.textContent = CASE_SECTION_LABELS[t];
      headRow.appendChild(name);
      item.appendChild(headRow);

      const desc = el('span', '');
      desc.style.cssText = 'font-size:12px;color:#4b5563;line-height:1.4;';
      desc.textContent = CASE_SECTION_DESCRIPTIONS[t] || '';
      item.appendChild(desc);

      item.addEventListener('click', () => {
        cleanup();
        resolve(t);
      });
      grid.appendChild(item);
    });
    card.appendChild(grid);

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    const cleanup = () => {
      overlay.removeEventListener('click', onOverlayClick);
      closeBtn.removeEventListener('click', onCancel);
      document.removeEventListener('keydown', onKey);
      overlay.remove();
    };
    const onOverlayClick = (e) => { if (e.target === overlay) onCancel(); };
    const onCancel = () => { cleanup(); resolve(null); };
    const onKey = (e) => { if (e.key === 'Escape') onCancel(); };

    overlay.addEventListener('click', onOverlayClick);
    closeBtn.addEventListener('click', onCancel);
    document.addEventListener('keydown', onKey);
  });
}

function renderCaseSections(group, sectionKey, arrayKey, sections, ctx) {
  const container = el('div', 'case-sections-container repeatable-container');
  container.setAttribute('data-reorder-list', '');
  container.dataset.section = sectionKey;
  container.dataset.array = arrayKey;
  sections.forEach((section, i) => {
    if (!section || !section.type) return;
    container.appendChild(renderCaseSectionCard(section, i, sectionKey, arrayKey, ctx));
  });
  group.appendChild(container);

  container.querySelectorAll(':scope > .case-section-card > .cs-card-header > .cs-section-del').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.idx);
      if (!confirm('Delete this section?')) return;
      ctx_readForms();
      const arr = resolveCaseSectionsArray(ctx, sectionKey, arrayKey);
      arr.splice(idx, 1);
      ctx.onRerender();
    });
  });

  /* Empty-state guidance — appears when the editor hasn't added any sections yet. */
  if (!sections.length) {
    const empty = el('div', 'cs-empty-state');
    empty.style.cssText = 'border:1px dashed #d1d5db;border-radius:10px;padding:18px;background:#fffbeb;margin-bottom:8px;';
    const h = el('div', '');
    h.style.cssText = 'font-size:14px;font-weight:600;color:#92400e;margin-bottom:6px;';
    h.textContent = 'No sections yet';
    empty.appendChild(h);
    const p = el('div', '');
    p.style.cssText = 'font-size:13px;color:#78350f;line-height:1.5;margin-bottom:10px;';
    p.innerHTML = 'A typical case study starts with an <strong>Overview</strong>, then a <strong>Card Grid</strong> for the business challenge, then a <strong>Pillar Grid</strong> for your solution. Use the picker below to begin.';
    empty.appendChild(p);
    const quick = el('button', 'add-bullet-btn');
    quick.type = 'button';
    quick.textContent = '+ Add Overview';
    quick.style.cssText = 'background:#16a34a;color:#fff;border:0;padding:8px 14px;border-radius:6px;cursor:pointer;font-weight:600;font-size:13px;';
    quick.addEventListener('click', () => {
      ctx_readForms();
      const arr = resolveCaseSectionsArray(ctx, sectionKey, arrayKey);
      arr.push(newCaseSection('overview'));
      ctx.onRerender();
    });
    empty.appendChild(quick);
    group.appendChild(empty);
  }

  /* Single "+ Add section" button → opens the picker modal. Replaces the
     old wall of 9 buttons. */
  const addRow = el('div', 'cs-add-row');
  addRow.style.cssText = 'display:flex;gap:8px;align-items:center;margin-top:8px;';
  const addBtn = el('button', '');
  addBtn.type = 'button';
  addBtn.style.cssText = 'background:#0ea5e9;color:#fff;border:0;padding:9px 16px;border-radius:6px;cursor:pointer;font-weight:600;font-size:13px;';
  addBtn.textContent = '+ Add section';
  addBtn.title = 'Pick a section type from the modal';
  addBtn.addEventListener('click', async () => {
    const chosen = await openCaseSectionPicker();
    if (!chosen) return;
    ctx_readForms();
    const arr = resolveCaseSectionsArray(ctx, sectionKey, arrayKey);
    arr.push(newCaseSection(chosen));
    ctx.onRerender();
  });
  addRow.appendChild(addBtn);
  const hint = el('span', '');
  hint.style.cssText = 'font-size:12px;color:#6b7280;';
  hint.textContent = sections.length
    ? 'New sections are added at the bottom — use the drag handle to reorder.'
    : 'Or click "+ Add section" to choose a different section type.';
  addRow.appendChild(hint);
  group.appendChild(addRow);
}

/* ═══════════════════════════════════════════════
   meta-tiles — drag-reorder list of {icon, label, value}, capped at 5.
   Used by the Case Study hero strip.
   ═══════════════════════════════════════════════ */

function renderMetaTiles(group, sectionKey, arrayKey, items, ctx) {
  const list = el('div', 'meta-tiles-list repeatable-container');
  list.setAttribute('data-reorder-list', '');
  list.dataset.section = sectionKey;
  list.dataset.array = arrayKey;

  items.forEach((item, idx) => {
    const row = el('div', 'nested-card meta-tile-row');
    row.dataset.itemIdx = String(idx);
    row.style.cssText = 'border:1px solid #e5e7eb;border-radius:6px;padding:8px;margin-bottom:8px;background:#fff;display:grid;grid-template-columns:auto 1fr 1fr 1fr auto;gap:8px;align-items:center;';

    const drag = el('span', '');
    drag.setAttribute('data-reorder-handle', '');
    drag.setAttribute('role', 'button');
    drag.setAttribute('aria-label', 'Drag to reorder');
    drag.tabIndex = 0;
    drag.style.cssText = 'cursor:grab;color:#888;font-size:18px;line-height:1;user-select:none;';
    drag.textContent = '⠿';
    row.appendChild(drag);

    const iconWrap = el('div', '');
    iconWrap.appendChild(imageInput(item.icon || '', 'mt-icon'));
    row.appendChild(iconWrap);

    const lblIn = textInput(item.label || '', 'LABEL');
    lblIn.classList.add('mt-label');
    row.appendChild(lblIn);

    const valIn = textInput(item.value || '', 'Value');
    valIn.classList.add('mt-value');
    row.appendChild(valIn);

    const del = el('button', 'mt-del');
    del.type = 'button';
    del.dataset.idx = String(idx);
    del.innerHTML = '&times;';
    del.setAttribute('aria-label', 'Delete tile');
    del.style.cssText = 'background:#fee2e2;color:#b91c1c;border:0;border-radius:4px;width:24px;height:24px;cursor:pointer;font-weight:700;';
    row.appendChild(del);

    list.appendChild(row);
  });
  group.appendChild(list);

  list.querySelectorAll('.mt-del').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.idx);
      if (!confirm('Delete this meta tile?')) return;
      ctx_readForms();
      const arr = resolveBlocksArray(ctx, sectionKey, arrayKey);
      arr.splice(idx, 1);
      ctx.onRerender();
    });
  });

  const add = el('button', 'add-bullet-btn');
  add.type = 'button';
  add.textContent = '+ Add tile';
  add.addEventListener('click', () => {
    ctx_readForms();
    const arr = resolveBlocksArray(ctx, sectionKey, arrayKey);
    if (arr.length >= 5) {
      alert('Meta tiles strip is capped at 5. Remove one before adding another.');
      return;
    }
    arr.push({ icon: '', label: '', value: '' });
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
        const type = it.href?.startsWith('blog/') ? 'blog' : it.href?.startsWith('insights/') ? 'insights' : it.href?.startsWith('guides/') ? 'guides' : it.href?.startsWith('case-studies/') ? 'case-studies' : '';
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
        case 'date': { const input = group.querySelector('.field-date'); if (input) ref[field.key] = input.value; break; }
        case 'select': { const sel = group.querySelector('.field-select'); if (sel) ref[field.key] = sel.value; break; }
        case 'toggle': { const cb = group.querySelector('.field-toggle-input'); if (cb) ref[field.key] = !!cb.checked; break; }
        case 'address': {
          ref[field.key] = {
            street:  group.querySelector('.addr-street')?.value || '',
            city:    group.querySelector('.addr-city')?.value || '',
            region:  group.querySelector('.addr-region')?.value || '',
            postal:  group.querySelector('.addr-postal')?.value || '',
            country: group.querySelector('.addr-country')?.value || '',
          };
          break;
        }
        case 'hreflang-list': {
          ref[field.key] = Array.from(group.querySelectorAll('.hreflang-row')).map((r) => ({
            locale: r.querySelector('.hl-locale')?.value || '',
            url:    r.querySelector('.hl-url')?.value || '',
          })).filter((e) => e.locale || e.url);
          break;
        }
        case 'faq-pairs': {
          ref[field.key] = Array.from(group.querySelectorAll('.faq-pair')).map((r) => ({
            question: r.querySelector('.faq-q')?.value || '',
            answer:   r.querySelector('.faq-a')?.value || '',
          })).filter((e) => e.question || e.answer);
          break;
        }
        case 'json-ld-textarea': {
          const ta = group.querySelector('.field-jsonld-input');
          ref[field.key] = ta ? ta.value : '';
          break;
        }
        case 'robots-rules': {
          const splitLines = (s) => String(s || '').split('\n').map((l) => l.trim()).filter(Boolean);
          ref[field.key] = Array.from(group.querySelectorAll('.robots-rule')).map((c) => ({
            userAgent: c.querySelector('.rr-ua')?.value?.trim() || '*',
            allow:    splitLines(c.querySelector('.rr-allow')?.value),
            disallow: splitLines(c.querySelector('.rr-disallow')?.value),
            crawlDelay: c.querySelector('.rr-crawl')?.value?.trim() || '',
          }));
          break;
        }
        case 'robots-preview': {
          /* Read-only — never written back. */
          break;
        }
        case 'redirect-rules': {
          ref[field.key] = Array.from(group.querySelectorAll('.redirect-rule')).map((c) => ({
            from:   c.querySelector('.rd-from')?.value?.trim() || '',
            to:     c.querySelector('.rd-to')?.value?.trim() || '',
            status: Number(c.querySelector('.rd-status')?.value || 301),
            exact:  !!c.querySelector('.rd-exact')?.checked,
          })).filter((r) => r.from || r.to);
          break;
        }
        case 'sitemap-extras': {
          ref[field.key] = Array.from(group.querySelectorAll('.sitemap-extra')).map((r) => ({
            loc:        r.querySelector('.se-loc')?.value?.trim() || '',
            lastmod:    r.querySelector('.se-lastmod')?.value?.trim() || '',
            priority:   r.querySelector('.se-priority')?.value || '',
            changefreq: r.querySelector('.se-changefreq')?.value || '',
          })).filter((e) => e.loc);
          break;
        }
        case 'image': { const img = group.querySelector('.field-image'); if (img) ref[field.key] = img.value; break; }
        case 'textarea': { const qw = group.querySelector('.quill-wrapper'); if (qw) { ref[field.key] = readQuillValue(qw, false); } else { const ta = group.querySelector('textarea'); if (ta) ref[field.key] = ta.value; } break; }
        case 'title': { const inputs = group.querySelectorAll('input'); if (inputs.length >= 2) ref[field.key] = [inputs[0].value, inputs[1].value]; break; }
        case 'label-href': { const l = group.querySelector('.lh-label'); const h = group.querySelector('.lh-href'); const ic = group.querySelector('.lh-icon'); if (l && h) { let href = h.value; if (href === '__custom__') href = group.querySelector('.lh-custom-input')?.value?.trim() || ''; const obj = { label: l.value, href }; if (ic && ic.value) obj.icon = ic.value; ref[field.key] = obj; } break; }
        case 'stats': { ref[field.key] = Array.from(group.querySelectorAll('.nested-card')).map(c => ({ value: c.querySelector('.rep-value')?.value || '', label: c.querySelector('.rep-label')?.value || '', icon: c.querySelector('.rep-icon')?.value || '' })); break; }
        case 'numbered-cards': { ref.cards = Array.from(group.querySelectorAll('.nested-card')).map(c => ({ number: c.querySelector('.nc-number')?.value || '', title: c.querySelector('.nc-title')?.value || '', body: c.querySelector('.nc-body')?.value || '' })); break; }
        case 'stages': { ref[field.key] = Array.from(group.querySelectorAll('.nested-card')).map(c => ({ heading: c.querySelector('.rep-heading')?.value || '', description: c.querySelector('.rep-description')?.value || '' })); break; }
        case 'columns': { ref[field.key] = Array.from(group.querySelectorAll('.section-card')).map(card => ({ heading: card.querySelector('.col-heading')?.value || '', bullets: Array.from(card.querySelectorAll('.bullet-row')).map(row => ({ icon: row.querySelector('.icon-input')?.value || null, text: row.querySelector('.bullet-text')?.value || '' })) })); break; }
        case 'heading-body-cards': case 'pill-cards': { ref[field.key] = Array.from(group.querySelectorAll('.nested-card')).map(c => { const obj = { heading: c.querySelector('.hb-heading')?.value || '', body: c.querySelector('.hb-body')?.value || '' }; const pill = c.querySelector('.hb-pill'); if (pill) obj.pill = pill.value; return obj; }); break; }
        case 'string-list': { ref[field.key] = Array.from(group.querySelectorAll('.card-row')).map(r => r.querySelector('.str-item')?.value || ''); break; }
        case 'link-list': { ref[field.key] = Array.from(group.querySelectorAll('.link-list-row')).map(r => ({ label: r.querySelector('.ll-label')?.value || '', href: r.querySelector('.ll-href')?.value || '' })); break; }
        case 'image-list': { ref[field.key] = Array.from(group.querySelectorAll('.image-list-card')).map(c => ({ src: c.querySelector('.il-src')?.value || '', alt: c.querySelector('.il-alt')?.value || '' })); break; }
        case 'cert-single-image': { const src = group.querySelector('.ci-src')?.value || ''; ref[field.key] = src ? { src, alt: group.querySelector('.ci-alt')?.value || '' } : undefined; break; }
        case 'service-cards': { ref[field.key] = Array.from(group.querySelectorAll('.nested-card')).map((c, i) => { const existing = ref[field.key]?.[i] || {}; return { ...existing, eyebrow: c.querySelector('.sc-eyebrow')?.value || '', title: c.querySelector('.sc-title')?.value || '', href: c.querySelector('.sc-href')?.value || '', icon: c.querySelector('.sc-icon')?.value || '', bullets: Array.from(c.querySelectorAll('.sc-bullet')).map(b => b.value) }; }); break; }
        case 'why-cards': { ref[field.key] = Array.from(group.querySelectorAll('.nested-card')).map((c, i) => { const existing = ref[field.key]?.[i] || {}; return { ...existing, title: c.querySelector('.wc-title')?.value || '', text: c.querySelector('.wc-text')?.value || '', style: c.querySelector('.wc-style')?.value || 'light', image: c.querySelector('.wc-image')?.value || '', imageType: c.querySelector('.wc-imageType')?.value || 'image', tags: (c.querySelector('.wc-tags')?.value || '').split('\n').map(t => t.trim()).filter(Boolean) }; }); break; }
        case 'case-slides': { ref[field.key] = Array.from(group.querySelectorAll('.nested-card')).map((c, i) => { const existing = ref[field.key]?.[i] || {}; const mvs = c.querySelectorAll('.cs-metric-value'); const mls = c.querySelectorAll('.cs-metric-label'); return { ...existing, eyebrow: c.querySelector('.cs-eyebrow')?.value || '', title: c.querySelector('.cs-title')?.value || '', date: c.querySelector('.cs-date')?.value || '', readTime: c.querySelector('.cs-readTime')?.value || '', text: c.querySelector('.cs-text')?.value || '', image: c.querySelector('.cs-image')?.value || '', cta: { label: c.querySelector('.cs-cta-label')?.value || '', href: c.querySelector('.cs-cta-href')?.value || '' }, metrics: Array.from(mvs).map((mv, mi) => ({ value: mv.value, label: mls[mi]?.value || '' })) }; }); break; }
        case 'testimonial-cards': { ref[field.key] = Array.from(group.querySelectorAll('.nested-card')).map(c => ({ text: c.querySelector('.tc-text')?.value || '', name: c.querySelector('.tc-name')?.value || '', role: c.querySelector('.tc-role')?.value || '', logo: c.querySelector('.tc-logo')?.value || '', logoAlt: c.querySelector('.tc-logoAlt')?.value || '' })); break; }
        case 'engagement-cards': { ref[field.key] = Array.from(group.querySelectorAll('.nested-card')).map((c, i) => { const existing = ref[field.key]?.[i] || {}; return { ...existing, title: c.querySelector('.ec-title')?.value || '', text: c.querySelector('.ec-text')?.value || '', variant: c.querySelector('.ec-variant')?.value || 'light', image: c.querySelector('.ec-image')?.value || '', bestSuitedFor: c.querySelector('.ec-bestSuited')?.value || '', cta: c.querySelector('.ec-cta')?.value || '', outcome: c.querySelector('.ec-outcome')?.value || '', bullets: Array.from(c.querySelectorAll('.ec-bullet')).map(b => b.value) }; }); break; }
        case 'growth-cards': { ref[field.key] = Array.from(group.querySelectorAll('.nested-card')).map((c, i) => { const existing = ref[field.key]?.[i] || {}; return { ...existing, image: c.querySelector('.gc-image')?.value || '', title: c.querySelector('.gc-title')?.value || '', text: c.querySelector('.gc-text')?.value || '', variant: c.querySelector('.gc-variant')?.value || 'light', bestSuitedFor: c.querySelector('.gc-bestSuited')?.value || '', cta: c.querySelector('.gc-cta')?.value || '', outcome: c.querySelector('.gc-outcome')?.value || '', bullets: Array.from(c.querySelectorAll('.gc-bullet')).map(b => b.value) }; }); break; }
        case 'nav-links': { ref[field.key] = Array.from(group.querySelectorAll('.nested-card')).map(c => ({ label: c.querySelector('.nl-label')?.value || '', href: c.querySelector('.nl-href')?.value || '', children: Array.from(c.querySelectorAll('.nl-child-row')).map(row => ({ label: row.querySelector('.nl-child-label')?.value || '', href: row.querySelector('.nl-child-href')?.value || '' })).filter((ch) => ch.label || ch.href) })); break; }
        case 'footer-columns': { ref[field.key] = Array.from(group.querySelectorAll('.nested-card')).map((c, i) => { const existingCol = ref[field.key]?.[i] || {}; const links = Array.from(c.querySelectorAll('.fc-link-row')).map((row, li) => { const existingLink = (existingCol.links || [])[li] || {}; return { ...existingLink, label: row.querySelector('.fc-link-label')?.value || '', href: row.querySelector('.fc-link-href')?.value || '', badge: row.querySelector('.fc-link-badge-type')?.value || '', badgeText: row.querySelector('.fc-link-badge')?.value || '', visible: row.querySelector('.fc-link-visible')?.checked !== false }; }); return { ...existingCol, title: c.querySelector('.fc-title')?.value || '', visible: c.querySelector('.fc-col-visible')?.checked !== false, links }; }); break; }
        case 'leader-cards': { ref[field.key] = Array.from(group.querySelectorAll('.nested-card')).map(c => ({ name: c.querySelector('.ld-name')?.value || '', role: c.querySelector('.ld-role')?.value || '', bio: c.querySelector('.ld-bio')?.value || '', image: c.querySelector('.ld-image')?.value || '' })); break; }
        case 'faq-items': { ref[field.key] = Array.from(group.querySelectorAll('.nested-card')).map(c => ({ question: c.querySelector('.fq-question')?.value || '', answer: c.querySelector('.fq-answer')?.value || '' })); break; }
        case 'knowledge-cards': { ref[field.key] = Array.from(group.querySelectorAll('.nested-card')).map(c => ({ category: c.querySelector('.kc-category')?.value || '', title: c.querySelector('.kc-title')?.value || '', date: c.querySelector('.kc-date')?.value || '', image: c.querySelector('.kc-image')?.value || '', href: c.querySelector('.kc-href')?.value || '' })); break; }
        case 'home-faq-items': { ref[field.key] = Array.from(group.querySelectorAll('.nested-card')).map(c => ({ q: c.querySelector('.hfq-q')?.value || '', a: c.querySelector('.hfq-a')?.value || '' })); break; }
        case 'office-cards': { ref[field.key] = Array.from(group.querySelectorAll('.nested-card')).map(c => ({ country: c.querySelector('.oc-country')?.value || '', address: c.querySelector('.oc-address')?.value || '', photo: c.querySelector('.oc-photo')?.value || '' })); break; }
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
        case 'case-sections': {
          const container = group.querySelector('.case-sections-container');
          if (container) {
            ref[field.key] = Array.from(container.querySelectorAll(':scope > .case-section-card')).map(readCaseSection);
          }
          break;
        }
        case 'meta-tiles': {
          ref[field.key] = Array.from(group.querySelectorAll('.meta-tile-row')).map((row) => ({
            icon:  row.querySelector('.mt-icon')?.value || '',
            label: row.querySelector('.mt-label')?.value || '',
            value: row.querySelector('.mt-value')?.value || '',
          }));
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
