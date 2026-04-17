import { initScrollAnimations } from './Home scenes/components/animations.js';
import { loadContent } from './Home scenes/data/loadContent.js';
import { initNavToggle, renderNav } from './Home scenes/sections/nav.js';
import { renderFooter } from './Home scenes/sections/footer.js';

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

const initCareers = async () => {
  initNavToggle();
  initScrollAnimations();
  initFilters();

  try {
    const content = await loadContent();
    if (content.nav) renderNav(buildNav(content.nav));
    if (content.footer) renderFooter(buildFooter(content.footer));
  } catch (err) {
    console.error('Failed to load shared content', err);
    if (window.DEFAULT_CONTENT?.nav) renderNav(buildNav(window.DEFAULT_CONTENT.nav));
    if (window.DEFAULT_CONTENT?.footer) renderFooter(buildFooter(window.DEFAULT_CONTENT.footer));
  }
};

initCareers();

window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    initScrollAnimations();
  }
});
