/**
 * Covers: TC-RESP-001 through TC-RESP-006
 * Verify the nav variant and hero render correctly at mobile/tablet/desktop.
 */
import { test, expect } from '@playwright/test';
import { VIEWPORTS } from '../data/routes';
import { installZohoMock } from '../fixtures/zoho-mock';

for (const [name, viewport] of Object.entries(VIEWPORTS)) {
  test.describe(`viewport: ${name} (${viewport.width}x${viewport.height})`, () => {
    test.use({ viewport });

    test('home renders header and hero', async ({ page }) => {
      await installZohoMock(page);
      await page.goto('/');
      await expect(page.locator('header.site-header').first()).toBeVisible();
      await expect(page.locator('.hero').first()).toBeVisible();
    });

    // nav.js switches to mobile layout at <=900px; tablet (768) is still mobile
    const isMobileLayout = viewport.width <= 900;
    test(isMobileLayout ? 'hamburger toggle is visible' : 'desktop nav links list is visible', async ({ page }) => {
      await installZohoMock(page);
      await page.goto('/');
      if (isMobileLayout) {
        await expect(page.locator('.nav-toggle').first()).toBeVisible();
      } else {
        await expect(page.locator('.nav-links').first()).toBeVisible();
      }
    });
  });
}

test('reduced-motion: Lenis falls back without throwing', async ({ browser }) => {
  const context = await browser.newContext({
    reducedMotion: 'reduce',
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();
  await installZohoMock(page);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.evaluate(() => window.scrollBy(0, 500));
  expect(errors).toEqual([]);
  await context.close();
});
