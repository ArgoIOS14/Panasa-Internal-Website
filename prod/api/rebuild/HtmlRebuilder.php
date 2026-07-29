<?php
/**
 * Homepage body content rebuilder using regex-based replacement.
 *
 * Strategy: Find containers by data-attribute markers in the raw HTML string,
 * then replace their innerHTML with freshly rendered content from templates.
 * This avoids DOMDocument issues with SVGs, formatting, and encoding.
 */
class HtmlRebuilder {

    private string $html;
    private string $templateDir;

    public function __construct(string $html) {
        $this->html = $html;
        $this->templateDir = __DIR__ . '/templates/';
    }

    /**
     * Rebuild homepage body content from CMS data.
     */
    public function rebuildHomepage(array $data): string {
        $this->html = $this->updateSimpleTextFields($data);
        $this->html = $this->updateServiceSlides($data);
        $this->html = $this->updateServiceDots($data);
        $this->html = $this->updateWhyCards($data);
        $this->html = $this->updateCaseStudies($data);
        $this->html = $this->updateCaseDots($data);
        $this->html = $this->updateTestimonials($data);
        $this->html = $this->updateEngagementCards($data);
        $this->html = $this->updateEngagementFilters($data);
        $this->html = $this->updateFooterPhones($data);
        $this->html = $this->updateFooterColumns($data);
        $this->html = $this->updateNavLinks($data);
        $this->html = $this->updateLogoMarquee($data);
        $this->html = $this->updateCertBadges($data);
        return $this->html;
    }

    // ─── Simple text fields ─────────────────────────────────────────────

    private function updateSimpleTextFields(array $data): string {
        $html = $this->html;

        // Map: data-attribute => [json path, isInnerHtml]
        $textMap = [
            // Hero
            'data-hero-pill'           => [$data['hero']['pill'] ?? '', false],
            'data-hero-title'          => [$data['hero']['title'] ?? '', false],
            'data-hero-title-emphasis'  => [$data['hero']['titleEmphasis'] ?? '', false],
            'data-hero-subtitle'       => [$data['hero']['subtitle'] ?? '', false],
            'data-hero-trusted-label'  => [$data['hero']['trustedLabel'] ?? '', false],
            // Services
            'data-services-pill'       => [$data['services']['pill'] ?? '', false],
            'data-services-title'      => [self::splitTitle($data['services']['title'] ?? ''), true],
            'data-services-subtitle'   => [$data['services']['subtitle'] ?? '', false],
            // Why
            'data-why-pill'            => [$data['why']['pill'] ?? '', false],
            'data-why-title'           => [self::splitTitle($data['why']['title'] ?? ''), true],
            'data-why-subtitle'        => [$data['why']['subtitle'] ?? '', false],
            // Case Studies
            'data-case-pill'           => [$data['caseStudies']['pill'] ?? '', false],
            'data-case-title'          => [self::splitTitle($data['caseStudies']['title'] ?? ''), true],
            'data-case-subtitle'       => [$data['caseStudies']['subtitle'] ?? '', false],
            // Testimonials
            'data-testimonials-pill'    => [$data['testimonials']['pill'] ?? '', false],
            'data-testimonials-title'   => [self::splitTitle($data['testimonials']['title'] ?? ''), true],
            'data-testimonials-subtitle'=> [$data['testimonials']['subtitle'] ?? '', false],
            // Engagement
            'data-engagement-pill'     => [$data['engagement']['pill'] ?? '', false],
            'data-engagement-title'    => [self::splitTitle($data['engagement']['title'] ?? ''), true],
            'data-engagement-subtitle' => [$data['engagement']['subtitle'] ?? '', false],
            'data-engagement-note'     => [$data['engagement']['note'] ?? '', false],
            // Footer
            'data-footer-cta-title'    => [$data['footer']['ctaTitle'] ?? '', false],
            'data-footer-cta-text'     => [$data['footer']['ctaText'] ?? '', false],
            'data-footer-brand-text'   => [$data['footer']['brandText'] ?? '', false],
            'data-footer-copyright'    => [$data['footer']['copyright'] ?? '', false],
        ];

        foreach ($textMap as $attr => [$value, $isHtml]) {
            if ($value === '') continue;
            $html = $this->replaceElementContent($html, $attr, $value, $isHtml);
        }

        // Footer CTA button — special: has SVG icon child, only update .footer-cta-label
        // Handle both old string format and new object format { label, href }
        $ctaButtonRaw = $data['footer']['ctaButton'] ?? '';
        $ctaButtonLabel = is_array($ctaButtonRaw) ? ($ctaButtonRaw['label'] ?? '') : $ctaButtonRaw;
        $ctaButtonHref = is_array($ctaButtonRaw) ? ($ctaButtonRaw['href'] ?? 'contact') : ($data['footer']['ctaHref'] ?? 'contact');
        if (!empty($ctaButtonLabel)) {
            $html = $this->replaceElementContent($html, 'class="footer-cta-label"', self::esc($ctaButtonLabel), false, 'span');
        }
        // Update CTA button href
        if (!empty($ctaButtonHref)) {
            $html = preg_replace(
                '#(<a[^>]*data-footer-cta-button[^>]*href=")[^"]*"#',
                '${1}' . self::esc($ctaButtonHref) . '"',
                $html, 1
            );
        }

        // Footer email — update both href and text
        $email = $data['footer']['email'] ?? '';
        if (!empty($email)) {
            $html = preg_replace(
                '#(<a[^>]*data-footer-email[^>]*href=")mailto:[^"]*("[^>]*>)[^<]*(</a>)#',
                '${1}mailto:' . self::esc($email) . '${2}' . self::esc($email) . '${3}',
                $html, 1
            );
        }

        // Hero CTAs — update label and href
        $html = $this->updateHeroCta($html, 'data-hero-cta-primary', $data['hero']['primaryCta'] ?? null);
        $html = $this->updateHeroCta($html, 'data-hero-cta-secondary', $data['hero']['secondaryCta'] ?? null);

        // Pill visibility — hide if empty, show if not
        foreach (['data-hero-pill', 'data-services-pill', 'data-why-pill', 'data-case-pill', 'data-testimonials-pill', 'data-engagement-pill'] as $pillAttr) {
            $pillKey = str_replace('data-', '', str_replace('-pill', '', $pillAttr));
            $section = str_replace('-', '', $pillKey);
            // Map pill attributes to their data keys
            $pillMap = [
                'data-hero-pill'          => $data['hero']['pill'] ?? '',
                'data-services-pill'      => $data['services']['pill'] ?? '',
                'data-why-pill'           => $data['why']['pill'] ?? '',
                'data-case-pill'          => $data['caseStudies']['pill'] ?? '',
                'data-testimonials-pill'  => $data['testimonials']['pill'] ?? '',
                'data-engagement-pill'    => $data['engagement']['pill'] ?? '',
            ];
            $pillValue = $pillMap[$pillAttr] ?? '';
            if (empty($pillValue)) {
                // Ensure style="display:none" is present
                $html = preg_replace(
                    '#(<[^>]*' . preg_quote($pillAttr, '#') . ')(?:\s+style="[^"]*")?([^>]*>)#',
                    '${1} style="display:none"${2}',
                    $html, 1
                );
            } else {
                // Remove display:none if present
                $html = preg_replace(
                    '#(<[^>]*' . preg_quote($pillAttr, '#') . '[^>]*)\s+style="display:none"#',
                    '${1}',
                    $html, 1
                );
            }
        }

        return $html;
    }

    // ─── Hero CTAs ──────────────────────────────────────────────────────

    private function updateHeroCta(string $html, string $attr, ?array $cta): string {
        if (!$cta || empty($cta['label'])) return $html;

        // Update the label text inside .hero-action-label
        $pattern = '#(<a[^>]*' . preg_quote($attr, '#') . '[^>]*>)(.*?)(</a>)#s';
        if (preg_match($pattern, $html, $match)) {
            $inner = $match[2];
            // Update the label span
            $inner = preg_replace(
                '#(<span class="hero-action-label">)[^<]*(</span>)#',
                '${1}' . self::esc($cta['label']) . '${2}',
                $inner, 1
            );
            // Update the href
            $tag = preg_replace('#href="[^"]*"#', 'href="' . self::esc($cta['href'] ?? '#') . '"', $match[1], 1);
            $html = str_replace($match[0], $tag . $inner . $match[3], $html);
        }
        return $html;
    }

    // ─── Services slides ────────────────────────────────────────────────

    private function updateServiceSlides(array $data): string {
        $items = $data['services']['items'] ?? [];
        if (empty($items)) return $this->html;

        $ctaLabel = $data['services']['learnMoreLabel'] ?? 'Learn More  ›';
        $slidesHtml = '';
        foreach ($items as $item) {
            $slidesHtml .= $this->renderTemplate('service-slide', [
                'eyebrow' => $item['eyebrow'] ?? $item['title'] ?? '',
                'title'   => $item['title'] ?? '',
                'bullets' => $item['bullets'] ?? [],
                'href'    => self::resolveServiceHref($item['title'] ?? ''),
                'ctaLabel'=> $ctaLabel,
                'icon'    => $item['icon'] ?? '',
            ]);
        }

        return $this->replaceContainerInnerHtml('data-services-slides', $slidesHtml);
    }

    private function updateServiceDots(array $data): string {
        $items = $data['services']['items'] ?? [];
        if (empty($items)) return $this->html;

        $dotsHtml = '';
        foreach ($items as $i => $item) {
            $active = $i === 0 ? ' active' : '';
            $title = self::esc($item['title'] ?? '');
            $dotsHtml .= "\n                <button class=\"services-dot{$active}\" type=\"button\" aria-label=\"Show {$title}\" data-services-slide=\"{$i}\"></button>";
        }
        $dotsHtml .= "\n              ";

        return $this->replaceContainerInnerHtml('data-services-dots', $dotsHtml);
    }

    // ─── Why cards ──────────────────────────────────────────────────────

    private function updateWhyCards(array $data): string {
        $cards = $data['why']['cards'] ?? [];
        if (empty($cards)) return $this->html;

        $cardsHtml = '';
        foreach ($cards as $card) {
            $cardsHtml .= $this->renderTemplate('why-card', [
                'style' => $card['style'] ?? 'light',
                'image' => $card['image'] ?? '',
                'title' => $card['title'] ?? '',
                'text'  => $card['text'] ?? '',
                'imageType' => $card['imageType'] ?? '',
                'tags'  => $card['tags'] ?? [],
            ]);
        }

        return $this->replaceContainerInnerHtml('data-why-cards', $cardsHtml);
    }

    // ─── Case studies ───────────────────────────────────────────────────

    private function updateCaseStudies(array $data): string {
        $slides = $data['caseStudies']['slides'] ?? [];
        if (empty($slides)) return $this->html;

        $slidesHtml = '';
        foreach ($slides as $i => $slide) {
            $slidesHtml .= $this->renderTemplate('case-slide', [
                'index'   => $i,
                'eyebrow' => $slide['eyebrow'] ?? '',
                'title'   => $slide['title'] ?? '',
                'text'    => $slide['text'] ?? '',
                'cta'     => $slide['cta'] ?? ['label' => 'Read Full Case Study'],
                'metrics' => $slide['metrics'] ?? [],
                'image'   => $slide['image'] ?? '',
            ]);
        }

        return $this->replaceContainerInnerHtml('data-case-slides', $slidesHtml);
    }

    private function updateCaseDots(array $data): string {
        $slides = $data['caseStudies']['slides'] ?? [];
        if (empty($slides)) return $this->html;

        $dotsHtml = '';
        foreach ($slides as $i => $slide) {
            $active = $i === 0 ? ' active' : '';
            $num = $i + 1;
            $dotsHtml .= "\n              <button class=\"dot{$active}\" data-slide=\"{$i}\" aria-label=\"Slide {$num}\"></button>";
        }
        $dotsHtml .= "\n            ";

        return $this->replaceContainerInnerHtml('data-case-dots', $dotsHtml);
    }

    // ─── Testimonials ───────────────────────────────────────────────────

    private function updateTestimonials(array $data): string {
        $cards = $data['testimonials']['cards'] ?? [];
        if (empty($cards)) return $this->html;

        // Pre-render for SEO/no-flash: groups of 2 (the desktop default —
        // matches sharedTestimonials.js's chunkCards(cards, 2) for
        // non-mobile viewports). Client JS immediately re-chunks per the
        // real viewport on load, so this only needs to be A reasonable
        // default, not every responsive variant.
        $chunks = array_chunk($cards, 2);
        $trackHtml = '';
        foreach ($chunks as $group) {
            $isSingle = count($group) === 1 ? ' is-single' : '';
            $trackHtml .= "\n                <article class=\"split-testimonial-card\">";
            $trackHtml .= "\n                  <div class=\"split-testimonial-columns{$isSingle}\">";
            foreach ($group as $card) {
                $trackHtml .= $this->renderTemplate('testimonial-card', [
                    'text'    => $card['text'] ?? '',
                    'name'    => $card['name'] ?? '',
                    'role'    => $card['role'] ?? '',
                    'logo'    => $card['logo'] ?? '',
                    'logoAlt' => $card['logoAlt'] ?? $card['name'] ?? '',
                ]);
            }
            $trackHtml .= "\n                  </div>";
            $trackHtml .= "\n                </article>";
        }

        return $this->replaceContainerInnerHtml('data-testimonials-track', $trackHtml);
    }

    // ─── Engagement ─────────────────────────────────────────────────────

    private function updateEngagementCards(array $data): string {
        $items = $data['engagement']['items'] ?? [];
        if (empty($items)) return $this->html;

        $cardsHtml = '';
        foreach ($items as $item) {
            $cardsHtml .= $this->renderTemplate('engagement-card', [
                'image'         => $item['image'] ?? '',
                'title'         => $item['title'] ?? '',
                'text'          => $item['text'] ?? '',
                'variant'       => $item['variant'] ?? '',
                'bestSuitedFor' => $item['bestSuitedFor'] ?? '',
                'bullets'       => $item['bullets'] ?? [],
                'outcome'       => $item['outcome'] ?? '',
                'cta'           => $item['cta'] ?? 'Talk to us',
            ]);
        }

        return $this->replaceContainerInnerHtml('data-engagement-grid', $cardsHtml);
    }

    private function updateEngagementFilters(array $data): string {
        $filters = $data['engagement']['filters'] ?? [];
        if (empty($filters)) return $this->html;

        $activeFilter = $data['engagement']['activeFilter'] ?? ($filters[0] ?? '');
        $filtersHtml = '';
        foreach ($filters as $filter) {
            $active = ($filter === $activeFilter) ? ' active' : '';
            $filtersHtml .= "\n            <button class=\"engagement-filter{$active}\" type=\"button\">" . self::esc($filter) . "</button>";
        }
        $filtersHtml .= "\n          ";

        return $this->replaceContainerInnerHtml('data-engagement-filters', $filtersHtml);
    }

    // ─── Footer ─────────────────────────────────────────────────────────

    private function updateFooterPhones(array $data): string {
        $phones = $data['footer']['phones'] ?? [];
        if (empty($phones)) return $this->html;

        $phonesHtml = '';
        foreach ($phones as $i => $phone) {
            if ($i > 0) {
                $phonesHtml .= "\n                <span class=\"footer-contact-separator\">&bull;</span>";
            }
            $tel = preg_replace('/[\s()\-]/', '', $phone);
            $phonesHtml .= "\n                <a href=\"tel:{$tel}\">" . self::esc($phone) . "</a>";
        }
        $phonesHtml .= "\n              ";

        return $this->replaceContainerInnerHtml('data-footer-phones', $phonesHtml);
    }

    private function updateFooterColumns(array $data): string {
        $columns = $data['footer']['columns'] ?? [];
        if (empty($columns)) return $this->html;

        $colsHtml = '';
        foreach ($columns as $col) {
            if (($col['visible'] ?? true) === false) continue;
            $colsHtml .= $this->renderTemplate('footer-column', [
                'heading' => $col['heading'] ?? $col['title'] ?? '',
                'links'   => array_filter($col['links'] ?? [], fn($l) => ($l['visible'] ?? true) !== false),
            ]);
        }

        return $this->replaceContainerInnerHtml('data-footer-columns', $colsHtml);
    }

    // ─── Nav ────────────────────────────────────────────────────────────

    private function updateNavLinks(array $data): string {
        $links = $data['nav']['links'] ?? [];
        $cta = $data['nav']['cta'] ?? null;
        if (empty($links)) return $this->html;

        $navHtml = "\n            <li class=\"nav-mobile-head\">";
        $navHtml .= "\n              <a class=\"nav-mobile-brand\" href=\"/\" aria-label=\"Panasa home\"><img src=\"assets/logo.svg\" alt=\"Panasa\" /></a>";
        $navHtml .= "\n              <button class=\"nav-mobile-close\" type=\"button\" aria-label=\"Close navigation\" data-nav-close=\"true\">×</button>";
        $navHtml .= "\n            </li>";

        foreach ($links as $link) {
            $children = $link['children'] ?? [];
            if (!empty($children)) {
                $label = self::esc($link['label'] ?? '');
                $href = self::esc($link['href'] ?? '#');
                $navHtml .= "\n            <li class=\"nav-item-has-children\">";
                $navHtml .= "\n              <div class=\"nav-dropdown-wrap\">";
                $navHtml .= "\n                <a href=\"{$href}\">{$label}</a>";
                $navHtml .= "\n                <button class=\"nav-dropdown-toggle\" type=\"button\" aria-label=\"Open {$label} menu\" aria-expanded=\"false\"><span></span></button>";
                $navHtml .= "\n              </div>";
                $navHtml .= "\n              <div class=\"nav-submenu\">";
                $navHtml .= "\n                <a class=\"nav-submenu-parent\" href=\"{$href}\">{$label}</a>";
                foreach ($children as $child) {
                    $navHtml .= "\n                <a href=\"" . self::esc($child['href'] ?? '#') . "\">" . self::esc($child['label'] ?? '') . "</a>";
                }
                $navHtml .= "\n              </div>";
                $navHtml .= "\n            </li>";
            } else {
                $navHtml .= "\n            <li><a href=\"" . self::esc($link['href'] ?? '#') . "\">" . self::esc($link['label'] ?? '') . "</a></li>";
            }
        }

        if ($cta) {
            $navHtml .= "\n            <li><a class=\"btn btn-light\" href=\"" . self::esc($cta['href'] ?? '#') . "\">" . self::esc($cta['label'] ?? '') . "</a></li>";
        }
        $navHtml .= "\n          ";

        return $this->replaceContainerInnerHtml('data-nav-links', $navHtml);
    }

    // ─── Logo marquee ───────────────────────────────────────────────────

    private function updateLogoMarquee(array $data): string {
        $logos = $data['hero']['trustedLogos'] ?? [];
        if (empty($logos)) return $this->html;

        $trackHtml = "\n                    ";
        // Primary logos
        foreach ($logos as $logo) {
            $src = self::esc($logo['src'] ?? $logo ?? '');
            $alt = self::esc($logo['alt'] ?? '');
            $trackHtml .= "<div class=\"logo-marquee-item\"><img src=\"{$src}\" alt=\"{$alt}\" loading=\"lazy\" /></div>\n                    ";
        }
        // Duplicate for infinite scroll
        foreach ($logos as $logo) {
            $src = self::esc($logo['src'] ?? $logo ?? '');
            $trackHtml .= "<div class=\"logo-marquee-item\" aria-hidden=\"true\"><img src=\"{$src}\" alt=\"\" loading=\"lazy\" /></div>\n                    ";
        }

        // Replace the logo-marquee-track inner HTML
        return $this->replaceContainerInnerHtml('class="logo-marquee-track"', $trackHtml);
    }

    // ─── Cert badges ────────────────────────────────────────────────────

    private function updateCertBadges(array $data): string {
        $badges = $data['hero']['certBadges'] ?? [];
        if (empty($badges)) return $this->html;

        $badgesHtml = '';
        foreach ($badges as $badge) {
            $src = self::esc($badge['src'] ?? '');
            $alt = self::esc($badge['alt'] ?? '');
            $badgesHtml .= "\n            <div class=\"cert-badge-item\"><div class=\"cert-badge-frame\"><img src=\"{$src}\" alt=\"{$alt}\" /></div></div>";
        }
        $badgesHtml .= "\n          ";

        return $this->replaceContainerInnerHtml('data-hero-cert-badges', $badgesHtml);
    }

    // ─── Utilities ──────────────────────────────────────────────────────

    /**
     * Replace the innerHTML of an element that has a given data-attribute.
     * Works by finding the opening tag with the attribute, then matching
     * to the corresponding closing tag.
     */
    private function replaceContainerInnerHtml(string $dataAttr, string $newInner): string {
        return self::replaceInHtml($this->html, $dataAttr, $newInner);
    }

    /**
     * Locate an element by a data-attribute/class marker and replace its
     * innerHTML, handling nested same-name tags via depth tracking. Public
     * + static (takes $html explicitly) so callers outside this class —
     * e.g. rebuild.php's per-page bake functions for pages that don't go
     * through HtmlRebuilder at all — can reuse the exact same tested
     * algorithm instead of re-implementing it.
     */
    public static function replaceInHtml(string $html, string $dataAttr, string $newInner): string {
        $escaped = preg_quote($dataAttr, '#');
        // Find the opening tag with this data attribute
        $openPattern = '#<(\w+)\b[^>]*\b' . $escaped . '[^>]*>#s';
        if (!preg_match($openPattern, $html, $openMatch, PREG_OFFSET_CAPTURE)) {
            return $html;
        }

        $tagName = $openMatch[1][0];
        $openTagStart = $openMatch[0][1];
        $openTagEnd = $openTagStart + strlen($openMatch[0][0]);

        // Walk forward to find the matching closing tag (handle nested same-name tags)
        $depth = 1;
        $pos = $openTagEnd;
        $len = strlen($html);
        $openTag = '<' . $tagName;
        $closeTag = '</' . $tagName . '>';
        $closeTagLen = strlen($closeTag);

        while ($depth > 0 && $pos < $len) {
            $nextOpen = stripos($html, $openTag, $pos);
            $nextClose = stripos($html, $closeTag, $pos);

            if ($nextClose === false) break; // Malformed HTML

            // Check if an opening tag comes before the next closing tag
            if ($nextOpen !== false && $nextOpen < $nextClose) {
                // Verify it's actually an opening tag (not a substring match like <divider>)
                $charAfter = $html[$nextOpen + strlen($openTag)] ?? '';
                if ($charAfter === ' ' || $charAfter === '>' || $charAfter === '/' || $charAfter === "\n" || $charAfter === "\t") {
                    $depth++;
                }
                $pos = $nextOpen + 1;
            } else {
                $depth--;
                if ($depth === 0) {
                    // Found the matching close tag
                    $innerStart = $openTagEnd;
                    $innerEnd = $nextClose;

                    $before = substr($html, 0, $innerStart);
                    $after = substr($html, $innerEnd);

                    return $before . $newInner . $after;
                }
                $pos = $nextClose + $closeTagLen;
            }
        }

        return $html;
    }

    /**
     * Replace text content of an element identified by a data-attribute or class.
     */
    private function replaceElementContent(string $html, string $attr, string $newContent, bool $isHtml = false, ?string $expectTag = null): string {
        $escaped = preg_quote($attr, '#');
        $tagMatch = $expectTag ? preg_quote($expectTag, '#') : '\w+';
        $pattern = '#(<(' . $tagMatch . ')\b[^>]*\b' . $escaped . '[^>]*>)(.*?)(</\2>)#s';
        if (preg_match($pattern, $html, $match)) {
            $replacement = $isHtml ? $newContent : self::esc($newContent);
            return str_replace($match[0], $match[1] . $replacement . $match[4], $html);
        }
        return $html;
    }

    /**
     * Render a PHP template file with the given variables.
     */
    private function renderTemplate(string $_templateName, array $vars): string {
        return self::renderTemplateFile($_templateName, $vars);
    }

    /**
     * Static twin of renderTemplate() for callers outside this class (e.g.
     * rebuild.php's per-page bake functions) that need to reuse the same
     * template files without going through a full HtmlRebuilder instance.
     */
    public static function renderTemplateFile(string $_templateName, array $vars): string {
        extract($vars);
        ob_start();
        include __DIR__ . '/templates/' . $_templateName . '.php';
        return ob_get_clean();
    }

    /**
     * Split a title into "First words <span>Last words</span>" format.
     * Matches the JS pattern where the first word stays plain and the rest is wrapped.
     */
    public static function splitTitle(string $title): string {
        $title = trim($title);
        if (empty($title)) return '';

        $parts = preg_split('/\s+/', $title, 2);
        if (count($parts) === 1) {
            return self::esc($parts[0]);
        }
        return self::esc($parts[0]) . ' <span>' . self::esc($parts[1]) . '</span>';
    }

    /**
     * Map a service heading to its HTML file URL.
     */
    public static function resolveServiceHref(string $heading): string {
        $map = [
            'AI Accelerated Fintech Engineering'  => 'ai-accelerated-fintech-engineering',
            'AI Governance'                        => 'ai-governance',
            'Intelligent Operations'               => 'intelligent-operations',
            'AI-Led Legacy Modernisation'          => 'ai-powered-legacy-modernisation',
            'AI Powered Legacy Modernisation'      => 'ai-powered-legacy-modernisation',
        ];
        return $map[$heading] ?? 'services';
    }

    /**
     * HTML-escape a string.
     */
    public static function esc(string $text): string {
        return htmlspecialchars($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    }
}
