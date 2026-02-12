import { createEl, setText } from '../utils/dom.js';

export const renderHero = (data) => {
  setText('[data-hero-pill]', data.pill);
  setText('[data-hero-title]', data.title);
  setText('[data-hero-title-emphasis]', data.titleEmphasis);
  setText('[data-hero-subtitle]', data.subtitle);

  const primary = document.querySelector('[data-hero-cta-primary]');
  if (primary) {
    primary.textContent = data.primaryCta.label;
    primary.href = data.primaryCta.href;
  }

  const secondary = document.querySelector('[data-hero-cta-secondary]');
  if (secondary) {
    secondary.textContent = data.secondaryCta.label;
    secondary.href = data.secondaryCta.href;
  }

  setText('[data-hero-trusted-label]', data.trustedLabel);

  const logos = document.querySelector('[data-hero-trusted-logos]');
  if (logos) {
    logos.innerHTML = '';
    data.trustedLogos.forEach((logo) => {
      const img = createEl('img');
      img.src = logo.src;
      img.alt = logo.alt;
      logos.appendChild(img);
    });
  }

  const badges = document.querySelector('[data-hero-cert-badges]');
  if (badges) {
    badges.innerHTML = '';
    if (data.certImage) {
      const img = createEl('img');
      img.src = data.certImage.src;
      img.alt = data.certImage.alt;
      badges.appendChild(img);
      badges.classList.add('single');
    } else if (data.certBadges) {
      data.certBadges.forEach((badge) => {
        const img = createEl('img');
        img.src = badge.src;
        img.alt = badge.alt;
        badges.appendChild(img);
      });
      badges.classList.remove('single');
    }
  }
};
