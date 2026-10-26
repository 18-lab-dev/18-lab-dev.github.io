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
      "Discovers running osu!stable and osu!lazer clients, reads their memory without modifying them, and publishes each state as one atomic snapshot to every API. One native Rust daemon: no Node.js, no Electron, no separate .NET runtime.",
    specs: [
      ["Language", "Rust"],
      ["Reads", "osu!stable · osu!lazer"],
      ["Platforms", "Linux · Windows"],
      ["APIs", "v1 · stream companion · v2 · v2 precise"],
      ["Licence", "MIT OR Apache-2.0"],
    ],
    actions: [
      { label: "Install", href: "/vosu/guide/install.html", primary: true },
      { label: "Docs", href: "/vosu/" },
      { label: "Source", href: `${GITHUB}/vosu` },
    ],
  },
  {
    id: "vosulay",
    code: "18-02",
    name: "vosulay",
    kind: "In-game overlay manager",
    status: "Active · v1.5.0",
    x: 840,
    y: 150,
    grid: "I2",
    side: "below",
    summary:
      "Renders your counters inside osu! itself. Install it as an optional official vosu tool, supervised by vosu and opened from its dashboard, or run it standalone with vosu or another tosu-compatible backend.",
    specs: [
      ["Host", "Rust · CEF"],
      ["Runs as", "vosu tool · standalone"],
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
    code: "18-03",
    name: "Overlays",
    kind: "Browser counters",
    status: "Overlay listener · :24050",
    x: 460,
    y: 430,
    grid: "E4",
    side: "right",
    summary:
      "Counters load from the overlay listener and read live state over HTTP and WebSocket, in OBS or any browser. Existing tosu overlays run unchanged; the tutorial builds one that uses vosu features first and falls back to tosu.",
    specs: [
      ["Address", "127.0.0.1:24050"],
      ["URL", "/&lt;overlay&gt;/"],
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
    id: "tools",
    code: "18-04",
    name: "Tools",
    kind: "Out-of-process applications",
    status: "Hosted under /tools/",
    x: 620,
    y: 150,
    grid: "G2",
    side: "below",
    summary:
      "Applications in any language that vosu installs from catalogs, supervises and serves next to overlays: a browser UI, a background service, a terminal command through vosux, or any mix. Tools can call the tools they depend on, so shared work runs once.",
    specs: [
      ["Manifest", "tool.toml"],
      ["Interfaces", "UI · service · CLI"],
      ["Served at", "/tools/&lt;id&gt;/"],
      ["Official", "18-lab-dev/vosu-tools"],
      ["Sandbox", "None · your OS account"],
    ],
    actions: [
      { label: "Tools guide", href: "/vosu/guide/tools.html", primary: true },
      { label: "Create a tool", href: `${GITHUB}/vosu/blob/main/docs/tools/create-a-tool.md` },
      { label: "vosu-tools", href: `${GITHUB}/vosu-tools` },
    ],
  },
  {
    id: "dashboard",
    code: "18-05",
    name: "Dashboard",
    kind: "Trusted management origin",
    status: "Dashboard listener · :24051",
    x: 300,
    y: 470,
    grid: "D5",
    side: "left",
    summary:
      "Management lives on its own listener, where overlay scripts never run. Its Tools page installs, updates and removes tools, approves user tools, starts and stops services, and opens tool UIs with write access.",
    specs: [
      ["Address", "127.0.0.1:24051"],
      ["Writes", "Dashboard origin · CSRF"],
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

/** Regular read cycle (µs), median of five live invocations; vosu 1.1.0 vs tosu 4.26.2. */
export const REGULAR_CYCLE: BenchRow[] = [
  { label: "Windows · lazer", tosu: 737.0, vosu: 148.0 },
  { label: "Windows · stable", tosu: 456.2, vosu: 132.7 },
  { label: "Linux · lazer", tosu: 147.1, vosu: 20.2 },
  { label: "Linux · stable (Wine)", tosu: 189.6, vosu: 33.7 },
];

export interface Readout {
  id: string;
  ratio: number;
  label: string;
  context: string;
  raw: string;
}

export const READOUTS: Readout[] = [
  {
    id: "M-01",
    ratio: 3972 / 61,
    label: "Faster attach",
    context: "Reader setup · Linux lazer",
    raw: "3972 → 61 ms",
  },
  {
    id: "M-02",
    ratio: 266.2 / 29.8,
    label: "Less resident memory",
    context: "Daemon RSS · Linux lazer",
    raw: "266.2 → 29.8 MB",
  },
  {
    id: "M-03",
    ratio: 78.6 / 7.1,
    label: "Less private memory",
    context: "Daemon · Windows lazer",
    raw: "78.6 → 7.1 MB",
  },
  {
    id: "M-04",
    ratio: 40.7 / 23.9,
    label: "Narrowest margin",
    context: "Precise cycle · Windows stable",
    raw: "40.7 → 23.9 µs",
  },
];
