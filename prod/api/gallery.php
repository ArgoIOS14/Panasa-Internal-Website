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

// ── Firebase auth + active-user verification ──
// Browsing (GET) is open to any active role; deleting a shared gallery asset
// (DELETE, below) is restricted to superadmin/approver since the same file
// may be referenced by other editors' pages.
require_once __DIR__ . '/_auth.php';
$auth = ($_SERVER['REQUEST_METHOD'] === 'DELETE')
    ? requireActiveUser(['superadmin', 'approver'])
    : requireActiveUser();
$idToken = $auth['idToken'];

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
