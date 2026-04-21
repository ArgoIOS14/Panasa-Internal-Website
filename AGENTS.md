# AGENTS.md

## Claude Code Subagents (project-level)

Custom subagents live in `.claude/agents/` and are available in every Claude Code session opened at this repo root. **Use them proactively** — do not reimplement their roles inline.

| Agent | When to use | Tools |
|---|---|---|
| `panasa-reviewer` | After any non-trivial change to admin modules, Firebase rules, the `/api/rebuild.php` pipeline, role-gating UI, or before publishing to production. Read-only code review tuned to this codebase (security, role leaks, dev/prod drift, rebuild pipeline integrity, a11y). | Read, Grep, Glob, Bash |
| `panasa-tester` | After any new feature, bug fix, or refactor touching admin or public pages. Writes, runs, and maintains automated tests (Playwright E2E, Vitest unit, PHP endpoint scripts). Identifies coverage gaps proactively. Mutates `tests/` and dev-only tooling only; never touches production Firebase (uses emulator or flagged test project). | Read, Write, Edit, Grep, Glob, Bash |

**How to invoke:** ask Claude Code naturally — e.g. "use panasa-reviewer to audit the invite flow" or "have panasa-reviewer check for dev/prod drift". Claude should reach for this agent automatically whenever a reasonable review opportunity arises (after a cluster of admin changes, before committing, after adding a new module).

**Constraint:** the reviewer agent is read-only by design. It reports findings; the caller applies fixes. Do not expand its tool set to include Edit/Write without a discussion.

**Adding more agents:** drop another `<name>.md` file into `.claude/agents/` with YAML frontmatter (`name`, `description`, `tools`) followed by the system prompt. Keep scope narrow — one agent per specialty (reviewer, migration runner, a11y auditor, etc.).

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
- `HOSTING.md`: static hosting and publishing note for GitHub Pages / static platforms
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
  - primary CTA uses a compact dark rounded-rectangle treatment with the provided headset icon
  - secondary CTA is lighter, less button-like, and uses the provided 4-square icon
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
  - centered screenshot-led card shell using the provided SVG background as the full card field
  - dot navigation centered below the card
  - desktop styling is being tuned toward the latest screenshot-driven design
  - top pill is intentionally removed in the latest design direction
  - latest screenshot-matching pass uses:
    - smaller compact heading scale
    - green uppercase eyebrow
    - compact black CTA
    - CTA anchored near the bottom-left of the card
  - current implementation notes:
    - card metrics are part of the background artwork rather than rendered as a separate DOM column
    - carousel links/buttons must remain clickable inside the swipe carousel
    - current Home case studies count is `3` slides only
- Services section has been redesigned from a simple grid into a featured two-column carousel layout:
  - section heading/copy row at top
  - left side: active service eyebrow, title, bullet list, CTA
  - right side: large visual panel
  - centered dot navigation below the visual area
- Current Services screenshot-matching notes:
  - top section pill/header is intentionally hidden if empty
  - heading remains `AI-Driven Fintech Services Stack`
  - right summary copy currently uses the end-to-end AI-powered engineering wording from the latest screenshot
  - services now use 4 screenshot-aligned slides:
    - `Core Build`
    - `Core Govern`
    - `Core Operate`
    - `Core Modernise`
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
- Hero background fade rule for all current and future pages:
  - mint/green fade plus background grid boxes must be limited to the hero region only
  - the fade treatment should end around the trusted-logo loop / hero close, not continue through the rest of the page
  - all sections after the hero region should return to a plain white background unless a section-specific reference explicitly uses a different background
- About page mobile direction now follows the supplied mobile screenshot:
  - tighter hero proportions
  - 2-column stat cards
  - compact map/process spacing
  - 2-column leadership cards on mobile
- New page layout consistency rule:
  - every new page must match the provided reference as closely as possible, not just section-by-section but in whole-page rhythm
  - maintain consistent horizontal gutters and shared content widths across sections unless the reference clearly shows an intentional breakout
  - maintain consistent vertical rhythm between sections, headings, content blocks, and footer transitions so spacing does not drift looser or tighter from one section to another
  - when a screenshot or PNG reference is provided, use it as the source of truth for typography scale, line lengths, spacing density, and alignment before introducing page-specific interpretation

## Global UI/UX Rules (All Pages)
- Apply smooth scrolling and fade in/out section animations on every page, consistent with Home page behavior.
- Use `Lufga` for all header/title text across all pages.
- Use `Inter Variable` for all body/description/supporting text across all pages.
- Treat this typography mapping as a standing rule for all future pages and sections unless the user explicitly requests an exception:
  - titles/headings/navigation labels/buttons: `Lufga`
  - descriptions/body copy/supporting text/list text/legal/footer text: `Inter Variable`
- Typography scale consistency rule:
  - even when a supplied screenshot makes a text block appear unusually small, do not shrink typography below the established page/system scale unless the user explicitly asks for that exception
  - screenshot matching should preserve the project's overall typography philosophy, hierarchy, and readability across the full page
  - mobile text in particular should stay visually consistent with the rest of the page rather than being reduced to match an undersized-looking reference crop
- Use a common pill-shaped navigation bar component on all pages that require navigation.
- The common navigation bar must retain the same brand image assets and visual treatment already established in the project.
- Use the shared Panasa footer treatment on all current and future pages unless the user explicitly requests a different footer:
  - outer footer uses the green gradient field with `src/assets/footer-background-paths-container.svg` as the background graphic
  - inner footer uses the dark translucent card treatment with divider legal row
  - footer visual language, spacing, and typography should stay consistent across Home, Careers, Contact, and future pages
- Footer implementation rule:
  - new pages must load and reuse the shared footer styling rather than redefining page-specific footer card looks
  - if the footer visual treatment changes, update the shared footer source so all pages inherit the same result
- Navigation is now a strict shared-component rule for all future pages:
  - every new page must reuse the same shared navigation pill used on Home
  - do not restyle, override, resize, recolor, or locally redefine `.site-header`, `.nav`, `.nav-links`, `.brand`, or the nav CTA on page-specific stylesheets
  - if navigation spacing or styling ever needs to change, make that change in the shared navigation source so all pages stay identical
  - page-specific CSS may position content below the nav, but must not change the nav's color, button layout, border radius, sizing, spacing, or visual treatment
  - responsive nav behavior must reset cleanly across breakpoint changes:
    - mobile-only classes, inline styles, open states, submenu sizing, and temporary JS layout overrides must be removed when returning to tablet/desktop widths
    - resizing from desktop to mobile and back again must preserve the approved desktop pill layout without stretched geometry or leftover mobile alignment styles
    - any future mobile nav enhancement must be tested for first-open behavior and breakpoint return behavior before being considered complete
- Form field focus styling is now a strict shared behavior rule:
  - text inputs, textarea fields, and composite text-entry controls must use a neutral grey border by default
  - green borders are reserved for the active selected/focused state only
  - selected/focused text fields must switch to the project green focus treatment consistently across all pages
  - do not leave textboxes with a permanent green border unless the user explicitly requests a non-standard state
- Footer inner-card styling is now a strict shared design rule for all pages:
  - all page footers must use the same dark green inner footer card treatment established by the approved screenshot direction
  - the inner footer card must retain the subtle textured/noise look, dark translucent green panel, soft border, and understated divider row
  - do not create page-specific footer card colors, textures, or typography styles that diverge from the shared approved footer treatment
  - if footer styling needs to evolve, update the shared footer treatment across all pages together so Home, Contact, Careers, and future pages remain visually identical

## Asset Mapping Notes
- Service card custom icons: `src/assets/service-frame-1.svg` ... `service-frame-6.svg`
- Hero CTA icons:
  - `src/assets/hero-cta-talk-icon.svg`
  - `src/assets/hero-cta-view-icon.svg`
- About stat icons:
  - `src/assets/about-stat-experience.svg`
  - `src/assets/about-stat-team.svg`
  - `src/assets/about-stat-transactions.svg`
  - `src/assets/about-stat-uptime.svg`
- Home case study background card graphic:
  - `src/assets/case-results-visual.svg`
- Testimonial author logos:
  - `src/assets/testimonial-logo-1.svg`
  - `src/assets/testimonial-logo-2.svg`
- Shared footer background graphic:
  - `src/assets/footer-background-paths-container.svg`

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
  - all four slides now use screenshot-aligned content:
    - `AI Accelerated Fintech Engineering`
    - `AI Governance`
    - `Intelligent Operations`
    - `AI-Led Legacy Modernisation`
- Services page mode mapping rule:
  - `services.html` is the base/default `AI Governance` mode
  - `services.html?service=ai-accelerated-fintech-engineering` is the `AI Accelerated Fintech Engineering` mode
  - `services.html?service=ai-powered-legacy-modernisation` is the `AI Powered Legacy Modernisation` mode
  - `services.html?service=intelligent-operations` is the `Intelligent Operations` mode
  - when the user provides updated screenshot content for any service mode, apply it to that mode-specific section variant rather than replacing the default governance version
  - current section swaps already implemented:
    - `AI Accelerated Fintech Engineering`
      - `What We Cover` swaps to the 5-stage process variant
      - `What We Build` swaps to the dark `Payment Infrastructure for Regulated Platforms` variant
      - `How We Build` swaps to the white `Production-grade from sprint one` 3-column variant
    - `AI Powered Legacy Modernisation`
      - `What We Cover` swaps to the 6-phase process variant
    - `Intelligent Operations`
      - `What We Cover` swaps to the `Six Operational Domains / One Team` card-grid variant
  - preserve the shared nav parent label as `Services`; only the selected dropdown child should highlight as active
- Current Case Studies subtitle is:
  - `Real outcomes from real projects with issuer processors and neobanks`
- Case studies content state:
  - Home currently keeps only 3 slides:
    - `NEOBANK & ISSUER`
    - `PAYMENT SERVICE PROVIDER`
    - `OPS MODERNIZATION`
  - `Read Full Case Study` CTA should route to `contact.html`
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
- Screenshot text fidelity rule:
  - when a screenshot, mockup, or reference image includes readable text, copy that text exactly as shown instead of inferring, paraphrasing, rewriting, or filling gaps with invented copy
  - do not add random, substitute, or "best guess" content when the reference already provides the text
  - dummy or placeholder data may only be used for sections/pages where no final text has been provided yet, such as intentionally unfinished carousel slides or placeholder cards
  - once real text is provided in a screenshot, spec, PDF, or direct user message, replace any dummy content and stop using placeholder copy for that area
- Secondary accent/highlight color should be green `#16AB6D` rather than orange wherever the latest screenshots indicate green emphasis
- When a user says a section is misaligned or broken, prioritize matching the screenshot over preserving prior implementation details
- When a screenshot provides iconography or SVG artwork for a section, prefer using the supplied SVGs directly rather than approximating them with CSS boxes, generated icons, or placeholder UI.
- Treat reference files as the governing layout system for new pages:
  - preserve consistent gutters, section widths, and vertical spacing cadence across the page unless the reference explicitly breaks that pattern
  - avoid letting individual sections grow larger, looser, or denser than the supplied design without a direct reference-based reason
- Careers page note:
  - the `Why Join Panasa?` section has been removed per the latest design direction and should not be reintroduced unless explicitly requested
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
