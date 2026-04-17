<?php
/** @var string $image @var string $title @var string $text @var string $variant @var string $bestSuitedFor @var array $bullets @var string $outcome @var string $cta */
$e = fn($s) => htmlspecialchars($s, ENT_QUOTES | ENT_HTML5, 'UTF-8');
$featuredClass = ($variant === 'featured') ? ' featured' : '';
?>

            <article class="engagement-card<?= $featuredClass ?>">
              <img class="engagement-image" src="<?= $e($image) ?>" alt="<?= $e($title) ?>" loading="lazy" decoding="async" />
              <h3><?= $e($title) ?></h3>
              <p><?= $e($text) ?></p>
<?php if (!empty($bestSuitedFor)): ?>
              <p class="engagement-best-fit">Best suited for -> <span><?= $e($bestSuitedFor) ?></span></p>
<?php endif; ?>
              <div class="engagement-includes">Includes:</div>
              <ul><?php foreach ($bullets as $bullet): ?><li><?= $e(is_array($bullet) ? ($bullet['text'] ?? '') : $bullet) ?></li><?php endforeach; ?></ul>
<?php if (!empty($outcome)): ?>
              <p class="engagement-outcome"><strong>Outcome:</strong> <?= $e($outcome) ?></p>
<?php endif; ?>
              <a class="btn btn-dark" href="contact"><?= $e(is_array($cta) ? ($cta['label'] ?? 'Talk to us') : $cta) ?></a>
            </article>
