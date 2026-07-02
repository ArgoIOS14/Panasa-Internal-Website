/**
 * Covers: TC-SCROLLSPY-001 through TC-SCROLLSPY-003
 * Guide detail page: section tabs render, sliding indicator exists,
 * clicking a tab scrolls + marks it active.
 */
import { test, expect } from '@playwright/test';
import { installZohoMock } from '../fixtures/zoho-mock';

const GUIDE = '/guides/complete-guide-to-interchange-fees';

test.beforeEach(async ({ page }) => {
  await installZohoMock(page);
});

test('guide page renders the section tabs nav', async ({ page }) => {
  await page.goto(GUIDE);
  const tabs = page.locator('[data-guide-tabs]');
  await expect(tabs).toBeVisible();
  await page.waitForTimeout(500);
  const tabLinks = tabs.locator('.guide-section-tab');
  expect(await tabLinks.count()).toBeGreaterThanOrEqual(2);
});

test('sliding indicator is rendered in tabs', async ({ page }) => {
  await page.goto(GUIDE);
  await page.waitForTimeout(500);
  await expect(page.locator('.guide-section-tabs-indicator')).toBeAttached();
});

test('clicking a tab marks it active', async ({ page }) => {
  await page.goto(GUIDE);
  await page.waitForTimeout(500);
  const tabs = page.locator('[data-guide-tabs] .guide-section-tab');
  const count = await tabs.count();
  expect(count).toBeGreaterThan(1);

  const target = tabs.nth(Math.min(count - 1, 2));
  await target.click();
  await page.waitForTimeout(800);
  await expect(target).toHaveClass(/is-active/);
});

test('blog detail page loads its hero + body', async ({ page }) => {
  await page.goto('/blog/anatomy-of-a-swipe');
  await expect(page.locator('.blog-hero')).toBeVisible();
  await expect(page.locator('[data-blog-title]')).toHaveText(/.+/);
  // Body is rendered from JSON, give it a beat
  await page.waitForTimeout(800);
  const body = page.locator('[data-blog-body]');
  await expect(body).toBeVisible();
});

test('case study detail page loads its hero', async ({ page }) => {
  await page.goto('/case-studies/osper-family-banking');
  await expect(page.locator('header.site-header')).toBeVisible();
  // Title and at least one section render
  await expect(page.locator('h1').first()).toHaveText(/.+/);
});
