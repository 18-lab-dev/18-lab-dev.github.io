import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { parseHTML } from 'linkedom';

// Usage: node scripts/check-links.mjs [built-site-directory]
const root = process.argv[2] ?? 'dist';

async function walk(dir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    files.push(...(entry.isDirectory() ? await walk(file) : [file]));
  }
  return files;
}
const files = (await walk(root)).filter((file) => file.endsWith('.html'));
const sources = new Map(await Promise.all(files.map(async (file) => [file, await readFile(file, 'utf8')])));
const documents = new Map([...sources].map(([file, html]) => [file, parseHTML(html).document]));
const missing = [];
const external = new Set();
let checked = 0;
for (const [file, document] of documents) {
  for (const el of document.querySelectorAll('[href], [src]')) {
    const href = el.getAttribute('href') ?? el.getAttribute('src');
    if (!href || /^(data:|mailto:|tel:|javascript:)/.test(href)) continue;
    const url = new URL(href, 'https://18-lab-dev.github.io/' + path.relative(root, file));
    if (url.origin !== 'https://18-lab-dev.github.io') { external.add(url.href); continue; }
    checked++;
    const base = path.join(root, decodeURIComponent(url.pathname));
    const candidates = [base, base + '.html', path.join(base, 'index.html')];
    let target;
    for (const candidate of candidates) {
      try { if ((await stat(candidate)).isFile()) { target = candidate; break; } } catch { /* try next clean-URL form */ }
    }
    if (!target) { missing.push(`${file}: missing ${href}`); continue; }
    if (url.hash && documents.has(target)) {
      const id = decodeURIComponent(url.hash.slice(1));
      if (!documents.get(target).getElementById(id)) missing.push(`${file}: missing anchor ${href}`);
    }
  }
}

/*
 * Leftover VitePress syntax: containers (`:::`), `[[toc]]`, `{#id}` heading ids, Vue components and
 * bindings, and fence attributes (`{1,3}` highlights, `[title]`) that reached the built pages.
 * Prose text is scanned with code blocks excluded; markup is scanned for components and bindings.
 */
const TEXT_PATTERNS = [
  [':::', /:::/],
  ['[[', /\[\[/],
  ['{#id}', /\{#[\w-]*\}?/],
  ['component tag', /<\/?[A-Z][A-Za-z]*[\s/>]/],
];
const MARKUP_PATTERNS = [
  ['component tag', /<\/?[A-Z][A-Za-z]*[\s/>]/],
  ['<script setup>', /<script\s+setup/],
  ['Vue binding', /\s(?:v-[\w-]+|:[a-z][\w-]*|@[a-z][\w-]*)=/],
  ['fence attributes', /class="language-[^"]*[{[]/],
];
const leftovers = [];
for (const [file, document] of documents) {
  const html = sources.get(file).replace(/<!doctype[^>]*>/i, '');
  for (const [name, pattern] of MARKUP_PATTERNS) {
    for (const match of html.matchAll(new RegExp(pattern, 'g'))) leftovers.push(`${file}: ${name} ${JSON.stringify(html.slice(match.index, match.index + 60))}`);
  }
  const walker = document.createTreeWalker(document.body ?? document, 4 /* NodeFilter.SHOW_TEXT */);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (node.parentElement?.closest('pre, code, script, style, textarea')) continue;
    for (const [name, pattern] of TEXT_PATTERNS) {
      if (pattern.test(node.textContent)) leftovers.push(`${file}: ${name} in text ${JSON.stringify(node.textContent.trim().slice(0, 80))}`);
    }
  }
}

console.log(`${documents.size} HTML documents; ${checked} internal links/assets/anchors checked; ${missing.length} missing.`);
console.log(`Leftover VitePress syntax: ${leftovers.length} occurrence(s) in ${new Set(leftovers.map((l) => l.split(': ')[0])).size} document(s).`);
console.log('External links (not fetched; GitHub release targets are coordinator-owned):\n' + [...external].sort().join('\n'));
if (missing.length) { console.error(missing.join('\n')); process.exitCode = 1; }
if (leftovers.length) { console.error(leftovers.join('\n')); process.exitCode = 1; }
