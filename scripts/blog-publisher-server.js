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

const ALLOWED_IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);
const MAX_IMAGE_UPLOAD_BYTES = 8 * 1024 * 1024;

function sanitizeUploadFilename(name) {
  const base = String(name || "image").split(/[\\/]/).pop();
  const cleaned = base.replace(/[^a-zA-Z0-9.\-]+/g, "-").replace(/-+/g, "-");
  return cleaned || "image.jpg";
}

// Inline content images (inserted from the rich-text editor's image button),
// separate from the article's single required "Featured Image" field.
function handleImageUpload(payload) {
  const safeName = sanitizeUploadFilename(payload.filename);
  const ext = path.extname(safeName).toLowerCase();
  if (!ALLOWED_IMAGE_EXTENSIONS.has(ext)) {
    throw new Error("Only JPG, PNG, WEBP, or GIF images are allowed.");
  }

  const rawData = String(payload.dataBase64 || "");
  const base64Payload = rawData.includes(",") ? rawData.slice(rawData.indexOf(",") + 1) : rawData;
  const buffer = Buffer.from(base64Payload, "base64");

  if (buffer.length === 0) {
    throw new Error("The uploaded image is empty.");
  }
  if (buffer.length > MAX_IMAGE_UPLOAD_BYTES) {
    throw new Error("Images must be 8MB or smaller.");
  }

  const stamp = Date.now().toString(36);
  const uniqueName = `${stamp}-${safeName}`;
  const targetDir = path.join(ROOT, "blog", "kuala-lumpur", "images");
  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(path.join(targetDir, uniqueName), buffer);

  return { ok: true, url: `/blog/kuala-lumpur/images/${uniqueName}` };
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

// The Content field is now a rich-text (Quill) editor, so the payload arrives
// as real HTML rather than the old "##"/"###"/"-" markdown-lite text. Because
// this HTML gets embedded directly into a live public page, it is sanitized
// with a strict allowlist rather than trusted as-is - this matters even for a
// single-owner tool, since it's a defense against a bad paste (e.g. HTML
// copied from an untrusted source) turning into a live XSS payload.
const ALLOWED_HTML_TAGS = new Set(["p", "h2", "h3", "strong", "b", "em", "i", "u", "s", "ul", "ol", "li", "br", "a", "img", "span", "blockquote"]);
const BLOCK_STRIP_TAGS = ["script", "style", "iframe", "object", "embed", "form", "link", "meta", "noscript", "svg", "video", "audio", "source"];
const ALLOWED_HTML_ATTRS = {
  a: ["href", "target"],
  img: ["src", "alt", "width", "height"],
  span: ["class"],
  p: ["class"]
};
const ALLOWED_SPAN_CLASSES = new Set(["ql-size-small", "ql-size-large", "ql-size-huge"]);
const ALLOWED_P_CLASSES = new Set(["ql-align-center", "ql-align-right", "ql-align-justify"]);

function escapeAttr(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function isSafeUrl(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) {
    return false;
  }
  return /^https?:\/\//i.test(trimmed) || /^mailto:/i.test(trimmed) || trimmed.startsWith("/");
}

function parseAttrs(attrString) {
  const attrs = {};
  const pattern = /([a-zA-Z-:]+)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/g;
  let match;
  while ((match = pattern.exec(attrString)) !== null) {
    const name = match[1].toLowerCase();
    attrs[name] = match[3] !== undefined ? match[3] : (match[4] !== undefined ? match[4] : match[5]);
  }
  return attrs;
}

function sanitizeHtml(html) {
  let out = String(html || "");

  for (const tag of BLOCK_STRIP_TAGS) {
    out = out.replace(new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`, "gi"), "");
    out = out.replace(new RegExp(`<${tag}\\b[^>]*\\/?>`, "gi"), "");
  }

  out = out.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)((?:\s+[a-zA-Z-:]+(?:=(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*\/?>/g, (full, rawTag, attrString) => {
    const tag = rawTag.toLowerCase();
    const isClosing = full.charAt(1) === "/";

    if (!ALLOWED_HTML_TAGS.has(tag)) {
      return "";
    }

    if (isClosing) {
      return `</${tag}>`;
    }

    const allowedForTag = ALLOWED_HTML_ATTRS[tag] || [];
    const attrs = parseAttrs(attrString);
    let cleanAttrs = "";

    for (const attrName of allowedForTag) {
      if (!(attrName in attrs)) {
        continue;
      }
      let value = attrs[attrName];

      if ((attrName === "href" || attrName === "src") && !isSafeUrl(value)) {
        continue;
      }

      if (attrName === "class") {
        const allowedClasses = tag === "span" ? ALLOWED_SPAN_CLASSES : ALLOWED_P_CLASSES;
        const filtered = value.split(/\s+/).filter((cls) => allowedClasses.has(cls));
        if (filtered.length === 0) {
          continue;
        }
        value = filtered.join(" ");
      }

      if (attrName === "target") {
        value = "_blank";
      }

      cleanAttrs += ` ${attrName}="${escapeAttr(value)}"`;
    }

    if (tag === "a" && attrs.href && isSafeUrl(attrs.href)) {
      cleanAttrs += ' rel="noopener noreferrer"';
    }

    const selfClosing = tag === "br" || tag === "img";
    return `<${tag}${cleanAttrs}${selfClosing ? " /" : ""}>`;
  });

  return out.trim();
}

function stripTags(html) {
  return String(html || "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(p|h2|h3|li|blockquote)>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function firstParagraphText(html) {
  // Skip headings - the excerpt should be real body copy, not a section title.
  const match = String(html || "").match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  return stripTags(match ? match[1] : html);
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
  const contentWordCount = stripTags(normalizeContent(content)).split(/\s+/).filter(Boolean).length;

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
  const articleRelativeUrl = `/massage-kuala-lumpur/${slug}/`;
  const articleUrl = canonicalUrlInput || `${SITE_BASE_URL}${articleRelativeUrl}`;
  const legacyBlogUrl = `${SITE_BASE_URL}/blog/${slug}.html`;
  const imageUrl = /^https?:\/\//i.test(featuredImage)
    ? featuredImage
    : `${SITE_BASE_URL}/${featuredImage.replace(/^\/+/, "")}`;
  const pageTitle = seoTitle || title;
  const displayDate = new Date(`${publishedDate}T12:00:00`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  const excerptSource = excerptInput || firstParagraphText(normalizeContent(content)) || metaDescription;
  const excerpt = excerptSource.replace(/\s+/g, " ").trim();
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
  const contentHtml = sanitizeHtml(normalizeContent(content));
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
  const shareText = encodeURIComponent(title);
  const shareUrl = encodeURIComponent(articleUrl);
  const shareHtml = `<div class="share-wrap"><p class="share-label">Share</p><div class="share-row" aria-label="Share this article"><a class="share-btn" href="https://wa.me/?text=${shareText}%20${shareUrl}" target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.198-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.019-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.372-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479s1.065 2.875 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.71.307 1.263.49 1.694.627.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.29.173-1.413-.074-.124-.272-.198-.57-.347Z"/><path d="M12.004 2.003a9.93 9.93 0 0 0-8.59 15.01L2 22l5.124-1.345a9.967 9.967 0 0 0 4.88 1.27h.004c5.514 0 9.996-4.48 9.998-9.994A9.95 9.95 0 0 0 12.004 2.003Zm0 18.18h-.003a8.3 8.3 0 0 1-4.231-1.158l-.303-.18-3.04.798.812-2.963-.197-.305a8.28 8.28 0 0 1-1.28-4.445c.002-4.582 3.731-8.31 8.316-8.31 2.222 0 4.31.865 5.88 2.438a8.27 8.27 0 0 1 2.432 5.884c-.002 4.584-3.73 8.31-8.314 8.31Z"/></svg><span>WhatsApp</span></a><a class="share-btn" href="https://www.facebook.com/sharer/sharer.php?u=${shareUrl}" target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.5 21v-7.2H16l.4-2.8h-2.9V9.2c0-.81.27-1.36 1.44-1.36h1.55V5.3c-.27-.04-1.19-.12-2.26-.12-2.23 0-3.76 1.3-3.76 3.9V11H8v2.8h2.48V21h3.02Z"/></svg><span>Facebook</span></a><a class="share-btn" href="https://www.instagram.com/healingmassagekl/" target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="4.2" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="3.7" stroke="currentColor" stroke-width="1.8"/><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor"/></svg><span>Instagram</span></a><a class="share-btn" href="https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareText}" target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.9 2H22l-6.77 7.74L23.2 22h-6.25l-4.9-6.4L6.46 22H3.35l7.24-8.28L1 2h6.4l4.43 5.85L18.9 2Zm-1.1 18h1.73L6.45 3.9H4.58L17.8 20Z"/></svg><span>Twitter</span></a></div></div>`;

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
  <!-- FOCUS_KEYWORD: ${escapeHtml(focusKeyword)} -->
  <script type="application/ld+json">
${schemaJson}
  <\/script>
${extraSchemaScripts}
  <link rel="preload" href="/styles/tailwind.css" as="style">
  <link rel="stylesheet" href="/styles/tailwind.css">
  <link rel="stylesheet" href="/styles/blog-post.css">
  <link rel="stylesheet" href="/styles/pink-theme-global.css">
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
        ${shareHtml}
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

  const blogIndexCard = `<a href="${escapeHtml(articleRelativeUrl)}" class="card card-link" data-sort-date="${escapeHtml(publishedDate)}">
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
        <a href="${escapeHtml(articleRelativeUrl)}" class="mt-5 inline-flex text-sm font-semibold" style="color: var(--gold-soft);">Read article</a>
      </div>
    </article>`;

  const buildPlaceRichCard = (page) => `<a href="${escapeHtml(articleRelativeUrl)}" class="article-card luxury-card rounded-[1.75rem] transition hover:-translate-y-1" data-sort-date="${escapeHtml(publishedDate)}">
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

  const buildSimplePlaceCard = (page) => `<a href="${escapeHtml(articleRelativeUrl)}" class="card" style="display:block;" data-sort-date="${escapeHtml(publishedDate)}">
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

  // Old bookmarks/links to /blog/<slug>.html should still work, matching the
  // redirect pattern already used across the site for migrated articles.
  const redirectStubHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0; url=${escapeHtml(articleRelativeUrl)}">
  <link rel="canonical" href="${escapeHtml(articleUrl)}">
  <meta name="robots" content="noindex,follow">
  <title>Redirecting...</title>
  <script>window.location.replace('${articleRelativeUrl}');<\/script>
  <link rel="stylesheet" href="/styles/pink-theme-global.css">
</head>
<body></body>
</html>
`;

  return {
    slug,
    title,
    focusKeyword,
    featuredImage,
    articleUrl,
    articleRelativeUrl,
    legacyBlogUrl,
    articleHtml,
    redirectStubHtml,
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

function findExistingArticleSlugs() {
  const articlesDir = path.join(ROOT, "massage-kuala-lumpur");
  if (!fs.existsSync(articlesDir)) {
    return [];
  }

  return fs.readdirSync(articlesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(articlesDir, entry.name, "index.html")))
    .map((entry) => entry.name);
}

// Best-effort check: only articles created by this tool carry the FOCUS_KEYWORD
// marker, so older hand-written articles will not be detected here.
function findDuplicateFocusKeyword(focusKeyword, excludeSlug) {
  const normalizedTarget = String(focusKeyword || "").trim().toLowerCase();
  if (!normalizedTarget) {
    return [];
  }

  const matches = [];
  for (const slug of findExistingArticleSlugs()) {
    if (slug === excludeSlug) {
      continue;
    }

    let html;
    try {
      html = readText(path.join(ROOT, "massage-kuala-lumpur", slug, "index.html"));
    } catch (error) {
      continue;
    }

    const markerMatch = html.match(/<!--\s*FOCUS_KEYWORD:\s*([\s\S]*?)\s*-->/i);
    if (!markerMatch || markerMatch[1].trim().toLowerCase() !== normalizedTarget) {
      continue;
    }

    const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
    matches.push({ slug, title: titleMatch ? titleMatch[1].trim() : slug });
  }

  return matches;
}

function featuredImageMissingLocally(featuredImage) {
  const value = String(featuredImage || "").trim();
  if (!value || /^https?:\/\//i.test(value)) {
    return false;
  }

  return !fs.existsSync(path.join(ROOT, value.replace(/^\/+/, "")));
}

function collectPublishWarnings(article) {
  const warnings = [];
  const articlePath = path.join(ROOT, "massage-kuala-lumpur", article.slug, "index.html");

  if (fs.existsSync(articlePath)) {
    warnings.push(`An article already exists at massage-kuala-lumpur/${article.slug}/. Publishing again will overwrite that file (the current version is backed up to .blog-publisher-backups/ first).`);
  }

  for (const match of findDuplicateFocusKeyword(article.focusKeyword, article.slug)) {
    warnings.push(`The focus keyword "${article.focusKeyword}" is already used by massage-kuala-lumpur/${match.slug}/ ("${match.title}"). Publishing both may cause keyword cannibalization in search results.`);
  }

  if (featuredImageMissingLocally(article.featuredImage)) {
    warnings.push(`The featured image "${article.featuredImage}" was not found in the site folder. Double-check the path before publishing, or the article will show a broken image.`);
  }

  return warnings;
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
  if (html.includes(`/blog/${slug}.html`) || html.includes(`/massage-kuala-lumpur/${slug}/`)) {
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
  if (html.includes(`/blog/${slug}.html`) || html.includes(`/massage-kuala-lumpur/${slug}/`)) {
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
    const withoutEmptyState = html.replace(/\s*<div class="place-empty">[\s\S]*?<\/div>\s*/, "\n");
    const updatedMarkerClose = withoutEmptyState.indexOf("-->", withoutEmptyState.indexOf("<!-- AUTO_ARTICLE_GRID_START:"));
    return sortPlacePageCards(`${withoutEmptyState.slice(0, updatedMarkerClose + 3)}\n          ${autoCard}\n${withoutEmptyState.slice(updatedMarkerClose + 3)}`);
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
  if (xml.includes(`/blog/${slug}.html`) || xml.includes(`/massage-kuala-lumpur/${slug}/`)) {
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
  const warnings = collectPublishWarnings(article);
  if (warnings.length > 0 && !payload.force) {
    const needsConfirmation = new Error("This publish needs confirmation before continuing.");
    needsConfirmation.code = "NEEDS_CONFIRMATION";
    needsConfirmation.warnings = warnings;
    throw needsConfirmation;
  }

  const blogDir = path.join(ROOT, "blog");
  const articlePath = path.join(ROOT, "massage-kuala-lumpur", article.slug, "index.html");
  const legacyRedirectPath = path.join(blogDir, `${article.slug}.html`);

  // ---- Stage 1: compute every file change in memory first. Every insertion
  // helper below can throw (e.g. "could not find insertion point"). Doing all
  // of this before any fs.writeFileSync means a failure here never leaves the
  // site half-updated - nothing on disk changes until Stage 2 starts. ----
  const plannedWrites = [];
  plannedWrites.push({ file: articlePath, content: article.articleHtml, isNewFile: !fs.existsSync(articlePath) });
  plannedWrites.push({ file: legacyRedirectPath, content: article.redirectStubHtml, isNewFile: !fs.existsSync(legacyRedirectPath) });

  const blogIndexPath = path.join(blogDir, "index.html");
  const blogIndexHtml = readText(blogIndexPath);
  plannedWrites.push({ file: blogIndexPath, content: insertIntoBlogIndex(blogIndexHtml, article.blogIndexCard, article.slug), isNewFile: false });

  const updatedHubs = [];
  for (const categorySlug of article.relatedHubs) {
    const hubPath = path.join(blogDir, categorySlug, "index.html");
    if (!fs.existsSync(hubPath)) {
      continue;
    }
    const hubHtml = readText(hubPath);
    plannedWrites.push({ file: hubPath, content: insertIntoHubIndex(hubHtml, article.hubCard, article.slug), isNewFile: false });
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
    plannedWrites.push({ file: placePath, content: placeHtml, isNewFile: false });
    updatedPlacePages.push(page.file);
  }

  const sitemapPath = path.join(ROOT, "sitemap.xml");
  const today = new Date().toISOString().slice(0, 10);
  let sitemapXml = readText(sitemapPath);
  const articleBlock = buildSitemapUrlBlock(article.articleUrl, today);
  sitemapXml = insertIntoArticleSitemapBlock(sitemapXml, articleBlock, article.slug);
  sitemapXml = updateSitemapLastmod(sitemapXml, `${SITE_BASE_URL}/blog/`, today);
  for (const categorySlug of article.relatedHubs) {
    sitemapXml = updateSitemapLastmod(sitemapXml, `${SITE_BASE_URL}/blog/${categorySlug}/`, today);
  }
  for (const page of article.selectedPageRecords) {
    sitemapXml = updateSitemapLastmod(sitemapXml, `${SITE_BASE_URL}${page.publicUrl}`, today);
  }
  plannedWrites.push({ file: sitemapPath, content: sitemapXml, isNewFile: false });

  const robotsPath = path.join(ROOT, "robots.txt");
  const robotsExisted = fs.existsSync(robotsPath);
  plannedWrites.push({ file: robotsPath, content: ensureRobotsTxt(robotsExisted ? readText(robotsPath) : ""), isNewFile: !robotsExisted });

  // ---- Stage 2: every change above succeeded, so back up the current
  // version of each file being modified, then write the new versions. ----
  const backupDir = path.join(ROOT, ".blog-publisher-backups", new Date().toISOString().replace(/[:.]/g, "-"));
  for (const write of plannedWrites) {
    if (write.isNewFile || !fs.existsSync(write.file)) {
      continue;
    }
    const backupPath = path.join(backupDir, path.relative(ROOT, write.file));
    fs.mkdirSync(path.dirname(backupPath), { recursive: true });
    fs.copyFileSync(write.file, backupPath);
  }

  for (const write of plannedWrites) {
    fs.mkdirSync(path.dirname(write.file), { recursive: true });
    writeText(write.file, write.content);
  }

  return {
    ok: true,
    slug: article.slug,
    articlePath: path.relative(ROOT, articlePath),
    updatedHubs,
    updatedPlacePages,
    warnings,
    backupDir: path.relative(ROOT, backupDir),
    updatedFiles: plannedWrites.map((write) => path.relative(ROOT, write.file).replace(/\\/g, "/"))
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

  if (req.method === "POST" && req.url === "/api/upload-image") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 12 * 1024 * 1024) {
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        const payload = JSON.parse(body || "{}");
        const result = handleImageUpload(payload);
        sendJson(res, 200, result);
      } catch (error) {
        sendJson(res, 400, { ok: false, error: error.message });
      }
    });
    return;
  }

  if (req.method === "POST" && req.url === "/api/preview") {
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
        const article = buildArticleParts(payload);
        sendJson(res, 200, { ok: true, slug: article.slug, html: article.articleHtml });
      } catch (error) {
        sendJson(res, 400, { ok: false, error: error.message });
      }
    });
    return;
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
        if (error.code === "NEEDS_CONFIRMATION") {
          return sendJson(res, 409, { ok: false, needsConfirmation: true, warnings: error.warnings, error: error.message });
        }
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
