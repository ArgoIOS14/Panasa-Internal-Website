/**
 * Covers: TC-EMAIL-001 through TC-EMAIL-005
 * Email-capture popup: scroll trigger, validation, dismiss cookie, mocked submit.
 */
import { test, expect } from '@playwright/test';
import { installZohoMock } from '../fixtures/zoho-mock';

const scrollPastTrigger = async (page: import('@playwright/test').Page) => {
  // The home popup triggers at 60% scroll
  await page.evaluate(() => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo(0, max * 0.7);
    window.dispatchEvent(new Event('scroll'));
  });
  await page.waitForTimeout(200);
};

test.beforeEach(async ({ context }) => {
  await context.clearCookies();
  await context.addInitScript(() => {
    try {
      localStorage.clear();
    } catch {}
  });
});

test('popup reveals after scrolling past trigger percent', async ({ page }) => {
  await installZohoMock(page);
  await page.goto('/');
  // Not visible at top
  await expect(page.locator('.email-capture')).toHaveCount(1); // built into DOM
  await expect(page.locator('.email-capture')).not.toHaveClass(/email-capture--visible/);

  await scrollPastTrigger(page);
  await expect(page.locator('.email-capture')).toHaveClass(/email-capture--visible/);
});

test('close button records dismissal timestamp in localStorage', async ({ page }) => {
  await installZohoMock(page);
  await page.goto('/');
  await scrollPastTrigger(page);

  const popup = page.locator('.email-capture');
  await expect(popup).toHaveClass(/email-capture--visible/);
  await popup.locator('.email-capture__close').click();

  const stored = await page.evaluate(() => localStorage.getItem('panasa_email_home'));
  expect(stored, 'dismiss timestamp not written').not.toBeNull();
  expect(Number(stored)).toBeGreaterThan(0);
});

test('invalid email shows inline error', async ({ page }) => {
  await installZohoMock(page);
  await page.goto('/');
  await scrollPastTrigger(page);

  const popup = page.locator('.email-capture');
  await popup.locator('input.email-capture__input').fill('not-an-email');
  await popup.locator('button.email-capture__submit').click();

  await expect(popup.locator('.email-capture__error')).toHaveClass(/email-capture__error--visible/);
  await expect(popup.locator('input.email-capture__input')).toHaveClass(/email-capture__input--error/);
});

test('valid email submission hits mocked proxy and shows success', async ({ page }) => {
  const mock = await installZohoMock(page, 'success');
  await page.goto('/');
  await scrollPastTrigger(page);

  const popup = page.locator('.email-capture');
  await popup.locator('input.email-capture__input').fill('qa@example.com');
  await popup.locator('button.email-capture__submit').click();

  await expect(popup.locator('.email-capture__success')).toHaveClass(/email-capture__success--visible/, {
    timeout: 5_000,
  });
  expect(mock.calls.length, 'expected one mocked call').toBeGreaterThanOrEqual(1);
  expect(mock.calls[0].url).toContain('/api/zoho-email-proxy.php');
  const body = mock.calls[0].postData as { email?: string };
  expect(body.email).toBe('qa@example.com');
});

test('popup does not show again when dismissed within 3-day cooldown', async ({ page, context }) => {
  await installZohoMock(page);

  // Seed dismiss timestamp directly
  await context.addInitScript(() => {
    localStorage.setItem('panasa_email_home', String(Date.now()));
  });

  await page.goto('/');
  await scrollPastTrigger(page);
  // The popup should never have been appended to the DOM at all
  await expect(page.locator('.email-capture')).toHaveCount(0);
});
