const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const areas = [
  ["KLCC", "massage-klcc/index.html", "/massage-klcc/"], ["Bangsar", "massage-bangsar/index.html", "/massage-bangsar/"], ["Mont Kiara", "massage-mont-kiara/index.html", "/massage-mont-kiara/"], ["Bukit Bintang", "massage-bukit-bintang/index.html", "/massage-bukit-bintang/"], ["Petaling Jaya", "massage-petaling-jaya/index.html", "/massage-petaling-jaya/"], ["Subang Jaya", "massage-subang-jaya/index.html", "/massage-subang-jaya/"], ["Puchong", "massage-puchong/index.html", "/massage-puchong/"], ["Cyberjaya", "massage-cyberjaya/index.html", "/massage-cyberjaya/"], ["Kelana Jaya", "massage-kelana-jaya/index.html", "/massage-kelana-jaya"],
  ["Mid Valley", "massage-mid-valley.html", "/massage-mid-valley.html"], ["Cheras", "massage-cheras.html", "/massage-cheras.html"], ["Ampang", "massage-ampang.html", "/massage-ampang.html"], ["TTDI", "massage-ttdi.html", "/massage-ttdi.html"], ["Setapak", "massage-setapak.html", "/massage-setapak.html"], ["Putrajaya", "massage-putrajaya.html", "/massage-putrajaya.html"], ["Brickfields", "massage-brickfields.html", "/massage-brickfields.html"], ["KL Sentral", "massage-kl-sentral.html", "/massage-kl-sentral.html"], ["Bukit Jalil", "massage-bukit-jalil.html", "/massage-bukit-jalil.html"], ["Bangsar South", "massage-bangsar-south.html", "/massage-bangsar-south.html"], ["Sunway", "massage-sunway.html", "/massage-sunway.html"], ["Shah Alam", "massage-shah-alam.html", "/massage-shah-alam.html"], ["Sri Hartamas", "massage-sri-hartamas.html", "/massage-sri-hartamas.html"], ["Damansara Heights", "massage-damansara-heights.html", "/massage-damansara-heights.html"], ["Desa ParkCity", "massage-desa-parkcity.html", "/massage-desa-parkcity.html"], ["Kota Damansara", "massage-kota-damansara.html", "/massage-kota-damansara.html"], ["Ara Damansara", "massage-ara-damansara.html", "/massage-ara-damansara.html"]
];

function escapeHtml(value) { return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
function idFor(area) { return area.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
function extractAutoGrid(html, id) {
  const start = html.indexOf("<!-- AUTO_ARTICLE_GRID_START:");
  const end = html.indexOf("<!-- AUTO_ARTICLE_GRID_END:", start);
  if (start === -1 || end === -1) return `<!-- AUTO_ARTICLE_GRID_START:${id} -->\n          <div class="place-empty">New relevant articles for ${escapeHtml(id.replace(/-/g, " "))} will appear here.</div>\n<!-- AUTO_ARTICLE_GRID_END:${id} -->`;
  const openEnd = html.indexOf("-->", start) + 3;
  const closeEnd = html.indexOf("-->", end) + 3;
  return html.slice(start, openEnd).replace(/START:[^ ]+/, `START:${id}`) + html.slice(openEnd, end) + html.slice(end, closeEnd).replace(/END:[^ ]+/, `END:${id}`);
}
function extractSchemaBlocks(html) { return (html.match(/<!-- AUTO_RELATED_ARTICLE_SCHEMA_START:[\s\S]*?<!-- AUTO_RELATED_ARTICLE_SCHEMA_END:[\s\S]*?-->/g) || []).join("\n"); }
function extractArticleCount(grid) { return (grid.match(/<a\s+href=/g) || []).length; }
function page(area, publicUrl, id, grid, schemas) {
  const count = extractArticleCount(grid);
  const safeArea = escapeHtml(area);
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Best Massage in ${safeArea} | Private Outcall Massage</title>
<meta name="description" content="Private outcall massage booking guidance for ${safeArea}, including hotel and residence visits, clear communication, and local wellness articles.">
<meta name="robots" content="index, follow"><link rel="canonical" href="https://www.massagekl.com${publicUrl}"><link rel="stylesheet" href="/styles/place-hub.css">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"Service","name":"Massage in ${safeArea}","provider":{"@type":"Organization","name":"Massage KL","url":"https://www.massagekl.com/"},"areaServed":{"@type":"Place","name":"${safeArea}"},"url":"https://www.massagekl.com${publicUrl}"}</script>
${schemas}</head><body><header class="place-shell place-header"><a class="place-brand" href="/" aria-label="Massage KL home"><img src="/images/logo.png" alt="Massage KL logo"></a><nav class="place-nav"><a href="/blog/">Articles</a><a class="place-button" href="/services.html">Book now</a></nav></header>
<main data-place-hub="true"><section class="place-shell place-hero"><p class="place-eyebrow">Local booking guidance</p><h1>Massage in ${safeArea}</h1><p class="place-lead">Private outcall massage booking support for ${safeArea} hotels, residences, and homes. Explore local guidance, then contact us directly to check availability.</p><div class="place-actions"><a class="place-button" href="https://wa.me/60164649008?text=Hi%2C%20I%20would%20like%20to%20check%20massage%20availability%20in%20${encodeURIComponent(area)}.">Check availability on WhatsApp</a><a class="place-button place-button--outline" href="/services.html">View packages</a></div></section>
<section class="place-shell place-section"><div class="place-panel"><h2>Booking in ${safeArea}</h2><p>Share your preferred date, time, and hotel or residence location. We will confirm availability directly before your booking.</p><div class="place-facts"><div class="place-fact"><strong>Private</strong><span>Discreet communication</span></div><div class="place-fact"><strong>Outcall</strong><span>Hotel or residence</span></div><div class="place-fact"><strong>Direct</strong><span>WhatsApp confirmation</span></div></div></div></section>
<section class="place-shell place-section" id="${id}-articles"><div class="place-section-heading"><div><p class="place-eyebrow">Local articles</p><h2>${safeArea} booking guides</h2></div><!-- AUTO_ARTICLE_COUNT_START:${id} --><p class="place-count">${count} featured ${safeArea} articles</p><!-- AUTO_ARTICLE_COUNT_END:${id} --></div><div class="place-article-grid">${grid}</div></section>
<section class="place-shell place-section"><div class="place-cta"><div><h2>Ready to check availability?</h2><p>Message us with your preferred time and ${safeArea} location for a direct response.</p></div><a class="place-button" href="https://wa.me/60164649008?text=Hi%2C%20I%20would%20like%20to%20book%20a%20massage%20in%20${encodeURIComponent(area)}.">WhatsApp booking</a></div></section></main><footer class="place-shell place-footer">Massage KL · Private outcall wellness booking support</footer></body></html>`;
}

for (const [area, file, publicUrl] of areas) {
  const filePath = path.join(root, file);
  const old = fs.readFileSync(filePath, "utf8");
  const id = idFor(area);
  const grid = extractAutoGrid(old, id);
  fs.writeFileSync(filePath, page(area, publicUrl, id, grid, extractSchemaBlocks(old)), "utf8");
}
console.log(`Standardized ${areas.length} local place pages.`);
