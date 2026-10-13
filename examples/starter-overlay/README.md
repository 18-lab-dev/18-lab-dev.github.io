# Starter Play HUD

The finished [shiruviaa overlay tutorial](https://shiruviaa.github.io/vosu/dev/tutorial).
A transparent 640 × 220 web overlay with pp, accuracy, combo, all six judgement counts,
latest press/release timing, the great timing window when available, and up to 18 inputs.

## Requirements

Node.js 22.12+ (or 20.19+) and pnpm; a running vosu or tosu daemon with osu! data.
Vite 8.3.4, TypeScript 7.0.2, oxlint 1.87.0 and oxfmt 0.72.0 are pinned.
The example does not use Vitest.

Vite targets ES2026 JavaScript and ES2025 CSS: Lightning CSS does not accept ES2026 yet.
TypeScript uses ESNext for no-emit checking; Vite performs ES2026 lowering.

## Develop

```sh
pnpm install
pnpm dev
```

Open the Vite URL in a browser. The daemon defaults to `127.0.0.1:24050`.
For another listener, append `?daemon=127.0.0.1:24051` to the Vite URL.
Vite's serve-only plugin injects `window.COUNTER_PATH="starter-overlay";` so settings
use the package name. This is not a daemon identity signal: `import.meta.env.DEV`
keeps dev sockets on port 24050 rather than Vite's port. A daemon-hosted build uses
its current origin instead. Both daemons allow local reads from `localhost:5173`
with their default hostname allowlists; this does not grant vosu management access.
The override is a WebSocket host and port, not a URL. Do not use an untrusted server.
Build/install once so the daemon can find the settings schema used during HMR.

## Check and package

```sh
pnpm lint
pnpm format:check
pnpm typecheck
pnpm build
```

`pnpm format` formats the source. `pnpm build` produces `dist/starter-overlay/`,
containing `index.html`, relative `assets/` URLs, and metadata/settings files copied
from `public/`. The installed folder name comes from the unscoped package.json `name`.
Copy the **whole named folder** into the static root; do not rename `dist/` contents.
vosu defaults to `${XDG_DATA_HOME:-$HOME/.local/share}/vosu/static/` on Linux and
`<program>/static/` on Windows. For tosu, use its configured static folder.
If several named outputs share `dist/`, copying `dist/*` installs them all.

Open `http://127.0.0.1:24050/starter-overlay/`. Add that URL as an OBS browser source
at 640 × 220, or as a vosulay overlay. Use the hosted settings page to change the accent
color or hide the keys. The overlay reads settings; it never writes them or calls management APIs.

For the recommended installed-counter development loop, symlink the **named built
folder**, not raw TypeScript. Use an unused mount name:

```sh
pnpm build
mkdir -p "${XDG_DATA_HOME:-$HOME/.local/share}/vosu/static"
ln -s "$PWD/dist/starter-overlay" "${XDG_DATA_HOME:-$HOME/.local/share}/vosu/static/starter-overlay"
pnpm exec vite build --watch
```

Vite's default cleanup empties the target directory without breaking the mount.
Every build copies regular metadata and settings files from `public/`; vosu's ban on
symlinked settings files does not ban this explicit top-level directory mount.
Reload the hosted browser source after build changes: watch builds are not HMR.
Use `pnpm dev` for HMR UI work, and the mounted build for vosu/OBS/vosulay testing.

## Connection behavior

- First attempt: `/websocket/v2/subscribe` with a single array of RFC 6901 pointers.
- Failed upgrade or no initial snapshot: `/websocket/v2` for regular state and
  `/websocket/v2/precise` for upstream tosu's `k1`, `k2`, `m1`, `m2` inputs.
- Initial/update frames reconstruct one fixed-size value array. Removed fields become
  `undefined`. Old revisions are ignored; reconnect resets the revision and values.
- vosu emits an update only when selected values change; changed indices/removals
  directly drive a dirty mask, and only those DOM groups render. No polling or local
  re-diffing is needed for subscribe. The full-stream fallback compares selected JSON
  values structurally and emits the same mask; identical full payloads do not render.
- Reconnect delay grows from 250 ms to 5 s. A reconnect tries vosu again. There are no
  outbound telemetry queues and at most one pending animation frame.
- `keys.all`, `play.pressHitErrors`, `play.releaseHitErrors`, and
  `beatmap.stats.hitWindow` are optional. A present but empty press array is preserved.
  Legacy `play.hitErrorArray` is used only when the press extension is absent.
- `/websocket/commands?l=<encoded counter>` reads `getSettings` and receives
  `getSettings` / `updateSettings` responses. Do not use `/api/ingame` or `__ingame__`.
- Send exactly one subscribe text message. Any later text, including `["ping", nonce]`,
  gets `[2, 5, "subscription already established"]` and close 1008. Keepalive is
  WebSocket control ping/pong, answered by vosu and handled automatically by browsers.

## Source map and credit

`src/connection.ts` owns sockets, pointer decoding, reconstruction, fallback and settings.
`src/main.ts` owns cached DOM references and one-shot rAF rendering.
`src/style.css` owns presentation. `public/` holds package descriptors copied by Vite.

The standalone counter structure and settings/subscription patterns are informed by
[qt715's EZ2ON overlays](https://github.com/qt715/EZ2ON-REBOOT-R-vosu-overlays-recreation).
This example is independently written rather than a copied asset bundle.
