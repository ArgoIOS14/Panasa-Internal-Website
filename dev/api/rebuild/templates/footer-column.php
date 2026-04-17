<?php
/** @var string $heading @var array $links */
$e = fn($s) => htmlspecialchars($s, ENT_QUOTES | ENT_HTML5, 'UTF-8');
?>

              <div>
                <h4><?= $e($heading) ?></h4>
<?php foreach ($links as $link): ?>
                <a href="<?= $e($link['href'] ?? '#') ?>"><?= $e($link['label'] ?? '') ?><?php if (!empty($link['badge'])): ?> <span class="footer-link-badge footer-link-badge-<?= $e($link['badge']) ?>"><?= $e($link['badgeText'] ?? strtoupper($link['badge'])) ?></span><?php endif; ?></a>
<?php endforeach; ?>
              </div>
