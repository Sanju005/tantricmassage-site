# Manual Blog Publishing Guide

This guide is the fallback workflow for publishing articles manually without Codex.

## Recommended Method

Use `start-blog-publisher.bat` for every new article. It opens a local form that creates the article page, updates the blog and selected local pages, adds structured data, and updates `sitemap.xml`.

Only fill in these eight fields in the form:

- Title
- Category
- Main booking page
- Content
- Relevant place pages
- Meta description
- Featured image path
- Image alt text
- Focus keyword

The tool automatically creates the slug, excerpt, canonical URL, `index, follow` setting, standard article schema, sitemap entry, local-page links, and one direct link to the main booking page you select.

Before you publish, prepare:

- One clear focus keyword, such as `tantric massage in Kuala Lumpur`.
- A clear, unique article title.
- A meta description that explains the article and includes the focus keyword naturally.
- Useful headings and real content - there is no fixed minimum word count, but thin articles rank worse.
- One relevant local page selection. Select more only when the article genuinely helps those areas.

Do not create the same article again for Cheras, Bangsar, KLCC, and other areas. Publish one strong article under `massage-kuala-lumpur/`, then select the relevant local pages so the tool adds direct internal links.

### Safety Features

- **Preview** — click `Preview` before `Post` to open the generated article in a new tab. Nothing is written to disk until you click `Post`.
- **Overwrite / duplicate warnings** — if the slug already exists, the focus keyword matches another article, or the featured image path is not found locally, the tool stops and shows the warnings instead of publishing. Review them, then click `Publish Anyway` if you are sure.
- **Automatic backups** — every file the tool is about to change is copied first into `.blog-publisher-backups/<timestamp>/` before anything is overwritten. If a publish goes wrong, restore the affected files from that folder. This folder is git-ignored and safe to delete once you no longer need the snapshot.
- **All-or-nothing writes** — the tool builds every file change in memory first and only starts writing once every insertion succeeds, so a failure partway through never leaves the site half-updated.

Use this when:
- the local publisher form is not working
- you want to edit files by hand
- you want a repeatable SEO-safe process

## Publishing Flow

1. Create the article page under `massage-kuala-lumpur/`
2. Create the `/blog/` redirect stub for the old URL
3. Add the article card to `blog/index.html`
4. Add the article card to selected place pages
5. Add article schema to the article page
6. Add related-article schema to each selected place page
7. Update `sitemap.xml`
8. Check locally
9. Commit and push

## Ordering Rule

Always keep the latest article at the top of every hub page.

This includes:
- `blog/index.html`
- blog category hubs such as `blog/kuala-lumpur/index.html`, `blog/klcc/index.html`, `blog/bangsar/index.html`, and `blog/mont-kiara/index.html`
- place hubs such as `massage-kuala-lumpur/index.html`, `massage-klcc/index.html`, `massage-bangsar/index.html`, and `massage-mont-kiara/index.html`
- topic hubs such as `tantric-yoni-massage-for-ladies-couples-in-kl/index.html`, `ladies-massage-in-kl/index.html`, and `couples-massage-in-kl/index.html`

If you edit cards manually, insert the newest article first. As a cleanup pass, run:

```text
node scripts/blog-publisher-server.js --repair-sort
```

## 1. Create the Article Page

There is one structure for every article now: it lives under `massage-kuala-lumpur/`, in its own folder, pink-themed like the rest of the site.

Create a new file:

```text
massage-kuala-lumpur/your-slug/index.html
```

Example:

```text
massage-kuala-lumpur/relaxing-tantric-yoni-massage-in-kuala-lumpur/index.html
```

Use this structure:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Article Title</title>
  <meta name="description" content="Your meta description here">
  <meta property="og:type" content="article">
  <meta property="og:url" content="https://www.massagekl.com/massage-kuala-lumpur/your-slug/">
  <meta property="og:title" content="Your Article Title">
  <meta property="og:description" content="Your meta description here">
  <meta property="og:image" content="https://www.massagekl.com/blog/kuala-lumpur/images/your-image.jpg">
  <meta property="og:image:alt" content="Your image alt text">
  <meta property="og:site_name" content="Massage KL">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="https://www.massagekl.com/massage-kuala-lumpur/your-slug/">
  <meta name="twitter:title" content="Your Article Title">
  <meta name="twitter:description" content="Your meta description here">
  <meta name="twitter:image" content="https://www.massagekl.com/blog/kuala-lumpur/images/your-image.jpg">
  <meta name="twitter:image:alt" content="Your image alt text">
  <link rel="canonical" href="https://www.massagekl.com/massage-kuala-lumpur/your-slug/">
  <!-- FOCUS_KEYWORD: your focus keyword here -->
  <!-- The publisher tool scans this exact marker to warn about keyword reuse
       across articles. Manual articles should include it too, unescaped. -->

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": "Your Article Title",
    "description": "Your meta description here",
    "image": [
      "https://www.massagekl.com/blog/kuala-lumpur/images/your-image.jpg"
    ],
    "author": {
      "@type": "Organization",
      "name": "Massage KL"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Massage KL",
      "logo": {
        "@type": "ImageObject",
        "url": "https://www.massagekl.com/images/logo.png"
      }
    },
    "datePublished": "2026-05-20",
    "dateModified": "2026-05-20",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": "https://www.massagekl.com/massage-kuala-lumpur/your-slug/"
    },
    "articleSection": [
      "Kuala Lumpur",
      "KLCC"
    ]
  }
  </script>

  <link rel="preload" href="/styles/tailwind.css" as="style">
  <link rel="stylesheet" href="/styles/tailwind.css">
  <link rel="stylesheet" href="/styles/blog-post.css">
  <link rel="stylesheet" href="/styles/pink-theme-global.css">
</head>
<body>
  <main class="article-shell">
    <article class="app-block article-card">
      <div class="featured-media">
        <img src="/blog/kuala-lumpur/images/your-image.jpg" alt="Your image alt text" width="1600" height="900">
      </div>
      <div class="content">
        <nav class="breadcrumbs" aria-label="Breadcrumb">
          <a href="/">Home</a><span>/</span><a href="/massage-kuala-lumpur/">Kuala Lumpur Massage</a><span>/</span><span>Your Article Title</span>
        </nav>
        <a href="/massage-kuala-lumpur/" class="category">Kuala Lumpur</a>
        <h1 class="article-title">Your Article Title</h1>
        <p class="meta">Created on May 20, 2026 by Massage KL</p>
        <div class="tags">
          <span class="tag">Kuala Lumpur</span>
          <span class="tag">KLCC</span>
        </div>
        <div class="article-body">
          <p>Write your intro here.</p>
          <h2>Your Section Heading</h2>
          <p>Write your content here.</p>
          <ul>
            <li>Point one</li>
            <li>Point two</li>
          </ul>
        </div>
      </div>
    </article>
  </main>
</body>
</html>
```

The `<link rel="stylesheet" href="/styles/pink-theme-global.css">` at the end is what makes it pink instead of the old dark theme — it must load after `blog-post.css`.

### 1b. Create the `/blog/` redirect stub

Old links to `/blog/your-slug.html` should still work. Create:

```text
blog/your-slug.html
```

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0; url=/massage-kuala-lumpur/your-slug/">
  <link rel="canonical" href="https://www.massagekl.com/massage-kuala-lumpur/your-slug/">
  <meta name="robots" content="noindex,follow">
  <title>Redirecting...</title>
  <script>window.location.replace('/massage-kuala-lumpur/your-slug/');</script>
  <link rel="stylesheet" href="/styles/pink-theme-global.css">
</head>
<body></body>
</html>
```

## 2. Image Rules

Use image paths like this:

```text
/blog/kuala-lumpur/images/your-image.jpg
```

Do not use local Windows paths like this:

```text
D:\tantric-site\blog\kuala-lumpur\images\your-image.jpg
```

Good alt text:

```text
Relaxing massage setting in Kuala Lumpur
```

Bad alt text:

```text
image1
```

## 3. Add the Article Card to `blog/index.html`

Open:

```text
blog/index.html
```

Add a card in the main blog listing:

```html
<article class="card">
  <div class="post-image" style="background-image: url('/blog/kuala-lumpur/images/your-image.jpg');"></div>
  <div class="p-6">
    <p class="text-xs font-bold uppercase tracking-[0.24em]" style="color: var(--gold-main);">Kuala Lumpur</p>
    <h2 class="mt-3 text-2xl font-semibold leading-tight">Your Article Title</h2>
    <div class="mt-4 flex flex-wrap gap-2">
      <span class="tag">Kuala Lumpur</span>
      <span class="tag">KLCC</span>
    </div>
    <p class="mt-4 text-sm leading-7" style="color: var(--text-secondary);">Your short excerpt here.</p>
    <a href="/massage-kuala-lumpur/your-slug/" class="mt-5 inline-flex text-sm font-semibold" style="color: var(--gold-soft);">Read article</a>
  </div>
</article>
```

## 4. Add the Article Card to Selected Place Pages

Examples:
- `massage-kuala-lumpur/index.html`
- `massage-klcc/index.html`
- `massage-bangsar/index.html`
- `massage-brickfields.html`

### For Kuala Lumpur simple card style

```html
<a href="/massage-kuala-lumpur/your-slug/" class="card card-link">
  <div class="card-image" style="background-image:url('/blog/kuala-lumpur/images/your-image.jpg');" role="img" aria-label="Your image alt text"></div>
  <div class="card-body">
    <p class="card-category">Kuala Lumpur Article</p>
    <p class="card-date">Created: May 20, 2026</p>
    <h2 class="card-title">Your Article Title</h2>
    <p class="card-copy">Your short excerpt here.</p>
  </div>
</a>
```

### For KLCC/Bangsar rich card style

```html
<a href="/massage-kuala-lumpur/your-slug/" class="article-card luxury-card rounded-[1.75rem] transition hover:-translate-y-1">
  <div class="article-card__image" style="background-image: url('/blog/kuala-lumpur/images/your-image.jpg');" role="img" aria-label="Your image alt text"></div>
  <div class="p-6">
    <p class="text-xs uppercase tracking-[0.24em]" style="color: var(--gold-main);">KLCC Article</p>
    <p class="mt-3 text-xs uppercase tracking-[0.22em]" style="color: var(--text-secondary);">Created: May 20, 2026</p>
    <h2 class="mt-3 text-xl font-semibold">Your Article Title</h2>
    <div class="mt-4 flex flex-wrap gap-2">
      <span class="article-tag">KLCC</span>
      <span class="article-tag">Featured Article</span>
    </div>
    <p class="mt-4 text-sm leading-7" style="color: var(--text-secondary);">Your short excerpt here.</p>
    <span class="mt-5 inline-flex text-sm font-semibold" style="color: var(--gold-soft);">Read article &rarr;</span>
  </div>
</a>
```

## 5. Add Related-Article Schema to Each Selected Place Page

Insert before `</head>` in each selected place page:

```html
<!-- AUTO_RELATED_ARTICLE_SCHEMA_START:your-slug -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "KLCC related articles",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "url": "https://www.massagekl.com/massage-kuala-lumpur/your-slug/",
      "name": "Your Article Title"
    }
  ],
  "mainEntityOfPage": "https://www.massagekl.com/massage-klcc/"
}
</script>
<!-- AUTO_RELATED_ARTICLE_SCHEMA_END:your-slug -->
```

Change:
- `name`
- `url`
- `mainEntityOfPage`
- article title

## 6. Update `sitemap.xml`

Add a new URL entry (the canonical page only — the `/blog/` redirect stub is `noindex` and should not be in the sitemap):

```xml
<url>
  <loc>https://www.massagekl.com/massage-kuala-lumpur/your-slug/</loc>
  <lastmod>2026-05-20</lastmod>
  <changefreq>monthly</changefreq>
  <priority>0.7</priority>
</url>
```

Also update `lastmod` on:
- `https://www.massagekl.com/blog/`
- the selected place page URLs

## 7. Manual SEO Checklist

Before publishing, check:

- unique title
- unique slug
- real meta description
- featured image path is correct
- alt text is clear
- article has heading structure
- article is linked from `blog/index.html`
- article is linked from relevant place pages only
- schema is added
- sitemap is updated

## 8. Best Practices

For better SEO:

- use one main article page as the full content source
- do not paste the full same article into every place page
- on place pages, only add a card or short excerpt with a link
- select only relevant place pages
- keep image paths web-safe
- use clear titles and readable excerpts

## 9. Git Publish

After editing files:

```bash
git add .
git commit -m "Add new blog article"
git push
```

Then wait for Cloudflare Pages to deploy.

## 10. Quick Publish Checklist

1. Add image to `blog/kuala-lumpur/images/`
2. Create `massage-kuala-lumpur/your-slug/index.html`
3. Create the `blog/your-slug.html` redirect stub
4. Add card to `blog/index.html`
5. Add card to selected place pages
6. Add related-article schema to selected place pages
7. Update `sitemap.xml`
8. Test locally
9. Commit and push
10. Check live site after Cloudflare deploy

## 11. Recommended URLs to Check

After deploy, verify:

- `https://www.massagekl.com/massage-kuala-lumpur/your-slug/` (loads the pink article)
- `https://www.massagekl.com/blog/your-slug.html` (redirects to the URL above)
- `https://www.massagekl.com/blog/`
- each selected place page

Hard refresh with:

```text
Ctrl + F5
```
