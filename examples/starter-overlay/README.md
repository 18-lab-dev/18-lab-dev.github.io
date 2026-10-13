# Starter Play HUD

The finished [shiruviaa overlay tutorial](https://shiruviaa.github.io/vosu/dev/tutorial).
A transparent 640 × 220 web overlay with pp, accuracy, combo, all six judgement counts,
latest press/release timing, the great timing window when available, and up to 18 inputs.

## Requirements

Node.js 22.12+ (or 20.19+) and pnpm; a running vosu or tosu daemon with osu! data.
Vite 8.3.4, TypeScript 7.0.2, oxlint 1.87.0 and oxfmt 0.72.0 are pinned.
The example does not use Vitest.

## Develop

```sh
pnpm install
pnpm dev
```

Open the Vite URL in a browser. The daemon defaults to `127.0.0.1:24050`.
For another listener, append `?daemon=127.0.0.1:24051` to the Vite URL.
When hosted by a daemon, `window.COUNTER_PATH` selects the current origin instead.
The override is a WebSocket host and port, not a URL. Do not point it at an untrusted server.
Settings default to the counter name `starter-overlay` when the daemon has not injected a path.

## Check and package

```sh
pnpm lint
pnpm format:check
pnpm typecheck
pnpm build
```

`pnpm format` formats the source. `pnpm build` produces `dist/index.html`, relative
`assets/` URLs, `metadata.txt`, `settings.schema.toml`, and `settings.json`.
Copy the **contents** of `dist/` into a folder named `starter-overlay` below the daemon's
static root. vosu defaults to `${XDG_DATA_HOME:-$HOME/.local/share}/vosu/static/` on Linux
and `<program>/static/` on Windows. For tosu, use its configured static folder.

Open `http://127.0.0.1:24050/starter-overlay/`. Add that URL as an OBS browser source
at 640 × 220, or as a vosulay overlay. Use the hosted settings page to change the accent
color or hide the keys. The overlay reads settings; it never writes them or calls management APIs.

For vosu live development, build once and symlink the **built folder**, not raw TypeScript,
as a top-level static mount:

```sh
pnpm build
mkdir -p "${XDG_DATA_HOME:-$HOME/.local/share}/vosu/static"
ln -s "$PWD/dist" "${XDG_DATA_HOME:-$HOME/.local/share}/vosu/static/starter-overlay"
pnpm exec vite build --watch --emptyOutDir=false
```

The initial package build copies the schema and metadata; disabling output cleanup
preserves them during watch builds. If those files change, stop the watcher, run
`pnpm build`, and restart it. Reload the hosted browser source after build changes;
this route is not Vite HMR. A separate `pnpm dev` session gives HMR but is not a
daemon-hosted counter.

## Connection behavior

- First attempt: `/websocket/v2/subscribe` with a single array of RFC 6901 pointers.
- Failed upgrade or no initial snapshot: `/websocket/v2` for regular state and
  `/websocket/v2/precise` for upstream tosu's `k1`, `k2`, `m1`, `m2` inputs.
- Initial/update frames reconstruct one fixed-size value array. Removed fields become
  `undefined`. Old revisions are ignored; reconnect resets the revision and values.
- Reconnect delay grows from 250 ms to 5 s. A reconnect tries vosu again. There are no
  outbound telemetry queues and at most one pending animation frame.
- `keys.all`, `play.pressHitErrors`, `play.releaseHitErrors`, and
  `beatmap.stats.hitWindow` are optional. A present but empty press array is preserved.
  Legacy `play.hitErrorArray` is used only when the press extension is absent.
- `/websocket/commands?l=<encoded counter>` reads `getSettings` and receives
  `getSettings` / `updateSettings` responses. Do not use `/api/ingame` or `__ingame__`.
- No application-level ping messages are sent: the published vosu transport treats
  later text messages as a second subscription. WebSocket control ping/pong is automatic.

## Source map and credit

`src/connection.ts` owns sockets, pointer decoding, reconstruction, fallback and settings.
`src/main.ts` owns cached DOM references and one-shot rAF rendering.
`src/style.css` owns presentation. `scripts/package.mjs` copies package descriptors.

The standalone counter structure and settings/subscription patterns are informed by
[qt715's EZ2ON overlays](https://github.com/qt715/EZ2ON-REBOOT-R-vosu-overlays-recreation).
This example is independently written rather than a copied asset bundle.
