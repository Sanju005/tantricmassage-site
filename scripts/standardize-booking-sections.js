const fs = require('fs');
const path = require('path');

const shieldIcon = `<svg viewBox="0 0 64 64" fill="none" aria-hidden="true"><path d="M32 8 14 15v13c0 13 7.7 22.3 18 28 10.3-5.7 18-15 18-28V15L32 8Z" stroke="currentColor" stroke-width="2.8" stroke-linejoin="round"/><path d="m23 31 6 6 12-14" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const pinIcon = `<svg viewBox="0 0 64 64" fill="none" aria-hidden="true"><path d="M32 55s17-14.8 17-29a17 17 0 1 0-34 0c0 14.2 17 29 17 29Z" stroke="currentColor" stroke-width="2.8" stroke-linejoin="round"/><circle cx="32" cy="26" r="5.5" stroke="currentColor" stroke-width="2.8"/></svg>`;
const checkIcon = `<svg viewBox="0 0 64 64" fill="none" aria-hidden="true"><circle cx="32" cy="32" r="21" stroke="currentColor" stroke-width="2.8"/><path d="m22 32 7 7 14-16" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const pages = [
  {
    file: 'yoni-massage-therapy-near-me-in-kuala-lumpur/index.html',
    heading: 'Wellness support designed around your comfort',
    copy: 'A clear and considerate outcall booking experience for ladies in Kuala Lumpur.',
    items: [['Discreet booking', 'Private details handled with care.', shieldIcon], ['Your preferred setting', 'Home, hotel, or residence support.', pinIcon], ['Clear from the start', 'Packages and timing explained simply.', checkIcon]],
    packageText: 'See ladies packages',
  },
  {
    file: 'ladies-massage-in-kl/index.html',
    heading: 'A calm and considerate booking experience',
    copy: 'Designed to make every step feel private, comfortable, and easy to understand.',
    items: [['Private communication', 'Clear and respectful from the start.', shieldIcon], ['Outcall convenience', 'Choose your suitable KL location.', pinIcon], ['Comfort focused', 'Plan your visit at your own pace.', checkIcon]],
    packageText: 'See ladies packages',
  },
  {
    file: 'couples-massage-in-kl/index.html',
    heading: 'Easy planning for a private shared experience',
    copy: 'A simple booking path for couples arranging a calm session together.',
    items: [['For two', 'Packages made for couples booking together.', shieldIcon], ['Your chosen location', 'Hotel, residence, or home visits.', pinIcon], ['Clear arrangements', 'Timing and details confirmed directly.', checkIcon]],
    packageText: 'See couples packages',
  },
  {
    file: 'massage-kuala-lumpur/luxury-hotel-massage-service-in-kuala-lumpur/index.html',
    heading: 'Convenient in-room wellness planning',
    copy: 'A clear option for visitors and residents arranging a session in their own space.',
    items: [['Private hotel visits', 'A discreet arrangement for your stay.', shieldIcon], ['Share your hotel area', 'Suitable KL locations can be checked.', pinIcon], ['Simple confirmation', 'Clear details before you finalise.', checkIcon]],
    packageText: 'See full massage packages',
  },
];

for (const page of pages) {
  const file = path.resolve(__dirname, '..', page.file);
  let source = fs.readFileSync(file, 'utf8');
  const cards = page.items.map(([title, text, icon]) => `<article class="booking-feature">${icon}<span>${title}</span><p>${text}</p></article>`).join('');
  const whySection = `<section class="booking-section booking-section--soft"><div class="booking-shell"><p class="booking-eyebrow">Why me</p><h2>${page.heading}</h2><p class="booking-copy">${page.copy}</p><div class="booking-feature-grid">${cards}</div></div></section>`;

  source = source.replace(/<section class="booking-section booking-section--soft"><div class="booking-shell"><p class="booking-eyebrow">Why choose[^<]*<\/p>.*?<\/section>(?=\s*<section class="booking-section">)/, whySection);
  source = source.replace('<p class="booking-eyebrow">What to expect</p>', '<p class="booking-eyebrow">Benefits</p>');
  if (page.packageText === 'See full massage packages') {
    source = source.replaceAll('>See massage packages</a>', `>${page.packageText}</a>`);
  } else {
    source = source.replace(/(<article class="booking-card"><div><h3>[^<]*packages<\/h3>.*?<\/div><a class="booking-button booking-button--secondary" href="[^"]+">)View packages(<\/a><\/article>)/, `$1${page.packageText}$2`);
  }

  if (!source.includes('<p class="booking-eyebrow">Why me</p>')) throw new Error(`${page.file}: Why Me section was not updated.`);
  if (!source.includes('<p class="booking-eyebrow">Benefits</p>')) throw new Error(`${page.file}: Benefits heading was not updated.`);
  if (!source.includes(`>${page.packageText}</a>`)) throw new Error(`${page.file}: relevant package button was not updated.`);
  fs.writeFileSync(file, source);
}
