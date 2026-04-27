import { db } from '../../firebase-config.js';
import { ref, get, set, remove } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-database.js';
import { canPublish, isEditor } from '../roles.js';
import { submitForReview } from '../reviews.js';
import { loadArticleSummaries, slugify, SLUG_RE, isSlugUnique, typeLabel, typeUrlPrefix } from './articleHelpers.js';

const styles = `
  .article-list { padding: 12px; }
  .article-list-toolbar { display: flex; gap: 12px; align-items: center; margin-bottom: 16px; flex-wrap: wrap; }
  .article-list-toolbar input[type=search] { flex: 1; min-width: 220px; padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; }
  .article-list-table { width: 100%; border-collapse: collapse; }
  .article-list-table th, .article-list-table td { text-align: left; padding: 10px 12px; border-bottom: 1px solid #eee; font-size: 14px; }
  .article-list-table th { background: #f5f7fa; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.4px; color: #555; }
  .article-list-table tr:hover td { background: #fafbfc; }
  .article-status-pill { padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 600; }
  .article-status-published { background: #def7ec; color: #03543f; }
  .article-status-draft { background: #fef3c7; color: #92400e; }
  .article-row-actions { display: flex; gap: 6px; flex-wrap: wrap; }
  .article-row-actions button { padding: 4px 10px; font-size: 12px; border: 1px solid #ccc; background: #fff; border-radius: 4px; cursor: pointer; }
  .article-row-actions button:hover { background: #f0f0f0; }
  .article-row-actions .btn-delete { color: #b91c1c; border-color: #fecaca; }
  .article-list-empty { padding: 32px; text-align: center; color: #888; font-style: italic; }
  .new-article-btn { background: #0ea5e9; color: #fff; border: 0; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 13px; }
  .new-article-btn:hover { background: #0284c7; }
`;

let stylesInjected = false;
function ensureStyles() {
  if (stylesInjected) return;
  const tag = document.createElement('style');
  tag.id = 'article-list-styles';
  tag.textContent = styles;
  document.head.appendChild(tag);
  stylesInjected = true;
}

export function buildListView(type) {
  return {
    label: `${typeLabel(type)} Articles`,
    fbPath: `pages/articlesIndex/${type}`,
    sections: [],
    defaults: {},
    customRender: async (container) => {
      ensureStyles();
      container.innerHTML = `
        <div class="article-list">
          <div class="article-list-toolbar">
            <input type="search" class="article-search" placeholder="Search by title…">
            <button type="button" class="new-article-btn">+ New ${typeLabel(type)}</button>
          </div>
          <div class="article-list-content">Loading…</div>
        </div>`;
      const content = container.querySelector('.article-list-content');
      const search = container.querySelector('.article-search');
      const newBtn = container.querySelector('.new-article-btn');

      const articles = await loadArticleSummaries(type);
      let filtered = articles.slice();

      const renderRows = () => {
        if (!filtered.length) {
          content.innerHTML = `<div class="article-list-empty">No ${typeLabel(type).toLowerCase()} articles yet. Click "+ New ${typeLabel(type)}" to create one.</div>`;
          return;
        }
        const canDelete = canPublish();
        let html = `<table class="article-list-table"><thead><tr>
          <th>Title</th><th>Status</th><th>Date</th><th>Author</th><th>Actions</th>
        </tr></thead><tbody>`;
        filtered.forEach((a) => {
          const status = a.status || 'draft';
          html += `<tr data-slug="${a.slug}">
            <td>${escapeHtml(a.title || '(untitled)')}</td>
            <td><span class="article-status-pill article-status-${status}">${status}</span></td>
            <td>${escapeHtml(a.date || '')}</td>
            <td>${escapeHtml(a.author || '')}</td>
            <td><div class="article-row-actions">
              <button class="btn-edit" data-action="edit">Edit</button>
              <button class="btn-submit" data-action="submit">Submit for Review</button>
              ${canDelete ? '<button class="btn-delete" data-action="delete">Delete</button>' : ''}
            </div></td>
          </tr>`;
        });
        html += '</tbody></table>';
        content.innerHTML = html;

        content.querySelectorAll('button[data-action]').forEach((btn) => {
          btn.addEventListener('click', () => handleAction(btn));
        });
      };

      const handleAction = async (btn) => {
        const tr = btn.closest('tr');
        const slug = tr?.dataset.slug;
        const action = btn.dataset.action;
        if (!slug) return;
        if (action === 'edit') {
          openArticleEditor(type, slug);
        } else if (action === 'submit') {
          await submitArticleForReview(type, slug);
        } else if (action === 'delete') {
          await requestDeleteArticle(type, slug);
        }
      };

      newBtn.addEventListener('click', async () => {
        await createNewArticle(type);
      });

      search.addEventListener('input', () => {
        const q = search.value.toLowerCase().trim();
        filtered = q
          ? articles.filter((a) => (a.title || '').toLowerCase().includes(q))
          : articles.slice();
        renderRows();
      });

      renderRows();
    },
  };
}

function escapeHtml(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function createNewArticle(type) {
  const title = prompt(`New ${typeLabel(type)} title:`);
  if (!title) return;
  let slug = slugify(title);
  if (!SLUG_RE.test(slug)) {
    alert('Could not derive a valid URL slug from that title. Try a title with letters or numbers.');
    return;
  }
  // Disambiguate if collision: append -2, -3, …
  let candidate = slug;
  let n = 2;
  while (!(await isSlugUnique(type, candidate))) {
    candidate = `${slug}-${n++}`;
    if (n > 50) { alert('Could not find a unique slug.'); return; }
  }
  slug = candidate;
  // Write a draft stub plus an index entry
  const today = new Date();
  const dateIso = today.toISOString().slice(0, 10);
  const dateDisplay = today.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
  const stub = {
    meta: { title, description: '', canonical: '', ogImage: '' },
    slug,
    title,
    category: typeLabel(type),
    tag: type === 'blog' ? 'BLOG' : type === 'insights' ? 'INSIGHTS' : 'GUIDE',
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
    body: type === 'guides' ? undefined : [],
    relatedSlugs: [],
  };
  if (type === 'guides') {
    stub.titleHighlight = '';
    stub.description = '';
    stub.tocHeading = 'On this page';
    stub.introduction = { heading: 'Introduction', blocks: [] };
    stub.sections = [];
  }
  // Strip undefined values for Firebase
  const clean = JSON.parse(JSON.stringify(stub));
  try {
    await set(ref(db, `drafts/articles/${type}/${slug}`), clean);
    await set(ref(db, `pages/articlesIndex/${type}/${slug}`), {
      title,
      slug,
      category: typeLabel(type),
      author: 'Panasa Team',
      date: dateDisplay,
      datePublished: dateIso,
      status: 'draft',
      updatedAt: Date.now(),
    });
    openArticleEditor(type, slug);
  } catch (err) {
    console.error('createNewArticle failed:', err);
    alert('Failed to create article: ' + (err.message || 'unknown error'));
  }
}

function openArticleEditor(type, slug) {
  const pageKey = `${type}:${slug}`;
  const select = document.getElementById('page-select');
  if (!select) return;
  // Ensure a matching <option> exists
  let opt = select.querySelector(`option[value="${cssEscape(pageKey)}"]`);
  if (!opt) {
    opt = document.createElement('option');
    opt.value = pageKey;
    opt.textContent = `${typeLabel(type)}: ${slug}`;
    select.appendChild(opt);
  }
  select.value = pageKey;
  select.dispatchEvent(new Event('change'));
}

function cssEscape(v) {
  return (window.CSS && CSS.escape) ? CSS.escape(v) : String(v).replace(/"/g, '\\"');
}

async function submitArticleForReview(type, slug) {
  const note = prompt('Optional note for reviewers:') || '';
  try {
    const draftSnap = await get(ref(db, `drafts/articles/${type}/${slug}`));
    if (!draftSnap.exists()) {
      const liveSnap = await get(ref(db, `pages/articles/${type}/${slug}`));
      if (!liveSnap.exists()) { alert('No draft or published version found for this article.'); return; }
    }
    const data = (draftSnap.exists() ? draftSnap.val() : (await get(ref(db, `pages/articles/${type}/${slug}`))).val());
    const pageKey = `${type}:${slug}`;
    await submitForReview(pageKey, data, note);
    alert('Submitted for review.');
  } catch (err) {
    console.error('submitArticleForReview failed:', err);
    alert('Failed to submit: ' + (err.message || 'unknown error'));
  }
}

async function requestDeleteArticle(type, slug) {
  if (!confirm(`Delete ${typeLabel(type).toLowerCase()} "${slug}"?\n\nIf you are an editor, this will be submitted for review. Approvers can delete directly.`)) return;
  try {
    if (canPublish()) {
      // Direct delete via rebuild.php
      await deleteArticleNow(type, slug);
    } else {
      // Submit a delete request via review
      const pageKey = `${type}:${slug}`;
      await submitForReview(pageKey, { _action: 'delete', slug, type }, 'Delete article');
      alert('Delete request submitted for review.');
    }
  } catch (err) {
    console.error('requestDeleteArticle failed:', err);
    alert('Failed: ' + (err.message || 'unknown error'));
  }
}

async function deleteArticleNow(type, slug) {
  const { auth } = await import('../../firebase-config.js');
  const token = auth.currentUser ? await auth.currentUser.getIdToken() : null;
  if (!token) { alert('Not authenticated.'); return; }
  const res = await fetch('/api/rebuild.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
    body: JSON.stringify({ action: 'delete', pageKey: `${type}:${slug}` }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.status === 'error') {
    alert('Delete failed: ' + (json.message || res.statusText));
    return;
  }
  // Remove Firebase entries too
  await remove(ref(db, `pages/articles/${type}/${slug}`));
  await remove(ref(db, `drafts/articles/${type}/${slug}`));
  await remove(ref(db, `pages/articlesIndex/${type}/${slug}`));
  alert('Article deleted.');
  // Reload list view
  const select = document.getElementById('page-select');
  if (select) select.dispatchEvent(new Event('change'));
}
