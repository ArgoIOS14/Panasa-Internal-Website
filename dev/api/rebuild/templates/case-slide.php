<?php
/** @var int $index @var string $eyebrow @var string $title @var string $text @var array $cta @var array $metrics @var string $image */
$e = fn($s) => htmlspecialchars($s, ENT_QUOTES | ENT_HTML5, 'UTF-8');

// Build style attribute for background image (slides after first)
$styleAttr = '';
if ($index > 0 && !empty($image)) {
    $imgPath = str_starts_with($image, 'assets/') ? '../' . $image : $image;
    $styleAttr = ' style="--case-slide-bg: url(' . $e($imgPath) . ')"';
}

$ctaLabel = is_array($cta) ? ($cta['label'] ?? 'Read Full Case Study') : ($cta ?: 'Read Full Case Study');
$ctaHref  = is_array($cta) ? ($cta['href'] ?? 'contact') : 'contact';
?>

              <article class="slide">
                <div class="results-card"<?= $styleAttr ?>>
                  <div class="results-copy">
                    <span class="eyebrow"><?= $e($eyebrow) ?></span>
                    <h3><?= $e($title) ?></h3>
                    <p><?= $e($text) ?></p>
                    <a class="btn btn-dark results-cta" href="<?= $e($ctaHref) ?>"><?= $e($ctaLabel) ?></a>
                  </div>
<?php if (!empty($metrics)): ?>
                  <div class="results-metrics">
<?php foreach ($metrics as $m): ?>
                    <div class="results-metric"><span class="results-metric-value"><?= $e($m['value'] ?? '') ?></span><span class="results-metric-label"><?= $e($m['label'] ?? '') ?></span></div>
<?php endforeach; ?>
                  </div>
<?php endif; ?>
                </div>
              </article>
