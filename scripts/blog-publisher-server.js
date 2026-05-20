const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const PORT = 8790;
const SITE_BASE_URL = "https://www.massagekl.com";

const placePages = [
  { id: "kuala-lumpur", label: "Kuala Lumpur", file: "massage-kuala-lumpur/index.html", publicUrl: "/massage-kuala-lumpur/", hub: "kuala-lumpur" },
  { id: "klcc", label: "KLCC", file: "massage-klcc/index.html", publicUrl: "/massage-klcc/", hub: "klcc" },
  { id: "bangsar", label: "Bangsar", file: "massage-bangsar/index.html", publicUrl: "/massage-bangsar/", hub: "bangsar" },
  { id: "mont-kiara", label: "Mont Kiara", file: "massage-mont-kiara/index.html", publicUrl: "/massage-mont-kiara/", hub: "mont-kiara" },
  { id: "bukit-bintang", label: "Bukit Bintang", file: "massage-bukit-bintang/index.html", publicUrl: "/massage-bukit-bintang/", hub: null },
  { id: "mid-valley", label: "Mid Valley", file: "massage-mid-valley.html", publicUrl: "/massage-mid-valley.html", hub: null },
  { id: "cheras", label: "Cheras", file: "massage-cheras.html", publicUrl: "/massage-cheras.html", hub: null },
  { id: "ampang", label: "Ampang", file: "massage-ampang.html", publicUrl: "/massage-ampang.html", hub: null },
  { id: "petaling-jaya", label: "Petaling Jaya", file: "massage-petaling-jaya.html", publicUrl: "/massage-petaling-jaya.html", hub: null },
  { id: "subang-jaya", label: "Subang Jaya", file: "massage-subang-jaya.html", publicUrl: "/massage-subang-jaya.html", hub: null },
  { id: "puchong", label: "Puchong", file: "massage-puchong.html", publicUrl: "/massage-puchong.html", hub: null },
  { id: "ttdi", label: "TTDI", file: "massage-ttdi.html", publicUrl: "/massage-ttdi.html", hub: null },
  { id: "setapak", label: "Setapak", file: "massage-setapak.html", publicUrl: "/massage-setapak.html", hub: null },
  { id: "cyberjaya", label: "Cyberjaya", file: "massage-cyberjaya.html", publicUrl: "/massage-cyberjaya.html", hub: null },
  { id: "putrajaya", label: "Putrajaya", file: "massage-putrajaya.html", publicUrl: "/massage-putrajaya.html", hub: null },
  { id: "brickfields", label: "Brickfields", file: "massage-brickfields.html", publicUrl: "/massage-brickfields.html", hub: null },
  { id: "kl-sentral", label: "KL Sentral", file: "massage-kl-sentral.html", publicUrl: "/massage-kl-sentral.html", hub: null },
  { id: "bukit-jalil", label: "Bukit Jalil", file: "massage-bukit-jalil.html", publicUrl: "/massage-bukit-jalil.html", hub: null },
  { id: "bangsar-south", label: "Bangsar South", file: "massage-bangsar-south.html", publicUrl: "/massage-bangsar-south.html", hub: null },
  { id: "sunway", label: "Sunway", file: "massage-sunway.html", publicUrl: "/massage-sunway.html", hub: null },
  { id: "shah-alam", label: "Shah Alam", file: "massage-shah-alam.html", publicUrl: "/massage-shah-alam.html", hub: null },
  { id: "sri-hartamas", label: "Sri Hartamas", file: "massage-sri-hartamas.html", publicUrl: "/massage-sri-hartamas.html", hub: null },
  { id: "damansara-heights", label: "Damansara Heights", file: "massage-damansara-heights.html", publicUrl: "/massage-damansara-heights.html", hub: null },
  { id: "desa-parkcity", label: "Desa ParkCity", file: "massage-desa-parkcity.html", publicUrl: "/massage-desa-parkcity.html", hub: null },
  { id: "kota-damansara", label: "Kota Damansara", file: "massage-kota-damansara.html", publicUrl: "/massage-kota-damansara.html", hub: null },
  { id: "ara-damansara", label: "Ara Damansara", file: "massage-ara-damansara.html", publicUrl: "/massage-ara-damansara.html", hub: null },
  { id: "kelana-jaya", label: "Kelana Jaya", file: "massage-kelana-jaya.html", publicUrl: "/massage-kelana-jaya.html", hub: null }
];
const placePageMap = Object.fromEntries(placePages.map((page) => [page.id, page]));

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function sendHtml(res, html) {
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(html);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeContent(value) {
  return String(value).replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
}

function normalizeFeaturedImage(value) {
  const trimmed = String(value || "").trim().replace(/^["']+|["']+$/g, "");
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (/^[a-zA-Z]:\\/.test(trimmed)) {
    const normalized = trimmed.replace(/\\/g, "/");
    const rootNormalized = ROOT.replace(/\\/g, "/").toLowerCase();
    if (normalized.toLowerCase().startsWith(rootNormalized)) {
      return normalized.slice(rootNormalized.length).replace(/^\/+/, "/");
    }
  }

  return trimmed.startsWith("/") ? trimmed : `/${trimmed.replace(/^\/+/, "")}`;
}

function buildContentHtml(content) {
  const blocks = normalizeContent(content).split(/\n\s*\n/).filter(Boolean);
  const html = [];

  for (const block of blocks) {
    if (block.startsWith("### ")) {
      const lines = block.split("\n");
      const heading = lines.shift().replace(/^###\s+/, "");
      const body = lines.join("\n").trim();
      html.push(`<h3 class="mt-6 text-xl font-semibold">${escapeHtml(heading)}</h3>`);
      if (body) {
        html.push(`<p class="mt-3 text-base leading-8 text-white/72">${escapeHtml(body).replace(/\n/g, "<br>")}</p>`);
      }
      continue;
    }

    if (block.startsWith("## ")) {
      const lines = block.split("\n");
      const heading = lines.shift().replace(/^##\s+/, "");
      const body = lines.join("\n").trim();
      html.push(`<h2 class="mt-8 text-2xl font-semibold">${escapeHtml(heading)}</h2>`);
      if (body) {
        html.push(`<p class="mt-4 text-base leading-8 text-white/72">${escapeHtml(body).replace(/\n/g, "<br>")}</p>`);
      }
      continue;
    }

    if (block.startsWith("- ")) {
      const items = block.split("\n").map((line) => line.replace(/^- /, "").trim()).filter(Boolean);
      html.push('<ul class="mt-4 list-disc space-y-2 pl-6 text-base leading-8 text-white/72">');
      for (const item of items) {
        html.push(`<li>${escapeHtml(item)}</li>`);
      }
      html.push("</ul>");
      continue;
    }

    html.push(`<p class="mt-5 text-base leading-8 text-white/72">${escapeHtml(block).replace(/\n/g, "<br>")}</p>`);
  }

  return html.join("\n");
}

function buildArticleParts(payload) {
  const title = String(payload.title || "").trim();
  const slug = slugify(payload.slug || payload.title || "");
  const metaDescription = String(payload.metaDescription || "").trim();
  const featuredImage = normalizeFeaturedImage(payload.featuredImage || "");
  const altText = String(payload.altText || "").trim();
  const content = String(payload.content || "").trim();
  const publishedDate = String(payload.publishedDate || "").trim();
  const publishedBy = String(payload.publishedBy || "Massage KL").trim();
  const selectedPages = Array.isArray(payload.pages) ? payload.pages.filter((item) => placePageMap[item]) : [];

  if (!title || !slug || !metaDescription || !featuredImage || !altText || !content || !publishedDate || !publishedBy || selectedPages.length === 0) {
    throw new Error("Please fill all required fields.");
  }

  const selectedPageRecords = selectedPages.map((item) => placePageMap[item]);
  const primaryPage = selectedPageRecords[0];
  const articleSections = selectedPageRecords.map((page) => page.label);
  const relatedHubs = [...new Set(selectedPageRecords.map((page) => page.hub).filter(Boolean))];
  const articleUrl = `${SITE_BASE_URL}/blog/${slug}.html`;
  const imageUrl = /^https?:\/\//i.test(featuredImage)
    ? featuredImage
    : `${SITE_BASE_URL}/${featuredImage.replace(/^\/+/, "")}`;
  const displayDate = new Date(`${publishedDate}T12:00:00`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    description: metaDescription,
    image: [imageUrl],
    author: {
      "@type": "Organization",
      name: publishedBy
    },
    publisher: {
      "@type": "Organization",
      name: publishedBy,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_BASE_URL}/images/logo.png`
      }
    },
    datePublished: publishedDate,
    dateModified: publishedDate,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": articleUrl
    },
    articleSection: articleSections
  };
  const schemaJson = JSON.stringify(schema, null, 2);
  const contentHtml = buildContentHtml(content);
  const excerptSource = normalizeContent(content).split(/\n\s*\n/).find(Boolean) || metaDescription;
  const excerpt = excerptSource.replace(/^#{2,3}\s+/, "").replace(/\n/g, " ").trim();

  const articleHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(metaDescription)}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${escapeHtml(articleUrl)}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(metaDescription)}">
  <meta property="og:image" content="${escapeHtml(imageUrl)}">
  <meta property="og:image:alt" content="${escapeHtml(altText)}">
  <meta property="og:site_name" content="Massage KL">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${escapeHtml(articleUrl)}">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(metaDescription)}">
  <meta name="twitter:image" content="${escapeHtml(imageUrl)}">
  <meta name="twitter:image:alt" content="${escapeHtml(altText)}">
  <link rel="canonical" href="${escapeHtml(articleUrl)}">
  <script type="application/ld+json">
${schemaJson}
  <\/script>
  <link rel="preload" href="/styles/tailwind.css" as="style">
  <link rel="stylesheet" href="/styles/tailwind.css">
</head>
<body class="min-h-screen bg-black text-white">
  <article class="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
    <a href="${escapeHtml(primaryPage.publicUrl)}" class="text-sm font-semibold text-amber-300">Back to ${escapeHtml(primaryPage.label)}</a>
    <p class="mt-6 text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">${escapeHtml(primaryPage.label)}</p>
    <h1 class="mt-4 text-4xl font-bold leading-tight">${escapeHtml(title)}</h1>
    <p class="mt-4 text-xs uppercase tracking-[0.22em] text-white/55">Created: ${escapeHtml(displayDate)} | Published By: ${escapeHtml(publishedBy)}</p>

    <figure class="mt-8 overflow-hidden rounded-[1.5rem] border border-white/10 bg-zinc-950/70">
      <img src="${escapeHtml(featuredImage)}" alt="${escapeHtml(altText)}" class="block h-auto w-full object-cover">
    </figure>

    <div class="mt-8 space-y-6">
${contentHtml}
    </div>
  </article>
</body>
</html>`;

  const blogIndexCard = `<article class="card">
          <div class="post-image" style="background-image: url('${escapeHtml(featuredImage)}');"></div>
          <div class="p-6">
            <p class="text-xs font-bold uppercase tracking-[0.24em]" style="color: var(--gold-main);">${escapeHtml(primaryPage.label)}</p>
            <h2 class="mt-3 text-2xl font-semibold leading-tight">${escapeHtml(title)}</h2>
            <div class="mt-4 flex flex-wrap gap-2">
              ${articleSections.map((label) => `<span class="tag">${escapeHtml(label)}</span>`).join("\n              ")}
            </div>
            <p class="mt-4 text-sm leading-7" style="color: var(--text-secondary);">${escapeHtml(excerpt).slice(0, 180)}</p>
            <a href="/blog/${escapeHtml(slug)}.html" class="mt-5 inline-flex text-sm font-semibold" style="color: var(--gold-soft);">Read article</a>
          </div>
        </article>`;

  const hubCard = `<article class="card card-link">
      <div class="card-image" style="background-image:url('${escapeHtml(featuredImage)}');" role="img" aria-label="${escapeHtml(altText)}"></div>
      <div class="card-body">
        <p class="card-category">${escapeHtml(primaryPage.label)}</p>
        <p class="card-date">Created: ${escapeHtml(displayDate)}</p>
        <h2 class="card-title">${escapeHtml(title)}</h2>
        <p class="card-copy">${escapeHtml(excerpt).slice(0, 220)}</p>
        <a href="/blog/${escapeHtml(slug)}.html" class="mt-5 inline-flex text-sm font-semibold" style="color: var(--gold-soft);">Read article</a>
      </div>
    </article>`;

  const buildPlaceRichCard = (page) => `<article class="mt-10 rounded-[1.5rem] border border-amber-400/20 bg-zinc-950/90 overflow-hidden">
      <div class="min-h-[250px] bg-cover bg-center" style="background-image:url('${escapeHtml(featuredImage)}');"></div>
      <div class="p-6 sm:p-8">
        <div class="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
          <span>${escapeHtml(page.label)}</span><span>Featured Article</span>
        </div>
        <h2 class="mt-4 text-3xl font-semibold leading-tight">${escapeHtml(title)}</h2>
        <p class="mt-4 text-base leading-8 text-white/72">${escapeHtml(excerpt).slice(0, 220)}</p>
        <a href="/blog/${escapeHtml(slug)}.html" class="mt-5 inline-flex text-sm font-semibold text-amber-300">Read article</a>
      </div>
    </article>`;

  const buildSimplePlaceCard = (page) => `<a href="/blog/${escapeHtml(slug)}.html" class="card" style="display:block;">
          <div class="card-image" style="background-image:url('${escapeHtml(featuredImage)}');" role="img" aria-label="${escapeHtml(altText)}"></div>
          <div class="card-body"><p class="kicker">${escapeHtml(page.label)} Article</p><h2 class="card-title">${escapeHtml(title)}</h2><p class="card-copy">${escapeHtml(excerpt).slice(0, 220)}</p><div class="tag-row"><span class="tag">${escapeHtml(page.label)}</span><span class="tag">Featured Article</span></div></div>
        </a>`;

  const placeSchemaScript = (pageLabel, pageUrl) => `<!-- AUTO_RELATED_ARTICLE_SCHEMA_START:${slug} -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "${escapeHtml(pageLabel)} related articles",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "url": "${escapeHtml(articleUrl)}",
        "name": "${escapeHtml(title)}"
      }
    ],
    "mainEntityOfPage": "${escapeHtml(SITE_BASE_URL + pageUrl)}"
  }
  <\/script>
<!-- AUTO_RELATED_ARTICLE_SCHEMA_END:${slug} -->`;

  return {
    slug,
    articleHtml,
    schemaJson,
    selectedPages,
    selectedPageRecords,
    relatedHubs,
    blogIndexCard,
    hubCard,
    buildPlaceRichCard,
    buildSimplePlaceCard,
    placeSchemaScript
  };
}

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function writeText(filePath, content) {
  fs.writeFileSync(filePath, content, "utf8");
}

function insertIntoBlogIndex(html, cardHtml, slug) {
  if (html.includes(`/blog/${slug}.html`)) {
    return html;
  }

  const marker = '<section class="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">';
  const sectionStart = html.indexOf(marker);
  if (sectionStart === -1) {
    throw new Error("Could not find the blog grid in blog/index.html");
  }

  const sectionEnd = html.indexOf("</section>", sectionStart);
  if (sectionEnd === -1) {
    throw new Error("Could not find the end of the blog grid in blog/index.html");
  }

  return `${html.slice(0, sectionEnd)}\n\n        ${cardHtml}\n${html.slice(sectionEnd)}`;
}

function insertIntoHubIndex(html, cardHtml, slug) {
  if (html.includes(`/blog/${slug}.html`)) {
    return html;
  }

  const mainClose = html.lastIndexOf("</main>");
  if (mainClose === -1) {
    throw new Error("Could not find </main> in hub index");
  }

  return `${html.slice(0, mainClose)}\n    ${cardHtml}\n${html.slice(mainClose)}`;
}

function insertIntoPlacePage(html, richCardHtml, simpleCardHtml, slug) {
  if (html.includes(`/blog/${slug}.html`) || html.includes(`/massage-kuala-lumpur/${slug}/`)) {
    return html;
  }

  const autoStart = html.indexOf("<!-- AUTO_ARTICLE_GRID_START:");
  const autoEnd = html.indexOf("<!-- AUTO_ARTICLE_GRID_END:");
  if (autoStart !== -1 && autoEnd !== -1) {
    return `${html.slice(0, autoEnd)}          ${richCardHtml}\n${html.slice(autoEnd)}`;
  }

  const gridStart = html.indexOf('<div class="grid">');
  const gridEnd = findMatchingClosingDiv(html, gridStart);
  if (gridStart !== -1 && gridEnd !== -1) {
    return `${html.slice(0, gridEnd)}        ${simpleCardHtml}\n${html.slice(gridEnd)}`;
  }

  throw new Error("Could not find a supported article insertion point on the place page.");
}

function findMatchingClosingDiv(html, startIndex) {
  if (startIndex === -1) {
    return -1;
  }

  const divPattern = /<\/?div\b[^>]*>/g;
  divPattern.lastIndex = startIndex;
  let depth = 0;
  let started = false;
  let match;

  while ((match = divPattern.exec(html)) !== null) {
    const token = match[0];
    if (token.startsWith("</div")) {
      depth -= 1;
      if (started && depth === 0) {
        return divPattern.lastIndex;
      }
      continue;
    }

    depth += 1;
    started = true;
  }

  return -1;
}

function insertPlaceSchema(html, schemaBlock, slug) {
  if (html.includes(`AUTO_RELATED_ARTICLE_SCHEMA_START:${slug}`)) {
    return html;
  }

  const headClose = html.indexOf("</head>");
  if (headClose === -1) {
    throw new Error("Could not find </head> while inserting place-page schema.");
  }

  return `${html.slice(0, headClose)}${schemaBlock}\n${html.slice(headClose)}`;
}

function updateAutoArticleCount(html) {
  const startMatch = html.match(/<!-- AUTO_ARTICLE_COUNT_START:([a-z0-9-]+) -->/);
  const gridStart = html.indexOf("AUTO_ARTICLE_GRID_START:");
  const gridEnd = html.indexOf("AUTO_ARTICLE_GRID_END:");
  if (!startMatch || gridStart === -1 || gridEnd === -1) {
    return html;
  }

  const pageLabel = startMatch[1].replace(/-/g, " ").toUpperCase();
  const gridSection = html.slice(gridStart, gridEnd);
  const cardCount = (gridSection.match(/article-card/g) || []).length;
  return html.replace(/(<\!-- AUTO_ARTICLE_COUNT_START:[^>]+ -->\s*<p[^>]*>Showing )\d+( featured .*? articles<\/p>\s*<\!-- AUTO_ARTICLE_COUNT_END:[^>]+ -->)/s, `$1${cardCount}$2`);
}

function buildSitemapUrlBlock(url, lastmod, changefreq = "monthly", priority = "0.7") {
  return `  <url>
    <loc>${url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

function updateSitemapLastmod(xml, url, lastmod) {
  const escapedUrl = url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(<loc>${escapedUrl}</loc>[\\s\\S]*?<lastmod>)([^<]+)(</lastmod>)`, "m");
  if (!regex.test(xml)) {
    return xml;
  }
  return xml.replace(regex, `$1${lastmod}$3`);
}

function insertIntoArticleSitemapBlock(xml, urlBlock, slug) {
  if (xml.includes(`/blog/${slug}.html`)) {
    return xml;
  }

  const endMarker = "<!-- AUTO_ARTICLE_SITEMAP_END:articles -->";
  const endIndex = xml.indexOf(endMarker);
  if (endIndex === -1) {
    throw new Error("Could not find sitemap auto article marker.");
  }

  return `${xml.slice(0, endIndex)}${urlBlock}\n\n${xml.slice(endIndex)}`;
}

function publish(payload) {
  const article = buildArticleParts(payload);
  const blogDir = path.join(ROOT, "blog");
  const articlePath = path.join(blogDir, `${article.slug}.html`);
  writeText(articlePath, article.articleHtml);

  const blogIndexPath = path.join(blogDir, "index.html");
  const blogIndexHtml = readText(blogIndexPath);
  writeText(blogIndexPath, insertIntoBlogIndex(blogIndexHtml, article.blogIndexCard, article.slug));

  const updatedHubs = [];
  for (const categorySlug of article.relatedHubs) {
    const hubPath = path.join(blogDir, categorySlug, "index.html");
    if (!fs.existsSync(hubPath)) {
      continue;
    }
    const hubHtml = readText(hubPath);
    writeText(hubPath, insertIntoHubIndex(hubHtml, article.hubCard, article.slug));
    updatedHubs.push(categorySlug);
  }

  const updatedPlacePages = [];
  for (const page of article.selectedPageRecords) {
    const placePath = path.join(ROOT, page.file);
    if (!fs.existsSync(placePath)) {
      continue;
    }
    let placeHtml = readText(placePath);
    placeHtml = insertIntoPlacePage(placeHtml, article.buildPlaceRichCard(page), article.buildSimplePlaceCard(page), article.slug);
    placeHtml = updateAutoArticleCount(placeHtml);
    placeHtml = insertPlaceSchema(placeHtml, article.placeSchemaScript(page.label, page.publicUrl), article.slug);
    writeText(placePath, placeHtml);
    updatedPlacePages.push(page.file);
  }

  const sitemapPath = path.join(ROOT, "sitemap.xml");
  const today = new Date().toISOString().slice(0, 10);
  let sitemapXml = readText(sitemapPath);
  const articleBlock = buildSitemapUrlBlock(`${SITE_BASE_URL}/blog/${article.slug}.html`, today);
  sitemapXml = insertIntoArticleSitemapBlock(sitemapXml, articleBlock, article.slug);
  sitemapXml = updateSitemapLastmod(sitemapXml, `${SITE_BASE_URL}/blog/`, today);
  for (const categorySlug of article.relatedHubs) {
    sitemapXml = updateSitemapLastmod(sitemapXml, `${SITE_BASE_URL}/blog/${categorySlug}/`, today);
  }
  for (const page of article.selectedPageRecords) {
    sitemapXml = updateSitemapLastmod(sitemapXml, `${SITE_BASE_URL}${page.publicUrl}`, today);
  }
  writeText(sitemapPath, sitemapXml);

  return {
    ok: true,
    slug: article.slug,
    articlePath: path.relative(ROOT, articlePath),
    updatedHubs,
    updatedPlacePages,
    updatedFiles: [
      path.relative(ROOT, articlePath),
      "blog/index.html",
      ...updatedHubs.map((slug) => `blog/${slug}/index.html`),
      ...updatedPlacePages.map((file) => file.replace(/\\/g, "/")),
      "sitemap.xml"
    ]
  };
}

const appHtml = readText(path.join(ROOT, "blog-publisher-local.html"));

const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/") {
    return sendHtml(res, appHtml);
  }

  if (req.method === "GET" && req.url === "/api/pages") {
    return sendJson(res, 200, { pages: placePages });
  }

  if (req.method === "POST" && req.url === "/api/publish") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        const payload = JSON.parse(body || "{}");
        const result = publish(payload);
        sendJson(res, 200, result);
      } catch (error) {
        sendJson(res, 400, { ok: false, error: error.message });
      }
    });
    return;
  }

  sendJson(res, 404, { ok: false, error: "Not found" });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Blog publisher running at http://127.0.0.1:${PORT}`);
});
