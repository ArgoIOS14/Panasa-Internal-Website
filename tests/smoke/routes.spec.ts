/**
 * Covers: TC-SMOKE-001 through TC-SMOKE-021
 * Every public route loads successfully with no console errors,
 * a non-empty title, and a visible hero/header.
 */
import { test, expect } from '@playwright/test';
import { ALL_ROUTES } from '../data/routes';
import { watchPageErrors } from '../fixtures/console-errors';
import { installZohoMock } from '../fixtures/zoho-mock';

for (const route of ALL_ROUTES) {
  test(`smoke: ${route.path} loads cleanly`, async ({ page }) => {
    // Mock proxies so any background-fetch on load doesn't pollute results
    await installZohoMock(page, 'success');

    const errors = watchPageErrors(page);
    const response = await page.goto(route.path, { waitUntil: 'domcontentloaded' });

    expect(response, `no response for ${route.path}`).not.toBeNull();
    expect(response!.status(), `bad status for ${route.path}`).toBeLessThan(400);

    await expect(page).toHaveTitle(route.title, { timeout: 10_000 });

    // Header is rendered on every page
    await expect(page.locator('header.site-header').first()).toBeVisible();

    // Some interactive renders are deferred — give them a moment then sample
    await page.waitForLoadState('networkidle').catch(() => {});

    errors.stop();
    expect(errors.consoleErrors, `console errors on ${route.path}`).toEqual([]);
    expect(errors.pageErrors, `runtime errors on ${route.path}`).toEqual([]);
  });
}

test('homepage hero text is present', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.hero')).toBeVisible();
  await expect(page.locator('[data-hero-title]')).toHaveText(/.+/);
});

test('homepage logo marquee is in DOM', async ({ page }) => {
  await page.goto('/');
  const marquee = page.locator('.logo-marquee').first();
  await expect(marquee).toBeVisible();
  const items = marquee.locator('.logo-marquee-item');
  expect(await items.count()).toBeGreaterThan(5);
});
