import { initScrollAnimations } from './Home scenes/components/animations.js';
import './smooth-scroll.js';
import { loadContent } from './Home scenes/data/loadContent.js';
import { initNavToggle, renderNav } from './Home scenes/sections/nav.js';
import { renderFooter } from './Home scenes/sections/footer.js';
import { firebaseConfig } from './firebase-config.js';


// Live preview — only loaded in ?preview=true mode (admin panel iframe)
if (new URLSearchParams(window.location.search).get('preview') === 'true') {
  import('./live-preview-receiver.js').catch(() => { /* non-critical */ });
}
const initFilters = () => {
  const search = document.querySelector('.search-wrap input');
  const deptSelect = document.getElementById('department');
  const locSelect = document.getElementById('location');
  const cards = Array.from(document.querySelectorAll('.role-card'));

  if (!cards.length) return;

  const getCardData = (card) => {
    const title = card.querySelector('h3')?.textContent?.toLowerCase() || '';
    const meta = Array.from(card.querySelectorAll('.role-meta span')).map(s => s.textContent.trim());
    return { title, meta, metaText: meta.join(' ').toLowerCase() };
  };

  const cardData = cards.map(card => ({ el: card, ...getCardData(card) }));

  const applyFilters = () => {
    const query = (search?.value || '').toLowerCase().trim();
    const dept = deptSelect?.value || '';
    const loc = locSelect?.value || '';
    const isDeptDefault = dept.startsWith('select') || dept === '';
    const isLocDefault = loc.startsWith('select') || loc === '';

    let visibleCount = 0;

    cardData.forEach(({ el, title, meta, metaText }) => {
      let show = true;

      if (query && !title.includes(query) && !metaText.includes(query)) {
        show = false;
      }

      if (!isDeptDefault && !meta.some(m => m.toLowerCase() === dept.toLowerCase())) {
        show = false;
      }

      if (!isLocDefault && !meta.some(m => m.toLowerCase() === loc.toLowerCase())) {
        show = false;
      }

      el.style.display = show ? '' : 'none';
      if (show) visibleCount++;
    });

    let noResults = document.querySelector('.no-results');
    if (visibleCount === 0) {
      if (!noResults) {
        noResults = document.createElement('p');
        noResults.className = 'no-results';
        noResults.textContent = 'No open roles match your filters.';
        document.querySelector('.role-list')?.appendChild(noResults);
      }
      noResults.style.display = '';
    } else if (noResults) {
      noResults.style.display = 'none';
    }
  };

  search?.addEventListener('input', applyFilters);
  deptSelect?.addEventListener('change', applyFilters);
  locSelect?.addEventListener('change', applyFilters);
};

const buildNav = (nav) => ({
  ...nav,
  links: nav.links.map((link) => ({
    ...link,
    href: link.label === 'Services' ? 'services' : link.href,
  })),
});

const buildFooter = (footer) => ({
  ...footer,
  columns: (footer.columns || []).map((col) => ({
    ...col,
    links: (col.links || []).map((link) => ({
      ...link,
      href: link.href,
    })),
  })),
});

async function fetchPageContent(path) {
  try {
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js');
    const { getDatabase, ref, get } = await import('https://www.gstatic.com/firebasejs/11.1.0/firebase-database.js');
    const app = initializeApp(firebaseConfig, 'careers-reader');
    const db = getDatabase(app);
    const snapshot = await get(ref(db, path));
    return snapshot.exists() ? snapshot.val() : null;
  } catch (e) { console.warn('Firebase fetch failed', e); return null; }
}

function stripTags(str) { if (!str || typeof str !== 'string' || !str.includes('<')) return str || ''; const d = document.createElement('div'); d.innerHTML = str; return d.textContent || ''; }
function deepStripTags(obj) { if (typeof obj === 'string') return stripTags(obj); if (Array.isArray(obj)) return obj.map(deepStripTags); if (obj && typeof obj === 'object') { const o = {}; for (const k of Object.keys(obj)) o[k] = deepStripTags(obj[k]); return o; } return obj; }

function applyCareersContent(fb) {
  if (!fb) return;
  const h = fb.hero || {};
  const heroH1 = document.querySelector('.hero-copy h1');
  if (heroH1 && (h.title || h.titleEmphasis)) heroH1.innerHTML = `<span>${h.title || ''}</span> <em>${h.titleEmphasis || ''}</em>`;
  const heroP = document.querySelector('.hero-copy p');
  if (heroP && h.subtitle) heroP.textContent = h.subtitle;
  const teamPhoto = document.querySelector('[data-team-photo]');
  if (teamPhoto && h.teamPhoto) {
    teamPhoto.src = /^(https?:|assets\/)/.test(h.teamPhoto) ? h.teamPhoto : `assets/${h.teamPhoto}`;
  }

  const r = fb.roles || {};
  const rolesH2 = document.querySelector('.roles-header h2');
  if (rolesH2 && r.heading) rolesH2.textContent = r.heading;

  const jobs = Array.isArray(r.jobs) ? r.jobs : (r.jobs ? Object.values(r.jobs) : []);
  const roleList = document.querySelector('[data-role-list]');
  if (roleList && jobs.length) {
    roleList.innerHTML = jobs.map((job) => {
      const meta = [job.department, job.locationType, job.location, job.experience]
        .filter(Boolean)
        .map((m) => `<span>${m}</span>`)
        .join('\n                ');
      return `<article class="role-card" data-animate>
              <h3>${job.title || ''} <span>Job ID: ${job.jobId || ''}</span></h3>
              <p class="role-meta">
                ${meta}
              </p>
            </article>`;
    }).join('\n            ');

    // Rebuild the Department/Location filter options from the actual job
    // data so the dropdowns always match what's really filterable. The
    // first ("select department" / "select location") placeholder option
    // is preserved as-is; the rest are deduplicated values pulled from the
    // freshly-rendered jobs.
    const rebuildSelectOptions = (select, values) => {
      if (!select) return;
      const placeholder = select.querySelector('option')?.cloneNode(true);
      select.innerHTML = '';
      if (placeholder) select.appendChild(placeholder);
      Array.from(new Set(values.filter(Boolean))).forEach((v) => {
        const opt = document.createElement('option');
        opt.textContent = v;
        select.appendChild(opt);
      });
    };
    rebuildSelectOptions(document.getElementById('department'), jobs.map((j) => j.department));
    rebuildSelectOptions(document.getElementById('location'), jobs.map((j) => j.location));
  }
}

const initCareers = async () => {
  initNavToggle();
  initScrollAnimations();

  try {
    const content = await loadContent();
    if (content.nav) renderNav(buildNav(content.nav));
    if (content.footer) renderFooter(buildFooter(content.footer));
  } catch (err) {
    console.error('Failed to load shared content', err);
    if (window.DEFAULT_CONTENT?.nav) renderNav(buildNav(window.DEFAULT_CONTENT.nav));
    if (window.DEFAULT_CONTENT?.footer) renderFooter(buildFooter(window.DEFAULT_CONTENT.footer));
  }

  // Apply CMS content BEFORE wiring filters, since job cards may be rebuilt
  // from CMS data and initFilters() needs the final .role-card DOM nodes.
  const fbRaw = await fetchPageContent('pages/careers');
  applyCareersContent(fbRaw ? deepStripTags(fbRaw) : null);

  initFilters();
};

initCareers();

// Live preview hook
if (new URLSearchParams(window.location.search).get('preview') === 'true') {
  window.__livePreviewRender = (data) => {
    try { applyCareersContent(data ? deepStripTags(data) : null); }
    catch (e) { console.warn('[live-preview] careers failed:', e); }
  };
}

window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    initScrollAnimations();
  }
});
