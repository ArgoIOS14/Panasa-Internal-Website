const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');

if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });
}

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.2,
  }
);

document.querySelectorAll('[data-animate]').forEach((el) => observer.observe(el));

const setText = (selector, value) => {
  const el = document.querySelector(selector);
  if (el) el.textContent = value || '';
};

const createEl = (tag, className) => {
  const el = document.createElement(tag);
  if (className) el.className = className;
  return el;
};

const highlightWords = (text, wordsCount) => {
  const words = text.split(' ');
  const head = words.slice(0, wordsCount).join(' ');
  const tail = words.slice(wordsCount).join(' ');
  return `<span>${head}</span> ${tail}`.trim();
};

const renderNav = (data) => {
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

const renderHero = (data) => {
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
    data.certBadges.forEach((badge) => {
      const img = createEl('img');
      img.src = badge.src;
      img.alt = badge.alt;
      badges.appendChild(img);
    });
  }
};

const renderServices = (data) => {
  setText('[data-services-pill]', data.pill);
  const titleEl = document.querySelector('[data-services-title]');
  if (titleEl) titleEl.innerHTML = highlightWords(data.title, 1);
  setText('[data-services-subtitle]', data.subtitle);
  const grid = document.querySelector('[data-services-grid]');
  if (!grid) return;
  grid.innerHTML = '';
  data.items.forEach((item) => {
    const card = createEl('article', 'service-card');
    const img = createEl('img');
    img.src = item.icon;
    img.alt = item.title;
    const h3 = createEl('h3');
    h3.textContent = item.title;
    const p = createEl('p');
    p.textContent = item.text;
    const ul = createEl('ul');
    item.bullets.forEach((bullet) => {
      const li = createEl('li');
      li.textContent = bullet;
      ul.appendChild(li);
    });
    card.append(img, h3, p, ul);
    grid.appendChild(card);
  });
};

const renderWhy = (data) => {
  setText('[data-why-pill]', data.pill);
  const titleEl = document.querySelector('[data-why-title]');
  if (titleEl) {
    titleEl.innerHTML = `Why fintechs choose <span>Panasa</span>`;
  }
  setText('[data-why-subtitle]', data.subtitle);
  const container = document.querySelector('[data-why-cards]');
  if (!container) return;
  container.innerHTML = '';
  data.cards.forEach((cardData) => {
    const card = createEl('article', `feature-card ${cardData.style}`);
    if (cardData.imageType === 'tags') {
      const box = createEl('div', 'card-image soft');
      const tags = createEl('div', 'chip-tags');
      cardData.tags.forEach((tag) => {
        const span = createEl('span');
        span.textContent = tag;
        tags.appendChild(span);
      });
      box.appendChild(tags);
      card.appendChild(box);
    } else {
      const img = createEl('img', 'card-image');
      img.src = cardData.image;
      img.alt = cardData.title;
      card.appendChild(img);
    }
    const textWrap = createEl('div');
    const h3 = createEl('h3');
    h3.textContent = cardData.title;
    const p = createEl('p');
    p.textContent = cardData.text;
    textWrap.append(h3, p);
    card.appendChild(textWrap);
    container.appendChild(card);
  });
};

const renderCaseStudies = (data) => {
  setText('[data-case-pill]', data.pill);
  const titleEl = document.querySelector('[data-case-title]');
  if (titleEl) titleEl.innerHTML = highlightWords(data.title, 2);
  setText('[data-case-subtitle]', data.subtitle);
  const slidesContainer = document.querySelector('[data-case-slides]');
  const dotsContainer = document.querySelector('[data-case-dots]');
  if (!slidesContainer || !dotsContainer) return;
  slidesContainer.innerHTML = '';
  dotsContainer.innerHTML = '';

  data.slides.forEach((slide, index) => {
    const article = createEl('article', 'slide');
    const card = createEl('div', 'results-card');
    const left = createEl('div');
    const eyebrow = createEl('span', 'eyebrow');
    eyebrow.textContent = slide.eyebrow;
    const h3 = createEl('h3');
    h3.textContent = slide.title;
    const p = createEl('p');
    p.textContent = slide.text;
    const img = createEl('img', 'case-image');
    img.src = slide.image;
    img.alt = slide.title;
    const cta = createEl('a', 'btn btn-dark');
    cta.textContent = slide.cta.label;
    cta.href = slide.cta.href;
    left.append(eyebrow, h3, p, img, cta);

    const metrics = createEl('div', 'results-metrics');
    slide.metrics.forEach((metric) => {
      const box = createEl('div');
      const value = createEl('h4');
      value.textContent = metric.value;
      const label = createEl('span');
      label.textContent = metric.label;
      box.append(value, label);
      metrics.appendChild(box);
    });

    card.append(left, metrics);
    article.appendChild(card);
    slidesContainer.appendChild(article);

    const dot = createEl('button', index === 0 ? 'dot active' : 'dot');
    dot.setAttribute('data-slide', index.toString());
    dot.setAttribute('aria-label', `Slide ${index + 1}`);
    dotsContainer.appendChild(dot);
  });
};

const renderTestimonials = (data) => {
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
    logo.src = item.logo;
    logo.alt = item.name;
    person.append(logo, avatar);
    card.append(p, person);
    cards.appendChild(card);

    const logoText = createEl('span');
    logoText.textContent = item.name;
    logos.appendChild(logoText);
  });
};

const renderEngagement = (data) => {
  setText('[data-engagement-pill]', data.pill);
  const titleEl = document.querySelector('[data-engagement-title]');
  if (titleEl) titleEl.innerHTML = highlightWords(data.title, 1);
  setText('[data-engagement-subtitle]', data.subtitle);
  setText('[data-engagement-note]', data.note);
  const grid = document.querySelector('[data-engagement-grid]');
  if (!grid) return;
  grid.innerHTML = '';
  data.items.forEach((item) => {
    const card = createEl('article', `engagement-card${item.variant === 'featured' ? ' featured' : ''}`);
    const img = createEl('img', 'engagement-image');
    img.src = item.image;
    img.alt = item.title;
    const h3 = createEl('h3');
    h3.textContent = item.title;
    const p = createEl('p');
    p.textContent = item.text;
    const ul = createEl('ul');
    item.bullets.forEach((bullet) => {
      const li = createEl('li');
      li.textContent = bullet;
      ul.appendChild(li);
    });
    const btn = createEl('button', 'btn btn-dark');
    btn.textContent = item.cta;
    card.append(img, h3, p, ul, btn);
    grid.appendChild(card);
  });
};

const renderFooter = (data) => {
  setText('[data-footer-cta-title]', data.ctaTitle);
  setText('[data-footer-cta-text]', data.ctaText);
  const ctaBtn = document.querySelector('[data-footer-cta-button]');
  if (ctaBtn) ctaBtn.textContent = data.ctaButton;
  setText('[data-footer-brand-text]', data.brandText);
  setText('[data-footer-email]', data.email);
  setText('[data-footer-phone]', data.phone);

  const columns = document.querySelector('[data-footer-columns]');
  if (columns) {
    columns.innerHTML = '';
    data.columns.forEach((column) => {
      const col = createEl('div');
      const h4 = createEl('h4');
      h4.textContent = column.title;
      col.appendChild(h4);
      column.links.forEach((link) => {
        const a = createEl('a');
        a.textContent = link.label;
        a.href = link.href;
        col.appendChild(a);
      });
      columns.appendChild(col);
    });
  }

  setText('[data-footer-copyright]', data.legal.copyright);
  const legal = document.querySelector('[data-footer-legal-links]');
  if (legal) {
    legal.innerHTML = '';
    data.legal.links.forEach((link) => {
      const a = createEl('a');
      a.textContent = link.label;
      a.href = link.href;
      legal.appendChild(a);
    });
  }
};

const initCarousel = () => {
  const carousel = document.querySelector('[data-carousel]');
  const track = carousel?.querySelector('.slides');
  if (!carousel || !track) return;
  const slides = Array.from(track.children);
  const dots = Array.from(carousel.querySelectorAll('.dot'));
  if (!slides.length) return;

  let index = 0;
  let startX = 0;
  let currentX = 0;
  let deltaX = 0;
  let isDragging = false;
  let timerId = null;

  const getWidth = () => carousel.getBoundingClientRect().width;

  const setTranslate = (value, animate = true) => {
    track.style.transition = animate ? 'transform 0.5s ease' : 'none';
    track.style.transform = `translateX(${value}px)`;
  };

  const goTo = (nextIndex, animate = true) => {
    index = Math.max(0, Math.min(nextIndex, slides.length - 1));
    dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
    const offset = -index * getWidth();
    setTranslate(offset, animate);
  };

  const goNext = () => goTo((index + 1) % slides.length);
  const goPrev = () => goTo((index - 1 + slides.length) % slides.length);

  const startAuto = () => {
    const delay = pauseUntil - Date.now();
    if (delay > 0) {
      resumeTimer = setTimeout(startAuto, delay);
      return;
    }
    timerId = setInterval(goNext, 3500);
  };

  const stopAuto = () => {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
    if (resumeTimer) {
      clearTimeout(resumeTimer);
      resumeTimer = null;
    }
  };

  const pauseAuto = (ms = 3000) => {
    pauseUntil = Date.now() + ms;
    stopAuto();
    startAuto();
  };

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      goTo(i);
      pauseAuto();
    });
  });

  const onPointerDown = (event) => {
    isDragging = true;
    startX = event.clientX;
    currentX = startX;
    deltaX = 0;
    pauseAuto();
    track.setPointerCapture?.(event.pointerId);
    setTranslate(-index * getWidth(), false);
  };

  const onPointerMove = (event) => {
    if (!isDragging) return;
    currentX = event.clientX;
    deltaX = currentX - startX;
    const offset = -index * getWidth() + deltaX;
    setTranslate(offset, false);
  };

  const onPointerUp = (event) => {
    if (!isDragging) return;
    isDragging = false;
    track.releasePointerCapture?.(event.pointerId);
    const threshold = getWidth() * 0.2;
    if (Math.abs(deltaX) > threshold) {
      if (deltaX < 0) {
        goNext();
      } else {
        goPrev();
      }
    } else {
      goTo(index);
    }
    pauseAuto();
  };

  carousel.addEventListener('pointerdown', onPointerDown);
  carousel.addEventListener('pointermove', onPointerMove);
  carousel.addEventListener('pointerup', onPointerUp);
  carousel.addEventListener('pointerleave', onPointerUp);

  carousel.addEventListener('mouseenter', stopAuto);
  carousel.addEventListener('mouseleave', startAuto);
  window.addEventListener('resize', () => goTo(index, false));

  goTo(0, false);
  startAuto();
};

const renderPage = (content) => {
  document.title = content.meta.title;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute('content', content.meta.description);
  renderNav(content.nav);
  renderHero(content.hero);
  renderServices(content.services);
  renderWhy(content.why);
  renderCaseStudies(content.caseStudies);
  renderTestimonials(content.testimonials);
  renderEngagement(content.engagement);
  renderFooter(content.footer);
  initCarousel();
};

const DATA_URL = window.STRAPI_URL || 'data/content.json';

fetch(DATA_URL)
  .then((res) => res.json())
  .then((content) => renderPage(content))
  .catch((err) => {
    console.error('Failed to load content.json', err);
    if (window.DEFAULT_CONTENT) renderPage(window.DEFAULT_CONTENT);
  });
