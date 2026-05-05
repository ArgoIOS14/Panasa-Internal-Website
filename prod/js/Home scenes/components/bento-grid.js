import { createEl } from '../utils/dom.js';

/* Mixed-media bento grid that lays out 1–5 tiles correctly at every count.
   Tile kinds: 'image' | 'chart' | 'stat'.
   - 'image' / 'chart' render with eyebrow + title + description at the top
      and an image filling the bottom of the card. (Pre-existing tiles using
      a `caption` field still render — `description` is preferred when both exist.)
   - 'stat' renders a small card with eyebrow + title + metric + label.
   The grid layout (grid-template-areas per data-count) lives in
   case-study-detail.css so the same component can be styled in context. */

const resolveAsset = (path) => {
  if (!path) return path;
  if (path.startsWith('..') || path.startsWith('/') || path.startsWith('http') || path.startsWith('data:')) return path;
  return `../${path}`;
};

const renderImageTile = (tile) => {
  const fig = createEl('figure', `bento-tile bento-tile--${tile.kind}`);

  /* Top: text content (eyebrow → title → description). */
  const text = createEl('div', 'bento-tile-text');
  if (tile.eyebrow) {
    const eb = createEl('span', 'bento-tile-eyebrow');
    eb.textContent = tile.eyebrow;
    text.appendChild(eb);
  }
  if (tile.title) {
    const t = createEl('h3', 'bento-tile-title');
    t.textContent = tile.title;
    text.appendChild(t);
  }
  /* `description` is the primary long-form copy; fall back to `caption` for
     content authored under the older schema. */
  const desc = tile.description || tile.caption;
  if (desc) {
    const p = createEl('p', 'bento-tile-desc');
    p.textContent = desc;
    text.appendChild(p);
  }
  if (text.children.length) fig.appendChild(text);

  /* Bottom: image (fills remaining vertical space). */
  if (tile.src) {
    const wrap = createEl('div', 'bento-tile-img-wrap');
    const img = createEl('img', 'bento-tile-img');
    img.src = resolveAsset(tile.src);
    img.alt = tile.alt || tile.title || '';
    wrap.appendChild(img);
    fig.appendChild(wrap);
  }

  return fig;
};

const renderStatTile = (tile) => {
  const card = createEl('div', 'bento-tile bento-tile--stat');
  if (tile.eyebrow) {
    const e = createEl('span', 'bento-tile-eyebrow');
    e.textContent = tile.eyebrow;
    card.appendChild(e);
  }
  if (tile.title) {
    const t = createEl('span', 'bento-tile-stat-title');
    t.textContent = tile.title;
    card.appendChild(t);
  }
  if (tile.metric) {
    const m = createEl('strong', 'bento-tile-stat-metric');
    m.textContent = tile.metric;
    card.appendChild(m);
  }
  if (tile.label) {
    const l = createEl('span', 'bento-tile-stat-label');
    l.textContent = tile.label;
    card.appendChild(l);
  }
  return card;
};

export const renderBentoGrid = (tiles, options = {}) => {
  const list = Array.isArray(tiles) ? tiles.filter(Boolean).slice(0, 5) : [];
  const grid = createEl('div', 'bento-grid');
  grid.dataset.count = String(list.length);
  if (options.variant) grid.dataset.variant = options.variant;

  list.forEach((tile, idx) => {
    const kind = tile.kind || 'image';
    const node = kind === 'stat' ? renderStatTile(tile) : renderImageTile({ ...tile, kind });
    /* `data-slot` lets CSS map each tile to its grid-area letter (a/b/c/d/e). */
    node.dataset.slot = String.fromCharCode(97 + idx);
    grid.appendChild(node);
  });

  return grid;
};
