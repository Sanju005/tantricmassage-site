const fs = require("fs");

const pages = [
  ["couples-massage-in-kl/index.html", "/couple-packages/", "See couples packages", "/massage-kuala-lumpur/#all-areas", "View service areas"],
  ["yoni-massage-therapy-near-me-in-kuala-lumpur/index.html", "/lady-packages/", "See ladies packages", "/massage-kuala-lumpur/#all-areas", "View service areas"],
  ["ladies-massage-in-kl/index.html", "/lady-packages/", "See ladies packages", "/yoni-massage-therapy-near-me-in-kuala-lumpur/", "Explore yoni massage"],
  ["massage-kuala-lumpur/luxury-hotel-massage-service-in-kuala-lumpur/index.html", "/services.html", "See massage packages", "/massage-kuala-lumpur/#all-areas", "View service areas"]
];

for (const [file, packageUrl, packageLabel, secondaryUrl, secondaryLabel] of pages) {
  let html = fs.readFileSync(file, "utf8");
  html = html.replace(/<div class="booking-actions"><a class="booking-button booking-button--primary" href="https:\/\/wa\.me\/[^"]+">[^<]+<\/a><a class="booking-button booking-button--secondary" href="[^"]+">[^<]+<\/a><\/div>/, `<div class="booking-actions"><a class="booking-button booking-button--primary" href="${packageUrl}">${packageLabel}</a><a class="booking-button booking-button--secondary" href="${secondaryUrl}">${secondaryLabel}</a></div>`);
  html = html.replace(/<section class="booking-shell booking-section"><div class="booking-cta"><div><h2>[^<]+<\/h2><p>[^<]+<\/p><\/div><a class="booking-button booking-button--primary" href="https:\/\/wa\.me\/[^"]+">Message on WhatsApp<\/a><\/div><\/section>/, `<section class="booking-shell booking-section"><div class="booking-cta"><div><h2>Ready to choose a package?</h2><p>Review the available options, then use the floating WhatsApp button when you are ready to contact us.</p></div><a class="booking-button booking-button--primary" href="${packageUrl}">${packageLabel}</a></div></section>`);
  html = html.replace(/<a class="booking-button booking-button--secondary" href="https:\/\/wa\.me\/[^"]+">Ask a question<\/a>/, `<a class="booking-button booking-button--secondary" href="${packageUrl}">View packages</a>`);
  fs.writeFileSync(file, html, "utf8");
}

let tantric = fs.readFileSync("tantric-massage-kuala-lumpur/index.html", "utf8");
tantric = tantric.replace(/<a class="button button-primary" href="https:\/\/wa\.me\/[^"]+">Check availability on WhatsApp<\/a>/, '<a class="button button-primary" href="/services.html">View massage packages</a>');
tantric = tantric.replace(/<a class="button" href="https:\/\/wa\.me\/[^"]+">Message on WhatsApp<\/a>/, '<a class="button" href="/services.html">View massage packages</a>');
tantric = tantric.replace(/Message on<br>WhatsApp/g, "Use the<br>floating chat");
fs.writeFileSync("tantric-massage-kuala-lumpur/index.html", tantric, "utf8");
