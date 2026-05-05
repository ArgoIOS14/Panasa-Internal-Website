<?php
/**
 * Applies SITE-WIDE SEO settings to a static HTML page.
 *
 * Runs FIRST in the rebuild chain (before per-page MetaUpdater) so that:
 *   - Site-wide defaults (default OG image, Twitter site handle, og:locale) are
 *     applied as fallbacks. Per-page overrides come later via MetaUpdater.
 *   - Search Engine verification tags + analytics scripts (GA4 / GTM / Plausible /
 *     Fathom) are upserted into <head> via marker-bracketed blocks so reruns
 *     are idempotent and clean removal is just an empty re-write.
 *
 * Reads the site SEO node (typically `pages/siteSEO`) — passed in as an
 * associative array — and mutates the HTML accordingly.
 *
 * Marker pattern:
 *   <!-- panasa:site-seo:start --> ... <!-- panasa:site-seo:end -->
 * Each managed block lives between its own marker pair so different concerns
 * (verification, analytics, organization json-ld) don't step on each other.
 */
class SiteSeoApplier {

    /**
     * Apply $siteSEO defaults to $html. Returns the new HTML.
     * Keys consumed (all optional):
     *   defaultOgImage      → fallback for og:image / twitter:image
     *   defaultOgLocale     → og:locale
     *   defaultTwitterCard  → twitter:card
     *   twitterSite         → twitter:site
     *   twitterCreator      → twitter:creator
     *   googleSearchConsole → <meta name="google-site-verification">
     *   bingWebmaster       → <meta name="msvalidate.01">
     *   yandex              → <meta name="yandex-verification">
     *   pinterest           → <meta name="p:domain_verify">
     *   ga4Id               → Google Analytics 4 measurement ID
     *   gtmId               → Google Tag Manager ID
     *   plausibleDomain     → Plausible domain
     *   fathomSiteId        → Fathom site ID
     *   organization        → JSON-LD Organization shape (see buildOrgJsonLd)
     */
    public static function apply(string $html, array $siteSEO): string {
        // Don't early-return on empty $siteSEO. If the editor cleared every
        // setting AND the page already has marker blocks from a previous run,
        // we need to remove them — pass an empty array down so each upsertMarkerBlock
        // call drops the existing block. The applyDefaults call is a no-op
        // when $siteSEO is empty (build payload is empty).
        $siteSEO = is_array($siteSEO) ? $siteSEO : [];

        // Site-wide defaults — only applied where the page doesn't already have a value.
        // These use insertOrReplace; per-page MetaUpdater::update() runs AFTER this and
        // will overwrite anything the page wants to override.
        $html = self::applyDefaults($html, $siteSEO);

        // Verification + analytics + organization json-ld go in their own marker blocks.
        // Empty body → upsertMarkerBlock removes the block (idempotent clearing).
        $html = self::upsertMarkerBlock($html, 'verification', self::buildVerificationBlock($siteSEO));
        $html = self::upsertMarkerBlock($html, 'analytics',    self::buildAnalyticsBlock($siteSEO));
        $html = self::upsertMarkerBlock($html, 'org-json-ld',  self::buildOrgJsonLd($siteSEO));

        return $html;
    }

    // ───────────────────────── Defaults ─────────────────────────

    private static function applyDefaults(string $html, array $s): string {
        require_once __DIR__ . '/MetaUpdater.php';

        // Build a meta payload of ONLY the keys MetaUpdater understands as fallbacks.
        // We rely on MetaUpdater's insertOrReplaceMeta semantics (replace-or-insert).
        // The per-page meta runs after this and will overwrite when the page sets values.
        $defaultMeta = [];
        if (!empty($s['defaultOgImage']))     $defaultMeta['ogImage']        = $s['defaultOgImage'];
        if (!empty($s['defaultOgLocale']))    $defaultMeta['ogLocale']       = $s['defaultOgLocale'];
        if (!empty($s['defaultTwitterCard']))  $defaultMeta['twitterCard']    = $s['defaultTwitterCard'];
        if (!empty($s['twitterSite']))         $defaultMeta['twitterSite']    = $s['twitterSite'];
        if (!empty($s['twitterCreator']))      $defaultMeta['twitterCreator'] = $s['twitterCreator'];
        if (empty($defaultMeta)) return $html;
        return MetaUpdater::update($html, $defaultMeta);
    }

    // ───────────────────────── Verification ─────────────────────────

    private static function buildVerificationBlock(array $s): string {
        $tags = [];
        if (!empty($s['googleSearchConsole'])) {
            $tags[] = sprintf('<meta name="google-site-verification" content="%s" />', self::esc($s['googleSearchConsole']));
        }
        if (!empty($s['bingWebmaster'])) {
            $tags[] = sprintf('<meta name="msvalidate.01" content="%s" />', self::esc($s['bingWebmaster']));
        }
        if (!empty($s['yandex'])) {
            $tags[] = sprintf('<meta name="yandex-verification" content="%s" />', self::esc($s['yandex']));
        }
        if (!empty($s['pinterest'])) {
            $tags[] = sprintf('<meta name="p:domain_verify" content="%s" />', self::esc($s['pinterest']));
        }
        if (empty($tags)) return '';
        return implode("\n    ", $tags);
    }

    // ───────────────────────── Analytics ─────────────────────────

    private static function buildAnalyticsBlock(array $s): string {
        $blocks = [];

        if (!empty($s['gtmId'])) {
            $gtm = self::esc($s['gtmId']);
            $blocks[] = <<<HTML
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','{$gtm}');</script>
HTML;
        }

        if (!empty($s['ga4Id'])) {
            $ga = self::esc($s['ga4Id']);
            $blocks[] = <<<HTML
<script async src="https://www.googletagmanager.com/gtag/js?id={$ga}"></script>
    <script>window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', '{$ga}');</script>
HTML;
        }

        if (!empty($s['plausibleDomain'])) {
            $domain = self::esc($s['plausibleDomain']);
            $blocks[] = sprintf('<script defer data-domain="%s" src="https://plausible.io/js/script.js"></script>', $domain);
        }

        if (!empty($s['fathomSiteId'])) {
            $fid = self::esc($s['fathomSiteId']);
            $blocks[] = sprintf('<script src="https://cdn.usefathom.com/script.js" data-site="%s" defer></script>', $fid);
        }

        if (empty($blocks)) return '';
        return implode("\n    ", $blocks);
    }

    // ───────────────────────── Organization JSON-LD ─────────────────────────

    private static function buildOrgJsonLd(array $s): string {
        if (empty($s['organization']) || !is_array($s['organization'])) return '';
        $org = $s['organization'];

        $shape = [
            '@context' => 'https://schema.org',
            '@type'    => 'Organization',
        ];
        if (!empty($org['orgName']))        $shape['name']        = $org['orgName'];
        if (!empty($org['orgUrl']))         $shape['url']         = $org['orgUrl'];
        if (!empty($org['orgLogo']))        $shape['logo']        = $org['orgLogo'];
        if (!empty($org['orgDescription'])) $shape['description'] = $org['orgDescription'];
        if (!empty($org['orgFounded']))     $shape['foundingDate'] = (string)$org['orgFounded'];
        if (!empty($org['orgEmail']))       $shape['email']       = $org['orgEmail'];
        if (!empty($org['orgPhones']) && is_array($org['orgPhones'])) {
            $phones = array_values(array_filter($org['orgPhones'], fn($p) => !empty($p)));
            if (count($phones) === 1) {
                $shape['telephone'] = $phones[0];
            } elseif (count($phones) > 1) {
                $shape['contactPoint'] = array_map(fn($p) => [
                    '@type' => 'ContactPoint',
                    'telephone' => $p,
                    'contactType' => 'customer service',
                ], $phones);
            }
        }
        if (!empty($org['orgAddress']) && is_array($org['orgAddress'])) {
            $addr = $org['orgAddress'];
            $shape['address'] = array_filter([
                '@type' => 'PostalAddress',
                'streetAddress'   => $addr['street']   ?? null,
                'addressLocality' => $addr['city']     ?? null,
                'addressRegion'   => $addr['region']   ?? null,
                'postalCode'      => $addr['postal']   ?? null,
                'addressCountry'  => $addr['country']  ?? null,
            ], fn($v) => $v !== null && $v !== '');
        }
        if (!empty($org['orgSameAs']) && is_array($org['orgSameAs'])) {
            $sameAs = array_values(array_filter($org['orgSameAs'], fn($u) => !empty($u)));
            if (!empty($sameAs)) $shape['sameAs'] = $sameAs;
        }

        $json = json_encode($shape, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        $json = preg_replace('/^/m', '    ', $json);

        return "<script type=\"application/ld+json\" data-org-jsonld>\n" . $json . "\n    </script>";
    }

    // ───────────────────────── Marker block upsert ─────────────────────────

    /**
     * Idempotent upsert of a marker-bracketed block in <head>. Empty $body removes the block.
     */
    private static function upsertMarkerBlock(string $html, string $name, string $body): string {
        $startMarker = "<!-- panasa:{$name}:start -->";
        $endMarker   = "<!-- panasa:{$name}:end -->";
        $startQuoted = preg_quote($startMarker, '#');
        $endQuoted   = preg_quote($endMarker,   '#');
        $blockPattern = '#' . $startQuoted . '.*?' . $endQuoted . '#s';

        if (trim($body) === '') {
            // Remove existing block + collapse the surrounding blank line if any.
            // Build the removal regex from the quoted markers directly — re-using
            // $blockPattern would nest the # delimiters and PCRE rejects that.
            $without = preg_replace(
                '#\n?\s*' . $startQuoted . '.*?' . $endQuoted . '\n?#s',
                "\n",
                $html
            );
            return $without ?? $html;
        }

        $newBlock = "    {$startMarker}\n    {$body}\n    {$endMarker}";

        if (preg_match($blockPattern, $html)) {
            return preg_replace($blockPattern, self::escReplace(trim($newBlock)), $html, 1);
        }

        // Insert before </head>
        if (stripos($html, '</head>') !== false) {
            return preg_replace(
                '#</head>#i',
                self::escReplace($newBlock) . "\n  </head>",
                $html, 1
            );
        }
        return $html;
    }

    private static function esc(string $text): string {
        return htmlspecialchars($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    }

    private static function escReplace(string $text): string {
        return str_replace(['\\', '$'], ['\\\\', '\\$'], $text);
    }
}
