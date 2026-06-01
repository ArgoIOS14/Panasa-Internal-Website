/**
 * Covers: TC-CONTACT-001 through TC-CONTACT-010
 * Contact form — validation, country code picker, mocked submit (success + 500).
 */
import { test, expect } from '@playwright/test';
import { installZohoMock } from '../fixtures/zoho-mock';

const fillValid = async (page: import('@playwright/test').Page) => {
  await page.fill('input[name="firstName"]', 'QA');
  await page.fill('input[name="lastName"]', 'Bot');
  await page.fill('input[name="email"]', 'qa@example.com');
  await page.fill('input[name="phone"]', '9876543210'); // 10 digits, valid for +91
  await page.fill('textarea[name="requirements"]', 'This is an automated test message.');
};

test('submit button is disabled until all required fields are filled', async ({ page }) => {
  await installZohoMock(page);
  await page.goto('/contact');
  const submit = page.locator('button.btn-submit');
  await expect(submit).toBeDisabled();
  await fillValid(page);
  await expect(submit).toBeEnabled();
});

// HTML5 native validation runs before the JS submit handler. Disable it so
// the JS validator (which sets .field-error) can run.
const disableNativeValidation = async (page: import('@playwright/test').Page) => {
  await page.locator('form.contact-form').evaluate((f: HTMLFormElement) => {
    f.noValidate = true;
  });
};

test('invalid email marks the email field with error class', async ({ page }) => {
  await installZohoMock(page);
  await page.goto('/contact');
  await disableNativeValidation(page);
  await page.fill('input[name="firstName"]', 'QA');
  await page.fill('input[name="lastName"]', 'Bot');
  await page.fill('input[name="email"]', 'definitely-not-an-email');
  await page.fill('input[name="phone"]', '9876543210');
  await page.fill('textarea[name="requirements"]', 'Hi');
  await page.click('button.btn-submit');

  const emailField = page.locator('input[name="email"]').locator('xpath=ancestor::label[contains(@class,"field")][1]');
  await expect(emailField).toHaveClass(/field-error/);
});

test('invalid phone (too short for +91) marks phone field with error', async ({ page }) => {
  await installZohoMock(page);
  await page.goto('/contact');
  await disableNativeValidation(page);
  await page.fill('input[name="firstName"]', 'QA');
  await page.fill('input[name="lastName"]', 'Bot');
  await page.fill('input[name="email"]', 'qa@example.com');
  await page.fill('input[name="phone"]', '123'); // way too short for +91 (expects 10)
  await page.fill('textarea[name="requirements"]', 'Hi');
  await page.click('button.btn-submit');

  const phoneField = page.locator('input[name="phone"]').locator('xpath=ancestor::label[contains(@class,"field")][1]');
  await expect(phoneField).toHaveClass(/field-error/);
});

test('country code picker opens and is searchable', async ({ page }) => {
  await installZohoMock(page);
  await page.goto('/contact');

  const btn = page.locator('.phone-code-btn');
  await btn.click();
  const dropdown = page.locator('.phone-code-dropdown');
  await expect(dropdown).toHaveClass(/open/);

  await page.fill('.phone-code-search', 'United Kingdom');
  // The list updates on every input event
  const ukRow = page.locator('.phone-code-list li').filter({ hasText: 'United Kingdom' });
  await expect(ukRow).toBeVisible();
});

test('selecting +44 (UK) updates the code button and dataset', async ({ page }) => {
  await installZohoMock(page);
  await page.goto('/contact');

  await page.locator('.phone-code-btn').click();
  await page.fill('.phone-code-search', 'United Kingdom');
  // mousedown handler — Playwright .click() dispatches mousedown then mouseup
  await page.locator('.phone-code-list li').filter({ hasText: 'United Kingdom' }).first().click();

  await expect(page.locator('.phone-code-value')).toHaveText('+44');
  await expect(page.locator('.phone-code-btn')).toHaveAttribute('data-phone-code', '+44');
});

test('successful submit (mocked 200) shows confirmation and POSTs to proxy', async ({ page }) => {
  const mock = await installZohoMock(page, 'success');
  await page.goto('/contact');

  await fillValid(page);
  await page.click('button.btn-submit');

  await expect(page.locator('button.btn-submit')).toHaveText('Message Sent!', { timeout: 5_000 });

  expect(mock.calls.length).toBeGreaterThanOrEqual(1);
  const call = mock.calls[0];
  expect(call.url).toContain('/api/zoho-proxy.php');
  const body = call.postData as Record<string, string>;
  expect(body.firstName).toBe('QA');
  expect(body.lastName).toBe('Bot');
  expect(body.email).toBe('qa@example.com');
  expect(body.phone).toContain('+91');
  expect(body.message).toContain('automated test');
});

test('failed submit (mocked 500) shows alert and re-enables form', async ({ page }) => {
  await installZohoMock(page, 'server-error');
  await page.goto('/contact');

  // Capture the alert dialog
  page.on('dialog', (dialog) => dialog.accept());

  await fillValid(page);
  await page.click('button.btn-submit');

  // After failure, the button label resets to the original ("Send Message")
  await expect(page.locator('button.btn-submit')).toHaveText('Send Message', { timeout: 5_000 });
});

test('copy-email button copies info@panasatech.com', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'Clipboard permission API differs in Firefox/WebKit');
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await installZohoMock(page);
  await page.goto('/contact');

  const copyBtn = page.locator('.copy-btn[data-copy="info@panasatech.com"]').first();
  await copyBtn.click();
  await expect(copyBtn).toHaveClass(/copied/);
});
