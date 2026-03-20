import { createEl } from '../utils/dom.js';

export const renderLogoMarquee = (selector, logos) => {
  const root = document.querySelector(selector);
  if (!root) return;

  root.innerHTML = '';
  const track = createEl('div', 'logo-marquee-track');
  const marqueeLogos = [...logos, ...logos];

  marqueeLogos.forEach((logo, index) => {
    const item = createEl('div', 'logo-marquee-item');
    const img = createEl('img');
    img.src = logo.src;
    img.alt = logo.alt;
    if (index >= logos.length) img.setAttribute('aria-hidden', 'true');
    item.appendChild(img);
    track.appendChild(item);
  });

  root.appendChild(track);
};
