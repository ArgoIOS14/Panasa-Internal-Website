/**
 * Catch-all for every /api/* PHP endpoint that has no Netlify port — i.e.
 * everything except /api/upload.php, which has its own real function
 * (see upload.js). Netlify has no PHP runtime, so these can never execute
 * here.
 *
 * This has to be a Function, not a plain redirect to a static HTML page.
 * Netlify's built-in Forms feature intercepts POST requests before a
 * static-asset redirect is served, returning its own generic
 * "Bad request, missing form" (confirmed via direct testing — this fires
 * even for a real JSON body with a Bearer token, i.e. exactly what the
 * admin UI sends). Routing through a Function instead sidesteps Forms
 * entirely, the same way upload.js already does for /api/upload.php.
 *
 * GET/HEAD (someone browsing the URL directly) gets a friendly HTML page,
 * matching the previous static qa-api-disabled.html. POST (what the admin
 * UI actually sends) gets a JSON `{status, message}` body — the shape
 * every admin JS call site already expects from the real PHP endpoints,
 * so the UI shows a clear message instead of choking on Netlify's form
 * error text.
 */

const DISABLED_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex,nofollow" />
    <title>API disabled on QA</title>
    <style>
      body{font:14px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Inter,sans-serif;margin:0;background:#fff7ed;color:#7c2d12;display:grid;place-items:center;min-height:100vh;padding:24px;text-align:center}
      .card{max-width:520px;background:#fef3c7;border-radius:14px;padding:28px 28px;border:1px solid #fde68a}
      h1{margin:0 0 10px;font-size:18px;letter-spacing:0.02em}
      p{margin:6px 0 0}
      a{color:#7c2d12;text-decoration:underline}
    </style>
  </head>
  <body>
    <div class="card">
      <h1>API endpoint not available on QA</h1>
      <p>This is the Panasa QA build. PHP endpoints under <code>/api/</code> only exist on the production SiteGround host and localhost.</p>
      <p>To test the contact form end-to-end, use <a href="https://www.panasatech.com/contact">www.panasatech.com</a>.</p>
    </div>
  </body>
</html>
`;

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
      body: '',
    };
  }

  if (event.httpMethod === 'GET' || event.httpMethod === 'HEAD') {
    return {
      statusCode: 404,
      headers: { 'Content-Type': 'text/html; charset=UTF-8', 'X-Robots-Tag': 'noindex, nofollow' },
      body: DISABLED_HTML,
    };
  }

  const isRebuild = event.path.includes('rebuild');
  const message = isRebuild
    ? "Static rebuild isn't supported on the QA preview — Netlify has no PHP runtime to bake HTML into the page. Your change is saved and live in Firebase (the live preview panel reflects it), but the static page itself only updates on a real Netlify deploy, or on production/localhost."
    : 'This API endpoint has no runtime on the QA preview build (Netlify has no PHP). It only works on production (SiteGround) or localhost.';

  return {
    statusCode: 400,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'error', message }),
  };
};
