/**
 * Covers: TC-A11Y-001 through TC-A11Y-021
 *
 * Run axe on every public route. The site has a known baseline of
 * color-contrast and aria-required-children violations — those are
 * documented in KNOWN_BASELINE so the suite catches NEW regressions
 * without blocking on pre-existing issues.
 *
 * To track those baseline findings, see KNOWN_BASELINE below. Fix one,
 * remove its rule from the allowlist, and the suite will start enforcing it.
 */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { ALL_ROUTES } from '../data/routes';
import { installZohoMock } from '../fixtures/zoho-mock';

const KNOWN_BASELINE: Record<string, string[]> = {
  // Color contrast on hero pills, footer text, etc. — design refresh needed.
  color: ['color-contrast'],
  // Logo marquee uses role=list without expected list children semantics
  aria: ['aria-required-children'],
};

const BASELINE_RULES = new Set(Object.values(KNOWN_BASELINE).flat());

for (const route of ALL_ROUTES) {
  test(`a11y: ${route.path} — no NEW serious/critical violations`, async ({ page }) => {
    await installZohoMock(page);
    await page.goto(route.path, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    const blocking = results.violations.filter(
      (v) =>
        (v.impact === 'serious' || v.impact === 'critical') &&
        !BASELINE_RULES.has(v.id)
    );

    const baselineHits = results.violations.filter(
      (v) =>
        (v.impact === 'serious' || v.impact === 'critical') &&
        BASELINE_RULES.has(v.id)
    );

    if (baselineHits.length) {
      console.log(
        `[a11y baseline] ${route.path} — ${baselineHits.length} known issue(s):\n` +
          baselineHits.map((v) => `  • ${v.id} (${v.impact})`).join('\n')
      );
    }
    if (blocking.length) {
      console.log(
        `[a11y REGRESSION] ${route.path} — ${blocking.length} NEW violation(s):\n` +
          blocking
            .map((v) => `  • ${v.id} (${v.impact}): ${v.help}\n     ${v.helpUrl}`)
            .join('\n')
      );
    }

    expect(blocking, `NEW serious/critical a11y violations on ${route.path}`).toEqual([]);
  });
}
