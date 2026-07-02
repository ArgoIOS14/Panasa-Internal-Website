/**
 * All public routes for the Panasa site. Enumerated from dev/router.php
 * (clean URLs, no .html suffix) and dev/content/ JSON for detail pages.
 */

export const TOP_LEVEL_ROUTES = [
  { path: '/', title: /Panasa/i },
  { path: '/about', title: /About|Panasa/i },
  { path: '/contact', title: /Contact|Panasa/i },
  { path: '/services', title: /Services|Panasa/i },
  { path: '/careers', title: /Careers|Panasa/i },
  { path: '/resources', title: /Resources|Panasa/i },
  { path: '/privacy-policy', title: /Privacy|Panasa/i },
  { path: '/ai-governance', title: /AI Governance|Panasa/i },
  { path: '/ai-accelerated-fintech-engineering', title: /Engineering|Panasa/i },
  { path: '/ai-powered-legacy-modernisation', title: /Modernisation|Modernization|Panasa/i },
  { path: '/intelligent-operations', title: /Intelligent Operations|Panasa/i },
];

export const BLOG_ROUTES = [
  '/blog/anatomy-of-a-swipe',
  '/blog/card-controls-fraud-prevention',
  '/blog/3d-secure-authentication-card-program',
  '/blog/lifecycle-of-a-payment',
].map((path) => ({ path, title: /Panasa/i }));

export const CASE_STUDY_ROUTES = [
  '/case-studies/osper-family-banking',
  '/case-studies/flexible-card-issuance-platform-issuer-processor',
  '/case-studies/operations-backbone-global-issuer-processor',
  '/case-studies/open-banking-youth-banking-platform',
  '/case-studies/3d-secure-authentication-issuer-processor',
].map((path) => ({ path, title: /Panasa/i }));

export const GUIDE_ROUTES = [
  '/guides/complete-guide-to-interchange-fees',
].map((path) => ({ path, title: /Interchange|Panasa/i }));

export const ALL_ROUTES = [
  ...TOP_LEVEL_ROUTES,
  ...BLOG_ROUTES,
  ...CASE_STUDY_ROUTES,
  ...GUIDE_ROUTES,
];

export const VIEWPORTS = {
  mobile: { width: 375, height: 812 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 800 },
} as const;
