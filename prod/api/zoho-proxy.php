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

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    exit;
}

// Load credentials from .env file
$envFile = __DIR__ . '/.env';
if (!file_exists($envFile)) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Server configuration missing']);
    exit;
}
$env = parse_ini_file($envFile);

$CLIENT_ID = $env['ZOHO_CLIENT_ID'];
$CLIENT_SECRET = $env['ZOHO_CLIENT_SECRET'];
$REFRESH_TOKEN = $env['ZOHO_REFRESH_TOKEN'];
$ZOHO_ACCOUNTS_URL = $env['ZOHO_ACCOUNTS_URL'] ?? 'https://accounts.zoho.in/oauth/v2/token';
$BIGIN_API_URL = $env['ZOHO_BIGIN_API_URL'] ?? 'https://www.zohoapis.in/bigin/v2/Contacts';

// Get form data
$input = json_decode(file_get_contents('php://input'), true);

$firstName = trim($input['firstName'] ?? '');
$lastName = trim($input['lastName'] ?? '');
$email = trim($input['email'] ?? '');
$phone = trim($input['phone'] ?? '');
$message = trim($input['message'] ?? '');

// Validate required fields
if (!$firstName || !$lastName || !$email) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Missing required fields']);
    exit;
}

// Strip country code formatting for Bigin - extract just digits
$cleanPhone = preg_replace('/[^0-9+]/', '', $phone);

// Step 1: Get access token using refresh token
$tokenParams = http_build_query([
    'grant_type' => 'refresh_token',
    'client_id' => $CLIENT_ID,
    'client_secret' => $CLIENT_SECRET,
    'refresh_token' => $REFRESH_TOKEN,
]);

$ch = curl_init($ZOHO_ACCOUNTS_URL);
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $tokenParams,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 10,
]);
$tokenRaw = curl_exec($ch);
$tokenError = curl_error($ch);
// curl_close() omitted — deprecated in PHP 8.0+

if ($tokenError) {
    http_response_code(502);
    echo json_encode(['status' => 'error', 'message' => 'Failed to connect to Zoho auth']);
    exit;
}

$tokenResponse = json_decode($tokenRaw, true);

if (!isset($tokenResponse['access_token'])) {
    http_response_code(502);
    echo json_encode(['status' => 'error', 'message' => 'Failed to get access token']);
    exit;
}

$accessToken = $tokenResponse['access_token'];

// Step 2: Create contact in Bigin
$contactData = json_encode([
    'data' => [[
        'First_Name' => $firstName,
        'Last_Name' => $lastName,
        'Email' => $email,
        'Phone' => $cleanPhone,
        'Mobile' => $cleanPhone,
        'Form_Submission_Data' => $message,
        'Lead_Source1' => 'Website',
    ]],
]);

$ch = curl_init($BIGIN_API_URL);
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $contactData,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 10,
    CURLOPT_HTTPHEADER => [
        'Authorization: Zoho-oauthtoken ' . $accessToken,
        'Content-Type: application/json',
    ],
]);
$biginRaw = curl_exec($ch);
$biginError = curl_error($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
// curl_close() omitted — deprecated in PHP 8.0+

if ($biginError) {
    http_response_code(502);
    echo json_encode(['status' => 'error', 'message' => 'Failed to connect to Zoho Bigin']);
    exit;
}

$biginResponse = json_decode($biginRaw, true);
$biginStatus = $biginResponse['data'][0]['status'] ?? 'error';

if ($biginStatus === 'success') {
    echo json_encode(['status' => 'success', 'message' => 'Contact created in Bigin']);
} else {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Failed to create contact in Bigin',
        'details' => $biginResponse['data'][0] ?? $biginResponse,
    ]);
}
