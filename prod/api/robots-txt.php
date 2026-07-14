<?php
/**
 * Generates and writes robots.txt from the structured rules editor.
 *
 * POST /api/robots-txt.php
 * Headers: Authorization: Bearer <firebase-id-token>
 * Body:    {
 *   "rules": [{userAgent, allow:[], disallow:[], crawlDelay?}, ...],
 *   "sitemapUrls": ["https://…/sitemap.xml", ...],
 *   "allowAiBots": true|false,
 *   "rawOverride": "" | "<raw robots.txt content>"
 * }
 *
 * Response: { status, written: ["dev/robots.txt", "prod/robots.txt"], preview }
 *
 * Behaviour:
 *   - If rawOverride is non-empty, write that verbatim.
 *   - Otherwise, build robots.txt from the structured rules:
 *       1. Sitemap: lines (top)
 *       2. One block per rule: User-agent + Allow + Disallow + Crawl-delay
 *       3. AI bot allowlist appended (Allow: / when allowAiBots=true,
 *          Disallow: / when false)
 *   - Write both `dev/robots.txt` + `prod/robots.txt`.
 *   - Backup previous file as `*.bak` for rollback.
 *   - Respect a "site-killer" guard: if any rule has User-agent: * + Disallow: /,
 *     require a `confirm: true` flag in the request body. Without it, return 409.
 */

header('Content-Type: application/json');

// ── CORS (matches existing endpoints) ──
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed = ['http://localhost', 'http://localhost:8082', 'http://localhost:8083', 'https://www.panasatech.com'];
$originAllowed = false;
foreach ($allowed as $a) {
    if (str_starts_with($origin, $a)) {
        header("Access-Control-Allow-Origin: $origin");
        $originAllowed = true;
        break;
    }
}
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    exit;
}
if (!$originAllowed && !empty($origin)) {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Forbidden origin']);
    exit;
}

// ── Firebase auth + role verification ──
// Site-wide robots.txt affects crawlability/SEO for the whole site — restricted
// to superadmin/approver, same as any other publish-affecting action.
require_once __DIR__ . '/_auth.php';
$auth = requireActiveUser(['superadmin', 'approver']);
$idToken = $auth['idToken'];

// ── Parse body ──
$body = json_decode(file_get_contents('php://input'), true);
if (!is_array($body)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Invalid request body']);
    exit;
}

$rules        = is_array($body['rules'] ?? null) ? $body['rules'] : [];
$sitemapUrls  = is_array($body['sitemapUrls'] ?? null) ? $body['sitemapUrls'] : [];
$allowAiBots  = !empty($body['allowAiBots']);
$rawOverride  = is_string($body['rawOverride'] ?? null) ? trim($body['rawOverride']) : '';
$confirm      = !empty($body['confirm']);

// ── Build robots.txt ──
$content = $rawOverride !== '' ? $rawOverride : buildRobotsTxt($rules, $sitemapUrls, $allowAiBots);

// ── Site-killer guard ──
if (!$confirm && wouldDisallowAll($content)) {
    http_response_code(409);
    echo json_encode([
        'status' => 'error',
        'code'   => 'NEEDS_CONFIRM',
        'message' => 'These rules would Disallow: / for User-agent: * — Google will deindex the entire site. Re-submit with {"confirm": true} to proceed.',
        'preview' => $content,
    ]);
    exit;
}

// ── Write files (with backup) ──
$devDir  = realpath(__DIR__ . '/..');
$projectRoot = dirname($devDir);
$prodDir = is_dir($projectRoot . '/prod') ? $projectRoot . '/prod' : null;

$written = [];
$paths   = [$devDir . '/robots.txt'];
if ($prodDir) $paths[] = $prodDir . '/robots.txt';

foreach ($paths as $p) {
    if (file_exists($p)) @copy($p, $p . '.bak');
    if (file_put_contents($p, $content, LOCK_EX) !== false) {
        $rel = str_replace([$devDir, (string)$prodDir], ['dev', 'prod'], $p);
        $written[] = $rel;
    }
}

echo json_encode([
    'status'  => 'success',
    'written' => $written,
    'preview' => $content,
]);

// ───────────────────────── Helpers ─────────────────────────

/**
 * AI-training crawlers — allowed-by-default with explicit Allow: /, or blocked
 * with Disallow: / when allowAiBots is false.
 */
function aiBots(): array {
    return [
        'GPTBot', 'ClaudeBot', 'Google-Extended', 'PerplexityBot',
        'Applebot-Extended', 'Bytespider', 'CCBot',
    ];
}

function buildRobotsTxt(array $rules, array $sitemapUrls, bool $allowAi): string {
    $lines = [];

    // Sitemap declarations at the top
    foreach ($sitemapUrls as $u) {
        $u = trim((string)$u);
        if ($u !== '') $lines[] = 'Sitemap: ' . $u;
    }
    if (!empty($lines)) $lines[] = '';

    // User-defined rules (skip empties)
    foreach ($rules as $rule) {
        $ua = trim((string)($rule['userAgent'] ?? ''));
        if ($ua === '') continue;
        $lines[] = 'User-agent: ' . $ua;
        $allow = is_array($rule['allow'] ?? null) ? $rule['allow'] : [];
        $disallow = is_array($rule['disallow'] ?? null) ? $rule['disallow'] : [];
        foreach ($allow    as $p) { $p = trim((string)$p); if ($p !== '') $lines[] = 'Allow: ' . $p; }
        foreach ($disallow as $p) { $p = trim((string)$p); if ($p !== '') $lines[] = 'Disallow: ' . $p; }
        $crawl = trim((string)($rule['crawlDelay'] ?? ''));
        if ($crawl !== '' && is_numeric($crawl)) $lines[] = 'Crawl-delay: ' . $crawl;
        $lines[] = '';
    }

    // AI bot allowlist
    foreach (aiBots() as $bot) {
        $lines[] = 'User-agent: ' . $bot;
        $lines[] = $allowAi ? 'Allow: /' : 'Disallow: /';
        $lines[] = '';
    }

    return rtrim(implode("\n", $lines)) . "\n";
}

/**
 * Detect whether the generated content would deindex the entire site
 * (User-agent: * + Disallow: /).
 */
function wouldDisallowAll(string $content): bool {
    $lines = preg_split('/\r?\n/', $content);
    $inStarBlock = false;
    foreach ($lines as $line) {
        $t = trim($line);
        if (stripos($t, 'User-agent:') === 0) {
            $ua = trim(substr($t, strlen('User-agent:')));
            $inStarBlock = ($ua === '*');
            continue;
        }
        if ($inStarBlock && preg_match('/^Disallow:\s*\/\s*$/i', $t)) {
            return true;
        }
    }
    return false;
}
