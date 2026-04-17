<?php
/** @var string $text @var string $name @var string $role @var string $logo @var string $logoAlt */
$e = fn($s) => htmlspecialchars($s, ENT_QUOTES | ENT_HTML5, 'UTF-8');
?>

                  <article class="split-testimonial-card">
                    <blockquote><?= $e($text) ?></blockquote>
                    <div class="split-testimonial-author">
                      <div class="split-testimonial-info">
                        <span class="split-testimonial-name"><?= $e($name) ?></span>
                        <span class="split-testimonial-role"><?= $e($role) ?></span>
                      </div>
                      <img class="split-testimonial-logo" src="<?= $e($logo) ?>" alt="<?= $e($logoAlt) ?>" loading="lazy" />
                    </div>
                  </article>
