const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const PORT = 8787;
const SITE_BASE_URL = "https://www.massagekl.com";

const categories = {
  "kuala-lumpur": "Kuala Lumpur (KL)",
  "klcc": "KLCC",
  "bukit-bintang": "Bukit Bintang",
  "bangsar": "Bangsar",
  "mid-valley": "Mid Valley",
  "mont-kiara": "Mont Kiara",
  "sri-petaling": "Sri Petaling",
  "cheras": "Cheras",
  "ampang": "Ampang",
  "petaling-jaya": "Petaling Jaya",
  "subang-jaya": "Subang Jaya",
  "puchong": "Puchong",
  "damansara": "Damansara",
  "ttdi": "TTDI",
  "setapak": "Setapak",
  "cyberjaya": "Cyberjaya",
  "putrajaya": "Putrajaya"
};

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
  const featuredImage = String(payload.featuredImage || "").trim();
  const altText = String(payload.altText || "").trim();
  const content = String(payload.content || "").trim();
  const publishedDate = String(payload.publishedDate || "").trim();
  const publishedBy = String(payload.publishedBy || "Massage KL").trim();
  const selectedCategories = Array.isArray(payload.categories) ? payload.categories.filter((item) => categories[item]) : [];

  if (!title || !slug || !metaDescription || !featuredImage || !altText || !content || !publishedDate || !publishedBy || selectedCategories.length === 0) {
    throw new Error("Please fill all required fields.");
  }

  const primaryCategorySlug = selectedCategories[0];
  const primaryCategoryLabel = categories[primaryCategorySlug];
  const categoryLabels = selectedCategories.map((item) => categories[item]);
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
    articleSection: categoryLabels
  };
  const schemaJson = JSON.stringify(schema, null, 2);
  const contentHtml = buildContentHtml(content);
  const tagsHtml = categoryLabels.map((label) => `      <span>${escapeHtml(label)}</span>`).join("\n");
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
    <a href="/blog/${escapeHtml(primaryCategorySlug)}/" class="text-sm font-semibold text-amber-300">Back to ${escapeHtml(primaryCategoryLabel)}</a>

    <div
      class="mt-6 min-h-[280px] rounded-[1.5rem] bg-cover bg-center"
      style="background-image:url('${escapeHtml(featuredImage)}');"
      role="img"
      aria-label="${escapeHtml(altText)}"></div>

    <div class="mt-6 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
${tagsHtml}
    </div>

    <p class="mt-4 text-xs uppercase tracking-[0.22em] text-white/55">Created: ${escapeHtml(displayDate)}</p>
    <p class="mt-2 text-xs uppercase tracking-[0.22em] text-white/55">Published By: ${escapeHtml(publishedBy)}</p>

    <h1 class="mt-4 text-4xl font-bold leading-tight">${escapeHtml(title)}</h1>

${contentHtml}
  </article>
</body>
</html>`;

  const blogIndexCard = `<article class="card">
          <div class="post-image" style="background-image: url('${escapeHtml(featuredImage)}');"></div>
          <div class="p-6">
            <p class="text-xs font-bold uppercase tracking-[0.24em]" style="color: var(--gold-main);">${escapeHtml(primaryCategoryLabel)}</p>
            <h2 class="mt-3 text-2xl font-semibold leading-tight">${escapeHtml(title)}</h2>
            <div class="mt-4 flex flex-wrap gap-2">
              ${categoryLabels.map((label) => `<span class="tag">${escapeHtml(label)}</span>`).join("\n              ")}
            </div>
            <p class="mt-4 text-sm leading-7" style="color: var(--text-secondary);">${escapeHtml(excerpt).slice(0, 180)}</p>
            <a href="/blog/${escapeHtml(slug)}.html" class="mt-5 inline-flex text-sm font-semibold" style="color: var(--gold-soft);">Read article</a>
          </div>
        </article>`;

  const hubCard = `<article class="mt-10 rounded-[1.5rem] border border-amber-400/20 bg-zinc-950/90 overflow-hidden">
      <div class="min-h-[250px] bg-cover bg-center" style="background-image:url('${escapeHtml(featuredImage)}');"></div>
      <div class="p-6 sm:p-8">
        <div class="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
          ${categoryLabels.map((label) => `<span>${escapeHtml(label)}</span>`).join("")}
        </div>
        <h2 class="mt-4 text-3xl font-semibold leading-tight">${escapeHtml(title)}</h2>
        <p class="mt-4 text-base leading-8 text-white/72">${escapeHtml(excerpt).slice(0, 220)}</p>
        <a href="/blog/${escapeHtml(slug)}.html" class="mt-5 inline-flex text-sm font-semibold text-amber-300">Read article</a>
      </div>
    </article>`;

  return {
    slug,
    articleHtml,
    schemaJson,
    selectedCategories,
    blogIndexCard,
    hubCard
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
  for (const categorySlug of article.selectedCategories) {
    const hubPath = path.join(blogDir, categorySlug, "index.html");
    if (!fs.existsSync(hubPath)) {
      continue;
    }
    const hubHtml = readText(hubPath);
    writeText(hubPath, insertIntoHubIndex(hubHtml, article.hubCard, article.slug));
    updatedHubs.push(categorySlug);
  }

  const sitemapPath = path.join(ROOT, "sitemap.xml");
  const today = new Date().toISOString().slice(0, 10);
  let sitemapXml = readText(sitemapPath);
  const articleBlock = buildSitemapUrlBlock(`${SITE_BASE_URL}/blog/${article.slug}.html`, today);
  sitemapXml = insertIntoArticleSitemapBlock(sitemapXml, articleBlock, article.slug);
  sitemapXml = updateSitemapLastmod(sitemapXml, `${SITE_BASE_URL}/blog/`, today);
  for (const categorySlug of article.selectedCategories) {
    sitemapXml = updateSitemapLastmod(sitemapXml, `${SITE_BASE_URL}/blog/${categorySlug}/`, today);
  }
  writeText(sitemapPath, sitemapXml);

  return {
    ok: true,
    slug: article.slug,
    articlePath: path.relative(ROOT, articlePath),
    updatedHubs,
    updatedFiles: [
      path.relative(ROOT, articlePath),
      "blog/index.html",
      ...updatedHubs.map((slug) => `blog/${slug}/index.html`),
      "sitemap.xml"
    ]
  };
}

const appHtml = readText(path.join(ROOT, "blog-publisher-local.html"));

const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/") {
    return sendHtml(res, appHtml);
  }

  if (req.method === "GET" && req.url === "/api/categories") {
    return sendJson(res, 200, { categories });
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
