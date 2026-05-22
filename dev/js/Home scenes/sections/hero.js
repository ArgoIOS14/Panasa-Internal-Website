import { createEl, setText } from '../utils/dom.js';
import { renderLogoMarquee } from './logoMarquee.js';

const setHeroAction = (element, cta, iconSrc, iconAlt = '') => {
  if (!element || !cta) return;

  element.href = cta.href;
  element.innerHTML = '';

  const icon = createEl('img', 'hero-action-icon');
  icon.src = iconSrc;
  icon.alt = iconAlt;
  icon.setAttribute('aria-hidden', 'true');

  const label = createEl('span', 'hero-action-label');
  label.textContent = cta.label;

  element.append(icon, label);
};

export const renderHero = (data) => {
  setText('[data-hero-pill]', data.pill);
  setText('[data-hero-title]', data.title);
  setText('[data-hero-title-emphasis]', data.titleEmphasis);
  setText('[data-hero-subtitle]', data.subtitle);

  const primary = document.querySelector('[data-hero-cta-primary]');
  setHeroAction(primary, data.primaryCta, data.primaryCta?.icon || 'assets/hero-cta-talk-icon.svg');

  const secondary = document.querySelector('[data-hero-cta-secondary]');
  setHeroAction(secondary, data.secondaryCta, data.secondaryCta?.icon || 'assets/hero-cta-view-icon.svg');

  setText('[data-hero-trusted-label]', data.trustedLabel);

  const logosContainer = document.querySelector('[data-hero-trusted-logos]');
  logosContainer?.classList.add('logo-marquee', 'logo-marquee-light');
  renderLogoMarquee('[data-hero-trusted-logos]', data.trustedLogos || []);

  const certTitleEl = document.querySelector('[data-hero-cert-title]');
  if (certTitleEl && data.certTitle) {
    certTitleEl.innerHTML = data.certTitle.replace(/\n/g, '<br/>');
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
      data.certBadges.forEach((badge, index) => {
        if (index > 0) {
          const dot = createEl('span', 'cert-strip-dot');
          dot.setAttribute('aria-hidden', 'true');
          dot.textContent = '·';
          badges.appendChild(dot);
        }
        const img = createEl('img', 'cert-strip-badge');
        img.src = badge.src;
        img.alt = badge.alt;
        badges.appendChild(img);
      });
      badges.classList.remove('single');
    }
  }
};
