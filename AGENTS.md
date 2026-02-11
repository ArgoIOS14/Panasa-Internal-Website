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
- `src/js/main.js`: rendering logic, carousel behavior, interactions
- `src/data/content.json`: primary content source
- `src/data/default.js`: fallback content if JSON fetch fails
- `src/assets/`: all icons, logos, placeholders, SVG design assets

## Data Flow
1. App tries to load `data/content.json`
2. If loading fails, app falls back to `window.DEFAULT_CONTENT` from `data/default.js`
3. For design/content consistency, update both `content.json` and `default.js` when content-sensitive changes are made

## Build/Sync Rule
- Any change in `src/` that must be reflected in production/shareable output should be synced to `docs/`:
```bash
rm -rf docs && mkdir -p docs && cp -R src/* docs/
```

## Known Design Decisions
- Hero gradient transitions to white before certifications area
- Certifications row is centered with a full-width light separator (`#D4D4D4`)
- Work With Us section uses asymmetric cards on desktop, single-column on tablet/mobile
- Case Studies is implemented as a functional carousel with autoplay and smooth swipe/drag behavior
- Testimonials section uses dark theme (`#101010`) and custom author logos from provided SVGs
- Services section icons use custom `Frame*.svg` assets mapped into service cards

## Responsive Rules
- Desktop: section-specific asymmetric layouts where requested
- Tablet/Mobile: simplified single-column stack for complex card sections
- Avoid fixed widths that break on narrower viewports; prefer proportional sizing and aspect-ratio controls

## Asset Mapping Notes
- Service card custom icons: `src/assets/service-frame-1.svg` ... `service-frame-6.svg`
- Testimonial author logos:
  - `src/assets/testimonial-logo-1.svg`
  - `src/assets/testimonial-logo-2.svg`

## Collaboration Notes
- User expects close visual parity with provided Figma/PDF/screenshots
- Prefer exact spacing, color, and card geometry replication over generic approximations
- User requested commit + push after updates unless explicitly told not to

## Git/Delivery Workflow
1. Edit in `src/`
2. Sync `docs/` from `src/`
3. Run:
```bash
git add -A
git commit -m "<clear message>"
git push
```

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
