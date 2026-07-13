<?php
/**
 * Firebase Storage REST helper — server-side upload/list/delete via a
 * service account (JWT-signed OAuth2), no SDK/Composer dependency.
 * Service-account access bypasses Storage Security Rules (same as the
 * Admin SDK); public reads of uploaded files are governed separately by
 * the Storage Rules configured in the Firebase console.
 */

function fb_storage_bucket() {
    return 'panasa-cms.firebasestorage.app';
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
function fb_get_access_token() {
    $cacheFile = sys_get_temp_dir() . '/panasa_fb_storage_token.json';
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
        'scope' => 'https://www.googleapis.com/auth/devstorage.read_write',
        'aud'   => 'https://oauth2.googleapis.com/token',
        'iat'   => $now,
        'exp'   => $now + 3600,
    ]));
    $signingInput = $header . '.' . $claims;

    $signature = '';
    if (!openssl_sign($signingInput, $signature, $sa['private_key'], 'sha256WithRSAEncryption')) {
        throw new RuntimeException('Failed to sign JWT for Firebase Storage auth');
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
        throw new RuntimeException('Firebase Storage auth failed (' . $httpCode . ')');
    }

    $data = json_decode($response, true);
    if (empty($data['access_token'])) {
        throw new RuntimeException('Firebase Storage auth response missing access_token');
    }

    file_put_contents($cacheFile, json_encode([
        'token'   => $data['access_token'],
        'expires' => $now + ($data['expires_in'] ?? 3600),
    ]));
    chmod($cacheFile, 0600);

    return $data['access_token'];
}

function fb_storage_download_url($objectPath) {
    return 'https://firebasestorage.googleapis.com/v0/b/' . fb_storage_bucket()
        . '/o/' . rawurlencode($objectPath) . '?alt=media';
}

function fb_storage_upload($objectPath, $fileContents, $contentType) {
    $token = fb_get_access_token();
    $url = 'https://firebasestorage.googleapis.com/v0/b/' . fb_storage_bucket()
        . '/o?name=' . rawurlencode($objectPath);

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
    $url = 'https://firebasestorage.googleapis.com/v0/b/' . fb_storage_bucket()
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

    if ($httpCode !== 200 && $httpCode !== 404) {
        error_log('fb_storage_delete failed (' . $httpCode . '): ' . $response);
        return false;
    }
    return true;
}

// Lists objects directly under $prefix (e.g. 'uploads/'). Returns raw
// Firebase Storage item metadata (name, size, updated, ...).
function fb_storage_list($prefix) {
    $token = fb_get_access_token();
    $url = 'https://firebasestorage.googleapis.com/v0/b/' . fb_storage_bucket()
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
