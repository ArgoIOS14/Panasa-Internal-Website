**Subject:** Panasa Website — Release v3.2 ready for deployment

Hi team,

Panasa website **v3.2** is ready to deploy. Details and full release notes are in the attached `RELEASE_v3.2.md`; deployment artifact is `panasa-deploy-v3.2.zip`.

**What's in this release (short version):**
- 3 new case studies, 1 new guide, 1 new insight, 1 new blog post
- New home page sections: Payments Knowledge Hub, FAQ
- Redesigned Case Studies section on the home page
- A handful of mobile UX fixes (guide table-of-contents scrolling, case-studies carousel card sizing)

No database changes, no new environment variables, no schema changes. Same server requirements as previous releases (PHP 8+, Apache with `mod_rewrite`, `AllowOverride All`, HTTPS active).

**Server requirements**
- PHP 8+ with `curl` extension
- Apache with `mod_rewrite` enabled, `AllowOverride All`
- HTTPS/SSL active
- DNS: A records for both `panasatech.com` and `www.panasatech.com`

**Deploy steps**
1. Download the attached `panasa-deploy-v3.2.zip`.
2. In the Siteground File Manager, open `public_html/` (or the site's web root).
3. **Preserve these before touching anything:**
   - `/api/.env` — Zoho CRM credentials. Leave in place; only recreate from `.env.example` if it's missing.
   - `.well-known/` — server-managed (SSL/TLS cert validation). Do not delete.
   - Any other host-managed or unrecognised file not present in the zip — leave untouched unless you've confirmed it's safe to remove.
   - Safest approach: move `/api/.env` aside first, then overwrite/replace only the paths the zip ships, rather than a blanket delete-everything.
4. Extract the zip into the web root (including hidden `.htaccess` and `api/.htaccess`).
5. Only if this is the first deploy, or Zoho credentials changed: copy `/api/.env.example` to `/api/.env`, fill in the Zoho values (same as previous release — ping me if you need them resent), and set permissions to `640`.
6. Purge **all** server cache (Site Tools → Speed → Caching → Purge All). If a CDN sits in front (e.g. Cloudflare), purge that too.
7. If not already set up: block dev/staging subdomains from search indexing (`X-Robots-Tag: noindex`) — one-time setup, skip if already in place.

**Post-deploy verification**
Run from a developer machine:
```
./scripts/verify-deploy.sh https://www.panasatech.com
```
Or manually confirm:
- `https://panasatech.com` → redirects to `https://www.panasatech.com`
- `https://www.panasatech.com/contact.html` → redirects to `/contact`
- `https://www.panasatech.com/privacy-policy/` → redirects to `/privacy-policy`
- Contact form on `/contact` submits without error
- `https://www.panasatech.com/api/.env` → returns 403
- Page source CSS links show `?v=3.2` (root pages) confirming the cache-bust took effect

**If something looks off**
- `/contact` 404s → root `.htaccess` missing, re-extract the zip
- Contact form says "Server configuration missing" → `/api/.env` missing or unreadable
- Site shows old styling → server cache (or CDN) not purged
- Some pages 404, others fine → partial upload, delete and re-extract fresh

Rollback: no DB/schema changes in this release, so if needed, redeploy the previous `panasa-deploy-v3.1.zip` the same way.

Full release notes: see attached `RELEASE_v3.2.md`.

Thanks,
[Your name]
