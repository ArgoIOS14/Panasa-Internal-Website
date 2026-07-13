<?php
/**
 * Secure image gallery endpoint for Panasa Admin CMS.
 * Requires Firebase ID token in Authorization header.
 * GET: Returns list of uploaded images with metadata.
 * DELETE: Removes a specific image file.
 */

header('Content-Type: application/json');

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed = ['http://localhost', 'http://localhost:8082', 'http://localhost:8083', 'https://www.panasatech.com'];
foreach ($allowed as $a) {
    if (str_starts_with($origin, $a)) {
        header("Access-Control-Allow-Origin: $origin");
        break;
    }
}
header('Access-Control-Allow-Methods: GET, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
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

// ── Handle requests ──

require_once __DIR__ . '/firebase-storage.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $items = fb_storage_list('uploads/');
    } catch (Throwable $e) {
        error_log('gallery.php: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to list images']);
        exit;
    }

    $images = [];
    foreach ($items as $item) {
        $name = basename($item['name']);
        $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
        if (!in_array($ext, ['jpg', 'jpeg', 'png', 'svg', 'webp', 'gif'])) continue;
        $images[] = [
            'name' => $name,
            'url' => fb_storage_download_url($item['name']),
            'size' => (int) ($item['size'] ?? 0),
            'modified' => strtotime($item['updated'] ?? $item['timeCreated'] ?? 'now'),
        ];
    }
    usort($images, fn($a, $b) => $b['modified'] - $a['modified']);

    echo json_encode(['images' => $images]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $input = json_decode(file_get_contents('php://input'), true);
    $filename = $input['filename'] ?? '';

    // Strict filename validation — only allow our generated filenames
    if (!$filename || !preg_match('/^img_[a-f0-9]{32}\.(jpg|jpeg|png|svg|webp|gif)$/i', $filename)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid filename']);
        exit;
    }

    if (fb_storage_delete('uploads/' . $filename)) {
        echo json_encode(['success' => true]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to delete file']);
    }
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
