<?php
/**
 * Maps admin page keys to Firebase paths, HTML files, and rebuild tier.
 */
class PageRegistry {
    const TIER_META_ONLY = 'meta-only';
    const TIER_FULL      = 'full';

    private static $pages = [
        'home' => [
            'fbPath'   => 'pages/home',
            'htmlFile' => 'index.html',
            'tier'     => self::TIER_FULL,
        ],
        'about' => [
            'fbPath'   => 'pages/about',
            'htmlFile' => 'about.html',
            'tier'     => self::TIER_FULL,
        ],
        'aiAcceleratedEngineering' => [
            'fbPath'   => 'content',
            'htmlFile' => 'ai-accelerated-fintech-engineering.html',
            'tier'     => self::TIER_META_ONLY,
        ],
        'aiGovernance' => [
            'fbPath'   => 'pages/aiGovernance',
            'htmlFile' => 'ai-governance.html',
            'tier'     => self::TIER_META_ONLY,
        ],
        'legacyModernisation' => [
            'fbPath'   => 'pages/legacyModernisation',
            'htmlFile' => 'ai-powered-legacy-modernisation.html',
            'tier'     => self::TIER_META_ONLY,
        ],
        'intelligentOperations' => [
            'fbPath'   => 'pages/intelligentOperations',
            'htmlFile' => 'intelligent-operations.html',
            'tier'     => self::TIER_META_ONLY,
        ],
        'servicesOverview' => [
            'fbPath'   => 'pages/servicesOverview',
            'htmlFile' => 'services.html',
            'tier'     => self::TIER_META_ONLY,
        ],
        'contact' => [
            'fbPath'   => 'pages/contact',
            'htmlFile' => 'contact.html',
            'tier'     => self::TIER_META_ONLY,
        ],
        'careers' => [
            'fbPath'   => 'pages/careers',
            'htmlFile' => 'careers.html',
            'tier'     => self::TIER_META_ONLY,
        ],
        'privacyPolicy' => [
            'fbPath'   => 'pages/privacyPolicy',
            'htmlFile' => 'privacy-policy.html',
            'tier'     => self::TIER_META_ONLY,
        ],
        'resources' => [
            'fbPath'   => 'pages/resources',
            'htmlFile' => 'resources.html',
            'tier'     => self::TIER_META_ONLY,
        ],
    ];

    public static function get(string $pageKey): ?array {
        if (isset(self::$pages[$pageKey])) return self::$pages[$pageKey];
        return self::resolveDynamic($pageKey);
    }

    public static function isValid(string $pageKey): bool {
        if (isset(self::$pages[$pageKey])) return true;
        return self::resolveDynamic($pageKey) !== null;
    }

    public static function allKeys(): array {
        return array_keys(self::$pages);
    }

    /**
     * Dynamic article keys: blog:<slug>, insights:<slug>, guides:<slug>
     */
    public static function resolveDynamic(string $pageKey): ?array {
        if (!preg_match('/^(blog|insights|guides):([a-z0-9]+(?:-[a-z0-9]+)*)$/', $pageKey, $m)) return null;
        $type = $m[1];
        $slug = $m[2];
        $folderUrl = $type === 'blog' ? 'blog' : ($type === 'insights' ? 'insights' : 'guides');
        $folderJson = $type === 'blog' ? 'Blog' : ($type === 'insights' ? 'Insights' : 'Guide');
        return [
            'type'        => 'article',
            'articleType' => $type,
            'slug'        => $slug,
            'fbPath'      => "pages/articles/{$type}/{$slug}",
            'htmlFile'    => "{$folderUrl}/{$slug}.html",
            'jsonFile'    => "content/{$folderJson}/{$slug}.json",
            'jsFile'      => "content/{$folderJson}/{$slug}.default.js",
            'tier'        => self::TIER_FULL,
        ];
    }
}
