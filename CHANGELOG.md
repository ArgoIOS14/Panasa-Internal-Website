# Changelog

All notable changes to the Panasa website are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Changed
- Updated About page content and styling
- Updated AI Governance page content

## [2026-03-31]

### Added
- Email capture popup with scroll trigger and 3-day dismiss cooldown
- Standalone service pages for improved SEO
- XML sitemap and structured data (JSON-LD) for all pages
- Meta tags across all pages for search engine visibility

### Changed
- Replaced Google Sheets backend with Zoho Bigin CRM integration for contact and email forms
- Standardized API response format across both endpoints

### Fixed
- Certifications image now uses `fetchpriority="high"` for above-the-fold performance
- Governance roadmap badges scoped to top section; bottom badges use consistent sizing

### Security
- OAuth credentials moved server-side behind PHP proxies (no client-side exposure)
- CORS origin allowlist enforced on both API endpoints
