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
    ];

    public static function get(string $pageKey): ?array {
        return self::$pages[$pageKey] ?? null;
    }

    public static function isValid(string $pageKey): bool {
        return isset(self::$pages[$pageKey]);
    }

    public static function allKeys(): array {
        return array_keys(self::$pages);
    }
}
