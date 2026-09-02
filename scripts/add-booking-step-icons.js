const fs = require('fs');
const path = require('path');

const pages = [
  'yoni-massage-therapy-near-me-in-kuala-lumpur/index.html',
  'ladies-massage-in-kl/index.html',
  'couples-massage-in-kl/index.html',
  'massage-kuala-lumpur/luxury-hotel-massage-service-in-kuala-lumpur/index.html',
];

const icons = [
  `<svg class="booking-step-icon" viewBox="0 0 64 64" fill="none" aria-hidden="true"><rect x="14" y="16" width="36" height="24" rx="2" stroke="currentColor" stroke-width="2.5"/><path d="M10 46h44M24 46v4h16v-4" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>`,
  `<svg class="booking-step-icon" viewBox="0 0 64 64" fill="none" aria-hidden="true"><path d="M32 18c3 8 8 13 16 15-4 7-9 11-16 13-7-2-12-6-16-13 8-2 13-7 16-15Z" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/><path d="M32 18c-2 7-6 11-12 13" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>`,
  `<svg class="booking-step-icon" viewBox="0 0 64 64" fill="none" aria-hidden="true"><path d="M47.5 16.5a18 18 0 0 0-28.7 21.2L16 48l10.7-2.7A18 18 0 1 0 47.5 16.5Z" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/><path d="M26 25c1 6 7 12 13 13l3-3" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  `<svg class="booking-step-icon" viewBox="0 0 64 64" fill="none" aria-hidden="true"><rect x="14" y="18" width="36" height="32" rx="3" stroke="currentColor" stroke-width="2.5"/><path d="M14 28h36M24 14v8M40 14v8M24 36h6M34 36h6M24 44h6" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>`,
  `<svg class="booking-step-icon" viewBox="0 0 64 64" fill="none" aria-hidden="true"><rect x="12" y="20" width="40" height="24" rx="4" stroke="currentColor" stroke-width="2.5"/><path d="M12 28h40M20 37h10M36 37h6" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>`,
  `<svg class="booking-step-icon" viewBox="0 0 64 64" fill="none" aria-hidden="true"><path d="M12 32 32 16l20 16M18 30v18h28V30M28 48V36h8v12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
];

for (const page of pages) {
  const file = path.resolve(__dirname, '..', page);
  let source = fs.readFileSync(file, 'utf8');
  let index = 0;

  source = source.replace(/(<article class="booking-step"><small>[^<]+<\/small>)(<h3>)/g, (match, start, heading) => {
    const icon = icons[index++];
    return icon ? `${start}${icon}${heading}` : match;
  });

  if (index !== 6) throw new Error(`${page}: expected 6 booking steps, found ${index}.`);
  fs.writeFileSync(file, source);
}
