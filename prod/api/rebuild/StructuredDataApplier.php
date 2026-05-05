<?php
/**
 * Builds and injects per-page Schema.org JSON-LD blocks. Each block lives in its
 * own marker pair so multiple structured-data shapes coexist on the same page.
 *
 * Shapes supported:
 *   - BreadcrumbList — auto-derived from $canonicalUrl path segments
 *   - FAQPage        — built from $structuredData['faq'] = [{question,answer}, ...]
 *   - Article        — built for article-type pages from $structuredData['article']
 *   - Custom raw     — $structuredData['customJsonLd'] (advanced mode)
 *
 * The Organization shape is handled by SiteSeoApplier (site-wide, not per-page).
 *
 * Marker pattern (matches SiteSeoApplier convention):
 *   <!-- panasa:bcr-jsonld:start --> ... <!-- panasa:bcr-jsonld:end -->
 *   <!-- panasa:faq-jsonld:start --> ... <!-- panasa:faq-jsonld:end -->
 *   <!-- panasa:article-jsonld:start --> ... <!-- panasa:article-jsonld:end -->
 *   <!-- panasa:custom-jsonld:start --> ... <!-- panasa:custom-jsonld:end -->
 */
class StructuredDataApplier {

    /**
     * Apply structured-data blocks to $html.
     *
     * @param string $html             Page HTML.
     * @param array  $structuredData   Per-page Schema.org payload (may be empty).
     * @param string $canonicalUrl     Used to derive BreadcrumbList path segments.
     * @return string                  Updated HTML.
     */
    public static function apply(string $html, array $structuredData, string $canonicalUrl = ''): string {
        // BreadcrumbList — auto from URL
        $bcrBlock = $canonicalUrl !== '' ? self::buildBreadcrumbList($canonicalUrl) : '';
        $html = self::upsertMarkerBlock($html, 'bcr-jsonld', $bcrBlock);

        // FAQPage — only if at least one Q&A authored
        $faqBlock = self::buildFaqPage($structuredData['faq'] ?? null);
        $html = self::upsertMarkerBlock($html, 'faq-jsonld', $faqBlock);

        // Article — only when article shape is provided (article-type pages)
        $articleBlock = self::buildArticle($structuredData['article'] ?? null);
        $html = self::upsertMarkerBlock($html, 'article-jsonld', $articleBlock);

        // Custom raw — advanced editors paste arbitrary valid JSON-LD
        $customBlock = self::buildCustomJsonLd($structuredData['customJsonLd'] ?? null);
        $html = self::upsertMarkerBlock($html, 'custom-jsonld', $customBlock);

        return $html;
    }

    // ───────────────────────── BreadcrumbList ─────────────────────────

    /**
     * Auto-derive a BreadcrumbList from a canonical URL.
     * `https://www.panasatech.com/case-studies/osper-family-banking` →
     *   Home > Case Studies > Osper Family Banking
     */
    private static function buildBreadcrumbList(string $canonical): string {
        $parsed = parse_url($canonical);
        if (!is_array($parsed) || empty($parsed['host'])) return '';
        $host = $parsed['host'];
        $scheme = $parsed['scheme'] ?? 'https';
        $base = $scheme . '://' . $host;

        $path = trim($parsed['path'] ?? '/', '/');
        $segments = $path === '' ? [] : explode('/', $path);

        $items = [
            ['name' => 'Home', 'href' => $base . '/'],
        ];
        $accum = $base;
        foreach ($segments as $seg) {
            $accum .= '/' . $seg;
            $items[] = [
                'name' => self::humanise($seg),
                'href' => $accum,
            ];
        }

        $list = [];
        foreach ($items as $i => $item) {
            $list[] = [
                '@type'    => 'ListItem',
                'position' => $i + 1,
                'name'     => $item['name'],
                'item'     => $item['href'],
            ];
        }

        $shape = [
            '@context'        => 'https://schema.org',
            '@type'           => 'BreadcrumbList',
            'itemListElement' => $list,
        ];
        return self::wrapJsonLd($shape, 'data-bcr-jsonld');
    }

    private static function humanise(string $slug): string {
        $words = preg_split('/[-_]+/', $slug);
        return implode(' ', array_map('ucfirst', $words));
    }

    // ───────────────────────── FAQPage ─────────────────────────

    /**
     * @param mixed $faq Array of {question, answer} or null.
     */
    private static function buildFaqPage($faq): string {
        if (!is_array($faq) || empty($faq)) return '';

        $items = [];
        foreach ($faq as $row) {
            $q = trim((string)($row['question'] ?? ''));
            $a = trim((string)($row['answer'] ?? ''));
            if ($q === '' || $a === '') continue;
            $items[] = [
                '@type' => 'Question',
                'name'  => $q,
                'acceptedAnswer' => [
                    '@type' => 'Answer',
                    'text'  => $a,
                ],
            ];
        }
        if (empty($items)) return '';

        $shape = [
            '@context'   => 'https://schema.org',
            '@type'      => 'FAQPage',
            'mainEntity' => $items,
        ];
        return self::wrapJsonLd($shape, 'data-faq-jsonld');
    }

    // ───────────────────────── Article ─────────────────────────

    /**
     * @param mixed $article Article shape or null. Recognised keys: headline,
     *   description, datePublished, dateModified, author (string|array{name}),
     *   image, articleSection, keywords (string|array), mainEntityOfPage.
     */
    private static function buildArticle($article): string {
        if (!is_array($article) || empty($article)) return '';

        $shape = [
            '@context' => 'https://schema.org',
            '@type'    => 'Article',
        ];
        if (!empty($article['headline']))         $shape['headline']      = (string)$article['headline'];
        if (!empty($article['description']))      $shape['description']   = (string)$article['description'];
        if (!empty($article['datePublished']))    $shape['datePublished'] = (string)$article['datePublished'];
        if (!empty($article['dateModified']))     $shape['dateModified']  = (string)$article['dateModified'];
        if (!empty($article['articleSection']))   $shape['articleSection'] = (string)$article['articleSection'];
        if (!empty($article['image']))            $shape['image']         = (string)$article['image'];
        if (!empty($article['mainEntityOfPage'])) $shape['mainEntityOfPage'] = (string)$article['mainEntityOfPage'];
        if (!empty($article['keywords'])) {
            $kw = $article['keywords'];
            $shape['keywords'] = is_array($kw) ? implode(', ', $kw) : (string)$kw;
        }
        if (!empty($article['author'])) {
            $author = $article['author'];
            if (is_string($author)) {
                $shape['author'] = ['@type' => 'Person', 'name' => $author];
            } elseif (is_array($author)) {
                $shape['author'] = [
                    '@type' => $author['@type'] ?? 'Person',
                    'name'  => $author['name'] ?? '',
                ];
            }
        }

        return self::wrapJsonLd($shape, 'data-article-jsonld');
    }

    // ───────────────────────── Custom raw JSON-LD ─────────────────────────

    /**
     * Editor-supplied raw JSON-LD (advanced mode). Validate it parses; otherwise drop.
     */
    private static function buildCustomJsonLd($raw): string {
        if (!is_string($raw)) return '';
        $raw = trim($raw);
        if ($raw === '') return '';

        // Validate it's parseable JSON; otherwise we'd inject broken markup.
        $parsed = json_decode($raw, true);
        if ($parsed === null) return '';

        $pretty = json_encode($parsed, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        $pretty = preg_replace('/^/m', '    ', $pretty);
        return "<script type=\"application/ld+json\" data-custom-jsonld>\n" . $pretty . "\n    </script>";
    }

    // ───────────────────────── Helpers ─────────────────────────

    private static function wrapJsonLd(array $shape, string $marker): string {
        $json = json_encode($shape, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        $json = preg_replace('/^/m', '    ', $json);
        return "<script type=\"application/ld+json\" {$marker}>\n" . $json . "\n    </script>";
    }

    /** Idempotent upsert (same convention as SiteSeoApplier). */
    private static function upsertMarkerBlock(string $html, string $name, string $body): string {
        $startMarker = "<!-- panasa:{$name}:start -->";
        $endMarker   = "<!-- panasa:{$name}:end -->";
        $startQuoted = preg_quote($startMarker, '#');
        $endQuoted   = preg_quote($endMarker,   '#');
        $blockPattern = '#' . $startQuoted . '.*?' . $endQuoted . '#s';

        if (trim($body) === '') {
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

        if (stripos($html, '</head>') !== false) {
            return preg_replace(
                '#</head>#i',
                self::escReplace($newBlock) . "\n  </head>",
                $html, 1
            );
        }
        return $html;
    }

    private static function escReplace(string $text): string {
        return str_replace(['\\', '$'], ['\\\\', '\\$'], $text);
    }
}
