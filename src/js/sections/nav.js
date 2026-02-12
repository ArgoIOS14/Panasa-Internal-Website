import { createEl } from '../utils/dom.js';

export const initNavToggle = () => {
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      navLinks.classList.toggle('open');
    });
  }
};

export const renderNav = (data) => {
  const container = document.querySelector('[data-nav-links]');
  if (!container) return;
  container.innerHTML = '';

  data.links.forEach((link) => {
    const li = createEl('li');
    const a = createEl('a');
    a.textContent = link.label;
    a.href = link.href;
    li.appendChild(a);
    container.appendChild(li);
  });

  const ctaLi = createEl('li');
  const cta = createEl('a', 'btn btn-light');
  cta.textContent = data.cta.label;
  cta.href = data.cta.href;
  ctaLi.appendChild(cta);
  container.appendChild(ctaLi);
};
