import { readFile, writeFile, mkdir, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import MarkdownIt from 'markdown-it';
import anchor from 'markdown-it-anchor';
import container from 'markdown-it-container';

const escape = (s) => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const md = new MarkdownIt({ html: true, linkify: true }).use(anchor, {
  slugify: (s) => s.toLowerCase().replace(/[^\p{L}\p{N}-]+/gu, '-').replace(/^-|-$/g, ''),
});
for (const kind of ['tip', 'warning', 'danger', 'info', 'details']) md.use(container, kind, {
  render(tokens, i) {
    if (tokens[i].nesting < 0) return kind === 'details' ? '</details>\n' : '</aside>\n';
    const title = tokens[i].info.trim().slice(kind.length).trim() || kind;
    return kind === 'details' ? `<details><summary>${escape(title)}</summary>\n` : `<aside class="callout callout--${kind}"><p><strong>${escape(title)}</strong></p>\n`;
  },
});
async function walk(dir) {
  const result = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    result.push(...(entry.isDirectory() ? await walk(file) : [file]));
  }
  return result.sort();
}
const route = (file) => '/' + file.replace(/^docs\//, '').replace(/index\.md$/, '').replace(/\.md$/, '.html');
const canonical = (url) => url.replace(/\.html$/, '');
const sources = (await walk('docs')).filter((p) => p.endsWith('.md') && p !== 'docs/index.md');
const pages = await Promise.all(sources.map(async (file) => {
  const raw = await readFile(file, 'utf8');
  const body = raw.replace(/^---\n[\s\S]*?\n---\n/, '');
  return { file, body, url: route(file), title: body.match(/^# (.+)$/m)?.[1] ?? file };
}));
const labels = { tosu: 'tosu 4.26.2', vosu: 'vosu', vosuAlone: 'vosu alone', v102: 'vosu 1.0.2', after: 'vosu 1.1.0' };
const datasets = { data: JSON.parse(await readFile('data/benchmarks-tosu-4.26.2.json')), paired: JSON.parse(await readFile('data/benchmarks-1.1.0-paired.json')) };
function charts(expression) {
  const [dataset, key] = expression.split('.');
  const items = datasets[dataset][key];
  return (Array.isArray(items) ? items : [items]).map((chart) => `<figure class="bench-table"><figcaption>${escape(chart.title)} · lower is better</figcaption><div class="table-scroll"><table><thead><tr><th>Measurement</th>${chart.series.map((s) => `<th>${labels[s] ?? escape(s)}</th>`).join('')}</tr></thead><tbody>${chart.rows.map((row) => `<tr><th>${escape(row.label)}</th>${chart.series.map((s) => `<td>${escape(row.values[s]?.s ?? 'not measured')}${row.values[s]?.range ? `<br><small>(${escape(row.values[s].range)})</small>` : ''}</td>`).join('')}</tr>`).join('')}</tbody></table></div></figure>`).join('\n');
}
function render(body) {
  // Preserve VitePress badges, callouts, all benchmark series/ranges and heading IDs in static HTML.
  body = body.replace(/<script setup>[\s\S]*?<\/script>/g, '').replace(/<BenchChart[^>]*\/>/g, (tag) => charts(tag.match(/v-for="chart in ([^"]+)"/)?.[1] ?? tag.match(/:chart="([^"]+)"/)[1]));
  let html = md.render(body);
  html = html.replace(/<Badge[^>]*text="([^"]+)"[^>]*\/>/g, (_, text) => `<span class="badge">${escape(text)}</span>`);
  html = html.replace(/href="([^"]+)"/g, (match, href) => {
    if (/^(https?:|mailto:|tel:)/.test(href)) return match;
    const [url, hash] = href.split('#');
    const target = pages.find((p) => canonical(p.url) === url || p.url === url || p.file.replace(/^docs\//, '') === url);
    return target ? `href="${target.url}${hash ? '#' + hash : ''}"` : match;
  });
  return html.replace(/<table>/g, '<div class="table-scroll"><table>').replace(/<\/table>/g, '</table></div>');
}
function sidebar(current) {
  const groups = [['vosu', 'vosu/'], ['User guide', 'vosu/guide/'], ['API & development', 'vosu/dev/'], ['Overlay tutorial', 'vosu/dev/tutorial/'], ['vosulay', 'vosulay/']];
  return groups.map(([title, dir]) => `<section class="side-group"><h2>${title}</h2><ul>${pages.filter((p) => path.posix.dirname(p.file.slice(5)) + '/' === dir).map((p, i) => `<li><a href="${p.url}"${p.url === current ? ' aria-current="page"' : ''}><span class="mono">${String(i).padStart(2, '0')}</span>${escape(p.title)}</a></li>`).join('')}</ul></section>`).join('');
}
await rm('.generated', { recursive: true, force: true });
await mkdir('.generated', { recursive: true });
await rm('vosu', { recursive: true, force: true });
await rm('vosulay', { recursive: true, force: true });
for (const page of pages) {
  const html = render(page.body);
  const headings = [...html.matchAll(/<h([23]) id="([^"]+)"[^>]*>([\s\S]*?)<\/h\1>/g)];
  const outline = headings.map((m) => `<li><a href="#${m[2]}">${m[3].replace(/<[^>]+>/g, '')}</a></li>`).join('');
  const document = `<!doctype html><html lang="en" data-theme="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(page.title)} · 18-LAB</title><link rel="canonical" href="https://18-lab-dev.github.io${canonical(page.url)}"><link rel="icon" href="/favicon.svg"><script>document.documentElement.dataset.theme=localStorage.getItem('18lab-theme')??'dark'</script><script type="module" src="/src/documentation.ts"></script></head><body><div data-shell="header"></div><main class="docs wrap"><aside class="docs-side"><label class="side-search">Find a page<input type="search" data-doc-search aria-label="Find a documentation page"></label><nav aria-label="Documentation">${sidebar(page.url)}</nav></aside><article class="docs-main prose"><p class="crumbs mono"><a href="/">18-LAB</a> / Documentation</p>${html}<p class="doc-source"><a href="https://github.com/18-lab-dev/18-lab-dev.github.io/edit/main/${page.file}">Edit this page on GitHub</a></p></article><aside class="docs-outline"><p class="mono">On this sheet</p><nav aria-label="On this page"><ul>${outline}</ul></nav></aside></main><div data-shell="footer"></div></body></html>`;
  const output = '.' + page.url + (page.url.endsWith('/') ? 'index.html' : '');
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, document);
}
// The prototype's guide URL is an alias; all original documentation URLs are retained.
await mkdir('public', { recursive: true });
await writeFile('public/third-party-licenses.txt', await readFile('THIRD-PARTY-LICENSES.txt', 'utf8'));
await writeFile('public/docs.html', '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=/vosu/guide/install.html"><title>Install vosu · 18-LAB</title><script>location.replace("/vosu/guide/install.html"+location.search+location.hash)</script></head><body><a href="/vosu/guide/install.html">Install vosu</a></body></html>');
await writeFile('.generated/pages.json', JSON.stringify(pages.map(({ file, url, title }) => ({ file, url, title })), null, 2));
console.log(`Generated ${pages.length} documentation pages; all original product routes retained.`);
