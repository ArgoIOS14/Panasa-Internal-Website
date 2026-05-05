/**
 * Robots.txt editor — structured rules with a live preview pane.
 *
 * Stored in Firebase at `pages/robotsTxt`. On Publish, the rules are serialised
 * into the actual robots.txt file via `dev/api/robots-txt.php` (auth-gated to
 * superadmin/approver). The endpoint writes both `dev/robots.txt` and
 * `prod/robots.txt`, with a `.bak` of the previous version for rollback.
 *
 * The advanced toggle ([⚙ Advanced]) reveals a `rawOverride` field — a raw
 * textarea that, when non-empty, takes precedence over the structured rules.
 * Useful for power users who want exact byte-level control of robots.txt.
 */
/* All sections use `parentKey: '_root'` so each field writes DIRECTLY to data
   root (data.rules, data.sitemapUrls, data.allowAiBots, data.rawOverride) —
   which matches the shape `dev/api/robots-txt.php` expects in the POST body.
   Without this, fields would write to data.<sectionKey>.<fieldKey> and the
   endpoint would never see the user's edits. */
const ROBOTS_TXT_SECTIONS = [
  { key: 'crawlerRules', label: 'Crawler Rules', parentKey: '_root', fields: [
    { key: 'rules', label: 'Per-user-agent rules', type: 'robots-rules',
      help: 'One block per crawler. Use * for all bots. Disallow paths take effect for crawls.' },
  ]},
  { key: 'sitemapDecls', label: 'Sitemap declarations', parentKey: '_root', fields: [
    { key: 'sitemapUrls', label: 'Sitemap URLs', type: 'string-list',
      help: 'Listed at the top of robots.txt. Defaults to https://www.panasatech.com/sitemap.xml.' },
  ]},
  { key: 'aiBotAllowlist', label: 'AI Bot Allowlist', parentKey: '_root', fields: [
    { key: 'allowAiBots', label: 'Allow AI training crawlers (GPTBot, ClaudeBot, Google-Extended, Perplexity, Applebot-Extended, Bytespider, CCBot)', type: 'toggle',
      help: 'Off = adds Disallow: / for all 7 AI bots. On = explicit Allow: / for them, plus your other rules apply normally.' },
  ]},
  /* The preview section is read-only and renders nothing into the published
     payload (the readback for robots-preview is a no-op). Kept under _root for
     consistency. */
  { key: 'previewSection', label: 'Generated robots.txt — preview', parentKey: '_root', fields: [
    { key: '__preview', label: 'This is what will be written on Publish:', type: 'robots-preview',
      help: 'Read-only preview. Save the page to refresh.' },
  ]},
  { key: 'rawOverrideSection', label: 'Raw override (advanced)', parentKey: '_root', fields: [
    { key: 'rawOverride', label: 'Raw robots.txt content', type: 'textarea',
      advancedOnly: true,
      help: 'When non-empty, this raw text REPLACES the generated rules above. Use only if you need byte-exact control. Leave blank to use the structured rules.' },
  ]},
];

export const fbPath  = 'pages/robotsTxt';
export const sections = ROBOTS_TXT_SECTIONS;
export const defaults = {
  rules: [
    { userAgent: '*', allow: ['/'], disallow: [], crawlDelay: '' },
  ],
  sitemapUrls: ['https://www.panasatech.com/sitemap.xml'],
  allowAiBots: true,
  rawOverride: '',
};
