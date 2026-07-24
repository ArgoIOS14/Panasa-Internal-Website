/**
 * Secure image upload endpoint for the Netlify QA build of the admin CMS.
 *
 * This is a Node port of dev/api/upload.php + dev/api/firebase-storage.php —
 * Netlify has no PHP runtime, so those files can never execute here (see the
 * /api/* catch-all in netlify.toml). Ported piece by piece so QA behaves the
 * same as local/SiteGround: same auth check, same validation, same
 * sanitization, same filename scheme, same Firebase Storage upload.
 *
 * NOT ported: the file-based rate limiter from upload.php. Netlify Functions
 * are stateless and ephemeral — each invocation can land on a different
 * instance with no shared filesystem, so a local rate-limit file wouldn't
 * actually limit anything. This is QA-only (internal reviewers, not the
 * public internet), so that's an accepted gap here, not attempted with a
 * fake/broken implementation.
 *
 * Required Netlify environment variable:
 *   FIREBASE_SERVICE_ACCOUNT_BASE64 — the service-account JSON
 *   (dev/api/firebase-service-account.json), base64-encoded so it survives
 *   as a single-line env var. Generate with:
 *     base64 -w0 dev/api/firebase-service-account.json
 *   then paste the output into Netlify → Site settings → Environment variables.
 */

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getDatabase } = require('firebase-admin/database');
const { getStorage } = require('firebase-admin/storage');
const multipart = require('parse-multipart-data');
const { XMLValidator } = require('fast-xml-parser');
const crypto = require('crypto');
const https = require('https');

const FIREBASE_PROJECT_ID = 'panasa-cms-ad3f9';
const STORAGE_BUCKET = 'panasa-cms-ad3f9.firebasestorage.app';
const DATABASE_URL = 'https://panasa-cms-ad3f9-default-rtdb.europe-west1.firebasedatabase.app';
// Same public client API key as dev/js/firebase-config.js — used only for
// the Identity Toolkit token-verification REST call below, not a secret.
const FIREBASE_WEB_API_KEY = 'AIzaSyAfbiJQSnvtr066r2aLIF7MXbqRpHVIu-g';

const MAX_UPLOAD_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp', 'image/gif'];
const EXT_BY_TYPE = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/svg+xml': 'svg',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

function initFirebase() {
  if (getApps().length) return;
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (!b64) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_BASE64 env var is not set');
  }
  const serviceAccount = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
  initializeApp({
    credential: cert(serviceAccount),
    databaseURL: DATABASE_URL,
    storageBucket: STORAGE_BUCKET,
    projectId: FIREBASE_PROJECT_ID,
  });
}

/**
 * Verify a Firebase ID token via the Identity Toolkit REST API directly —
 * the same approach dev/api/_auth.php uses, and deliberately NOT
 * firebase-admin/auth's verifyIdToken(). That module pulls in jwks-rsa,
 * which requires its own dependency `jose` as CommonJS — but the installed
 * `jose` ships ESM-only, so requiring it throws ERR_REQUIRE_ESM at runtime
 * in Netlify's Lambda environment (this loads fine locally via plain
 * `node -e`, which is what made it easy to miss before deploying). A plain
 * REST call has no such dependency chain at all.
 */
function verifyIdTokenViaRest(idToken) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ idToken });
    const req = https.request(
      `https://www.googleapis.com/identitytoolkit/v3/relyingparty/getAccountInfo?key=${FIREBASE_WEB_API_KEY}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' } },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          if (res.statusCode !== 200) return reject(new Error('Invalid or expired token'));
          try {
            const parsed = JSON.parse(data);
            const uid = parsed?.users?.[0]?.localId;
            if (!uid) return reject(new Error('Token verification failed'));
            resolve(uid);
          } catch (e) {
            reject(new Error('Token verification failed'));
          }
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

/** Detect the real image type from file content (magic bytes), not the
 *  client-declared Content-Type — mirrors upload.php's use of finfo(). */
function sniffImageType(buf, declaredType) {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buf.length >= 6 && (buf.subarray(0, 6).toString('ascii') === 'GIF87a' || buf.subarray(0, 6).toString('ascii') === 'GIF89a')) return 'image/gif';
  if (buf.length >= 12 && buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
  // SVG has no fixed magic bytes (it's XML/text) — trust the declared type
  // here, but only ever treat it as SVG; the sanitize+validate step below is
  // what actually guards against a malicious payload wearing an SVG label.
  if (declaredType === 'image/svg+xml') {
    const head = buf.subarray(0, 512).toString('utf8').replace(/^﻿/, '').trimStart();
    if (/^(<\?xml|<svg)/i.test(head)) return 'image/svg+xml';
  }
  return null;
}

/** Strip script-capable constructs from an SVG, then confirm it's still
 *  valid XML — same sequence of regex passes as upload.php. */
function sanitizeSvg(svgText) {
  let out = svgText;
  out = out.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  out = out.replace(/\bon\w+\s*=\s*["'][^"']*["']/gi, '');
  out = out.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, '');
  out = out.replace(/xlink:href\s*=\s*["']javascript:[^"']*["']/gi, '');
  out = out.replace(/href\s*=\s*["']data:[^"']*["']/gi, '');
  out = out.replace(/<foreignObject\b[^>]*>[\s\S]*?<\/foreignObject>/gi, '');
  out = out.replace(/<use\b[^>]*href\s*=\s*["']http[^"']*["']/gi, '<use ');

  const result = XMLValidator.validate(out);
  if (result !== true) return null;
  return out;
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: { 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' }, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  try {
    initFirebase();
  } catch (e) {
    console.error('upload.js: Firebase init failed:', e.message);
    return json(500, { error: 'Server misconfigured — missing Firebase credentials' });
  }

  // ── Auth: verify ID token, then require an active user record ──
  // Any active role may upload, matching upload.php (editors need this while drafting).
  const authHeader = event.headers.authorization || event.headers.Authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return json(401, { error: 'Missing authorization token' });
  }
  const idToken = authHeader.slice(7);

  let uid;
  try {
    uid = await verifyIdTokenViaRest(idToken);
  } catch (e) {
    return json(401, { error: 'Invalid or expired token' });
  }

  let userRecord;
  try {
    const snap = await getDatabase().ref(`users/${uid}`).once('value');
    userRecord = snap.val();
  } catch (e) {
    console.error('upload.js: failed to read user record:', e.message);
    return json(500, { error: 'Failed to verify account status' });
  }

  if (!userRecord || userRecord.active !== true) {
    return json(403, { error: 'Account inactive or not found' });
  }

  // ── Parse the multipart body ──
  const contentType = event.headers['content-type'] || event.headers['Content-Type'] || '';
  const boundaryMatch = contentType.match(/boundary=(.+)$/);
  if (!boundaryMatch) {
    return json(400, { error: 'No file uploaded' });
  }
  const bodyBuffer = Buffer.from(event.body, event.isBase64Encoded ? 'base64' : 'utf8');

  let parts;
  try {
    parts = multipart.parse(bodyBuffer, boundaryMatch[1]);
  } catch (e) {
    return json(400, { error: 'No file uploaded' });
  }
  const filePart = parts.find((p) => p.name === 'file' || (!p.name && p.filename));
  if (!filePart || !filePart.data || !filePart.data.length) {
    return json(400, { error: 'No file uploaded' });
  }

  // ── Validate size ──
  if (filePart.data.length > MAX_UPLOAD_SIZE) {
    return json(400, { error: 'File too large. Maximum 5MB.' });
  }

  // ── Validate file type via content sniffing, not the client's declared type ──
  const declaredType = filePart.type || '';
  const mimeType = sniffImageType(filePart.data, declaredType);
  if (!mimeType || !ALLOWED_TYPES.includes(mimeType)) {
    return json(400, { error: 'Invalid file type. Allowed: JPG, PNG, SVG, WebP, GIF.' });
  }

  // ── SVG sanitization ──
  let uploadBuffer = filePart.data;
  if (mimeType === 'image/svg+xml') {
    const cleaned = sanitizeSvg(filePart.data.toString('utf8'));
    if (cleaned === null) {
      return json(400, { error: 'Invalid SVG file' });
    }
    uploadBuffer = Buffer.from(cleaned, 'utf8');
  }

  // ── Upload to Firebase Storage ──
  const filename = `img_${crypto.randomBytes(16).toString('hex')}.${EXT_BY_TYPE[mimeType]}`;
  const objectPath = `uploads/${filename}`;

  try {
    const bucket = getStorage().bucket();
    const file = bucket.file(objectPath);
    await file.save(uploadBuffer, { metadata: { contentType: mimeType }, resumable: false });

    // Same public-download URL shape the PHP path returns, so it's
    // indistinguishable to the client which backend produced it.
    const url = `https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o/${encodeURIComponent(objectPath)}?alt=media`;
    return json(200, { url });
  } catch (e) {
    console.error('upload.js: Storage upload failed:', e.message);
    return json(500, { error: 'Failed to save file' });
  }
};

// Exposed for local unit testing only (see netlify/functions/upload.test.js) —
// the deployed function only ever uses exports.handler.
exports._internal = { sniffImageType, sanitizeSvg, initFirebase };
