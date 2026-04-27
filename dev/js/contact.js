import { initScrollAnimations } from './Home scenes/components/animations.js';
import './smooth-scroll.js';
import { loadContent } from './Home scenes/data/loadContent.js';
import { renderFooter } from './Home scenes/sections/footer.js';
import { initNavToggle, renderNav } from './Home scenes/sections/nav.js';
import { firebaseConfig } from './firebase-config.js';


// Live preview — only loaded in ?preview=true mode (admin panel iframe)
if (new URLSearchParams(window.location.search).get('preview') === 'true') {
  import('./live-preview-receiver.js').catch(() => { /* non-critical */ });
}
const resolveToSiteHref = (href) => {
  if (href === '#contact') return 'contact';
  if (href === '#services') return 'ai-accelerated-fintech-engineering';
  if (href.startsWith('#')) return `/${href}`;
  return href;
};

const buildContactNav = (nav) => ({
  ...nav,
  links: nav.links.map((link) => ({
    ...link,
    href: link.label === 'Services' ? 'services' : resolveToSiteHref(link.href),
  })),
  cta: {
    ...nav.cta,
    href: 'contact',
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
          ? 'contact'
          : resolveToSiteHref(link.href),
    })),
  })),
  legal: footer.legal,
});

const API_URL = '/api/zoho-proxy.php';

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

const PHONE_LENGTHS = {
  '+1': [10], '+7': [10], '+20': [10], '+27': [9], '+31': [9], '+32': [8,9],
  '+33': [9], '+34': [9], '+39': [9,10], '+41': [9], '+43': [9,10], '+44': [10],
  '+45': [8], '+46': [9], '+47': [8], '+48': [9], '+49': [10,11], '+52': [10],
  '+54': [10], '+55': [10,11], '+56': [9], '+57': [10], '+60': [9,10], '+61': [9],
  '+62': [9,10,11,12], '+63': [10], '+64': [8,9], '+65': [8], '+66': [9],
  '+81': [10,11], '+82': [9,10,11], '+84': [9,10], '+86': [11], '+90': [10],
  '+91': [10], '+92': [10], '+94': [9], '+234': [10], '+254': [9],
  '+351': [9], '+353': [9], '+358': [9,10], '+852': [8], '+880': [10],
  '+965': [8], '+966': [9], '+968': [8], '+971': [9], '+972': [9],
  '+973': [8], '+974': [8],
};

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);

const isValidPhone = (phone, code) => {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return false;
  const lengths = PHONE_LENGTHS[code];
  if (lengths) return lengths.includes(digits.length);
  return digits.length >= 7 && digits.length <= 15;
};

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
        li.dataset.code = c.code;
        li.dataset.flag = c.flag;
        li.dataset.name = c.name;
        const flagEl = document.createElement('span');
        flagEl.className = 'code-flag';
        flagEl.textContent = c.flag;
        const nameEl = document.createElement('span');
        nameEl.textContent = c.name;
        const dialEl = document.createElement('span');
        dialEl.className = 'code-dial';
        dialEl.textContent = c.code;
        li.append(flagEl, nameEl, dialEl);
        list.appendChild(li);
      });
  };

  let justSelected = false;

  list.addEventListener('mousedown', (e) => {
    const li = e.target.closest('li');
    if (!li) return;
    flagSpan.textContent = li.dataset.flag;
    valueSpan.textContent = li.dataset.code;
    btn.dataset.phoneCode = li.dataset.code;
    btn.dataset.phoneName = li.dataset.name;
    search.value = '';
    justSelected = true;
    dropdown.classList.remove('open');
  });

  btn.addEventListener('click', () => {
    if (justSelected) {
      justSelected = false;
      return;
    }
    const isOpen = dropdown.classList.toggle('open');
    if (isOpen) {
      renderList();
      setTimeout(() => search.focus(), 0);
    }
  });

  search.addEventListener('input', () => renderList(search.value));

  document.addEventListener('mousedown', (e) => {
    if (!wrapper.contains(e.target)) {
      dropdown.classList.remove('open');
    }
  });
};

const initContactForm = () => {
  const form = document.querySelector('[data-contact-form]');
  if (!form) return;

  initPhoneCodePicker();

  const submitBtn = form.querySelector('button[type="submit"]');
  const btnText = submitBtn?.textContent || 'Send Message';
  const fields = {
    firstName: form.firstName,
    lastName: form.lastName,
    email: form.querySelector('input[name="email"]'),
    phone: form.phone,
    message: form.requirements,
  };

  submitBtn.disabled = true;

  const clearError = (field) => {
    const wrapper = field.closest('.field') || field.closest('.phone-field')?.closest('.field');
    if (wrapper) wrapper.classList.remove('field-error');
  };

  const setError = (field) => {
    const wrapper = field.closest('.field') || field.closest('.phone-field')?.closest('.field');
    if (wrapper) wrapper.classList.add('field-error');
  };

  const checkFormValid = () => {
    const filled =
      fields.firstName.value.trim() &&
      fields.lastName.value.trim() &&
      fields.email.value.trim() &&
      fields.phone.value.trim() &&
      fields.message.value.trim();
    submitBtn.disabled = !filled;
  };

  Object.values(fields).forEach((field) => {
    field.addEventListener('input', () => {
      clearError(field);
      checkFormValid();
    });
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const phoneCodeBtn = form.querySelector('.phone-code-btn');
    const phoneCode = phoneCodeBtn?.dataset.phoneCode || '+91';
    let valid = true;

    if (!isValidEmail(fields.email.value.trim())) {
      setError(fields.email);
      valid = false;
    }

    if (!isValidPhone(fields.phone.value.trim(), phoneCode)) {
      setError(fields.phone);
      valid = false;
    }

    if (!valid) return;

    const data = {
      firstName: fields.firstName.value.trim(),
      lastName: fields.lastName.value.trim(),
      email: fields.email.value.trim(),
      phone: '(' + phoneCode + ') ' + fields.phone.value.trim(),
      message: fields.message.value.trim(),
    };

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Server error');
      form.reset();
      submitBtn.textContent = 'Message Sent!';
      submitBtn.disabled = true;
      setTimeout(() => {
        submitBtn.textContent = btnText;
        checkFormValid();
      }, 3000);
    } catch {
      submitBtn.textContent = btnText;
      checkFormValid();
      alert('Something went wrong. Please try again.');
    }
  });
};

const copyToClipboard = (text) => {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
  }
  return fallbackCopy(text);
};

const fallbackCopy = (text) => {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px;opacity:0';
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
  return Promise.resolve();
};

const initCopyButtons = () => {
  document.querySelectorAll('.copy-btn[data-copy]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const text = btn.getAttribute('data-copy');
      copyToClipboard(text).then(() => {
        btn.classList.add('copied');
        const original = btn.innerHTML;
        btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 8.5L6.5 12L13 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        setTimeout(() => {
          btn.classList.remove('copied');
          btn.innerHTML = original;
        }, 1500);
      });
    });
  });
};

async function fetchPageContent(path) {
  try {
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js');
    const { getDatabase, ref, get } = await import('https://www.gstatic.com/firebasejs/11.1.0/firebase-database.js');
    const app = initializeApp(firebaseConfig, 'contact-reader');
    const db = getDatabase(app);
    const snapshot = await get(ref(db, path));
    return snapshot.exists() ? snapshot.val() : null;
  } catch (e) { console.warn('Firebase fetch failed', e); return null; }
}

function stripTags(str) { if (!str || typeof str !== 'string' || !str.includes('<')) return str || ''; const d = document.createElement('div'); d.innerHTML = str; return d.textContent || ''; }
function deepStripTags(obj) { if (typeof obj === 'string') return stripTags(obj); if (Array.isArray(obj)) return obj.map(deepStripTags); if (obj && typeof obj === 'object') { const o = {}; for (const k of Object.keys(obj)) o[k] = deepStripTags(obj[k]); return o; } return obj; }

function applyContactContent(fb) {
  if (!fb) return;
  const h = fb.hero || {};
  const heroH1 = document.querySelector('.contact-hero-copy h1');
  if (heroH1 && (h.title || h.titleEmphasis)) heroH1.innerHTML = `<span>${h.title || ''}</span> <em>${h.titleEmphasis || ''}</em>`;
  const heroP = document.querySelector('.contact-hero-copy p');
  if (heroP && h.subtitle) heroP.textContent = h.subtitle;

  const ci = fb.contactInfo || {};
  const infoH2 = document.querySelector('.contact-info h2');
  if (infoH2 && ci.heading) infoH2.textContent = ci.heading;
  const emailLink = document.querySelector('.contact-info .info-link-row a[href^="mailto"]');
  if (emailLink && ci.email) { emailLink.textContent = ci.email; emailLink.href = `mailto:${ci.email}`; }

  const loc = fb.locations || {};
  const locTitle = document.querySelector('.locations-title h2');
  if (locTitle && (loc.title || loc.titleEmphasis)) locTitle.innerHTML = `<span>${loc.title || ''}</span> <em>${loc.titleEmphasis || ''}</em>`;
  const locP = document.querySelector('.locations-title + p, .locations p');
  if (locP && loc.subtitle) locP.textContent = loc.subtitle;
  const offices = Array.isArray(loc.offices) ? loc.offices : (loc.offices ? Object.values(loc.offices) : []);
  const officeCards = document.querySelectorAll('.office-card');
  offices.forEach((o, i) => { if (!officeCards[i]) return; const h3 = officeCards[i].querySelector('h3'); const p = officeCards[i].querySelector('.office-overlay p'); if (h3 && o.country) h3.textContent = o.country; if (p && o.address) p.textContent = o.address; });
}

const initContact = async () => {
  initNavToggle();
  initScrollAnimations();
  initContactForm();
  initCopyButtons();

  try {
    const content = await loadContent();
    renderNav(buildContactNav(content.nav));
    renderFooter(buildContactFooter(content.footer));
  } catch (err) {
    console.error('Failed to load shared contact content', err);
    if (window.DEFAULT_CONTENT?.nav) renderNav(buildContactNav(window.DEFAULT_CONTENT.nav));
    if (window.DEFAULT_CONTENT?.footer) renderFooter(buildContactFooter(window.DEFAULT_CONTENT.footer));
  }

  const fbRaw = await fetchPageContent('pages/contact');
  applyContactContent(fbRaw ? deepStripTags(fbRaw) : null);
};

initContact();

// Live preview hook
if (new URLSearchParams(window.location.search).get('preview') === 'true') {
  window.__livePreviewRender = (data) => {
    try { applyContactContent(data ? deepStripTags(data) : null); }
    catch (e) { console.warn('[live-preview] contact failed:', e); }
  };
}

window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    initScrollAnimations();
  }
});
