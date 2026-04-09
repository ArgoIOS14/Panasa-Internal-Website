const stripTags = (str) => {
  if (!str || typeof str !== 'string' || !str.includes('<')) return str || '';
  const d = document.createElement('div');
  d.innerHTML = str;
  return d.textContent || '';
};

export const setText = (selector, value) => {
  const el = document.querySelector(selector);
  if (el) el.textContent = stripTags(value);
};

export const createEl = (tag, className) => {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (tag === 'img') {
    el.loading = 'lazy';
    el.decoding = 'async';
  }
  return el;
};
