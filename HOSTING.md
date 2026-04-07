# Hosting Panasa Static Website

This website is a static site, so it can be hosted on any platform that serves HTML, CSS, JS, and assets.

## PHP Requirement for Forms

The contact form (`zoho-proxy.php`) and email capture popup (`zoho-email-proxy.php`) require a **PHP 8+** runtime. Static-only hosts will serve the pages but form submissions will fail silently or 404.

| Platform | PHP Support | Notes |
|----------|-------------|-------|
| GitHub Pages | No | Static files only — forms won't work |
| Netlify / Vercel | No | Would need serverless functions (not yet configured) |
| cPanel / Shared Hosting | Yes | Full PHP support out of the box |
| Docker / VPS | Yes | Full control over runtime and configuration |

If you deploy to a static-only host, the site will load fine but any form submission will fail. Plan accordingly.

## Project Structure

- `dev/` — working source (development)
- `prod/` — production-ready copy (deploy this folder)

## Recommended Workflow

- Edit the working source in `dev/`
- Sync the live-ready copy into `prod/`
- Publish `prod/` to your hosting provider

Before publishing, mirror `dev/` into `prod/`:

```bash
rm -rf prod
mkdir -p prod
cp -R dev/* prod/
```

## Local Development

### With clean URLs (recommended):

```bash
php -S localhost:8080 dev/router.php -t dev
```

This mimics `.htaccess` rewrite rules — `/about` serves `about.html`, `/about.html` redirects to `/about`.

### Without clean URLs:

```bash
php -S localhost:8080 -t dev
```

Pages are accessed with `.html` extension.

## Fastest Option: GitHub Pages

This project can use GitHub Pages with the `prod/` folder (note: PHP forms won't work).

### Steps

1. Make your changes in `dev/`
2. Sync `dev/` into `prod/`
3. Commit and push the repo
4. In GitHub, open `Settings -> Pages`
5. Under `Source`, choose `Deploy from a branch`
6. Select:
   - Branch: `main`
   - Folder: `/prod`
7. Save

GitHub will generate a live URL after deployment.

## Other Good Hosting Options

### Netlify

- Push the repo to GitHub
- Create a new Netlify site from the repo
- Set the publish directory to `prod`
- No build command is required for this project

If you want Netlify to always publish the latest site, make sure `prod/` is committed after every `dev/` update.

### Vercel

- Import the repo into Vercel
- Set the output directory to `prod`
- Leave the build command empty unless you later automate the `dev` to `prod` sync

### Traditional Hosting / cPanel / S3

- Upload the contents of `prod/` to the server's public web root
- Common upload targets are `public_html/`, `www/`, or an S3 bucket configured for static website hosting

## Domain Setup

To use a custom domain:

1. Point your domain DNS to the hosting provider
2. Add the domain inside the hosting platform settings
3. Enable HTTPS/SSL

Most platforms handle SSL automatically once the DNS is connected correctly.

## Pre-Launch Checklist

- Confirm the latest design/content changes were made in `dev/`
- Re-sync `prod/` before publishing
- Test locally from `dev/`

```bash
php -S localhost:8080 dev/router.php -t dev
```

Then open `http://localhost:8080`

- Check Home, About, Careers, and Contact pages
- Verify images, CSS, JS, and navigation all load correctly
- Test mobile and desktop layouts

## Simple Recommendation

For this project, the easiest path to go live is:

1. Edit in `dev/`
2. Copy into `prod/`
3. Push to GitHub
4. Deploy `prod/` to SiteGround (or host with GitHub Pages from `/prod`)

That gives you a reliable live website without adding any framework or deployment complexity.
