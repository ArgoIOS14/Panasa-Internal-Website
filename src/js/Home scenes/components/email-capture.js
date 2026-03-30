import { createEl } from '../utils/dom.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const GLOBAL_KEY = 'panasa_email_any';
const DISMISS_COOLDOWN_DAYS = 3;

const DEFAULTS = {
  promptSubtext: '',
  buttonLabel: 'Subscribe',
  successMessage: 'Thanks! Check your inbox.',
  triggerPercent: 0.5,
  crmDescription: 'Email capture',
  submitUrl: '/api/zoho-email-proxy.php',
};

/* ── localStorage helpers ────────────────────────────────── */

const isSuppressed = (key) => {
  const val = localStorage.getItem(key);
  if (!val) return false;

  // 'submitted' = permanent suppress
  if (val === 'submitted') return true;

  // Timestamp-based dismiss — check if cooldown has passed
  const dismissedAt = Number(val);
  if (Number.isNaN(dismissedAt)) return true; // legacy 'dismissed' string, treat as permanent
  const daysSince = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
  return daysSince < DISMISS_COOLDOWN_DAYS;
};

/* ── SVG icons ───────────────────────────────────────────── */

const closeIcon = () => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  const line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line1.setAttribute('x1', '6');
  line1.setAttribute('y1', '6');
  line1.setAttribute('x2', '18');
  line1.setAttribute('y2', '18');
  const line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line2.setAttribute('x1', '18');
  line2.setAttribute('y1', '6');
  line2.setAttribute('x2', '6');
  line2.setAttribute('y2', '18');
  svg.append(line1, line2);
  return svg;
};

const checkIcon = () => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
  path.setAttribute('points', '4 12 10 18 20 6');
  svg.append(path);
  return svg;
};

/* ── DOM builder ─────────────────────────────────────────── */

const buildPopup = (cfg) => {
  const aside = createEl('aside', 'email-capture');
  aside.setAttribute('role', 'complementary');
  aside.setAttribute('aria-label', 'Email signup');

  // Close button
  const closeBtn = createEl('button', 'email-capture__close');
  closeBtn.setAttribute('type', 'button');
  closeBtn.setAttribute('aria-label', 'Close signup prompt');
  closeBtn.appendChild(closeIcon());

  // Body
  const body = createEl('div', 'email-capture__body');

  const heading = createEl('p', 'email-capture__heading');
  heading.textContent = cfg.promptHeading;

  const subtext = createEl('p', 'email-capture__subtext');
  subtext.textContent = cfg.promptSubtext;

  // Form
  const form = createEl('form', 'email-capture__form');
  form.setAttribute('novalidate', '');

  const input = createEl('input', 'email-capture__input');
  input.type = 'email';
  input.placeholder = 'your@email.com';
  input.required = true;
  input.setAttribute('aria-label', 'Email address');
  input.autocomplete = 'email';

  const submit = createEl('button', 'email-capture__submit');
  submit.type = 'submit';
  submit.textContent = cfg.buttonLabel;

  form.append(input, submit);

  // Error message
  const error = createEl('p', 'email-capture__error');
  error.textContent = 'Please enter a valid email address';

  // Success message
  const success = createEl('div', 'email-capture__success');
  success.setAttribute('aria-live', 'polite');
  const successIcon = createEl('span', 'email-capture__success-icon');
  successIcon.appendChild(checkIcon());
  const successText = createEl('span', 'email-capture__success-text');
  successText.textContent = cfg.successMessage;
  success.append(successIcon, successText);

  body.append(heading);
  if (cfg.promptSubtext) body.append(subtext);
  body.append(form, error, success);

  aside.append(closeBtn, body);

  return { aside, closeBtn, form, input, submit, error, success };
};

/* ── Core logic ──────────────────────────────────────────── */

export const initEmailCapture = (userConfig = {}) => {
  const cfg = { ...DEFAULTS, ...userConfig };

  if (!cfg.promptHeading || !cfg.storageKey) {
    console.warn('[email-capture] promptHeading and storageKey are required');
    return;
  }

  // Guard — already submitted (permanent) or recently dismissed (3-day cooldown)
  if (isSuppressed(cfg.storageKey) || isSuppressed(GLOBAL_KEY)) {
    return;
  }

  const els = buildPopup(cfg);
  document.body.appendChild(els.aside);

  let revealed = false;
  let dismissed = false;

  /* ── Reveal ──────────────────────────────────────────── */

  const reveal = () => {
    if (revealed || dismissed) return;
    revealed = true;
    els.aside.classList.add('email-capture--visible');
  };

  /* ── Dismiss ─────────────────────────────────────────── */

  const dismiss = (reason) => {
    if (dismissed) return;
    dismissed = true;

    if (reason === 'close') {
      localStorage.setItem(cfg.storageKey, String(Date.now()));
    }

    els.aside.classList.remove('email-capture--visible');
    els.aside.classList.add('email-capture--hiding');

    const onEnd = () => {
      els.aside.removeEventListener('transitionend', onEnd);
      els.aside.remove();
    };
    els.aside.addEventListener('transitionend', onEnd);

    // Fallback removal if transitionend doesn't fire (reduced-motion)
    setTimeout(() => {
      if (els.aside.parentNode) els.aside.remove();
    }, 500);
  };

  /* ── Scroll trigger ──────────────────────────────────── */

  const onScroll = () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight;
    const viewHeight = window.innerHeight;
    const maxScroll = docHeight - viewHeight;

    if (maxScroll <= 0) return;

    const percent = scrollTop / maxScroll;
    if (percent >= cfg.triggerPercent) {
      window.removeEventListener('scroll', onScroll);
      reveal();
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });

  /* ── Close button ────────────────────────────────────── */

  els.closeBtn.addEventListener('click', () => dismiss('close'));

  /* ── Escape key ──────────────────────────────────────── */

  const onKeydown = (e) => {
    if (e.key === 'Escape' && revealed && !dismissed) {
      dismiss('close');
      document.removeEventListener('keydown', onKeydown);
    }
  };
  document.addEventListener('keydown', onKeydown);

  /* ── Clear error on input ────────────────────────────── */

  els.input.addEventListener('input', () => {
    els.input.classList.remove('email-capture__input--error');
    els.error.classList.remove('email-capture__error--visible');
  });

  /* ── Form submit ─────────────────────────────────────── */

  els.form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = els.input.value.trim();

    if (!EMAIL_RE.test(email)) {
      els.input.classList.add('email-capture__input--error');
      els.error.classList.add('email-capture__error--visible');
      els.input.focus();
      return;
    }

    els.submit.disabled = true;
    els.submit.textContent = 'Sending…';

    try {
      await fetch(cfg.submitUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          description: cfg.crmDescription,
        }),
      });

      // Mark as submitted (page + global)
      localStorage.setItem(cfg.storageKey, 'submitted');
      localStorage.setItem(GLOBAL_KEY, 'submitted');

      // Show success state
      els.form.style.display = 'none';
      els.error.style.display = 'none';
      els.success.classList.add('email-capture__success--visible');

      // Auto-dismiss after 3 seconds
      setTimeout(() => dismiss('submitted'), 3000);
    } catch (err) {
      console.error('[email-capture] Submit failed:', err);
      els.submit.disabled = false;
      els.submit.textContent = cfg.buttonLabel;
      els.error.textContent = 'Something went wrong. Please try again.';
      els.error.classList.add('email-capture__error--visible');
    }
  });
};
