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
- `src/js/Home scenes/sections/hero.js`: hero section renderer, including trusted fintech marquee
- `src/js/Home scenes/sections/services.js`: featured services carousel renderer
- `src/js/Home scenes/components/carousel.js`: shared carousel logic for Services and Case Studies
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
- Hero CTA styling is being tuned toward the screenshot-driven reference:
  - primary CTA uses a small rounded-rectangle treatment
  - secondary CTA is lighter and less button-like
  - headline/subtitle/action spacing should stay compact and centered
- Hero trusted-fintech logo strip is a horizontally looping marquee with soft fade masks on both edges
- Trusted-fintech marquee is intentionally larger than before and horizontally constrained so its left/right padding visually aligns with the certifications row below
- Certifications row is centered with a full-width light separator (`#D4D4D4`)
- Home certifications strip must visually match the design width/scale, with oversized SVG whitespace cropped via CSS rendering (`object-fit: cover`, centered) so badge logos appear at the intended size.
- Work With Us section uses asymmetric cards on desktop, single-column on tablet/mobile
- Why Panasa / Work With Us current desktop direction:
  - compact split heading with short right-side summary copy
  - tighter 2x2 asymmetric card grid with small gaps
  - heading currently renders as `Why Fintech’s` with `Choose Panasa` highlighted
  - top pill is intentionally removed in the latest design direction
- Case Studies is implemented as a functional carousel with autoplay and smooth swipe/drag behavior
- Case Studies current visual direction:
  - split desktop heading with left title and right summary
  - centered soft card shell with stronger metrics column
  - dot navigation centered below the card
  - desktop styling is being tuned toward the latest screenshot-driven design
  - top pill is intentionally removed in the latest design direction
  - latest screenshot-matching pass uses:
    - smaller compact heading scale
    - green uppercase eyebrow
    - compact black CTA
    - tighter rounded metric cards
  - latest precision pass further compacts the header, card shell, metric stack, CTA, and dots toward the smaller screenshot reference
- Services section has been redesigned from a simple grid into a featured two-column carousel layout:
  - section heading/copy row at top
  - left side: active service eyebrow, title, bullet list, CTA
  - right side: large visual panel
  - centered dot navigation below the visual area
- Current Services screenshot-matching notes:
  - top section pill/header is intentionally hidden if empty
  - heading remains `AI-Driven Fintech Services Stack`
  - right summary copy currently uses the end-to-end AI-powered engineering wording from the latest screenshot
  - first slide eyebrow is `Core Build`
  - latest precision pass reduces heading/summary scale, bullet density, visual panel size, and dot sizing to better match the compact reference
- Services carousel behavior should match Case Studies as closely as possible
- Shared autoplay timing for Services and Case Studies is currently `4500ms` per slide
- Why Panasa, Case Studies, Testimonials, and Engagement sections now use a split heading layout on desktop:
  - left side: pill + title
  - right side: supporting summary copy
  - collapses back to centered single-column on tablet/mobile
- Testimonials section uses dark theme (`#101010`) and custom author logos from provided SVGs
- Testimonials screenshot-matching notes:
  - top pill is hidden when empty
  - heading renders as `Trusted by` with `Fintech Leaders` highlighted on the next line
  - right-side summary copy uses the shorter partner feedback wording from the latest screenshot
  - body copy is compact and unquoted
- Services section icons use custom `Frame*.svg` assets mapped into service cards
- Engagement section now includes top filter pills for visual parity with the current design direction
- Engagement screenshot-matching notes:
  - top pill is hidden when empty
  - title is `Engagement Models` with `Built for Your Growth` highlighted on the next line
  - tabs are interactive: `Engagement Models` and `Growth Packages`
  - `Growth Packages` currently shows dummy cards in the same visual style until final content is provided
  - desktop engagement cards have been reduced in size and density to better match the screenshot reference
  - latest desktop pass restores taller card proportions and a framed outer card container based on the PNG reference
  - latest precision pass adjusts heading scale, tab size, icon size, frame padding, and card proportions toward the 320x487-style reference
  - CTA button should sit visually near the bottom edge of each engagement card with minimal space below it

## Responsive Rules
- Desktop: section-specific asymmetric layouts where requested
- Tablet/Mobile: simplified single-column stack for complex card sections
- Avoid fixed widths that break on narrower viewports; prefer proportional sizing and aspect-ratio controls
- All pages (existing and future) must be responsive across desktop, tablet, and mobile breakpoints.
- Responsive tightening pass has been applied to Home:
  - denser section spacing on tablet/mobile
  - tighter hero/nav/certifications proportions
  - Services, Why Panasa, Case Studies, Testimonials, and Engagement all have smaller-screen-specific spacing and sizing adjustments
  - Engagement cards move to 2-column on tablet and 1-column on mobile
- Final whole-page polish pass has also tightened:
  - shared desktop section widths
  - hero/trusted spacing
  - split heading rhythm
  - testimonials/footer vertical density

## Global UI/UX Rules (All Pages)
- Apply smooth scrolling and fade in/out section animations on every page, consistent with Home page behavior.
- Use `Lufga` for all header/title text across all pages.
- Use `Inter Variable` for all body/description/supporting text across all pages.
- Treat this typography mapping as a standing rule for all future pages and sections unless the user explicitly requests an exception:
  - titles/headings/navigation labels/buttons: `Lufga`
  - descriptions/body copy/supporting text/list text/legal/footer text: `Inter Variable`
- Use a common pill-shaped navigation bar component on all pages that require navigation.
- The common navigation bar must retain the same brand image assets and visual treatment already established in the project.
- Navigation is now a strict shared-component rule for all future pages:
  - every new page must reuse the same shared navigation pill used on Home
  - do not restyle, override, resize, recolor, or locally redefine `.site-header`, `.nav`, `.nav-links`, `.brand`, or the nav CTA on page-specific stylesheets
  - if navigation spacing or styling ever needs to change, make that change in the shared navigation source so all pages stay identical
  - page-specific CSS may position content below the nav, but must not change the nav's color, button layout, border radius, sizing, spacing, or visual treatment

## Asset Mapping Notes
- Service card custom icons: `src/assets/service-frame-1.svg` ... `service-frame-6.svg`
- Testimonial author logos:
  - `src/assets/testimonial-logo-1.svg`
  - `src/assets/testimonial-logo-2.svg`

## Home Page Content Notes
- Current hero copy has been updated to:
  - title: `Ship & modernise your fintech in weeks`
  - emphasis: `Scale Without Surprises`
  - subtitle: `Your AI-native partner for Dev, Ops & Scale. No handoffs.`
- Current Services section title is:
  - `AI-Driven Fintech Services Stack`
- Current Services subtitle is:
  - `End-to-end AI-powered engineering, governance, and operational services for secure, scalable fintech platforms.`
- Services content state:
  - first slide uses screenshot-aligned copy with `Core Build` eyebrow and `AI Accelerated Fintech Engineering` title
  - remaining slides may still use placeholder/dummy text until final content is provided
- Current Testimonials subtitle is:
  - `Feedback from fintech partners delivering secure, scalable, compliant card platforms.`
- Current Engagement subtitle is:
  - `Flexible operating models designed to match your fintech's stage, scale, and regulatory complexity.`
- Current Footer CTA title is:
  - `Ready to Build Your Card Platform`
- If Services copy/points change, update both:
  - `src/content/Home page/content.json`
  - `src/content/Home page/default.js`

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
- Secondary accent/highlight color should be green `#16AB6D` rather than orange wherever the latest screenshots indicate green emphasis
- When a user says a section is misaligned or broken, prioritize matching the screenshot over preserving prior implementation details
- Current architectural decision: continue building additional pages in the existing plain static HTML/CSS/JS setup
- Astro/framework migration is explicitly deferred until the user decides the project has grown enough to justify it
- User requested commit + push after updates unless explicitly told not to
- If a change affects runtime content, update both:
  - `src/content/Home page/content.json`
  - `src/content/Home page/default.js`
- Keep the static share zip out of git:
  - `panasa-static-site.zip` is gitignored
- Footer screenshot-matching notes:
  - CTA heading uses `Ready to Build Your Card Platform`
  - footer legal row sits inside the dark footer card under a divider
  - outer footer uses a green horizontal gradient and inner card uses a darker translucent panel

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
