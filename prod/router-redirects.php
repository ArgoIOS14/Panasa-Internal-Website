<?php
/**
 * Production redirect front-controller.
 *
 * Reads admin-managed redirect rules from `prod/redirects.json` and emits
 * `Location: …` headers with the configured status. If no rule matches,
 * it returns 404 (the regular Apache static-file serving runs FIRST via
 * `.htaccess` rewrite rules, so this only fires when the URL doesn't map
 * to an existing file).
 *
 * To activate: in `prod/.htaccess`, add this line as a final fallback (after
 * any existing rewrites for clean URLs):
 *
 *   RewriteCond %{REQUEST_FILENAME} !-f
 *   RewriteCond %{REQUEST_FILENAME} !-d
 *   RewriteRule ^(.*)$ /router-redirects.php [L]
 *
 * That way, only requests for non-existent paths reach this controller.
 */

$uri = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));
$qs  = !empty($_SERVER['QUERY_STRING']) ? '?' . $_SERVER['QUERY_STRING'] : '';

$redirectsFile = __DIR__ . '/redirects.json';
if (file_exists($redirectsFile)) {
    $data = @json_decode((string)@file_get_contents($redirectsFile), true);
    $rules = is_array($data['rules'] ?? null) ? $data['rules'] : [];
    foreach ($rules as $rule) {
        $from   = isset($rule['from']) ? (string)$rule['from'] : '';
        $to     = isset($rule['to'])   ? (string)$rule['to']   : '';
        $status = isset($rule['status']) ? (int)$rule['status'] : 301;
        $exact  = !array_key_exists('exact', $rule) ? true : (bool)$rule['exact'];
        if ($from === '' || $to === '') continue;
        $matched = $exact ? ($uri === $from) : str_starts_with($uri, rtrim($from, '/'));
        if ($matched) {
            if (!in_array($status, [301, 302, 307, 308], true)) $status = 301;
            $location = $to . $qs;
            header('Location: ' . $location, true, $status);
            exit;
        }
    }
}

http_response_code(404);
header('Content-Type: text/html; charset=UTF-8');
echo '<!doctype html><meta charset="UTF-8"><title>404 Not Found</title><h1>404 Not Found</h1>';
