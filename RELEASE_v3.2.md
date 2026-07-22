# Panasa Website — Release v3.2

**Release date:** 2026-07-22
**Previous version:** v3.1
**Branch merged:** `br_homepage_refinement` → `main` (merge commit `2936b0b`, 13 commits)
**Scope:** 218 files changed, +9,914 / −2,328 lines

---

## Summary

This release covers a full home page refinement, a new shared `feature-card` component used across the Resources hub and every article detail page, 4 new published articles (3 case studies + 1 guide + 1 insight + 1 blog), bespoke cover artwork across the resources library, and a set of UX fixes to the guide table-of-contents strip and the mobile case-studies carousel.

---

## What's New

### Content
- **3 new case studies**, each with bespoke cover art:
  - *Launch Your Fintech in Weeks: An Accelovate Case Study*
  - *Cleva Cards: Building Safer Payments for Vulnerable Cardholders*
  - *Modernising a Global Issuer Processor: From Monolith to Amazon EKS*
- **1 new guide**: *The Ultimate Guide to Migrating Your Card Program*
- **1 new insight**: *Should You Build or Buy a Card Issuing Platform in 2026?* (includes two build-vs-buy comparison tables)
- **1 new blog post**: *Tokenisation for Issuers*
- Resources hub now lists **18 published items** across Blogs, Insights, Guides, and Case Studies

### Home page
- **Payments Knowledge Hub** — new section
- **FAQ** — new section (Services-page accordion style)
- Case Studies section redesigned: green card, cover image, date · read-time meta (metrics removed)
- Section order updated: Engagement Models now appears before Testimonials
- Testimonial logos refreshed

### Design system
- New shared **`feature-card` component** — used for the Resources list's featured card and every blog/guide/insight/case-study detail-page hero, with per-category background art and the CTA hidden on detail pages
- Detail-page newsletter sections unified to one background treatment across blog, guide, and case-study pages

### UX fixes
- Guide table-of-contents strip: edge-fade + directional chevron when the strip overflows, active tab auto-scrolls into view, and a dedicated mobile swipe path (the desktop hover auto-scroll no longer engages on touch, so it can't fight a finger swipe)
- Mobile case-studies carousel: all cards now share equal height (previously varied with title length) and a visible gap is restored between cards while swiping
- Payments Knowledge Hub heading now stacks correctly ("Payments" / "Knowledge Hub" on separate lines)

### Documentation
- `AGENTS.md` consolidated as the single canonical source of project rules and context

---

## Deployment

**Artifact:** `panasa-deploy-v3.2.zip` (built via `scripts/build-deploy.sh 3.2`)

Full deployment instructions, server requirements, and troubleshooting are in [`HOSTING.md`](./HOSTING.md) and are also included as a standalone message for the infra team in `release-email-v3.2.md`.

**Quick summary:**
1. Extract `panasa-deploy-v3.2.zip` into the production web root, preserving `/api/.env` and `.well-known/`.
2. If first deploy or credentials changed, recreate `/api/.env` from the shipped `/api/.env.example`.
3. Purge server + CDN cache.
4. Run `./scripts/verify-deploy.sh https://www.panasatech.com` and confirm all checks pass.

No database, no build step, no Node.js on the server — static files plus two PHP endpoints (`api/zoho-proxy.php`, `api/zoho-email-proxy.php`).

---

## Verification performed pre-release

- `dev/` ↔ `prod/` parity: confirmed — HTML differs only by the expected cache-bust version strings and the dev-only QA banner script; all other content, CSS, and JS is identical.
- No QA-only artifacts (`qa-banner.js`, `_redirects`, `qa-api-disabled.html`) present anywhere under `prod/`.
- All content JSON files parse and round-trip to their `.default.js` counterparts (one pre-existing, unrelated drift noted below).
- `sitemap.xml` well-formed in both trees, all published URLs present.
- Every Resources list item's link and cover image resolves to a real file.
- Spot-checked SEO tags (title, meta description, canonical, Open Graph, Twitter Card, JSON-LD) across a sample of new and existing pages — all present and correct.
- Functional smoke test: home page, Resources list, the new guide, and the new insight all render without console errors; comparison tables and cover images load correctly.

## Known issues (pre-existing, not introduced by this release)
- `blog/anatomy-of-a-swipe.json` → `.default.js` is missing a few fields (`category`, `datePublished`, `dateModified`, `tags`, `meta`) relative to its source JSON. Dates from before this release; tracked separately.
- 4 older articles' JSON-LD `image` field points at a generic fallback image instead of their bespoke cover (their `og:image` is already correct). Cosmetic, tracked separately.
- The EKS case-study page title runs slightly long for optimal SERP display (75 characters).
- `resources.html`'s static `CollectionPage` JSON-LD (dev + prod) lists only the original 12 articles and predates every item added since — it's now missing all 6 newer publications (3 case studies, 1 guide, 1 insight, 1 blog) from this and the prior release. Internally consistent (`numberOfItems: 12` matches its own 12 listed entries) but stale relative to the live Resources list (18 items). Recommend regenerating this block from `content/Resources/content.json` — ideally scripted so it can't drift again — as a follow-up, not blocking this deploy.

---

## Rollback

If an issue is found post-deploy, redeploy the previous `panasa-deploy-v3.1.zip` artifact following the same steps in `HOSTING.md`. No database or schema changes are involved in this release, so rollback is a straight file-level revert.
