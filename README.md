# Panasa Website

## Structure
- `src/index.html`
- `src/css/style.css`
- `src/js/main.js`
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
