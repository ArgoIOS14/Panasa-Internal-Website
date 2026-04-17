#!/usr/bin/env bash
# =============================================================================
# Panasa Website — Deploy Zip Builder
# =============================================================================
# Creates a single deploy artifact for Siteground (or any Apache+PHP host).
#
# Usage:
#   ./scripts/build-deploy.sh [VERSION]
#
# Example:
#   ./scripts/build-deploy.sh 2.1
#
# Output:
#   panasa-deploy-v<VERSION>.zip in the repo root
#
# What it does:
#   1. Verifies dev/ and prod/ are in sync (warns if they differ)
#   2. Bumps ?v=<VERSION> on every CSS/JS link in prod/*.html and prod/*.php
#   3. Copies prod/ into a temp build folder
#   4. Ensures .env.example is present (must be — infra uses it to create .env)
#   5. Strips any real .env file accidentally left in prod/
#   6. Creates panasa-deploy-v<VERSION>.zip
#   7. Prints file size and SHA-256 checksum
# =============================================================================

set -euo pipefail

VERSION="${1:-$(date +%Y.%m.%d)}"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BUILD_DIR="$(mktemp -d)"
ZIP_NAME="panasa-deploy-v${VERSION}.zip"
ZIP_PATH="${REPO_ROOT}/${ZIP_NAME}"

cleanup() { rm -rf "$BUILD_DIR"; }
trap cleanup EXIT

echo "=========================================="
echo "  Panasa Deploy Builder — v${VERSION}"
echo "=========================================="
cd "$REPO_ROOT"

# --- Step 1: check dev/prod parity ---
echo ""
echo "[1/6] Checking dev/ and prod/ are in sync..."
set +e
DIFF_OUTPUT=$(diff -rq dev/ prod/ 2>/dev/null | grep -v '.DS_Store\|uploads\|\.env\|router\.php')
set -e
DIFF_COUNT=$(echo "$DIFF_OUTPUT" | grep -c . || true)
if [ "$DIFF_COUNT" -gt 0 ] && [ -n "$DIFF_OUTPUT" ]; then
    echo "  ⚠  WARNING: dev/ and prod/ differ in $DIFF_COUNT file(s):"
    echo "$DIFF_OUTPUT" | head -10 | sed 's/^/     /'
    echo "  Continuing anyway — this zip is built from prod/"
else
    echo "  ✓  dev/ and prod/ are in sync"
fi

# --- Step 2: bump cache-bust version ---
echo ""
echo "[2/6] Bumping ?v=${VERSION} on CSS/JS links in prod/*.html and prod/*.php..."
python3 <<PYEOF
import re, glob
pattern = re.compile(r'(href=|src=)(["\'])([^"\']+\.(?:css|js)(?:\?v=[^"\']*)?)\2')
def repl(m):
    prefix, quote, path = m.group(1), m.group(2), m.group(3)
    if path.startswith(('http://','https://','//')): return m.group(0)
    if not (path.startswith('css/') or path.startswith('js/')): return m.group(0)
    path_clean = re.sub(r'\?v=[^"\']*$', '', path)
    return f'{prefix}{quote}{path_clean}?v=${VERSION}{quote}'
count = 0
for f in sorted(glob.glob('prod/*.html') + glob.glob('prod/*.php')):
    with open(f) as fh: c = fh.read()
    new = pattern.sub(repl, c)
    if new != c:
        with open(f, 'w') as fh: fh.write(new)
        count += 1
print(f'  ✓  Updated {count} page files with ?v=${VERSION}')
PYEOF

# --- Step 3: copy prod/ → build folder ---
echo ""
echo "[3/6] Copying prod/ → build folder..."
cp -R prod/. "$BUILD_DIR/"
echo "  ✓  Copied $(find "$BUILD_DIR" -type f | wc -l | tr -d ' ') files"

# --- Step 4: ensure .env.example present, strip real .env ---
echo ""
echo "[4/6] Sanitising secrets..."
if [ ! -f "$BUILD_DIR/api/.env.example" ]; then
    echo "  ✗  ERROR: prod/api/.env.example is missing. Infra cannot set up Zoho without it."
    exit 1
fi
echo "  ✓  .env.example present"
if [ -f "$BUILD_DIR/api/.env" ]; then
    echo "  ⚠  Found .env in build output — removing for security (infra creates it on server)"
    rm -f "$BUILD_DIR/api/.env"
fi
# strip macOS/editor artefacts
find "$BUILD_DIR" -name ".DS_Store" -delete
find "$BUILD_DIR" -name "router.php" -delete
echo "  ✓  Cleaned artefacts (.DS_Store, router.php)"

# --- Step 5: zip ---
echo ""
echo "[5/6] Creating ${ZIP_NAME}..."
rm -f "$ZIP_PATH"
(cd "$BUILD_DIR" && zip -r -q "$ZIP_PATH" .)
echo "  ✓  Wrote $ZIP_PATH"

# --- Step 6: checksum + size ---
echo ""
echo "[6/6] Summary"
SIZE=$(du -h "$ZIP_PATH" | cut -f1)
SHA=$(shasum -a 256 "$ZIP_PATH" | cut -d' ' -f1)
FILE_COUNT=$(unzip -l "$ZIP_PATH" | tail -1 | awk '{print $2}')
echo "  File:      ${ZIP_NAME}"
echo "  Size:      ${SIZE}"
echo "  Files:     ${FILE_COUNT}"
echo "  SHA-256:   ${SHA}"
echo ""
echo "=========================================="
echo "  ✓  Build complete."
echo "=========================================="
echo ""
echo "Next steps:"
echo "  1. Send ${ZIP_NAME} to infra team"
echo "  2. Infra: delete all files in web root (keep /api/.env if it exists)"
echo "  3. Infra: extract zip contents to web root"
echo "  4. Infra: create /api/.env from /api/.env.example"
echo "  5. Infra: purge Siteground cache + CDN cache"
echo "  6. Run ./scripts/verify-deploy.sh to confirm"
