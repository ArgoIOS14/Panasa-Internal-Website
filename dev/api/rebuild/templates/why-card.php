<?php
/** @var string $style @var string $image @var string $title @var string $text @var string $imageType @var array $tags */
$e = fn($s) => htmlspecialchars($s, ENT_QUOTES | ENT_HTML5, 'UTF-8');
?>

            <article class="feature-card <?= $e($style) ?>">
<?php if ($imageType === 'tags' && !empty($tags)): ?>
              <div class="card-image soft">
                <div class="chip-tags">
<?php foreach ($tags as $tag): ?>
                  <span><?= $e(is_array($tag) ? ($tag['text'] ?? '') : $tag) ?></span>
<?php endforeach; ?>
                </div>
              </div>
<?php else: ?>
              <img class="card-image" src="<?= $e($image) ?>" alt="<?= $e($title) ?>" loading="lazy" decoding="async" />
<?php endif; ?>
              <div>
                <h3><?= $e($title) ?></h3>
                <p><?= $e($text) ?></p>
              </div>
            </article>
