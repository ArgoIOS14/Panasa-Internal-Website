import { createEl, setText } from '../utils/dom.js';
import { highlightWords } from '../utils/text.js';

const renderFeatureCopy = (container, item, ctaLabel) => {
  container.innerHTML = '';

  const pill = createEl('span', 'services-feature-pill');
  pill.textContent = item.title;

  const title = createEl('h3');
  title.textContent = item.title;

  const list = createEl('ul', 'services-feature-list');
  item.bullets.forEach((bullet) => {
    const li = createEl('li');
    li.textContent = bullet;
    list.appendChild(li);
  });

  const cta = createEl('a', 'services-feature-link');
  cta.href = '#contact';
  cta.textContent = ctaLabel;

  container.append(pill, title, list, cta);
};

const renderFeatureVisual = (container, item, visualLabel) => {
  container.innerHTML = '';

  const glow = createEl('div', 'services-visual-glow');
  const label = createEl('span', 'services-visual-label');
  label.textContent = visualLabel || item.title;
  const icon = createEl('img', 'services-visual-icon');
  icon.src = item.icon;
  icon.alt = item.title;

  container.append(glow, icon, label);
};

export const renderServices = (data) => {
  setText('[data-services-pill]', data.pill);

  const titleEl = document.querySelector('[data-services-title]');
  if (titleEl) titleEl.innerHTML = highlightWords(data.title, 1);
  setText('[data-services-subtitle]', data.subtitle);

  const copy = document.querySelector('[data-services-feature-copy]');
  const visual = document.querySelector('[data-services-feature-visual]');
  const dots = document.querySelector('[data-services-dots]');
  if (!copy || !visual || !dots || !data.items?.length) return;

  let activeIndex = 0;

  const updateActiveState = () => {
    const activeItem = data.items[activeIndex];
    renderFeatureCopy(copy, activeItem, data.learnMoreLabel || 'Learn More +');
    renderFeatureVisual(visual, activeItem, data.visualLabel || activeItem.title);

    Array.from(dots.children).forEach((dot, index) => {
      dot.classList.toggle('active', index === activeIndex);
    });
  };

  dots.innerHTML = '';
  data.items.forEach((item, index) => {
    const dot = createEl('button', index === 0 ? 'services-dot active' : 'services-dot');
    dot.type = 'button';
    dot.setAttribute('aria-label', `Show ${item.title}`);
    dot.addEventListener('click', () => {
      activeIndex = index;
      updateActiveState();
    });
    dots.appendChild(dot);
  });

  updateActiveState();
};
