#!/usr/bin/env node
/*
 * Scan the site for words that must not appear on massagekl.com.
 *
 * Usage:
 *   node scripts/check-words.js          list matches; exit code 1 if any are found
 *   node scripts/check-words.js --json   same, as JSON (for other tools)
 *
 * Checks file contents (page text, meta tags, alt text, JSON-LD, image paths,
 * CSS, docs) and every file and folder name. Run it before each push.
 *
 * Not flagged:
 *   - "tantra-inspired" / "tantric massage": not on the word list.
 *   - Old URLs on the left-hand side of _redirects rules. Redirect targets
 *     are still checked.
 *   - The reviewer name "Siti Nurul" ("nuru" is matched as a whole word only).
 *   - "carousel" ("arousal" is matched by its own word forms only).
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SKIP_DIRS = new Set(['vendor', 'node_modules', '.git', '.blog-publisher-backups']);
const TEXT_EXTENSIONS = new Set(['.html', '.htm', '.js', '.mjs', '.cjs', '.json', '.xml', '.css', '.md', '.txt', '.svg', '.webmanifest']);
const SPECIAL_FILES = new Set(['_redirects', '_headers']);
const SELF = path.relative(ROOT, __filename).split(path.sep).join('/');

// Whole-word terms: "oral" must not match "floral", "nude" not "nudge", "nuru" not "Nurul".
const WHOLE_WORDS = [
  'yoni', 'lingam', 'oral', 'b2b', 'nude', 'nudes', 'naked', 'sexy', 'breast', 'breasts', 'g-spot', 'nuru',
  'happy ending', 'happy endings', 'body to body', 'body-to-body',
  'arousal', 'arouse', 'aroused', 'arousing',
];
// Stems: also match longer forms ("intimately", "sensuality", "pleasures", "seduction").
const STEMS = ['intima', 'sensual', 'erotic', 'orgasm', 'pleasur', 'seduc'];

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/[ -]/g, '[\\s_-]?');
const PATTERN = new RegExp(
  '(?<![a-z0-9])(?:' + WHOLE_WORDS.map(escape).join('|') + ')(?![a-z0-9])' +
  '|(?<![a-z0-9])18\\+' +
  '|(?<![a-z0-9])(?:' + STEMS.map(escape).join('|') + ')[a-z]*',
  'gi'
);

function walk(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) walk(path.join(dir, entry.name), out);
    } else if (!entry.name.endsWith('.map')) {
      out.push(path.join(dir, entry.name));
    }
  }
  return out;
}

function scanLine(text) {
  const found = [];
  PATTERN.lastIndex = 0;
  let m;
  while ((m = PATTERN.exec(text))) found.push({ term: m[0], index: m.index });
  return found;
}

const matches = [];
for (const abs of walk(ROOT, [])) {
  const rel = path.relative(ROOT, abs).split(path.sep).join('/');
  if (rel === SELF) continue;

  // File and folder names (these become public URLs).
  for (const { term } of scanLine(rel)) matches.push({ file: rel, line: 0, term, context: '(file name)' });

  const name = path.basename(abs);
  if (!TEXT_EXTENSIONS.has(path.extname(name).toLowerCase()) && !SPECIAL_FILES.has(name)) continue;

  const lines = fs.readFileSync(abs, 'utf8').split(/\r?\n/);
  lines.forEach((line, i) => {
    let checked = line;
    if (name === '_redirects' && !line.trim().startsWith('#')) {
      // "source  target  status": the old URL on the left is allowed; check the rest.
      const fields = line.trim().split(/\s+/);
      checked = fields.slice(1).join(' ');
    }
    for (const { term, index } of scanLine(checked)) {
      const start = Math.max(0, index - 70);
      matches.push({ file: rel, line: i + 1, term, context: checked.slice(start, index + term.length + 70).trim() });
    }
  });
}

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(matches, null, 2));
} else if (matches.length === 0) {
  console.log('check-words: no matches. OK to push.');
} else {
  for (const m of matches) {
    const where = m.line ? `${m.file}:${m.line}` : m.file;
    console.log(`${where}  [${m.term}]  ${m.context}`);
  }
  console.log(`\ncheck-words: ${matches.length} match(es) in ${new Set(matches.map((m) => m.file)).size} file(s). Fix these before pushing.`);
}
process.exitCode = matches.length ? 1 : 0;
