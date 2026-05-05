import { db } from '../../firebase-config.js';
import { ref, get, set, remove } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-database.js';
import { canPublish, isEditor, currentRole } from '../roles.js';
import { submitForReview } from '../reviews.js';
import { loadArticleSummaries, slugify, SLUG_RE, isSlugUnique, typeLabel, typeUrlPrefix, typeFolder, newArticleDefaults } from './articleHelpers.js';
import { toast, friendlyError } from '../toast.js';

/* Junk test articles authored while exercising the new admin. Cleaned up via
   the "Clear test posts" toolbar button when any of these slugs appear in the
   list. Safe to keep listed even after they're gone — the button only renders
   when at least one match is detected. */
const JUNK_SLUGS = [
  { type: 'case-studies', slug: 'case-stdy-sample' },
  { type: 'blog',         slug: 'test-blog' },
];

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
  .article-row-actions .btn-duplicate { color: #1e40af; border-color: #c7d2fe; }
  .article-list-empty { padding: 32px; text-align: center; color: #888; font-style: italic; }
  .new-article-btn { background: #0ea5e9; color: #fff; border: 0; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 13px; }
  .new-article-btn:hover { background: #0284c7; }
  .refill-btn { background: #fff; color: #047857; border: 1px solid #6ee7b7; padding: 7px 12px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 12px; }
  .refill-btn:hover { background: #ecfdf5; }
  .refill-btn:disabled { background: #f3f4f6; color: #9ca3af; border-color: #e5e7eb; cursor: progress; }
  .cleanup-btn { background: #fff; color: #b91c1c; border: 1px solid #fecaca; padding: 7px 12px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 12px; }
  .cleanup-btn:hover { background: #fef2f2; }
  .article-list-progress { padding: 12px 16px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; margin-bottom: 12px; font-size: 13px; color: #1e3a8a; }
`;

/* Poll-wait until `currentRole()` returns a truthy value or the timeout
   elapses. Resolves with the role string (or null on timeout). Used by the
   list view so the auto-seed gate (canPublish) is evaluated AFTER the user's
   role record finishes loading from Firebase. */
async function waitForRoleLoaded(timeoutMs = 3000) {
  const start = Date.now();
  let role = currentRole();
  while (!role && Date.now() - start < timeoutMs) {
    await new Promise((r) => setTimeout(r, 50));
    role = currentRole();
  }
  return role;
}

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
      /* Wait briefly for the user role to load before deciding whether the
         current user can write to Firebase. Without this, customRender can run
         before loadUserRole() finishes (especially on a page reload) — canPublish()
         returns false, the auto-seed is skipped, and the list shows "No articles
         yet" forever. The poll bails out at 3s so non-publishing users still see
         a list quickly. */
      await waitForRoleLoaded(3000);
      const showSuperOnly = canPublish();
      console.log(`[admin] ${typeLabel(type)} list opened — role=${currentRole() || 'none'}, canPublish=${showSuperOnly}`);
      const refillBtnHtml = showSuperOnly
        ? `<button type="button" class="refill-btn" title="Re-copy bundled examples from /content/${typeFolder(type)}/ into Firebase. Existing articles are preserved; only missing ones are added.">↻ Refill examples</button>`
        : '';
      container.innerHTML = `
        <div class="article-list">
          <div class="article-list-toolbar">
            <input type="search" class="article-search" placeholder="Search by title…">
            <button type="button" class="new-article-btn">+ New ${typeLabel(type)}</button>
            ${refillBtnHtml}
            <span class="cleanup-slot"></span>
          </div>
          <div class="progress-slot"></div>
          <div class="article-list-content">Loading…</div>
        </div>`;
      const content = container.querySelector('.article-list-content');
      const search = container.querySelector('.article-search');
      const newBtn = container.querySelector('.new-article-btn');
      const refillBtn = container.querySelector('.refill-btn');
      const cleanupSlot = container.querySelector('.cleanup-slot');
      const progressSlot = container.querySelector('.progress-slot');

      const showProgressEarly = (msg) => {
        progressSlot.innerHTML = `<div class="article-list-progress">${escapeHtml(msg)}</div>`;
      };
      const clearProgressEarly = () => { progressSlot.innerHTML = ''; };

      /* Auto-seed: bundled JSONs in /content/<Folder>/ are treated as the
         canonical "default" articles for this type. Every time a superadmin /
         approver opens the list, we make sure each bundled slug exists in
         Firebase. If a slug is already there, we leave it alone (the editor's
         edits are sticky). If a bundled slug is missing, we copy the static
         JSON in and the article appears. This way:
         - first open: all bundled examples auto-populate
         - after editing: edits persist (we never overwrite an existing entry)
         - after a delete or auth flake: the missing bundled slug repopulates
         A "deleted" sentinel marker would prevent repopulation on delete; for
         now we trust the user to want the canonical examples present. */
      let articles = await loadArticleSummaries(type);
      if (showSuperOnly) {
        const seeded = await autoSeedFromBundle(type, articles, {
          showProgress: showProgressEarly,
          clearProgress: clearProgressEarly,
        });
        if (seeded > 0) {
          articles = await loadArticleSummaries(type);
        }
      }
      let filtered = articles.slice();

      const reload = async () => {
        articles = await loadArticleSummaries(type);
        const q = search.value.toLowerCase().trim();
        filtered = q
          ? articles.filter((a) => (a.title || '').toLowerCase().includes(q))
          : articles.slice();
        renderRows();
        renderCleanupButton();
      };

      const showProgress = showProgressEarly;
      const clearProgress = clearProgressEarly;

      const renderCleanupButton = () => {
        if (!showSuperOnly) { cleanupSlot.innerHTML = ''; return; }
        // Only show if at least one junk slug is present in THIS list
        const matches = JUNK_SLUGS.filter((j) => j.type === type && articles.some((a) => a.slug === j.slug));
        if (!matches.length) { cleanupSlot.innerHTML = ''; return; }
        cleanupSlot.innerHTML = `<button type="button" class="cleanup-btn" title="Remove the test articles created while exercising the admin (case-stdy-sample, test-blog).">Clear test posts</button>`;
        cleanupSlot.querySelector('.cleanup-btn').addEventListener('click', async () => {
          await runCleanupTestPosts({ showProgress, clearProgress, onDone: reload });
        });
      };

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
              <button class="btn-edit" data-action="edit" title="Open in the editor">Edit</button>
              <button class="btn-duplicate" data-action="duplicate" title="Create a new draft pre-filled with this article's content">Duplicate</button>
              <button class="btn-submit" data-action="submit" title="Send to an approver for review">Submit for Review</button>
              ${canDelete ? '<button class="btn-delete" data-action="delete" title="Permanently delete this article">Delete</button>' : ''}
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
        } else if (action === 'duplicate') {
          await duplicateArticle(type, slug);
        } else if (action === 'submit') {
          await submitArticleForReview(type, slug);
        } else if (action === 'delete') {
          await requestDeleteArticle(type, slug);
        }
      };

      newBtn.addEventListener('click', async () => {
        await createNewArticle(type);
      });

      if (refillBtn) {
        refillBtn.addEventListener('click', async () => {
          refillBtn.disabled = true;
          const original = refillBtn.textContent;
          refillBtn.textContent = 'Refilling…';
          try {
            const seeded = await autoSeedFromBundle(type, articles, { showProgress, clearProgress });
            if (seeded > 0) await reload();
            else toast.info(`All bundled ${typeLabel(type).toLowerCase()} examples are already in this list. Nothing to add.`);
          } finally {
            refillBtn.disabled = false;
            refillBtn.textContent = original;
          }
        });
      }

      search.addEventListener('input', () => {
        const q = search.value.toLowerCase().trim();
        filtered = q
          ? articles.filter((a) => (a.title || '').toLowerCase().includes(q))
          : articles.slice();
        renderRows();
      });

      renderRows();
      renderCleanupButton();

      if (type === 'case-studies') {
        /* Defer one frame so the .new-article-btn target is in the DOM. */
        requestAnimationFrame(() => {
          import('../tutorial.js').then((mod) => {
            if (typeof mod.runCaseStudyListTour === 'function') {
              mod.runCaseStudyListTour();
            }
          }).catch(() => { /* non-critical */ });
        });
      }
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
    toast.warn('Could not derive a URL slug from that title. Try a title with letters or numbers.');
    return;
  }
  // Disambiguate if collision: append -2, -3, …
  let candidate = slug;
  let n = 2;
  while (!(await isSlugUnique(type, candidate))) {
    candidate = `${slug}-${n++}`;
    if (n > 50) { toast.error('Could not find a unique slug.'); return; }
  }
  slug = candidate;
  // Write a draft stub plus an index entry. Use the canonical defaults for this
  // article type so case-studies (hero/sections/metaTiles) and blog/insights/guides
  // (heroImage/body) each get the right initial shape.
  const today = new Date();
  const dateIso = today.toISOString().slice(0, 10);
  const dateDisplay = today.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
  const stub = newArticleDefaults(type, slug);
  stub.meta = { ...stub.meta, title };
  stub.title = title;
  if (type === 'case-studies') {
    stub.hero = { ...(stub.hero || {}), title };
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
    toast.error('Failed to create article', { detail: friendlyError(err) });
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
      if (!liveSnap.exists()) { toast.warn('No draft or published version found for this article.'); return; }
    }
    const data = (draftSnap.exists() ? draftSnap.val() : (await get(ref(db, `pages/articles/${type}/${slug}`))).val());
    const pageKey = `${type}:${slug}`;
    await submitForReview(pageKey, data, note);
    toast.success('Submitted for review.');
  } catch (err) {
    console.error('submitArticleForReview failed:', err);
    toast.error('Failed to submit for review', { detail: friendlyError(err) });
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
      toast.success('Delete request submitted for review.');
    }
  } catch (err) {
    console.error('requestDeleteArticle failed:', err);
    toast.error('Delete failed', { detail: friendlyError(err) });
  }
}

async function deleteArticleNow(type, slug) {
  const { auth } = await import('../../firebase-config.js');
  const token = auth.currentUser ? await auth.currentUser.getIdToken() : null;
  if (!token) { toast.error('Not authenticated.'); return; }
  const res = await fetch('/api/rebuild.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
    body: JSON.stringify({ action: 'delete', pageKey: `${type}:${slug}` }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.status === 'error') {
    toast.error('Delete failed', { detail: json.message || res.statusText });
    return;
  }
  // Remove Firebase entries too
  await remove(ref(db, `pages/articles/${type}/${slug}`));
  await remove(ref(db, `drafts/articles/${type}/${slug}`));
  await remove(ref(db, `pages/articlesIndex/${type}/${slug}`));
  toast.success('Article deleted.');
  // Reload list view
  const select = document.getElementById('page-select');
  if (select) select.dispatchEvent(new Event('change'));
}

/* ── Auto-seed: idempotent merge of bundled JSONs from /content/<Folder>/
   into Firebase. Compares the bundle slug list against the slugs already in
   Firebase; only writes the slugs that are missing. Returns the number of
   slugs newly seeded so the caller knows whether to reload the list.
   Runs only when caller has confirmed the user can publish; no confirm prompt,
   no alert — the inline progress strip is the only UI. ── */

async function autoSeedFromBundle(type, existingArticles, { showProgress, clearProgress }) {
  try {
    const { auth } = await import('../../firebase-config.js');
    const token = auth.currentUser ? await auth.currentUser.getIdToken() : null;
    if (!token) {
      console.warn(`[admin] auto-seed skipped for ${type}: no auth token`);
      return 0;
    }

    /* Cheap fetch first: get the bundle manifest so we can diff against
       existing Firebase entries before touching anything. */
    const listRes = await fetch(`/api/list-content.php?type=${encodeURIComponent(type)}`, {
      headers: { 'Authorization': 'Bearer ' + token },
    });
    if (!listRes.ok) {
      const txt = await listRes.text().catch(() => '');
      console.warn(`[admin] auto-seed: list-content.php returned ${listRes.status} for ${type}: ${txt.slice(0, 120)}`);
      clearProgress();
      return 0;
    }
    const listJson = await listRes.json().catch(() => ({}));
    if (listJson.status === 'error') {
      console.warn(`[admin] auto-seed: list-content.php reported error for ${type}: ${listJson.message}`);
      clearProgress();
      return 0;
    }
    const bundleSlugs = listJson.slugs || [];
    if (!bundleSlugs.length) {
      console.log(`[admin] auto-seed: no bundled JSONs in /content/${typeFolder(type)}/ for ${type}`);
      clearProgress();
      return 0;
    }

    const existingSlugs = new Set((existingArticles || []).map((a) => a.slug));
    const missing = bundleSlugs.filter((s) => !existingSlugs.has(s));
    console.log(`[admin] auto-seed: ${type} bundle has ${bundleSlugs.length} slug(s), Firebase has ${existingSlugs.size}, missing ${missing.length}`);
    if (!missing.length) {
      clearProgress();
      return 0; // everything bundled is already in Firebase — no-op
    }

    const folder = typeFolder(type);
    const folderUrl = encodeURI(folder); // handles "Case Studies" → "Case%20Studies"
    let copied = 0;
    let failed = 0;
    for (const slug of missing) {
      try {
        showProgress(`Loading ${typeLabel(type).toLowerCase()} examples (${copied + failed + 1}/${missing.length})…`);
        const dataRes = await fetch(`/content/${folderUrl}/${encodeURIComponent(slug)}.json`);
        if (!dataRes.ok) throw new Error(`HTTP ${dataRes.status} fetching JSON`);
        const data = await dataRes.json();

        // Title source: hero.title (case studies) → top-level title → slug.
        const title = (type === 'case-studies' ? (data.hero?.title || '') : '') || data.title || slug;

        await set(ref(db, `pages/articles/${type}/${slug}`), data);
        await set(ref(db, `pages/articlesIndex/${type}/${slug}`), {
          title,
          slug,
          category: data.category || typeLabel(type),
          author: data.author || 'Panasa Team',
          date: data.date || '',
          datePublished: data.datePublished || '',
          status: 'published',
          updatedAt: Date.now(),
        });
        copied++;
      } catch (err) {
        console.error(`Auto-seed failed for ${type}/${slug}:`, err);
        failed++;
      }
    }
    clearProgress();
    if (copied > 0) {
      console.log(`[admin] auto-seeded ${copied} ${typeLabel(type).toLowerCase()} example(s) from /content/${folder}/${failed > 0 ? ` (${failed} failed)` : ''}.`);
    } else if (failed > 0) {
      console.warn(`[admin] auto-seed had ${failed} failure(s) for ${typeLabel(type)}; see prior logs.`);
    }
    return copied;
  } catch (err) {
    console.error('autoSeedFromBundle failed:', err);
    clearProgress();
    return 0;
  }
}

/* ── Cleanup test posts: server purges files + sitemap, client clears Firebase. ── */

async function runCleanupTestPosts({ showProgress, clearProgress, onDone }) {
  const list = JUNK_SLUGS.map((j) => `• ${j.type} / ${j.slug}`).join('\n');
  const proceed = confirm(
    `Permanently delete these test articles?\n\n${list}\n\n` +
    `This removes the local HTML/JSON/JS files (dev + prod), regenerates the sitemap & articles-index, and clears the matching Firebase entries.`
  );
  if (!proceed) return;

  try {
    const { auth } = await import('../../firebase-config.js');
    const token = auth.currentUser ? await auth.currentUser.getIdToken() : null;
    if (!token) { toast.error('Not authenticated.'); return; }

    showProgress('Removing local files + regenerating sitemap…');
    const res = await fetch('/api/cleanup-test-posts.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ slugs: JUNK_SLUGS }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.status === 'error') {
      throw new Error(json.message || `cleanup endpoint returned ${res.status}`);
    }

    const fbSlugs = Array.isArray(json.fbCleanup) ? json.fbCleanup : JUNK_SLUGS;
    showProgress(`Removing ${fbSlugs.length} Firebase ${fbSlugs.length === 1 ? 'entry' : 'entries'}…`);
    for (const { type, slug } of fbSlugs) {
      await remove(ref(db, `pages/articles/${type}/${slug}`)).catch(() => {});
      await remove(ref(db, `drafts/articles/${type}/${slug}`)).catch(() => {});
      await remove(ref(db, `pages/articlesIndex/${type}/${slug}`)).catch(() => {});
    }
    clearProgress();
    toast.success('Cleanup complete', {
      detail: `Files removed: ${json.removed?.length || 0} · Sitemap + articles-index regenerated.`,
    });
    if (onDone) await onDone();
  } catch (err) {
    console.error('runCleanupTestPosts failed:', err);
    clearProgress();
    toast.error('Cleanup failed', { detail: friendlyError(err) });
  }
}

/* ── Duplicate: clone an article into a new draft. ── */

async function duplicateArticle(type, sourceSlug) {
  const newTitle = prompt(
    `Duplicate "${sourceSlug}" — new title:`,
    `${sourceSlug} (copy)`
  );
  if (!newTitle) return;

  let newSlug = slugify(newTitle);
  if (!SLUG_RE.test(newSlug)) {
    toast.warn('Could not derive a URL slug from that title. Try a title with letters or numbers.');
    return;
  }
  let candidate = newSlug;
  let n = 2;
  while (!(await isSlugUnique(type, candidate))) {
    candidate = `${newSlug}-${n++}`;
    if (n > 50) { toast.error('Could not find a unique slug.'); return; }
  }
  newSlug = candidate;

  try {
    // Source data: prefer draft over live (most recent edits).
    const draftSnap = await get(ref(db, `drafts/articles/${type}/${sourceSlug}`));
    const liveSnap = !draftSnap.exists() ? await get(ref(db, `pages/articles/${type}/${sourceSlug}`)) : null;
    const sourceData = draftSnap.exists() ? draftSnap.val() : (liveSnap && liveSnap.exists() ? liveSnap.val() : null);
    if (!sourceData) {
      toast.warn(`No draft or published version found for ${type}/${sourceSlug}.`);
      return;
    }

    const today = new Date();
    const dateIso = today.toISOString().slice(0, 10);
    const dateDisplay = today.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();

    // Deep clone, then rewrite identity fields.
    const data = JSON.parse(JSON.stringify(sourceData));
    data.slug = newSlug;
    data.title = newTitle;
    if (data.meta) {
      data.meta = { ...data.meta, title: newTitle, canonical: '' }; // canonical will auto-derive
    }
    if (type === 'case-studies' && data.hero) {
      data.hero = { ...data.hero, title: newTitle, titleAccent: '' };
    }
    data.date = dateDisplay;
    data.datePublished = dateIso;
    data.dateModified = dateIso;

    const clean = JSON.parse(JSON.stringify(data));
    await set(ref(db, `drafts/articles/${type}/${newSlug}`), clean);
    await set(ref(db, `pages/articlesIndex/${type}/${newSlug}`), {
      title: newTitle,
      slug: newSlug,
      category: data.category || typeLabel(type),
      author: data.author || 'Panasa Team',
      date: dateDisplay,
      datePublished: dateIso,
      status: 'draft',
      updatedAt: Date.now(),
    });
    openArticleEditor(type, newSlug);
  } catch (err) {
    console.error('duplicateArticle failed:', err);
    toast.error('Duplicate failed', { detail: friendlyError(err) });
  }
}
