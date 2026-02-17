# AGENTS.md

## Project Overview
- Project name: `Panasa Internal Website`
- Type: static marketing website (HTML/CSS/JS)
- Primary editable source: `src/`
- Deployable/static mirror: `docs/` (used for sharing/GitHub Pages)
- Brand spelling: `Panasa` (not `panosa`)

## Current Architecture
- `src/index.html`: section structure and semantic layout
- `src/css/style.css`: all section styling, responsiveness, animations
- `src/js/main.js`: lightweight bootstrap/orchestrator
- `src/js/Home scenes/`: all split JS modules (sections/components/utils/data)
- `src/content/Home page/content.json`: primary content source
- `src/content/Home page/default.js`: fallback content if JSON fetch fails
- `src/assets/`: all icons, logos, placeholders, SVG design assets
- `AGENTS.md`: handoff and project operating context for new chats/accounts

## Data Flow
1. App tries to load `content/Home page/content.json`
2. If loading fails, app falls back to `window.DEFAULT_CONTENT` from `content/Home page/default.js`
3. For design/content consistency, update both `content.json` and `default.js` when content-sensitive changes are made

## Build/Sync Rule
- Any change in `src/` that must be reflected in production/shareable output should be synced to `docs/`:
```bash
rm -rf docs && mkdir -p docs && cp -R src/* docs/
```
- `docs/` should mirror `src/` folder structure (including `content/Home page/` and `js/Home scenes/`)

## Known Design Decisions
- Hero gradient transitions to white before certifications area
- Certifications row is centered with a full-width light separator (`#D4D4D4`)
- Home certifications strip must visually match the design width/scale, with oversized SVG whitespace cropped via CSS rendering (`object-fit: cover`, centered) so badge logos appear at the intended size.
- Work With Us section uses asymmetric cards on desktop, single-column on tablet/mobile
- Case Studies is implemented as a functional carousel with autoplay and smooth swipe/drag behavior
- Testimonials section uses dark theme (`#101010`) and custom author logos from provided SVGs
- Services section icons use custom `Frame*.svg` assets mapped into service cards

## Responsive Rules
- Desktop: section-specific asymmetric layouts where requested
- Tablet/Mobile: simplified single-column stack for complex card sections
- Avoid fixed widths that break on narrower viewports; prefer proportional sizing and aspect-ratio controls
- All pages (existing and future) must be responsive across desktop, tablet, and mobile breakpoints.

## Global UI/UX Rules (All Pages)
- Apply smooth scrolling and fade in/out section animations on every page, consistent with Home page behavior.
- Use `Lufga` for all header/title text across all pages.
- Use `DM Sans` for all body/description text across all pages.
- Use a common pill-shaped navigation bar component on all pages that require navigation.
- The common navigation bar must retain the same brand image assets and visual treatment already established in the project.

## Asset Mapping Notes
- Service card custom icons: `src/assets/service-frame-1.svg` ... `service-frame-6.svg`
- Testimonial author logos:
  - `src/assets/testimonial-logo-1.svg`
  - `src/assets/testimonial-logo-2.svg`

## Module Layout
- Scenes/components/utils/data modules are grouped under:
  - `src/js/Home scenes/components/`
  - `src/js/Home scenes/sections/`
  - `src/js/Home scenes/utils/`
  - `src/js/Home scenes/data/`
- Bootstrap imports are centralized in `src/js/main.js`

## Collaboration Notes
- User expects close visual parity with provided Figma/PDF/screenshots
- Prefer exact spacing, color, and card geometry replication over generic approximations
- User requested commit + push after updates unless explicitly told not to
- If a change affects runtime content, update both:
  - `src/content/Home page/content.json`
  - `src/content/Home page/default.js`
- Keep the static share zip out of git:
  - `panasa-static-site.zip` is gitignored

## Git/Delivery Workflow
1. Edit in `src/`
2. Sync `docs/` from `src/`
3. Run:
```bash
git add -A
git commit -m "<clear message>"
git push
```

## Runtime Script Paths
- In `src/index.html`:
  - Fallback content script: `content/Home page/default.js`
  - App script: `js/main.js` loaded with `type="module"`

## Local Preview
- Recommended:
```bash
cd docs
python3 -m http.server 8080
```
- Open: `http://localhost:8080`

## Shareable Static Package
- To generate a distributable zip (without GitHub dependency):
```bash
cd /Users/arjun.g/Documents/New\ project
zip -r panasa-static-site.zip docs
```
- For local handoff only; do not commit this zip to repository.
