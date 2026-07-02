/**
 * Covers: TC-ASSET-001 through TC-ASSET-005
 * Critical static assets must resolve (no 404s for CSS/JS/logo).
 */
import { test, expect } from '@playwright/test';

const REQUIRED_ASSETS = [
  '/assets/logo.svg',
  '/assets/og-image.png',
  '/robots.txt',
  '/sitemap.xml',
];

for (const asset of REQUIRED_ASSETS) {
  test(`asset resolves: ${asset}`, async ({ request }) => {
    const res = await request.get(asset);
    expect(res.status(), `${asset} returned ${res.status()}`).toBeLessThan(400);
  });
}

test('homepage loads all CSS/JS without 404s', async ({ page }) => {
  const failed: string[] = [];
  page.on('response', (res) => {
    const url = res.url();
    const status = res.status();
    if (
      status === 404 &&
      (url.endsWith('.css') || url.endsWith('.js') || url.includes('/assets/'))
    ) {
      failed.push(`${status} ${url}`);
    }
  });
  await page.goto('/');
  await page.waitForLoadState('networkidle').catch(() => {});
  expect(failed, 'expected no 404s for CSS/JS/asset paths').toEqual([]);
});
