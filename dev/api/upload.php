<?php
/**
 * Secure image upload endpoint for Panasa Admin CMS.
 * Requires Firebase ID token in Authorization header.
 * Sanitizes SVG files, uses cryptographic filenames, rate-limits uploads.
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
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
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
$projectId = 'panasa-cms';

// Verify token with Google's tokeninfo endpoint
$verifyUrl = "https://www.googleapis.com/identitytoolkit/v3/relyingparty/getAccountInfo?key=AIzaSyD4yz8pUs9nnozh61VOWJ9JVP8E1b489eY";
$ch = curl_init($verifyUrl);
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_encode(['idToken' => $idToken]),
    CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 10,
]);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
// curl_close() omitted — deprecated in PHP 8.0+

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

// ── Rate limiting (10 uploads per minute per IP) ──

$rateLimitDir = sys_get_temp_dir() . '/panasa_upload_rate/';
if (!is_dir($rateLimitDir)) mkdir($rateLimitDir, 0755, true);

$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$rateLimitFile = $rateLimitDir . md5($ip) . '.json';
$now = time();
$window = 60; // 1 minute
$maxUploads = 10;

$rateData = [];
if (file_exists($rateLimitFile)) {
    $rateData = json_decode(file_get_contents($rateLimitFile), true) ?: [];
    $rateData = array_filter($rateData, fn($t) => $t > $now - $window);
}

if (count($rateData) >= $maxUploads) {
    http_response_code(429);
    echo json_encode(['error' => 'Rate limit exceeded. Try again in a minute.']);
    exit;
}

$rateData[] = $now;
file_put_contents($rateLimitFile, json_encode($rateData));

// ── File validation ──

if (!isset($_FILES['file'])) {
    http_response_code(400);
    echo json_encode(['error' => 'No file uploaded']);
    exit;
}

$file = $_FILES['file'];

if ($file['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['error' => 'Upload error code: ' . $file['error']]);
    exit;
}

// Validate size (5MB max)
$maxSize = 5 * 1024 * 1024;
if ($file['size'] > $maxSize) {
    http_response_code(400);
    echo json_encode(['error' => 'File too large. Maximum 5MB.']);
    exit;
}

// Validate file type
$allowedTypes = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp', 'image/gif'];
$finfo = new finfo(FILEINFO_MIME_TYPE);
$mimeType = $finfo->file($file['tmp_name']);

if (!in_array($mimeType, $allowedTypes, true)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid file type. Allowed: JPG, PNG, SVG, WebP, GIF.']);
    exit;
}

// ── SVG sanitization ──

if ($mimeType === 'image/svg+xml') {
    $svgContent = file_get_contents($file['tmp_name']);

    // Remove script tags and event handlers
    $svgContent = preg_replace('/<script\b[^>]*>.*?<\/script>/si', '', $svgContent);
    $svgContent = preg_replace('/\bon\w+\s*=\s*["\'][^"\']*["\']/i', '', $svgContent);

    // Remove javascript: URLs
    $svgContent = preg_replace('/href\s*=\s*["\']javascript:[^"\']*["\']/i', '', $svgContent);
    $svgContent = preg_replace('/xlink:href\s*=\s*["\']javascript:[^"\']*["\']/i', '', $svgContent);

    // Remove data: URLs (can contain scripts)
    $svgContent = preg_replace('/href\s*=\s*["\']data:[^"\']*["\']/i', '', $svgContent);

    // Remove foreignObject (can embed HTML/JS)
    $svgContent = preg_replace('/<foreignObject\b[^>]*>.*?<\/foreignObject>/si', '', $svgContent);

    // Remove use tags pointing to external resources
    $svgContent = preg_replace('/<use\b[^>]*href\s*=\s*["\']http[^"\']*["\']/i', '<use ', $svgContent);

    // Verify it's still valid XML
    libxml_use_internal_errors(true);
    $doc = new DOMDocument();
    if (!$doc->loadXML($svgContent)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid SVG file']);
        exit;
    }
    libxml_clear_errors();

    // Write sanitized content back
    file_put_contents($file['tmp_name'], $svgContent);
}

// ── Generate secure filename ──

$ext = match ($mimeType) {
    'image/jpeg' => 'jpg',
    'image/png' => 'png',
    'image/svg+xml' => 'svg',
    'image/webp' => 'webp',
    'image/gif' => 'gif',
    default => 'bin',
};

$filename = 'img_' . bin2hex(random_bytes(16)) . '.' . $ext;

// ── Upload to Firebase Storage ──

require_once __DIR__ . '/firebase-storage.php';

try {
    $url = fb_storage_upload('uploads/' . $filename, file_get_contents($file['tmp_name']), $mimeType);
} catch (Throwable $e) {
    error_log('upload.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Failed to save file']);
    exit;
}

echo json_encode(['url' => $url]);
