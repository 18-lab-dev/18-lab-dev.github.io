import { readFile, writeFile, mkdir, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import MarkdownIt from 'markdown-it';
import anchor from 'markdown-it-anchor';
import container from 'markdown-it-container';

const escape = (s) => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

/*
 * The documentation sources were written for VitePress. Every VitePress-only construct they use is
 * converted here into the 18-LAB design's own markup; anything unsupported fails the build instead
 * of leaking raw syntax into a page (scripts/check-links.mjs also scans the built HTML).
 */
const md = new MarkdownIt({ html: true, linkify: true });

// `## Heading {#custom-id}` sets the heading id explicitly; markdown-it-anchor keeps an existing id.
md.core.ruler.push('heading_ids', (state) => {
  for (let i = 0; i < state.tokens.length; i++) {
    if (state.tokens[i].type !== 'heading_open') continue;
    const inline = state.tokens[i + 1];
    const last = inline.children.at(-1);
    const match = last?.type === 'text' && last.content.match(/\s*\{#([\w-]+)\}\s*$/);
    if (!match) continue;
    last.content = last.content.slice(0, match.index);
    inline.content = inline.content.replace(/\s*\{#[\w-]+\}\s*$/, '');
    state.tokens[i].attrSet('id', match[1]);
  }
});
md.use(anchor, { slugify: (s) => s.toLowerCase().replace(/[^\p{L}\p{N}-]+/gu, '-').replace(/^-|-$/g, '') });

// `[[toc]]` alone in a paragraph becomes this page's outline (filled in after rendering).
const TOC = '<!--18lab-toc-->';
md.core.ruler.push('toc', (state) => {
  const tokens = state.tokens;
  for (let i = 0; i + 2 < tokens.length; i++) {
    if (tokens[i].type !== 'paragraph_open' || tokens[i + 1].content.trim() !== '[[toc]]') continue;
    const block = new state.Token('html_block', '', 0);
    block.content = TOC;
    tokens.splice(i, 3, block);
  }
});

/** VitePress fence info: `lang [title] {1,3-4}`, optionally `lang:line-numbers`. */
function fenceInfo(info) {
  const match = info.trim().match(/^([^\s[{:]*)(?::[\w-]+)?\s*(?:\[([^\]]*)\])?\s*(?:\{([\d,\s-]+)\})?\s*$/);
  if (!match) throw new Error(`Unsupported code fence info "${info}"`);
  const highlighted = new Set();
  for (const part of (match[3] ?? '').split(',').map((p) => p.trim()).filter(Boolean)) {
    const [from, to = from] = part.split('-').map(Number);
    for (let line = from; line <= to; line++) highlighted.add(line);
  }
  return { lang: match[1] || 'text', title: match[2]?.trim(), highlighted };
}

md.renderer.rules.fence = (tokens, idx) => {
  const token = tokens[idx];
  const { lang, title, highlighted } = fenceInfo(token.info);
  const lines = token.content.replace(/\n$/, '').split('\n');
  const code = highlighted.size
    ? lines.map((line, i) => `<span class="line${highlighted.has(i + 1) ? ' is-highlighted' : ''}">${escape(line)}</span>`).join('\n')
    : escape(lines.join('\n'));
  const tab = title ?? (token.meta?.inGroup ? lang : undefined);
  return `<div class="code-block" data-lang="${escape(lang)}"${tab ? ` data-tab="${escape(tab)}"` : ''}><pre><code class="language-${escape(lang)}">${code}</code></pre></div>\n`;
};

/*
 * `::: code-group` becomes a code group: each fence is a labelled block, and the page script turns
 * the group into tabs. Without JavaScript the blocks remain readable in sequence.
 */
md.use(container, 'code-group', {
  render(tokens, idx) {
    if (tokens[idx].nesting < 0) return '</div>\n';
    for (let i = idx + 1; tokens[i].type !== 'container_code-group_close'; i++) {
      if (tokens[i].type === 'fence') tokens[i].meta = { ...tokens[i].meta, inGroup: true };
    }
    return '<div class="code-group" data-code-group>\n';
  },
});

/* Callouts: `::: tip|info|warning|danger|details|<custom> [title]` in the prototype's callout style. */
const CALLOUTS = {
  tip: { label: 'Tip', tone: 'note' },
  info: { label: 'Note', tone: 'note' },
  note: { label: 'Note', tone: 'note' },
  warning: { label: 'Caution', tone: 'caution' },
  caution: { label: 'Caution', tone: 'caution' },
  danger: { label: 'Danger', tone: 'danger' },
  details: { label: 'Details', tone: 'note' },
};
const openCallouts = [];
md.use(container, 'callout', {
  validate: (params) => /^[a-z][\w-]*(\s|$)/i.test(params.trim()) && !params.trim().startsWith('code-group'),
  render(tokens, idx) {
    if (tokens[idx].nesting < 0) return openCallouts.pop() === 'details' ? '</details>\n' : '</aside>\n';
    const kind = tokens[idx].info.trim().split(/\s+/)[0].toLowerCase();
    openCallouts.push(kind);
    const { label, tone } = CALLOUTS[kind] ?? { label: kind[0].toUpperCase() + kind.slice(1).replaceAll('-', ' '), tone: 'note' };
    const title = tokens[idx].info.trim().slice(kind.length).trim();
    const tag = escape(title ? `${label} · ${title}` : label);
    return kind === 'details'
      ? `<details class="callout callout--${tone}"><summary class="callout-tag mono">${tag}</summary>\n`
      : `<aside class="callout callout--${tone}"><p class="callout-tag mono">${tag}</p>\n`;
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

/** Frontmatter supplies the page title and meta description; other VitePress keys are rejected. */
function frontmatter(raw, file) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n/);
  const data = {};
  for (const line of match?.[1].split('\n') ?? []) {
    const field = line.match(/^(\w+):\s*(.*)$/);
    if (!field || !['title', 'description'].includes(field[1])) throw new Error(`${file}: unsupported frontmatter "${line}"`);
    data[field[1]] = field[2].replace(/^(['"])(.*)\1$/, '$2');
  }
  return { data, body: match ? raw.slice(match[0].length) : raw };
}

const route = (file) => '/' + file.replace(/^docs\//, '').replace(/index\.md$/, '').replace(/\.md$/, '.html');
const canonical = (url) => url.replace(/\.html$/, '');
const sources = (await walk('docs')).filter((p) => p.endsWith('.md') && p !== 'docs/index.md');
const pages = await Promise.all(sources.map(async (file) => {
  const { data, body } = frontmatter(await readFile(file, 'utf8'), file);
  const heading = body.match(/^# (.+)$/m)?.[1];
  return { file, body, url: route(file), title: data.title ?? heading ?? file, description: data.description };
}));

const labels = { tosu: 'tosu 4.26.2', vosu: 'vosu', vosuAlone: 'vosu alone', v102: 'vosu 1.0.2', after: 'vosu 1.1.0' };
const datasets = { data: JSON.parse(await readFile('data/benchmarks-tosu-4.26.2.json')), paired: JSON.parse(await readFile('data/benchmarks-1.1.0-paired.json')) };
function charts(expression) {
  const [dataset, key] = expression.split('.');
  const items = datasets[dataset][key];
  return (Array.isArray(items) ? items : [items]).map((chart) => `<figure class="bench-table"><figcaption>${escape(chart.title)} · lower is better</figcaption><div class="table-scroll"><table><thead><tr><th>Measurement</th>${chart.series.map((s) => `<th>${labels[s] ?? escape(s)}</th>`).join('')}</tr></thead><tbody>${chart.rows.map((row) => `<tr><th>${escape(row.label)}</th>${chart.series.map((s) => `<td>${escape(row.values[s]?.s ?? 'not measured')}${row.values[s]?.range ? `<br><small>(${escape(row.values[s].range)})</small>` : ''}</td>`).join('')}</tr>`).join('')}</tbody></table></div></figure>`).join('\n');
}

/** VitePress `<Badge type text />` (or `<Badge type>text</Badge>`) becomes a design badge. */
function badge(type, text) {
  return `<span class="badge badge--${escape(type ?? 'tip')} mono">${escape(text.trim())}</span>`;
}

function render(page) {
  // Benchmark charts become static tables carrying every series and range.
  let body = page.body.replace(/<script setup>[\s\S]*?<\/script>/g, '').replace(/<BenchChart[^>]*\/>/g, (tag) => charts(tag.match(/v-for="chart in ([^"]+)"/)?.[1] ?? tag.match(/:chart="([^"]+)"/)[1]));
  let html = md.render(body);
  html = html.replace(/<Badge\b([^>]*?)\/>/g, (_, attrs) => badge(attrs.match(/type="([^"]+)"/)?.[1], attrs.match(/text="([^"]+)"/)?.[1] ?? ''));
  html = html.replace(/<Badge\b([^>]*)>([\s\S]*?)<\/Badge>/g, (_, attrs, text) => badge(attrs.match(/type="([^"]+)"/)?.[1], text));
  const component = html.match(/<([A-Z][A-Za-z]+)[\s/>]/);
  if (component) throw new Error(`${page.file}: unsupported component <${component[1]}>`);
  html = html.replace(/href="([^"]+)"/g, (match, href) => {
    if (/^(https?:|mailto:|tel:)/.test(href)) return match;
    const [url, hash] = href.split('#');
    const target = pages.find((p) => canonical(p.url) === url || p.url === url || p.file.replace(/^docs\//, '') === url);
    return target ? `href="${target.url}${hash ? '#' + hash : ''}"` : match;
  });
  html = html.replace(/<table>/g, '<div class="table-scroll"><table>').replace(/<\/table>/g, '</table></div>');
  const headings = [...html.matchAll(/<h([23]) id="([^"]+)"[^>]*>([\s\S]*?)<\/h\1>/g)].map((m) => ({
    level: Number(m[1]),
    id: m[2],
    text: m[3].replace(/<span class="badge[^>]*>[\s\S]*?<\/span>/g, '').replace(/<[^>]+>/g, '').trim(),
  }));
  const toc = `<nav class="toc" aria-label="Contents"><ul>${headings.map((h) => `<li${h.level === 3 ? ' class="sub"' : ''}><a href="#${h.id}">${h.text}</a></li>`).join('')}</ul></nav>`;
  return { html: html.replaceAll(TOC, toc), headings };
}

function outline(headings) {
  let section = 0;
  return headings.map((h) => {
    if (h.level === 2) section++;
    const label = h.level === 2 ? `§${String(section).padStart(2, '0')}` : '·';
    return `<li${h.level === 3 ? ' class="sub"' : ''}><a href="#${h.id}" data-target="${h.id}"><span class="mono">${label}</span>${h.text}</a></li>`;
  }).join('');
}

function sidebar(current) {
  const groups = [['vosu', 'vosu/'], ['User guide', 'vosu/guide/'], ['API & development', 'vosu/dev/'], ['Overlay tutorial', 'vosu/dev/tutorial/'], ['vosulay', 'vosulay/']];
  const indexFirst = (a, b) => Number(b.file.endsWith('/index.md')) - Number(a.file.endsWith('/index.md'));
  return groups.map(([title, dir]) => `<section class="side-group"><h2>${title}</h2><ul>${pages.filter((p) => path.posix.dirname(p.file.slice(5)) + '/' === dir).sort(indexFirst).map((p, i) => `<li><a href="${p.url}"${p.url === current ? ' aria-current="page"' : ''}><span class="mono">${String(i).padStart(2, '0')}</span>${escape(p.title)}</a></li>`).join('')}</ul></section>`).join('');
}

await rm('.generated', { recursive: true, force: true });
await mkdir('.generated', { recursive: true });
await rm('vosu', { recursive: true, force: true });
await rm('vosulay', { recursive: true, force: true });
for (const page of pages) {
  const { html, headings } = render(page);
  const description = page.description ? `<meta name="description" content="${escape(page.description)}">` : '';
  const document = `<!doctype html><html lang="en" data-theme="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(page.title)} · 18-LAB</title>${description}<link rel="canonical" href="https://18-lab-dev.github.io${canonical(page.url)}"><link rel="icon" href="/favicon.svg"><script>document.documentElement.dataset.theme=localStorage.getItem('18lab-theme')??'dark'</script><script type="module" src="/src/documentation.ts"></script></head><body><div data-shell="header"></div><main class="docs wrap"><aside class="docs-side"><label class="side-search">Find a page<input type="search" data-doc-search aria-label="Find a documentation page"></label><nav aria-label="Documentation">${sidebar(page.url)}</nav></aside><article class="docs-main prose"><p class="crumbs mono"><a href="/">18-LAB</a> / Documentation</p>${html}<p class="doc-source"><a href="https://github.com/18-lab-dev/18-lab-dev.github.io/edit/main/${page.file}">Edit this page on GitHub</a></p></article><aside class="docs-outline" aria-label="On this page"><p class="mono outline-title">On this sheet</p><ol data-outline>${outline(headings)}</ol><p class="outline-progress mono"><span class="muted">Read</span> <span data-progress>000%</span></p></aside></main><div data-shell="footer"></div></body></html>`;
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
