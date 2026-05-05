/**
 * 301/302 redirects editor.
 *
 * Stored in Firebase at `pages/redirects` (so the admin form has a draft path
 * + history snapshots). On Publish, `dev/api/redirects.php` writes the rules
 * to `dev/redirects.json` + `prod/redirects.json`, which `dev/router.php`
 * (dev) and `prod/router-redirects.php` (prod) read on every request.
 *
 * Validation runs server-side: rejects rules where from is empty / doesn't start
 * with /, where to is empty, status outside {301, 302, 307, 308}, duplicate
 * `from` paths, or redirect cycles (depth > 3).
 */
/* `parentKey: '_root'` makes the field write directly to `data.rules` — which
   is what `dev/api/redirects.php` reads from `body.rules`. Without this, the
   form would write to `data.rules.rules` (a nested path) while the endpoint
   would never see the user's edits. */
const REDIRECTS_SECTIONS = [
  { key: 'rulesEditor', label: '301 / 302 Redirects', parentKey: '_root', fields: [
    { key: 'rules', label: 'Redirect rules', type: 'redirect-rules',
      help: 'Each rule maps an old URL path to a new URL. "Exact" matches only the literal path; uncheck to match any path that starts with "From".' },
  ]},
];

export const fbPath  = 'pages/redirects';
export const sections = REDIRECTS_SECTIONS;
export const defaults = {
  rules: [],
};
