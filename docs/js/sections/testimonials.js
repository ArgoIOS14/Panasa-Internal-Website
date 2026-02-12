import { createEl, setText } from '../utils/dom.js';

export const renderTestimonials = (data) => {
  setText('[data-testimonials-pill]', data.pill);
  setText('[data-testimonials-title]', data.title.replace('Trusted by ', ''));
  setText('[data-testimonials-subtitle]', data.subtitle);

  const cards = document.querySelector('[data-testimonials-cards]');
  const logos = document.querySelector('[data-testimonials-logos]');
  if (!cards || !logos) return;

  cards.innerHTML = '';
  logos.innerHTML = '';

  data.cards.forEach((item) => {
    const card = createEl('article', 'trust-card');
    const p = createEl('p');
    p.textContent = `“${item.text}”`;

    const person = createEl('div', 'person');
    const avatar = createEl('div');

    const name = createEl('strong');
    name.textContent = item.name;

    const role = createEl('span');
    role.textContent = item.role;

    avatar.append(name, role);

    const logo = createEl('img');
    logo.className = 'testimonial-logo';
    logo.src = item.logo;
    logo.alt = item.name;

    person.append(avatar, logo);
    card.append(p, person);
    cards.appendChild(card);

    const logoText = createEl('span');
    logoText.textContent = item.name;
    logos.appendChild(logoText);
  });
};
