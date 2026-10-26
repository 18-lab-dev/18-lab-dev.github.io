import { GITHUB } from "./shell";

export interface Stage {
  id: string;
  code: string;
  name: string;
  kind: string;
  status: string;
  /** Position on the 1000×560 route map. */
  x: number;
  y: number;
  /** Grid reference shown next to the node, matching the map's lettered columns and numbered rows. */
  grid: string;
  /** Side of the node its map label sits on. */
  side: "above" | "below" | "left" | "right";
  summary: string;
  specs: [string, string][];
  actions: { label: string; href: string; primary?: boolean }[];
}

/** In story order: the game feeds vosu, vosu feeds tools (vosulay among them) and overlays, the dashboard manages. */
export const STAGES: Stage[] = [
  {
    id: "vosu",
    code: "18-01",
    name: "vosu",
    kind: "Telemetry daemon",
    status: "Active · v1.2.0",
    x: 300,
    y: 290,
    grid: "D3",
    side: "below",
    summary:
      "Reads osu!stable and osu!lazer as you play, without modifying the game, and hands one consistent live state to every overlay, tool and API. One native Rust daemon: no Node.js, no Electron, no separate .NET runtime.",
    specs: [
      ["Reads", "osu!stable · osu!lazer"],
      ["Platforms", "Linux · Windows"],
      ["APIs", "v1 · stream companion · v2 · v2 precise"],
      ["Listeners", ":24050 overlays + tools · :24051 dashboard"],
      ["Language", "Rust"],
      ["Licence", "MIT OR Apache-2.0"],
    ],
    actions: [
      { label: "Install", href: "/vosu/guide/install.html", primary: true },
      { label: "Docs", href: "/vosu/" },
      { label: "Source", href: `${GITHUB}/vosu` },
    ],
  },
  {
    id: "tools",
    code: "18-02",
    name: "Tools",
    kind: "Official tools · vosu-tools",
    status: "One click from the dashboard",
    x: 620,
    y: 150,
    grid: "G2",
    side: "below",
    summary:
      "Install official tools from the Tools page of vosu's dashboard, one click each. vosu runs them beside the game and hands them its live state: map preview follows the map you have selected, and the pp calculator scores it as you play. vosulay installs the same way.",
    specs: [
      ["Practice", "New rates, trims, transforms"],
      ["Map preview", "Selected map, live, with your skin"],
      ["Server pp", "Server pp for the selected map"],
      ["Mania ratings", "Etterna · Quaver · Interlude · dan"],
      ["Replays", "Rendered to MP4 or WebM"],
      ["Skin studio", "Preview, mix and edit skins"],
      ["Downloader", "Discover and queue beatmaps"],
      ["Lazer library", "Reads your lazer maps, skins, replays"],
    ],
    actions: [
      { label: "Browse vosu-tools", href: `${GITHUB}/vosu-tools`, primary: true },
      { label: "Tools guide", href: "/vosu/guide/tools.html" },
      { label: "Create a tool", href: `${GITHUB}/vosu/blob/main/docs/tools/create-a-tool.md` },
    ],
  },
  {
    id: "vosulay",
    code: "18-03",
    name: "vosulay",
    kind: "In-game overlay manager",
    status: "Active · v1.5.0",
    x: 840,
    y: 150,
    grid: "I2",
    side: "below",
    summary:
      "Your counters, drawn inside osu! itself. Install it from the dashboard's Tools page like any official tool, or run it standalone with vosu or another tosu-compatible backend.",
    specs: [
      ["Runs as", "vosu tool · standalone"],
      ["Host", "Rust · CEF"],
      ["Rendering", "Vulkan · OpenGL (EGL / GLX)"],
      ["Platforms", "Linux · Windows"],
      ["Licence", "MIT"],
    ],
    actions: [
      { label: "Install", href: "/vosulay/install.html", primary: true },
      { label: "Docs", href: "/vosulay/" },
      { label: "Source", href: `${GITHUB}/vosulay` },
    ],
  },
  {
    id: "overlays",
    code: "18-04",
    name: "Overlays",
    kind: "Browser counters",
    status: "On stream · in any browser",
    x: 460,
    y: 430,
    grid: "E4",
    side: "right",
    summary:
      "Counters for your stream load from vosu in OBS or any browser and update with the live game. Existing tosu overlays run unchanged; the tutorial builds your own, using vosu's extra fields first and falling back to tosu.",
    specs: [
      ["Address", "127.0.0.1:24050/&lt;overlay&gt;/"],
      ["Data", "HTTP · WebSocket v2"],
      ["Sources", "Installed · tosu community catalog"],
      ["Tutorial", "6 steps · Vite · TypeScript"],
    ],
    actions: [
      { label: "Build an overlay", href: "/vosu/dev/tutorial/", primary: true },
      { label: "Overlays guide", href: "/vosu/guide/overlays.html" },
      { label: "API", href: "/vosu/dev/" },
    ],
  },
  {
    id: "dashboard",
    code: "18-05",
    name: "Dashboard",
    kind: "Settings and management",
    status: "Separate page · :24051",
    x: 300,
    y: 470,
    grid: "D5",
    side: "left",
    summary:
      "Overlays and tools can use your live data, but installing, approving and changing vosu's settings stay on the dashboard: a separate page their code never runs on. Its Tools page installs, updates and removes tools, starts and stops services, and opens each tool with permission to make changes.",
    specs: [
      ["Address", "127.0.0.1:24051"],
      ["Management", "Dashboard origin · CSRF"],
      ["Tools page", "Install · trust · lifecycle · logs"],
      ["Catalogs", "Ordered sources, editable"],
    ],
    actions: [
      { label: "Dashboard guide", href: "/vosu/guide/dashboard.html", primary: true },
      { label: "Tools guide", href: "/vosu/guide/tools.html" },
    ],
  },
];

export interface BenchRow {
  label: string;
  tosu: number;
  vosu: number;
}

/**
 * Live regular read cycle (µs): medians of five invocation medians against tosu 4.26.2, from vosu's
 * benchmark guide (released tosu comparison). Windows stable is vosu 1.2.0 (2026-10-25); the Linux
 * rows are vosu 1.1.0 (2026-10-17), which the guide retains for 1.2.0. Windows lazer was not measured.
 */
export const REGULAR_CYCLE: BenchRow[] = [
  { label: "Windows stable · 1.2.0", tosu: 566.976, vosu: 157.412 },
  { label: "Linux lazer · 1.1.0", tosu: 147.1, vosu: 20.2 },
  { label: "Linux stable (Wine) · 1.1.0", tosu: 189.6, vosu: 33.7 },
];

export interface Readout {
  id: string;
  ratio: number;
  label: string;
  context: string;
  raw: string;
}

/** Daemon memory and CPU from the same comparison, vosu and tosu running together; ratio is tosu ÷ vosu. */
export const READOUTS: Readout[] = [
  {
    id: "M-01",
    ratio: 266.2 / 29.8,
    label: "Less memory",
    context: "RSS · Linux lazer · 1.1.0",
    raw: "266.2 → 29.8 MB",
  },
  {
    id: "M-02",
    ratio: 143.16 / 48.03,
    label: "Less memory",
    context: "RSS · Windows stable · 1.2.0",
    raw: "143.16 → 48.03 MiB",
  },
  {
    id: "M-03",
    ratio: 2.53 / 0.96,
    label: "Less CPU, overlay polling",
    context: "CPU · 10 Hz API · Linux lazer · 1.1.0",
    raw: "2.53 → 0.96 % of one core",
  },
  {
    id: "M-04",
    ratio: 1.84 / 1.46,
    label: "Narrowest margin",
    context: "CPU · background · Windows stable · 1.2.0",
    raw: "1.84 → 1.46 % of one core",
  },
];
