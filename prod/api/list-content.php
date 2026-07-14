<?php
/**
 * Lists slugs of bundled content JSONs in dev/content/<Folder>/.
 * Used by the admin "Seed examples" button to know which articles to seed
 * into Firebase from the static bundle.
 *
 * GET /api/list-content.php?type=<blog|insights|guides|case-studies>
 * Headers: Authorization: Bearer <firebase-id-token>
 *
 * Response: { "type": "<type>", "folder": "<Folder>", "slugs": [...] }
 */

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
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    exit;
}

if (!$originAllowed && !empty($origin)) {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Forbidden origin']);
    exit;
}

// ── Firebase auth + active-user verification ──
require_once __DIR__ . '/_auth.php';
$auth = requireActiveUser();
$idToken = $auth['idToken'];

// ── Type → folder mapping ──

$type = $_GET['type'] ?? '';
$typeFolder = [
    'blog'         => 'Blog',
    'insights'     => 'Insights',
    'guides'       => 'Guide',
    'case-studies' => 'Case Studies',
];

if (!isset($typeFolder[$type])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Invalid or missing type. Allowed: ' . implode(', ', array_keys($typeFolder))]);
    exit;
}

$folder = $typeFolder[$type];

// dev directory is one level up from this file (api/ → ..)
$devDir = dirname(__DIR__);
$contentDir = $devDir . '/content/' . $folder;

if (!is_dir($contentDir)) {
    echo json_encode(['status' => 'success', 'type' => $type, 'folder' => $folder, 'slugs' => []]);
    exit;
}

$slugs = [];
$glob = glob($contentDir . '/*.json');
if ($glob) {
    foreach ($glob as $file) {
        $slug = basename($file, '.json');
        // Skip dotfiles or anything that doesn't look like a slug.
        if (preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $slug)) {
            $slugs[] = $slug;
        }
    }
    sort($slugs);
}

echo json_encode([
    'status' => 'success',
    'type'   => $type,
    'folder' => $folder,
    'slugs'  => $slugs,
]);
