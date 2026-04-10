<?php
// CSRF protection: validate Origin header
$allowed_origins = ['https://www.panasatech.com', 'http://localhost'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$originAllowed = in_array($origin, $allowed_origins) || preg_match('#^http://localhost(:\d+)?$#', $origin);
if ($_SERVER['REQUEST_METHOD'] !== 'OPTIONS' && !$originAllowed) {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Forbidden']);
    exit;
}

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: ' . ($origin ?: $allowed_origins[0]));
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    exit;
}

// Read request body
$input = json_decode(file_get_contents('php://input'), true);
$email = trim($input['email'] ?? '');
$description = trim($input['description'] ?? 'Email capture');

if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Valid email is required']);
    exit;
}

// Load .env
$envPath = __DIR__ . '/.env';
if (!file_exists($envPath)) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Server configuration error']);
    exit;
}

$env = [];
foreach (file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
    if (strpos($line, '=') !== false && $line[0] !== '#') {
        list($key, $value) = explode('=', $line, 2);
        $env[trim($key)] = trim($value);
    }
}

$clientId     = $env['ZOHO_CLIENT_ID'] ?? '';
$clientSecret = $env['ZOHO_CLIENT_SECRET'] ?? '';
$refreshToken = $env['ZOHO_REFRESH_TOKEN'] ?? '';
$accountsUrl  = $env['ZOHO_ACCOUNTS_URL'] ?? 'https://accounts.zoho.in/oauth/v2/token';
$biginApiUrl  = $env['ZOHO_BIGIN_API_URL'] ?? 'https://www.zohoapis.in/bigin/v2/Contacts';

// Step 1: Get access token
$tokenParams = http_build_query([
    'grant_type'    => 'refresh_token',
    'client_id'     => $clientId,
    'client_secret' => $clientSecret,
    'refresh_token' => $refreshToken,
]);

$ch = curl_init($accountsUrl);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => $tokenParams,
    CURLOPT_TIMEOUT        => 15,
]);
$tokenResponse = curl_exec($ch);
$tokenError = curl_error($ch);
curl_close($ch);

if ($tokenError) {
    http_response_code(502);
    echo json_encode(['status' => 'error', 'message' => 'Failed to connect to Zoho auth']);
    exit;
}

$tokenData = json_decode($tokenResponse, true);
$accessToken = $tokenData['access_token'] ?? '';

if (!$accessToken) {
    http_response_code(502);
    echo json_encode(['status' => 'error', 'message' => 'Failed to get access token']);
    exit;
}

// Step 2: Create contact in Bigin
$contactPayload = json_encode([
    'data' => [[
        'Email'       => $email,
        'Last_Name'   => 'Email Subscriber',
        'Form_Submission_Data' => $description,
        'Lead_Source' => 'Website',
    ]],
]);

$ch = curl_init($biginApiUrl);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => $contactPayload,
    CURLOPT_HTTPHEADER     => [
        'Authorization: Zoho-oauthtoken ' . $accessToken,
        'Content-Type: application/json',
    ],
    CURLOPT_TIMEOUT        => 15,
]);
$biginResponse = curl_exec($ch);
$biginError = curl_error($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($biginError) {
    http_response_code(502);
    echo json_encode(['status' => 'error', 'message' => 'Failed to connect to Zoho Bigin']);
    exit;
}

$biginData = json_decode($biginResponse, true);

if ($httpCode >= 200 && $httpCode < 300) {
    echo json_encode(['status' => 'success', 'message' => 'Contact created']);
} else {
    http_response_code($httpCode ?: 500);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Failed to create contact',
        'details' => $biginData,
    ]);
}
