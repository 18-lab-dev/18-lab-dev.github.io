import "@fontsource/barlow-condensed/500.css";
import "@fontsource/barlow-condensed/600.css";
import "@fontsource/barlow-condensed/700.css";
import "@fontsource/barlow/400.css";
import "@fontsource/barlow/500.css";
import "@fontsource/barlow/600.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "./styles/tokens.css";
import "./styles/base.css";
import { logotypeSvg } from "./mark";

export const ORG = "18-lab-dev";
export const GITHUB = `https://github.com/${ORG}`;

const THEME_KEY = "18lab-theme";

type Page = "home" | "docs" | "brand";

const NAV: { id: string; page: Page; href: string; label: string }[] = [
  { id: "route", page: "home", href: "/#route", label: "Route" },
  { id: "measure", page: "home", href: "/#measure", label: "Measure" },
  { id: "docs", page: "docs", href: "/vosu/guide/", label: "Docs" },
  { id: "brand", page: "brand", href: "/brand.html", label: "Brand" },
];

const githubIcon = `<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>`;

function header(page: Page): string {
  const links = NAV.map(
    (item, i) =>
      `<a class="mono" href="${item.href}"${item.page === page && page !== "home" ? ' aria-current="page"' : ""}><span>0${i + 1}</span>${item.label}</a>`,
  ).join("");
  return `
<header class="site-header">
  <div class="wrap">
    <a class="brand" href="/" aria-label="18-LAB home">
      ${logotypeSvg("brand-logo")}
      <span class="brand-sub mono">Laboratory 18</span>
    </a>
    <nav class="site-nav" aria-label="Primary">${links}</nav>
    <div class="header-tools">
      <button class="mode-toggle mono" type="button" data-mode-toggle aria-label="Switch colour mode">
        <span class="mode-glyph" aria-hidden="true"></span><span class="muted">Mode</span>
      </button>
      <a class="gh-link mono" href="${GITHUB}">${githubIcon}<span>${ORG}</span></a>
    </div>
  </div>
</header>`;
}

function footer(sheet: string): string {
  const today = new Date().toISOString().slice(0, 10);
  return `
<footer class="title-block wrap" aria-label="Site information">
  <div class="tb-grid">
    <div class="tb-cell tb-id">
      <span class="mono">Drawn by</span>
      <div>
        ${logotypeSvg("brand-logo")}
        <p class="mono muted">Performance-engineered osu! tooling</p>
      </div>
    </div>
    <div class="tb-cell">
      <span class="mono">Projects</span>
      <ul class="tb-links">
        <li><a href="${GITHUB}/vosu">vosu</a></li>
        <li><a href="${GITHUB}/vosulay">vosulay</a></li>
        <li><a href="${GITHUB}/vosu-tools">vosu-tools</a></li>
      </ul>
    </div>
    <div class="tb-cell">
      <span class="mono">Documentation</span>
      <ul class="tb-links">
        <li><a href="/vosu/guide/">User guide</a></li>
        <li><a href="/vosu/dev/">API reference</a></li>
        <li><a href="/vosu/dev/tutorial/">Build an overlay</a></li>
      </ul>
    </div>
    <div class="tb-cell">
      <span class="mono">Organisation</span>
      <ul class="tb-links">
        <li><a href="${GITHUB}">GitHub</a></li>
        <li><a href="${GITHUB}/vosu/releases/latest">Releases</a></li>
        <li><a href="/brand.html">Brand sheet</a></li>
      </ul>
    </div>
    <div class="tb-cell">
      <span class="mono">Licence</span>
      <span class="tb-value">MIT · site &amp; docs</span>
    </div>
    <div class="tb-cell"><span class="mono">Sheet</span><span class="tb-value">${sheet}</span></div>
    <div class="tb-cell"><span class="mono">Scale</span><span class="tb-value">1 : 1</span></div>
    <div class="tb-cell"><span class="mono">Rev</span><span class="tb-value">1.2.0</span></div>
    <div class="tb-cell"><span class="mono">Date</span><span class="tb-value">${today}</span></div>
  </div>
  <div class="tb-legal mono">
    <span>Not affiliated with ppy or the tosu project.</span>
    <span>Code © 2026 18-LAB · artwork &amp; branding © 2026 sxlvia</span>
  </div>
</footer>`;
}

function bindModeToggle(): void {
  const root = document.documentElement;
  for (const button of document.querySelectorAll<HTMLButtonElement>("[data-mode-toggle]")) {
    button.addEventListener("click", () => {
      const next = root.dataset.theme === "light" ? "dark" : "light";
      root.dataset.theme = next;
      localStorage.setItem(THEME_KEY, next);
      document.dispatchEvent(new CustomEvent("themechange"));
    });
  }
}

/** Adds `.is-drawn` the first time an `[data-draw]` region scrolls into view, which starts its line drawing. */
function bindDrawIn(): void {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-drawn");
        observer.unobserve(entry.target);
      }
    },
    { threshold: 0.15 },
  );
  for (const el of document.querySelectorAll("[data-draw]")) observer.observe(el);
}

export function mountShell(page: Page, sheet: string): void {
  document.querySelector("[data-shell=header]")!.outerHTML = header(page);
  document.querySelector("[data-shell=footer]")!.outerHTML = footer(sheet);
  bindModeToggle();
  bindDrawIn();
}
