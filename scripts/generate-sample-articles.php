<?php
/**
 * One-off CLI script: generate sample blog/insights/guide articles that
 * exercise every block type, so we can verify the public-side renderers.
 *
 * Run from project root: php scripts/generate-sample-articles.php
 */

declare(strict_types=1);

$devDir = realpath(__DIR__ . '/../dev');
$prodDir = realpath(__DIR__ . '/../prod');

require_once $devDir . '/api/rebuild/ArticleRebuilder.php';

function writeArticle(string $type, array $data, string $devDir, ?string $prodDir): void {
    $slug = $data['slug'];
    $folderUrl = $type === 'blog' ? 'blog' : ($type === 'insights' ? 'insights' : 'guides');
    $folderJson = $type === 'blog' ? 'Blog' : ($type === 'insights' ? 'Insights' : 'Guide');

    $tplPath = __DIR__ . "/../dev/templates/{$type}.html";
    if (!file_exists($tplPath)) {
        throw new RuntimeException("Template not found: $tplPath");
    }
    $tpl = file_get_contents($tplPath);
    $html = ArticleRebuilder::renderTemplate($tpl, $data, $type, $slug);

    $htmlFile = "{$folderUrl}/{$slug}.html";
    $jsonFile = "content/{$folderJson}/{$slug}.json";
    $jsFile   = "content/{$folderJson}/{$slug}.default.js";

    @mkdir(dirname($devDir . '/' . $htmlFile), 0755, true);
    @mkdir(dirname($devDir . '/' . $jsonFile), 0755, true);
    file_put_contents($devDir . '/' . $htmlFile, $html);

    $jsonStr = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    file_put_contents($devDir . '/' . $jsonFile, $jsonStr);

    $varName = $type === 'guides' ? 'DEFAULT_GUIDE_CONTENT' : 'DEFAULT_BLOG_CONTENT';
    file_put_contents($devDir . '/' . $jsFile, "window.{$varName} = {$jsonStr};\n");

    if ($prodDir) {
        @mkdir(dirname($prodDir . '/' . $htmlFile), 0755, true);
        @mkdir(dirname($prodDir . '/' . $jsonFile), 0755, true);
        file_put_contents($prodDir . '/' . $htmlFile, $html);
        file_put_contents($prodDir . '/' . $jsonFile, $jsonStr);
        file_put_contents($prodDir . '/' . $jsFile, "window.{$varName} = {$jsonStr};\n");
    }

    echo "  wrote {$htmlFile}, {$jsonFile}, {$jsFile}\n";
}

// ── Sample 1: Blog with every supported body block ──
$blog = [
    'meta' => [
        'title' => 'Sample Blog: All Block Types',
        'description' => 'A test article exercising every supported body block: rich text with H2/H3/code/blockquote, callout, and YouTube.',
        'canonical' => 'https://www.panasatech.com/blog/sample-all-blocks',
        'ogImage' => 'https://www.panasatech.com/assets/blog-hero-desktop.webp',
    ],
    'slug' => 'sample-all-blocks',
    'category' => 'Blog',
    'tag' => 'BLOG',
    'title' => 'Sample Blog: All Block Types',
    'date' => '27 APR 2026',
    'datePublished' => '2026-04-27',
    'dateModified' => '2026-04-27',
    'readTime' => '6 MINS READ',
    'author' => 'Panasa Team',
    'tags' => ['Sample', 'Blocks', 'Test'],
    'heroImage' => '../assets/blog-hero-desktop.webp',
    'heroImageTablet' => '../assets/blog-hero-tablet.webp',
    'heroImageMobile' => '../assets/blog-hero-mobile.webp',
    'heroImageAlt' => 'Sample article hero',
    'body' => [
        [
            'type' => 'html',
            'content' => '<p>This paragraph opens the article. Inline <strong>bold</strong>, <em>italic</em>, and a <a href="../resources">link to Resources</a>.</p>'
                       . '<h2>Heading 2 — Section</h2>'
                       . '<p>Now a paragraph with more detail.</p>'
                       . '<h3>Heading 3 — Subsection</h3>'
                       . '<ul><li>Bulleted item one</li><li>Bulleted item two</li></ul>'
                       . '<ol><li>Numbered first</li><li>Numbered second</li></ol>'
                       . '<blockquote>"A quote from a customer or expert."</blockquote>'
                       . '<p>Inline <code>monospace code</code> within prose.</p>'
                       . '<pre><code>// A code block\nfunction add(a, b) {\n  return a + b;\n}</code></pre>',
        ],
        [
            'type' => 'callout',
            'title' => 'Struggling with transaction latency?',
            'text' => "We've cut online processing pipelines from 900ms to under 120ms, here's how.",
            'cta' => ['label' => 'View Case Study', 'href' => '../contact', 'variant' => 'ghost'],
        ],
        [
            'type' => 'youtube',
            'videoId' => 'dQw4w9WgXcQ',
            'caption' => 'Sample video — replace with a real fintech walkthrough.',
        ],
        [
            'type' => 'html',
            'content' => '<p>A closing paragraph after the video to ensure ordering renders correctly.</p>',
        ],
    ],
    'relatedSlugs' => [],
];

// ── Sample 2: Insights — same shape, different category/tag ──
$insights = $blog;
$insights['meta']['title'] = 'Sample Insight: All Block Types';
$insights['meta']['canonical'] = 'https://www.panasatech.com/insights/sample-all-blocks';
$insights['slug'] = 'sample-all-blocks';
$insights['category'] = 'Insights';
$insights['tag'] = 'INSIGHTS';
$insights['title'] = 'Sample Insight: All Block Types';

// ── Sample 3: Guide — intro + numbered sections + every block type incl. note + subheading ──
$guide = [
    'meta' => [
        'title' => 'Sample Guide: All Block Types',
        'description' => 'A test guide exercising intro, numbered sections, callouts, notes (3 variants), subheadings, and YouTube.',
        'canonical' => 'https://www.panasatech.com/guides/sample-all-blocks',
        'ogImage' => 'https://www.panasatech.com/assets/blog-hero-desktop.webp',
    ],
    'slug' => 'sample-all-blocks',
    'category' => 'Guide',
    'tag' => 'GUIDE',
    'title' => 'Sample Guide to Block Types',
    'titleHighlight' => 'Block Types',
    'description' => 'A comprehensive walkthrough of every supported body block in the new admin CMS.',
    'tocHeading' => 'On this page',
    'date' => '27 APR 2026',
    'datePublished' => '2026-04-27',
    'dateModified' => '2026-04-27',
    'readTime' => '8 MINS READ',
    'author' => 'Panasa Team',
    'tags' => ['Guide', 'Blocks', 'Reference'],
    'heroImage' => '../assets/blog-hero-desktop.webp',
    'heroImageTablet' => '../assets/blog-hero-tablet.webp',
    'heroImageMobile' => '../assets/blog-hero-mobile.webp',
    'heroImageAlt' => 'Sample guide hero',
    'introduction' => [
        'heading' => 'Introduction',
        'blocks' => [
            ['type' => 'html', 'content' => '<p>This is the introduction. Below are numbered sections with every block kind a guide can host.</p>'],
            ['type' => 'callout', 'title' => 'Quick reminder', 'text' => 'Guides also support intro callouts.', 'cta' => ['label' => 'Talk to us', 'href' => '../contact', 'variant' => 'dark']],
        ],
    ],
    'sections' => [
        [
            'slug' => 'foundation',
            'number' => 1,
            'title' => 'Foundation',
            'blocks' => [
                ['type' => 'subheading', 'text' => 'Subheading inside section 1'],
                ['type' => 'html', 'content' => '<p>Plain prose for section 1, with a <strong>bold</strong> emphasis.</p>'],
                ['type' => 'note', 'variant' => 'key-insight', 'label' => 'KEY INSIGHT', 'text' => 'A pinned takeaway that the reader should remember.'],
                ['type' => 'note', 'variant' => 'practitioner', 'label' => 'PRACTITIONER NOTE', 'text' => 'A note from someone shipping this in production.'],
                ['type' => 'note', 'variant' => 'field', 'label' => 'FROM THE FIELD', 'text' => 'An anecdote pulled from a real engagement.'],
            ],
        ],
        [
            'slug' => 'in-practice',
            'number' => 2,
            'title' => 'In Practice',
            'blocks' => [
                ['type' => 'html', 'content' => '<p>How this looks day-to-day for a fintech operator.</p><h3>Step-by-step</h3><ol><li>Capture the requirement.</li><li>Architect the change.</li><li>Ship and observe.</li></ol>'],
                ['type' => 'callout', 'title' => 'Want a live demo?', 'text' => 'Book a 30-min walk-through with our engineering team.', 'cta' => ['label' => 'Book a meeting', 'href' => '../contact', 'variant' => 'dark']],
                ['type' => 'youtube', 'videoId' => 'dQw4w9WgXcQ', 'caption' => 'Walk-through video'],
            ],
        ],
    ],
    'relatedSlugs' => [],
];

echo "Generating sample blog…\n";
writeArticle('blog', $blog, $devDir, $prodDir);

echo "Generating sample insight…\n";
writeArticle('insights', $insights, $devDir, $prodDir);

echo "Generating sample guide…\n";
writeArticle('guides', $guide, $devDir, $prodDir);

echo "Rebuilding articles-index.json…\n";
ArticleRebuilder::rebuildArticlesIndex($devDir, $prodDir);
echo "  wrote dev/content/Resources/articles-index.json\n";

echo "Rebuilding sitemap.xml…\n";
ArticleRebuilder::rebuildSitemap($devDir, $prodDir);
echo "  wrote dev/sitemap.xml\n";

echo "Done.\n";
