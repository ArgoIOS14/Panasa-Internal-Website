import { firebaseConfig } from '../../firebase-config.js';
import { setNewsletterModalContent } from '../components/newsletter-modal.js';

let _cachedContent = null;

async function fetchFromFirebase() {
  try {
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js');
    const { getDatabase, ref, get } = await import('https://www.gstatic.com/firebasejs/11.1.0/firebase-database.js');
    const app = initializeApp(firebaseConfig, 'home-reader');
    const db = getDatabase(app);
    const snapshot = await get(ref(db, 'pages/home'));
    if (snapshot.exists()) {
      return snapshot.val();
    }
  } catch (e) {
    console.warn('Firebase fetch failed for home page, falling back to content.json', e);
  }
  return null;
}

export const loadContent = async () => {
  if (_cachedContent) return _cachedContent;

  // Try Firebase first
  const fbContent = await fetchFromFirebase();
  if (fbContent) {
    _cachedContent = fbContent;
  } else {
    // Fall back to content.json
    const dataUrl = window.STRAPI_URL || 'content/Home page/content.json';
    const response = await fetch(dataUrl);
    if (!response.ok) throw new Error(`Failed to load content: ${response.status}`);
    _cachedContent = await response.json();
  }

  // The newsletter modal is shared site-wide (wired via the footer import),
  // so apply its CMS copy here — the one choke point every page already
  // hits when loading nav/footer content.
  if (_cachedContent.newsletter) setNewsletterModalContent(_cachedContent.newsletter);

  return _cachedContent;
};
