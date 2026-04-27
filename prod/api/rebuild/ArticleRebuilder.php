<?php
/**
 * Article rebuild — generates per-article static HTML, JSON sidecar, default.js,
 * articles-index.json, and sitemap.xml from a JSON payload.
 */
class ArticleRebuilder {

    public static function tagClassFor(string $type): string {
        return $type === 'blog' ? 'resource-tag-blog'
             : ($type === 'insights' ? 'resource-tag-insights'
                : 'resource-tag-guide');
    }

    public static function categoryPlural(string $type): string {
        return $type === 'blog' ? 'Blogs'
             : ($type === 'insights' ? 'Insights' : 'Guides');
    }

    public static function categoryLabel(string $type): string {
        return $type === 'blog' ? 'Blog'
             : ($type === 'insights' ? 'Insights' : 'Guide');
    }

    public static function defaultTagText(string $type): string {
        return $type === 'blog' ? 'BLOG'
             : ($type === 'insights' ? 'INSIGHTS' : 'GUIDE');
    }

    /**
     * Render an HTML template by replacing {{TOKEN}} placeholders.
     */
    public static function renderTemplate(string $template, array $data, string $type, string $slug): string {
        $title = $data['title'] ?? '(untitled)';
        $description = $data['meta']['description'] ?? ($data['description'] ?? '');
        $canonicalBase = 'https://www.panasatech.com';
        $folder = $type === 'blog' ? 'blog' : ($type === 'insights' ? 'insights' : 'guides');
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
        $jsFile = "content/" . ($type === 'blog' ? 'Blog' : ($type === 'insights' ? 'Insights' : 'Guide')) . "/{$slug}.default.js";
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
     * Glob article JSONs in dev/content/{Blog,Insights,Guide} and rebuild
     * dev/content/Resources/articles-index.json (and prod mirror).
     */
    public static function rebuildArticlesIndex(string $devDir, ?string $prodDir): void {
        $folders = ['blog' => 'Blog', 'insights' => 'Insights', 'guides' => 'Guide'];
        $items = [];
        foreach ($folders as $type => $folder) {
            $glob = glob($devDir . "/content/{$folder}/*.json");
            if (!$glob) continue;
            foreach ($glob as $f) {
                $j = @json_decode((string)@file_get_contents($f), true);
                if (!$j || empty($j['slug'])) continue;
                $folderUrl = $type === 'blog' ? 'blog' : ($type === 'insights' ? 'insights' : 'guides');
                $items[] = [
                    'category' => $j['category'] ?? self::categoryLabel($type),
                    'title'    => $j['title'] ?? '',
                    'excerpt'  => $j['meta']['description'] ?? ($j['description'] ?? ''),
                    'date'     => $j['date'] ?? '',
                    'datePublished' => $j['datePublished'] ?? '',
                    'author'   => $j['author'] ?? '',
                    'image'    => $j['heroImage'] ? str_replace('../', '', $j['heroImage']) : '',
                    'slug'     => $j['slug'],
                    'href'     => "{$folderUrl}/{$j['slug']}",
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
     */
    public static function rebuildSitemap(string $devDir, ?string $prodDir): void {
        $base = 'https://www.panasatech.com';
        $static = ['/', '/about', '/services', '/resources', '/contact', '/careers', '/privacy-policy',
                   '/ai-accelerated-fintech-engineering', '/ai-powered-legacy-modernisation',
                   '/ai-governance', '/intelligent-operations'];
        $idxPath = $devDir . '/content/Resources/articles-index.json';
        $articles = [];
        if (file_exists($idxPath)) {
            $idx = @json_decode((string)file_get_contents($idxPath), true) ?: [];
            $articles = $idx['items'] ?? [];
        }
        $today = date('Y-m-d');
        $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
        foreach ($static as $p) {
            $xml .= "  <url><loc>{$base}{$p}</loc><lastmod>{$today}</lastmod></url>\n";
        }
        foreach ($articles as $a) {
            $href = $a['href'] ?? '';
            if (!$href) continue;
            $lastmod = $a['datePublished'] ?: $today;
            $xml .= "  <url><loc>{$base}/{$href}</loc><lastmod>" . htmlspecialchars($lastmod, ENT_XML1) . "</lastmod></url>\n";
        }
        $xml .= '</urlset>';
        file_put_contents($devDir . '/sitemap.xml', $xml, LOCK_EX);
        if ($prodDir) file_put_contents($prodDir . '/sitemap.xml', $xml, LOCK_EX);
    }
}
