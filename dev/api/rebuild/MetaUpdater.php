<?php
/**
 * Regex-based meta tag updater for static HTML files.
 *
 * Handles the full per-page SEO surface:
 *   - <title>
 *   - meta name="description" / "keywords" / "robots" / "author" / "twitter:*"
 *   - meta property="og:title" / "og:description" / "og:url" / "og:image" / "og:type" / "og:locale"
 *   - link rel="canonical"
 *   - link rel="alternate" hreflang="…" (replaces the whole block)
 *   - JSON-LD top-level "headline" + "description" fields (first script block)
 *
 * Replace-or-insert strategy: each updateXxx() method tries to replace an existing
 * tag's content="…" attribute. If the tag is missing, it inserts a new one near
 * the canonical anchor (the existing meta description tag) so subsequent runs can
 * cleanly replace it.
 */
class MetaUpdater {

    /**
     * Update all meta tags in an HTML string. The $meta array can contain ANY
     * subset of the supported keys; missing keys are no-ops. Existing callers
     * passing only ['title','description'] keep working unchanged.
     *
     * Supported keys:
     *   title, description, keywords (string|array), canonical, robots,
     *   ogImage, ogType, ogUrl, ogLocale, twitterCard, twitterSite,
     *   twitterCreator, hreflang ([{locale,url},...]), author, headline
     *
     * @param string $html  The full HTML file content
     * @param array  $meta  Associative array of SEO meta values
     * @return string       Updated HTML
     */
    public static function update(string $html, array $meta): string {
        $title       = self::esc($meta['title']        ?? '');
        $desc        = self::esc($meta['description']  ?? '');
        $keywords    = self::normalizeKeywords($meta['keywords'] ?? null);
        $canonical   = self::esc($meta['canonical']    ?? '');
        $robots      = self::esc($meta['robots']       ?? '');
        $ogImage     = self::esc($meta['ogImage']      ?? '');
        $ogType      = self::esc($meta['ogType']       ?? '');
        $ogUrl       = self::esc($meta['ogUrl']        ?? '');
        $ogLocale    = self::esc($meta['ogLocale']     ?? '');
        $twitterCard = self::esc($meta['twitterCard']  ?? '');
        $twitterSite = self::esc($meta['twitterSite']  ?? '');
        $twitterCreator = self::esc($meta['twitterCreator'] ?? '');
        $author      = self::esc($meta['author']       ?? '');
        $headline    = self::esc($meta['headline']     ?? '');
        $hreflang    = is_array($meta['hreflang'] ?? null) ? $meta['hreflang'] : null;

        if ($title !== '') {
            $html = self::replaceTitle($html, $title);
            $html = self::replaceMetaContent($html, 'property', 'og:title', $title);
            $html = self::replaceMetaContent($html, 'name',     'twitter:title', $title);
        }

        if ($desc !== '') {
            $html = self::replaceMetaContent($html, 'name',     'description', $desc);
            $html = self::replaceMetaContent($html, 'property', 'og:description', $desc);
            $html = self::replaceMetaContent($html, 'name',     'twitter:description', $desc);
            $html = self::updateJsonLdField($html, 'description', $desc);
        }

        if ($keywords !== null) {
            $html = self::insertOrReplaceMeta($html, 'name', 'keywords', $keywords);
        }

        if ($canonical !== '') {
            $html = self::replaceCanonical($html, $canonical);
            // og:url and twitter url should match the canonical
            $html = self::insertOrReplaceMeta($html, 'property', 'og:url', $canonical);
        } elseif ($ogUrl !== '') {
            $html = self::insertOrReplaceMeta($html, 'property', 'og:url', $ogUrl);
        }

        if ($robots !== '') {
            $html = self::insertOrReplaceMeta($html, 'name', 'robots', $robots);
        }

        if ($ogImage !== '') {
            $html = self::insertOrReplaceMeta($html, 'property', 'og:image', $ogImage);
            $html = self::insertOrReplaceMeta($html, 'name',     'twitter:image', $ogImage);
        }
        if ($ogType !== '') {
            $html = self::insertOrReplaceMeta($html, 'property', 'og:type', $ogType);
        }
        if ($ogLocale !== '') {
            $html = self::insertOrReplaceMeta($html, 'property', 'og:locale', $ogLocale);
        }
        if ($twitterCard !== '') {
            $html = self::insertOrReplaceMeta($html, 'name', 'twitter:card', $twitterCard);
        }
        if ($twitterSite !== '') {
            $html = self::insertOrReplaceMeta($html, 'name', 'twitter:site', $twitterSite);
        }
        if ($twitterCreator !== '') {
            $html = self::insertOrReplaceMeta($html, 'name', 'twitter:creator', $twitterCreator);
        }
        if ($author !== '') {
            $html = self::insertOrReplaceMeta($html, 'name', 'author', $author);
        }

        if ($headline !== '') {
            $html = self::updateJsonLdField($html, 'headline', $headline);
        }

        if ($hreflang !== null) {
            $html = self::replaceHreflangBlock($html, $hreflang);
        }

        return $html;
    }

    // ───────────────────────── Title + description ─────────────────────────

    private static function replaceTitle(string $html, string $title): string {
        return preg_replace(
            '#(<title>)(.*?)(</title>)#s',
            '${1}' . self::escReplace($title) . '${3}',
            $html, 1
        );
    }

    /**
     * Build both supported attribute-order patterns for a given meta tag so
     * existence-checking and replacement always agree on what "found" means.
     */
    private static function metaTagPatterns(string $attrType, string $attrValue): array {
        $escapedAttrValue = preg_quote($attrValue, '#');
        $escapedAttrType  = preg_quote($attrType,  '#');
        return [
            // Order 1: name/property first, then content
            '#(<meta\s+' . $escapedAttrType . '="' . $escapedAttrValue . '"\s+content=")([^"]*)(")#i',
            // Order 2: content first, then name/property
            '#(<meta\s+content=")([^"]*)("\s+' . $escapedAttrType . '="' . $escapedAttrValue . '")#i',
        ];
    }

    /** True if a <meta> tag with this name/property already exists, regardless of its current value. */
    private static function metaExists(string $html, string $attrType, string $attrValue): bool {
        foreach (self::metaTagPatterns($attrType, $attrValue) as $pattern) {
            if (preg_match($pattern, $html)) return true;
        }
        return false;
    }

    /**
     * Replace the content="…" attribute in a <meta> tag. Returns $html unchanged
     * if the tag does not exist (use insertOrReplaceMeta to also insert).
     */
    private static function replaceMetaContent(string $html, string $attrType, string $attrValue, string $newContent): string {
        [$pattern1, $pattern2] = self::metaTagPatterns($attrType, $attrValue);

        if (preg_match($pattern1, $html)) {
            return preg_replace($pattern1, '${1}' . self::escReplace($newContent) . '${3}', $html, 1);
        }
        if (preg_match($pattern2, $html)) {
            return preg_replace($pattern2, '${1}' . self::escReplace($newContent) . '${3}', $html, 1);
        }

        return $html;
    }

    /**
     * Replace the content="…" attribute, OR insert a new <meta> tag right after
     * the existing <meta name="description"> tag if the target doesn't exist.
     * Used for tags that may not be present in the legacy static HTML.
     *
     * Existence is checked directly via metaExists() rather than by comparing
     * replaceMetaContent()'s output to the input — comparing strings conflates
     * "tag not found" with "tag found but the value happens to be unchanged",
     * which caused a duplicate tag to be inserted on every rebuild whenever a
     * field (e.g. robots, twitter:card) stayed the same between publishes.
     */
    private static function insertOrReplaceMeta(string $html, string $attrType, string $attrValue, string $newContent): string {
        if (self::metaExists($html, $attrType, $attrValue)) {
            return self::replaceMetaContent($html, $attrType, $attrValue, $newContent);
        }

        // Not present — insert after <meta name="description" content="…" />
        $newTag = sprintf(
            '<meta %s="%s" content="%s" />',
            $attrType, $attrValue, $newContent
        );
        $anchorPattern = '#(<meta\s+name="description"\s+content="[^"]*"\s*/?>)#i';
        if (preg_match($anchorPattern, $html)) {
            return preg_replace(
                $anchorPattern,
                '${1}' . "\n    " . self::escReplace($newTag),
                $html, 1
            );
        }

        // No description anchor — fall back to inserting before </head>
        if (stripos($html, '</head>') !== false) {
            return preg_replace(
                '#</head>#i',
                '    ' . self::escReplace($newTag) . "\n  </head>",
                $html, 1
            );
        }

        return $html;
    }

    // ───────────────────────── Canonical link ─────────────────────────

    private static function replaceCanonical(string $html, string $url): string {
        $pattern = '#(<link\s+rel="canonical"\s+href=")([^"]*)(")#i';
        if (preg_match($pattern, $html)) {
            return preg_replace($pattern, '${1}' . self::escReplace($url) . '${3}', $html, 1);
        }
        // Insert before </head>
        $newTag = '<link rel="canonical" href="' . $url . '" />';
        if (stripos($html, '</head>') !== false) {
            return preg_replace(
                '#</head>#i',
                '    ' . self::escReplace($newTag) . "\n  </head>",
                $html, 1
            );
        }
        return $html;
    }

    // ───────────────────────── Hreflang block ─────────────────────────

    /**
     * Replace the contiguous block of <link rel="alternate" hreflang="…">
     * tags with a fresh set built from $hreflang ([{locale, url}, ...]). If
     * the block doesn't exist, insert after the canonical link.
     */
    private static function replaceHreflangBlock(string $html, array $hreflang): string {
        $newBlock = '';
        foreach ($hreflang as $entry) {
            $loc = self::esc((string)($entry['locale'] ?? ''));
            $url = self::esc((string)($entry['url'] ?? ''));
            if ($loc === '' || $url === '') continue;
            $newBlock .= sprintf('    <link rel="alternate" hreflang="%s" href="%s" />' . "\n", $loc, $url);
        }
        $newBlock = rtrim($newBlock, "\n");

        // Existing block: one or more consecutive hreflang links separated only by whitespace
        $blockPattern = '#(\s*<link\s+rel="alternate"\s+hreflang="[^"]*"\s+href="[^"]*"\s*/?>)+#i';
        if (preg_match($blockPattern, $html)) {
            return preg_replace($blockPattern, "\n" . self::escReplace($newBlock), $html, 1);
        }

        // No block — insert after canonical
        $canonicalPattern = '#(<link\s+rel="canonical"\s+href="[^"]*"\s*/?>)#i';
        if ($newBlock !== '' && preg_match($canonicalPattern, $html)) {
            return preg_replace(
                $canonicalPattern,
                '${1}' . "\n" . self::escReplace($newBlock),
                $html, 1
            );
        }
        return $html;
    }

    // ───────────────────────── JSON-LD field updater ─────────────────────────

    /**
     * Update a top-level field inside the FIRST JSON-LD <script> block.
     * Used for "description" and "headline".
     */
    private static function updateJsonLdField(string $html, string $field, string $value): string {
        $pattern = '#(<script\s+type="application/ld\+json"[^>]*>\s*)(.*?)(</script>)#s';

        if (!preg_match($pattern, $html, $match)) {
            return $html;
        }

        $jsonStr = $match[2];
        $jsonData = json_decode($jsonStr, true);

        if ($jsonData === null) {
            return $html;
        }

        if (isset($jsonData[$field])) {
            $jsonData[$field] = html_entity_decode($value, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        } else {
            // Don't insert into a JSON-LD block that doesn't already declare the field
            // (some pages have BreadcrumbList JSON-LD which doesn't take "headline").
            return $html;
        }

        $newJson = json_encode($jsonData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        $newJson = preg_replace('/^/m', '    ', $newJson);

        // rtrim the captured opening-tag-plus-whitespace before re-adding a
        // single normalized newline+indent — without this, the \s* in
        // $pattern re-captures whatever blank lines a PREVIOUS rebuild left
        // behind and this concatenation adds yet another on top, so the gap
        // grows by one line on every republish.
        return preg_replace(
            $pattern,
            rtrim($match[1]) . "\n    " . $newJson . "\n    " . $match[3],
            $html, 1
        );
    }

    // ───────────────────────── Helpers ─────────────────────────

    /** Coerce keywords to a comma-joined string. Accepts string OR array. Returns null on empty. */
    private static function normalizeKeywords($keywords): ?string {
        if ($keywords === null) return null;
        if (is_array($keywords)) {
            $list = array_filter(array_map(fn($k) => trim((string)$k), $keywords), fn($k) => $k !== '');
            if (empty($list)) return '';
            return self::esc(implode(', ', $list));
        }
        $s = trim((string)$keywords);
        return self::esc($s);
    }

    /** HTML-escape a string for use in attribute values and text content. */
    private static function esc(string $text): string {
        return htmlspecialchars($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    }

    /** Escape $ and \ in replacement strings for preg_replace. */
    private static function escReplace(string $text): string {
        return str_replace(['\\', '$'], ['\\\\', '\\$'], $text);
    }
}
