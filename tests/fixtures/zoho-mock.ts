import type { Page, Route } from '@playwright/test';

export type ZohoMockMode = 'success' | 'server-error' | 'network-error';

/**
 * Intercepts the Zoho proxy endpoints so tests never hit the real CRM.
 * Covers both the contact form proxy and the email-capture popup proxy.
 */
export const installZohoMock = async (page: Page, mode: ZohoMockMode = 'success') => {
  const calls: { url: string; postData: unknown }[] = [];

  const handler = async (route: Route) => {
    let postData: unknown = null;
    try {
      postData = route.request().postDataJSON();
    } catch {
      postData = route.request().postData();
    }
    calls.push({ url: route.request().url(), postData });

    if (mode === 'network-error') {
      await route.abort('failed');
      return;
    }
    if (mode === 'server-error') {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'error', message: 'Mocked server error' }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'success', message: 'Mocked submit OK' }),
    });
  };

  await page.route('**/api/zoho-proxy.php', handler);
  await page.route('**/api/zoho-email-proxy.php', handler);

  return {
    calls,
    setMode: async (next: ZohoMockMode) => {
      await page.unroute('**/api/zoho-proxy.php');
      await page.unroute('**/api/zoho-email-proxy.php');
      await installZohoMock(page, next);
    },
  };
};
