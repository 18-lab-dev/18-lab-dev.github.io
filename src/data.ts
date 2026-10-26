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
    summary:
      "Reads live osu!stable and osu!lazer state and serves the dashboard, counters, and tosu-compatible HTTP and WebSocket APIs from one native Rust daemon. No Node.js, no Electron, no separate .NET runtime.",
    specs: [
      ["Language", "Rust"],
      ["Reads", "osu!stable · osu!lazer"],
      ["Platforms", "Linux · Windows"],
      ["APIs", "gosuMemory v1 · streamCompanion · v2 · precise"],
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
    status: "Active · v1.4.0",
    x: 560,
    y: 150,
    grid: "F2",
    summary:
      "Your tosu-compatible counters, rendered inside osu! itself. Move, scale, crop, and profile overlays in game with a native Rust host and one Chromium Embedded Framework runtime.",
    specs: [
      ["Host", "Rust · CEF"],
      ["Rendering", "Vulkan · OpenGL (EGL / GLX)"],
      ["Display", "Wayland · X11 · Wine"],
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
    id: "starter",
    code: "18-03",
    name: "Starter overlay",
    kind: "Overlay tutorial",
    status: "Guide · 6 steps",
    x: 560,
    y: 430,
    grid: "F4",
    summary:
      "From an empty folder to an overlay that uses vosu features first and falls back to tosu: connect, render a play HUD, use richer fields, declare settings, package.",
    specs: [
      ["Steps", "06"],
      ["Stack", "Vite · TypeScript"],
      ["Backend", "vosu, tosu fallback"],
      ["Transport", "WebSocket v2"],
      ["Licence", "MIT"],
    ],
    actions: [
      { label: "Start step 0", href: "/vosu/dev/tutorial/00-prerequisites.html", primary: true },
      { label: "API reference", href: "/vosu/dev/" },
    ],
  },
  {
    id: "bench",
    code: "18-04",
    name: "Field measurements",
    kind: "Benchmarks vs tosu 4.26.2",
    status: "Published · 2026-10-17",
    x: 840,
    y: 290,
    grid: "I3",
    summary:
      "vosu 1.1.0 measured against the tosu 4.26.2 baseline in live osu!stable and osu!lazer clients on Windows and Linux: readers, daemon CPU, memory, and latency, with their limits stated.",
    specs: [
      ["Baseline", "tosu 4.26.2"],
      ["Build", "vosu 1.1.0 · c791512"],
      ["Clients", "live stable + lazer"],
      ["Host", "Ryzen 9 9950X3D"],
      ["Method", "median of five invocations"],
    ],
    actions: [
      { label: "Read results", href: "/vosu/benchmarks.html", primary: true },
      { label: "Method", href: `${GITHUB}/vosu/blob/main/docs/testing/benchmarks.md` },
    ],
  },
  {
    id: "tools",
    code: "18-05",
    name: "vosu-tools",
    kind: "Official developer tools",
    status: "Open source",
    x: 840,
    y: 440,
    grid: "I4",
    summary: "Official tools for developing and inspecting vosu overlays. Browse the maintained README and tool catalog.",
    specs: [["Catalog", "Official tools"], ["Source", "18-lab-dev/vosu-tools"]],
    actions: [{ label: "Tool catalog", href: `${GITHUB}/vosu-tools#readme`, primary: true }],
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
