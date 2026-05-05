<?php
/**
 * Article rebuild — generates per-article static HTML, JSON sidecar, default.js,
 * articles-index.json, and sitemap.xml from a JSON payload.
 */
class ArticleRebuilder {

    public static function tagClassFor(string $type): string {
        if ($type === 'blog') return 'resource-tag-blog';
        if ($type === 'insights') return 'resource-tag-insights';
        if ($type === 'case-studies') return 'resource-tag-case-study';
        return 'resource-tag-guide';
    }

    public static function categoryPlural(string $type): string {
        if ($type === 'blog') return 'Blogs';
        if ($type === 'insights') return 'Insights';
        if ($type === 'case-studies') return 'Case Studies';
        return 'Guides';
    }

    public static function categoryLabel(string $type): string {
        if ($type === 'blog') return 'Blog';
        if ($type === 'insights') return 'Insights';
        if ($type === 'case-studies') return 'Case Study';
        return 'Guide';
    }

    public static function defaultTagText(string $type): string {
        if ($type === 'blog') return 'BLOG';
        if ($type === 'insights') return 'INSIGHTS';
        if ($type === 'case-studies') return 'CASE STUDY';
        return 'GUIDE';
    }

    /**
     * Render an HTML template by replacing {{TOKEN}} placeholders.
     */
    public static function renderTemplate(string $template, array $data, string $type, string $slug): string {
        // Case studies put the human title under hero.title; fall back to top-level title for blog/insights/guides.
        $title = $data['title'] ?? ($data['hero']['title'] ?? '(untitled)');
        if ($type === 'case-studies' && !empty($data['hero']['title'])) {
            $accent = trim((string)($data['hero']['titleAccent'] ?? ''));
            $title = trim($data['hero']['title'] . ($accent !== '' ? ' ' . $accent : ''));
        }
        $description = $data['meta']['description'] ?? ($data['description'] ?? '');
        $canonicalBase = 'https://www.panasatech.com';
        if ($type === 'blog') $folder = 'blog';
        elseif ($type === 'insights') $folder = 'insights';
        elseif ($type === 'case-studies') $folder = 'case-studies';
        else $folder = 'guides';
        $canonical = $data['meta']['canonical'] ?? "{$canonicalBase}/{$folder}/{$slug}";
        $ogImage = $data['meta']['ogImage'] ?? '';
        if (empty($ogImage)) {
            $hero = $data['heroImage'] ?? '';
            if ($hero) {
                if (str_starts_with($hero, 'http')) $ogImage = $hero;
                elseif (str_starts_with($hero, '../')) $ogImage = $canonicalBase . '/' . substr($hero, 3);
                else $ogImage = $canonicalBase . '/' . ltrim($hero, '/');
            }
        }
        $heroImage = $data['heroImage'] ?? '';
        $heroAlt   = $data['heroImageAlt'] ?? '';
        $author    = $data['author'] ?? 'Panasa Team';
        $datePub   = $data['datePublished'] ?? date('Y-m-d');
        $dateMod   = $data['dateModified'] ?? $datePub;
        $dateDisp  = $data['date'] ?? $datePub;
        $readTime  = $data['readTime'] ?? '5 MINS READ';
        $tagText   = $data['tag'] ?? self::defaultTagText($type);
        $tagClass  = self::tagClassFor($type);
        $category  = $data['category'] ?? self::categoryLabel($type);
        $categoryPlural = self::categoryPlural($type);
        $tags      = is_array($data['tags'] ?? null) ? $data['tags'] : [];
        $tagsCsv   = implode(', ', array_map('strval', $tags));
        $tagsMeta  = '';
        foreach ($tags as $t) {
            $tagsMeta .= '<meta property="article:tag" content="' . htmlspecialchars((string)$t, ENT_QUOTES) . '" />' . "\n    ";
        }
        $jsFolder = $type === 'blog' ? 'Blog'
                  : ($type === 'insights' ? 'Insights'
                  : ($type === 'case-studies' ? 'Case Studies' : 'Guide'));
        $jsFile = "content/{$jsFolder}/{$slug}.default.js";
        $titleHighlightHtml = '';
        if ($type === 'guides' && !empty($data['titleHighlight'])) {
            $highlight = $data['titleHighlight'];
            $titleHighlightHtml = ' <span class="guide-hero-title-accent" data-guide-title-accent>' . htmlspecialchars($highlight, ENT_QUOTES) . '</span>';
            // Strip the highlight phrase from the title in display so it doesn't duplicate
            $title = trim(preg_replace('/' . preg_quote($highlight, '/') . '\s*$/u', '', $title));
        }

        $tokens = [
            '{{TITLE}}'              => htmlspecialchars($title, ENT_QUOTES),
            '{{TITLE_JSON}}'         => self::jsonEsc($title),
            '{{DESCRIPTION}}'        => htmlspecialchars($description, ENT_QUOTES),
            '{{DESCRIPTION_JSON}}'   => self::jsonEsc($description),
            '{{AUTHOR}}'             => htmlspecialchars($author, ENT_QUOTES),
            '{{AUTHOR_JSON}}'        => self::jsonEsc($author),
            '{{CANONICAL}}'          => htmlspecialchars($canonical, ENT_QUOTES),
            '{{OG_IMAGE}}'           => htmlspecialchars($ogImage, ENT_QUOTES),
            '{{HERO_IMAGE}}'         => htmlspecialchars($heroImage, ENT_QUOTES),
            '{{HERO_IMAGE_ALT}}'     => htmlspecialchars($heroAlt, ENT_QUOTES),
            '{{DATE_PUBLISHED}}'     => htmlspecialchars($datePub, ENT_QUOTES),
            '{{DATE_MODIFIED}}'      => htmlspecialchars($dateMod, ENT_QUOTES),
            '{{DATE_DISPLAY}}'       => htmlspecialchars($dateDisp, ENT_QUOTES),
            '{{READ_TIME}}'          => htmlspecialchars($readTime, ENT_QUOTES),
            '{{TAG_TEXT}}'           => htmlspecialchars($tagText, ENT_QUOTES),
            '{{TAG_CLASS}}'          => htmlspecialchars($tagClass, ENT_QUOTES),
            '{{CATEGORY}}'           => htmlspecialchars($category, ENT_QUOTES),
            '{{CATEGORY_PLURAL}}'    => htmlspecialchars($categoryPlural, ENT_QUOTES),
            '{{TAGS_CSV}}'           => htmlspecialchars($tagsCsv, ENT_QUOTES),
            '{{TAGS_CSV_JSON}}'      => self::jsonEsc($tagsCsv),
            '{{TAGS_META}}'          => trim($tagsMeta),
            '{{SLUG}}'               => htmlspecialchars($slug, ENT_QUOTES),
            '{{JS_FILE}}'            => htmlspecialchars($jsFile, ENT_QUOTES),
            '{{TITLE_HIGHLIGHT_HTML}}' => $titleHighlightHtml,
        ];
        return strtr($template, $tokens);
    }

    private static function jsonEsc(string $s): string {
        return trim(json_encode($s, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), '"');
    }

    /**
     * Glob article JSONs in dev/content/{Blog,Insights,Guide,Case Studies} and rebuild
     * dev/content/Resources/articles-index.json (and prod mirror).
     */
    public static function rebuildArticlesIndex(string $devDir, ?string $prodDir): void {
        $folders = [
            'blog' => 'Blog',
            'insights' => 'Insights',
            'guides' => 'Guide',
            'case-studies' => 'Case Studies',
        ];
        $urlPrefixes = [
            'blog' => 'blog',
            'insights' => 'insights',
            'guides' => 'guides',
            'case-studies' => 'case-studies',
        ];
        $items = [];
        foreach ($folders as $type => $folder) {
            $glob = glob($devDir . "/content/{$folder}/*.json");
            if (!$glob) continue;
            foreach ($glob as $f) {
                $j = @json_decode((string)@file_get_contents($f), true);
                if (!$j || empty($j['slug'])) continue;
                $folderUrl = $urlPrefixes[$type];
                // Case studies put the user-facing title under hero.title; merge with titleAccent.
                if ($type === 'case-studies') {
                    $title = trim(($j['hero']['title'] ?? '') . ' ' . ($j['hero']['titleAccent'] ?? ''));
                    if ($title === '') $title = $j['title'] ?? '';
                } else {
                    $title = $j['title'] ?? '';
                }
                // Image source preference: explicit heroImage (blog/guide), else meta.ogImage (case studies).
                $image = '';
                if (!empty($j['heroImage'])) {
                    $image = str_replace('../', '', $j['heroImage']);
                } elseif (!empty($j['meta']['ogImage'])) {
                    $og = $j['meta']['ogImage'];
                    if (str_starts_with($og, 'https://www.panasatech.com/')) {
                        $image = substr($og, strlen('https://www.panasatech.com/'));
                    } elseif (!str_starts_with($og, 'http')) {
                        $image = ltrim($og, '/');
                    }
                }
                /* Capture sitemap-relevant meta so rebuildSitemap can honour per-page
                   includeInSitemap toggles + priority/changefreq overrides without
                   re-reading every article's full JSON. */
                $metaIn = is_array($j['meta'] ?? null) ? $j['meta'] : [];
                $items[] = [
                    'category' => $j['category'] ?? self::categoryLabel($type),
                    'title'    => $title,
                    'excerpt'  => $j['meta']['description'] ?? ($j['description'] ?? ''),
                    'date'     => $j['date'] ?? '',
                    'datePublished' => $j['datePublished'] ?? '',
                    'author'   => $j['author'] ?? '',
                    'image'    => $image,
                    'slug'     => $j['slug'],
                    'href'     => "{$folderUrl}/{$j['slug']}",
                    'sitemap'  => [
                        'includeInSitemap'  => array_key_exists('includeInSitemap', $metaIn) ? (bool)$metaIn['includeInSitemap'] : true,
                        'sitemapPriority'   => trim((string)($metaIn['sitemapPriority'] ?? '')),
                        'sitemapChangefreq' => trim((string)($metaIn['sitemapChangefreq'] ?? '')),
                    ],
                ];
            }
        }
        // Sort newest first by datePublished (fall back to display date)
        usort($items, function ($a, $b) {
            $av = $a['datePublished'] ?: $a['date'] ?: '';
            $bv = $b['datePublished'] ?: $b['date'] ?: '';
            return strcmp((string)$bv, (string)$av);
        });
        $payload = ['items' => $items, 'updatedAt' => date('c')];
        $json = json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        $devTarget = $devDir . '/content/Resources/articles-index.json';
        @mkdir(dirname($devTarget), 0755, true);
        file_put_contents($devTarget, $json, LOCK_EX);
        if ($prodDir) {
            $prodTarget = $prodDir . '/content/Resources/articles-index.json';
            @mkdir(dirname($prodTarget), 0755, true);
            file_put_contents($prodTarget, $json, LOCK_EX);
        }
    }

    /**
     * Rebuild dev/sitemap.xml + prod/sitemap.xml with static URLs + all article URLs.
     *
     * Honours per-article overrides captured in articles-index.json's `sitemap`
     * sub-object (includeInSitemap / sitemapPriority / sitemapChangefreq).
     *
     * @param string      $devDir
     * @param string|null $prodDir
     * @param array       $extras  Extra URLs from Site SEO. Each entry:
     *                              ['loc' => 'https://…', 'lastmod' => 'YYYY-MM-DD',
     *                               'priority' => '0.7', 'changefreq' => 'monthly']
     */
    public static function rebuildSitemap(string $devDir, ?string $prodDir, array $extras = []): void {
        $base = 'https://www.panasatech.com';
        // Static pages with their per-page priority (changefreq only on /resources).
        $static = [
            ['/',                                       '1.0', null],
            ['/about',                                  '0.8', null],
            ['/contact',                                '0.8', null],
            ['/careers',                                '0.7', null],
            ['/services',                               '0.9', null],
            ['/ai-accelerated-fintech-engineering',     '0.9', null],
            ['/ai-governance',                          '0.9', null],
            ['/intelligent-operations',                 '0.9', null],
            ['/ai-powered-legacy-modernisation',        '0.9', null],
            ['/privacy-policy',                         '0.4', null],
            ['/resources',                              '0.8', 'weekly'],
        ];
        $idxPath = $devDir . '/content/Resources/articles-index.json';
        $articles = [];
        if (file_exists($idxPath)) {
            $idx = @json_decode((string)file_get_contents($idxPath), true) ?: [];
            $articles = $idx['items'] ?? [];
        }
        // Article href prefix → priority. Case studies and guides get 0.8; blog/insights 0.7.
        $articlePriority = function (string $href): string {
            if (str_starts_with($href, 'case-studies/')) return '0.8';
            if (str_starts_with($href, 'guides/'))       return '0.8';
            return '0.7';
        };
        $today = date('Y-m-d');
        $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
        foreach ($static as [$path, $priority, $changefreq]) {
            $xml .= "  <url>\n";
            $xml .= "    <loc>{$base}{$path}</loc>\n";
            $xml .= "    <lastmod>{$today}</lastmod>\n";
            $xml .= "    <priority>{$priority}</priority>\n";
            if ($changefreq) $xml .= "    <changefreq>{$changefreq}</changefreq>\n";
            $xml .= "  </url>\n";
        }
        foreach ($articles as $a) {
            $href = $a['href'] ?? '';
            if (!$href) continue;
            // Honour per-article sitemap settings authored via the admin meta section.
            $sitemap = is_array($a['sitemap'] ?? null) ? $a['sitemap'] : [];
            if (array_key_exists('includeInSitemap', $sitemap) && $sitemap['includeInSitemap'] === false) {
                continue; // editor opted out of sitemap inclusion for this article
            }
            $lastmod    = $a['datePublished'] ?: $today;
            $priority   = !empty($sitemap['sitemapPriority']) ? $sitemap['sitemapPriority'] : $articlePriority($href);
            $changefreq = !empty($sitemap['sitemapChangefreq']) ? $sitemap['sitemapChangefreq'] : 'monthly';
            $xml .= "  <url>\n";
            $xml .= "    <loc>{$base}/{$href}</loc>\n";
            $xml .= "    <lastmod>" . htmlspecialchars($lastmod, ENT_XML1) . "</lastmod>\n";
            $xml .= "    <priority>" . htmlspecialchars($priority, ENT_XML1) . "</priority>\n";
            $xml .= "    <changefreq>" . htmlspecialchars($changefreq, ENT_XML1) . "</changefreq>\n";
            $xml .= "  </url>\n";
        }
        // Editor-managed extras from Site SEO (out-of-band URLs, e.g. subdomain pages).
        foreach ($extras as $extra) {
            $loc = trim((string)($extra['loc'] ?? ''));
            if ($loc === '') continue;
            $lastmod    = trim((string)($extra['lastmod'] ?? '')) ?: $today;
            $priority   = trim((string)($extra['priority'] ?? '')) ?: '0.5';
            $changefreq = trim((string)($extra['changefreq'] ?? '')) ?: 'monthly';
            $xml .= "  <url>\n";
            $xml .= "    <loc>" . htmlspecialchars($loc, ENT_XML1) . "</loc>\n";
            $xml .= "    <lastmod>" . htmlspecialchars($lastmod, ENT_XML1) . "</lastmod>\n";
            $xml .= "    <priority>" . htmlspecialchars($priority, ENT_XML1) . "</priority>\n";
            $xml .= "    <changefreq>" . htmlspecialchars($changefreq, ENT_XML1) . "</changefreq>\n";
            $xml .= "  </url>\n";
        }
        $xml .= '</urlset>';
        file_put_contents($devDir . '/sitemap.xml', $xml, LOCK_EX);
        if ($prodDir) file_put_contents($prodDir . '/sitemap.xml', $xml, LOCK_EX);
    }
}
