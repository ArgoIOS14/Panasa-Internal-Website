import { initScrollAnimations } from './Home scenes/components/animations.js';
import { loadContent } from './Home scenes/data/loadContent.js';
import { renderFooter } from './Home scenes/sections/footer.js';
import { initNavToggle, renderNav } from './Home scenes/sections/nav.js';

const resolveToSiteHref = (href) => {
  if (href === '#contact') return 'contact.html';
  if (href === '#services') return 'services.html';
  if (href.startsWith('#')) return `index.html${href}`;
  return href;
};

const buildContactNav = (nav) => ({
  ...nav,
  links: nav.links.map((link) => ({
    ...link,
    href: link.label === 'Services' ? 'services.html' : resolveToSiteHref(link.href),
  })),
  cta: {
    ...nav.cta,
    href: 'contact.html',
  },
});

const buildContactFooter = (footer) => ({
  ...footer,
  columns: footer.columns.map((column) => ({
    ...column,
    links: column.links.map((link) => ({
      ...link,
      href:
        link.label.toLowerCase() === 'contact'
          ? 'contact.html'
          : resolveToSiteHref(link.href),
    })),
  })),
  legal: {
    ...footer.legal,
    links: footer.legal.links.map((link) => ({
      ...link,
      href: '#top',
    })),
  },
});

const SHEET_URL =
  'https://script.google.com/macros/s/AKfycbwBVGKg2rXOnW0T3JVyaOTZVNrMcxY0WVjFnC8AlCYAXcbx7YNJQvbnoowfgbzpcKWw/exec';

const COUNTRY_CODES = [
  { name: 'India', code: '+91', flag: '🇮🇳' },
  { name: 'United Kingdom', code: '+44', flag: '🇬🇧' },
  { name: 'United States', code: '+1', flag: '🇺🇸' },
  { name: 'Canada', code: '+1', flag: '🇨🇦' },
  { name: 'Australia', code: '+61', flag: '🇦🇺' },
  { name: 'Germany', code: '+49', flag: '🇩🇪' },
  { name: 'France', code: '+33', flag: '🇫🇷' },
  { name: 'Singapore', code: '+65', flag: '🇸🇬' },
  { name: 'UAE', code: '+971', flag: '🇦🇪' },
  { name: 'Saudi Arabia', code: '+966', flag: '🇸🇦' },
  { name: 'Netherlands', code: '+31', flag: '🇳🇱' },
  { name: 'Ireland', code: '+353', flag: '🇮🇪' },
  { name: 'Switzerland', code: '+41', flag: '🇨🇭' },
  { name: 'Hong Kong', code: '+852', flag: '🇭🇰' },
  { name: 'Japan', code: '+81', flag: '🇯🇵' },
  { name: 'South Korea', code: '+82', flag: '🇰🇷' },
  { name: 'China', code: '+86', flag: '🇨🇳' },
  { name: 'Brazil', code: '+55', flag: '🇧🇷' },
  { name: 'South Africa', code: '+27', flag: '🇿🇦' },
  { name: 'Nigeria', code: '+234', flag: '🇳🇬' },
  { name: 'Kenya', code: '+254', flag: '🇰🇪' },
  { name: 'Malaysia', code: '+60', flag: '🇲🇾' },
  { name: 'Indonesia', code: '+62', flag: '🇮🇩' },
  { name: 'Philippines', code: '+63', flag: '🇵🇭' },
  { name: 'Thailand', code: '+66', flag: '🇹🇭' },
  { name: 'Vietnam', code: '+84', flag: '🇻🇳' },
  { name: 'Pakistan', code: '+92', flag: '🇵🇰' },
  { name: 'Bangladesh', code: '+880', flag: '🇧🇩' },
  { name: 'Sri Lanka', code: '+94', flag: '🇱🇰' },
  { name: 'Italy', code: '+39', flag: '🇮🇹' },
  { name: 'Spain', code: '+34', flag: '🇪🇸' },
  { name: 'Portugal', code: '+351', flag: '🇵🇹' },
  { name: 'Sweden', code: '+46', flag: '🇸🇪' },
  { name: 'Norway', code: '+47', flag: '🇳🇴' },
  { name: 'Denmark', code: '+45', flag: '🇩🇰' },
  { name: 'Finland', code: '+358', flag: '🇫🇮' },
  { name: 'Poland', code: '+48', flag: '🇵🇱' },
  { name: 'Belgium', code: '+32', flag: '🇧🇪' },
  { name: 'Austria', code: '+43', flag: '🇦🇹' },
  { name: 'New Zealand', code: '+64', flag: '🇳🇿' },
  { name: 'Mexico', code: '+52', flag: '🇲🇽' },
  { name: 'Argentina', code: '+54', flag: '🇦🇷' },
  { name: 'Colombia', code: '+57', flag: '🇨🇴' },
  { name: 'Chile', code: '+56', flag: '🇨🇱' },
  { name: 'Egypt', code: '+20', flag: '🇪🇬' },
  { name: 'Israel', code: '+972', flag: '🇮🇱' },
  { name: 'Turkey', code: '+90', flag: '🇹🇷' },
  { name: 'Russia', code: '+7', flag: '🇷🇺' },
  { name: 'Qatar', code: '+974', flag: '🇶🇦' },
  { name: 'Bahrain', code: '+973', flag: '🇧🇭' },
  { name: 'Kuwait', code: '+965', flag: '🇰🇼' },
  { name: 'Oman', code: '+968', flag: '🇴🇲' },
];

const initPhoneCodePicker = () => {
  const wrapper = document.querySelector('.phone-code-wrapper');
  if (!wrapper) return;

  const btn = wrapper.querySelector('.phone-code-btn');
  const dropdown = wrapper.querySelector('.phone-code-dropdown');
  const search = wrapper.querySelector('.phone-code-search');
  const list = wrapper.querySelector('.phone-code-list');
  const flagSpan = btn.querySelector('.phone-code-flag');
  const valueSpan = btn.querySelector('.phone-code-value');

  const renderList = (filter = '') => {
    const q = filter.toLowerCase();
    list.innerHTML = '';
    COUNTRY_CODES
      .filter((c) => !q || c.name.toLowerCase().includes(q) || c.code.includes(q))
      .forEach((c) => {
        const li = document.createElement('li');
        li.innerHTML = `<span class="code-flag">${c.flag}</span><span>${c.name}</span><span class="code-dial">${c.code}</span>`;
        li.addEventListener('click', () => {
          flagSpan.textContent = c.flag;
          valueSpan.textContent = c.code;
          btn.dataset.phoneCode = c.code;
          dropdown.hidden = true;
          search.value = '';
        });
        list.appendChild(li);
      });
  };

  btn.addEventListener('click', () => {
    dropdown.hidden = !dropdown.hidden;
    if (!dropdown.hidden) {
      renderList();
      search.focus();
    }
  });

  search.addEventListener('input', () => renderList(search.value));

  document.addEventListener('click', (e) => {
    if (!wrapper.contains(e.target)) dropdown.hidden = true;
  });
};

const initContactForm = () => {
  const form = document.querySelector('[data-contact-form]');
  if (!form) return;

  initPhoneCodePicker();

  const btn = form.querySelector('button[type="submit"]');
  const btnText = btn?.textContent || 'Send Message';

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const phoneCodeBtn = form.querySelector('.phone-code-btn');
    const phoneCode = phoneCodeBtn?.dataset.phoneCode || '+91';

    const data = {
      firstName: form.firstName.value.trim(),
      lastName: form.lastName.value.trim(),
      email: form.email.value.trim(),
      phone: phoneCode + ' ' + form.phone.value.trim(),
      message: form.requirements.value.trim(),
    };

    if (!data.firstName || !data.email || !data.message) {
      alert('Please fill in your name, email, and message.');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Sending...';

    try {
      const formData = new FormData();
      formData.append('firstName', data.firstName);
      formData.append('lastName', data.lastName);
      formData.append('email', data.email);
      formData.append('phone', data.phone);
      formData.append('message', data.message);

      await fetch(SHEET_URL, {
        method: 'POST',
        body: formData,
      });
      form.reset();
      btn.textContent = 'Message Sent!';
      setTimeout(() => {
        btn.textContent = btnText;
        btn.disabled = false;
      }, 3000);
    } catch {
      btn.textContent = btnText;
      btn.disabled = false;
      alert('Something went wrong. Please try again.');
    }
  });
};

const initContact = async () => {
  initNavToggle();
  initScrollAnimations();
  initContactForm();

  try {
    const content = await loadContent();
    renderNav(buildContactNav(content.nav));
    renderFooter(buildContactFooter(content.footer));
  } catch (err) {
    console.error('Failed to load shared contact content', err);
    if (window.DEFAULT_CONTENT?.nav) renderNav(buildContactNav(window.DEFAULT_CONTENT.nav));
    if (window.DEFAULT_CONTENT?.footer) renderFooter(buildContactFooter(window.DEFAULT_CONTENT.footer));
  }
};

initContact();

window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    initScrollAnimations();
  }
});
