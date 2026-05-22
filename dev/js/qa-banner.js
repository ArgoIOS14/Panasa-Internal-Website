/* =============================================================================
 * QA banner + contact-form guard
 *
 * Activates when the page is served from anywhere OTHER than the canonical
 * production hostnames (panasatech.com / www.panasatech.com). On QA builds:
 *   1. A fixed top banner shows "QA build · for internal review only"
 *   2. The contact form (action posts to /api/zoho-proxy.php) is intercepted —
 *      submit shows a friendly "QA build — contact form disabled" message
 *      instead of attempting a server-side POST that would 404 (Netlify has
 *      no PHP runtime).
 *
 * This file ships only in dev/ — prod/ is unaffected.
 * ============================================================================ */
(function () {
  const PROD_HOSTS = new Set(['panasatech.com', 'www.panasatech.com']);
  const host = (typeof window !== 'undefined' && window.location && window.location.hostname) || '';
  // QA mode = anything not on the canonical prod hostnames. Includes localhost,
  // *.netlify.app, *.netlify.live (deploy previews), and any custom QA domain
  // someone wires up later (e.g. qa.panasatech.com — would need adding to
  // PROD_HOSTS if it shouldn't show the banner).
  if (PROD_HOSTS.has(host)) return;

  function injectBanner() {
    if (document.getElementById('qa-mode-banner')) return;
    const bar = document.createElement('div');
    bar.id = 'qa-mode-banner';
    bar.setAttribute('role', 'status');
    bar.setAttribute('aria-live', 'polite');
    bar.style.cssText = [
      'position:fixed', 'top:0', 'left:0', 'right:0', 'z-index:99999',
      'padding:8px 16px', 'background:#facc15', 'color:#1a1a1a',
      'font:600 12px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",Inter,sans-serif',
      'letter-spacing:0.04em', 'text-align:center',
      'border-bottom:1px solid rgba(0,0,0,0.18)',
      'box-shadow:0 1px 4px rgba(0,0,0,0.12)',
    ].join(';');
    bar.textContent = 'QA BUILD · ' + host + ' · for internal review only · contact form disabled';
    document.body.prepend(bar);
    // Push the rest of the page down so the fixed banner doesn't cover the nav.
    document.body.style.paddingTop = (bar.offsetHeight + 'px');
    // Recalculate on resize (banner can wrap on narrow viewports).
    window.addEventListener('resize', function () {
      document.body.style.paddingTop = bar.offsetHeight + 'px';
    });
  }

  function guardContactForms() {
    // Match any form that POSTs to a PHP endpoint under /api/ — these are
    // the Zoho proxy + email capture forms. They have no server-side
    // counterpart on Netlify.
    const forms = document.querySelectorAll('form');
    forms.forEach(function (form) {
      const action = (form.getAttribute('action') || '').toLowerCase();
      if (!action.includes('/api/') || !action.endsWith('.php')) return;

      form.addEventListener('submit', function (ev) {
        ev.preventDefault();
        ev.stopImmediatePropagation();
        // Try to surface the message in the form's existing status element if
        // one is present (most forms have a .form-status / .contact-status
        // sibling); otherwise inject one ourselves.
        let status = form.querySelector('.form-status, .contact-status, [data-form-status]');
        if (!status) {
          status = document.createElement('div');
          status.setAttribute('data-form-status', 'qa');
          status.style.cssText = 'margin-top:12px;padding:10px 14px;border-radius:8px;background:#fef3c7;color:#7c2d12;font-size:14px;line-height:1.45;';
          form.appendChild(status);
        }
        status.textContent = 'QA build — contact form is disabled here. Use the live site (www.panasatech.com) to test the form end-to-end.';
        // Re-enable any disabled submit button so the user can try again if
        // they were waiting on a spinner state.
        form.querySelectorAll('button[disabled], input[type="submit"][disabled]').forEach(function (b) {
          b.removeAttribute('disabled');
        });
      }, true /* capture, so we beat any other submit listeners */);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      injectBanner();
      guardContactForms();
    });
  } else {
    injectBanner();
    guardContactForms();
  }
})();
