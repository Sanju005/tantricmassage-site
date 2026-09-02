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
  { id: "petaling-jaya", label: "Petaling Jaya", file: "massage-petaling-jaya/index.html", publicUrl: "/massage-petaling-jaya/", hub: null },
  { id: "subang-jaya", label: "Subang Jaya", file: "massage-subang-jaya/index.html", publicUrl: "/massage-subang-jaya/", hub: null },
  { id: "puchong", label: "Puchong", file: "massage-puchong/index.html", publicUrl: "/massage-puchong/", hub: null },
  { id: "ttdi", label: "TTDI", file: "massage-ttdi.html", publicUrl: "/massage-ttdi.html", hub: null },
  { id: "setapak", label: "Setapak", file: "massage-setapak.html", publicUrl: "/massage-setapak.html", hub: null },
  { id: "cyberjaya", label: "Cyberjaya", file: "massage-cyberjaya/index.html", publicUrl: "/massage-cyberjaya/", hub: null },
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
  { id: "kelana-jaya", label: "Kelana Jaya", file: "massage-kelana-jaya/index.html", publicUrl: "/massage-kelana-jaya", hub: null }
];
const placePageMap = Object.fromEntries(placePages.map((page) => [page.id, page]));

// Every article has one deliberate service destination. This avoids keyword-based guesses.
const bookingPages = [
  { id: "tantric", label: "Tantric Massage in Kuala Lumpur", publicUrl: "/tantric-massage-kuala-lumpur/" },
  { id: "yoni", label: "Yoni Massage in Kuala Lumpur", publicUrl: "/yoni-massage-therapy-near-me-in-kuala-lumpur/" },
  { id: "ladies", label: "Ladies Massage in Kuala Lumpur", publicUrl: "/ladies-massage-in-kl/" },
  { id: "couples", label: "Couples Massage in Kuala Lumpur", publicUrl: "/couples-massage-in-kl/" },
  { id: "hotel", label: "Hotel Massage in Kuala Lumpur", publicUrl: "/massage-kuala-lumpur/luxury-hotel-massage-service-in-kuala-lumpur/" }
];
const bookingPageMap = Object.fromEntries(bookingPages.map((page) => [page.id, page]));

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
  return String(value)
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/Ã¢â‚¬â„¢/g, "â€™")
    .replace(/Ã¢â‚¬Å“/g, "â€œ")
    .replace(/Ã¢â‚¬Â/g, "â€")
    .replace(/Ã¢â‚¬â€œ/g, "â€“")
    .replace(/Ã¢â‚¬â€/g, "â€”")
    .trim();
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

function parseCommaList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function dedupeList(values) {
  return [...new Set(values.filter(Boolean))];
}

function parseFaqEntries(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return [];
  }

  const blocks = raw.split(/\n\s*\n/).map((block) => block.trim()).filter(Boolean);
  const entries = [];

  for (const block of blocks) {
    if (block.includes("::")) {
      const parts = block.split(/\s*::\s*/);
      if (parts.length < 2) {
        throw new Error("FAQ entries must use `Question :: Answer` or `Q:` / `A:` format.");
      }

      entries.push({
        question: parts.shift().trim(),
        answer: parts.join(" :: ").trim()
      });
      continue;
    }

    const lines = block.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const questionLine = lines.find((line) => /^q\s*:/i.test(line));
    const answerLines = lines.filter((line) => /^a\s*:/i.test(line));

    if (questionLine && answerLines.length > 0) {
      entries.push({
        question: questionLine.replace(/^q\s*:/i, "").trim(),
        answer: answerLines.map((line) => line.replace(/^a\s*:/i, "").trim()).join(" ").trim()
      });
      continue;
    }

    if (lines.length >= 2) {
      entries.push({
        question: lines[0].replace(/^q\s*:/i, "").trim(),
        answer: lines.slice(1).map((line) => line.replace(/^a\s*:/i, "").trim()).join(" ").trim()
      });
      continue;
    }

    throw new Error("FAQ entries must use `Q:` / `A:` blocks or `Question :: Answer`.");
  }

  return entries.filter((entry) => entry.question && entry.answer);
}

function parseCustomSchema(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) {
    return [];
  }

  let parsed;
  try {
    parsed = JSON.parse(trimmed);
  } catch (error) {
    throw new Error("Custom JSON-LD must be valid JSON.");
  }

  return Array.isArray(parsed) ? parsed : [parsed];
}

function buildContentHtml(content) {
  const blocks = normalizeContent(content).split(/\n\s*\n/).filter(Boolean);
  const html = [];

  for (const block of blocks) {
    if (block.startsWith("### ")) {
      const lines = block.split("\n");
      const heading = lines.shift().replace(/^###\s+/, "");
      const body = lines.join("\n").trim();
      html.push(`<h3>${escapeHtml(heading)}</h3>`);
      if (body) {
        html.push(`<p>${escapeHtml(body).replace(/\n/g, "<br>")}</p>`);
      }
      continue;
    }

    if (block.startsWith("## ")) {
      const lines = block.split("\n");
      const heading = lines.shift().replace(/^##\s+/, "");
      const body = lines.join("\n").trim();
      html.push(`<h2>${escapeHtml(heading)}</h2>`);
      if (body) {
        html.push(`<p>${escapeHtml(body).replace(/\n/g, "<br>")}</p>`);
      }
      continue;
    }

    if (block.startsWith("- ")) {
      const items = block.split("\n").map((line) => line.replace(/^- /, "").trim()).filter(Boolean);
      html.push("<ul>");
      for (const item of items) {
        html.push(`<li>${escapeHtml(item)}</li>`);
      }
      html.push("</ul>");
      continue;
    }

    html.push(`<p>${escapeHtml(block).replace(/\n/g, "<br>")}</p>`);
  }

  return html.join("\n");
}

function buildArticleParts(payload) {
  const title = String(payload.title || "").trim();
  const slug = slugify(payload.slug || payload.title || "");
  const postType = "article";
  const excerptInput = String(payload.excerpt || "").trim();
  let hub = String(payload.hub || "").trim();
  let category = String(payload.category || "Wellness Guide").trim() || "Wellness Guide";
  const tagList = parseCommaList(payload.tags || "");
  const metaDescription = String(payload.metaDescription || "").trim();
  const featuredImage = normalizeFeaturedImage(payload.featuredImage || "");
  const altText = String(payload.altText || "").trim();
  const imageCaption = String(payload.imageCaption || "").trim();
  const content = String(payload.content || "").trim();
  const publishedDate = String(payload.publishedDate || new Date().toISOString().slice(0, 10)).trim();
  const publishedBy = String(payload.publishedBy || "Massage KL").trim();
  const seoTitle = String(payload.seoTitle || "").trim();
  const canonicalUrlInput = String(payload.canonicalUrl || "").trim();
  const focusKeyword = String(payload.focusKeyword || "").trim();
  const metaKeywordList = parseCommaList(payload.metaKeywords || "");
  const robots = String(payload.robots || "index, follow").trim() || "index, follow";
  const schemaType = String(payload.schemaType || "BlogPosting").trim() || "BlogPosting";
  const faqEntries = parseFaqEntries(payload.faqContent || "");
  const customSchemaEntries = parseCustomSchema(payload.customSchema || "");
  const selectedPages = Array.isArray(payload.pages) ? payload.pages.filter((item) => placePageMap[item]) : [];
  const bookingPage = bookingPageMap[String(payload.bookingPage || "").trim()];
  const contentWordCount = normalizeContent(content).split(/\s+/).filter(Boolean).length;

  if (!hub && selectedPages.length > 0) {
    hub = placePageMap[selectedPages[0]].label;
  }

  if (!title || !slug || !hub || !category || !metaDescription || !featuredImage || !altText || !content || !publishedDate || !publishedBy || selectedPages.length === 0 || !bookingPage) {
    throw new Error("Please fill all required fields.");
  }

  if ((seoTitle || title).length < 25 || (seoTitle || title).length > 65) {
    throw new Error("Title must be between 25 and 65 characters.");
  }

  if (metaDescription.length < 120 || metaDescription.length > 165) {
    throw new Error("Meta description must be between 120 and 165 characters.");
  }

  if (!focusKeyword) {
    throw new Error("Add one focus keyword or search phrase before publishing.");
  }

  if (contentWordCount < 450) {
    throw new Error(`Article content needs at least 450 original words. You currently have ${contentWordCount}.`);
  }

  const selectedPageRecords = selectedPages.map((item) => placePageMap[item]);
  const primaryPage = selectedPageRecords[0];
  const taxonomyLabels = dedupeList([hub, category, ...tagList]);
  const locationLabels = dedupeList(selectedPageRecords.map((page) => page.label));
  const articleSections = dedupeList([...taxonomyLabels, ...locationLabels]);
  const relatedHubs = [...new Set(selectedPageRecords.map((page) => page.hub).filter(Boolean))];
  const articleUrl = canonicalUrlInput || `${SITE_BASE_URL}/blog/${slug}.html`;
  const imageUrl = /^https?:\/\//i.test(featuredImage)
    ? featuredImage
    : `${SITE_BASE_URL}/${featuredImage.replace(/^\/+/, "")}`;
  const pageTitle = seoTitle || title;
  const displayDate = new Date(`${publishedDate}T12:00:00`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  const excerptSource = excerptInput || normalizeContent(content).split(/\n\s*\n/).find(Boolean) || metaDescription;
  const excerpt = excerptSource.replace(/^#{2,3}\s+/, "").replace(/\n/g, " ").trim();
  const keywordList = dedupeList([...metaKeywordList, ...tagList, focusKeyword]);
  const schema = {
    "@context": "https://schema.org",
    "@type": schemaType,
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
    articleSection: articleSections,
    keywords: keywordList,
    genre: category,
    about: {
      "@type": "Service",
      name: bookingPage.label,
      url: `${SITE_BASE_URL}${bookingPage.publicUrl}`
    }
  };
  const schemaBlocks = [schema];
  schemaBlocks.push({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${SITE_BASE_URL}/`
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: `${SITE_BASE_URL}/blog/`
      },
      {
        "@type": "ListItem",
        position: 3,
        name: primaryPage.label,
        item: `${SITE_BASE_URL}${primaryPage.publicUrl}`
      },
      {
        "@type": "ListItem",
        position: 4,
        name: title,
        item: articleUrl
      }
    ]
  });

  if (faqEntries.length > 0) {
    schemaBlocks.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqEntries.map((entry) => ({
        "@type": "Question",
        name: entry.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: entry.answer
        }
      }))
    });
  }

  schemaBlocks.push(...customSchemaEntries);
  const schemaJson = JSON.stringify(schema, null, 2);
  const extraSchemaScripts = schemaBlocks
    .slice(1)
    .map((entry) => `\n  <script type="application/ld+json">\n${JSON.stringify(entry, null, 2)}\n  <\/script>`)
    .join("");
  const contentHtml = buildContentHtml(content);
  const taxonomyTagChips = dedupeList([...tagList, ...locationLabels]).slice(0, 10);
  const excerptHtml = excerpt
    ? `<p class="article-summary">${escapeHtml(excerpt)}</p>`
    : "";
  const captionHtml = imageCaption
    ? `<figcaption class="image-caption">${escapeHtml(imageCaption)}</figcaption>`
    : "";
  const faqHtml = faqEntries.length > 0
    ? `        <section class="faq-box" aria-labelledby="faq-title">
          <h2 id="faq-title">Frequently Asked Questions</h2>
${faqEntries.map((entry) => `          <div class="faq-item">
            <h3>${escapeHtml(entry.question)}</h3>
            <p>${escapeHtml(entry.answer)}</p>
          </div>`).join("\n")}
        </section>`
    : "";

  const articleHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(pageTitle)}</title>
  <meta name="description" content="${escapeHtml(metaDescription)}">
  <meta name="keywords" content="${escapeHtml(keywordList.join(", "))}">
  <meta name="robots" content="${escapeHtml(robots)}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${escapeHtml(articleUrl)}">
  <meta property="og:title" content="${escapeHtml(pageTitle)}">
  <meta property="og:description" content="${escapeHtml(metaDescription)}">
  <meta property="og:image" content="${escapeHtml(imageUrl)}">
  <meta property="og:image:alt" content="${escapeHtml(altText)}">
  <meta property="og:site_name" content="Massage KL">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${escapeHtml(articleUrl)}">
  <meta name="twitter:title" content="${escapeHtml(pageTitle)}">
  <meta name="twitter:description" content="${escapeHtml(metaDescription)}">
  <meta name="twitter:image" content="${escapeHtml(imageUrl)}">
  <meta name="twitter:image:alt" content="${escapeHtml(altText)}">
  <link rel="canonical" href="${escapeHtml(articleUrl)}">
  <script type="application/ld+json">
${schemaJson}
  <\/script>
${extraSchemaScripts}
  <style>
    :root { --gold-main:#D4AF37; --gold-soft:#FFD700; --text-main:#FFFFFF; --text-secondary:#CCCCCC; --border-soft:rgba(212,175,55,0.18); }
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
    .featured-media { aspect-ratio:16/9; padding:.75rem; background:linear-gradient(180deg,rgba(255,255,255,.04),rgba(255,255,255,.02)); }
    .featured-media img { width:100%; height:100%; display:block; object-fit:cover; object-position:center; border-radius:1.4rem; }
    .image-caption { padding:.6rem 1rem 0; color:rgba(255,255,255,.58); font-size:.82rem; line-height:1.5; }
    .content { padding:1.5rem; }
    .breadcrumbs { display:flex; align-items:center; gap:.45rem; flex-wrap:wrap; margin-bottom:1rem; color:rgba(255,255,255,.62); font-size:.78rem; }
    .breadcrumbs a { color:var(--gold-main); }
    .category { color:var(--gold-main); font-size:.74rem; font-weight:700; letter-spacing:.24em; text-transform:uppercase; }
    .article-title { max-width:24ch; margin:.8rem 0 0; font-size:clamp(1.8rem,5vw,3.2rem); line-height:1.05; }
    .meta { margin-top:1rem; color:var(--text-secondary); font-size:.9rem; }
    .article-summary { margin-top:1.4rem; padding:1rem 1.1rem; border-left:3px solid rgba(212,175,55,.52); border-radius:1rem; background:rgba(255,255,255,.04); color:#f3e6b5; font-size:.98rem; line-height:1.7; }
    .tags { display:flex; flex-wrap:wrap; gap:.5rem; margin-top:1.25rem; }
    .tag { border:1px solid rgba(212,175,55,.24); border-radius:999px; padding:.38rem .7rem; color:rgba(255,255,255,.78); font-size:.76rem; }
    .article-body { margin-top:1.8rem; color:var(--text-secondary); font-size:1rem; line-height:1.68; }
    .article-body p { margin:1rem 0 0; }
    .article-body h2 { color:var(--text-main); font-size:1.3rem; line-height:1.3; margin:2rem 0 0; font-weight:800; }
    .article-body h3 { color:var(--text-main); font-size:1.1rem; line-height:1.3; margin:1.6rem 0 0; font-weight:700; }
    .article-body ul { padding-left:1.35rem; margin:.85rem 0 1rem; }
    .article-body li { margin:.45rem 0; padding-left:.15rem; }
    .article-body li::marker { color:var(--gold-soft); }
    .faq-box { margin-top:2rem; border:1px solid rgba(212,175,55,.2); border-radius:1.3rem; background:rgba(255,255,255,.03); padding:1.1rem; }
    .faq-box h2 { margin:0 0 1rem; color:var(--text-main); font-size:1.24rem; }
    .faq-item + .faq-item { margin-top:1rem; padding-top:1rem; border-top:1px solid rgba(255,255,255,.08); }
    .faq-item h3 { margin:0 0 .45rem; color:var(--gold-soft); font-size:1rem; }
    .faq-item p { margin:0; color:var(--text-secondary); line-height:1.65; }
    .booking-cta { margin-top:2rem; padding:1.25rem; border:1px solid rgba(212,175,55,.5); border-radius:1rem; background:linear-gradient(135deg,rgba(212,175,55,.14),rgba(255,255,255,.03)); }
    .booking-cta p { margin:0 0 .55rem; color:var(--text-secondary); }
    .booking-cta a { color:var(--gold-soft); font-weight:700; }
    .bottom-nav { position:fixed; left:50%; bottom:1rem; transform:translateX(-50%); width:calc(100% - 1.5rem); max-width:31rem; z-index:50; }
    .bottom-nav-wrap { display:flex; gap:.65rem; }
    .bottom-nav-main,.bottom-nav-chat { position:relative; overflow:hidden; min-height:3.35rem; display:flex; align-items:center; justify-content:center; border-radius:999px; font-weight:700; backdrop-filter:blur(16px); }
    .bottom-nav-main { width:75%; padding:.8rem .75rem; font-size:.76rem; letter-spacing:.08em; text-transform:uppercase; white-space:nowrap; line-height:1; color:#111; border:2px solid rgba(0,0,0,.88); background:linear-gradient(180deg,#f1cd58 0%,#d4af37 52%,#b58d1b 100%); box-shadow:inset 0 2px 0 rgba(255,249,210,.72),inset 0 -4px 0 rgba(108,75,0,.28),0 12px 0 rgba(0,0,0,.22),0 18px 34px rgba(0,0,0,.28),0 0 28px rgba(255,215,0,.24); }
    .bottom-nav-chat { width:25%; color:#25D366; border:1.8px solid rgba(212,175,55,.9); background:rgba(12,12,12,.94); box-shadow:0 18px 40px rgba(0,0,0,.38),inset 0 1px 0 rgba(255,255,255,.06); }
    .bottom-nav-chat svg { width:1.55rem; height:1.55rem; }
    @media (min-width:760px) { .article-shell{padding-top:3rem;} .content{padding:2.5rem;} }
  </style>
</head>
<body>
  <header style="position:sticky; top:0; z-index:30; border-bottom:1px solid rgba(255,255,255,.08); background:rgba(11,11,11,.88); backdrop-filter:blur(18px);"><div class="app-block" style="padding:0 1rem;"><div style="display:flex; align-items:center; justify-content:space-between; padding:1rem 0;"><a href="/" aria-label="Home" style="display:inline-flex; height:3rem; align-items:center;"><img src="/images/logo.png" alt="Massage KL logo" width="316" height="324" loading="lazy" decoding="async" style="height:2.5rem; width:auto; object-fit:contain;"></a><div style="display:flex; align-items:center; gap:.75rem;"><button id="site-menu-open" type="button" aria-label="Open menu" class="menu-button"><svg style="height:1rem; width:1rem;" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button><a href="/services.html" class="gold-button">Book Now</a></div></div></div></header>
  <div id="site-menu" class="site-menu" aria-hidden="true"><div class="site-menu__panel"><div class="site-menu__head"><p class="site-menu__title">Menu</p><button id="site-menu-close" type="button" class="site-menu__close" aria-label="Close menu">&times;</button></div><div class="site-menu__links"><a href="/" class="site-menu__link"><span>Home</span><span>&rarr;</span></a><a href="/blog/" class="site-menu__link"><span>Blog</span><span>&rarr;</span></a><a href="${escapeHtml(primaryPage.publicUrl)}" class="site-menu__link"><span>${escapeHtml(primaryPage.label)} Hub</span><span>&rarr;</span></a><a href="/services.html" class="site-menu__link"><span>Packages</span><span>&rarr;</span></a><a href="/contact.html" class="site-menu__link"><span>Contact</span><span>&rarr;</span></a></div></div></div>
  <main class="article-shell">
    <article class="app-block article-card">
      <div class="featured-media"><img src="${escapeHtml(featuredImage)}" alt="${escapeHtml(altText)}" width="1600" height="900" loading="eager" decoding="async"></div>
${captionHtml}
      <div class="content">
        <nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="${escapeHtml(primaryPage.publicUrl)}">${escapeHtml(primaryPage.label)} Massage</a><span>/</span><span>${escapeHtml(title)}</span></nav>
        <a href="${escapeHtml(primaryPage.publicUrl)}" class="category">${escapeHtml(hub)} / ${escapeHtml(category)}</a>
        <h1 class="article-title">${escapeHtml(title)}</h1>
        <p class="meta">Created on ${escapeHtml(displayDate)} by ${escapeHtml(publishedBy)} • ${escapeHtml(postType)}</p>
        ${excerptHtml}
        <div class="tags">${taxonomyTagChips.map((label) => `<span class="tag">${escapeHtml(label)}</span>`).join("")}</div>
        <div class="article-body">
${contentHtml}
        </div>
        <aside class="booking-cta" aria-label="Related booking service"><p>Looking for a private booking in Kuala Lumpur?</p><a href="${escapeHtml(bookingPage.publicUrl)}">Explore ${escapeHtml(bookingPage.label)} &rarr;</a></aside>
${faqHtml}
      </div>
    </article>
  </main>
  <nav class="bottom-nav"><div class="bottom-nav-wrap"><a href="/services.html" class="bottom-nav-main">See Massage Packages</a><a href="https://wa.me/60164649008?text=Hi I would like to book a massage session 🙂" class="bottom-nav-chat" aria-label="Chat with masseur"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.198-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.019-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.372-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479s1.065 2.875 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.71.307 1.263.49 1.694.627.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.29.173-1.413-.074-.124-.272-.198-.57-.347Z"/><path d="M12.004 2.003a9.93 9.93 0 0 0-8.59 15.01L2 22l5.124-1.345a9.967 9.967 0 0 0 4.88 1.27h.004c5.514 0 9.996-4.48 9.998-9.994A9.95 9.95 0 0 0 12.004 2.003Zm0 18.18h-.003a8.3 8.3 0 0 1-4.231-1.158l-.303-.18-3.04.798.812-2.963-.197-.305a8.28 8.28 0 0 1-1.28-4.445c.002-4.582 3.731-8.31 8.316-8.31 2.222 0 4.31.865 5.88 2.438a8.27 8.27 0 0 1 2.432 5.884c-.002 4.584-3.73 8.31-8.314 8.31Z"/></svg></a></div></nav>
  <script>
    const siteMenuOpen = document.querySelector('#site-menu-open');
    const siteMenu = document.querySelector('#site-menu');
    const siteMenuClose = document.querySelector('#site-menu-close');
    const openMenu = () => { siteMenu?.classList.add('is-open'); siteMenu?.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; };
    const closeMenu = () => { siteMenu?.classList.remove('is-open'); siteMenu?.setAttribute('aria-hidden','true'); document.body.style.overflow=''; };
    siteMenuOpen?.addEventListener('click', openMenu); siteMenuClose?.addEventListener('click', closeMenu); siteMenu?.addEventListener('click', (event) => { if (event.target === siteMenu) closeMenu(); }); document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeMenu(); });
  <\/script>
</body>
</html>`;

  const blogIndexCard = `<a href="/blog/${escapeHtml(slug)}.html" class="card card-link" data-sort-date="${escapeHtml(publishedDate)}">
          <div class="card-image" style="background-image:url('${escapeHtml(featuredImage)}');" role="img" aria-label="${escapeHtml(altText)}"></div>
          <div class="card-body">
            <p class="card-category">${escapeHtml(category)} • ${escapeHtml(hub)}</p>
            <p class="card-date">Created: ${escapeHtml(displayDate)}</p>
            <h2 class="card-title">${escapeHtml(title)}</h2>
            <p class="card-copy">${escapeHtml(excerpt).slice(0, 180)}</p>
          </div>
        </a>`;

  const hubCard = `<article class="card card-link" data-sort-date="${escapeHtml(publishedDate)}">
      <div class="card-image" style="background-image:url('${escapeHtml(featuredImage)}');" role="img" aria-label="${escapeHtml(altText)}"></div>
      <div class="card-body">
        <p class="card-category">${escapeHtml(category)}</p>
        <p class="card-date">Created: ${escapeHtml(displayDate)}</p>
        <h2 class="card-title">${escapeHtml(title)}</h2>
        <p class="card-copy">${escapeHtml(excerpt).slice(0, 220)}</p>
        <a href="/blog/${escapeHtml(slug)}.html" class="mt-5 inline-flex text-sm font-semibold" style="color: var(--gold-soft);">Read article</a>
      </div>
    </article>`;

  const buildPlaceRichCard = (page) => `<a href="/blog/${escapeHtml(slug)}.html" class="article-card luxury-card rounded-[1.75rem] transition hover:-translate-y-1" data-sort-date="${escapeHtml(publishedDate)}">
      <div class="article-card__image" style="background-image: url('${escapeHtml(featuredImage)}');" role="img" aria-label="${escapeHtml(altText)}"></div>
      <div class="p-6">
        <p class="text-xs uppercase tracking-[0.24em]" style="color: var(--gold-main);">${escapeHtml(category)} • ${escapeHtml(page.label)}</p>
        <p class="mt-3 text-xs uppercase tracking-[0.22em]" style="color: var(--text-secondary);">Created: ${escapeHtml(displayDate)}</p>
        <h2 class="mt-3 text-xl font-semibold">${escapeHtml(title)}</h2>
        <div class="mt-4 flex flex-wrap gap-2"><span class="article-tag">${escapeHtml(page.label)}</span><span class="article-tag">${escapeHtml(hub)}</span></div>
        <p class="mt-4 text-sm leading-7" style="color: var(--text-secondary);">${escapeHtml(excerpt).slice(0, 220)}</p>
        <span class="mt-5 inline-flex text-sm font-semibold" style="color: var(--gold-soft);">Read article &rarr;</span>
      </div>
    </a>`;

  const buildSimplePlaceCard = (page) => `<a href="/blog/${escapeHtml(slug)}.html" class="card" style="display:block;" data-sort-date="${escapeHtml(publishedDate)}">
          <div class="card-image" style="background-image:url('${escapeHtml(featuredImage)}');" role="img" aria-label="${escapeHtml(altText)}"></div>
          <div class="card-body"><p class="kicker">${escapeHtml(category)}</p><p class="card-date">Created: ${escapeHtml(displayDate)}</p><h2 class="card-title">${escapeHtml(title)}</h2><p class="card-copy">${escapeHtml(excerpt).slice(0, 220)}</p><div class="tag-row"><span class="tag">${escapeHtml(page.label)}</span><span class="tag">${escapeHtml(hub)}</span></div></div>
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
    bookingPage,
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

function findTagStartByClass(html, tagName, requiredClasses) {
  const pattern = new RegExp(`<${tagName}\\b[^>]*class=["'][^"']*["'][^>]*>`, "ig");
  let match;

  while ((match = pattern.exec(html)) !== null) {
    const tagHtml = match[0];
    const classMatch = tagHtml.match(/class=["']([^"']*)["']/i);
    if (!classMatch) {
      continue;
    }

    const classes = classMatch[1].split(/\s+/).filter(Boolean);
    if (requiredClasses.every((className) => classes.includes(className))) {
      return match.index;
    }
  }

  return -1;
}

function parseHumanDateToIso(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) {
    return "";
  }

  const parsed = new Date(`${trimmed} 12:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toISOString().slice(0, 10);
}

function resolveLocalPathFromUrl(url) {
  let normalized = String(url || "").trim();
  if (!normalized) {
    return "";
  }

  if (normalized.startsWith(SITE_BASE_URL)) {
    normalized = normalized.slice(SITE_BASE_URL.length);
  }

  if (!normalized.startsWith("/")) {
    return "";
  }

  const relativePath = normalized.replace(/^\/+/, "");
  if (!relativePath) {
    return "";
  }

  if (relativePath.endsWith(".html")) {
    return path.join(ROOT, relativePath);
  }

  return path.join(ROOT, relativePath, "index.html");
}

function extractArticleDateFromFile(filePath) {
  if (!filePath || !fs.existsSync(filePath)) {
    return "";
  }

  const html = readText(filePath);
  const modifiedMatch = html.match(/"dateModified"\s*:\s*"(\d{4}-\d{2}-\d{2})"/);
  if (modifiedMatch) {
    return modifiedMatch[1];
  }

  const publishedMatch = html.match(/"datePublished"\s*:\s*"(\d{4}-\d{2}-\d{2})"/);
  if (publishedMatch) {
    return publishedMatch[1];
  }

  const visibleDateMatch = html.match(/Updated(?:\s+on)?\s+([A-Za-z]+\s+\d{1,2},\s+\d{4})|Created(?:\s+on)?\s+([A-Za-z]+\s+\d{1,2},\s+\d{4})/i);
  if (visibleDateMatch) {
    return parseHumanDateToIso(visibleDateMatch[1] || visibleDateMatch[2]);
  }

  return "";
}

function extractCardUrl(cardHtml) {
  const hrefMatch = cardHtml.match(/href=["']([^"']+)["']/i);
  return hrefMatch ? hrefMatch[1] : "";
}

function extractCardTitle(cardHtml) {
  const titleMatch = cardHtml.match(/<h2\b[^>]*>([\s\S]*?)<\/h2>/i);
  if (!titleMatch) {
    return "";
  }

  return titleMatch[1]
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .trim();
}

function extractCardSortDate(cardHtml) {
  const attrMatch = cardHtml.match(/data-sort-date=["'](\d{4}-\d{2}-\d{2})["']/i);
  if (attrMatch) {
    return attrMatch[1];
  }

  const visibleDateMatch = cardHtml.match(/(?:Created|Updated)\s*:\s*([A-Za-z]+\s+\d{1,2},\s+\d{4})/i);
  if (visibleDateMatch) {
    return parseHumanDateToIso(visibleDateMatch[1]);
  }

  const linkedFilePath = resolveLocalPathFromUrl(extractCardUrl(cardHtml));
  return extractArticleDateFromFile(linkedFilePath);
}

function findMatchingClosingTag(html, startIndex, tagName) {
  if (startIndex === -1) {
    return -1;
  }

  const tokenPattern = new RegExp(`<\\/?${tagName}\\b[^>]*>`, "ig");
  tokenPattern.lastIndex = startIndex;
  let depth = 0;
  let started = false;
  let match;

  while ((match = tokenPattern.exec(html)) !== null) {
    const token = match[0];
    if (token.startsWith(`</${tagName}`)) {
      depth -= 1;
      if (started && depth === 0) {
        return tokenPattern.lastIndex;
      }
      continue;
    }

    depth += 1;
    started = true;
  }

  return -1;
}

function collectCardBlocks(fragment) {
  const blocks = [];
  const pattern = /<(a|article)\b/ig;
  let match;

  while ((match = pattern.exec(fragment)) !== null) {
    const start = match.index;
    const end = findMatchingClosingTag(fragment, start, match[1].toLowerCase());
    if (end === -1) {
      continue;
    }

    blocks.push(fragment.slice(start, end).trim());
    pattern.lastIndex = end;
  }

  return blocks;
}

function sortCardBlocks(blocks) {
  return [...blocks].sort((left, right) => {
    const rightDate = extractCardSortDate(right);
    const leftDate = extractCardSortDate(left);
    return rightDate.localeCompare(leftDate);
  });
}

function formatSortedBlocks(blocks, indent) {
  if (blocks.length === 0) {
    return "";
  }

  return `${indent}${blocks.join(`\n\n${indent}`)}\n`;
}

function buildOrderedCardEntries(blocks) {
  return blocks
    .map((block) => {
      const url = extractCardUrl(block);
      if (!url) {
        return null;
      }

      return {
        url: url.startsWith("http") ? url : `${SITE_BASE_URL}${url}`,
        name: extractCardTitle(block)
      };
    })
    .filter(Boolean);
}

function syncItemListSchemaWithUrls(html, orderedUrls) {
  const orderedEntries = orderedUrls.map((url) => ({ url, name: "" }));
  return syncItemListSchemaWithEntries(html, orderedEntries);
}

function syncItemListSchemaWithEntries(html, orderedEntries) {
  if (!orderedEntries.length) {
    return html;
  }

  return html.replace(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/g, (fullMatch, jsonText) => {
    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch (error) {
      return fullMatch;
    }

    const itemLists = [];
    if (parsed && parsed["@type"] === "ItemList" && Array.isArray(parsed.itemListElement)) {
      itemLists.push(parsed);
    }
    if (Array.isArray(parsed?.["@graph"])) {
      for (const node of parsed["@graph"]) {
        if (node && node["@type"] === "ItemList" && Array.isArray(node.itemListElement)) {
          itemLists.push(node);
        }
      }
    }

    if (itemLists.length === 0) {
      return fullMatch;
    }

    for (const list of itemLists) {
      const byUrl = new Map(
        list.itemListElement
          .filter((item) => item && item.url)
          .map((item) => [item.url, item])
      );
      const reordered = [];

      for (const entry of orderedEntries) {
        if (byUrl.has(entry.url)) {
          reordered.push(byUrl.get(entry.url));
          byUrl.delete(entry.url);
          continue;
        }

        if (entry.name) {
          reordered.push({
            "@type": "ListItem",
            url: entry.url,
            name: entry.name
          });
        }
      }

      reordered.push(...byUrl.values());
      list.itemListElement = reordered.map((item, index) => ({
        ...item,
        position: index + 1
      }));
    }

    return `<script type="application/ld+json">\n${JSON.stringify(parsed, null, 2)}\n  <\/script>`;
  });
}

function sortBlogIndexCards(html) {
  const sectionStart = findTagStartByClass(html, "section", [
    "mt-10",
    "grid",
    "gap-6",
    "md:grid-cols-2",
    "xl:grid-cols-4"
  ]);
  if (sectionStart === -1) {
    throw new Error("Could not find the blog grid in blog/index.html");
  }

  const contentStart = html.indexOf(">", sectionStart) + 1;
  const sectionEnd = html.indexOf("</section>", sectionStart);
  if (sectionEnd === -1) {
    throw new Error("Could not find the end of the blog grid in blog/index.html");
  }

  const sortedBlocks = sortCardBlocks(collectCardBlocks(html.slice(contentStart, sectionEnd)));
  const orderedEntries = buildOrderedCardEntries(sortedBlocks);
  const updatedHtml = `${html.slice(0, contentStart)}\n${formatSortedBlocks(sortedBlocks, "        ")}${html.slice(sectionEnd)}`;
  return syncItemListSchemaWithEntries(updatedHtml, orderedEntries);
}

function collectTopLevelGridCardBlocks(html, gridStart) {
  const gridOpenEnd = html.indexOf(">", gridStart);
  if (gridOpenEnd === -1) {
    return null;
  }

  const blocks = [];
  let cursor = gridOpenEnd + 1;

  while (cursor < html.length) {
    const remaining = html.slice(cursor);
    const whitespaceMatch = remaining.match(/^\s*/);
    cursor += whitespaceMatch ? whitespaceMatch[0].length : 0;

    if (html.startsWith("</div>", cursor)) {
      return {
        contentStart: gridOpenEnd + 1,
        contentEnd: cursor,
        blocks
      };
    }

    if (html.startsWith("<a", cursor) || html.startsWith("<article", cursor)) {
      const tagName = html.startsWith("<article", cursor) ? "article" : "a";
      const blockEnd = findMatchingClosingTag(html, cursor, tagName);
      if (blockEnd === -1) {
        break;
      }
      blocks.push(html.slice(cursor, blockEnd).trim());
      cursor = blockEnd;
      continue;
    }

    break;
  }

  return null;
}

function sortHubGridCards(html) {
  const mainStart = html.indexOf("<main");
  if (mainStart === -1) {
    return html;
  }

  const gridStart = html.indexOf('<div class="grid">', mainStart);
  if (gridStart === -1) {
    return html;
  }

  const gridData = collectTopLevelGridCardBlocks(html, gridStart);
  if (!gridData || gridData.blocks.length === 0) {
    return html;
  }

  const sortedBlocks = sortCardBlocks(gridData.blocks);
  const orderedEntries = buildOrderedCardEntries(sortedBlocks);
  const updatedHtml = `${html.slice(0, gridData.contentStart)}\n${formatSortedBlocks(sortedBlocks, "        ")}${html.slice(gridData.contentEnd)}`;
  return syncItemListSchemaWithEntries(updatedHtml, orderedEntries);
}

function sortHubArticles(html) {
  const gridSorted = sortHubGridCards(html);
  if (gridSorted !== html) {
    return gridSorted;
  }

  const mainStart = html.indexOf("<main");
  const firstArticle = html.indexOf("<article", mainStart);
  const mainClose = html.lastIndexOf("</main>");
  if (mainStart === -1 || firstArticle === -1 || mainClose === -1) {
    return html;
  }

  const sortedBlocks = sortCardBlocks(collectCardBlocks(html.slice(firstArticle, mainClose)));
  const orderedEntries = buildOrderedCardEntries(sortedBlocks);
  const updatedHtml = `${html.slice(0, firstArticle)}${formatSortedBlocks(sortedBlocks, "    ")}${html.slice(mainClose)}`;
  return syncItemListSchemaWithEntries(updatedHtml, orderedEntries);
}

function sortPlacePageCards(html) {
  const autoStart = html.indexOf("<!-- AUTO_ARTICLE_GRID_START:");
  const autoEnd = html.indexOf("<!-- AUTO_ARTICLE_GRID_END:");
  if (autoStart === -1 || autoEnd === -1) {
    return html;
  }

  const contentStart = html.indexOf("-->", autoStart) + 3;
  const sortedBlocks = sortCardBlocks(collectCardBlocks(html.slice(contentStart, autoEnd)));
  return `${html.slice(0, contentStart)}\n${formatSortedBlocks(sortedBlocks, "          ")}${html.slice(autoEnd)}`;
}

function insertIntoBlogIndex(html, cardHtml, slug) {
  if (html.includes(`/blog/${slug}.html`)) {
    return html;
  }

  const sectionStart = findTagStartByClass(html, "section", [
    "mt-10",
    "grid",
    "gap-6",
    "md:grid-cols-2",
    "xl:grid-cols-4"
  ]);
  if (sectionStart === -1) {
    throw new Error("Could not find the blog grid in blog/index.html");
  }

  const insertAt = html.indexOf(">", sectionStart);
  return sortBlogIndexCards(`${html.slice(0, insertAt + 1)}\n        ${cardHtml}\n${html.slice(insertAt + 1)}`);
}

function insertIntoHubIndex(html, cardHtml, slug) {
  if (html.includes(`/blog/${slug}.html`)) {
    return html;
  }

  const mainStart = html.indexOf("<main");
  const firstArticle = html.indexOf("<article", mainStart);
  if (firstArticle !== -1) {
    return sortHubArticles(`${html.slice(0, firstArticle)}    ${cardHtml}\n${html.slice(firstArticle)}`);
  }

  const mainClose = html.lastIndexOf("</main>");
  if (mainClose === -1) {
    throw new Error("Could not find </main> in hub index");
  }

  return sortHubArticles(`${html.slice(0, mainClose)}\n    ${cardHtml}\n${html.slice(mainClose)}`);
}

function insertIntoPlacePage(html, richCardHtml, simpleCardHtml, slug) {
  if (html.includes(`/blog/${slug}.html`) || html.includes(`/massage-kuala-lumpur/${slug}/`)) {
    return html;
  }

  const autoStart = html.indexOf("<!-- AUTO_ARTICLE_GRID_START:");
  const autoEnd = html.indexOf("<!-- AUTO_ARTICLE_GRID_END:");
  if (autoStart !== -1 && autoEnd !== -1) {
    const autoCard = html.includes("article-card__image") ? richCardHtml : simpleCardHtml;
    const markerClose = html.indexOf("-->", autoStart);
    return sortPlacePageCards(`${html.slice(0, markerClose + 3)}\n          ${autoCard}\n${html.slice(markerClose + 3)}`);
  }

  const gridStart = html.indexOf('<div class="grid">');
  if (gridStart !== -1) {
    const insertAt = html.indexOf(">", gridStart);
    return `${html.slice(0, insertAt + 1)}\n        ${simpleCardHtml}\n${html.slice(insertAt + 1)}`;
  }

  throw new Error("Could not find a supported article insertion point on the place page.");
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

function ensureRobotsTxt(content) {
  let text = String(content || "").trim();
  if (!text) {
    text = "User-agent: *\nAllow: /";
  }

  if (!/^User-agent:\s*\*/im.test(text)) {
    text = `User-agent: *\nAllow: /\n\n${text}`;
  }

  if (!/^Allow:\s*\/$/im.test(text)) {
    text = `${text}\nAllow: /`;
  }

  if (!/^Sitemap:\s*https:\/\/www\.massagekl\.com\/sitemap\.xml$/im.test(text)) {
    text = `${text}\n\nSitemap: https://www.massagekl.com/sitemap.xml`;
  }

  return `${text.replace(/\n{3,}/g, "\n\n")}\n`;
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

  const robotsPath = path.join(ROOT, "robots.txt");
  if (fs.existsSync(robotsPath)) {
    writeText(robotsPath, ensureRobotsTxt(readText(robotsPath)));
  } else {
    writeText(robotsPath, ensureRobotsTxt(""));
  }

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
      "sitemap.xml",
      "robots.txt"
    ]
  };
}

function repairHubOrdering() {
  const blogIndexPath = path.join(ROOT, "blog", "index.html");
  writeText(blogIndexPath, sortBlogIndexCards(readText(blogIndexPath)));

  const blogHubPaths = [
    path.join(ROOT, "blog", "kuala-lumpur", "index.html"),
    path.join(ROOT, "blog", "klcc", "index.html"),
    path.join(ROOT, "blog", "bangsar", "index.html"),
    path.join(ROOT, "blog", "mont-kiara", "index.html")
  ];

  for (const filePath of blogHubPaths) {
    if (fs.existsSync(filePath)) {
      writeText(filePath, sortHubArticles(readText(filePath)));
    }
  }

  const placeHubPaths = [
    path.join(ROOT, "massage-kuala-lumpur", "index.html"),
    path.join(ROOT, "massage-klcc", "index.html"),
    path.join(ROOT, "massage-bangsar", "index.html"),
    path.join(ROOT, "massage-mont-kiara", "index.html")
  ];

  for (const filePath of placeHubPaths) {
    if (fs.existsSync(filePath)) {
      let html = readText(filePath);
      html = sortPlacePageCards(html);
      html = updateAutoArticleCount(html);
      writeText(filePath, html);
    }
  }

  const topicHubPaths = [
    path.join(ROOT, "tantric-yoni-massage-for-ladies-couples-in-kl", "index.html"),
    path.join(ROOT, "ladies-massage-in-kl", "index.html"),
    path.join(ROOT, "couples-massage-in-kl", "index.html")
  ];

  for (const filePath of topicHubPaths) {
    if (fs.existsSync(filePath)) {
      writeText(filePath, sortHubArticles(readText(filePath)));
    }
  }
}

const appHtml = readText(path.join(ROOT, "blog-publisher-local.html"));

if (process.argv.includes("--repair-sort")) {
  repairHubOrdering();
  console.log("Sorted blog and hub pages by newest article date.");
  process.exit(0);
}

const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/") {
    return sendHtml(res, appHtml);
  }

  if (req.method === "GET" && req.url === "/api/pages") {
    return sendJson(res, 200, { pages: placePages });
  }

  if (req.method === "GET" && req.url === "/api/booking-pages") {
    return sendJson(res, 200, { pages: bookingPages });
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
