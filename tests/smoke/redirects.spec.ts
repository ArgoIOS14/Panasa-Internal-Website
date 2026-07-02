/**
 * Covers: TC-REDIR-001, TC-REDIR-002
 * The PHP router 301-redirects .html and .php URLs to clean paths.
 */
import { test, expect } from '@playwright/test';

test('/.html URL redirects to clean URL (301)', async ({ request }) => {
  const res = await request.get('/about.html', { maxRedirects: 0 });
  expect(res.status()).toBe(301);
  expect(res.headers()['location']).toBe('/about');
});

test('/contact.php URL redirects to clean URL (301)', async ({ request }) => {
  const res = await request.get('/contact.php', { maxRedirects: 0 });
  expect(res.status()).toBe(301);
  expect(res.headers()['location']).toBe('/contact');
});

test('unknown route returns 404', async ({ request }) => {
  const res = await request.get('/this-route-does-not-exist-xyz');
  expect(res.status()).toBe(404);
});

test('/api/zoho-proxy.php is NOT redirected (preserves POST body)', async ({ request }) => {
  // GET will return method-not-allowed or 500 (missing .env), but it should NOT 301
  const res = await request.get('/api/zoho-proxy.php', { maxRedirects: 0 });
  expect(res.status()).not.toBe(301);
});
