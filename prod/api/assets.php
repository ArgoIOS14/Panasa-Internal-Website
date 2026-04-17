<?php
/**
 * Static assets listing endpoint for Panasa Admin CMS.
 * Lists all image files from /dev/assets/ (excluding uploads/).
 * Requires Firebase ID token in Authorization header.
 */

header('Content-Type: application/json');

// CORS
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed = ['http://localhost', 'http://localhost:8082', 'http://localhost:8083', 'https://www.panasatech.com'];
foreach ($allowed as $a) {
    if (str_starts_with($origin, $a)) {
        header("Access-Control-Allow-Origin: $origin");
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
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// ── Firebase token verification ──

$authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
if (!str_starts_with($authHeader, 'Bearer ')) {
    http_response_code(401);
    echo json_encode(['error' => 'Missing authorization token']);
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
// Note: curl_close() omitted — deprecated in PHP 8.0+ and auto-handled by GC

if ($httpCode !== 200) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid or expired token']);
    exit;
}

$tokenData = json_decode($response, true);
if (empty($tokenData['users'][0]['localId'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Token verification failed']);
    exit;
}

// ── List static assets ──

$assetsDir = realpath(__DIR__ . '/../assets');
if (!$assetsDir || !is_dir($assetsDir)) {
    echo json_encode(['assets' => []]);
    exit;
}

$imageExtensions = ['svg', 'webp', 'png', 'jpg', 'jpeg', 'gif'];
$assets = [];

$iterator = new RecursiveIteratorIterator(
    new RecursiveDirectoryIterator($assetsDir, RecursiveDirectoryIterator::SKIP_DOTS)
);

foreach ($iterator as $file) {
    if (!$file->isFile()) continue;

    $ext = strtolower($file->getExtension());
    if (!in_array($ext, $imageExtensions)) continue;

    $relativePath = str_replace($assetsDir . '/', '', $file->getPathname());

    // Skip the uploads subdirectory
    if (str_starts_with($relativePath, 'uploads/') || str_starts_with($relativePath, 'uploads\\')) {
        continue;
    }

    $name = $file->getFilename();
    $category = categorizeAsset($name);

    $assets[] = [
        'name'     => $name,
        'url'      => 'assets/' . $relativePath,
        'size'     => $file->getSize(),
        'category' => $category,
    ];
}

// Sort by category, then name
usort($assets, function ($a, $b) {
    $catCmp = strcmp($a['category'], $b['category']);
    return $catCmp !== 0 ? $catCmp : strcmp($a['name'], $b['name']);
});

echo json_encode(['assets' => $assets]);

// ── Helpers ──

function categorizeAsset(string $name): string {
    $prefixMap = [
        'logo-'              => 'Logos',
        'logo.'              => 'Logos',
        'icon-'              => 'Icons',
        'badge-'             => 'Badges',
        'about-leader-'      => 'Team',
        'about-'             => 'About',
        'testimonial-logo-'  => 'Testimonials',
        'testimonial-'       => 'Testimonials',
        'engagement-model-'  => 'Engagement',
        'growth-package-'    => 'Growth Packages',
        'case-study-'        => 'Case Studies',
        'case-'              => 'Case Studies',
        'home-services-'     => 'Services',
        'service-'           => 'Services',
        'why-card-'          => 'Why Cards',
        'hero-'              => 'Hero',
        'contact-'           => 'Contact',
        'footer-'            => 'Footer',
        'process-'           => 'Process',
        'placeholder-'       => 'Placeholders',
        'avatar-'            => 'Avatars',
        'og-'                => 'Social / OG',
        'cert-'              => 'Certifications',
        'model-'             => 'Models',
        'card-'              => 'Cards',
    ];

    $lower = strtolower($name);
    foreach ($prefixMap as $prefix => $category) {
        if (str_starts_with($lower, $prefix)) {
            return $category;
        }
    }
    return 'Other';
}
