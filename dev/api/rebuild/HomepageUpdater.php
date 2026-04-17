<?php
/**
 * Regenerates homepage fallback files (default.js and content.json)
 * after content is published, keeping them in sync with Firebase.
 */
class HomepageUpdater {

    /**
     * Regenerate default.js and content.json from the published data.
     *
     * @param array  $data    The full homepage content object
     * @param string $devDir  Absolute path to the dev/ directory
     * @param string $prodDir Absolute path to the prod/ directory
     * @return array          List of files written
     */
    public static function update(array $data, string $devDir, string $prodDir): array {
        $jsonFlags = JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES;
        $jsonStr   = json_encode($data, $jsonFlags);

        $contentJson = $jsonStr . "\n";
        $defaultJs   = "window.DEFAULT_CONTENT = " . $jsonStr . ";\n";

        $written = [];

        $targets = [
            [$devDir  . '/content/Home page/content.json', $contentJson],
            [$devDir  . '/content/Home page/default.js',   $defaultJs],
            [$prodDir . '/content/Home page/content.json', $contentJson],
            [$prodDir . '/content/Home page/default.js',   $defaultJs],
        ];

        foreach ($targets as [$path, $content]) {
            $dir = dirname($path);
            if (!is_dir($dir)) {
                @mkdir($dir, 0755, true);
            }
            if (file_put_contents($path, $content, LOCK_EX) !== false) {
                $written[] = $path;
            }
        }

        return $written;
    }
}
