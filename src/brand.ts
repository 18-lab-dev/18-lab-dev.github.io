import "./styles/figure.css";
import "./styles/brand.css";
import { constructionFigure, logotypeGroup, logotypeSvg, LOGOTYPE_VIEWBOX, markGeometry, markSvg } from "./mark";
import { mountShell, ORG } from "./shell";

mountShell("brand", "B-00–B-05");

/**
 * Fixed per-mode values. tokens.css only exposes the active mode, but this sheet must show both
 * modes side by side, so the palette is restated here; keep the two in step.
 */
const PALETTE = {
  dark: {
    name: "Workstation",
    sub: "Graphite + amber",
    bg: "#111214",
    raised: "#17191c",
    rule: "#25282c",
    ruleStrong: "#3b3f45",
    fg: "#ebe8e1",
    fgDim: "#b8b5ad",
    muted: "#7e8288",
    accent: "#ff963f",
    signal: "#7fa6cf",
  },
  light: {
    name: "Drafting",
    sub: "Paper + blueprint",
    bg: "#f2f1ec",
    raised: "#f8f7f3",
    rule: "#d6dadd",
    ruleStrong: "#a7b2bd",
    fg: "#132030",
    fgDim: "#3b4858",
    muted: "#677483",
    accent: "#175fad",
    signal: "#b8621b",
  },
} as const;

type Mode = keyof typeof PALETTE;

const fill = (selector: string, html: string) => {
  document.querySelector(selector)!.innerHTML = html;
};

/* ------------------------------------------------------------------ B-01 mark */

fill("[data-brand-fig]", constructionFigure());

fill(
  "[data-clearspace]",
  `<svg viewBox="-6 2 132 120" class="clearspace-svg" aria-label="Clear space diagram">
    <rect x="2" y="7" width="114" height="108" class="cs-outer" />
    <rect x="16" y="21" width="86" height="80" class="cs-inner" />
    <g fill="currentColor" class="cs-mark">${markGeometry}</g>
    <path d="M2 61 H16 M2 58 v6 M16 58 v6" class="cs-dim" />
    <text x="9" y="55" class="cs-label" text-anchor="middle">x</text>
    <path d="M59 7 V21 M56 7 h6 M56 21 h6" class="cs-dim" />
    <text x="65" y="16" class="cs-label">x</text>
  </svg>
  <p class="mono muted">Clear space · x = loop A radius (14) on every side of the bounding box</p>`,
);

const VARIANTS = [
  { id: "V-01", name: "Workstation", bg: PALETTE.dark.bg, ink: PALETTE.dark.accent },
  { id: "V-02", name: "Drafting", bg: PALETTE.light.bg, ink: PALETTE.light.accent },
  { id: "V-03", name: "Mono · ink", bg: PALETTE.light.bg, ink: PALETTE.dark.bg },
  { id: "V-04", name: "Mono · reversed", bg: PALETTE.dark.bg, ink: PALETTE.dark.fg },
];

fill(
  "[data-variants]",
  VARIANTS.map(
    (v) => `
    <figure class="variant" style="--vbg:${v.bg};--vink:${v.ink}">
      <div class="variant-tile">${markSvg("variant-mark", `18-LAB mark, ${v.name}`)}</div>
      <figcaption class="mono"><span class="accent">${v.id}</span><span>${v.name}</span><span class="muted">${v.ink} / ${v.bg}</span></figcaption>
    </figure>`,
  ).join(""),
);

fill(
  "[data-sizes]",
  `<p class="mono muted">Size ladder</p>
  <div class="size-row">${[96, 64, 32, 24, 16]
    .map((px) => `<figure><div style="width:${px}px;height:${px}px">${markSvg("size-mark")}</div><figcaption class="mono">${px} px</figcaption></figure>`)
    .join("")}</div>`,
);

/* ------------------------------------------------------------------ B-02 lockups */

fill(
  "[data-lockups]",
  `
  <figure class="lockup lockup--h">
    <div class="lockup-art">
      ${logotypeSvg("lk-logo")}
      <span class="lk-rule"></span>
      <span class="lk-desc mono">Laboratory 18<br /><span class="muted">osu! tooling</span></span>
    </div>
    <figcaption class="mono"><span class="accent">L-01</span> Primary · the mark is the “18”</figcaption>
  </figure>
  <figure class="lockup lockup--v">
    <div class="lockup-art">
      ${markSvg("lk-mark")}
      <span class="lk-word">Laboratory</span>
    </div>
    <figcaption class="mono"><span class="accent">L-02</span> Stacked · 18 / Laboratory</figcaption>
  </figure>
  <figure class="lockup lockup--p">
    <div class="lockup-art">
      ${markSvg("lk-mark")}
      <span class="lk-rule"></span>
      <span class="lk-product"><span class="mono accent">18-01</span><span class="lk-word">vosu</span></span>
    </div>
    <figcaption class="mono"><span class="accent">L-03</span> Product · mark + stage code</figcaption>
  </figure>`,
);

/* ------------------------------------------------------------------ B-03 colour */

const ROLES: { key: keyof (typeof PALETTE)["dark"]; role: string; use: string }[] = [
  { key: "bg", role: "Ground", use: "Page background" },
  { key: "raised", role: "Raised", use: "Panels, maps, cards" },
  { key: "rule", role: "Rule", use: "Grids, hairlines" },
  { key: "ruleStrong", role: "Rule strong", use: "Borders, ticks" },
  { key: "fg", role: "Ink", use: "Headings, data" },
  { key: "fgDim", role: "Ink dim", use: "Body copy" },
  { key: "muted", role: "Muted", use: "Labels, annotations" },
  { key: "accent", role: "Accent", use: "Action, selection, mark" },
  { key: "signal", role: "Signal", use: "Construction lines — the other mode's accent" },
];

const SHARE: [keyof (typeof PALETTE)["dark"], number][] = [
  ["bg", 62],
  ["raised", 14],
  ["fg", 12],
  ["ruleStrong", 6],
  ["accent", 4],
  ["signal", 2],
];

fill(
  "[data-palettes]",
  (Object.keys(PALETTE) as Mode[])
    .map((mode) => {
      const p = PALETTE[mode];
      return `
    <article class="palette" style="--pbg:${p.bg};--pfg:${p.fg};--pmuted:${p.muted};--prule:${p.rule};--paccent:${p.accent}">
      <header>
        <p class="mono" style="color:${p.accent}">${mode === "dark" ? "Mode A · dark" : "Mode B · light"}</p>
        <h3>${p.name}</h3>
        <p class="mono" style="color:${p.muted}">${p.sub}</p>
      </header>
      <div class="share" aria-label="Approximate area share">
        ${SHARE.map(([k, pct]) => `<span style="flex:${pct};background:${p[k]}" title="${k} ${pct}%"></span>`).join("")}
      </div>
      <ul>
        ${ROLES.map(
          (r) => `<li>
            <span class="chip" style="background:${p[r.key]}"></span>
            <span class="role">${r.role}</span>
            <span class="hex mono">${p[r.key]}</span>
            <span class="use">${r.use}</span>
          </li>`,
        ).join("")}
      </ul>
    </article>`;
    })
    .join(""),
);

/* ------------------------------------------------------------------ B-04 type scale */

const SCALE: [string, string, string][] = [
  ["Step 4", "var(--step-4)", "88 px max"],
  ["Step 3", "var(--step-3)", "60 px max"],
  ["Step 2", "var(--step-2)", "28 px"],
  ["Step 1", "var(--step-1)", "20 px"],
  ["Step 0", "var(--step-0)", "16 px"],
];

fill(
  "[data-type-scale]",
  SCALE.map(
    ([name, size, px]) =>
      `<li><span class="mono muted">${name}</span><span class="ts-sample" style="font-size:${size}">Route to the next stage</span><span class="mono muted">${px}</span></li>`,
  ).join(""),
);

/* ------------------------------------------------------------------ B-05 GitHub applications */

function grid(w: number, h: number, minor: string, major: string): string {
  const lines: string[] = [];
  for (let x = 0; x <= w; x += 16) lines.push(`<line x1="${x}" y1="0" x2="${x}" y2="${h}" stroke="${x % 80 === 0 ? major : minor}" />`);
  for (let y = 0; y <= h; y += 16) lines.push(`<line x1="0" y1="${y}" x2="${w}" y2="${y}" stroke="${y % 80 === 0 ? major : minor}" />`);
  return `<g stroke-width="1">${lines.join("")}</g>`;
}

function corners(w: number, h: number, color: string, inset = 16, len = 14): string {
  return `<path d="M${inset} ${inset + len} V${inset} H${inset + len} M${w - inset - len} ${inset} H${w - inset} V${inset + len} M${w - inset} ${h - inset - len} V${h - inset} H${w - inset - len} M${inset + len} ${h - inset} H${inset} V${h - inset - len}" fill="none" stroke="${color}" stroke-width="1.5" />`;
}

const mono = `font-family="IBM Plex Mono, monospace" font-weight="500" letter-spacing="1.4"`;
const display = `font-family="Barlow Condensed, sans-serif" font-weight="700"`;

function banner(mode: Mode): string {
  const p = PALETTE[mode];
  const W = 1280;
  const H = 320;
  const ticks = Array.from({ length: W / 8 + 1 }, (_, i) => {
    const x = i * 8;
    const len = x % 80 === 0 ? 10 : 4;
    return `<line x1="${x}" y1="${H}" x2="${x}" y2="${H - len}" />`;
  }).join("");
  return `
<svg viewBox="0 0 ${W} ${H}" class="gh-banner" role="img" aria-label="18-LAB profile banner, ${p.name} mode">
  <rect width="${W}" height="${H}" fill="${p.bg}" />
  ${grid(W, H, mode === "dark" ? "#16181b" : "#e9e9e3", mode === "dark" ? "#1d2024" : "#dfe2e4")}
  <g stroke="${p.ruleStrong}" stroke-width="1">${ticks}</g>
  ${corners(W, H, p.fgDim)}
  <text x="64" y="58" ${mono} font-size="13" fill="${p.accent}">18 / LABORATORY</text>
  <text x="228" y="58" ${mono} font-size="13" fill="${p.muted}">SHEET 00 · INDEX · REV A</text>

  <g transform="translate(${64 - LOGOTYPE_VIEWBOX.x * 1.375} ${92 - LOGOTYPE_VIEWBOX.y * 1.375}) scale(1.375)">${logotypeGroup(p.accent, p.accent, p.fg)}</g>
  <line x1="488" y1="92" x2="488" y2="202" stroke="${p.ruleStrong}" />
  <g ${mono} font-size="13">
    <text x="512" y="112" fill="${p.fg}">LABORATORY 18</text>
    <text x="512" y="138" fill="${p.muted}">PERFORMANCE-ENGINEERED</text>
    <text x="512" y="160" fill="${p.muted}">OSU! TOOLING</text>
    <text x="512" y="202" fill="${p.accent}">LINUX · WINDOWS</text>
  </g>
  <line x1="64" y1="240" x2="820" y2="240" stroke="${p.rule}" />
  <text x="64" y="268" ${mono} font-size="12" fill="${p.muted}">VOSU 1.2.0 · VOSULAY 1.5.0 · OSU!STABLE + OSU!LAZER</text>

  <g transform="translate(860 0)" ${mono} font-size="11">
    <circle cx="150" cy="166" r="58" fill="none" stroke="${p.ruleStrong}" stroke-dasharray="3 4" />
    <circle cx="150" cy="166" r="104" fill="none" stroke="${p.rule}" />
    <path d="M0 166 H150 H190 L250 106 H320 M190 166 L250 226 H320" fill="none" stroke="${p.fgDim}" stroke-width="1.5" />
    <path d="M150 166 H320" fill="none" stroke="${p.signal}" stroke-width="1.5" stroke-dasharray="6 5" />
    <rect x="-6" y="160" width="12" height="12" fill="${p.bg}" stroke="${p.fg}" stroke-width="1.5" />
    <rect x="143" y="159" width="14" height="14" transform="rotate(45 150 166)" fill="${p.accent}" />
    <rect x="245" y="101" width="10" height="10" transform="rotate(45 250 106)" fill="${p.bg}" stroke="${p.fg}" stroke-width="1.5" />
    <rect x="245" y="221" width="10" height="10" transform="rotate(45 250 226)" fill="${p.bg}" stroke="${p.fg}" stroke-width="1.5" />
    <text x="150" y="208" text-anchor="middle" fill="${p.accent}">18-01 VOSU</text>
    <text x="264" y="94" fill="${p.fgDim}">18-02 VOSULAY</text>
    <text x="264" y="250" fill="${p.fgDim}">18-03 STARTER</text>
    <text x="-6" y="150" fill="${p.muted}">18-00 OSU!</text>
  </g>
</svg>`;
}

function socialCard(): string {
  const p = PALETTE.dark;
  const W = 1280;
  const H = 640;
  const ring = Array.from({ length: 120 }, (_, i) => {
    const a = (i * 3 * Math.PI) / 180;
    const r2 = i % 10 === 0 ? 236 : 246;
    return `<line x1="${(Math.cos(a) * 254).toFixed(1)}" y1="${(Math.sin(a) * 254).toFixed(1)}" x2="${(Math.cos(a) * r2).toFixed(1)}" y2="${(Math.sin(a) * r2).toFixed(1)}" />`;
  }).join("");
  return `
<svg viewBox="0 0 ${W} ${H}" class="gh-social" role="img" aria-label="vosu repository social preview">
  <rect width="${W}" height="${H}" fill="${p.bg}" />
  ${grid(W, H, "#16181b", "#1d2024")}
  <g transform="translate(1030 300)" stroke="${p.ruleStrong}" fill="none">
    <circle r="254" />${ring}
    <circle r="170" stroke-dasharray="3 5" />
    <path d="M-300 0 H300 M0 -300 V300" stroke="${p.rule}" />
    <g transform="translate(-97 -101) scale(1.65)" style="color:${p.accent}" fill="currentColor" stroke="none">${markGeometry}</g>
  </g>
  ${corners(W, H, p.fgDim, 24, 20)}
  <g transform="translate(${64 - LOGOTYPE_VIEWBOX.x * 0.3} ${72 - LOGOTYPE_VIEWBOX.y * 0.3}) scale(0.3)">${logotypeGroup(p.accent, p.accent, p.fg)}</g>
  <text x="64" y="176" ${mono} font-size="18" fill="${p.accent}">18-01 · TELEMETRY DAEMON</text>
  <text x="56" y="420" ${display} font-size="300" fill="${p.fg}" letter-spacing="-4">VOSU</text>
  <text x="64" y="484" font-family="Barlow, sans-serif" font-size="32" fill="${p.fgDim}">Native osu! telemetry daemon. Live state, counters,</text>
  <text x="64" y="524" font-family="Barlow, sans-serif" font-size="32" fill="${p.fgDim}">and tosu-compatible APIs from one Rust binary.</text>
  <line x1="64" y1="566" x2="1216" y2="566" stroke="${p.ruleStrong}" />
  <text x="64" y="598" ${mono} font-size="16" fill="${p.muted}">RUST · OSU!STABLE + OSU!LAZER · LINUX · WINDOWS · MIT OR APACHE-2.0</text>
  <text x="1216" y="598" ${mono} font-size="16" fill="${p.fgDim}" text-anchor="end">GITHUB.COM/${ORG.toUpperCase()}/VOSU</text>
</svg>`;
}

function avatar(radius: number): string {
  return `<svg viewBox="0 0 120 120" class="gh-avatar" style="border-radius:${radius}%">
    <rect width="120" height="120" fill="${PALETTE.dark.bg}" />
    <g transform="translate(60 60) scale(0.72) translate(-59 -61)" style="color:${PALETTE.dark.accent}" fill="currentColor">${markGeometry}</g>
  </svg>`;
}

const REPOS = [
  { name: "vosu", desc: "A native osu! telemetry daemon written in Rust", lang: "Rust", stars: 2 },
  {
    name: "vosulay",
    desc: "Cross-platform in-game overlay manager for a vosu or tosu-compatible backend",
    lang: "Rust",
    stars: 3,
  },
];

function renderProfile(): void {
  const mode: Mode = document.documentElement.dataset.theme === "light" ? "light" : "dark";
  fill(
    "[data-gh-profile]",
    `
  <div class="ghp" data-mode="${mode}">
    <div class="ghp-chrome mono"><span></span><span></span><span></span><b>github.com/${ORG}</b></div>
    <div class="ghp-head">
      ${avatar(12)}
      <div>
        <h3>18-LAB</h3>
        <p class="ghp-bio">performance engineered osu! tooling for the power users</p>
        <p class="ghp-meta"><span>⌂ ${ORG}.github.io</span><span>${REPOS.length} repositories</span></p>
      </div>
    </div>
    <div class="ghp-readme">
      <p class="ghp-readme-title"><b>${ORG}</b> / README<span>.md</span></p>
      ${banner(mode)}
    </div>
    <p class="ghp-pinned">Pinned</p>
    <div class="ghp-repos">
      ${REPOS.map(
        (r) => `<div class="ghp-repo"><p><b>${r.name}</b><span>Public</span></p><p>${r.desc}</p><p><i></i>${r.lang} · ☆ ${r.stars}</p></div>`,
      ).join("")}
    </div>
    <p class="ghp-note mono">Preview follows the page mode · toggle in the header</p>
  </div>`,
  );
}

renderProfile();
document.addEventListener("themechange", renderProfile);

fill(
  "[data-apps]",
  `
  <figure class="app app--avatars">
    <div class="avatar-row">
      <div>${avatar(12)}<span class="mono">460 · org</span></div>
      <div class="sm">${avatar(12)}<span class="mono">48</span></div>
      <div class="xs">${avatar(12)}<span class="mono">20</span></div>
      <div>${avatar(50)}<span class="mono">circle crop</span></div>
    </div>
    <figcaption class="mono"><span class="accent">A-01</span> Avatar · amber on graphite</figcaption>
  </figure>
  <figure class="app app--banners">
    ${banner("dark")}
    ${banner("light")}
    <figcaption class="mono"><span class="accent">A-02</span> Profile banner · 1280 × 320 · dark and light via &lt;picture&gt;</figcaption>
  </figure>
  <figure class="app app--social">
    ${socialCard()}
    <figcaption class="mono"><span class="accent">A-03</span> Repository social preview · 1280 × 640</figcaption>
  </figure>`,
);
