# Panasa Website

Static website for Panasa Technology — a fintech engineering studio serving issuers, processors, neobanks, and payment platforms across the UK, EU, and APAC.

## Project Structure

```
dev/                  # Development source (edit here)
prod/                 # Production-ready mirror (deploy this)
dev/index.html        # Homepage (pre-rendered for SEO)
dev/about.html        # About page
dev/contact.html      # Contact page with Zoho Bigin CRM form
dev/careers.html      # Careers page
dev/services.html     # Services overview (AI Governance)
dev/ai-governance.html
dev/ai-accelerated-fintech-engineering.html
dev/ai-powered-legacy-modernisation.html
dev/intelligent-operations.html
dev/css/              # Stylesheets
dev/js/               # JavaScript modules
dev/assets/           # Images, icons, logos
dev/api/              # PHP proxy endpoints for Zoho Bigin CRM
dev/content/          # CMS content (JSON + JS fallback)
dev/router.php        # Local dev router for clean URLs
dev/robots.txt        # Crawler directives
dev/sitemap.xml       # XML sitemap
dev/llms.txt          # AI crawler guidance
dev/.htaccess         # Apache URL rewriting + redirects
API.md                # API endpoint documentation
HOSTING.md            # Deployment guide
CHANGELOG.md          # Version history
```

## Local Development

### With clean URLs (recommended)

```bash
cd dev && php -S localhost:8080 router.php
```

Then open `http://localhost:8080`. Clean URLs work: `/about` serves `about.html`, `/about.html` redirects to `/about`.

### Without clean URLs

```bash
php -S localhost:8080 -t dev
```

Pages are accessed with `.html` extension (e.g. `http://localhost:8080/about.html`).

### Requirements

- PHP 8+ (for local server and Zoho CRM proxy)
- PHP `curl` extension (for API calls to Zoho)

## Zoho Bigin CRM Integration

The contact form and email capture popup submit leads to Zoho Bigin CRM via PHP proxy endpoints.

### Endpoints

| Endpoint | Purpose |
|----------|---------|
| `POST /api/zoho-proxy.php` | Contact form submissions |
| `POST /api/zoho-email-proxy.php` | Email capture popup submissions |

### Setup

1. Create a `.env` file in `dev/api/` (and `prod/api/` for production):

```
ZOHO_CLIENT_ID=your_client_id
ZOHO_CLIENT_SECRET=your_client_secret
ZOHO_REFRESH_TOKEN=your_refresh_token
ZOHO_ACCOUNTS_URL=https://accounts.zoho.in/oauth/v2/token
ZOHO_BIGIN_API_URL=https://www.zohoapis.in/bigin/v2/Contacts
```

2. The `.env` file is blocked from web access by `api/.htaccess`.

See [API.md](API.md) for full endpoint documentation and field mappings.

## Publishing

### Publish Flow

1. Make changes in `dev/`
2. Sync `dev/` into `prod/`:

```bash
rm -rf prod
mkdir -p prod
cp -R dev/* prod/
```

3. Push to GitHub
4. Deploy `prod/` to SiteGround (or other PHP-capable host)

### Hosting Requirements

- Apache with `mod_rewrite` enabled (for clean URLs and redirects)
- PHP 8+ with `curl` extension (for CRM integration)
- SiteGround recommended (current hosting)

See [HOSTING.md](HOSTING.md) for detailed deployment instructions.

## SEO

- Homepage pre-rendered with static HTML (visible to crawlers without JS)
- Organization JSON-LD schema on all pages
- BreadcrumbList and FAQPage structured data
- Open Graph + Twitter Card meta tags
- Canonical tags with clean URLs
- Hreflang tags (en-GB + x-default)
- XML sitemap and robots.txt
- AI crawler directives (blocks training crawlers)
- llms.txt for AI discovery
- Clean URLs via .htaccess (no .html extensions)
- www enforcement via 301 redirect
- Old WordPress URL redirects (301)

## Features

- Responsive layout with mobile navigation
- Scroll animations via IntersectionObserver
- Services carousel with swipe/drag support
- Email capture popup with scroll trigger and 3-day dismiss cooldown
- Engagement models with animated tab filtering
- FAQ accordion with custom SVG icons
- Logo marquee animation
- Testimonials carousel (responsive: static on desktop, swipeable on mobile)
- Contact form with searchable country code picker and validation

## Content Management

- Runtime content loads from `dev/content/Home page/content.json`
- `dev/content/Home page/default.js` provides the built-in fallback content
- Homepage JS only re-renders sections when fetched content differs from defaults
- If content changes, update both `content.json` and `default.js`, then update the static HTML in `index.html` to match
