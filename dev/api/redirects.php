<?php
/**
 * Writes admin-managed 301/302 redirects to dev/redirects.json + prod/redirects.json.
 *
 * POST /api/redirects.php
 * Headers: Authorization: Bearer <firebase-id-token>
 * Body:    { "rules": [{from, to, status, exact}, ...] }
 *
 * Response:
 *   200  { status: 'success', written: [...], rejected: [...] }
 *   400  validation error
 *
 * Validation rules:
 *   - `from` must start with /
 *   - `to`   must be non-empty (absolute path or full URL)
 *   - `status` must be 301, 302, 307, or 308 (default 301 if missing)
 *   - duplicate `from` paths rejected (last-write-wins is too easy to misconfigure)
 *   - redirect cycles (a → b → a) rejected
 *   - max chain depth = 3 hops
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

// ── Firebase auth + role verification ──
// Site-wide URL routing — a bad redirect rule can break live pages.
require_once __DIR__ . '/_auth.php';
$auth = requireActiveUser(['superadmin', 'approver']);
$idToken = $auth['idToken'];

// ── Parse + validate ──
$body = json_decode(file_get_contents('php://input'), true);
$rules = is_array($body['rules'] ?? null) ? $body['rules'] : [];

$cleanRules = [];
$rejected   = [];
$seenFrom   = [];

foreach ($rules as $i => $rule) {
    $from   = trim((string)($rule['from'] ?? ''));
    $to     = trim((string)($rule['to'] ?? ''));
    $status = isset($rule['status']) ? (int)$rule['status'] : 301;
    $exact  = !array_key_exists('exact', $rule) ? true : (bool)$rule['exact'];

    if ($from === '' || $to === '') {
        $rejected[] = ['index' => $i, 'reason' => 'from or to is empty'];
        continue;
    }
    if ($from[0] !== '/') {
        $rejected[] = ['index' => $i, 'reason' => 'from must start with /', 'from' => $from];
        continue;
    }
    if (!in_array($status, [301, 302, 307, 308], true)) {
        $rejected[] = ['index' => $i, 'reason' => 'status must be 301/302/307/308', 'from' => $from];
        continue;
    }
    if (isset($seenFrom[$from])) {
        $rejected[] = ['index' => $i, 'reason' => 'duplicate from path', 'from' => $from];
        continue;
    }
    $seenFrom[$from] = true;
    $cleanRules[] = ['from' => $from, 'to' => $to, 'status' => $status, 'exact' => $exact];
}

// Detect simple cycles and chains > 3 hops
foreach ($cleanRules as $r) {
    $depth = 0;
    $visited = [];
    $cur = $r['from'];
    while ($depth < 5) {
        $next = null;
        foreach ($cleanRules as $rule) {
            if (($rule['exact'] && $cur === $rule['from']) || (!$rule['exact'] && str_starts_with($cur, rtrim($rule['from'], '/')))) {
                $next = $rule['to'];
                break;
            }
        }
        if ($next === null) break;
        if (isset($visited[$next])) {
            $rejected[] = ['from' => $r['from'], 'reason' => 'redirect cycle detected'];
            $cleanRules = array_values(array_filter($cleanRules, fn($x) => $x['from'] !== $r['from']));
            break;
        }
        $visited[$next] = true;
        $cur = $next;
        $depth++;
        if (!str_starts_with($cur, '/')) break; // chain hit external URL — done
    }
    if ($depth >= 4) {
        $rejected[] = ['from' => $r['from'], 'reason' => 'redirect chain too deep (>3 hops)'];
        $cleanRules = array_values(array_filter($cleanRules, fn($x) => $x['from'] !== $r['from']));
    }
}

// ── Write JSON files (with backup) ──
$devDir  = realpath(__DIR__ . '/..');
$projectRoot = dirname($devDir);
$prodDir = is_dir($projectRoot . '/prod') ? $projectRoot . '/prod' : null;

$payload = json_encode([
    'rules'      => $cleanRules,
    '_updatedAt' => date('c'),
    '_comment'   => 'Admin-managed 301/302 redirects. Edit via the admin Redirects page.',
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

$written = [];
$paths   = [$devDir . '/redirects.json'];
if ($prodDir) $paths[] = $prodDir . '/redirects.json';

foreach ($paths as $p) {
    if (file_exists($p)) @copy($p, $p . '.bak');
    if (file_put_contents($p, $payload, LOCK_EX) !== false) {
        $rel = str_replace([$devDir, (string)$prodDir], ['dev', 'prod'], $p);
        $written[] = $rel;
    }
}

echo json_encode([
    'status'   => 'success',
    'written'  => $written,
    'kept'     => count($cleanRules),
    'rejected' => $rejected,
]);
