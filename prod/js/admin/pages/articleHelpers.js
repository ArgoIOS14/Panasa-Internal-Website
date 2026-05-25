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

export const ARTICLE_TYPES = ['blog', 'insights', 'guides', 'case-studies'];

export function typeLabel(type) {
  if (type === 'blog') return 'Blog';
  if (type === 'insights') return 'Insight';
  if (type === 'case-studies') return 'Case Study';
  return 'Guide';
}

export function typeFolder(type) {
  if (type === 'blog') return 'Blog';
  if (type === 'insights') return 'Insights';
  if (type === 'case-studies') return 'Case Studies';
  return 'Guide';
}

export function typeUrlPrefix(type) {
  if (type === 'blog') return 'blog';
  if (type === 'insights') return 'insights';
  if (type === 'case-studies') return 'case-studies';
  return 'guides';
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

/**
 * Resolve the best author name for new articles.
 *  1. firebase auth currentUser.displayName (set by us when the editor signs in)
 *  2. friendly form of the email local-part if displayName is unset (e.g. "Aria Khan" from "aria.khan@…")
 *  3. fallback "Panasa Team"
 */
function resolveDefaultAuthor() {
  try {
    // Lazy-import auth so this helper is callable from non-browser contexts
    const u = (typeof globalThis !== 'undefined' && globalThis.__panasaAuthUser) || null;
    if (u?.displayName) return u.displayName;
    if (u?.email) {
      const local = u.email.split('@')[0] || '';
      if (local) {
        return local
          .split(/[._-]+/)
          .filter(Boolean)
          .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
          .join(' ');
      }
    }
  } catch (_) { /* ignore */ }
  return 'Panasa Team';
}

export function newArticleDefaults(type, slug = '') {
  const today = new Date();
  const dateIso = today.toISOString().slice(0, 10);
  const dateDisplay = today.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
  const author = resolveDefaultAuthor();

  if (type === 'case-studies') {
    return {
      meta: { title: '', description: '', canonical: '', ogImage: '' },
      slug: slug || '',
      category: 'Case Study',
      tag: 'CASE STUDY',
      title: '',
      date: dateDisplay,
      datePublished: dateIso,
      dateModified: dateIso,
      readTime: '5 MINS READ',
      author,
      tags: [],
      hero: { eyebrow: 'CASE STUDY', title: '', titleAccent: '', titleSuffix: '', background: '' },
      metaTiles: [],
      sections: [],
      newsletter: {
        eyebrow: 'NEWSLETTER',
        title: 'Enjoyed this Case Study?',
        titleAccent: 'Get Payments Deconstructed.',
        description: 'Our fortnightly newsletter simplifying the intricacies of the payments ecosystem, from authorization flows to disputes.',
        formNote: 'No spam. Unsubscribe anytime.',
        placeholder: 'Enter Email Address',
        submitLabel: 'Subscribe',
      },
      relatedSlugs: [],
    };
  }

  const isGuide = type === 'guides';
  const tag = type === 'blog' ? 'BLOG' : type === 'insights' ? 'INSIGHTS' : 'GUIDE';
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
    author,
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
