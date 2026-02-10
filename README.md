# Panasa Website

## Structure
- `src/index.html`
- `src/css/style.css`
- `src/js/main.js`
- `src/data/content.json`
- `src/assets/`

## Run locally
Option 1 (no server):
- Open `src/index.html` in your browser.

Option 2 (recommended, with a local server):
1. From this folder, run:
   ```bash
   python3 -m http.server 5173
   ```
2. Visit `http://localhost:5173/src/`

## GitHub Pages
This repo includes a `docs/` folder for GitHub Pages.
1. In the repo, go to Settings → Pages.
2. Set Source to `Deploy from a branch`.
3. Select branch `main` and folder `/docs`.
4. Save. Your site will publish shortly.

## Notes
- Responsive layout with mobile nav.
- Scroll animations via IntersectionObserver.
- All assets are local SVGs.
- Content is data-driven via `src/data/content.json` to make Strapi integration straightforward.
- `src/data/default.js` provides a built-in fallback if a CMS endpoint is unavailable.
