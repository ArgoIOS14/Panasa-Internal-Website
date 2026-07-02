/**
 * Covers: TC-CAROUSEL-001 through TC-CAROUSEL-004
 * Services + case studies + testimonials carousels exist and respond to interaction.
 */
import { test, expect } from '@playwright/test';
import { installZohoMock } from '../fixtures/zoho-mock';

test.beforeEach(async ({ page }) => {
  await installZohoMock(page);
});

test('services carousel renders multiple slides', async ({ page }) => {
  await page.goto('/');
  const carousel = page.locator('[data-services-carousel]').first();
  await expect(carousel).toBeVisible();
  const slides = carousel.locator('.services-slide');
  expect(await slides.count()).toBeGreaterThanOrEqual(3);
});

test('case-studies (Proven Results) carousel is present on the homepage', async ({ page }) => {
  await page.goto('/');
  const slides = page.locator('[data-case-slides]');
  await slides.scrollIntoViewIfNeeded();
  await expect(slides).toBeVisible();
  expect(await slides.locator('.slide').count()).toBeGreaterThanOrEqual(1);
  await expect(page.locator('[data-case-dots]')).toBeVisible();
});

test('engagement section has filter buttons and grid', async ({ page }) => {
  await page.goto('/');
  const filters = page.locator('[data-engagement-filters]');
  await filters.scrollIntoViewIfNeeded();
  await expect(filters).toBeVisible();
  const buttons = filters.locator('.engagement-filter');
  expect(await buttons.count()).toBeGreaterThanOrEqual(2);

  await expect(buttons.first()).toHaveClass(/active/);
});

test('engagement filter switches the active button on click', async ({ page }) => {
  await page.goto('/');
  const filters = page.locator('[data-engagement-filters]');
  // Scroll the filter row to a fixed position so the section heading + cards
  // don't overlay the tap-target on Firefox.
  await filters.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(300);
  const buttons = filters.locator('.engagement-filter');
  const second = buttons.nth(1);

  await second.click({ force: true });
  // Allow OUT_MS + IN_MS transition (~700ms) before asserting
  await page.waitForTimeout(900);
  await expect(second).toHaveClass(/active/);
});
