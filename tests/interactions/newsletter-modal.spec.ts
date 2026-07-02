/**
 * Covers: TC-NEWS-001 through TC-NEWS-024
 *
 * Site-wide "Payments Deconstructed" newsletter modal.
 *
 * The module under test:   dev/js/Home scenes/components/newsletter-modal.js
 * Stylesheet:              dev/css/newsletter-modal.css (lazy-loaded by the module)
 *
 * Critical fix being regression-tested: the lazy stylesheet href MUST resolve
 * to the absolute `/css/newsletter-modal.css` regardless of page depth. The
 * previous bug used the page-relative path `'css/newsletter-modal.css'` which
 * resolved to `/blog/css/...` on a blog sub-page (404 → unstyled modal).
 *
 * Tests run against every page type that imports the footer:
 *   - root          (/, /resources, /about, /services, etc.)
 *   - blogs         (/blog/<slug>)
 *   - insights      (/insights/<slug>)
 *   - guides        (/guides/<slug>)
 *   - case-studies  (/case-studies/<slug>)
 */
import { test, expect, type Page } from '@playwright/test';
import { installZohoMock } from '../fixtures/zoho-mock';

// One sample page per depth-bucket. The CSS resolution bug is depth-dependent,
// not page-dependent, so one sample per bucket covers the bug surface. The
// full sub-page sweep is run in TC-NEWS-005..016 separately.
const SAMPLE_PAGES = [
  { label: 'homepage',     path: '/' },
  { label: 'resources hub', path: '/resources' },
  { label: 'blog',         path: '/blog/anatomy-of-a-swipe' },
  { label: 'insights',     path: '/insights/lifecycle-of-a-payment' },
  { label: 'guides',       path: '/guides/complete-guide-to-interchange-fees' },
  { label: 'case-studies', path: '/case-studies/open-banking-youth-banking-platform' },
];

// Full list for the per-page styling sweep (TC-NEWS-005..016)
const ALL_ARTICLE_PAGES = [
  // Blogs
  '/blog/anatomy-of-a-swipe',
  '/blog/3d-secure-authentication-card-program',
  '/blog/card-controls-fraud-prevention',
  // Insights
  '/insights/lifecycle-of-a-payment',
  '/insights/embedded-finance-real-card-issuing-market',
  '/insights/five-things-card-program-migration',
  // Guides
  '/guides/complete-guide-to-interchange-fees',
  '/guides/card-lifecycle-management',
  // Case studies (Osper deliberately excluded — retired in commit bf4e670)
  '/case-studies/open-banking-youth-banking-platform',
  '/case-studies/flexible-card-issuance-platform-issuer-processor',
  '/case-studies/3d-secure-authentication-issuer-processor',
  '/case-studies/operations-backbone-global-issuer-processor',
];

// Wait for the rebuilt footer (rendered by footer.js after data load) to
// contain the dynamic Newsletter link with href="#newsletter".
const waitForFooterNewsletterLink = async (page: Page) => {
  const link = page.locator('footer a, .site-footer a').filter({ hasText: /^\s*Newsletter/ });
  await expect(link).toBeVisible({ timeout: 10_000 });
  // Confirm the href is one of the trigger forms accepted by isTriggerEl:
  // `#newsletter` (set by Home page content data) or any value ending in
  // `#newsletter` (set by per-page resolvers that prepend a path).
  await expect(link).toHaveAttribute('href', /#newsletter$/);
  return link;
};

const openModalFromFooter = async (page: Page) => {
  const link = await waitForFooterNewsletterLink(page);
  await link.click();
  const modal = page.locator('.newsletter-modal');
  await expect(modal).toHaveClass(/is-open/);
  return modal;
};

test.beforeEach(async ({ context }) => {
  // Isolate state across tests — STORAGE_KEY is 'panasa_newsletter_subscribed'.
  await context.addInitScript(() => {
    try {
      localStorage.clear();
    } catch {}
  });
});

/* ─────────────────────────────────────────────────────────────────────────
   Group A — Module-level CSS resolution (the regression we're protecting)
   ─────────────────────────────────────────────────────────────────────── */

test.describe('CSS resolution — must NOT use page-relative path', () => {
  for (const { label, path } of SAMPLE_PAGES) {
    test(`TC-NEWS-001..004: CSS link absolute on ${label}`, async ({ page }) => {
      await installZohoMock(page);
      await page.goto(path);
      await openModalFromFooter(page);

      const cssHref = await page.evaluate(() =>
        document.querySelector<HTMLLinkElement>('link[data-newsletter-modal-css]')?.href ?? null
      );

      expect(cssHref, 'lazy stylesheet was not injected').not.toBeNull();
      // The previous bug shape — must NOT happen:
      expect(cssHref, 'CSS resolved as page-relative path (regression)')
        .not.toMatch(/\/(blog|insights|guides|case-studies)\/css\//);
      // Positive assertion:
      expect(cssHref).toMatch(/\/css\/newsletter-modal\.css$/);
    });
  }
});

/* ─────────────────────────────────────────────────────────────────────────
   Group B — Modal renders fully styled across every article page
   ─────────────────────────────────────────────────────────────────────── */

test.describe('Modal renders styled on every article page', () => {
  for (const path of ALL_ARTICLE_PAGES) {
    test(`TC-NEWS-005..016: styled modal on ${path}`, async ({ page }) => {
      await installZohoMock(page);
      await page.goto(path);
      const modal = await openModalFromFooter(page);

      // These CSS values come from newsletter-modal.css. If the stylesheet
      // failed to load, the defaults would be `static`/transparent/full-width.
      await expect(modal).toHaveCSS('position', 'fixed');
      await expect(modal).toHaveCSS('z-index', '1000');

      const card = modal.locator('.newsletter-modal__card');
      await expect(card).toBeVisible();
      const cardBox = await card.boundingBox();
      expect(cardBox?.width, 'card collapsed to full viewport (CSS missing)')
        .toBeLessThanOrEqual(520);
      expect(cardBox?.width).toBeGreaterThan(0);

      // Sanity: title + form controls render
      await expect(modal.locator('.newsletter-modal__title')).toContainText(/Payments Deconstructed/i);
      await expect(modal.locator('.newsletter-modal__input')).toBeVisible();
      await expect(modal.locator('.newsletter-modal__submit')).toBeVisible();
    });
  }
});

/* ─────────────────────────────────────────────────────────────────────────
   Group B2 — Envelope visual image MUST load on every depth bucket
   The same bug shape as the CSS path: `assets/newsletter-visual.webp`
   resolves page-relative without `import.meta.url`, so it 404s on sub-pages
   and the modal opens with an empty top half (no graphic).
   ─────────────────────────────────────────────────────────────────────── */

test.describe('Envelope visual asset loads on every page depth', () => {
  for (const { label, path } of SAMPLE_PAGES) {
    test(`TC-NEWS-025: envelope visual loads on ${label}`, async ({ page }) => {
      await installZohoMock(page);
      await page.goto(path);
      await openModalFromFooter(page);

      const img = page.locator('.newsletter-modal__visual-img');
      await expect(img).toBeVisible();

      const meta = await img.evaluate((el: HTMLImageElement) => ({
        src: el.src,
        complete: el.complete,
        naturalWidth: el.naturalWidth,
      }));

      // Must not have resolved page-relative (the bug shape)
      expect(meta.src, 'image resolved page-relative (regression)')
        .not.toMatch(/\/(blog|insights|guides|case-studies)\/assets\//);
      // Must end at the canonical absolute path
      expect(meta.src).toMatch(/\/assets\/newsletter-visual\.webp$/);
      // Must have actually decoded (404 → naturalWidth = 0)
      expect(meta.complete, 'image did not finish loading').toBe(true);
      expect(meta.naturalWidth, 'image natural width is 0 — 404 or decode error')
        .toBeGreaterThan(0);
    });
  }
});

/* ─────────────────────────────────────────────────────────────────────────
   Group C — Dismissal mechanisms (close X, overlay click, Escape)
   ─────────────────────────────────────────────────────────────────────── */

test.describe('Dismissal — three independent close paths', () => {
  test('TC-NEWS-017: close button (X) closes the modal', async ({ page }) => {
    await installZohoMock(page);
    await page.goto('/');
    const modal = await openModalFromFooter(page);

    await modal.locator('.newsletter-modal__close').click();
    await expect(modal).not.toHaveClass(/is-open/);
  });

  test('TC-NEWS-018: clicking overlay (outside card) closes the modal', async ({ page }) => {
    await installZohoMock(page);
    await page.goto('/');
    const modal = await openModalFromFooter(page);

    // Click the overlay below the card. The QA banner intercepts pointer events
    // at the very top of the viewport, and the card is centered, so the bottom
    // strip of the overlay is a safe target. Use a viewport-relative position
    // by computing it from the modal element box.
    const modalBox = await modal.boundingBox();
    expect(modalBox).not.toBeNull();
    // Bottom-edge of the modal overlay, comfortably below the card.
    await modal.click({
      position: { x: 20, y: (modalBox!.height ?? 600) - 20 },
      force: true,
    });
    await expect(modal).not.toHaveClass(/is-open/);
  });

  test('TC-NEWS-019: Escape key closes the modal', async ({ page }) => {
    await installZohoMock(page);
    await page.goto('/');
    const modal = await openModalFromFooter(page);

    await page.keyboard.press('Escape');
    await expect(modal).not.toHaveClass(/is-open/);
  });
});

/* ─────────────────────────────────────────────────────────────────────────
   Group D — Email validation
   ─────────────────────────────────────────────────────────────────────── */

test.describe('Email validation', () => {
  test('TC-NEWS-020: invalid email triggers error state, modal stays open', async ({ page }) => {
    await installZohoMock(page);
    await page.goto('/');
    const modal = await openModalFromFooter(page);

    const input = modal.locator('.newsletter-modal__input');
    await input.fill('not-an-email');
    await modal.locator('.newsletter-modal__submit').click();

    // Modal stays open — submission was rejected client-side.
    await expect(modal).toHaveClass(/is-open/);
    // Some form of error feedback present: either error class on input or
    // visible status message.
    const inputErrorClass = await input.evaluate((el) => el.classList.contains('is-error'));
    const statusText = (await modal.locator('.newsletter-modal__status').textContent()) || '';
    expect(inputErrorClass || statusText.length > 0,
      'no error feedback after invalid email submit').toBeTruthy();
  });

  test('TC-NEWS-021: empty email submit does not call the proxy', async ({ page }) => {
    const mock = await installZohoMock(page);
    await page.goto('/');
    const modal = await openModalFromFooter(page);

    await modal.locator('.newsletter-modal__submit').click();
    // small grace period for any async submission
    await page.waitForTimeout(300);
    expect(mock.calls.length, 'proxy hit despite empty input').toBe(0);
  });

  test('TC-NEWS-022: valid email POSTs to /api/zoho-email-proxy.php', async ({ page }) => {
    const mock = await installZohoMock(page, 'success');
    await page.goto('/');
    const modal = await openModalFromFooter(page);

    await modal.locator('.newsletter-modal__input').fill('qa@example.com');
    await modal.locator('.newsletter-modal__submit').click();

    // Either the success state shows or the proxy was hit — assert the proxy hit.
    await expect.poll(() => mock.calls.length, { timeout: 5_000 }).toBeGreaterThanOrEqual(1);
    expect(mock.calls[0].url).toContain('/api/zoho-email-proxy.php');
    const body = mock.calls[0].postData as { email?: string };
    expect(body.email).toBe('qa@example.com');
  });
});

/* ─────────────────────────────────────────────────────────────────────────
   Group E — localStorage persistence after successful subscribe
   ─────────────────────────────────────────────────────────────────────── */

test.describe('Post-subscribe persistence', () => {
  test('TC-NEWS-023: storage key is written on successful submit', async ({ page }) => {
    const mock = await installZohoMock(page, 'success');
    await page.goto('/');
    const modal = await openModalFromFooter(page);

    await modal.locator('.newsletter-modal__input').fill('qa@example.com');
    await modal.locator('.newsletter-modal__submit').click();
    await expect.poll(() => mock.calls.length, { timeout: 5_000 }).toBeGreaterThanOrEqual(1);

    // Give the success branch time to run, then check storage was written.
    await page.waitForTimeout(500);
    const stored = await page.evaluate(() => localStorage.getItem('panasa_newsletter_subscribed'));
    expect(stored, 'expected post-subscribe storage flag to be written').not.toBeNull();
  });

  test('TC-NEWS-024: pre-seeded subscribed flag does not block reopen by user click', async ({ page, context }) => {
    // After subscribing once, the storage key exists. The user clicking the
    // Newsletter link explicitly should still open the modal (it's not an
    // auto-popup — it's a user-triggered overlay). This guards against an
    // over-eager "subscribed → never show again" suppression.
    await context.addInitScript(() => {
      localStorage.setItem('panasa_newsletter_subscribed', String(Date.now()));
    });
    await installZohoMock(page);
    await page.goto('/');
    const modal = await openModalFromFooter(page);
    await expect(modal).toHaveClass(/is-open/);
  });
});
