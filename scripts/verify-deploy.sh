#!/usr/bin/env bash
# =============================================================================
# Panasa Website — Post-Deploy Smoke Test
# =============================================================================
# Runs after infra deploys. Checks every critical endpoint and flags problems.
#
# Usage:
#   ./scripts/verify-deploy.sh [BASE_URL]
#
# Examples:
#   ./scripts/verify-deploy.sh                              # defaults to https://www.panasatech.com
#   ./scripts/verify-deploy.sh https://staging.example.com
#
# Exit code 0 = all checks passed. Non-zero = something needs infra attention.
# =============================================================================

set -u

BASE_URL="${1:-https://www.panasatech.com}"
PASS=0
FAIL=0

pass() { echo "  ✓  $1"; PASS=$((PASS+1)); }
fail() { echo "  ✗  $1"; FAIL=$((FAIL+1)); }

check_status() {
    local label="$1"; local url="$2"; local expected="$3"
    local actual
    actual=$(curl -s -o /dev/null -w "%{http_code}" -L --max-redirs 0 "$url" 2>/dev/null || echo "000")
    if [ "$actual" = "$expected" ]; then
        pass "$label → $actual"
    else
        fail "$label → got $actual, expected $expected"
    fi
}

echo "=========================================="
echo "  Panasa Deploy Verification"
echo "  Target: $BASE_URL"
echo "=========================================="
echo ""

echo "[1] Redirects"
check_status "Bare domain → www"  "${BASE_URL/www./}"                    "301"
check_status "/contact.html → /contact"  "${BASE_URL}/contact.html"      "301"
check_status "/privacy-policy/ → /privacy-policy"  "${BASE_URL}/privacy-policy/"  "301"
echo ""

echo "[2] Pages load (clean URLs, no .html)"
check_status "Homepage /"          "${BASE_URL}/"              "200"
check_status "/about"              "${BASE_URL}/about"         "200"
check_status "/services"           "${BASE_URL}/services"      "200"
check_status "/careers"            "${BASE_URL}/careers"       "200"
check_status "/contact"            "${BASE_URL}/contact"       "200"
check_status "/privacy-policy"     "${BASE_URL}/privacy-policy" "200"
check_status "/ai-governance"      "${BASE_URL}/ai-governance" "200"
check_status "/ai-accelerated-fintech-engineering" "${BASE_URL}/ai-accelerated-fintech-engineering" "200"
check_status "/intelligent-operations"  "${BASE_URL}/intelligent-operations"  "200"
check_status "/ai-powered-legacy-modernisation"  "${BASE_URL}/ai-powered-legacy-modernisation"  "200"
echo ""

echo "[3] Static assets served"
check_status "/css/style.css"             "${BASE_URL}/css/style.css"             "200"
check_status "/css/shared-footer.css"     "${BASE_URL}/css/shared-footer.css"     "200"
check_status "/css/shared-layout.css"     "${BASE_URL}/css/shared-layout.css"     "200"
check_status "/css/services-overview.css" "${BASE_URL}/css/services-overview.css" "200"
check_status "/assets/logo.svg"           "${BASE_URL}/assets/logo.svg"           "200"
check_status "/assets/footer-bg.jpg"      "${BASE_URL}/assets/footer-bg.jpg"      "200"
check_status "/assets/footer-cta-bg.png"  "${BASE_URL}/assets/footer-cta-bg.png"  "200"
echo ""

echo "[4] Security"
check_status "/api/.env blocked"          "${BASE_URL}/api/.env"          "403"
echo ""

echo "[5] API endpoints"
# Contact form — real Origin required. Using GET to test method rejection (should 405).
actual=$(curl -s -o /dev/null -w "%{http_code}" -X GET \
    -H "Origin: ${BASE_URL}" \
    "${BASE_URL}/api/zoho-proxy.php" 2>/dev/null || echo "000")
if [ "$actual" = "405" ] || [ "$actual" = "403" ]; then
    pass "zoho-proxy.php rejects GET → $actual"
else
    fail "zoho-proxy.php GET returned $actual (expected 405 or 403)"
fi

# POST with real payload — should return either success (contact created) or
# "Contact already exists" if the test email is a duplicate. Anything else = problem.
resp=$(curl -s -X POST "${BASE_URL}/api/zoho-proxy.php" \
    -H "Origin: ${BASE_URL}" \
    -H "Content-Type: application/json" \
    -d '{"firstName":"Deploy","lastName":"Verify","email":"deploy.verify@panasatech.com","phone":"+910000000000","message":"Automated verify-deploy.sh check"}' \
    2>/dev/null)
if echo "$resp" | grep -q '"status":"success"'; then
    pass "zoho-proxy.php POST → success ($(echo "$resp" | sed 's/.*"message":"\([^"]*\)".*/\1/'))"
elif echo "$resp" | grep -q 'Server configuration missing'; then
    fail "zoho-proxy.php → .env file is MISSING on the server. Infra must create /api/.env"
else
    fail "zoho-proxy.php POST → unexpected response: $(echo "$resp" | head -c 200)"
fi
echo ""

echo "[6] Cache-busting"
# Fetch homepage and check for ?v= in CSS links
if curl -s "${BASE_URL}/" 2>/dev/null | grep -q '\.css?v='; then
    pass "CSS links have ?v=<version> cache-bust"
else
    fail "CSS links missing ?v=<version> — old HTML may be cached, purge CDN"
fi
echo ""

echo "=========================================="
echo "  Results: $PASS passed, $FAIL failed"
echo "=========================================="

if [ $FAIL -gt 0 ]; then
    echo ""
    echo "  ⚠  $FAIL check(s) failed. Common fixes:"
    echo "     • 404 on clean URLs    → root .htaccess missing; re-upload it"
    echo "     • 403 on .env endpoint → expected, means protection works"
    echo "     • Old/no ?v= in CSS    → purge Siteground cache + CDN"
    echo "     • Server configuration missing → infra must create /api/.env"
    exit 1
fi
echo ""
echo "  ✓  Deployment looks healthy."
exit 0
