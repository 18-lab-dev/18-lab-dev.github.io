import "./styles/figure.css";
import "./styles/landing.css";
import { constructionFigure, logotypeSvg } from "./mark";
import { mountShell } from "./shell";
import { READOUTS, REGULAR_CYCLE, STAGES, type Stage } from "./data";

mountShell("home", "00–05 / 05");

const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const pad4 = (n: number) => String(Math.max(0, Math.round(n))).padStart(4, "0");

/* ------------------------------------------------------------------ hero */

document.querySelector("[data-fig]")!.innerHTML = constructionFigure();
document.querySelector("[data-wordmark]")!.innerHTML = logotypeSvg("wm-logo");

const hero = document.querySelector<HTMLElement>(".hero")!;
const crosshair = hero.querySelector<HTMLElement>(".hero-crosshair")!;
const crosshairLabel = crosshair.querySelector<HTMLElement>(".ch-label")!;
const cursorReadout = document.querySelector<HTMLElement>("[data-cursor]")!;

hero.addEventListener("pointermove", (event) => {
  if (event.pointerType !== "mouse") return;
  const box = hero.getBoundingClientRect();
  const x = event.clientX - box.left;
  const y = event.clientY - box.top;
  crosshair.style.setProperty("--cx", `${x}px`);
  crosshair.style.setProperty("--cy", `${y}px`);
  const text = `X ${pad4(x)} · Y ${pad4(y)}`;
  crosshairLabel.textContent = text;
  cursorReadout.textContent = text;
  crosshair.classList.add("is-active");
});
hero.addEventListener("pointerleave", () => crosshair.classList.remove("is-active"));

const clock = document.querySelector<HTMLElement>("[data-clock]")!;
const offsetHours = -new Date().getTimezoneOffset() / 60;
const zone = `UTC${offsetHours >= 0 ? "+" : "−"}${Math.abs(offsetHours)}`;
const tick = () => {
  clock.textContent = `${new Date().toLocaleTimeString("en-GB", { hour12: false })} ${zone}`;
};
tick();
setInterval(tick, 1000);

/* ------------------------------------------------------------------ route map */

const MAP_W = 1000;
const MAP_H = 560;
const COLS = "ABCDEFGHIJ";
const ROWS = 5;

/**
 * Wire paths between stages. `stages` lists the stages whose dossier lights the wire;
 * `packet` routes carry an animated data marker.
 */
const ROUTES: {
  d: string;
  cls: string;
  stages: string[];
  label?: { text: string; x: number; y: number; anchor?: "start" | "middle" | "end" };
  packet?: boolean;
}[] = [
  { d: "M112 290 H300", cls: "route-line", stages: ["vosu"], label: { text: "Process memory", x: 196, y: 278 }, packet: true },
  {
    d: "M300 290 H620",
    cls: "route-line",
    stages: ["vosu", "overlays", "tools"],
    label: { text: "Overlay listener · :24050", x: 336, y: 278 },
    packet: true,
  },
  {
    d: "M620 290 H820 Q840 290 840 270 V150",
    cls: "route-line",
    stages: ["vosulay"],
    label: { text: "Counter API", x: 852, y: 250 },
    packet: true,
  },
  { d: "M460 290 V430", cls: "route-line", stages: ["overlays"], label: { text: "/&lt;overlay&gt;/", x: 472, y: 370 }, packet: true },
  { d: "M620 290 V150", cls: "route-line", stages: ["tools"], label: { text: "/tools/&lt;id&gt;/", x: 632, y: 262 }, packet: true },
  {
    d: "M620 150 H840",
    cls: "route-line route-line--tools",
    stages: ["tools", "vosulay"],
    label: { text: "Official tool", x: 730, y: 140, anchor: "middle" },
  },
  {
    d: "M840 150 V64 H100 V194",
    cls: "route-line route-line--return",
    stages: ["vosulay"],
    label: { text: "In-game render · back into the client", x: 330, y: 52 },
    packet: true,
  },
  { d: "M300 290 V470", cls: "route-line", stages: ["vosu", "dashboard"], label: { text: "Dashboard · :24051", x: 312, y: 400 } },
  {
    d: "M300 470 V510 H730 V232",
    cls: "route-line route-line--manage",
    stages: ["dashboard", "tools"],
    label: { text: "Install · trust · lifecycle", x: 500, y: 500 },
  },
  {
    d: "M950 52 V120 Q950 140 930 140 H900",
    cls: "route-line route-line--tools",
    stages: ["tools"],
    label: { text: "Catalogs · HTTPS", x: 936, y: 44, anchor: "end" },
    packet: true,
  },
];

function routeMapSvg(): string {
  const verticals = Array.from({ length: COLS.length - 1 }, (_, i) => (i + 1) * (MAP_W / COLS.length));
  const horizontals = Array.from({ length: ROWS - 1 }, (_, i) => (i + 1) * (MAP_H / ROWS));
  const colLabels = [...COLS]
    .map((c, i) => `<text x="${i * 100 + 50}" y="18" class="map-ref" text-anchor="middle">${c}</text>`)
    .join("");
  const rowLabels = Array.from(
    { length: ROWS },
    (_, i) => `<text x="14" y="${i * 112 + 60}" class="map-ref" text-anchor="middle">${i + 1}</text>`,
  ).join("");

  const routes = ROUTES.map(
    (r, i) => `
    <mask id="route-mask-${i}" maskUnits="userSpaceOnUse" x="0" y="0" width="${MAP_W}" height="${MAP_H}">
      <path d="${r.d}" class="mask-line draw" pathLength="1" style="--d:${300 + i * 160}" />
    </mask>
    <path id="route-${i}" d="${r.d}" class="${r.cls}" data-stages="${r.stages.join(" ")}" mask="url(#route-mask-${i})" />
    ${r.label ? `<text x="${r.label.x}" y="${r.label.y}" text-anchor="${r.label.anchor ?? "start"}" class="map-label fade-in" style="--d:${900 + i * 160}">${r.label.text}</text>` : ""}
    ${
      r.packet && !reducedMotion
        ? `<rect class="packet" x="-3" y="-3" width="6" height="6"><animateMotion dur="${3.2 + i * 0.7}s" repeatCount="indefinite" rotate="auto"><mpath href="#route-${i}" /></animateMotion></rect>`
        : ""
    }`,
  ).join("");

  return `
<svg class="map" viewBox="0 0 ${MAP_W} ${MAP_H}" aria-hidden="true">
  <defs>
    <pattern id="map-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <line x1="0" y1="0" x2="0" y2="8" class="hatch-line" />
    </pattern>
    <pattern id="map-minor" width="20" height="22.4" patternUnits="userSpaceOnUse">
      <path d="M20 0 V22.4 M0 22.4 H20" class="grid-minor" />
    </pattern>
  </defs>
  <rect width="${MAP_W}" height="${MAP_H}" fill="url(#map-minor)" />
  ${verticals.map((x) => `<line x1="${x}" y1="0" x2="${x}" y2="${MAP_H}" class="grid-major" />`).join("")}
  ${horizontals.map((y) => `<line x1="0" y1="${y}" x2="${MAP_W}" y2="${y}" class="grid-major" />`).join("")}
  ${colLabels}${rowLabels}

  <g class="rings">
    ${[70, 140, 210]
      .map(
        (r, i) =>
          `<circle cx="300" cy="290" r="${r}" class="ring draw" pathLength="1" style="--d:${i * 120}" /><text x="${300 + r * 0.707 + 4}" y="${290 - r * 0.707 - 4}" class="map-ref">R${i + 1}</text>`,
      )
      .join("")}
  </g>

  <g class="zone">
    <rect x="34" y="196" width="148" height="188" fill="url(#map-hatch)" class="zone-box" />
    <text x="42" y="372" class="map-label">Zone 00 · game process</text>
    <rect x="88" y="278" width="24" height="24" class="terminal" />
    <text x="100" y="230" class="map-code" text-anchor="middle">18-00</text>
    <text x="100" y="256" class="map-name" text-anchor="middle">osu! client</text>
    <path d="M94 186 L100 196 L106 186" class="route-arrow fade-in" style="--d:1400" />
  </g>

  <g class="zone">
    <rect x="560" y="92" width="340" height="140" fill="url(#map-hatch)" class="zone-box" />
    <text x="568" y="108" class="map-label">Zone 01 · out-of-process tools</text>
    <rect x="944" y="40" width="12" height="12" class="terminal" />
  </g>

  ${routes}
</svg>`;
}

const routeMap = document.querySelector<HTMLElement>("[data-route-map]")!;
routeMap.innerHTML =
  routeMapSvg() +
  STAGES.map(
    (s) => `
  <button class="node" type="button" data-stage="${s.id}"
    data-side="${s.side}" style="left:${(s.x / MAP_W) * 100}%;top:${(s.y / MAP_H) * 100}%"
    aria-pressed="false" aria-label="${s.code} ${s.name}, ${s.kind}">
    <span class="node-pin" aria-hidden="true"><span class="node-ring"></span><span class="node-core"></span></span>
    <span class="node-tag" aria-hidden="true">
      <span class="node-code mono">${s.code} · ${s.grid}</span>
      <span class="node-name">${s.name}</span>
    </span>
  </button>`,
  ).join("");

const dossier = document.querySelector<HTMLElement>("[data-dossier]")!;

function renderDossier(stage: Stage): void {
  const index = STAGES.indexOf(stage);
  const prev = STAGES[(index - 1 + STAGES.length) % STAGES.length];
  const next = STAGES[(index + 1) % STAGES.length];
  const actions = stage.actions
    .map(
      (a) =>
        `<a class="btn mono${a.primary ? " btn--primary" : ""}" href="${a.href}">${a.label}<span class="arrow">→</span></a>`,
    )
    .join("");

  dossier.innerHTML = `
  <div class="dos reg">
    <div class="dos-head">
      <span class="dos-code">${stage.code}</span>
      <span class="dos-meta mono"><span>Stage dossier</span><span>Grid ${stage.grid}</span></span>
    </div>
    <div class="dos-body">
      <p class="dos-kind mono">${stage.kind}</p>
      <h3 class="dos-name">${stage.name}</h3>
      <p class="dos-status mono"><span class="status-dot" aria-hidden="true"></span>${stage.status}</p>
      <p class="dos-summary">${stage.summary}</p>
      <dl class="dos-specs">
        ${stage.specs.map(([k, v]) => `<div><dt class="mono">${k}</dt><dd>${v}</dd></div>`).join("")}
      </dl>
      ${actions ? `<div class="dos-actions">${actions}</div>` : ""}
    </div>
    <div class="dos-nav mono">
      <button type="button" data-stage-step="${prev.id}">◂ ${prev.code}</button>
      <span>${String(index + 1).padStart(2, "0")} / ${String(STAGES.length).padStart(2, "0")}</span>
      <button type="button" data-stage-step="${next.id}">${next.code} ▸</button>
    </div>
  </div>`;
  dossier.classList.remove("is-swapping");
  void dossier.offsetWidth; // restart the scan-in animation for each selection
  dossier.classList.add("is-swapping");
}

function selectStage(id: string): void {
  const stage = STAGES.find((s) => s.id === id)!;
  for (const node of routeMap.querySelectorAll<HTMLButtonElement>(".node")) {
    node.setAttribute("aria-pressed", String(node.dataset.stage === id));
  }
  routeMap.dataset.selected = id;
  for (const wire of routeMap.querySelectorAll<SVGPathElement>("[data-stages]")) {
    wire.classList.toggle("is-lit", wire.dataset.stages!.split(" ").includes(id));
  }
  renderDossier(stage);
}

routeMap.addEventListener("click", (event) => {
  const node = (event.target as Element).closest<HTMLButtonElement>(".node");
  if (node) selectStage(node.dataset.stage!);
});
dossier.addEventListener("click", (event) => {
  const step = (event.target as Element).closest<HTMLButtonElement>("[data-stage-step]");
  if (step) selectStage(step.dataset.stageStep!);
});
routeMap.addEventListener("keydown", (event) => {
  if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
  const current = STAGES.findIndex((s) => s.id === routeMap.dataset.selected);
  const delta = event.key === "ArrowRight" ? 1 : -1;
  const next = STAGES[(current + delta + STAGES.length) % STAGES.length];
  selectStage(next.id);
  routeMap.querySelector<HTMLButtonElement>(`[data-stage="${next.id}"]`)!.focus();
  event.preventDefault();
});
selectStage("tools");

/* ------------------------------------------------------------------ measurements */

document.querySelector("[data-readouts]")!.innerHTML = READOUTS.map(
  (r, i) => `
  <article class="readout-card fade-in" style="--d:${200 + i * 120}">
    <header class="mono"><span class="accent">${r.id}</span><span>${r.context}</span></header>
    <p class="readout-value"><span class="readout-x">×</span>${r.ratio.toFixed(1)}</p>
    <p class="readout-label">${r.label}</p>
    <div class="gauge" aria-hidden="true">
      <span class="gauge-tosu"></span>
      <span class="gauge-vosu" style="--w:${(100 / r.ratio).toFixed(2)}%"></span>
    </div>
    <p class="readout-raw mono">${r.raw}</p>
  </article>`,
).join("");

const SCALE_MAX = 600;
const ticks = [0, 150, 300, 450, 600];
document.querySelector("[data-chart-body]")!.innerHTML = `
  <div class="chart-axis mono" aria-hidden="true">
    ${ticks.map((t) => `<span style="left:${(t / SCALE_MAX) * 100}%">${t}</span>`).join("")}
  </div>
  ${REGULAR_CYCLE.map(
    (row, i) => `
    <div class="chart-row" style="--d:${i * 140}">
      <span class="chart-label mono">${row.label}</span>
      <div class="chart-bars">
        ${ticks.map((t) => `<i class="chart-grid" style="left:${(t / SCALE_MAX) * 100}%"></i>`).join("")}
        <div class="bar bar--tosu" style="--w:${(row.tosu / SCALE_MAX) * 100}%"><span class="mono">${row.tosu.toFixed(1)}</span></div>
        <div class="bar bar--vosu" style="--w:${(row.vosu / SCALE_MAX) * 100}%"><span class="mono">${row.vosu.toFixed(1)}</span></div>
      </div>
      <span class="chart-ratio mono">×${(row.tosu / row.vosu).toFixed(2)}</span>
    </div>`,
  ).join("")}`;
