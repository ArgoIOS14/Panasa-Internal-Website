<?php
/**
 * Bulk re-render every static page from the current Site SEO settings.
 *
 * Called when the admin publishes the Site SEO page (so site-wide changes
 * — GA4 ID, verification tags, OG defaults, Org JSON-LD — propagate to all
 * 11 static pages without the editor having to publish each page individually).
 *
 * POST /api/rebuild-all.php
 * Headers: Authorization: Bearer <firebase-id-token>
 * Body:    {} (the Site SEO data is fetched from Firebase server-side)
 *
 * Response: { status, total, succeeded, failed, durations: [...], results: [...] }
 *
 * Strategy:
 *   For each page in PageRegistry::allKeys() (the static pages, excluding articles):
 *     - Read the current dev/<htmlFile>
 *     - Apply SiteSeoApplier::apply()
 *     - For meta-tier pages, apply MetaUpdater::update() with the page's saved meta
 *     - Apply StructuredDataApplier::apply() with the page's saved structuredData
 *     - Validate, write to dev + prod
 * Articles are NOT re-rendered here — too expensive + each article has its own template path.
 * Editors who want articles re-rendered with fresh site SEO can re-publish them individually.
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
// Republishes every static page on the site — same bar as a single publish.
require_once __DIR__ . '/_auth.php';
$auth = requireActiveUser(['superadmin', 'approver']);
$idToken = $auth['idToken'];

// ── Load chain ──
require_once __DIR__ . '/rebuild/PageRegistry.php';
require_once __DIR__ . '/rebuild/MetaUpdater.php';
require_once __DIR__ . '/rebuild/SiteSeoApplier.php';
require_once __DIR__ . '/rebuild/StructuredDataApplier.php';

$devDir  = realpath(__DIR__ . '/..');
$prodDir = realpath(__DIR__ . '/../../prod');

/** Fetch a Firebase RTDB node using the caller's ID token. Returns [] on failure. */
function fbGet(string $path, string $idToken): array {
    $url = 'https://panasa-cms-ad3f9-default-rtdb.europe-west1.firebasedatabase.app/' . ltrim($path, '/') . '.json'
         . '?auth=' . urlencode($idToken);
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 5,
    ]);
    $resp = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    if ($code !== 200 || !$resp) return [];
    $data = json_decode($resp, true);
    return is_array($data) ? $data : [];
}

$siteSEO = fbGet('pages/siteSEO', $idToken);

$results   = [];
$succeeded = 0;
$failed    = 0;

foreach (PageRegistry::allKeys() as $pageKey) {
    $rowStart = microtime(true);
    try {
        $cfg = PageRegistry::get($pageKey);
        $htmlFile = $cfg['htmlFile'];
        $devHtmlPath = $devDir . '/' . $htmlFile;
        if (!file_exists($devHtmlPath)) {
            $results[] = ['page' => $pageKey, 'status' => 'skipped', 'reason' => 'HTML file not found'];
            continue;
        }
        $html = file_get_contents($devHtmlPath);
        if ($html === false) throw new RuntimeException('Failed to read ' . $htmlFile);

        // Apply chain — same order as rebuild.php
        if (!empty($siteSEO)) $html = SiteSeoApplier::apply($html, $siteSEO);

        $pageData = fbGet($cfg['fbPath'], $idToken);
        $meta = is_array($pageData['meta'] ?? null) ? $pageData['meta'] : [];
        if (!empty($meta)) $html = MetaUpdater::update($html, $meta);

        $structuredData = is_array($pageData['structuredData'] ?? null) ? $pageData['structuredData'] : [];
        $canonical = $meta['canonical'] ?? '';
        $html = StructuredDataApplier::apply($html, $structuredData, $canonical);

        // Backup + write dev
        @copy($devHtmlPath, $devHtmlPath . '.bak');
        file_put_contents($devHtmlPath, $html, LOCK_EX);

        // Mirror to prod if it exists
        $prodHtmlPath = $prodDir ? $prodDir . '/' . $htmlFile : null;
        if ($prodHtmlPath && file_exists(dirname($prodHtmlPath))) {
            @copy($prodHtmlPath, $prodHtmlPath . '.bak');
            file_put_contents($prodHtmlPath, $html, LOCK_EX);
        }

        $duration = round((microtime(true) - $rowStart) * 1000);
        $results[] = ['page' => $pageKey, 'status' => 'success', 'duration_ms' => $duration];
        $succeeded++;
    } catch (Throwable $e) {
        $results[] = ['page' => $pageKey, 'status' => 'error', 'message' => $e->getMessage()];
        $failed++;
    }
}

$totalMs = round((microtime(true) - $startTime) * 1000);
echo json_encode([
    'status'      => 'success',
    'total'       => count($results),
    'succeeded'   => $succeeded,
    'failed'      => $failed,
    'duration_ms' => $totalMs,
    'results'     => $results,
]);
