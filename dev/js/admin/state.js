import { db } from '../firebase-config.js';
import { ref, get, set, query, orderByKey, limitToLast } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-database.js';

/**
 * Normalize raw Firebase data against a sections config and defaults.
 */
export function normalizeData(raw, sections, defaults) {
  const out = {};
  for (const cfg of sections) {
    const sectionKey = cfg.parentKey || cfg.key;
    const section = raw?.[sectionKey];
    if (!section) {
      out[sectionKey] = JSON.parse(JSON.stringify(defaults[sectionKey] || {}));
      continue;
    }
    if (!out[sectionKey]) out[sectionKey] = {};
    for (const f of cfg.fields) {
      let val = section[f.key];
      if (f.arrayAtRoot && val === undefined) {
        val = Array.isArray(section) ? section : (typeof section === 'object' && !section[f.key] ? Object.values(section) : section[f.key]);
      }
      if (val === undefined || val === null) {
        out[sectionKey][f.key] = JSON.parse(JSON.stringify((defaults[sectionKey] || {})[f.key] ?? ''));
        continue;
      }
      const defaultVal = (defaults[sectionKey] || {})[f.key];
      if (Array.isArray(defaultVal) && !Array.isArray(val)) val = Object.values(val);
      if (f.type === 'columns' && Array.isArray(val)) {
        val = val.map(col => ({ heading: col.heading || '', bullets: (Array.isArray(col.bullets) ? col.bullets : Object.values(col.bullets || {})).map(b => ({ icon: b.icon || null, text: b.text || '' })) }));
      }
      out[sectionKey][f.key] = val;
    }
    if (typeof section === 'object' && !Array.isArray(section)) {
      for (const k of Object.keys(section)) { if (!(k in out[sectionKey])) out[sectionKey][k] = section[k]; }
    }
  }
  for (const k of Object.keys(defaults)) {
    if (!(k in out)) out[k] = raw?.[k] ?? JSON.parse(JSON.stringify(defaults[k]));
  }
  return out;
}

/**
 * Load data — tries drafts first (for admin), then live path.
 */
export async function loadFromFirebase(fbPath, sections, defaults) {
  // Try drafts first
  const draftPath = fbPath.startsWith('pages/') ? `drafts/${fbPath.replace('pages/', '')}` : `drafts/${fbPath}`;
  try {
    const draftSnap = await get(ref(db, draftPath));
    if (draftSnap.exists()) {
      return { data: normalizeData(draftSnap.val(), sections, defaults), source: 'draft' };
    }
  } catch (e) { /* draft path may not exist yet */ }

  // Fall back to live
  try {
    const liveSnap = await get(ref(db, fbPath));
    if (liveSnap.exists()) {
      return { data: normalizeData(liveSnap.val(), sections, defaults), source: 'published' };
    }
  } catch (err) {
    console.error('Failed to load data:', err);
  }
  return { data: JSON.parse(JSON.stringify(defaults)), source: 'defaults' };
}

/**
 * Save draft to Firebase.
 */
export async function saveDraft(fbPath, data) {
  const draftPath = fbPath.startsWith('pages/') ? `drafts/${fbPath.replace('pages/', '')}` : `drafts/${fbPath}`;
  await set(ref(db, draftPath), data);
}

/**
 * Publish — copy draft to live path, then clean up draft.
 */
export async function publishToLive(fbPath, data) {
  await set(ref(db, fbPath), data);
  // Also save draft so they stay in sync
  const draftPath = fbPath.startsWith('pages/') ? `drafts/${fbPath.replace('pages/', '')}` : `drafts/${fbPath}`;
  await set(ref(db, draftPath), data);
}

/**
 * Save a history snapshot.
 */
export async function saveHistory(pageKey, data) {
  const timestamp = Date.now();
  const historyPath = `history/${pageKey}/${timestamp}`;
  await set(ref(db, historyPath), {
    timestamp,
    date: new Date(timestamp).toISOString(),
    data,
  });
}

/**
 * Load history for a page (last 10 entries).
 */
export async function loadHistory(pageKey) {
  try {
    const historyRef = query(ref(db, `history/${pageKey}`), orderByKey(), limitToLast(10));
    const snap = await get(historyRef);
    if (snap.exists()) {
      const entries = [];
      snap.forEach(child => entries.push(child.val()));
      return entries.reverse(); // newest first
    }
  } catch (e) {
    console.error('Failed to load history:', e);
  }
  return [];
}
