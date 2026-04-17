<?php
/**
 * Regex-based meta tag updater for static HTML files.
 * Updates <title>, meta description, OG, Twitter, and JSON-LD.
 */
class MetaUpdater {

    /**
     * Update all meta tags in an HTML string.
     *
     * @param string $html  The full HTML file content
     * @param array  $meta  Associative array with 'title' and 'description' keys
     * @return string       Updated HTML
     */
    public static function update(string $html, array $meta): string {
        $title = self::esc($meta['title'] ?? '');
        $desc  = self::esc($meta['description'] ?? '');

        if (empty($title) && empty($desc)) {
            return $html;
        }

        if (!empty($title)) {
            // <title>...</title>
            $html = preg_replace(
                '#(<title>)(.*?)(</title>)#s',
                '${1}' . self::escReplace($title) . '${3}',
                $html, 1
            );

            // <meta property="og:title" content="...">
            $html = self::replaceMetaContent($html, 'property', 'og:title', $title);

            // <meta name="twitter:title" content="...">
            $html = self::replaceMetaContent($html, 'name', 'twitter:title', $title);
        }

        if (!empty($desc)) {
            // <meta name="description" content="...">
            $html = self::replaceMetaContent($html, 'name', 'description', $desc);

            // <meta property="og:description" content="...">
            $html = self::replaceMetaContent($html, 'property', 'og:description', $desc);

            // <meta name="twitter:description" content="...">
            $html = self::replaceMetaContent($html, 'name', 'twitter:description', $desc);

            // JSON-LD "description" field
            $html = self::updateJsonLdDescription($html, $desc);
        }

        return $html;
    }

    /**
     * Replace the content="..." attribute in a <meta> tag.
     */
    private static function replaceMetaContent(string $html, string $attrType, string $attrValue, string $newContent): string {
        // Match <meta name/property="value" content="..."> or <meta content="..." name/property="value">
        // Pattern handles both attribute orderings and optional self-closing slash
        $escapedAttrValue = preg_quote($attrValue, '#');

        // Order 1: name/property first, then content
        $pattern1 = '#(<meta\s+' . preg_quote($attrType, '#') . '="' . $escapedAttrValue . '"\s+content=")([^"]*)(")#i';
        if (preg_match($pattern1, $html)) {
            return preg_replace($pattern1, '${1}' . self::escReplace($newContent) . '${3}', $html, 1);
        }

        // Order 2: content first, then name/property
        $pattern2 = '#(<meta\s+content=")([^"]*)("\s+' . preg_quote($attrType, '#') . '="' . $escapedAttrValue . '")#i';
        if (preg_match($pattern2, $html)) {
            return preg_replace($pattern2, '${1}' . self::escReplace($newContent) . '${3}', $html, 1);
        }

        return $html;
    }

    /**
     * Update the "description" field inside the first JSON-LD block.
     */
    private static function updateJsonLdDescription(string $html, string $desc): string {
        $pattern = '#(<script\s+type="application/ld\+json">\s*)(.*?)(</script>)#s';

        if (!preg_match($pattern, $html, $match)) {
            return $html;
        }

        $jsonStr = $match[2];
        $jsonData = json_decode($jsonStr, true);

        if ($jsonData === null) {
            return $html;
        }

        if (isset($jsonData['description'])) {
            $jsonData['description'] = html_entity_decode($desc, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        }

        $newJson = json_encode($jsonData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        // Indent JSON-LD block with 4 spaces to match the existing formatting
        $newJson = preg_replace('/^/m', '    ', $newJson);

        return preg_replace(
            $pattern,
            $match[1] . "\n" . $newJson . "\n    " . $match[3],
            $html, 1
        );
    }

    /**
     * HTML-escape a string for use in attribute values and text content.
     */
    private static function esc(string $text): string {
        return htmlspecialchars($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    }

    /**
     * Escape $ and \ in replacement strings for preg_replace.
     */
    private static function escReplace(string $text): string {
        return str_replace(['\\', '$'], ['\\\\', '\\$'], $text);
    }
}
