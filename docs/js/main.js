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

const carousel = document.querySelector('[data-carousel]');
if (carousel) {
  const slides = Array.from(carousel.querySelectorAll('.slide'));
  const dots = Array.from(carousel.querySelectorAll('.dot'));
  let index = 0;

  const showSlide = (nextIndex) => {
    slides[index].classList.remove('active');
    dots[index].classList.remove('active');
    index = nextIndex;
    slides[index].classList.add('active');
    dots[index].classList.add('active');
  };

  dots.forEach((dot, dotIndex) => {
    dot.addEventListener('click', () => showSlide(dotIndex));
  });
}
