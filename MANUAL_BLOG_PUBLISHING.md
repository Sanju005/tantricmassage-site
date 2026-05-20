# Manual Blog Publishing Guide

This guide is the fallback workflow for publishing articles manually without Codex.

Use this when:
- the local publisher form is not working
- you want to edit files by hand
- you want a repeatable SEO-safe process

## Publishing Flow

1. Create the article page
2. Add the article card to `blog/index.html`
3. Add the article card to selected place pages
4. Add article schema to the article page
5. Add related-article schema to each selected place page
6. Update `sitemap.xml`
7. Check locally
8. Commit and push

## 1. Create the Article Page

Create a new file:

```text
blog/your-slug.html
```

Example:

```text
blog/relaxing-tantric-yoni-massage-in-kuala-lumpur.html
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
  <meta property="og:url" content="https://www.massagekl.com/blog/your-slug.html">
  <meta property="og:title" content="Your Article Title">
  <meta property="og:description" content="Your meta description here">
  <meta property="og:image" content="https://www.massagekl.com/blog/kuala-lumpur/images/your-image.jpg">
  <meta property="og:image:alt" content="Your image alt text">
  <meta property="og:site_name" content="Massage KL">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="https://www.massagekl.com/blog/your-slug.html">
  <meta name="twitter:title" content="Your Article Title">
  <meta name="twitter:description" content="Your meta description here">
  <meta name="twitter:image" content="https://www.massagekl.com/blog/kuala-lumpur/images/your-image.jpg">
  <meta name="twitter:image:alt" content="Your image alt text">
  <link rel="canonical" href="https://www.massagekl.com/blog/your-slug.html">

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
      "@id": "https://www.massagekl.com/blog/your-slug.html"
    },
    "articleSection": [
      "Kuala Lumpur",
      "KLCC"
    ]
  }
  </script>

  <style>
    :root { --gold-main:#D4AF37; --gold-soft:#FFD700; --text-main:#FFFFFF; --text-secondary:#CCCCCC; --border-soft:rgba(212,175,55,0.18); }
    * { box-sizing:border-box; }
    body { margin:0; min-height:100vh; font-family:"Segoe UI","Helvetica Neue",Arial,sans-serif; color:var(--text-main); background:radial-gradient(circle at top,rgba(212,175,55,.12),transparent 28%),linear-gradient(180deg,#111 0%,#050505 100%); padding-bottom:6rem; }
    a { color:inherit; text-decoration:none; }
    .app-block { width:min(100%,1040px); margin:0 auto; }
    .article-shell { padding:2rem 1rem 5rem; }
    .article-card { border:1px solid var(--border-soft); border-radius:2rem; background:linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,.02)); overflow:hidden; box-shadow:0 24px 70px rgba(0,0,0,.45); }
    .featured-media { aspect-ratio:16/9; padding:.75rem; background:linear-gradient(180deg,rgba(255,255,255,.04),rgba(255,255,255,.02)); }
    .featured-media img { width:100%; height:100%; display:block; object-fit:cover; object-position:center; border-radius:1.4rem; }
    .content { padding:1.5rem; }
    .breadcrumbs { display:flex; align-items:center; gap:.45rem; flex-wrap:wrap; margin-bottom:1rem; color:rgba(255,255,255,.62); font-size:.78rem; }
    .breadcrumbs a { color:var(--gold-main); }
    .category { color:var(--gold-main); font-size:.74rem; font-weight:700; letter-spacing:.24em; text-transform:uppercase; }
    .article-title { max-width:24ch; margin:.8rem 0 0; font-size:clamp(1.8rem,5vw,3.2rem); line-height:1.05; }
    .meta { margin-top:1rem; color:var(--text-secondary); font-size:.9rem; }
    .tags { display:flex; flex-wrap:wrap; gap:.5rem; margin-top:1.25rem; }
    .tag { border:1px solid rgba(212,175,55,.24); border-radius:999px; padding:.38rem .7rem; color:rgba(255,255,255,.78); font-size:.76rem; }
    .article-body { margin-top:1.8rem; color:var(--text-secondary); font-size:1rem; line-height:1.68; }
    .article-body p { margin:1rem 0 0; }
    .article-body h2 { color:var(--text-main); font-size:1.3rem; line-height:1.3; margin:2rem 0 0; font-weight:800; }
    .article-body ul { padding-left:1.35rem; margin:.85rem 0 1rem; }
    .article-body li { margin:.45rem 0; }
  </style>
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
    <a href="/blog/your-slug.html" class="mt-5 inline-flex text-sm font-semibold" style="color: var(--gold-soft);">Read article</a>
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
<a href="/blog/your-slug.html" class="card card-link">
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
<a href="/blog/your-slug.html" class="article-card luxury-card rounded-[1.75rem] transition hover:-translate-y-1">
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
      "url": "https://www.massagekl.com/blog/your-slug.html",
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

Add a new URL entry:

```xml
<url>
  <loc>https://www.massagekl.com/blog/your-slug.html</loc>
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
2. Create `blog/your-slug.html`
3. Add card to `blog/index.html`
4. Add card to selected place pages
5. Add related-article schema to selected place pages
6. Update `sitemap.xml`
7. Test locally
8. Commit and push
9. Check live site after Cloudflare deploy

## 11. Recommended URLs to Check

After deploy, verify:

- `https://www.massagekl.com/blog/your-slug.html`
- `https://www.massagekl.com/blog/`
- each selected place page

Hard refresh with:

```text
Ctrl + F5
```
