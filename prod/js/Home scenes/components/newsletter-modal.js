/**
 * Newsletter Modal
 *
 * Site-wide modal for the "Payments Deconstructed" newsletter. One instance
 * is built on first init and reused for every open/close. Any link or button
 * marked with [data-newsletter-trigger], or an anchor whose href is
 * `#newsletter`, opens the modal.
 *
 * Submits to the same Zoho proxy as the rest of the email-capture surfaces
 * so signups land in the same CRM pipeline.
 */

import { createEl } from '../utils/dom.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const SUBMIT_URL = '/api/zoho-email-proxy.php';
const CRM_DESCRIPTION = 'Email capture: Newsletter modal';
const STORAGE_KEY = 'panasa_newsletter_subscribed';
// Resolve CSS + image assets relative to this JS module so the paths are
// stable regardless of where the page that imported us lives (root, /blog/,
// /guides/, etc.). Without this, page-relative strings like
// `'css/newsletter-modal.css'` would 404 on sub-pages and the modal would
// render unstyled / without the envelope graphic.
const CSS_HREF = new URL('../../../css/newsletter-modal.css', import.meta.url).href;
const VISUAL_SRC = new URL('../../../assets/newsletter-visual.webp', import.meta.url).href;

let modalEls = null;        // built lazily on first open
let isOpen = false;
let lastFocused = null;     // restore focus on close
let initialised = false;    // global click/keydown delegation flag

const isTriggerEl = (el) => {
  if (!(el instanceof Element)) return false;
  if (el.matches('[data-newsletter-trigger]')) return true;
  if (el instanceof HTMLAnchorElement) {
    const href = el.getAttribute('href') || '';
    if (href === '#newsletter') return true;
    // Trailing `#newsletter` on a same-page link (e.g. `resources#newsletter`)
    // also opens the modal.
    if (href.endsWith('#newsletter')) return true;
  }
  return false;
};

const ensureStylesheet = () => {
  if (document.querySelector(`link[data-newsletter-modal-css]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = CSS_HREF;
  link.setAttribute('data-newsletter-modal-css', '');
  document.head.appendChild(link);
};

const buildModal = () => {
  const overlay = createEl('div', 'newsletter-modal');
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'newsletter-modal-title');
  overlay.setAttribute('aria-hidden', 'true');
  overlay.hidden = true;

  const card = createEl('div', 'newsletter-modal__card');

  const closeBtn = createEl('button', 'newsletter-modal__close');
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', 'Close newsletter signup');
  closeBtn.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <line x1="6" y1="6" x2="18" y2="18"></line>
      <line x1="18" y1="6" x2="6" y2="18"></line>
    </svg>
  `;

  const visual = createEl('div', 'newsletter-modal__visual');
  const img = createEl('img', 'newsletter-modal__visual-img');
  img.src = VISUAL_SRC;
  img.alt = '';
  img.setAttribute('aria-hidden', 'true');
  visual.appendChild(img);

  const body = createEl('div', 'newsletter-modal__body');

  const title = createEl('h2', 'newsletter-modal__title');
  title.id = 'newsletter-modal-title';
  title.textContent = 'Payments Deconstructed';

  const subtitle = createEl('p', 'newsletter-modal__subtitle');
  subtitle.textContent =
    'Every two weeks, we break down the systems, rules, and developments that drive the payments world.';

  const form = createEl('form', 'newsletter-modal__form');
  form.setAttribute('novalidate', '');

  const input = createEl('input', 'newsletter-modal__input');
  input.type = 'email';
  input.placeholder = 'Enter Email Address';
  input.required = true;
  input.autocomplete = 'email';
  input.setAttribute('aria-label', 'Email address');

  const submit = createEl('button', 'newsletter-modal__submit');
  submit.type = 'submit';
  submit.textContent = 'Subscribe';

  form.append(input, submit);

  const fine = createEl('p', 'newsletter-modal__fine');
  fine.textContent = 'No spam. Unsubscribe anytime.';

  const status = createEl('p', 'newsletter-modal__status');
  status.setAttribute('aria-live', 'polite');

  body.append(title, subtitle, form, status, fine);

  card.append(closeBtn, visual, body);
  overlay.append(card);
  document.body.appendChild(overlay);

  return { overlay, card, closeBtn, form, input, submit, status, fine };
};

const setStatus = (text, variant) => {
  if (!modalEls) return;
  modalEls.status.textContent = text || '';
  modalEls.status.classList.remove('is-error', 'is-success');
  if (variant) modalEls.status.classList.add(`is-${variant}`);
};

const resetForm = () => {
  if (!modalEls) return;
  modalEls.form.style.display = '';
  modalEls.fine.style.display = '';
  modalEls.input.value = '';
  modalEls.submit.disabled = false;
  modalEls.submit.textContent = 'Subscribe';
  setStatus('', null);
};

const showSuccessState = () => {
  if (!modalEls) return;
  modalEls.form.style.display = 'none';
  modalEls.fine.style.display = 'none';
  setStatus("You're in. Check your inbox for the next issue.", 'success');
};

const openModal = () => {
  ensureStylesheet();
  if (!modalEls) {
    modalEls = buildModal();
    wireModalEvents();
  }
  if (isOpen) return;

  lastFocused = document.activeElement;

  // If the visitor already subscribed in this browser, surface the success
  // state immediately rather than asking them to subscribe again.
  if (localStorage.getItem(STORAGE_KEY) === 'submitted') {
    showSuccessState();
  } else {
    resetForm();
  }

  modalEls.overlay.hidden = false;
  modalEls.overlay.setAttribute('aria-hidden', 'false');
  modalEls.overlay.classList.add('is-open');
  document.body.classList.add('newsletter-modal-open');
  isOpen = true;

  // Defer focus until after the open transition starts so the input scroll-
  // into-view doesn't fight the modal entrance animation.
  setTimeout(() => {
    if (modalEls.form.style.display !== 'none') {
      modalEls.input.focus();
    } else {
      modalEls.closeBtn.focus();
    }
  }, 60);
};

const closeModal = () => {
  if (!modalEls || !isOpen) return;
  isOpen = false;
  modalEls.overlay.classList.remove('is-open');
  modalEls.overlay.setAttribute('aria-hidden', 'true');
  modalEls.overlay.hidden = true;
  document.body.classList.remove('newsletter-modal-open');

  if (lastFocused instanceof HTMLElement) {
    try { lastFocused.focus(); } catch (_) { /* ignore */ }
  }
};

const wireModalEvents = () => {
  if (!modalEls) return;

  modalEls.closeBtn.addEventListener('click', closeModal);

  // Backdrop click — only when the click lands on the overlay itself, not
  // the card.
  modalEls.overlay.addEventListener('click', (e) => {
    if (e.target === modalEls.overlay) closeModal();
  });

  modalEls.input.addEventListener('input', () => {
    setStatus('', null);
    modalEls.input.classList.remove('is-error');
  });

  modalEls.form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = modalEls.input.value.trim();
    if (!EMAIL_RE.test(email)) {
      modalEls.input.classList.add('is-error');
      setStatus('Please enter a valid email address.', 'error');
      modalEls.input.focus();
      return;
    }

    modalEls.submit.disabled = true;
    const originalLabel = modalEls.submit.textContent;
    modalEls.submit.textContent = 'Sending…';
    setStatus('', null);

    try {
      const res = await fetch(SUBMIT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, description: CRM_DESCRIPTION }),
      });

      // Surface non-2xx as failure rather than fake success.
      if (!res.ok) throw new Error(`Newsletter submit failed (${res.status})`);

      localStorage.setItem(STORAGE_KEY, 'submitted');
      showSuccessState();
    } catch (err) {
      console.error('[newsletter-modal] Submit failed:', err);
      modalEls.submit.disabled = false;
      modalEls.submit.textContent = originalLabel || 'Subscribe';
      setStatus('Something went wrong. Please try again.', 'error');
    }
  });
};

export const openNewsletterModal = () => openModal();
export const closeNewsletterModal = () => closeModal();

/**
 * Wire up site-wide delegated triggers. Safe to call multiple times — the
 * listeners attach only once. Loads the stylesheet eagerly so the first
 * open isn't a beat behind the click.
 */
export const initNewsletterModal = () => {
  if (initialised) return;
  initialised = true;

  ensureStylesheet();

  document.addEventListener('click', (e) => {
    const path = e.composedPath ? e.composedPath() : [];
    const target = path.find((n) => isTriggerEl(n)) || (e.target instanceof Element ? e.target.closest('[data-newsletter-trigger], a[href="#newsletter"], a[href$="#newsletter"]') : null);
    if (!target) return;
    e.preventDefault();
    openModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) {
      closeModal();
    }
  });
};

/* Auto-init on module load. The site-wide footer module imports this one,
   so any page that ships the footer gets the modal wired up — even if the
   page short-circuits renderFooter (e.g. the homepage, which keeps the
   pre-rendered footer when content hashes match). */
const autoInit = () => initNewsletterModal();
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', autoInit, { once: true });
} else {
  autoInit();
}
