import { db } from '../../firebase-config.js';
import { ref, get } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-database.js';

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function slugify(s) {
  return String(s || '').toLowerCase().trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export const ARTICLE_TYPES = ['blog', 'insights', 'guides'];

export function typeLabel(type) {
  return type === 'blog' ? 'Blog' : type === 'insights' ? 'Insight' : 'Guide';
}

export function typeFolder(type) {
  return type === 'blog' ? 'Blog' : type === 'insights' ? 'Insights' : 'Guide';
}

export function typeUrlPrefix(type) {
  return type === 'blog' ? 'blog' : type === 'insights' ? 'insights' : 'guides';
}

export async function loadArticleSummaries(type) {
  const path = `pages/articlesIndex/${type}`;
  try {
    const snap = await get(ref(db, path));
    if (!snap.exists()) return [];
    const out = [];
    snap.forEach((child) => {
      const v = child.val() || {};
      out.push({ slug: child.key, ...v });
    });
    out.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    return out;
  } catch (e) {
    console.error('loadArticleSummaries failed:', e);
    return [];
  }
}

export async function isSlugUnique(type, slug, ignoreCurrent = '') {
  if (!SLUG_RE.test(slug)) return false;
  const path = `pages/articlesIndex/${type}/${slug}`;
  try {
    const snap = await get(ref(db, path));
    if (!snap.exists()) return true;
    return slug === ignoreCurrent;
  } catch (e) {
    return true;
  }
}

export function newArticleDefaults(type, slug = '') {
  const isGuide = type === 'guides';
  const tag = type === 'blog' ? 'BLOG' : type === 'insights' ? 'INSIGHTS' : 'GUIDE';
  const today = new Date();
  const dateIso = today.toISOString().slice(0, 10);
  const dateDisplay = today.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
  const base = {
    meta: { title: '', description: '', canonical: '', ogImage: '' },
    slug: slug || '',
    category: typeLabel(type),
    tag,
    title: '',
    date: dateDisplay,
    datePublished: dateIso,
    dateModified: dateIso,
    readTime: '5 MINS READ',
    author: 'Panasa Team',
    tags: [],
    heroImage: '',
    heroImageTablet: '',
    heroImageMobile: '',
    heroImageAlt: '',
    body: [],
    relatedSlugs: [],
  };
  if (isGuide) {
    base.titleHighlight = '';
    base.description = '';
    base.tocHeading = 'On this page';
    base.introduction = { heading: 'Introduction', blocks: [] };
    base.sections = [];
    delete base.body;
  }
  return base;
}
