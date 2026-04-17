<?php
/** @var string $eyebrow @var string $title @var array $bullets @var string $href @var string $ctaLabel @var string $icon */
$e = fn($s) => htmlspecialchars($s, ENT_QUOTES | ENT_HTML5, 'UTF-8');
?>

                  <article class="services-slide">
                    <div class="services-feature-copy">
                      <span class="services-feature-pill"><?= $e($eyebrow) ?></span>
                      <h3><?= $e($title) ?></h3>
                      <ul class="services-feature-list">
<?php foreach ($bullets as $bullet): ?>
                        <li><?= $e(is_array($bullet) ? ($bullet['text'] ?? '') : $bullet) ?></li>
<?php endforeach; ?>
                      </ul>
                      <a class="services-feature-link" href="<?= $e($href) ?>"><?= $e($ctaLabel) ?></a>
                    </div>
                    <div class="services-feature-visual-wrap"><div class="services-feature-visual"><img class="services-visual-icon" src="<?= $e($icon) ?>" alt="<?= $e($title) ?>" loading="lazy" decoding="async" /></div></div>
                  </article>
