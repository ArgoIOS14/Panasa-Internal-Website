<?php
/**
 * Shared Firebase auth + role verification for admin API endpoints.
 *
 * Token verification only proves "this is a real, currently-valid Firebase
 * session" — it says nothing about what that user is allowed to do. Every
 * endpoint that mutates site content, config, or files must additionally
 * check the caller's role/active status from `users/{uid}` in RTDB before
 * proceeding; `requireActiveUser()` does both in one call.
 *
 * The role/active read is done with the CALLER'S OWN id token (not a
 * service-account credential) — firebase.rules.json already allows a user
 * to read their own users/{uid} record, so this needs no extra privilege
 * and is exactly as trustworthy as the security rules themselves.
 */

const FB_AUTH_API_KEY = 'AIzaSyD4yz8pUs9nnozh61VOWJ9JVP8E1b489eY';
const FB_AUTH_DB_URL  = 'https://panasa-cms-default-rtdb.europe-west1.firebasedatabase.app';

/**
 * Verify the Authorization: Bearer <idToken> header against Firebase.
 * Exits with 401 JSON on any failure. Returns ['uid' => ..., 'idToken' => ...].
 */
function requireAuth(): array {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!str_starts_with($authHeader, 'Bearer ')) {
        http_response_code(401);
        echo json_encode(['status' => 'error', 'message' => 'Missing authorization token']);
        exit;
    }
    $idToken = substr($authHeader, 7);

    $verifyUrl = 'https://www.googleapis.com/identitytoolkit/v3/relyingparty/getAccountInfo?key=' . FB_AUTH_API_KEY;
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
    $uid = $tokenData['users'][0]['localId'] ?? null;
    if (!$uid) {
        http_response_code(401);
        echo json_encode(['status' => 'error', 'message' => 'Token verification failed']);
        exit;
    }

    return ['uid' => $uid, 'idToken' => $idToken];
}

/**
 * Read the caller's own users/{uid} record via their own id token.
 * Returns null on any failure (missing record, network error, etc).
 */
function fetchOwnUserRecord(string $uid, string $idToken): ?array {
    $url = FB_AUTH_DB_URL . '/users/' . rawurlencode($uid) . '.json?auth=' . urlencode($idToken);
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 8,
    ]);
    $resp = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    if ($code !== 200 || !$resp) return null;
    $data = json_decode($resp, true);
    return is_array($data) ? $data : null;
}

/**
 * Require the caller to be an active admin user, optionally restricted to
 * a specific set of roles (e.g. ['superadmin', 'approver']). Pass an empty
 * array (default) to allow any active role. Exits 401/403 on failure.
 *
 * Returns ['uid' => ..., 'idToken' => ..., 'role' => ..., 'record' => [...]].
 */
function requireActiveUser(array $allowedRoles = []): array {
    $auth   = requireAuth();
    $record = fetchOwnUserRecord($auth['uid'], $auth['idToken']);

    if (!$record || ($record['active'] ?? null) !== true) {
        http_response_code(403);
        echo json_encode(['status' => 'error', 'message' => 'Account inactive or not found']);
        exit;
    }

    $role = $record['role'] ?? null;
    if (!empty($allowedRoles) && !in_array($role, $allowedRoles, true)) {
        http_response_code(403);
        echo json_encode(['status' => 'error', 'message' => 'Insufficient permissions for this action']);
        exit;
    }

    $auth['role']   = $role;
    $auth['record'] = $record;
    return $auth;
}
