# Panasa Website

## Project Structure

- `src/` is the primary editable source
- `docs/` is the deployable static mirror used for publishing
- `src/index.html`
- `src/css/style.css`
- `src/js/main.js`
- `src/content/Home page/content.json`
- `src/content/Home page/default.js`
- `src/assets/`

## Local Preview

Recommended:

```bash
cd docs
python3 -m http.server 8080
```

Then open `http://localhost:8080`

## Publishing / Hosting

This is a static website, so it can go live on any platform that serves HTML, CSS, JS, and assets.

### Publish Flow

1. Make changes in `src/`
2. Sync `src/` into `docs/`
3. Publish `docs/`

Use this before pushing live updates:

```bash
rm -rf docs
mkdir -p docs
cp -R src/* docs/
```

### Fastest Option: GitHub Pages

This repo is already structured for GitHub Pages because it uses the `docs/` folder.

1. Push the repo to GitHub
2. In GitHub, open `Settings -> Pages`
3. Set `Source` to `Deploy from a branch`
4. Choose branch `main`
5. Choose folder `/docs`
6. Save

GitHub will then generate the live site URL.

### Other Hosting Options

- Netlify: import the repo and set the publish directory to `docs`
- Vercel: import the repo and set the output directory to `docs`
- cPanel / shared hosting: upload the contents of `docs/` into `public_html/`
- Amazon S3: upload `docs/` to a bucket configured for static website hosting

## Pre-Launch Checklist

- Confirm the latest edits were made in `src/`
- Re-sync `docs/` before publishing
- Test Home, About, Careers, and Contact locally
- Verify images, CSS, JS, and navigation load correctly
- Check desktop, tablet, and mobile layouts

## Notes

- Responsive layout with mobile nav
- Scroll animations via IntersectionObserver
- All assets are local SVGs
- Runtime content loads from `src/content/Home page/content.json`
- `src/content/Home page/default.js` provides the built-in fallback content
- If content changes, update both `content.json` and `default.js`
- For a standalone hosting note, see `HOSTING.md`
