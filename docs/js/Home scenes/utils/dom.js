export const setText = (selector, value) => {
  const el = document.querySelector(selector);
  if (el) el.textContent = value || '';
};

export const createEl = (tag, className) => {
  const el = document.createElement(tag);
  if (className) el.className = className;
  return el;
};
