# Changelog

All notable changes to the Panasa website are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- Pre-rendered homepage with static HTML for SEO (crawlers now see full content without JS)
- Conditional JS re-rendering: only updates sections when fetched content differs from defaults
- Email capture popup with scroll trigger, 3-day dismiss cooldown, and Zoho Bigin integration
- Organization JSON-LD schema on all 9 pages
- BreadcrumbList JSON-LD schema on all interior pages
- FAQPage JSON-LD schema on about page (5 Q&A entries)
- Open Graph and Twitter Card meta tags on all pages
- Canonical tags on all pages (clean URLs without .html)
- Hreflang tags (en-GB + x-default) on all pages
- XML sitemap with clean URLs for all 9 pages
- robots.txt with AI crawler directives (blocks GPTBot, CCBot, Google-Extended, etc.)
- llms.txt file for AI crawler guidance
- Clean URL rewriting via .htaccess (strips .html extensions)
- www vs non-www 301 redirect (enforces www.panasatech.com)
- 301 redirects for old WordPress URLs (/contact/, /careers/, /about/, /privacy-policy/)
- Local dev router (router.php) for testing clean URLs with PHP built-in server
- Standalone service pages: AI Governance, AI Accelerated Fintech Engineering, AI Powered Legacy Modernisation, Intelligent Operations

### Changed
- Replaced Google Sheets backend with Zoho Bigin CRM for contact form and email capture
- Contact form message field mapped to `Form_Submission_Data` (was `Description`)
- Added `Lead_Source1` = "Website" on all CRM submissions
- Service page hero CTAs: "Explore Services" changed to "Talk to our team", "View Open Roles" changed to "View Case Studies"
- Service hero button sizes increased to match design reference
- Leadership grid changed from 4 columns to 3 columns with taller cards and teal border accent
- FAQ accordion icons replaced with custom SVG expand/collapse icons
- Sitemap URLs updated to clean format (no .html extensions)
- Canonical and OG URLs updated to clean format
- Renamed project directories: src/ to dev/, docs/ to prod/
- Updated API.md, HOSTING.md documentation to reflect new directory names

### Fixed
- CSRF origin check now allows localhost with any port for local development
- Certifications image uses fetchpriority=high for above-the-fold performance
- Governance roadmap badges scoped correctly

### Security
- OAuth credentials stored server-side in PHP proxies (no client-side exposure)
- CORS origin allowlist enforced on both API endpoints
- .htaccess blocks direct access to .env files
- AI training crawlers blocked via robots.txt

## [2026-03-31]

### Added
- Initial static website with homepage, about, contact, careers pages
- Contact form with Google Sheets integration and searchable country code picker
- Phone number validation with country-specific digit lengths
- Engagement models with tab filtering and animated transitions

### Changed
- Optimized images to WebP format with lazy loading and deferred CSS/JS
