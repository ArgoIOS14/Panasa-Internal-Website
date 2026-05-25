#!/usr/bin/env node
/**
 * Regenerate dev/content/Resources/articles-index.json (and prod mirror) by
 * scanning the on-disk content folders. The index is consumed by:
 *   - the admin "article picker" (fields.js)
 *   - the admin auto-seed flow (articleListView.js)
 *   - sitemap + resources fallback
 *
 * Source of truth = the *.json files under dev/content/{Blog,Case Studies,Insights,Guide}.
 * Excerpts/categories/dates are taken from each article JSON; href is built from
 * (typeUrlPrefix, slug) so they match the public routes.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Excerpts curated for the Resources cards. Pulled from
// dev/content/Resources/content.json (the published list) so the regenerated
// index matches what the public Resources page already shows.
const EXCERPTS = {
  // Blog
  '3d-secure-authentication-card-program': 'How 3D Secure (3DS) works, the frictionless vs challenge decision, the liability shift, PSD2 SCA implications, and what card programs should actually be tuning.',
  'card-controls-fraud-prevention': 'How card controls prevent fraud before authorisation completes — MCC, velocity, geographic, MID, spend, channel, and time-based rules — and what they mean for card programs.',
  'anatomy-of-a-swipe': 'A deep-dive into the card authorisation, clearing and settlement loop — from the milliseconds of authorisation to the rails that actually move money.',
  // Insights
  'lifecycle-of-a-payment': 'A payment is not a moment — it is a lifecycle. Authorisation, clearing, settlement, interchange, fraud, chargebacks, digital wallets, open banking and embedded finance, explained end-to-end.',
  // Guide
  'complete-guide-to-interchange-fees': 'How card payment economics really work — who gets paid, why merchants care, and how interchange shapes the modern payments ecosystem.',
  // Case Studies
  'osper-family-banking': 'How Panasa partnered with Osper to deliver a regulator-aligned family banking platform — open banking integration, SCA & 3DS, monitoring, and brand tie-ups across four countries.',
  'open-banking-youth-banking-platform': 'How we delivered an Open Banking Gateway, parental controls, and PSD2/GDPR-aligned consent and authentication for a UK youth banking platform.',
  'flexible-card-issuance-platform-issuer-processor': 'How we rebuilt a global issuer processor\'s card platform around modular control — cardholder lifecycle, security, tokenisation, controls, and real-time balances.',
  '3d-secure-authentication-issuer-processor': 'How we delivered PSD2 SCA + 3DS2 authentication across multiple BIN ranges and ACS providers for an AI-first global issuer processor.',
  'operations-backbone-global-issuer-processor': 'How we restructured operations around observability, fraud detection, DevOps, and customer care to help a global issuer processor scale across 40+ countries.',
  // Sample (test) entries
  'sample-all-blocks': 'A test article exercising every supported body block: rich text with H2/H3/code/blockquote, callout, and YouTube.',
};

// Hand-picked card image for each slug — matches public Resources page.
const COVER_IMAGES = {
  // Blogs
  '3d-secure-authentication-card-program': 'assets/blog-hero-desktop.webp',
  'card-controls-fraud-prevention': 'assets/blog-hero-desktop.webp',
  'anatomy-of-a-swipe': 'assets/resources-card-placeholder.webp',
  // Insights
  'lifecycle-of-a-payment': 'assets/resources-card-placeholder.webp',
  // Guide
  'complete-guide-to-interchange-fees': 'assets/resources-card-placeholder.webp',
  // Case Studies
  'osper-family-banking': 'assets/cs-osper-cover.webp',
  'open-banking-youth-banking-platform': 'assets/cs-open-banking-hero-bg.webp',
  'flexible-card-issuance-platform-issuer-processor': 'assets/cs-card-issuance-hero-bg.webp',
  '3d-secure-authentication-issuer-processor': 'assets/cs-3d-secure-hero-bg.webp',
  'operations-backbone-global-issuer-processor': 'assets/cs-ops-backbone-hero-bg.webp',
  // Sample
  'sample-all-blocks': 'assets/blog-hero-desktop.webp',
};

// Per Resources/content.json: lifecycle-of-a-payment lives under /insights/
// even though its source JSON is in dev/content/Blog/. Map those exceptions
// here so the generated href matches the public route.
const HREF_TYPE_OVERRIDES = {
  'lifecycle-of-a-payment': 'insights',
};

const FOLDER_TO_TYPE = {
  'Blog': { type: 'blog', categoryLabel: 'Blog', urlPrefix: 'blog' },
  'Insights': { type: 'insights', categoryLabel: 'Insights', urlPrefix: 'insights' },
  'Guide': { type: 'guides', categoryLabel: 'Guide', urlPrefix: 'guides' },
  'Case Studies': { type: 'case-studies', categoryLabel: 'Case Study', urlPrefix: 'case-studies' },
};

function readArticleJson(absPath) {
  try {
    const raw = fs.readFileSync(absPath, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    console.warn(`[skip] could not parse ${absPath}: ${e.message}`);
    return null;
  }
}

function deriveTitle(data, type, slug) {
  if (type === 'case-studies') {
    if (data.hero?.title) return data.hero.title;
    const split = [data.hero?.titleAccent, data.hero?.titleSuffix].filter(Boolean).join(' ').trim();
    if (split) return split;
    if (data.meta?.title) return data.meta.title.replace(/\s*\|\s*Panasa\s*$/i, '').trim();
  }
  if (data.title) return data.title;
  if (data.meta?.title) return data.meta.title.replace(/\s*\|\s*Panasa\s*$/i, '').trim();
  return slug;
}

function buildEntries(folderAbs, folderName) {
  const meta = FOLDER_TO_TYPE[folderName];
  if (!meta) return [];
  if (!fs.existsSync(folderAbs)) return [];

  const files = fs.readdirSync(folderAbs).filter((f) => f.endsWith('.json'));
  const entries = [];
  for (const file of files) {
    const slug = path.basename(file, '.json');
    const data = readArticleJson(path.join(folderAbs, file));
    if (!data) continue;

    const urlPrefix = HREF_TYPE_OVERRIDES[slug] || meta.urlPrefix;
    const category = HREF_TYPE_OVERRIDES[slug]
      ? (HREF_TYPE_OVERRIDES[slug] === 'insights' ? 'Insights' : meta.categoryLabel)
      : meta.categoryLabel;

    entries.push({
      category,
      title: deriveTitle(data, meta.type, slug),
      excerpt: EXCERPTS[slug] || (data.meta?.description || ''),
      date: data.date || '',
      datePublished: data.datePublished || '',
      author: data.author || 'Panasa Team',
      image: COVER_IMAGES[slug] || (data.heroImage || data.meta?.ogImage || 'assets/resources-card-placeholder.webp'),
      slug,
      href: `${urlPrefix}/${slug}`,
      sitemap: {
        includeInSitemap: data.meta?.includeInSitemap !== false,
        sitemapPriority: data.meta?.sitemapPriority || '',
        sitemapChangefreq: data.meta?.sitemapChangefreq || '',
      },
    });
  }
  return entries;
}

function buildIndex(envFolder) {
  const contentRoot = path.join(PROJECT_ROOT, envFolder, 'content');
  const allEntries = [];
  for (const folderName of Object.keys(FOLDER_TO_TYPE)) {
    allEntries.push(...buildEntries(path.join(contentRoot, folderName), folderName));
  }
  // Sort newest first by datePublished (falls back to date string).
  allEntries.sort((a, b) => {
    const aKey = a.datePublished || a.date || '';
    const bKey = b.datePublished || b.date || '';
    return bKey.localeCompare(aKey);
  });

  return {
    items: allEntries,
    updatedAt: new Date().toISOString().replace(/\.\d{3}Z$/, '+00:00'),
  };
}

for (const envFolder of ['dev', 'prod']) {
  const outPath = path.join(PROJECT_ROOT, envFolder, 'content', 'Resources', 'articles-index.json');
  if (!fs.existsSync(path.dirname(outPath))) {
    console.warn(`[skip] ${envFolder}: no Resources folder`);
    continue;
  }
  const index = buildIndex(envFolder);
  fs.writeFileSync(outPath, JSON.stringify(index, null, 4) + '\n');
  console.log(`[ok] wrote ${outPath} — ${index.items.length} entries`);
}
