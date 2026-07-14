<?php
/**
 * Disables/re-enables a Firebase Auth account by uid. Called alongside the
 * client's users/{uid}.active RTDB write so that "deactivate" actually
 * revokes access (invalidates the account's existing/future ID tokens)
 * instead of only hiding the user from the RTDB-backed SPA and PHP endpoints.
 *
 * POST /api/manage-user.php
 * Headers: Authorization: Bearer <firebase-id-token>
 * Body:    { "uid": "<target-uid>", "disabled": true|false }
 *
 * Superadmin only.
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

// ── Firebase auth + role verification — superadmin only ──
require_once __DIR__ . '/_auth.php';
$auth = requireActiveUser(['superadmin']);

// ── Parse + validate body ──
$body = json_decode(file_get_contents('php://input'), true);
$uid = trim((string)($body['uid'] ?? ''));
if ($uid === '') {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Missing uid']);
    exit;
}
if (!array_key_exists('disabled', (array)$body)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Missing disabled flag']);
    exit;
}
$disabled = (bool)$body['disabled'];

// A superadmin can't lock themselves out via this endpoint.
if ($uid === $auth['uid'] && $disabled) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'You cannot disable your own account']);
    exit;
}

require_once __DIR__ . '/firebase-storage.php';

try {
    fb_auth_set_disabled($uid, $disabled);
    echo json_encode(['status' => 'success', 'uid' => $uid, 'disabled' => $disabled]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
