const http = require("http");
const fs = require("fs");
const path = require("path");
const querystring = require("querystring");

const ROOT = path.resolve(__dirname, "..");
const STORE_PATH = path.join(ROOT, "data", "article-store.json");
const SITEMAP_PATH = path.join(ROOT, "sitemap.xml");
const PORT = process.env.PORT || 4173;

function loadStore() {
  return JSON.parse(fs.readFileSync(STORE_PATH, "utf8"));
}

function saveStore(store) {
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function readFile(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function writeFile(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content);
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function toAbsoluteUrl(site, urlPath) {
  if (!urlPath) return `${site.domain}${site.defaultShareImage}`;
  if (/^https?:\/\//i.test(urlPath)) return urlPath;
  return `${site.domain}${urlPath.startsWith("/") ? urlPath : `/${urlPath}`}`;
}

function formatLongDate(dateInput) {
  const date = new Date(`${dateInput}T00:00:00`);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

function replaceManagedBlock(html, markerName, replacement) {
  const pattern = new RegExp(`(<!-- ${markerName}_START:[^>]+ -->)([\\s\\S]*?)(<!-- ${markerName}_END:[^>]+ -->)`);
  return html.replace(pattern, `$1\n${replacement}\n$3`);
}

function getArticleUrl(store, article) {
  const hub = store.hubs[article.hub];
  return article.url || `/${hub.folder}/${article.slug}/`;
}

function parseContentToHtml(raw) {
  if (!raw) return "";
  if (/<[a-z][\s\S]*>/i.test(raw)) return raw;

  const lines = raw.replace(/\r/g, "").split("\n");
  const parts = [];
  let paragraph = [];
  let listOpen = false;

  function flushParagraph() {
    if (paragraph.length) {
      parts.push(`<p>${escapeHtml(paragraph.join(" "))}</p>`);
      paragraph = [];
    }
  }

  function closeList() {
    if (listOpen) {
      parts.push("</ul>");
      listOpen = false;
    }
  }

  for (const lineRaw of lines) {
    const line = lineRaw.trim();
    if (!line) {
      flushParagraph();
      closeList();
      continue;
    }

    if (line.startsWith("H2:")) {
      flushParagraph();
      closeList();
      parts.push(`<h2>${escapeHtml(line.slice(3).trim())}</h2>`);
      continue;
    }

    if (line.startsWith("H3:")) {
      flushParagraph();
      closeList();
      parts.push(`<h3>${escapeHtml(line.slice(3).trim())}</h3>`);
      continue;
    }

    if (line.startsWith("- ")) {
      flushParagraph();
      if (!listOpen) {
        parts.push("<ul>");
        listOpen = true;
      }
      parts.push(`<li>${escapeHtml(line.slice(2).trim())}</li>`);
      continue;
    }

    closeList();
    paragraph.push(line);
  }

  flushParagraph();
  closeList();
  return parts.join("\n");
}

function renderSchemaBlocks(store, article) {
  const blocks = [{
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.h1 || article.title,
    datePublished: article.createdAt,
    dateModified: article.updatedAt || article.createdAt,
    author: { "@type": "Organization", name: store.site.name },
    publisher: {
      "@type": "Organization",
      name: store.site.name,
      logo: {
        "@type": "ImageObject",
        url: toAbsoluteUrl(store.site, store.site.logoPath)
      }
    },
    image: toAbsoluteUrl(store.site, article.image || store.site.defaultShareImage),
    mainEntityOfPage: `${store.site.domain}${getArticleUrl(store, article)}`
  }];

  if (article.serviceSchemaJson) {
    const schema = JSON.parse(article.serviceSchemaJson);
    blocks.push({ "@context": "https://schema.org", ...schema });
  }

  return blocks
    .map((block) => `  <script type="application/ld+json">\n${JSON.stringify(block, null, 2)}\n  </script>`)
    .join("\n");
}

function renderArticlePage(store, article, orderedArticles) {
  const hub = store.hubs[article.hub];
  const url = `${store.site.domain}${getArticleUrl(store, article)}`;
  const metaTitle = article.metaTitle || article.title;
  const metaDescription = article.metaDescription || article.excerpt;
  const image = toAbsoluteUrl(store.site, article.image || store.site.defaultShareImage);
  const imageAlt = article.imageAlt || store.site.defaultShareImageAlt;
  const hubArticles = orderedArticles.filter((item) => item.hub === article.hub);
  const currentIndex = hubArticles.findIndex((item) => item.slug === article.slug);
  const previousArticle = currentIndex >= 0 ? hubArticles[currentIndex + 1] : null;
  const nextArticle = currentIndex > 0 ? hubArticles[currentIndex - 1] : null;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(metaTitle)}</title>
  <meta name="description" content="${escapeHtml(metaDescription)}">
  <meta name="robots" content="index, follow">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${escapeHtml(url)}">
  <meta property="og:title" content="${escapeHtml(metaTitle)}">
  <meta property="og:description" content="${escapeHtml(metaDescription)}">
  <meta property="og:image" content="${escapeHtml(image)}">
  <meta property="og:image:alt" content="${escapeHtml(imageAlt)}">
  <meta property="og:site_name" content="${escapeHtml(store.site.name)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${escapeHtml(url)}">
  <meta name="twitter:title" content="${escapeHtml(metaTitle)}">
  <meta name="twitter:description" content="${escapeHtml(metaDescription)}">
  <meta name="twitter:image" content="${escapeHtml(image)}">
  <meta name="twitter:image:alt" content="${escapeHtml(imageAlt)}">
  <link rel="canonical" href="${escapeHtml(url)}">
${renderSchemaBlocks(store, article)}
  <style>
    :root { --bg-main:#0B0B0B; --gold-main:#D4AF37; --gold-soft:#FFD700; --text-main:#FFFFFF; --text-secondary:#CCCCCC; --border-soft:rgba(212,175,55,0.18); }
    * { box-sizing:border-box; }
    body { margin:0; min-height:100vh; font-family:"Segoe UI","Helvetica Neue",Arial,sans-serif; color:var(--text-main); background:radial-gradient(circle at top,rgba(212,175,55,.12),transparent 28%),linear-gradient(180deg,#111 0%,#050505 100%); padding-bottom:6rem; }
    a { color:inherit; text-decoration:none; }
    .app-block { width:min(100%,1040px); margin:0 auto; }
    .gold-button { display:inline-flex; align-items:center; justify-content:center; border-radius:9999px; padding:.7rem 1.15rem; font-size:.86rem; font-weight:700; background:linear-gradient(to right,var(--gold-main),var(--gold-soft)); color:#000; box-shadow:0 14px 34px rgba(212,175,55,.22); }
    .menu-button { display:inline-flex; align-items:center; justify-content:center; width:2.6rem; height:2.6rem; border:1px solid rgba(212,175,55,.34); border-radius:999px; color:var(--gold-main); background:rgba(255,255,255,.04); }
    .site-menu { position:fixed; inset:0; z-index:80; display:none; background:rgba(0,0,0,.7); backdrop-filter:blur(12px); }
    .site-menu.is-open { display:block; }
    .site-menu__panel { position:absolute; top:1rem; right:1rem; width:min(88vw,360px); border:1px solid var(--border-soft); border-radius:1.5rem; background:rgba(12,12,12,.98); box-shadow:0 24px 80px rgba(0,0,0,.55); }
    .site-menu__head { display:flex; align-items:center; justify-content:space-between; padding:1rem; border-bottom:1px solid rgba(255,255,255,.08); }
    .site-menu__title { margin:0; color:var(--gold-main); font-size:.82rem; font-weight:700; letter-spacing:.22em; text-transform:uppercase; }
    .site-menu__close { width:2.3rem; height:2.3rem; border:1px solid rgba(212,175,55,.25); border-radius:999px; color:var(--text-main); background:rgba(255,255,255,.04); font-size:1.15rem; }
    .site-menu__links { display:grid; gap:.55rem; padding:.8rem; }
    .site-menu__link { display:flex; align-items:center; justify-content:space-between; min-height:3.4rem; padding:.9rem 1rem; border:1px solid rgba(255,255,255,.06); border-radius:1rem; background:rgba(255,255,255,.03); font-weight:600; }
    .site-menu__link span:last-child { color:var(--gold-main); }
    .article-shell { padding:2rem 1rem 5rem; }
    .article-card { border:1px solid var(--border-soft); border-radius:2rem; background:linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,.02)); overflow:hidden; box-shadow:0 24px 70px rgba(0,0,0,.45); }
    .breadcrumbs { display:flex; align-items:center; gap:.45rem; flex-wrap:wrap; margin-bottom:1rem; color:rgba(255,255,255,.62); font-size:.78rem; }
    .breadcrumbs a { color:var(--gold-main); }
    .featured-media { aspect-ratio:16/9; padding:.75rem; background:linear-gradient(180deg,rgba(255,255,255,.04),rgba(255,255,255,.02)); }
    .featured-media img { width:100%; height:100%; display:block; object-fit:contain; object-position:center; border-radius:1.4rem; }
    .content { padding:1.5rem; }
    .category { color:var(--gold-main); font-size:.74rem; font-weight:700; letter-spacing:.24em; text-transform:uppercase; }
    .article-title { max-width:18ch; margin:.8rem 0 0; font-size:clamp(2rem,7vw,4rem); line-height:.98; }
    .article-subheading { margin-top:.9rem; color:var(--text-main); font-size:1rem; line-height:1.7; }
    .meta { margin-top:1rem; color:var(--text-secondary); font-size:.9rem; }
    .tags { display:flex; flex-wrap:wrap; gap:.5rem; margin-top:1.25rem; }
    .tag { border:1px solid rgba(212,175,55,.24); border-radius:999px; padding:.38rem .7rem; color:rgba(255,255,255,.78); font-size:.76rem; }
    .article-body { margin-top:1.8rem; color:var(--text-secondary); font-size:1rem; line-height:1.72; }
    .article-body h2 { color:var(--text-main); font-size:1.35rem; line-height:1.2; margin-top:2rem; }
    .article-body h3 { color:var(--text-main); font-size:1.08rem; line-height:1.3; margin-top:1.4rem; }
    .article-body ul { padding-left:1.2rem; }
    .share-wrap { margin-top:1.8rem; }
    .share-label { color:var(--gold-main); font-size:.72rem; font-weight:700; letter-spacing:.2em; text-transform:uppercase; }
    .share-row { display:flex; gap:.65rem; margin-top:.8rem; flex-wrap:nowrap; overflow-x:auto; padding-bottom:.15rem; }
    .share-btn { display:inline-flex; align-items:center; gap:.45rem; min-height:2.7rem; padding:.68rem .95rem; border:1px solid rgba(212,175,55,.24); border-radius:999px; background:rgba(255,255,255,.04); color:var(--text-main); white-space:nowrap; font-size:.84rem; font-weight:700; }
    .share-btn svg { width:1rem; height:1rem; flex:none; }
    .article-nav { display:grid; grid-template-columns:1fr; gap:.8rem; margin-top:2rem; }
    .nav-card { border:1px solid var(--border-soft); border-radius:1.25rem; padding:1rem; background:rgba(255,255,255,.04); }
    .nav-label { color:var(--gold-main); font-size:.72rem; text-transform:uppercase; letter-spacing:.2em; }
    .bottom-nav { position:fixed; left:50%; bottom:1rem; transform:translateX(-50%); width:calc(100% - 1.5rem); max-width:31rem; z-index:50; }
    .bottom-nav-wrap { display:flex; gap:.65rem; }
    .bottom-nav-main,.bottom-nav-chat { position:relative; overflow:hidden; min-height:3.35rem; display:flex; align-items:center; justify-content:center; border-radius:999px; font-weight:700; backdrop-filter:blur(16px); }
    .bottom-nav-main { width:75%; padding:.8rem .75rem; font-size:.76rem; letter-spacing:.08em; text-transform:uppercase; white-space:nowrap; line-height:1; color:#111; border:2px solid rgba(0,0,0,.88); background:linear-gradient(180deg,#f1cd58 0%,#d4af37 52%,#b58d1b 100%); box-shadow:inset 0 2px 0 rgba(255,249,210,.72),inset 0 -4px 0 rgba(108,75,0,.28),0 12px 0 rgba(0,0,0,.22),0 18px 34px rgba(0,0,0,.28),0 0 28px rgba(255,215,0,.24); }
    .bottom-nav-chat { width:25%; color:#25D366; border:1.8px solid rgba(212,175,55,.9); background:rgba(12,12,12,.94); }
    .bottom-nav-chat svg { width:1.55rem; height:1.55rem; }
    @media (min-width:760px) { .article-shell{padding-top:3rem;} .content{padding:2.5rem;} .article-nav{grid-template-columns:1fr 1fr;} }
  </style>
</head>
<body>
  <header style="position:sticky; top:0; z-index:30; border-bottom:1px solid rgba(255,255,255,.08); background:rgba(11,11,11,.88); backdrop-filter:blur(18px);">
    <div class="app-block" style="padding:0 1rem;">
      <div style="display:flex; align-items:center; justify-content:space-between; padding:1rem 0;">
        <a href="/" aria-label="Home" style="display:inline-flex; height:3rem; align-items:center;"><img src="${escapeHtml(store.site.logoPath)}" alt="${escapeHtml(store.site.name)} logo" width="316" height="324" loading="lazy" decoding="async" style="height:2.5rem; width:auto; object-fit:contain;"></a>
        <div style="display:flex; align-items:center; gap:.75rem;"><button id="site-menu-open" type="button" aria-label="Open menu" class="menu-button"><svg style="height:1rem; width:1rem;" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button><a href="/services.html" class="gold-button">Book Now</a></div>
      </div>
    </div>
  </header>
  <div id="site-menu" class="site-menu" aria-hidden="true"><div class="site-menu__panel"><div class="site-menu__head"><p class="site-menu__title">Menu</p><button id="site-menu-close" type="button" class="site-menu__close" aria-label="Close menu">&times;</button></div><div class="site-menu__links"><a href="/" class="site-menu__link"><span>Home</span><span>&rarr;</span></a><a href="${hub.path}" class="site-menu__link"><span>${hub.label} Articles</span><span>&rarr;</span></a><a href="/services.html" class="site-menu__link"><span>Packages</span><span>&rarr;</span></a><a href="/contact.html" class="site-menu__link"><span>Contact</span><span>&rarr;</span></a></div></div></div>
  <main class="article-shell">
    <article class="app-block article-card">
      <div class="featured-media"><img src="${escapeHtml(article.image)}" alt="${escapeHtml(imageAlt)}" width="1200" height="675" loading="eager" decoding="async"></div>
      <div class="content">
        <nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="${hub.path}">${hub.label}</a><span>/</span><span>${escapeHtml(article.h1 || article.title)}</span></nav>
        <a href="${hub.path}" class="category">${hub.label}</a>
        <h1 class="article-title">${escapeHtml(article.h1 || article.title)}</h1>
        ${article.subheading ? `<p class="article-subheading">${article.subheading}</p>` : ""}
        <p class="meta">Created on ${escapeHtml(article.createdLabel || formatLongDate(article.createdAt))} by ${escapeHtml(store.site.name)}</p>
        <div class="tags">${(article.tags || []).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>
        <div class="article-body">${article.contentHtml || ""}</div>
        <div class="share-wrap">
          <p class="share-label">Share</p>
          <div class="share-row" aria-label="Share this article">
            <a class="share-btn" href="https://wa.me/?text=${encodeURIComponent(`${article.title} ${url}`)}" target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.198-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.019-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.372-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479s1.065 2.875 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.71.307 1.263.49 1.694.627.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.29.173-1.413-.074-.124-.272-.198-.57-.347Z"/><path d="M12.004 2.003a9.93 9.93 0 0 0-8.59 15.01L2 22l5.124-1.345a9.967 9.967 0 0 0 4.88 1.27h.004c5.514 0 9.996-4.48 9.998-9.994A9.95 9.95 0 0 0 12.004 2.003Zm0 18.18h-.003a8.3 8.3 0 0 1-4.231-1.158l-.303-.18-3.04.798.812-2.963-.197-.305a8.28 8.28 0 0 1-1.28-4.445c.002-4.582 3.731-8.31 8.316-8.31 2.222 0 4.31.865 5.88 2.438a8.27 8.27 0 0 1 2.432 5.884c-.002 4.584-3.73 8.31-8.314 8.31Z"/></svg><span>WhatsApp</span></a>
            <a class="share-btn" href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}" target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.5 21v-7.2H16l.4-2.8h-2.9V9.2c0-.81.27-1.36 1.44-1.36h1.55V5.3c-.27-.04-1.19-.12-2.26-.12-2.23 0-3.76 1.3-3.76 3.9V11H8v2.8h2.48V21h3.02Z"/></svg><span>Facebook</span></a>
            <a class="share-btn" href="https://www.instagram.com/healingmassagekl/" target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="4.2" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="3.7" stroke="currentColor" stroke-width="1.8"/><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor"/></svg><span>Instagram</span></a>
            <a class="share-btn" href="https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(article.title)}" target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.9 2H22l-6.77 7.74L23.2 22h-6.25l-4.9-6.4L6.46 22H3.35l7.24-8.28L1 2h6.4l4.43 5.85L18.9 2Zm-1.1 18h1.73L6.45 3.9H4.58L17.8 20Z"/></svg><span>Twitter</span></a>
          </div>
        </div>
        <div class="article-nav">
          ${previousArticle ? `<a class="nav-card" href="${getArticleUrl(store, previousArticle)}"><span class="nav-label">Previous Article</span><br>${escapeHtml(previousArticle.title)}</a>` : '<div class="nav-card"><span class="nav-label">Previous Article</span><br>No older article yet</div>'}
          ${nextArticle ? `<a class="nav-card" href="${getArticleUrl(store, nextArticle)}"><span class="nav-label">Next Article</span><br>${escapeHtml(nextArticle.title)}</a>` : '<div class="nav-card"><span class="nav-label">Next Article</span><br>No newer article yet</div>'}
        </div>
      </div>
    </article>
  </main>
  <nav class="bottom-nav"><div class="bottom-nav-wrap"><a href="/services.html" class="bottom-nav-main">See Massage Packages</a><a href="https://wa.me/${store.site.whatsappNumber}?text=Hi%20I%20would%20like%20to%20book%20a%20massage%20session%20%F0%9F%99%82" class="bottom-nav-chat" aria-label="Chat with masseur"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.198-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.019-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.372-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479s1.065 2.875 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.71.307 1.263.49 1.694.627.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.29.173-1.413-.074-.124-.272-.198-.57-.347Z"/><path d="M12.004 2.003a9.93 9.93 0 0 0-8.59 15.01L2 22l5.124-1.345a9.967 9.967 0 0 0 4.88 1.27h.004c5.514 0 9.996-4.48 9.998-9.994A9.95 9.95 0 0 0 12.004 2.003Zm0 18.18h-.003a8.3 8.3 0 0 1-4.231-1.158l-.303-.18-3.04.798.812-2.963-.197-.305a8.28 8.28 0 0 1-1.28-4.445c.002-4.582 3.731-8.31 8.316-8.31 2.222 0 4.31.865 5.88 2.438a8.27 8.27 0 0 1 2.432 5.884c-.002 4.584-3.73 8.31-8.314 8.31Z"/></svg></a></div></nav>
  <script>
    const siteMenuOpen = document.querySelector('#site-menu-open');
    const siteMenu = document.querySelector('#site-menu');
    const siteMenuClose = document.querySelector('#site-menu-close');
    const openMenu = () => { siteMenu?.classList.add('is-open'); siteMenu?.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden'; };
    const closeMenu = () => { siteMenu?.classList.remove('is-open'); siteMenu?.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; };
    siteMenuOpen?.addEventListener('click', openMenu);
    siteMenuClose?.addEventListener('click', closeMenu);
    siteMenu?.addEventListener('click', (event) => { if (event.target === siteMenu) closeMenu(); });
    siteMenu?.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeMenu(); });
  </script>
</body>
</html>`;
}

function renderRedirectPage(store, article) {
  const articleUrl = getArticleUrl(store, article);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0; url=${articleUrl}">
  <link rel="canonical" href="${store.site.domain}${articleUrl}">
  <meta name="robots" content="noindex,follow">
  <title>Redirecting...</title>
  <script>window.location.replace('${articleUrl}');</script>
</head>
<body></body>
</html>`;
}

function renderSimpleCard(hub, article) {
  return `        <a href="${getArticleUrl(currentStore, article)}" class="card card-link">
          <div class="card-image" style="background-image:url('${article.image}');" role="img" aria-label="${escapeHtml(article.imageAlt || article.title)}"></div>
          <div class="card-body">
            <p class="card-category">${hub.label}</p>
            <p class="card-date">Created: ${escapeHtml(article.createdLabel || formatLongDate(article.createdAt))}</p>
            <h2 class="card-title">${escapeHtml(article.title)}</h2>
            <p class="card-copy">${escapeHtml(article.excerpt || "")}</p>
          </div>
        </a>`;
}

function renderLuxuryCard(hub, article) {
  return `          <a href="${getArticleUrl(currentStore, article)}" class="article-card luxury-card rounded-[1.75rem] transition hover:-translate-y-1">
            <div class="article-card__image" style="background-image: url('${article.image}');" role="img" aria-label="${escapeHtml(article.imageAlt || article.title)}"></div>
            <div class="p-6">
              <p class="text-xs uppercase tracking-[0.24em]" style="color: var(--gold-main);">${hub.label}</p>
              <p class="mt-3 text-xs uppercase tracking-[0.22em]" style="color: var(--text-secondary);">Created: ${escapeHtml(article.createdLabel || formatLongDate(article.createdAt))}</p>
              <h2 class="mt-3 text-xl font-semibold">${escapeHtml(article.title)}</h2>
              <div class="mt-4 flex flex-wrap gap-2">${(article.tags || []).map((tag) => `<span class="article-tag">${escapeHtml(tag)}</span>`).join("")}</div>
              <p class="mt-4 text-sm leading-7" style="color: var(--text-secondary);">${escapeHtml(article.excerpt || "")}</p>
              <span class="mt-5 inline-flex text-sm font-semibold" style="color: var(--gold-soft);">Read article &rarr;</span>
            </div>
          </a>`;
}

let currentStore = loadStore();

function updateHubPage(store, hubSlug) {
  const hub = store.hubs[hubSlug];
  const filePath = path.join(ROOT, hub.hubFile);
  let html = readFile(filePath);
  const articles = store.articles.filter((item) => item.hub === hubSlug).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const cards = articles.map((article) => hub.cardStyle === "luxury" ? renderLuxuryCard(hub, article) : renderSimpleCard(hub, article)).join("\n");
  html = replaceManagedBlock(html, "AUTO_ARTICLE_GRID", cards);
  if (hub.countTemplate) {
    html = replaceManagedBlock(html, "AUTO_ARTICLE_COUNT", hub.countTemplate.replace("{{count}}", String(articles.length)));
  }
  writeFile(filePath, html);
}

function updateSitemap(store) {
  let sitemap = readFile(SITEMAP_PATH);
  const articleUrls = store.articles
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((article) => `  <url>\n    <loc>${store.site.domain}${getArticleUrl(store, article)}</loc>\n    <lastmod>${article.updatedAt || article.createdAt}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>`)
    .join("\n\n");
  sitemap = replaceManagedBlock(sitemap, "AUTO_ARTICLE_SITEMAP", articleUrls);
  writeFile(SITEMAP_PATH, sitemap);
}

function publishArticle(formData) {
  const store = loadStore();
  const hub = store.hubs[formData.hub];
  if (!hub) throw new Error("Invalid hub");

  const article = {
    hub: formData.hub,
    slug: formData.slug.trim(),
    title: formData.title.trim(),
    h1: formData.h1.trim() || formData.title.trim(),
    url: `/${hub.folder}/${formData.slug.trim()}/`,
    createdAt: formData.createdAt,
    createdLabel: formatLongDate(formData.createdAt),
    image: formData.image.trim(),
    imageAlt: formData.imageAlt.trim() || formData.title.trim(),
    excerpt: formData.excerpt.trim(),
    tags: formData.tags.split(",").map((item) => item.trim()).filter(Boolean),
    generatePage: true,
    metaTitle: formData.metaTitle.trim(),
    metaDescription: formData.metaDescription.trim(),
    subheading: formData.subheading.trim(),
    contentHtml: parseContentToHtml(formData.content),
    serviceSchemaJson: formData.schema.trim() || ""
  };

  const existingIndex = store.articles.findIndex((item) => item.slug === article.slug);
  if (existingIndex >= 0) {
    store.articles[existingIndex] = article;
  } else {
    store.articles.push(article);
  }

  saveStore(store);
  currentStore = store;

  const ordered = [...store.articles].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const articleFile = path.join(ROOT, hub.folder, article.slug, "index.html");
  const redirectFile = path.join(ROOT, "blog", `${article.slug}.html`);
  writeFile(articleFile, renderArticlePage(store, article, ordered));
  writeFile(redirectFile, renderRedirectPage(store, article));
  Object.keys(store.hubs).forEach((hubSlug) => updateHubPage(store, hubSlug));
  updateSitemap(store);
  return article;
}

function renderAdminPage(message = "") {
  const store = loadStore();
  const hubOptions = Object.entries(store.hubs)
    .map(([key, hub]) => `<option value="${key}">${hub.label}</option>`)
    .join("");

  const articleList = store.articles
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((article) => `<li><strong>${escapeHtml(article.title)}</strong> - ${escapeHtml(store.hubs[article.hub].label)} - ${escapeHtml(article.slug)}</li>`)
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Article Admin</title>
  <style>
    :root { --bg:#0b0b0b; --panel:#151515; --line:rgba(212,175,55,.18); --gold:#d4af37; --text:#fff; --muted:rgba(255,255,255,.7); }
    * { box-sizing:border-box; }
    body { margin:0; font-family:Segoe UI,Arial,sans-serif; background:linear-gradient(180deg,#0b0b0b,#151015); color:var(--text); }
    .wrap { width:min(1100px, calc(100% - 2rem)); margin:0 auto; padding:2rem 0 3rem; }
    h1 { margin:0; font-size:2rem; }
    p { color:var(--muted); }
    .grid { display:grid; gap:1rem; grid-template-columns:1.15fr .85fr; align-items:start; }
    .panel { background:var(--panel); border:1px solid var(--line); border-radius:18px; padding:1rem; box-shadow:0 20px 60px rgba(0,0,0,.35); }
    label { display:block; margin:.7rem 0 .35rem; font-size:.88rem; color:var(--gold); }
    input, select, textarea, button { width:100%; border-radius:12px; border:1px solid rgba(255,255,255,.12); background:#0f0f10; color:var(--text); padding:.8rem .9rem; font:inherit; }
    textarea { min-height:120px; resize:vertical; }
    .row { display:grid; gap:1rem; grid-template-columns:1fr 1fr; }
    .message { margin:1rem 0 0; padding:.9rem 1rem; border-radius:12px; background:rgba(212,175,55,.08); border:1px solid rgba(212,175,55,.22); color:#ffe08b; }
    .submit { margin-top:1rem; background:linear-gradient(180deg,#f1cd58,#d4af37); color:#111; font-weight:800; cursor:pointer; }
    ul { margin:0; padding-left:1rem; }
    li { margin:.55rem 0; color:var(--muted); }
    .hint { font-size:.82rem; color:var(--muted); }
    @media (max-width: 900px) { .grid, .row { grid-template-columns:1fr; } }
  </style>
</head>
<body>
  <div class="wrap">
    <h1>Article Admin</h1>
    <p>Fill the form, click publish, and the system will generate the article page, schema, share tags, hub card, redirect page, and sitemap entry.</p>
    ${message ? `<div class="message">${message}</div>` : ""}
    <div class="grid">
      <div class="panel">
        <form method="POST" action="/publish">
          <div class="row">
            <div><label>Hub</label><select name="hub">${hubOptions}</select></div>
            <div><label>Publish Date</label><input type="date" name="createdAt" required></div>
          </div>
          <div class="row">
            <div><label>Title</label><input name="title" required></div>
            <div><label>Slug</label><input name="slug" placeholder="best-massage-klcc-hotel-guests" required></div>
          </div>
          <div class="row">
            <div><label>H1</label><input name="h1" required></div>
            <div><label>Subheading</label><input name="subheading"></div>
          </div>
          <label>Meta Title</label><input name="metaTitle" required>
          <label>Meta Description</label><textarea name="metaDescription" rows="3" required></textarea>
          <div class="row">
            <div><label>Image URL or Site Path</label><input name="image" placeholder="/blog/klcc/Image/example.jpg" required></div>
            <div><label>Image Alt</label><input name="imageAlt" required></div>
          </div>
          <label>Card Excerpt</label><textarea name="excerpt" rows="3" required></textarea>
          <label>Tags</label><input name="tags" placeholder="Hotel Guests, In-Room Massage, KLCC Hotels">
          <label>Content Box</label>
          <textarea name="content" rows="16" placeholder="Paste article content here. You can use plain text, or use H2: and H3: lines, or paste HTML." required></textarea>
          <p class="hint">Plain text is okay. Use lines like <code>H2: Benefits</code>, <code>H3: Privacy</code>, and bullet lines starting with <code>- </code> if you want structure.</p>
          <label>Schema JSON</label>
          <textarea name="schema" rows="10" placeholder='{"@type":"Service","name":"..."}'></textarea>
          <button class="submit" type="submit">Publish Article</button>
        </form>
      </div>
      <div class="panel">
        <h2 style="margin-top:0;">Published Articles</h2>
        <ul>${articleList}</ul>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function sendHtml(res, html) {
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(html);
}

const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/") {
    sendHtml(res, renderAdminPage());
    return;
  }

  if (req.method === "POST" && req.url === "/publish") {
    let body = "";
    req.on("data", (chunk) => { body += chunk; });
    req.on("end", () => {
      try {
        const formData = querystring.parse(body);
        const article = publishArticle(formData);
        sendHtml(res, renderAdminPage(`Published <strong>${escapeHtml(article.title)}</strong> to ${escapeHtml(getArticleUrl(loadStore(), article))}`));
      } catch (error) {
        sendHtml(res, renderAdminPage(`Publish failed: ${escapeHtml(error.message)}`));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

server.listen(PORT, () => {
  console.log(`Article admin running at http://127.0.0.1:${PORT}`);
});
