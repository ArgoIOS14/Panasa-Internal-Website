<?php
/**
 * Renders ONE testimonial column — the caller wraps 1-2 of these inside a
 * <article class="split-testimonial-card"><div class="split-testimonial-columns">
 * to match the structure dev/js/Home scenes/sections/sharedTestimonials.js
 * actually builds client-side.
 * @var string $text @var string $name @var string $role @var string $logo @var string $logoAlt
 */
$e = fn($s) => htmlspecialchars($s, ENT_QUOTES | ENT_HTML5, 'UTF-8');
$alt = $logoAlt !== '' ? $logoAlt : $name;
?>
                    <div class="split-testimonial-column">
                      <p><?= $e($text) ?></p>
                      <div class="split-testimonial-person">
                        <div>
                          <strong><?= $e($name) ?></strong>
                          <span><?= $e($role) ?></span>
                        </div>
                        <img src="<?= $e($logo) ?>" alt="<?= $e($alt) ?>" loading="lazy" decoding="async" />
                      </div>
                    </div>
