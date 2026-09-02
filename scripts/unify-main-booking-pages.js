const fs = require('fs');
const path = require('path');

const icons = {
  shield: `<svg viewBox="0 0 64 64" fill="none" aria-hidden="true"><path d="M32 8 14 15v13c0 13 7.7 22.3 18 28 10.3-5.7 18-15 18-28V15L32 8Z" stroke="currentColor" stroke-width="2.8" stroke-linejoin="round"/><path d="m23 31 6 6 12-14" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  pin: `<svg viewBox="0 0 64 64" fill="none" aria-hidden="true"><path d="M32 55s17-14.8 17-29a17 17 0 1 0-34 0c0 14.2 17 29 17 29Z" stroke="currentColor" stroke-width="2.8" stroke-linejoin="round"/><circle cx="32" cy="26" r="5.5" stroke="currentColor" stroke-width="2.8"/></svg>`,
  check: `<svg viewBox="0 0 64 64" fill="none" aria-hidden="true"><circle cx="32" cy="32" r="21" stroke="currentColor" stroke-width="2.8"/><path d="m22 32 7 7 14-16" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  lock: `<svg viewBox="0 0 64 64" fill="none" aria-hidden="true"><rect x="14" y="28" width="36" height="25" rx="4" stroke="currentColor" stroke-width="2.8"/><path d="M22 28v-7a10 10 0 0 1 20 0v7" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/></svg>`,
  heart: `<svg viewBox="0 0 64 64" fill="none" aria-hidden="true"><path d="M32 53C20 45 12 38 12 27a11 11 0 0 1 20-6 11 11 0 0 1 20 6c0 11-8 18-20 26Z" stroke="currentColor" stroke-width="2.8" stroke-linejoin="round"/></svg>`,
  clock: `<svg viewBox="0 0 64 64" fill="none" aria-hidden="true"><circle cx="32" cy="32" r="21" stroke="currentColor" stroke-width="2.8"/><path d="M32 19v14l9 6" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  screen: `<svg viewBox="0 0 64 64" fill="none" aria-hidden="true"><rect x="14" y="16" width="36" height="24" rx="2" stroke="currentColor" stroke-width="2.8"/><path d="M10 46h44M24 46v4h16v-4" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/></svg>`,
  package: `<svg viewBox="0 0 64 64" fill="none" aria-hidden="true"><path d="M32 15 51 25v20L32 55 13 45V25l19-10Z" stroke="currentColor" stroke-width="2.8" stroke-linejoin="round"/><path d="m13 25 19 10 19-10M32 35v20" stroke="currentColor" stroke-width="2.8" stroke-linejoin="round"/></svg>`,
  calendar: `<svg viewBox="0 0 64 64" fill="none" aria-hidden="true"><rect x="14" y="18" width="36" height="32" rx="3" stroke="currentColor" stroke-width="2.8"/><path d="M14 29h36M24 14v8M40 14v8M24 37h6M34 37h6M24 44h6" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/></svg>`,
  card: `<svg viewBox="0 0 64 64" fill="none" aria-hidden="true"><rect x="12" y="20" width="40" height="24" rx="4" stroke="currentColor" stroke-width="2.8"/><path d="M12 29h40M20 37h10M36 37h6" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/></svg>`,
  home: `<svg viewBox="0 0 64 64" fill="none" aria-hidden="true"><path d="M12 32 32 16l20 16M18 30v18h28V30M28 48V36h8v12" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
};

const pages = [
  { file: 'tantric-massage-kuala-lumpur/index.html', eyebrow: 'Private outcall wellness', title: 'Tantric massage in Kuala Lumpur', subtitle: 'A calm, private wellness experience in KL', description: 'Tantric massage in Kuala Lumpur is a private outcall wellness option for clients who want time to relax, reset, and arrange their session with clear communication.', why: [['Discreet booking', 'Your booking details stay private.'], ['Comfort first', 'A calm experience at your pace.'], ['Clear arrangements', 'Packages and timing explained simply.']], benefits: [['Deep relaxation', 'Make time to slow down and unwind.'], ['Stress relief', 'A calm break from a busy routine.'], ['Body awareness', 'A wellness-focused experience with care.']], packageHref: '/services.html', packageLabel: 'See massage packages' },
  { file: 'yoni-massage-therapy-near-me-in-kuala-lumpur/index.html', eyebrow: 'Private ladies wellness', title: 'Yoni massage in Kuala Lumpur', subtitle: 'A calm private wellness option for ladies', description: 'Yoni massage in Kuala Lumpur is a ladies wellness booking option for clients looking for a private, respectful, and comfortable outcall experience.', why: [['Private support', 'Details are handled with care.'], ['Your chosen setting', 'Home, hotel, or residence support.'], ['Respectful approach', 'Clear and considerate communication.']], benefits: [['Time to unwind', 'A calm pause for your wellbeing.'], ['Comfortable planning', 'Choose a time and place that suits you.'], ['Clear confirmation', 'Know the details before you book.']], packageHref: '/lady-packages/', packageLabel: 'See ladies packages' },
  { file: 'ladies-massage-in-kl/index.html', eyebrow: 'Private ladies wellness', title: 'Ladies massage in Kuala Lumpur', subtitle: 'Private outcall wellness for ladies in KL', description: 'Ladies massage in Kuala Lumpur offers a calm, respectful outcall wellness booking option for hotel, residence, and home visits across KL.', why: [['Discreet communication', 'Private details handled with respect.'], ['Outcall convenience', 'Choose your suitable KL location.'], ['Comfort focused', 'A clear process at your own pace.']], benefits: [['Relax and reset', 'Make space for your wellbeing.'], ['Private setting', 'Arrange your session in your own space.'], ['Simple booking', 'Clear steps from package to confirmation.']], packageHref: '/lady-packages/', packageLabel: 'See ladies packages' },
  { file: 'couples-massage-in-kl/index.html', eyebrow: 'Private couples wellness', title: 'Couples massage in Kuala Lumpur', subtitle: 'A private shared wellness experience in KL', description: 'Couples massage in Kuala Lumpur is a private outcall wellness option for two people who want to relax together at a hotel, residence, or home.', why: [['Made for two', 'Packages for couples booking together.'], ['Your chosen location', 'Hotel, residence, or home visits.'], ['Easy planning', 'Clear details for both guests.']], benefits: [['Relax together', 'Share a calm break from your routine.'], ['Private time', 'Arrange a session in your own space.'], ['Clear choices', 'Review package and timing options.']], packageHref: '/couple-packages/', packageLabel: 'See couples packages' },
  { file: 'massage-kuala-lumpur/luxury-hotel-massage-service-in-kuala-lumpur/index.html', eyebrow: 'Private in-room wellness', title: 'Hotel massage in Kuala Lumpur', subtitle: 'Private in-room wellness for KL stays', description: 'Hotel massage in Kuala Lumpur provides a calm private outcall option for visitors and residents arranging a wellness session at a hotel or residence.', why: [['Private hotel visit', 'A discreet arrangement for your stay.'], ['Location support', 'Share your hotel area in Kuala Lumpur.'], ['Simple confirmation', 'Clear details before you finalise.']], benefits: [['In-room comfort', 'Relax without leaving your own space.'], ['Travel-friendly', 'A calm option during your KL stay.'], ['Clear planning', 'Package, time, and location confirmed.']], packageHref: '/services.html', packageLabel: 'See massage packages' },
];

function cards(items) {
  return items.map(([title, text], index) => {
    const icon = [icons.shield, icons.heart, icons.check][index];
    return `<article class="booking-mini-card">${icon}<h3>${title}</h3><p>${text}</p></article>`;
  }).join('');
}

function promise(label, icon) {
  return `<article class="booking-promise">${icon}<span>${label}</span></article>`;
}

function bookingSteps() {
  const steps = [[icons.screen, '1st step', 'View packages'], [icons.package, '2nd step', 'Choose a package'], [icons.pin, '3rd step', 'Share your location'], [icons.calendar, '4th step', 'Confirm date and time'], [icons.card, '5th step', 'Complete advance payment'], [icons.home, '6th step', 'Session at your location']];
  return steps.map(([icon, label, title]) => `<article class="booking-step"><small>${label}</small>${icon.replace('<svg ', '<svg class="booking-step-icon" ')}<h3>${title}</h3></article>`).join('');
}

for (const page of pages) {
  const file = path.resolve(__dirname, '..', page.file);
  let source = fs.readFileSync(file, 'utf8');
  if (!source.includes('/styles/booking-page.css')) source = source.replace('</head>', '  <link rel="stylesheet" href="/styles/booking-page.css">\n</head>');

  const body = `<body>
  <header class="booking-site-header"><nav class="booking-shell booking-header" aria-label="Primary navigation"><a class="booking-brand" href="/"><img src="/images/logo.png" alt="Massage KL logo">Massage KL</a><a class="booking-header-link" href="/blog/">Wellness guides</a></nav></header>
  <main>
    <section class="booking-shell booking-hero"><p class="booking-eyebrow">${page.eyebrow}</p><h1>${page.title}</h1><p class="booking-subtitle">${page.subtitle}</p><p class="booking-intro">${page.description}</p><div class="booking-promise-grid">${promise('Discreet booking', icons.shield)}${promise('Outcall convenience', icons.pin)}${promise('Clear expectations', icons.check)}</div></section>
    <section class="booking-section booking-section--soft booking-section--centered"><div class="booking-shell"><p class="booking-eyebrow">Why me</p><h2>Private wellness, planned with care</h2><p class="booking-copy">A simple approach that keeps your booking clear, comfortable, and respectful from the first message.</p><div class="booking-mini-grid">${cards(page.why)}</div></div></section>
    <section class="booking-section booking-section--centered"><div class="booking-shell"><p class="booking-eyebrow">Guarantee</p><h2>Clear standards for every booking</h2><div class="booking-mini-grid">${cards([['Private details', 'Your location and timing are kept confidential.'], ['Clear confirmation', 'Availability is checked before arrangements are final.'], ['Respectful service', 'Every interaction is handled professionally.']])}</div></div></section>
    <section class="booking-section booking-section--soft booking-section--centered"><div class="booking-shell"><p class="booking-eyebrow">Trust &amp; privacy</p><h2>Privacy remains a priority</h2><div class="booking-mini-grid">${cards([['Discreet communication', 'Booking details are discussed directly.'], ['Private setting', 'Home, hotel, and residence options are respected.'], ['Professional boundaries', 'A calm and respectful experience throughout.']])}</div></div></section>
    <section class="booking-section booking-section--centered"><div class="booking-shell"><p class="booking-eyebrow">Benefits</p><h2>Designed to support your wellbeing</h2><div class="booking-mini-grid">${cards(page.benefits)}</div></div></section>
    <section class="booking-section booking-section--soft booking-section--centered"><div class="booking-shell"><p class="booking-eyebrow">How to book</p><h2>Six clear booking steps</h2><p class="booking-copy">Choose a package, share your location and preferred time, then confirm the final details directly.</p><div class="booking-step-grid">${bookingSteps()}</div></div></section>
    <section class="booking-shell booking-section"><div class="booking-cta"><div><h2>Ready to choose a package?</h2><p>Review the available package options, then use the floating WhatsApp button when you are ready to contact us.</p></div><a class="booking-button booking-button--primary" href="${page.packageHref}">${page.packageLabel}</a></div></section>
  </main>
  <footer class="booking-shell booking-footer">Massage KL &middot; Private wellness support across Kuala Lumpur</footer>
</body>`;

  source = source.replace(/<body>[\s\S]*?<\/body>/, body);
  if (!source.includes(page.packageLabel)) throw new Error(`${page.file}: package button missing.`);
  fs.writeFileSync(file, source);
}
