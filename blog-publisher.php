<?php
declare(strict_types=1);

$siteBaseUrl = 'https://www.massagekl.com';
$defaultAuthor = 'Massage KL';
$defaultLogoUrl = $siteBaseUrl . '/images/logo.png';

$categories = [
    'kuala-lumpur' => 'Kuala Lumpur (KL)',
    'klcc' => 'KLCC',
    'bukit-bintang' => 'Bukit Bintang',
    'bangsar' => 'Bangsar',
    'mid-valley' => 'Mid Valley',
    'mont-kiara' => 'Mont Kiara',
    'sri-petaling' => 'Sri Petaling',
    'cheras' => 'Cheras',
    'ampang' => 'Ampang',
    'petaling-jaya' => 'Petaling Jaya',
    'subang-jaya' => 'Subang Jaya',
    'puchong' => 'Puchong',
    'damansara' => 'Damansara',
    'ttdi' => 'TTDI',
    'setapak' => 'Setapak',
    'cyberjaya' => 'Cyberjaya',
    'putrajaya' => 'Putrajaya',
];

$form = [
    'title' => '',
    'slug' => '',
    'meta_description' => '',
    'featured_image' => '',
    'alt_text' => '',
    'content' => '',
    'published_date' => date('Y-m-d'),
    'published_by' => $defaultAuthor,
    'selected_categories' => ['kuala-lumpur'],
];

$generatedHtml = '';
$generatedSchema = '';
$savedPath = '';
$errors = [];
$successMessage = '';

function e(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
}

function slugify(string $value): string
{
    $value = strtolower(trim($value));
    $value = preg_replace('/[^a-z0-9]+/i', '-', $value) ?? '';
    return trim($value, '-');
}

function normalizeLines(string $value): string
{
    $value = str_replace(["\r\n", "\r"], "\n", trim($value));
    return preg_replace("/\n{3,}/", "\n\n", $value) ?? $value;
}

function buildContentHtml(string $content): string
{
    $content = normalizeLines($content);
    if ($content === '') {
        return '';
    }

    $blocks = preg_split("/\n\s*\n/", $content) ?: [];
    $html = [];

    foreach ($blocks as $block) {
        $block = trim($block);
        if ($block === '') {
            continue;
        }

        if (preg_match('/^##\s+(.+)$/m', $block, $matches) === 1) {
            $heading = trim($matches[1]);
            $body = trim(preg_replace('/^##\s+.+$/m', '', $block, 1) ?? '');
            $html[] = '<h2 class="mt-8 text-2xl font-semibold">' . e($heading) . '</h2>';
            if ($body !== '') {
                $html[] = '<p class="mt-4 text-base leading-8 text-white/72">' . nl2br(e($body), false) . '</p>';
            }
            continue;
        }

        if (preg_match('/^###\s+(.+)$/m', $block, $matches) === 1) {
            $heading = trim($matches[1]);
            $body = trim(preg_replace('/^###\s+.+$/m', '', $block, 1) ?? '');
            $html[] = '<h3 class="mt-6 text-xl font-semibold">' . e($heading) . '</h3>';
            if ($body !== '') {
                $html[] = '<p class="mt-3 text-base leading-8 text-white/72">' . nl2br(e($body), false) . '</p>';
            }
            continue;
        }

        if (str_starts_with($block, '- ')) {
            $items = preg_split('/\n-\s+/', preg_replace('/^-\s+/', '', $block) ?: '') ?: [];
            $html[] = '<ul class="mt-4 list-disc space-y-2 pl-6 text-base leading-8 text-white/72">';
            foreach ($items as $item) {
                $html[] = '<li>' . e(trim($item)) . '</li>';
            }
            $html[] = '</ul>';
            continue;
        }

        $html[] = '<p class="mt-5 text-base leading-8 text-white/72">' . nl2br(e($block), false) . '</p>';
    }

    return implode("\n", $html);
}

function buildSchema(
    string $title,
    string $description,
    string $imageUrl,
    string $articleUrl,
    string $publishedBy,
    string $logoUrl,
    string $publishedDate,
    array $categoryLabels
): string {
    $schema = [
        '@context' => 'https://schema.org',
        '@type' => 'BlogPosting',
        'headline' => $title,
        'description' => $description,
        'image' => [$imageUrl],
        'author' => [
            '@type' => 'Organization',
            'name' => $publishedBy,
        ],
        'publisher' => [
            '@type' => 'Organization',
            'name' => $publishedBy,
            'logo' => [
                '@type' => 'ImageObject',
                'url' => $logoUrl,
            ],
        ],
        'datePublished' => $publishedDate,
        'dateModified' => $publishedDate,
        'mainEntityOfPage' => [
            '@type' => 'WebPage',
            '@id' => $articleUrl,
        ],
        'articleSection' => array_values($categoryLabels),
    ];

    return json_encode($schema, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) ?: '{}';
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $form['title'] = trim((string) ($_POST['title'] ?? ''));
    $form['slug'] = slugify((string) ($_POST['slug'] ?? ''));
    $form['meta_description'] = trim((string) ($_POST['meta_description'] ?? ''));
    $form['featured_image'] = trim((string) ($_POST['featured_image'] ?? ''));
    $form['alt_text'] = trim((string) ($_POST['alt_text'] ?? ''));
    $form['content'] = trim((string) ($_POST['content'] ?? ''));
    $form['published_date'] = trim((string) ($_POST['published_date'] ?? date('Y-m-d')));
    $form['published_by'] = trim((string) ($_POST['published_by'] ?? $defaultAuthor));
    $form['selected_categories'] = array_values(array_intersect(array_keys($categories), (array) ($_POST['categories'] ?? [])));

    if ($form['title'] === '') {
        $errors[] = 'Title is required.';
    }
    if ($form['slug'] === '') {
        $errors[] = 'Slug is required.';
    }
    if ($form['featured_image'] === '') {
        $errors[] = 'Featured image URL or site path is required.';
    }
    if ($form['alt_text'] === '') {
        $errors[] = 'Alt text is required.';
    }
    if ($form['content'] === '') {
        $errors[] = 'Content is required.';
    }
    if ($form['published_by'] === '') {
        $errors[] = 'Published by is required.';
    }
    if ($form['meta_description'] === '') {
        $errors[] = 'Meta description is required.';
    }
    if ($form['selected_categories'] === []) {
        $errors[] = 'Select at least one category.';
    }

    $primaryCategorySlug = $form['selected_categories'][0] ?? 'kuala-lumpur';
    $primaryCategoryLabel = $categories[$primaryCategorySlug] ?? 'Kuala Lumpur (KL)';
    $categoryLabels = array_map(static fn(string $slug): string => $categories[$slug], $form['selected_categories']);
    $articleUrl = $siteBaseUrl . '/blog/' . $form['slug'] . '.html';
    $imageUrl = preg_match('#^https?://#i', $form['featured_image']) === 1
        ? $form['featured_image']
        : $siteBaseUrl . '/' . ltrim($form['featured_image'], '/');
     $displayDate = date('F j, Y', strtotime($form['published_date']) ?: time());
     $contentHtml = buildContentHtml($form['content']);
    $safeTitle = e($form['title']);
    $safeMetaDescription = e($form['meta_description']);
    $safeArticleUrl = e($articleUrl);
    $safeImageUrl = e($imageUrl);
    $safeFeaturedImage = e($form['featured_image']);
    $safeAltText = e($form['alt_text']);
    $safePrimaryCategorySlug = e($primaryCategorySlug);
    $safePrimaryCategoryLabel = e($primaryCategoryLabel);
    $safeDisplayDate = e($displayDate);
    $safePublishedBy = e($form['published_by']);

    $generatedSchema = buildSchema(
        $form['title'],
        $form['meta_description'],
        $imageUrl,
        $articleUrl,
        $form['published_by'],
        $defaultLogoUrl,
        $form['published_date'],
        $categoryLabels
    );

    $tagsHtml = '';
    foreach ($categoryLabels as $label) {
        $tagsHtml .= '      <span>' . e($label) . "</span>\n";
    }

    $generatedHtml = <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{$safeTitle}</title>
  <meta name="description" content="{$safeMetaDescription}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="{$safeArticleUrl}">
  <meta property="og:title" content="{$safeTitle}">
  <meta property="og:description" content="{$safeMetaDescription}">
  <meta property="og:image" content="{$safeImageUrl}">
  <meta property="og:image:alt" content="{$safeAltText}">
  <meta property="og:site_name" content="Massage KL">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="{$safeArticleUrl}">
  <meta name="twitter:title" content="{$safeTitle}">
  <meta name="twitter:description" content="{$safeMetaDescription}">
  <meta name="twitter:image" content="{$safeImageUrl}">
  <meta name="twitter:image:alt" content="{$safeAltText}">
  <link rel="canonical" href="{$safeArticleUrl}">
  <script type="application/ld+json">
{$generatedSchema}
  </script>
  <link rel="preload" href="/styles/tailwind.css" as="style">
  <link rel="stylesheet" href="/styles/tailwind.css">
</head>
<body class="min-h-screen bg-black text-white">
  <article class="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
    <a href="/blog/{$safePrimaryCategorySlug}/" class="text-sm font-semibold text-amber-300">Back to {$safePrimaryCategoryLabel}</a>

    <div
      class="mt-6 min-h-[280px] rounded-[1.5rem] bg-cover bg-center"
      style="background-image:url('{$safeFeaturedImage}');"
      role="img"
      aria-label="{$safeAltText}"></div>

    <div class="mt-6 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
{$tagsHtml}    </div>

    <p class="mt-4 text-xs uppercase tracking-[0.22em] text-white/55">Created: {$safeDisplayDate}</p>
    <p class="mt-2 text-xs uppercase tracking-[0.22em] text-white/55">Published By: {$safePublishedBy}</p>

    <h1 class="mt-4 text-4xl font-bold leading-tight">{$safeTitle}</h1>

{$contentHtml}
  </article>
</body>
</html>
HTML;

    if ($errors === [] && isset($_POST['save_post'])) {
        $targetPath = __DIR__ . DIRECTORY_SEPARATOR . 'blog' . DIRECTORY_SEPARATOR . $form['slug'] . '.html';
        $writeResult = @file_put_contents($targetPath, $generatedHtml);

        if ($writeResult === false) {
            $errors[] = 'The article could not be saved to ' . $targetPath . '.';
        } else {
            $savedPath = $targetPath;
            $successMessage = 'Post saved successfully.';
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Blog Publisher</title>
  <link rel="preload" href="/styles/tailwind.css" as="style">
  <link rel="stylesheet" href="/styles/tailwind.css">
  <style>
    :root {
      --page: #f4efe7;
      --panel: #fffaf2;
      --ink: #1f1a17;
      --muted: #6d6258;
      --line: #d9c7ad;
      --accent: #8f5b2e;
      --accent-soft: #f2e4d3;
      --success: #1f7a4d;
      --danger: #a73434;
    }

    body {
      margin: 0;
      background:
        radial-gradient(circle at top left, rgba(143, 91, 46, 0.18), transparent 28%),
        linear-gradient(180deg, #fbf4ea 0%, #f0e5d4 100%);
      color: var(--ink);
      font-family: Georgia, "Times New Roman", serif;
    }

    .shell {
      width: min(1240px, calc(100% - 2rem));
      margin: 0 auto;
      padding: 2rem 0 3rem;
    }

    .layout {
      display: grid;
      gap: 1.5rem;
      grid-template-columns: minmax(0, 1.15fr) minmax(320px, 0.85fr);
    }

    .panel {
      background: rgba(255, 250, 242, 0.92);
      border: 1px solid var(--line);
      border-radius: 24px;
      box-shadow: 0 20px 50px rgba(79, 49, 22, 0.08);
      overflow: hidden;
    }

    .panel-body {
      padding: 1.5rem;
    }

    .hero {
      display: flex;
      align-items: end;
      min-height: 180px;
      padding: 1.5rem;
      background: linear-gradient(135deg, #2c1d12, #8f5b2e);
      color: #fffaf2;
    }

    .hero h1,
    .panel h2,
    .panel h3 {
      margin: 0;
      font-family: "Segoe UI", Arial, sans-serif;
    }

    .hero p,
    .helper,
    .meta {
      color: var(--muted);
      font-family: "Segoe UI", Arial, sans-serif;
    }

    .hero p {
      color: rgba(255, 250, 242, 0.8);
      margin: 0.75rem 0 0;
      max-width: 42rem;
    }

    .grid {
      display: grid;
      gap: 1rem;
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .field,
    .field-full {
      display: flex;
      flex-direction: column;
      gap: 0.45rem;
      margin-bottom: 1rem;
    }

    .field-full {
      grid-column: 1 / -1;
    }

    label {
      font: 600 0.95rem "Segoe UI", Arial, sans-serif;
    }

    input,
    textarea,
    select {
      width: 100%;
      padding: 0.9rem 1rem;
      border: 1px solid var(--line);
      border-radius: 14px;
      background: #fff;
      color: var(--ink);
      box-sizing: border-box;
      font: 400 0.98rem "Segoe UI", Arial, sans-serif;
    }

    textarea {
      min-height: 160px;
      resize: vertical;
    }

    select[multiple] {
      min-height: 240px;
    }

    .actions {
      display: flex;
      gap: 0.85rem;
      flex-wrap: wrap;
      margin-top: 0.5rem;
    }

    button {
      border: 0;
      border-radius: 999px;
      padding: 0.95rem 1.3rem;
      cursor: pointer;
      font: 700 0.95rem "Segoe UI", Arial, sans-serif;
    }

    .primary {
      background: var(--accent);
      color: #fff;
    }

    .secondary {
      background: var(--accent-soft);
      color: var(--accent);
    }

    .alert {
      margin-bottom: 1rem;
      padding: 1rem 1.1rem;
      border-radius: 14px;
      font: 500 0.95rem "Segoe UI", Arial, sans-serif;
    }

    .alert-error {
      background: #fff0f0;
      border: 1px solid rgba(167, 52, 52, 0.22);
      color: var(--danger);
    }

    .alert-success {
      background: #eef9f2;
      border: 1px solid rgba(31, 122, 77, 0.2);
      color: var(--success);
    }

    .code-box {
      min-height: 240px;
      background: #24190f;
      color: #f7ead7;
      font-family: Consolas, "Courier New", monospace;
      font-size: 0.88rem;
      white-space: pre-wrap;
    }

    .preview {
      background: #120d09;
      color: #fff;
      border-radius: 18px;
      padding: 1.25rem;
      font-family: "Segoe UI", Arial, sans-serif;
    }

    .preview h3 {
      margin-top: 0;
      margin-bottom: 0.75rem;
      color: #ffd88d;
    }

    .preview-frame {
      width: 100%;
      min-height: 420px;
      border: 1px solid rgba(255, 216, 141, 0.16);
      border-radius: 18px;
      background: #000;
    }

    @media (max-width: 1024px) {
      .layout {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <main class="shell">
    <section class="panel">
      <div class="hero">
        <div>
          <h1>Blog Post Publisher</h1>
          <p>Fill the fields like a lightweight WordPress-style editor. This page generates your article HTML, `BlogPosting` schema, and can save the post into the existing `blog/` folder.</p>
        </div>
      </div>
    </section>

    <div class="layout" style="margin-top: 1.5rem;">
      <section class="panel">
        <div class="panel-body">
          <?php if ($errors !== []): ?>
            <div class="alert alert-error">
              <?php foreach ($errors as $error): ?>
                <div><?php echo e($error); ?></div>
              <?php endforeach; ?>
            </div>
          <?php endif; ?>

          <?php if ($successMessage !== ''): ?>
            <div class="alert alert-success">
              <div><?php echo e($successMessage); ?></div>
              <?php if ($savedPath !== ''): ?>
                <div class="meta" style="margin-top: 0.35rem;"><?php echo e($savedPath); ?></div>
              <?php endif; ?>
            </div>
          <?php endif; ?>

          <h2 style="margin-bottom: 1rem;">Post Details</h2>
          <form method="post">
            <div class="grid">
              <div class="field">
                <label for="title">Title</label>
                <input id="title" name="title" type="text" value="<?php echo e($form['title']); ?>" required>
              </div>

              <div class="field">
                <label for="slug">Slug</label>
                <input id="slug" name="slug" type="text" value="<?php echo e($form['slug']); ?>" placeholder="example-article-slug" required>
              </div>

              <div class="field-full">
                <label for="meta_description">Meta Description</label>
                <textarea id="meta_description" name="meta_description" rows="3" required><?php echo e($form['meta_description']); ?></textarea>
              </div>

              <div class="field-full">
                <label for="featured_image">Featured Image URL or Site Path</label>
                <input id="featured_image" name="featured_image" type="text" value="<?php echo e($form['featured_image']); ?>" placeholder="/blog/kuala-lumpur/images/example.jpg" required>
              </div>

              <div class="field-full">
                <label for="alt_text">Alt Text</label>
                <input id="alt_text" name="alt_text" type="text" value="<?php echo e($form['alt_text']); ?>" required>
              </div>

              <div class="field">
                <label for="published_date">Published Date</label>
                <input id="published_date" name="published_date" type="date" value="<?php echo e($form['published_date']); ?>" required>
              </div>

              <div class="field">
                <label for="published_by">Published By</label>
                <input id="published_by" name="published_by" type="text" value="<?php echo e($form['published_by']); ?>" required>
              </div>

              <div class="field-full">
                <label for="categories">Category</label>
                <select id="categories" name="categories[]" multiple required>
                  <?php foreach ($categories as $slug => $label): ?>
                    <option value="<?php echo e($slug); ?>" <?php echo in_array($slug, $form['selected_categories'], true) ? 'selected' : ''; ?>>
                      <?php echo e($label); ?>
                    </option>
                  <?php endforeach; ?>
                </select>
                <div class="helper">Hold `Ctrl` or `Cmd` to select multiple categories. The first selected category is used as the primary hub link.</div>
              </div>

              <div class="field-full">
                <label for="content">Content</label>
                <textarea id="content" name="content" rows="14" required><?php echo e($form['content']); ?></textarea>
                <div class="helper">Use blank lines between paragraphs. Start lines with `##` for H2, `###` for H3, and `-` for bullet points.</div>
              </div>
            </div>

            <div class="actions">
              <button class="secondary" type="submit" name="preview_post" value="1">Generate Preview</button>
              <button class="primary" type="submit" name="save_post" value="1">Save Post to `blog/slug.html`</button>
            </div>
          </form>
        </div>
      </section>

      <section class="panel">
        <div class="panel-body">
          <h2 style="margin-bottom: 1rem;">Generated Schema</h2>
          <textarea class="code-box" readonly><?php echo e($generatedSchema); ?></textarea>

          <h2 style="margin: 1.25rem 0 1rem;">Generated HTML</h2>
          <textarea class="code-box" readonly><?php echo e($generatedHtml); ?></textarea>
        </div>
      </section>
    </div>

    <?php if ($generatedHtml !== ''): ?>
      <section class="panel" style="margin-top: 1.5rem;">
        <div class="panel-body">
          <div class="preview">
            <h3>Live Preview</h3>
            <iframe class="preview-frame" srcdoc="<?php echo e($generatedHtml); ?>"></iframe>
          </div>
        </div>
      </section>
    <?php endif; ?>
  </main>
</body>
</html>
