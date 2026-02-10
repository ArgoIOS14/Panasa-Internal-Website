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

## Notes
- Responsive layout with mobile nav.
- Scroll animations via IntersectionObserver.
- All assets are local SVGs.
