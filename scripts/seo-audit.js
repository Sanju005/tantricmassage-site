const fs = require('fs');
const path = require('path');

const ignoredDirectories = new Set(['node_modules', '.git', '.agents']);
const pages = [];

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (ignoredDirectories.has(entry.name)) continue;
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (entry.name.endsWith('.html')) pages.push(file);
  }
}

function getMatch(source, expression) {
  return (source.match(expression)?.[1] || '').trim();
}

function duplicates(rows, key) {
  const grouped = new Map();
  for (const row of rows) {
    if (!row[key]) continue;
    grouped.set(row[key], [...(grouped.get(row[key]) || []), row.file]);
  }
  return [...grouped.entries()].filter(([, files]) => files.length > 1);
}

walk('.');

const rows = pages.map((file) => {
  const source = fs.readFileSync(file, 'utf8');
  return {
    file: file.replace(/\\/g, '/'),
    title: getMatch(source, /<title[^>]*>([\s\S]*?)<\/title>/i),
    description: getMatch(source, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)/i),
    canonical: getMatch(source, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)/i),
    robots: getMatch(source, /<meta[^>]+name=["']robots["'][^>]+content=["']([^"']*)/i),
    h1Count: (source.match(/<h1[\s>]/gi) || []).length,
  };
});

const report = {
  pagesChecked: rows.length,
  missingTitle: rows.filter((row) => !row.title).map((row) => row.file),
  missingDescription: rows.filter((row) => !row.description).map((row) => row.file),
  missingCanonical: rows.filter((row) => !row.canonical).map((row) => row.file),
  missingRobots: rows.filter((row) => !row.robots).map((row) => row.file),
  invalidH1Count: rows.filter((row) => row.h1Count !== 1).map((row) => `${row.file}: ${row.h1Count}`),
  duplicateTitles: duplicates(rows, 'title'),
  duplicateCanonicals: duplicates(rows, 'canonical'),
};

console.log(JSON.stringify(report, null, 2));
