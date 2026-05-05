<?php
/**
 * Static HTML rebuild endpoint for SEO.
 *
 * When admin publishes content, this endpoint updates the static HTML files
 * with fresh content baked in, so search engine crawlers see up-to-date content.
 *
 * POST /api/rebuild.php
 * Headers: Authorization: Bearer <firebase-id-token>
 * Body:    { "pageKey": "home", "data": { ... } }
 *
 * Response: { "status": "success"|"error", "rebuilt": [...], "duration_ms": N }
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
    jsonResponse('error', 'Method not allowed');
}

if (!$originAllowed && !empty($origin)) {
    http_response_code(403);
    jsonResponse('error', 'Forbidden origin');
}

// ── Firebase token verification ──

$authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
if (!str_starts_with($authHeader, 'Bearer ')) {
    http_response_code(401);
    jsonResponse('error', 'Missing authorization token');
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
// curl_close() omitted — deprecated in PHP 8.0+

if ($httpCode !== 200) {
    http_response_code(401);
    jsonResponse('error', 'Invalid or expired token');
}

$tokenData = json_decode($response, true);
if (empty($tokenData['users'][0]['localId'])) {
    http_response_code(401);
    jsonResponse('error', 'Token verification failed');
}

// ── Parse request body ──

$body = json_decode(file_get_contents('php://input'), true);
if (!$body || empty($body['pageKey'])) {
    http_response_code(400);
    jsonResponse('error', 'Missing pageKey in request body');
}

$pageKey = $body['pageKey'];
$data    = $body['data'] ?? null;
$action  = $body['action'] ?? null;

if ($action !== 'delete' && (!$data || !is_array($data))) {
    http_response_code(400);
    jsonResponse('error', 'Missing or invalid data in request body');
}

// ── Load modules ──

require_once __DIR__ . '/rebuild/PageRegistry.php';
require_once __DIR__ . '/rebuild/MetaUpdater.php';
require_once __DIR__ . '/rebuild/HtmlRebuilder.php';
require_once __DIR__ . '/rebuild/HomepageUpdater.php';
require_once __DIR__ . '/rebuild/ArticleRebuilder.php';
require_once __DIR__ . '/rebuild/SiteSeoApplier.php';
require_once __DIR__ . '/rebuild/StructuredDataApplier.php';

/**
 * Fetch the site-wide SEO settings node from Firebase RTDB using the caller's
 * already-validated ID token. Returns [] on missing or auth failure (the rebuild
 * should not fail just because site SEO isn't configured yet).
 */
function fetchSiteSEO(string $idToken): array {
    $url = 'https://panasa-cms-default-rtdb.europe-west1.firebasedatabase.app/pages/siteSEO.json'
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

// ── Validate page key ──

if (!PageRegistry::isValid($pageKey)) {
    http_response_code(400);
    jsonResponse('error', 'Unknown page key: ' . $pageKey);
}

$pageConfig = PageRegistry::get($pageKey);
$htmlFile   = $pageConfig['htmlFile'];
$tier       = $pageConfig['tier'];

// ── Resolve file paths ──

$devDir  = realpath(__DIR__ . '/..');
$prodDir = realpath(__DIR__ . '/../../prod');

$devHtmlPath  = $devDir  . '/' . $htmlFile;
$prodHtmlPath = $prodDir ? $prodDir . '/' . $htmlFile : null;

// ── Article path: handle separately and exit early ──
if (($pageConfig['type'] ?? null) === 'article') {
    handleArticleRebuild($pageConfig, $action, $data, $devDir, $prodDir, $startTime, $idToken);
    exit;
}

if (!file_exists($devHtmlPath)) {
    http_response_code(500);
    jsonResponse('error', 'HTML file not found: ' . $htmlFile);
}

// ── File locking to prevent concurrent writes ──

$lockDir = sys_get_temp_dir() . '/panasa_rebuild_locks/';
if (!is_dir($lockDir)) @mkdir($lockDir, 0755, true);

$lockFile = $lockDir . $pageKey . '.lock';
$lockFp   = fopen($lockFile, 'w');

if (!flock($lockFp, LOCK_EX | LOCK_NB)) {
    fclose($lockFp);
    http_response_code(409);
    jsonResponse('error', 'Rebuild already in progress for this page');
}

try {
    $rebuilt = [];

    // ── Read current HTML ──
    $html = file_get_contents($devHtmlPath);
    if ($html === false) {
        throw new RuntimeException('Failed to read ' . $devHtmlPath);
    }

    // ── Phase 1a: Apply site-wide SEO defaults (Twitter, OG locale, verification, analytics, Org JSON-LD)
    //              Runs BEFORE the per-page MetaUpdater so per-page values can override fallbacks. ──
    $siteSEO = fetchSiteSEO($idToken);
    if (!empty($siteSEO)) {
        $html = SiteSeoApplier::apply($html, $siteSEO);
    }

    // ── Phase 1b: Update per-page meta tags ──
    $meta = $data['meta'] ?? [];
    if (!empty($meta)) {
        $html = MetaUpdater::update($html, $meta);
    }

    // ── Phase 1c: Inject per-page Schema.org JSON-LD (BreadcrumbList, FAQPage, custom). ──
    $structuredData = $data['structuredData'] ?? [];
    $canonicalUrl   = $meta['canonical'] ?? '';
    $html = StructuredDataApplier::apply($html, $structuredData, $canonicalUrl);

    // ── Phase 2: Update body content (full-tier pages only) ──
    if ($tier === PageRegistry::TIER_FULL) {
        if ($pageKey === 'home') {
            $rebuilder = new HtmlRebuilder($html);
            $html = $rebuilder->rebuildHomepage($data);
        }
        // About page body rebuild can be added here when needed
    }

    // ── Phase 2.5: Validate rebuilt HTML before writing ──

    $originalHtml = file_get_contents($devHtmlPath);
    $validationErrors = validateRebuiltHtml($html, $originalHtml, $pageKey);

    if (!empty($validationErrors)) {
        // Rebuild produced corrupted HTML — reject the write, keep original safe
        flock($lockFp, LOCK_UN);
        fclose($lockFp);

        echo json_encode([
            'status'   => 'error',
            'message'  => 'Rebuild validation failed — original file preserved',
            'errors'   => $validationErrors,
        ]);
        exit;
    }

    // ── Phase 3: Write updated HTML (validation passed) ──

    // Create backup
    $backupPath = $devHtmlPath . '.bak';
    @copy($devHtmlPath, $backupPath);

    if (file_put_contents($devHtmlPath, $html, LOCK_EX) !== false) {
        $rebuilt[] = 'dev/' . $htmlFile;
    } else {
        throw new RuntimeException('Failed to write dev/' . $htmlFile);
    }

    // Write to prod/ if it exists
    if ($prodHtmlPath && is_dir(dirname($prodHtmlPath))) {
        @copy($prodHtmlPath, $prodHtmlPath . '.bak');
        if (file_put_contents($prodHtmlPath, $html, LOCK_EX) !== false) {
            $rebuilt[] = 'prod/' . $htmlFile;
        }
    }

    // ── Phase 4: Homepage-specific — regenerate default.js and content.json ──
    if ($pageKey === 'home') {
        $contentFiles = HomepageUpdater::update($data, $devDir, $prodDir ?: $devDir);
        foreach ($contentFiles as $f) {
            // Convert to relative path for response
            $rel = str_replace([$devDir . '/', ($prodDir ?: '') . '/'], ['dev/', 'prod/'], $f);
            $rebuilt[] = $rel;
        }
    }

    $durationMs = round((microtime(true) - $startTime) * 1000);

    flock($lockFp, LOCK_UN);
    fclose($lockFp);

    echo json_encode([
        'status'      => 'success',
        'rebuilt'     => $rebuilt,
        'duration_ms' => $durationMs,
    ]);
    exit;

} catch (Throwable $e) {
    flock($lockFp, LOCK_UN);
    fclose($lockFp);

    http_response_code(500);
    jsonResponse('error', 'Rebuild failed: ' . $e->getMessage());
}

// ── Helpers ──

function jsonResponse(string $status, string $message): void {
    echo json_encode(['status' => $status, 'message' => $message]);
    exit;
}

/**
 * Validate rebuilt HTML before writing to disk.
 * Returns an array of error messages. Empty = valid.
 */
function validateRebuiltHtml(string $newHtml, string $originalHtml, string $pageKey = ''): array {
    $errors = [];

    // 1. Must not be empty or too small
    if (strlen($newHtml) < 500) {
        $errors[] = 'Rebuilt HTML is suspiciously small (' . strlen($newHtml) . ' bytes)';
    }

    // 2. Must not shrink by more than 50% (indicates lost content)
    $originalSize = strlen($originalHtml);
    if ($originalSize > 0 && strlen($newHtml) < $originalSize * 0.5) {
        $errors[] = 'Rebuilt HTML lost too much content (' . strlen($newHtml) . ' vs original ' . $originalSize . ' bytes)';
    }

    // 3. Div tag balance — open divs must equal close divs
    $openDivs  = preg_match_all('/<div[\s>]/i', $newHtml);
    $closeDivs = substr_count($newHtml, '</div>');
    if ($openDivs !== $closeDivs) {
        $errors[] = "Unbalanced div tags: {$openDivs} open vs {$closeDivs} close";
    }

    // 4. Must still have essential structure
    $required = ['<html', '</html>', '<head', '</head>', '<body', '</body>', '<footer', '</footer>'];
    foreach ($required as $tag) {
        if (stripos($newHtml, $tag) === false) {
            $errors[] = "Missing essential tag: {$tag}";
        }
    }

    // 5. Key data attributes differ per page. Only check that attributes
    //    which existed in the ORIGINAL still exist in the new HTML.
    $keyAttrs = ['data-hero-title', 'data-services-slides', 'data-footer-cta-title',
                 'data-hero-cta-primary', 'data-case-slides', 'data-engagement-grid'];
    foreach ($keyAttrs as $attr) {
        // Only require the attribute if it existed in the original HTML
        if (strpos($originalHtml, $attr) !== false && strpos($newHtml, $attr) === false) {
            $errors[] = "Missing key attribute: {$attr}";
        }
    }

    // 6. Must not contain PHP errors or warnings in output
    if (preg_match('/<b>(Warning|Fatal|Parse error|Deprecated)<\/b>/i', $newHtml)) {
        $errors[] = 'HTML contains PHP error output';
    }

    return $errors;
}

/**
 * Article-specific handler.
 * Publish: render template, write HTML/JSON/JS, refresh index + sitemap.
 * Delete: remove all article files, refresh index + sitemap.
 */
function handleArticleRebuild(array $pageConfig, ?string $action, ?array $data, string $devDir, ?string $prodDir, float $startTime, string $idToken = ''): void {
    $type = $pageConfig['articleType'];
    $slug = $pageConfig['slug'];
    $htmlFile = $pageConfig['htmlFile'];
    $jsonFile = $pageConfig['jsonFile'];
    $jsFile   = $pageConfig['jsFile'];

    // Cross-cutting index lock to serialise concurrent article writes.
    $lockDir = sys_get_temp_dir() . '/panasa_rebuild_locks/';
    if (!is_dir($lockDir)) @mkdir($lockDir, 0755, true);
    $perKeyLockFile = $lockDir . str_replace([':', '/'], '_', $pageConfig['fbPath']) . '.lock';
    $perKeyLock = fopen($perKeyLockFile, 'w');
    if (!flock($perKeyLock, LOCK_EX | LOCK_NB)) {
        fclose($perKeyLock);
        http_response_code(409);
        jsonResponse('error', 'Rebuild already in progress for this article');
    }

    try {
        $rebuilt = [];

        // Ensure target directories exist (insights/ may not exist on first publish)
        @mkdir(dirname($devDir . '/' . $htmlFile), 0755, true);
        if ($prodDir) @mkdir(dirname($prodDir . '/' . $htmlFile), 0755, true);
        @mkdir(dirname($devDir . '/' . $jsonFile), 0755, true);
        if ($prodDir) @mkdir(dirname($prodDir . '/' . $jsonFile), 0755, true);

        if ($action === 'delete') {
            $paths = [$devDir . '/' . $htmlFile, $devDir . '/' . $jsonFile, $devDir . '/' . $jsFile];
            if ($prodDir) $paths = array_merge($paths, [$prodDir . '/' . $htmlFile, $prodDir . '/' . $jsonFile, $prodDir . '/' . $jsFile]);
            foreach ($paths as $p) {
                if (file_exists($p)) { @unlink($p); $rebuilt[] = 'deleted: ' . str_replace([$devDir, (string)$prodDir], ['dev', 'prod'], $p); }
            }
        } elseif ($action === 'preview') {
            // Preview: render template + write HTML/JSON/JS to dev only (no prod, no index, no sitemap)
            $tplPath = __DIR__ . "/../templates/{$type}.html";
            if (!file_exists($tplPath)) {
                throw new RuntimeException("Template not found: templates/{$type}.html");
            }
            $tpl = file_get_contents($tplPath);
            $html = ArticleRebuilder::renderTemplate($tpl, $data, $type, $slug);

            // SEO chain: site-wide defaults → per-page meta → structured data.
            // Article templates already substitute most per-page meta via {{TOKENS}}, so
            // MetaUpdater::update() is a no-op here for those tags but still handles
            // anything the template doesn't carry (keywords, robots, og:locale, etc.).
            $siteSEO = $idToken !== '' ? fetchSiteSEO($idToken) : [];
            if (!empty($siteSEO)) $html = SiteSeoApplier::apply($html, $siteSEO);
            if (!empty($data['meta']))           $html = MetaUpdater::update($html, $data['meta']);
            $canonical = $data['meta']['canonical'] ?? '';
            $html = StructuredDataApplier::apply($html, $data['structuredData'] ?? [], $canonical);

            file_put_contents($devDir . '/' . $htmlFile, $html, LOCK_EX);
            $rebuilt[] = 'dev/' . $htmlFile;

            $jsonStr = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            file_put_contents($devDir . '/' . $jsonFile, $jsonStr, LOCK_EX);
            $rebuilt[] = 'dev/' . $jsonFile;

            if ($type === 'guides') $varName = 'DEFAULT_GUIDE_CONTENT';
            elseif ($type === 'case-studies') $varName = 'DEFAULT_CASE_STUDY_CONTENT';
            else $varName = 'DEFAULT_BLOG_CONTENT';
            file_put_contents($devDir . '/' . $jsFile, "window.{$varName} = {$jsonStr};\n", LOCK_EX);
            $rebuilt[] = 'dev/' . $jsFile;

            flock($perKeyLock, LOCK_UN); fclose($perKeyLock);
            $durationMs = round((microtime(true) - $startTime) * 1000);
            echo json_encode(['status' => 'success', 'preview' => true, 'rebuilt' => $rebuilt, 'duration_ms' => $durationMs]);
            exit;
        } else {
            // Publish: render template
            $tplPath = __DIR__ . "/../templates/{$type}.html";
            if (!file_exists($tplPath)) {
                throw new RuntimeException("Template not found: templates/{$type}.html");
            }
            $tpl = file_get_contents($tplPath);
            $html = ArticleRebuilder::renderTemplate($tpl, $data, $type, $slug);

            // SEO chain: site-wide defaults → per-page meta → structured data.
            // Same chain as preview, just runs before validation + dev/prod write.
            $siteSEO = $idToken !== '' ? fetchSiteSEO($idToken) : [];
            if (!empty($siteSEO)) $html = SiteSeoApplier::apply($html, $siteSEO);
            if (!empty($data['meta']))           $html = MetaUpdater::update($html, $data['meta']);
            $canonical = $data['meta']['canonical'] ?? '';
            $html = StructuredDataApplier::apply($html, $data['structuredData'] ?? [], $canonical);

            // Validate
            $errors = validateRebuiltHtml($html, $tpl, $pageConfig['fbPath']);
            if (!empty($errors)) {
                flock($perKeyLock, LOCK_UN); fclose($perKeyLock);
                echo json_encode(['status' => 'error', 'message' => 'Article HTML validation failed', 'errors' => $errors]);
                exit;
            }

            // Backup if existing
            if (file_exists($devDir . '/' . $htmlFile)) @copy($devDir . '/' . $htmlFile, $devDir . '/' . $htmlFile . '.bak');
            file_put_contents($devDir . '/' . $htmlFile, $html, LOCK_EX);
            $rebuilt[] = 'dev/' . $htmlFile;
            if ($prodDir) {
                if (file_exists($prodDir . '/' . $htmlFile)) @copy($prodDir . '/' . $htmlFile, $prodDir . '/' . $htmlFile . '.bak');
                file_put_contents($prodDir . '/' . $htmlFile, $html, LOCK_EX);
                $rebuilt[] = 'prod/' . $htmlFile;
            }

            // JSON sidecar
            $jsonStr = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            file_put_contents($devDir . '/' . $jsonFile, $jsonStr, LOCK_EX);
            $rebuilt[] = 'dev/' . $jsonFile;
            if ($prodDir) {
                file_put_contents($prodDir . '/' . $jsonFile, $jsonStr, LOCK_EX);
                $rebuilt[] = 'prod/' . $jsonFile;
            }

            // default.js
            if ($type === 'guides') $varName = 'DEFAULT_GUIDE_CONTENT';
            elseif ($type === 'case-studies') $varName = 'DEFAULT_CASE_STUDY_CONTENT';
            else $varName = 'DEFAULT_BLOG_CONTENT';
            $jsStr = "window.{$varName} = {$jsonStr};\n";
            file_put_contents($devDir . '/' . $jsFile, $jsStr, LOCK_EX);
            $rebuilt[] = 'dev/' . $jsFile;
            if ($prodDir) {
                file_put_contents($prodDir . '/' . $jsFile, $jsStr, LOCK_EX);
                $rebuilt[] = 'prod/' . $jsFile;
            }
        }

        // Refresh cross-cutting articles index + sitemap
        $idxLockFile = $lockDir . '_articles_index.lock';
        $idxLock = fopen($idxLockFile, 'w');
        flock($idxLock, LOCK_EX);
        try {
            ArticleRebuilder::rebuildArticlesIndex($devDir, $prodDir);
            // Pass through any extra URLs configured in Site SEO so they show up
            // in sitemap.xml after the auto-generated entries.
            $siteSEO = $idToken !== '' ? fetchSiteSEO($idToken) : [];
            $extras = is_array($siteSEO['extraSitemapUrls'] ?? null) ? $siteSEO['extraSitemapUrls'] : [];
            ArticleRebuilder::rebuildSitemap($devDir, $prodDir, $extras);
        } finally {
            flock($idxLock, LOCK_UN);
            fclose($idxLock);
        }
        $rebuilt[] = 'dev/content/Resources/articles-index.json';
        $rebuilt[] = 'dev/sitemap.xml';

        flock($perKeyLock, LOCK_UN);
        fclose($perKeyLock);

        $durationMs = round((microtime(true) - $startTime) * 1000);
        echo json_encode(['status' => 'success', 'rebuilt' => $rebuilt, 'duration_ms' => $durationMs]);
    } catch (Throwable $e) {
        flock($perKeyLock, LOCK_UN);
        fclose($perKeyLock);
        http_response_code(500);
        jsonResponse('error', 'Article rebuild failed: ' . $e->getMessage());
    }
}
