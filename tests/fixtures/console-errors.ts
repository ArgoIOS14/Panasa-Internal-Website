import type { Page, ConsoleMessage } from '@playwright/test';

/**
 * Capture console errors and failed network requests during a test.
 * Returns an accessor that lists everything captured between start and call.
 */

const IGNORE_PATTERNS: RegExp[] = [
  // Third-party font/script noise that doesn't affect functionality
  /api\.fontshare\.com/,
  /rsms\.me/,
  /favicon\.ico/,
  // Lenis / Strapi network probes that fall back gracefully
  /content\.json/,
  // Email-capture proxy returns 500 without .env — that's fine in test mode
  /zoho-email-proxy\.php/,
  /zoho-proxy\.php/,
];

const isIgnored = (text: string) => IGNORE_PATTERNS.some((re) => re.test(text));

export const watchPageErrors = (page: Page) => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const failedRequests: { url: string; failure: string | null }[] = [];

  const onConsole = (msg: ConsoleMessage) => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    if (isIgnored(text)) return;
    consoleErrors.push(text);
  };

  const onPageError = (err: Error) => {
    if (isIgnored(err.message)) return;
    pageErrors.push(err.message);
  };

  const onRequestFailed = (request: import('@playwright/test').Request) => {
    const url = request.url();
    if (isIgnored(url)) return;
    failedRequests.push({ url, failure: request.failure()?.errorText ?? null });
  };

  page.on('console', onConsole);
  page.on('pageerror', onPageError);
  page.on('requestfailed', onRequestFailed);

  return {
    consoleErrors,
    pageErrors,
    failedRequests,
    stop: () => {
      page.off('console', onConsole);
      page.off('pageerror', onPageError);
      page.off('requestfailed', onRequestFailed);
    },
  };
};
