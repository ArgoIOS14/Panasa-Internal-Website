import { renderSharedTestimonials } from './sharedTestimonials.js';

export const renderTestimonials = (data) => {
  const pillEl = document.querySelector('[data-testimonials-pill]');
  if (pillEl) {
    if (data.pill) {
      pillEl.textContent = data.pill;
      pillEl.style.display = '';
    } else {
      pillEl.textContent = '';
      pillEl.style.display = 'none';
    }
  }
  renderSharedTestimonials(data);
};
