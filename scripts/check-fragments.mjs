// Fails when an internal link points at a heading anchor that does not exist.
// VitePress's dead-link check only validates page paths, not #fragments, so a
// renamed heading silently breaks links into it.
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.argv[2] ?? "docs/.vitepress/dist";

/** Built page route (cleanUrls form) -> HTML. */
const pages = new Map();
for (const entry of readdirSync(root, { recursive: true, withFileTypes: true })) {
  if (!entry.isFile() || !entry.name.endsWith(".html")) continue;
  const file = join(entry.parentPath, entry.name);
  const route =
    "/" +
    relative(root, file)
      .replace(/\.html$/, "")
      .replace(/(^|\/)index$/, "$1");
  pages.set(route, readFileSync(file, "utf8"));
}

const anchors = new Map(
  [...pages].map(([route, html]) => [
    route,
    new Set(Array.from(html.matchAll(/\sid="([^"]+)"/g), (match) => match[1])),
  ]),
);

let broken = 0;
for (const [route, html] of pages) {
  for (const [, href] of html.matchAll(/href="([^"]*#[^"]+)"/g)) {
    if (/^[a-z]+:/i.test(href)) continue;
    const [path, fragment] = href.split("#");
    const target = path === "" ? route : path.replace(/\.html$/, "");
    if (!anchors.has(target)) {
      console.log(`missing page: ${route} -> ${href}`);
      broken++;
    } else if (!anchors.get(target).has(decodeURIComponent(fragment))) {
      console.log(`missing anchor: ${route} -> ${href}`);
      broken++;
    }
  }
}

console.log(`${pages.size} pages checked, ${broken} broken fragment links`);
process.exitCode = broken ? 1 : 0;
