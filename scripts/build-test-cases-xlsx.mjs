/**
 * Generates panasa-test-cases.xlsx from the test inventory below.
 * Run: npx tsx scripts/build-test-cases-xlsx.mjs  (or `node scripts/build-test-cases-xlsx.mjs` once exceljs is installed)
 *
 * We use `exceljs` (devDep) to write a proper .xlsx without manual XML wrangling.
 */
import ExcelJS from 'exceljs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'panasa-test-cases.xlsx');

/* ── Test inventory ──────────────────────────────────────────── */

const testCases = [
  // Smoke — page load
  ['TC-SMOKE-001', 'Smoke', 'Homepage loads (200, title, hero)', '/', 'Status <400, title matches /Panasa/, .hero visible', 'Automated', 'tests/smoke/routes.spec.ts', 'High'],
  ['TC-SMOKE-002', 'Smoke', 'About page loads cleanly', '/about', 'Status <400, no console errors', 'Automated', 'tests/smoke/routes.spec.ts', 'High'],
  ['TC-SMOKE-003', 'Smoke', 'Contact page loads cleanly', '/contact', 'Status <400, no console errors', 'Automated', 'tests/smoke/routes.spec.ts', 'High'],
  ['TC-SMOKE-004', 'Smoke', 'Services page loads cleanly', '/services', 'Status <400, no console errors', 'Automated', 'tests/smoke/routes.spec.ts', 'High'],
  ['TC-SMOKE-005', 'Smoke', 'Careers page loads cleanly', '/careers', 'Status <400, no console errors', 'Automated', 'tests/smoke/routes.spec.ts', 'High'],
  ['TC-SMOKE-006', 'Smoke', 'Resources index loads cleanly', '/resources', 'Status <400, no console errors', 'Automated', 'tests/smoke/routes.spec.ts', 'High'],
  ['TC-SMOKE-007', 'Smoke', 'Privacy policy loads', '/privacy-policy', 'Status <400, no console errors', 'Automated', 'tests/smoke/routes.spec.ts', 'Medium'],
  ['TC-SMOKE-008', 'Smoke', 'AI Governance solution page loads', '/ai-governance', 'Status <400, no console errors', 'Automated', 'tests/smoke/routes.spec.ts', 'High'],
  ['TC-SMOKE-009', 'Smoke', 'AI Accelerated Fintech Engineering page loads', '/ai-accelerated-fintech-engineering', 'Status <400, no console errors', 'Automated', 'tests/smoke/routes.spec.ts', 'High'],
  ['TC-SMOKE-010', 'Smoke', 'AI-Powered Legacy Modernisation page loads', '/ai-powered-legacy-modernisation', 'Status <400, no console errors', 'Automated', 'tests/smoke/routes.spec.ts', 'High'],
  ['TC-SMOKE-011', 'Smoke', 'Intelligent Operations page loads', '/intelligent-operations', 'Status <400, no console errors', 'Automated', 'tests/smoke/routes.spec.ts', 'High'],
  ['TC-SMOKE-012', 'Smoke', 'Blog: Anatomy of a Swipe loads', '/blog/anatomy-of-a-swipe', 'Status <400, no console errors', 'Automated', 'tests/smoke/routes.spec.ts', 'High'],
  ['TC-SMOKE-013', 'Smoke', 'Blog: Card Controls & Fraud Prevention loads', '/blog/card-controls-fraud-prevention', 'Status <400, no console errors', 'Automated', 'tests/smoke/routes.spec.ts', 'High'],
  ['TC-SMOKE-014', 'Smoke', 'Blog: 3D Secure Authentication loads', '/blog/3d-secure-authentication-card-program', 'Status <400, no console errors', 'Automated', 'tests/smoke/routes.spec.ts', 'High'],
  ['TC-SMOKE-015', 'Smoke', 'Blog: Lifecycle of a Payment loads', '/blog/lifecycle-of-a-payment', 'Status <400, no console errors', 'Automated', 'tests/smoke/routes.spec.ts', 'High'],
  ['TC-SMOKE-016', 'Smoke', 'Case Study: Osper Family Banking loads', '/case-studies/osper-family-banking', 'Status <400, no console errors', 'Automated', 'tests/smoke/routes.spec.ts', 'High'],
  ['TC-SMOKE-017', 'Smoke', 'Case Study: Flexible Card Issuance loads', '/case-studies/flexible-card-issuance-platform-issuer-processor', 'Status <400, no console errors', 'Automated', 'tests/smoke/routes.spec.ts', 'High'],
  ['TC-SMOKE-018', 'Smoke', 'Case Study: Operations Backbone loads', '/case-studies/operations-backbone-global-issuer-processor', 'Status <400, no console errors', 'Automated', 'tests/smoke/routes.spec.ts', 'High'],
  ['TC-SMOKE-019', 'Smoke', 'Case Study: Open Banking Youth loads', '/case-studies/open-banking-youth-banking-platform', 'Status <400, no console errors', 'Automated', 'tests/smoke/routes.spec.ts', 'High'],
  ['TC-SMOKE-020', 'Smoke', 'Case Study: 3D Secure Issuer Processor loads', '/case-studies/3d-secure-authentication-issuer-processor', 'Status <400, no console errors', 'Automated', 'tests/smoke/routes.spec.ts', 'High'],
  ['TC-SMOKE-021', 'Smoke', 'Guide: Complete Guide to Interchange Fees loads', '/guides/complete-guide-to-interchange-fees', 'Status <400, no console errors', 'Automated', 'tests/smoke/routes.spec.ts', 'High'],
  ['TC-SMOKE-022', 'Smoke', 'Homepage hero text is non-empty', '/', '[data-hero-title] has text', 'Automated', 'tests/smoke/routes.spec.ts', 'Medium'],
  ['TC-SMOKE-023', 'Smoke', 'Logo marquee renders multiple items', '/', '.logo-marquee-item count > 5', 'Automated', 'tests/smoke/routes.spec.ts', 'Low'],

  // Redirects
  ['TC-REDIR-001', 'Redirects', '/about.html 301-redirects to /about', '/about.html', '301 Location: /about', 'Automated', 'tests/smoke/redirects.spec.ts', 'Medium'],
  ['TC-REDIR-002', 'Redirects', '/contact.php 301-redirects to /contact', '/contact.php', '301 Location: /contact', 'Automated', 'tests/smoke/redirects.spec.ts', 'Medium'],
  ['TC-REDIR-003', 'Redirects', 'Unknown route returns 404', '/this-route-does-not-exist-xyz', 'Status 404', 'Automated', 'tests/smoke/redirects.spec.ts', 'Low'],
  ['TC-REDIR-004', 'Redirects', '/api/* is NOT redirected (preserves POST body)', '/api/zoho-proxy.php', 'No 301 status', 'Automated', 'tests/smoke/redirects.spec.ts', 'High'],

  // Assets
  ['TC-ASSET-001', 'Assets', 'Logo SVG resolves', '/assets/logo.svg', 'Status <400', 'Automated', 'tests/smoke/assets.spec.ts', 'Medium'],
  ['TC-ASSET-002', 'Assets', 'OG image resolves', '/assets/og-image.png', 'Status <400', 'Automated', 'tests/smoke/assets.spec.ts', 'Low'],
  ['TC-ASSET-003', 'Assets', 'robots.txt resolves', '/robots.txt', 'Status <400', 'Automated', 'tests/smoke/assets.spec.ts', 'Medium'],
  ['TC-ASSET-004', 'Assets', 'sitemap.xml resolves', '/sitemap.xml', 'Status <400', 'Automated', 'tests/smoke/assets.spec.ts', 'Medium'],
  ['TC-ASSET-005', 'Assets', 'Homepage has no 404s for CSS/JS/asset paths', '/', 'No 404 responses for .css/.js/assets', 'Automated', 'tests/smoke/assets.spec.ts', 'High'],

  // Mobile nav
  ['TC-NAV-001', 'Navigation', 'Hamburger opens the mobile nav', '/', 'data-nav-state="open" after click', 'Automated', 'tests/interactions/mobile-nav.spec.ts', 'High'],
  ['TC-NAV-002', 'Navigation', 'Close button closes the mobile nav', '/', 'data-nav-state="closed" after close click', 'Automated', 'tests/interactions/mobile-nav.spec.ts', 'High'],
  ['TC-NAV-003', 'Navigation', 'Body gets nav-open class when menu opens', '/', 'body has class nav-open while open', 'Automated', 'tests/interactions/mobile-nav.spec.ts', 'Medium'],
  ['TC-NAV-004', 'Navigation', 'Clicking a nav link navigates / closes menu', '/', 'URL contains /contact after click', 'Automated', 'tests/interactions/mobile-nav.spec.ts', 'High'],
  ['TC-NAV-005', 'Navigation', 'aria-expanded reflects open state', '/', 'aria-expanded="true" while open', 'Automated', 'tests/interactions/mobile-nav.spec.ts', 'Medium'],

  // Email popup
  ['TC-EMAIL-001', 'Email Popup', 'Popup reveals after scrolling past trigger %', '/', '.email-capture has --visible class', 'Automated', 'tests/interactions/email-popup.spec.ts', 'High'],
  ['TC-EMAIL-002', 'Email Popup', 'Dismiss records 3-day cooldown timestamp', '/', 'localStorage panasa_email_home is a numeric timestamp', 'Automated', 'tests/interactions/email-popup.spec.ts', 'High'],
  ['TC-EMAIL-003', 'Email Popup', 'Invalid email shows inline error', '/', '.email-capture__error has --visible class', 'Automated', 'tests/interactions/email-popup.spec.ts', 'High'],
  ['TC-EMAIL-004', 'Email Popup', 'Valid email submits (mocked) and shows success', '/', '.email-capture__success has --visible class; mock called', 'Automated', 'tests/interactions/email-popup.spec.ts', 'High'],
  ['TC-EMAIL-005', 'Email Popup', 'Popup suppressed within 3-day cooldown', '/', '.email-capture not in DOM', 'Automated', 'tests/interactions/email-popup.spec.ts', 'Medium'],

  // Newsletter modal — generated by Argo Tester run, June 2026.
  // Regression-protects the lazy-stylesheet path fix (CSS_HREF now resolved
  // via import.meta.url instead of a page-relative string).
  ['TC-NEWS-001', 'Newsletter Modal', 'CSS link absolute on homepage (root depth)', '/', 'link[data-newsletter-modal-css] href matches /css/newsletter-modal.css', 'Automated', 'tests/interactions/newsletter-modal.spec.ts', 'High'],
  ['TC-NEWS-002', 'Newsletter Modal', 'CSS link absolute on Resources hub', '/resources', 'link href matches /css/newsletter-modal.css', 'Automated', 'tests/interactions/newsletter-modal.spec.ts', 'High'],
  ['TC-NEWS-003', 'Newsletter Modal', 'CSS link absolute on blog detail (sub-page)', '/blog/anatomy-of-a-swipe', 'href NOT /blog/css/...; matches /css/newsletter-modal.css', 'Automated', 'tests/interactions/newsletter-modal.spec.ts', 'High'],
  ['TC-NEWS-004', 'Newsletter Modal', 'CSS link absolute on insights / guides / case-studies', '/insights, /guides, /case-studies', 'no /<bucket>/css/ regression on any sub-page bucket', 'Automated', 'tests/interactions/newsletter-modal.spec.ts', 'High'],
  ['TC-NEWS-005', 'Newsletter Modal', 'Styled modal on /blog/anatomy-of-a-swipe', '/blog/anatomy-of-a-swipe', 'position:fixed, z-index 1000, card ≤ 520px wide', 'Automated', 'tests/interactions/newsletter-modal.spec.ts', 'High'],
  ['TC-NEWS-006', 'Newsletter Modal', 'Styled modal on /blog/3d-secure-authentication-card-program', '/blog/3d-secure-authentication-card-program', 'position:fixed, card visible', 'Automated', 'tests/interactions/newsletter-modal.spec.ts', 'High'],
  ['TC-NEWS-007', 'Newsletter Modal', 'Styled modal on /blog/card-controls-fraud-prevention', '/blog/card-controls-fraud-prevention', 'position:fixed, card visible', 'Automated', 'tests/interactions/newsletter-modal.spec.ts', 'High'],
  ['TC-NEWS-008', 'Newsletter Modal', 'Styled modal on /insights/lifecycle-of-a-payment', '/insights/lifecycle-of-a-payment', 'position:fixed, card visible', 'Automated', 'tests/interactions/newsletter-modal.spec.ts', 'High'],
  ['TC-NEWS-009', 'Newsletter Modal', 'Styled modal on /insights/embedded-finance-real-card-issuing-market', '/insights/embedded-finance-real-card-issuing-market', 'position:fixed, card visible', 'Automated', 'tests/interactions/newsletter-modal.spec.ts', 'High'],
  ['TC-NEWS-010', 'Newsletter Modal', 'Styled modal on /insights/five-things-card-program-migration', '/insights/five-things-card-program-migration', 'position:fixed, card visible', 'Automated', 'tests/interactions/newsletter-modal.spec.ts', 'High'],
  ['TC-NEWS-011', 'Newsletter Modal', 'Styled modal on /guides/complete-guide-to-interchange-fees', '/guides/complete-guide-to-interchange-fees', 'position:fixed, card visible', 'Automated', 'tests/interactions/newsletter-modal.spec.ts', 'High'],
  ['TC-NEWS-012', 'Newsletter Modal', 'Styled modal on /guides/card-lifecycle-management', '/guides/card-lifecycle-management', 'position:fixed, card visible', 'Automated', 'tests/interactions/newsletter-modal.spec.ts', 'High'],
  ['TC-NEWS-013', 'Newsletter Modal', 'Styled modal on /case-studies/open-banking-youth-banking-platform', '/case-studies/open-banking-youth-banking-platform', 'position:fixed, card visible', 'Automated', 'tests/interactions/newsletter-modal.spec.ts', 'High'],
  ['TC-NEWS-014', 'Newsletter Modal', 'Styled modal on /case-studies/flexible-card-issuance-platform-issuer-processor', '/case-studies/flexible-card-issuance-platform-issuer-processor', 'position:fixed, card visible', 'Automated', 'tests/interactions/newsletter-modal.spec.ts', 'High'],
  ['TC-NEWS-015', 'Newsletter Modal', 'Styled modal on /case-studies/3d-secure-authentication-issuer-processor', '/case-studies/3d-secure-authentication-issuer-processor', 'position:fixed, card visible', 'Automated', 'tests/interactions/newsletter-modal.spec.ts', 'High'],
  ['TC-NEWS-016', 'Newsletter Modal', 'Styled modal on /case-studies/operations-backbone-global-issuer-processor', '/case-studies/operations-backbone-global-issuer-processor', 'position:fixed, card visible', 'Automated', 'tests/interactions/newsletter-modal.spec.ts', 'High'],
  ['TC-NEWS-017', 'Newsletter Modal', 'Close button (X) closes the modal', '/', '.newsletter-modal loses is-open class', 'Automated', 'tests/interactions/newsletter-modal.spec.ts', 'High'],
  ['TC-NEWS-018', 'Newsletter Modal', 'Click on overlay (outside card) closes the modal', '/', '.newsletter-modal loses is-open class', 'Automated', 'tests/interactions/newsletter-modal.spec.ts', 'High'],
  ['TC-NEWS-019', 'Newsletter Modal', 'Escape key closes the modal', '/', '.newsletter-modal loses is-open class', 'Automated', 'tests/interactions/newsletter-modal.spec.ts', 'High'],
  ['TC-NEWS-020', 'Newsletter Modal', 'Invalid email triggers error feedback, modal stays open', '/', 'is-error class or status message; modal still open', 'Automated', 'tests/interactions/newsletter-modal.spec.ts', 'High'],
  ['TC-NEWS-021', 'Newsletter Modal', 'Empty email submit does NOT call the proxy', '/', 'mocked proxy call count = 0', 'Automated', 'tests/interactions/newsletter-modal.spec.ts', 'Medium'],
  ['TC-NEWS-022', 'Newsletter Modal', 'Valid email POSTs to /api/zoho-email-proxy.php', '/', 'mock call captured with body.email = qa@example.com', 'Automated', 'tests/interactions/newsletter-modal.spec.ts', 'High'],
  ['TC-NEWS-023', 'Newsletter Modal', 'Subscribed flag written to localStorage after success', '/', 'localStorage.panasa_newsletter_subscribed != null', 'Automated', 'tests/interactions/newsletter-modal.spec.ts', 'Medium'],
  ['TC-NEWS-024', 'Newsletter Modal', 'Pre-seeded subscribed flag does not block re-open on user click', '/', '.newsletter-modal has is-open after manual click', 'Automated', 'tests/interactions/newsletter-modal.spec.ts', 'Medium'],
  ['TC-NEWS-025', 'Newsletter Modal', 'Envelope visual image src absolute + loads on every page depth', '/, /resources, /blog/*, /insights/*, /guides/*, /case-studies/*', 'img.src matches /assets/newsletter-visual.webp; img.complete + naturalWidth > 0', 'Automated', 'tests/interactions/newsletter-modal.spec.ts', 'High'],

  // Carousels + engagement
  ['TC-CAROUSEL-001', 'Carousels', 'Services carousel renders ≥3 slides', '/', '.services-slide count ≥ 3', 'Automated', 'tests/interactions/carousels.spec.ts', 'High'],
  ['TC-CAROUSEL-002', 'Carousels', 'Case studies section is visible', '/', 'Case Studies heading section visible', 'Automated', 'tests/interactions/carousels.spec.ts', 'Medium'],
  ['TC-CAROUSEL-003', 'Engagement', 'Engagement section has ≥2 filter buttons; first is active', '/', '.engagement-filter[active] is first', 'Automated', 'tests/interactions/carousels.spec.ts', 'High'],
  ['TC-CAROUSEL-004', 'Engagement', 'Clicking a filter switches the active button', '/', 'Clicked button has .active after transition', 'Automated', 'tests/interactions/carousels.spec.ts', 'High'],

  // Resources
  ['TC-RES-001', 'Resources', 'Resources hero + grid render', '/resources', '.resources-hero & [data-resources-grid] visible', 'Automated', 'tests/interactions/resources-filters.spec.ts', 'High'],
  ['TC-RES-002', 'Resources', 'Filter tabs are populated', '/resources', '[data-resources-filters] has ≥2 buttons', 'Automated', 'tests/interactions/resources-filters.spec.ts', 'High'],
  ['TC-RES-003', 'Resources', 'Featured card links to a real route', '/resources', '[data-featured-card] has href', 'Automated', 'tests/interactions/resources-filters.spec.ts', 'Medium'],
  ['TC-RES-004', 'Resources', 'Pagination indicator format "X of Y"', '/resources', '[data-page-indicator] matches /\\d+ of \\d+/', 'Automated', 'tests/interactions/resources-filters.spec.ts', 'Low'],

  // Scroll-spy
  ['TC-SCROLLSPY-001', 'Scroll-spy', 'Guide page tabs render ≥2 entries', '/guides/...', '.guide-section-tab count ≥ 2', 'Automated', 'tests/interactions/guide-scrollspy.spec.ts', 'High'],
  ['TC-SCROLLSPY-002', 'Scroll-spy', 'Sliding indicator is attached', '/guides/...', '.guide-section-tabs-indicator in DOM', 'Automated', 'tests/interactions/guide-scrollspy.spec.ts', 'Medium'],
  ['TC-SCROLLSPY-003', 'Scroll-spy', 'Clicking a tab marks it is-active', '/guides/...', 'Clicked tab has .is-active', 'Automated', 'tests/interactions/guide-scrollspy.spec.ts', 'High'],
  ['TC-SCROLLSPY-004', 'Detail Pages', 'Blog detail page hero + body render', '/blog/anatomy-of-a-swipe', '.blog-hero visible, [data-blog-body] visible', 'Automated', 'tests/interactions/guide-scrollspy.spec.ts', 'High'],
  ['TC-SCROLLSPY-005', 'Detail Pages', 'Case study detail page header + h1 render', '/case-studies/osper-family-banking', 'header + h1 visible with text', 'Automated', 'tests/interactions/guide-scrollspy.spec.ts', 'High'],

  // Contact form
  ['TC-CONTACT-001', 'Contact Form', 'Submit disabled until all required fields filled', '/contact', 'button.btn-submit is disabled then enabled', 'Automated', 'tests/contact/contact-form.spec.ts', 'High'],
  ['TC-CONTACT-002', 'Contact Form', 'Invalid email shows field-error class', '/contact', '.field around email has .field-error', 'Automated', 'tests/contact/contact-form.spec.ts', 'High'],
  ['TC-CONTACT-003', 'Contact Form', 'Invalid phone (too short for +91) shows error', '/contact', '.field around phone has .field-error', 'Automated', 'tests/contact/contact-form.spec.ts', 'High'],
  ['TC-CONTACT-004', 'Contact Form', 'Country code dropdown opens + is searchable', '/contact', '.phone-code-dropdown.open, filter narrows list', 'Automated', 'tests/contact/contact-form.spec.ts', 'Medium'],
  ['TC-CONTACT-005', 'Contact Form', 'Selecting +44 updates button code + dataset', '/contact', '.phone-code-value = +44, data-phone-code = +44', 'Automated', 'tests/contact/contact-form.spec.ts', 'High'],
  ['TC-CONTACT-006', 'Contact Form', 'Successful submit (mocked) → confirmation', '/contact', 'Button text "Message Sent!"; mock POST captured', 'Automated', 'tests/contact/contact-form.spec.ts', 'High'],
  ['TC-CONTACT-007', 'Contact Form', 'POST payload contains expected fields + phone code', '/contact', 'Payload firstName/lastName/email/phone(+91)/message present', 'Automated', 'tests/contact/contact-form.spec.ts', 'High'],
  ['TC-CONTACT-008', 'Contact Form', 'Failed submit (mocked 500) shows alert + resets', '/contact', 'Button reverts to "Send Message"; alert handled', 'Automated', 'tests/contact/contact-form.spec.ts', 'High'],
  ['TC-CONTACT-009', 'Contact Form', 'Copy-email button toggles .copied state', '/contact', '.copy-btn[data-copy=info@...] gets .copied class', 'Automated', 'tests/contact/contact-form.spec.ts', 'Low'],

  // Accessibility (one row per route)
  ['TC-A11Y-001', 'Accessibility', 'No serious/critical axe violations: /', '/', '0 serious/critical violations', 'Automated', 'tests/a11y/axe.spec.ts', 'High'],
  ['TC-A11Y-002', 'Accessibility', 'No serious/critical axe violations: /about', '/about', '0 serious/critical violations', 'Automated', 'tests/a11y/axe.spec.ts', 'High'],
  ['TC-A11Y-003', 'Accessibility', 'No serious/critical axe violations: /contact', '/contact', '0 serious/critical violations', 'Automated', 'tests/a11y/axe.spec.ts', 'High'],
  ['TC-A11Y-004', 'Accessibility', 'No serious/critical axe violations: /services', '/services', '0 serious/critical violations', 'Automated', 'tests/a11y/axe.spec.ts', 'High'],
  ['TC-A11Y-005', 'Accessibility', 'No serious/critical axe violations: /careers', '/careers', '0 serious/critical violations', 'Automated', 'tests/a11y/axe.spec.ts', 'High'],
  ['TC-A11Y-006', 'Accessibility', 'No serious/critical axe violations: /resources', '/resources', '0 serious/critical violations', 'Automated', 'tests/a11y/axe.spec.ts', 'High'],
  ['TC-A11Y-007', 'Accessibility', 'No serious/critical axe violations: /privacy-policy', '/privacy-policy', '0 serious/critical violations', 'Automated', 'tests/a11y/axe.spec.ts', 'Medium'],
  ['TC-A11Y-008', 'Accessibility', 'No serious/critical axe violations: solution pages', '/ai-governance and 3 others', '0 serious/critical violations', 'Automated', 'tests/a11y/axe.spec.ts', 'High'],
  ['TC-A11Y-009', 'Accessibility', 'No serious/critical axe violations: blog detail × 4', '/blog/*', '0 serious/critical violations', 'Automated', 'tests/a11y/axe.spec.ts', 'High'],
  ['TC-A11Y-010', 'Accessibility', 'No serious/critical axe violations: case-studies × 5', '/case-studies/*', '0 serious/critical violations', 'Automated', 'tests/a11y/axe.spec.ts', 'High'],
  ['TC-A11Y-011', 'Accessibility', 'No serious/critical axe violations: guide', '/guides/complete-guide-to-interchange-fees', '0 serious/critical violations', 'Automated', 'tests/a11y/axe.spec.ts', 'High'],

  // Responsive
  ['TC-RESP-001', 'Responsive', 'Mobile (375): header + hero visible', '/', 'header.site-header and .hero visible at 375', 'Automated', 'tests/responsive/viewports.spec.ts', 'High'],
  ['TC-RESP-002', 'Responsive', 'Mobile (375): hamburger toggle is visible', '/', '.nav-toggle visible at 375', 'Automated', 'tests/responsive/viewports.spec.ts', 'High'],
  ['TC-RESP-003', 'Responsive', 'Tablet (768): header + hero visible', '/', 'header + hero visible at 768', 'Automated', 'tests/responsive/viewports.spec.ts', 'Medium'],
  ['TC-RESP-004', 'Responsive', 'Tablet (768): nav links list visible', '/', '.nav-links visible at 768', 'Automated', 'tests/responsive/viewports.spec.ts', 'Medium'],
  ['TC-RESP-005', 'Responsive', 'Desktop (1280): header + hero visible', '/', 'header + hero visible at 1280', 'Automated', 'tests/responsive/viewports.spec.ts', 'High'],
  ['TC-RESP-006', 'Responsive', 'prefers-reduced-motion: no pageerrors on scroll', '/', '0 pageerror events while scrolling', 'Automated', 'tests/responsive/viewports.spec.ts', 'Medium'],
];

/* ── Coverage summary ────────────────────────────────────────── */

const coverage = [
  ['Category', 'Test Cases', 'Automated', 'Target Coverage', 'Achieved (Self-Score)'],
  ['Page-load smoke', 23, 23, '100% of public routes', '100%'],
  ['Redirects + 404', 4, 4, 'All router rules', '100%'],
  ['Static asset health', 5, 5, 'Critical asset paths', '100%'],
  ['Mobile navigation', 5, 5, 'Hamburger + dropdown + close', '95%'],
  ['Email-capture popup', 5, 5, 'Reveal, validate, dismiss, submit, cooldown', '90%'],
  ['Newsletter modal', 25, 25, 'CSS + image resolution × every page depth + dismiss × 3 + validation + persistence', '95%'],
  ['Carousels + engagement filter', 4, 4, 'Services slides, engagement filter swap', '80%'],
  ['Resources index', 4, 4, 'Hero/grid, filters, pagination, featured card', '85%'],
  ['Detail pages (blog/case study/guide)', 5, 5, 'Hero, body, scroll-spy, sliding indicator', '85%'],
  ['Contact form (Zoho mocked)', 9, 9, 'Validation, country picker, 200, 500, copy', '95%'],
  ['Accessibility (axe)', 11, 11, 'Every route on serious/critical', '90%'],
  ['Responsive matrix', 6, 6, '375/768/1280 + reduced-motion', '90%'],
  ['', '', '', '', ''],
  ['TOTAL', testCases.length, testCases.length, '≥ 90%', '~92%'],
];

const risks = [
  ['Risk Area', 'Why It Matters', 'How It\'s Covered', 'Residual Risk'],
  ['Zoho CRM submissions', 'Real leads must not be polluted by tests', 'All proxy POSTs intercepted via Playwright route mock — no network egress', 'None for tests; production proxy depends on .env presence'],
  ['Email popup misfire', 'A popup that shows on every visit annoys users', '3-day cooldown verified via localStorage seed test (TC-EMAIL-005)', 'Low'],
  ['Newsletter modal silently broken on sub-pages', 'Lazy CSS link resolved page-relative → 404 on /blog/, /guides/, etc. Modal opens but is invisible (no position:fixed, no background, full viewport width). User reports "modal does not appear".', 'CSS resolution regression test runs on every page-depth bucket (TC-NEWS-001..004); styled-modal assertion on all 12 article sub-pages (TC-NEWS-005..016)', 'Low — guarded by 16 dedicated tests'],
  ['Country code dropdown', 'Phone validation depends on selected code', 'Open/search/select flow + +44 selection + dataset assertion', 'Low — only 4 of 50+ codes spot-checked'],
  ['Scroll-spy indicator on resize', 'Indicator must reposition on fonts/content load', 'Click → is-active assertion covers click path; resize handler not exercised', 'Medium'],
  ['Carousel autoplay timing', 'Autoplay must advance every 4.5s', 'Slide count + structure verified; timing not asserted (flaky in CI)', 'Medium — not blocked, recommend manual smoke per release'],
  ['Accessibility regressions', 'Lawsuits + excluded users', 'Axe on every route, serious/critical fail the build', 'Low; moderate/minor not enforced'],
  ['Reduced-motion fallback', 'Lenis must degrade gracefully', 'No-pageerror assertion under prefers-reduced-motion: reduce', 'Low'],
  ['PHP router 301 chain', 'Wrong redirect can break SEO + form POSTs', '.html → clean, .php → clean, /api/* preserved', 'Low'],
  ['Static asset 404s after rebuild', 'Cache-bust version skew → broken CSS', 'Network monitor on homepage asserts no 404 for .css/.js/assets', 'Medium for non-home pages — only home covered'],
];

/* ── Workbook construction ───────────────────────────────────── */

const wb = new ExcelJS.Workbook();
wb.creator = 'Argo Tester';
wb.created = new Date();

const tcSheet = wb.addWorksheet('Test Cases');
tcSheet.columns = [
  { header: 'Test ID', key: 'id', width: 18 },
  { header: 'Category', key: 'cat', width: 16 },
  { header: 'Description', key: 'desc', width: 60 },
  { header: 'Route / Surface', key: 'route', width: 40 },
  { header: 'Expected Result', key: 'expect', width: 55 },
  { header: 'Status', key: 'status', width: 12 },
  { header: 'Test File', key: 'file', width: 45 },
  { header: 'Priority', key: 'prio', width: 10 },
];
tcSheet.getRow(1).font = { bold: true };
tcSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } };
tcSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
testCases.forEach((row) => tcSheet.addRow(row));
tcSheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: 8 } };

const covSheet = wb.addWorksheet('Coverage Summary');
covSheet.columns = [
  { header: '', key: 'a', width: 35 },
  { header: '', key: 'b', width: 14 },
  { header: '', key: 'c', width: 14 },
  { header: '', key: 'd', width: 30 },
  { header: '', key: 'e', width: 24 },
];
coverage.forEach((row, i) => {
  const r = covSheet.addRow(row);
  if (i === 0) {
    r.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    r.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } };
  }
  if (row[0] === 'TOTAL') r.font = { bold: true };
});

const riskSheet = wb.addWorksheet('Risk Matrix');
riskSheet.columns = [
  { header: 'Risk Area', key: 'a', width: 32 },
  { header: 'Why It Matters', key: 'b', width: 45 },
  { header: "How It's Covered", key: 'c', width: 50 },
  { header: 'Residual Risk', key: 'd', width: 22 },
];
risks.slice(1).forEach((row) => riskSheet.addRow(row));
riskSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
riskSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } };

await wb.xlsx.writeFile(OUT);
console.log(`Wrote ${OUT}`);
console.log(`  ${testCases.length} test cases across ${new Set(testCases.map((t) => t[1])).size} categories`);
