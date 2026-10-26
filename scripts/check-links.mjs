import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { parseHTML } from 'linkedom';

async function walk(dir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    files.push(...(entry.isDirectory() ? await walk(file) : [file]));
  }
  return files;
}
const files = (await walk('dist')).filter((file) => file.endsWith('.html'));
const documents = new Map(await Promise.all(files.map(async (file) => [file, parseHTML(await readFile(file, 'utf8')).document])));
const missing = [];
const external = new Set();
let checked = 0;
for (const [file, document] of documents) {
  for (const el of document.querySelectorAll('[href], [src]')) {
    const href = el.getAttribute('href') ?? el.getAttribute('src');
    if (!href || /^(data:|mailto:|tel:|javascript:)/.test(href)) continue;
    const url = new URL(href, 'https://18-lab-dev.github.io/' + path.relative('dist', file));
    if (url.origin !== 'https://18-lab-dev.github.io') { external.add(url.href); continue; }
    checked++;
    const base = path.join('dist', decodeURIComponent(url.pathname));
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
console.log(`${documents.size} HTML documents; ${checked} internal links/assets/anchors checked; ${missing.length} missing.`);
console.log('External links (not fetched; GitHub release targets are coordinator-owned):\n' + [...external].sort().join('\n'));
if (missing.length) { console.error(missing.join('\n')); process.exitCode = 1; }
