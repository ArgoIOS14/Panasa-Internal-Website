/**
 * Inline Newsletter component
 *
 * Hydrates a form matched by the selector (defaults to `[data-blog-newsletter]`)
 * so the visitor can subscribe without opening the scroll-triggered
 * email-capture modal. Submits to the same endpoint as email-capture.js so
 * every entry lands in the same CRM pipeline.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const initInlineNewsletter = (opts = {}) => {
  const cfg = {
    formSelector: '[data-blog-newsletter]',
    submitUrl: '/api/zoho-email-proxy.php',
    crmDescription: 'Email capture: Inline newsletter',
    buttonLabel: 'Subscribe',
    successMessage: "You're in. Check your inbox for the next issue.",
    errorMessage: 'Something went wrong. Please try again.',
    storageKey: null,
    ...opts,
  };

  const form = document.querySelector(cfg.formSelector);
  if (!(form instanceof HTMLFormElement)) return;

  const input = form.querySelector('input[type="email"]');
  const submit = form.querySelector('button[type="submit"]');
  if (!(input instanceof HTMLInputElement) || !(submit instanceof HTMLButtonElement)) return;

  // If the visitor has already subscribed in this storage slot, skip the UI
  if (cfg.storageKey && localStorage.getItem(cfg.storageKey) === 'submitted') {
    form.innerHTML = `<span class="blog-newsletter-status is-success">${cfg.successMessage}</span>`;
    return;
  }

  // Status line appended below the form on submit
  let status = form.parentElement?.querySelector('.blog-newsletter-status');
  if (!status) {
    status = document.createElement('span');
    status.className = 'blog-newsletter-status';
    form.parentElement?.appendChild(status);
  }

  const setStatus = (text, variant) => {
    status.textContent = text;
    status.classList.remove('is-success', 'is-error');
    if (variant) status.classList.add(`is-${variant}`);
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = input.value.trim();
    if (!EMAIL_RE.test(email)) {
      setStatus('Please enter a valid email address.', 'error');
      input.focus();
      return;
    }

    submit.disabled = true;
    const originalLabel = submit.textContent || cfg.buttonLabel;
    submit.textContent = 'Sending…';
    setStatus('', null);

    try {
      await fetch(cfg.submitUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          description: cfg.crmDescription,
        }),
      });

      if (cfg.storageKey) {
        localStorage.setItem(cfg.storageKey, 'submitted');
      }

      form.innerHTML = `<span class="blog-newsletter-status is-success">${cfg.successMessage}</span>`;
    } catch (err) {
      console.error('[inline-newsletter] Submit failed:', err);
      submit.disabled = false;
      submit.textContent = originalLabel;
      setStatus(cfg.errorMessage, 'error');
    }
  });
};
