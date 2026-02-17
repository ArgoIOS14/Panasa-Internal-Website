const initNavToggle = () => {
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('[data-nav-links]');
  if (!navToggle || !navLinks) return;

  navToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });
};

const initScrollAnimations = () => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
        } else {
          entry.target.classList.remove('in-view');
        }
      });
    },
    {
      threshold: 0.15,
    }
  );

  document.querySelectorAll('[data-animate]').forEach((el) => observer.observe(el));
};

initNavToggle();
initScrollAnimations();
