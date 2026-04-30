import { createEl } from '../utils/dom.js';

/* Mixed-media bento grid that lays out 1–5 tiles correctly at every count.
   Tile kinds: 'image' | 'chart' | 'stat'.
   - 'image' / 'chart' render an <img> with optional <figcaption>.
   - 'stat' renders a small card with title + metric + label.
   The grid layout (grid-template-areas per data-count) lives in
   case-study-detail.css so the same component can be styled in context. */

const resolveAsset = (path) => {
  if (!path) return path;
  if (path.startsWith('..') || path.startsWith('/') || path.startsWith('http') || path.startsWith('data:')) return path;
  return `../${path}`;
};

const renderImageTile = (tile) => {
  const fig = createEl('figure', `bento-tile bento-tile--${tile.kind}`);
  const img = createEl('img', 'bento-tile-img');
  img.src = resolveAsset(tile.src);
  img.alt = tile.alt || tile.caption || tile.title || '';
  fig.appendChild(img);

  if (tile.caption || tile.title) {
    const cap = createEl('figcaption', 'bento-tile-caption');
    if (tile.title) {
      const t = createEl('span', 'bento-tile-caption-title');
      t.textContent = tile.title;
      cap.appendChild(t);
    }
    if (tile.caption) {
      const c = createEl('span', 'bento-tile-caption-text');
      c.textContent = tile.caption;
      cap.appendChild(c);
    }
    fig.appendChild(cap);
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
