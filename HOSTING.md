# Hosting Panasa Static Website

This website is a static site, so it can be hosted on any platform that serves HTML, CSS, JS, and assets.

## Recommended Structure

- Edit the working source in `src/`
- Sync the live-ready copy into `docs/`
- Publish `docs/` to your hosting provider

Before publishing, mirror `src/` into `docs/`:

```bash
rm -rf docs
mkdir -p docs
cp -R src/* docs/
```

## Fastest Option: GitHub Pages

This project is already set up well for GitHub Pages because it uses the `docs/` folder.

### Steps

1. Make your changes in `src/`
2. Sync `src/` into `docs/`
3. Commit and push the repo
4. In GitHub, open `Settings -> Pages`
5. Under `Source`, choose `Deploy from a branch`
6. Select:
   - Branch: `main`
   - Folder: `/docs`
7. Save

GitHub will generate a live URL after deployment.

## Other Good Hosting Options

### Netlify

- Push the repo to GitHub
- Create a new Netlify site from the repo
- Set the publish directory to `docs`
- No build command is required for this project

If you want Netlify to always publish the latest site, make sure `docs/` is committed after every `src/` update.

### Vercel

- Import the repo into Vercel
- Set the output directory to `docs`
- Leave the build command empty unless you later automate the `src` to `docs` sync

### Traditional Hosting / cPanel / S3

- Upload the contents of `docs/` to the server's public web root
- Common upload targets are `public_html/`, `www/`, or an S3 bucket configured for static website hosting

## Domain Setup

To use a custom domain:

1. Point your domain DNS to the hosting provider
2. Add the domain inside the hosting platform settings
3. Enable HTTPS/SSL

Most platforms handle SSL automatically once the DNS is connected correctly.

## Pre-Launch Checklist

- Confirm the latest design/content changes were made in `src/`
- Re-sync `docs/` before publishing
- Test locally from `docs/`

```bash
cd docs
python3 -m http.server 8080
```

Then open `http://localhost:8080`

- Check Home, About, Careers, and Contact pages
- Verify images, CSS, JS, and navigation all load correctly
- Test mobile and desktop layouts

## Simple Recommendation

For this project, the easiest path to go live is:

1. Edit in `src/`
2. Copy into `docs/`
3. Push to GitHub
4. Host with GitHub Pages from `/docs`

That gives you a reliable live website without adding any framework or deployment complexity.
