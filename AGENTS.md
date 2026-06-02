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

## Development Model (strict)
- **Development / implementation work → Sonnet** — including any subagents spawned to build in parallel (pass `model: sonnet`).
- **Planning & exploration → Opus** — these require heavy lifting, so use Opus for plan agents, exploration/research agents, and the planning phase.
- Review may use the default/inherited model.
- Only deviate when the user explicitly names another model for a given task (e.g. "use Opus for this build").

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

## QA Deploy vs Production — strict separation

The site has **two deploy targets** and they must not contaminate each other:

| Target | URL | Source folder | How |
|---|---|---|---|
| **QA** (self-serve, internal review) | `https://panasa-qa.netlify.app` | `dev/` | `npx netlify deploy --prod --build` (Netlify CLI) |
| **Production** (live customer site) | `https://www.panasatech.com` | `prod/` | `scripts/build-deploy.sh <version>` → zip → infra → SiteGround |

### Hard rule: QA-only artifacts NEVER touch `prod/`

The following files exist ONLY because of the Netlify QA preview. They must stay in `dev/` (or repo root) and must never be copied, mirrored, or referenced from `prod/`:

| File | What it is | Allowed locations |
|---|---|---|
| `dev/_redirects` | Netlify redirect rules (clean URLs, WP query-params) | `dev/` only |
| `dev/js/qa-banner.js` | Runtime QA banner + contact-form intercept (activates only on non-prod hostnames) | `dev/js/` only |
| `dev/qa-api-disabled.html` | Friendly 404 fallback for `/api/*` on Netlify (no PHP runtime) | `dev/` only |
| `<script src=".../js/qa-banner.js" defer>` tag inside `<head>` | Loads the QA banner script | Only in `dev/*.html`. **Never** in `prod/*.html`. |
| `netlify.toml` | Netlify build/publish/redirect/header config | Repo root only — no SiteGround equivalent |
| `.qa-build/` | Netlify build output (rsync of `dev/` minus `api/`) | gitignored, regenerated per deploy |

### Why this matters
- Production site is served from `prod/` by SiteGround (Apache + PHP). The QA banner script would render a yellow "QA BUILD" banner on the live site if it leaked over.
- `_redirects` is Netlify-specific and has no effect on Apache — but it would pollute the SiteGround web root.
- The PHP `/api/*` endpoints work on SiteGround; on Netlify they 404 via `dev/_redirects`. The two flows MUST stay separate.

### Adding new QA-only features in future
When introducing any new scaffolding for the Netlify QA preview (a build helper, a debug overlay, a non-prod feature flag, etc.):
1. Place the file under `dev/` only.
2. If it's referenced from HTML, only inject the reference into `dev/*.html`. Never modify `prod/*.html` for QA purposes.
3. If it's a config file at the repo root (like `netlify.toml`), it must not affect what `scripts/build-deploy.sh` copies. The build script copies `prod/.` into the zip; root-level QA configs are ignored automatically.
4. Update this section of `AGENTS.md` with the new file in the table above.

### Verifying the separation
Before any production deploy, run:
```bash
grep -rln "qa-banner\|qa-api-disabled\|QA BUILD" prod/ || echo "clean"
ls prod/_redirects prod/netlify.toml prod/js/qa-banner.js 2>/dev/null && echo "LEAK"
```
Both should print `clean` / nothing. If anything shows up, the QA / prod separation has been broken — fix before deploying to SiteGround.

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
- Site-header background rule (strict — never deviate):
  - `.site-header` must have `background: transparent` on every page. The nav's dark pill (`.nav`) is the ONLY visible nav background.
  - do NOT re-introduce a solid mint band behind the nav (e.g. `rgba(125, 211, 174, 0.88)` or any other colour) — the hero gradient + grid-line pattern is the intended background and the nav pill floats directly on top of it
  - this applies on all pages including those without a hero; on white pages the nav pill just floats on white
  - deviation requires explicit written user approval
- Hero design element parity rule (strict — never deviate):
  - the hero's mint → white gradient treatment, color stops, vertical extent, and nav-blending behaviour MUST match the treatment already established on the existing pages (Home, About, Careers, Contact, Services)
  - new pages must NOT invent a different gradient colour scheme, a different fade length, a different end-colour, or a different relationship between the sticky nav and the hero background
  - if a new page's hero content is shorter than Home's, extend the gradient so it still covers the nav + hero + any adjacent hero-adjacent element (e.g. a featured card directly under the hero) instead of ending abruptly on a short hero box
  - the sticky nav must visually sit on the mint gradient at the top of the page — never on a plain white background — on any page that has a hero
  - the sticky nav must stay pinned at `top: 0` on every page; do NOT set `--hero-top` on the page wrapper because that offsets `.site-header` upward. Only set `--hero-top` on the `.hero` element itself (as Home does) if a section inside the hero needs to reference it
  - any deviation from the shared hero treatment requires explicit written approval from the user; otherwise treat the existing Home hero as the reference implementation
- Blog Detail template rule (strict):
  - every blog article lives at `dev/blog/<slug>.html` and pulls its content from `dev/content/Blog/<slug>.json` (fallback `dev/content/Blog/<slug>.default.js` exposing `window.DEFAULT_BLOG_CONTENT`)
  - all 9 blog HTML files share the same skeleton — nav, hero-card, article body container, author+share strip, newsletter section, More Blogs grid, shared footer. Only the `data-blog-slug` attribute, `<title>`, JSON-LD, and default.js `<script src>` change per file
  - page wrapper class: `.blog-detail-page` — carries the same `::before` gradient + `::after` column-fade-before-title treatment as every other hero-bearing page
  - body is rendered from JSON `body[]` by `renderBlogDetail` — two block types: `{type: "html", content: "…"}` for rich prose, and `{type: "callout", title, text, cta}` for inline CTA cards (mint-green panel). Do NOT inline these as hardcoded HTML — the admin CMS on `br_resource` will edit them through the block model
  - Newsletter section below the article is the INLINE variant (`components/inline-newsletter.js`), not the scroll-triggered `email-capture.js` modal. Both post to `/api/zoho-email-proxy.php` so CRM pipeline stays single-source
  - "More Blogs" grid reuses the `.resource-card` class + `renderCard`-style markup from `sections/resources.js` — do not fork a second card component
  - blog pages live one directory deep, so all intra-site links inside them use `../` prefixes (`../about`, `../resources?filter=blogs`, `../assets/logo.svg`). The blog-detail entry (`js/blog-detail.js`) sets `window.STRAPI_URL = '../content/Home page/content.json'` before importing `loadContent` so the shared nav+footer fetch still resolves correctly; new pages added under `/blog/` must preserve this override
  - every new blog article requires a matching `<url>` entry in `dev/sitemap.xml` (and `prod/`) — do not ship a blog page without the sitemap entry
- Hero background layers rule (strict — never deviate):
  - every hero on every page uses TWO separate stacking layers (typically `::before` + `::after` on a hero wrapper, each at `z-index: -1`):
    1. **Gradient layer** — mint → transparent vertical fade. Covers nav + hero copy + any hero-adjacent element (e.g. featured card directly below hero)
    2. **Column-line layer** — faint mint vertical columns at 72px step, `rgba(22, 171, 109, 0.18)`. **Fades out BEFORE the hero's main title so the title never sits on a striped background.**
  - Gradient layer recipe:
    ```
    background: linear-gradient(180deg, <mint> 0%, …, rgba(255, 255, 255, 0) 100%);
    -webkit-mask-image: linear-gradient(180deg, #000 0%, #000 55%, transparent 95%);
            mask-image: linear-gradient(180deg, #000 0%, #000 55%, transparent 95%);
    ```
  - Column layer recipe (tight fade in pixel units, not %, so it ends reliably near the nav regardless of hero height):
    ```
    background: linear-gradient(90deg, rgba(22, 171, 109, 0.18) 1px, transparent 1px);
    background-size: 72px 100%;
    background-repeat: repeat-x;
    -webkit-mask-image: linear-gradient(180deg, #000 0%, #000 120px, transparent 220px);
            mask-image: linear-gradient(180deg, #000 0%, #000 120px, transparent 220px);
    ```
  - Column fade end-point (`transparent <N>px`) MUST sit above the hero's main title. Default `220px` from the top of the masked element works for most layouts; increase only if a specific hero puts its title lower. Never let columns render across the title area.
  - ONLY vertical lines are drawn — no horizontal grid lines
  - column step = 72px and colour `rgba(22, 171, 109, 0.18)` on every page; do not change per page
  - the gradient layer MUST extend UP behind the sticky nav pill (typically via `top: -120px` on a `::before`, or `background-size: … 760px` starting at `0 0`). The nav must always float on the mint gradient, never on plain white
  - any wrapper that hosts the hero pseudos MUST NOT set `overflow: hidden` — it will clip the gradient extension above the nav
  - deviation (horizontal lines, different step/colour/opacity, column layer extending past the title, no mask on either layer, gradient starting below nav) requires explicit written user approval
- Page-specific stylesheet baseline rule (strict):
  - every new page's stylesheet must include the same global reset used by Home / About / Careers / Contact / Services:
    ```
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'InterVariable', 'Inter', 'DM Sans', sans-serif; color: var(--text-dark); overflow-x: hidden; }
    h1,h2,h3,h4,h5,h6 { font-family: 'Lufga', 'InterVariable', 'Inter', sans-serif; }
    img { display: block; max-width: 100%; }
    a { color: inherit; text-decoration: none; }
    ul { list-style: none; }
    ```
  - without this baseline the shared nav renders with default browser `<a>` colour (purple/blue), default underlines, and default `<ul>` padding, which makes the nav look taller and differently coloured from the rest of the site
  - any new page CSS file MUST open with this block before any page-specific styles
- Footer design element parity rule (strict — never deviate):
  - every page's footer treatment (outer green gradient field + dark translucent inner card + CTA row + columns + legal row) MUST be identical to the shared footer used on Home, About, Careers, Contact, Services
  - footer link badges (e.g. `HIRING!`, `NEW`) MUST share the same shape/height/padding/border-radius/alignment/mobile scaling; only the colour may differ per badge
  - do NOT create page-specific footer card colours, textures, typography, spacing, or badge shapes that diverge from the shared treatment
  - if the footer treatment ever evolves, update the shared footer source (`shared-footer.css` + per-page static HTML + content JSON) so every page — existing and future — inherits the same result in a single pass
  - any deviation from the shared footer treatment requires explicit written approval from the user
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
