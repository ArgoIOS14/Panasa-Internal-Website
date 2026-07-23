<?php
/**
 * Firebase Storage REST helper — server-side upload/list/delete via a
 * service account (JWT-signed OAuth2), no SDK/Composer dependency.
 *
 * Privileged server-side writes/deletes/lists go through the IAM-authenticated
 * Cloud Storage JSON API (storage.googleapis.com) — this is what the Admin SDK
 * uses internally, and it bypasses Storage Security Rules entirely because
 * access is governed by the service account's IAM role, not Rules.
 *
 * The Firebase-flavoured REST API (firebasestorage.googleapis.com) is
 * NOT used for privileged operations here: it enforces Storage Security
 * Rules for every caller, including service-account bearer tokens, since
 * it's a rules-gated proxy rather than a raw IAM-authenticated endpoint.
 * It's only used below to build the public download URL, which is meant
 * to stay governed by the "public read on uploads/**" Rule.
 */

function fb_storage_bucket() {
    return 'panasa-cms-ad3f9.firebasestorage.app';
}

function fb_storage_config() {
    $keyPath = __DIR__ . '/firebase-service-account.json';
    if (!file_exists($keyPath)) {
        throw new RuntimeException('firebase-service-account.json missing — see firebase-service-account.example.json');
    }
    $sa = json_decode(file_get_contents($keyPath), true);
    if (!$sa || empty($sa['private_key']) || empty($sa['client_email'])) {
        throw new RuntimeException('firebase-service-account.json is malformed');
    }
    return $sa;
}

function fb_base64url($data) {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

// Cached OAuth2 access token (server-side JWT-bearer flow), reused across
// requests until near expiry to avoid signing + calling Google on every hit.
// Cached per-scope so a Storage-scoped token is never reused for an Identity
// Toolkit (Auth admin) call or vice versa.
function fb_get_access_token($scope = 'https://www.googleapis.com/auth/devstorage.read_write') {
    $cacheFile = sys_get_temp_dir() . '/panasa_fb_token_' . md5($scope) . '.json';
    if (file_exists($cacheFile)) {
        $cached = json_decode(file_get_contents($cacheFile), true);
        if (!empty($cached['token']) && !empty($cached['expires']) && $cached['expires'] > time() + 60) {
            return $cached['token'];
        }
    }

    $sa = fb_storage_config();
    $now = time();
    $header = fb_base64url(json_encode(['alg' => 'RS256', 'typ' => 'JWT']));
    $claims = fb_base64url(json_encode([
        'iss'   => $sa['client_email'],
        'scope' => $scope,
        'aud'   => 'https://oauth2.googleapis.com/token',
        'iat'   => $now,
        'exp'   => $now + 3600,
    ]));
    $signingInput = $header . '.' . $claims;

    $signature = '';
    if (!openssl_sign($signingInput, $signature, $sa['private_key'], 'sha256WithRSAEncryption')) {
        throw new RuntimeException('Failed to sign JWT for Firebase auth');
    }
    $jwt = $signingInput . '.' . fb_base64url($signature);

    $ch = curl_init('https://oauth2.googleapis.com/token');
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => http_build_query([
            'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            'assertion'  => $jwt,
        ]),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 10,
    ]);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

    if ($httpCode !== 200) {
        throw new RuntimeException('Firebase auth failed (' . $httpCode . ')');
    }

    $data = json_decode($response, true);
    if (empty($data['access_token'])) {
        throw new RuntimeException('Firebase auth response missing access_token');
    }

    file_put_contents($cacheFile, json_encode([
        'token'   => $data['access_token'],
        'expires' => $now + ($data['expires_in'] ?? 3600),
    ]));
    chmod($cacheFile, 0600);

    return $data['access_token'];
}

/**
 * Enable/disable a Firebase Auth account by uid via the Identity Toolkit
 * Admin REST API. This is what actually revokes access on "deactivate" —
 * flipping users/{uid}.active in RTDB alone only blocks the RTDB-backed SPA
 * and the PHP endpoints (which now check that flag too); it does not stop
 * the underlying Firebase Auth session from being renewed. This closes that
 * gap by disabling the Auth account itself, which invalidates all of that
 * user's existing and future ID tokens immediately.
 */
function fb_auth_set_disabled($uid, $disabled) {
    $token = fb_get_access_token('https://www.googleapis.com/auth/identitytoolkit');
    $ch = curl_init('https://identitytoolkit.googleapis.com/v1/accounts:update');
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => json_encode(['localId' => $uid, 'disableUser' => (bool)$disabled]),
        CURLOPT_HTTPHEADER     => ['Authorization: Bearer ' . $token, 'Content-Type: application/json'],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 10,
    ]);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

    if ($httpCode < 200 || $httpCode >= 300) {
        error_log('fb_auth_set_disabled failed (' . $httpCode . '): ' . $response);
        throw new RuntimeException('Failed to update Firebase Auth account status');
    }
    return true;
}

function fb_storage_download_url($objectPath) {
    return 'https://firebasestorage.googleapis.com/v0/b/' . fb_storage_bucket()
        . '/o/' . rawurlencode($objectPath) . '?alt=media';
}

function fb_storage_upload($objectPath, $fileContents, $contentType) {
    $token = fb_get_access_token();
    $url = 'https://storage.googleapis.com/upload/storage/v1/b/' . rawurlencode(fb_storage_bucket())
        . '/o?uploadType=media&name=' . rawurlencode($objectPath);

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $fileContents,
        CURLOPT_HTTPHEADER     => [
            'Authorization: Bearer ' . $token,
            'Content-Type: ' . $contentType,
        ],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 30,
    ]);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

    if ($httpCode < 200 || $httpCode >= 300) {
        error_log('fb_storage_upload failed (' . $httpCode . '): ' . $response);
        throw new RuntimeException('Firebase Storage upload failed');
    }

    return fb_storage_download_url($objectPath);
}

function fb_storage_delete($objectPath) {
    $token = fb_get_access_token();
    $url = 'https://storage.googleapis.com/storage/v1/b/' . rawurlencode(fb_storage_bucket())
        . '/o/' . rawurlencode($objectPath);

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_CUSTOMREQUEST  => 'DELETE',
        CURLOPT_HTTPHEADER     => ['Authorization: Bearer ' . $token],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 15,
    ]);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

    if ($httpCode !== 200 && $httpCode !== 204 && $httpCode !== 404) {
        error_log('fb_storage_delete failed (' . $httpCode . '): ' . $response);
        return false;
    }
    return true;
}

// Lists objects directly under $prefix (e.g. 'uploads/'). Returns raw
// Cloud Storage item metadata (name, size, updated, ...).
function fb_storage_list($prefix) {
    $token = fb_get_access_token();
    $url = 'https://storage.googleapis.com/storage/v1/b/' . rawurlencode(fb_storage_bucket())
        . '/o?prefix=' . rawurlencode($prefix);

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_HTTPHEADER     => ['Authorization: Bearer ' . $token],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 15,
    ]);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

    if ($httpCode !== 200) {
        error_log('fb_storage_list failed (' . $httpCode . '): ' . $response);
        throw new RuntimeException('Firebase Storage list failed');
    }

    $data = json_decode($response, true);
    return $data['items'] ?? [];
}
