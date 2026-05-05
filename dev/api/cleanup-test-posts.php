<?php
/**
 * One-off purger for test/junk articles created while exercising the admin.
 * Removes the local artefacts (HTML / JSON / default.js / .bak) under both
 * dev/ and prod/, regenerates the articles-index + sitemap, and returns the
 * list of slugs whose Firebase entries the client SDK should also remove.
 *
 * POST /api/cleanup-test-posts.php
 * Headers: Authorization: Bearer <firebase-id-token>
 * Body:    { "slugs": [ { "type": "case-studies", "slug": "case-stdy-sample" }, ... ] }
 *
 * Response: { "status": "success"|"error", "removed": [...], "skipped": [...], "regenerated": [...] }
 *
 * Auth: token is verified against Firebase. Caller-side gates this button to
 * superadmin/approver — server-side we accept any valid Firebase user (matches
 * the rebuild.php pattern; Firebase RTDB rules are the real authority for the
 * client-side node deletes that follow).
 */

$startTime = microtime(true);
header('Content-Type: application/json');

// ── CORS ──

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

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

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

// ── Firebase token verification ──

$authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
if (!str_starts_with($authHeader, 'Bearer ')) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Missing authorization token']);
    exit;
}

$idToken = substr($authHeader, 7);
$verifyUrl = "https://www.googleapis.com/identitytoolkit/v3/relyingparty/getAccountInfo?key=AIzaSyD4yz8pUs9nnozh61VOWJ9JVP8E1b489eY";
$ch = curl_init($verifyUrl);
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => json_encode(['idToken' => $idToken]),
    CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 10,
]);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

if ($httpCode !== 200) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Invalid or expired token']);
    exit;
}

$tokenData = json_decode($response, true);
if (empty($tokenData['users'][0]['localId'])) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Token verification failed']);
    exit;
}

// ── Parse body ──

$body = json_decode(file_get_contents('php://input'), true);
$entries = $body['slugs'] ?? null;
if (!is_array($entries) || empty($entries)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Body must include slugs: [{type, slug}, ...]']);
    exit;
}

// ── Type → URL prefix + JSON folder ──

$typeUrl = [
    'blog'         => 'blog',
    'insights'     => 'insights',
    'guides'       => 'guides',
    'case-studies' => 'case-studies',
];
$typeFolder = [
    'blog'         => 'Blog',
    'insights'     => 'Insights',
    'guides'       => 'Guide',
    'case-studies' => 'Case Studies',
];

require_once __DIR__ . '/rebuild/ArticleRebuilder.php';

$devDir  = dirname(__DIR__);
// Project structure mirrors dev/ → prod/ at the same parent. dev/api/ → ../../prod
$projectRoot = dirname($devDir);
$prodDir = is_dir($projectRoot . '/prod') ? $projectRoot . '/prod' : null;

$removed = [];
$skipped = [];
$cleanedFbSlugs = []; // [{type, slug}] — for client SDK to also remove the Firebase nodes.

foreach ($entries as $entry) {
    $type = $entry['type'] ?? '';
    $slug = $entry['slug'] ?? '';

    if (!isset($typeUrl[$type]) || !preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', (string)$slug)) {
        $skipped[] = ['type' => $type, 'slug' => $slug, 'reason' => 'invalid type or slug'];
        continue;
    }

    $urlFolder = $typeUrl[$type];
    $jsonFolder = $typeFolder[$type];

    $candidates = [
        $devDir . "/{$urlFolder}/{$slug}.html",
        $devDir . "/{$urlFolder}/{$slug}.html.bak",
        $devDir . "/content/{$jsonFolder}/{$slug}.json",
        $devDir . "/content/{$jsonFolder}/{$slug}.default.js",
    ];
    if ($prodDir) {
        $candidates[] = $prodDir . "/{$urlFolder}/{$slug}.html";
        $candidates[] = $prodDir . "/{$urlFolder}/{$slug}.html.bak";
        $candidates[] = $prodDir . "/content/{$jsonFolder}/{$slug}.json";
        $candidates[] = $prodDir . "/content/{$jsonFolder}/{$slug}.default.js";
    }

    foreach ($candidates as $path) {
        if (file_exists($path)) {
            if (@unlink($path)) {
                $removed[] = str_replace([$devDir, (string)$prodDir], ['dev', 'prod'], $path);
            } else {
                $skipped[] = ['type' => $type, 'slug' => $slug, 'reason' => 'unlink failed: ' . $path];
            }
        }
    }
    // Always include in the FB cleanup list — client SDK is the source of truth for FB.
    $cleanedFbSlugs[] = ['type' => $type, 'slug' => $slug];
}

// ── Regenerate articles-index + sitemap ──

$regenerated = [];
try {
    ArticleRebuilder::rebuildArticlesIndex($devDir, $prodDir);
    $regenerated[] = 'dev/content/Resources/articles-index.json';
    if ($prodDir) $regenerated[] = 'prod/content/Resources/articles-index.json';

    ArticleRebuilder::rebuildSitemap($devDir, $prodDir);
    $regenerated[] = 'dev/sitemap.xml';
    if ($prodDir) $regenerated[] = 'prod/sitemap.xml';
} catch (Throwable $e) {
    echo json_encode([
        'status'      => 'error',
        'message'     => 'Cleanup partial — file removal succeeded but regeneration failed: ' . $e->getMessage(),
        'removed'     => $removed,
        'skipped'     => $skipped,
        'regenerated' => $regenerated,
        'fbCleanup'   => $cleanedFbSlugs,
    ]);
    exit;
}

$durationMs = round((microtime(true) - $startTime) * 1000);

echo json_encode([
    'status'      => 'success',
    'removed'     => $removed,
    'skipped'     => $skipped,
    'regenerated' => $regenerated,
    'fbCleanup'   => $cleanedFbSlugs,
    'duration_ms' => $durationMs,
]);
