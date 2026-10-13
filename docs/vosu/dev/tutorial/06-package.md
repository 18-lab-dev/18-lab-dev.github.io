---
title: "6. Package, install, and test"
description: "Build a self-contained counter folder and test it in a browser, OBS, and vosulay."
---

# 6. Package, install, and test

Add `metadata.txt`. The size is the browser viewport, not a responsive layout promise.

<<< ../../../../examples/starter-overlay/metadata.txt{text}

Add `scripts/package.mjs` so `pnpm build` includes both settings formats and metadata:

<<< ../../../../examples/starter-overlay/scripts/package.mjs{js}

## Check and build

```sh
pnpm install
pnpm lint
pnpm format:check
pnpm typecheck
pnpm build
```

For formatting changes, run `pnpm format`, then re-run the checks. `dist/` contains
the deployable counter. Source TypeScript, tooling configs, and `node_modules/` are
not runtime dependencies and should not go into the installed folder.

## Install the built folder

Copy the **contents** of `dist/` into `starter-overlay/` below the daemon's static root.
Do not install an extra nesting level like `starter-overlay/dist/index.html`.

| Daemon                | Destination                                                                   |
| --------------------- | ----------------------------------------------------------------------------- |
| vosu, Linux default   | `${XDG_DATA_HOME:-$HOME/.local/share}/vosu/static/starter-overlay/`           |
| vosu, Windows default | `<program>/static/starter-overlay/`                                           |
| tosu                  | `starter-overlay/` below its configured static folder (`STATIC_FOLDER_PATH`). |

For the default vosu Linux path:

```sh
mkdir -p "${XDG_DATA_HOME:-$HOME/.local/share}/vosu/static/starter-overlay"
cp -R dist/. "${XDG_DATA_HOME:-$HOME/.local/share}/vosu/static/starter-overlay/"
```

Open `http://127.0.0.1:24050/starter-overlay/` while the daemon is running. If its
listener is customized, use that host and port. The daemon injects the counter path,
so settings and sockets follow the hosting server.

## Live development with a vosu mount

Instead of a copy, use a top-level symlink to the built directory. Choose this **instead
of** the copy above, and use an unused mount name; do not overwrite an existing counter.

```sh
pnpm build
mkdir -p "${XDG_DATA_HOME:-$HOME/.local/share}/vosu/static"
ln -s "$PWD/dist" "${XDG_DATA_HOME:-$HOME/.local/share}/vosu/static/starter-overlay"
pnpm exec vite build --watch --emptyOutDir=false
```

vosu follows explicit top-level directory aliases and confines requests to their target.
Mount **built files**, not source TypeScript. Reload the hosted page after changes;
`vite build --watch` is not HMR. Disabling output cleanup preserves the descriptors
copied by the initial `pnpm build`. If metadata or either schema changes, stop the
watcher, run `pnpm build`, then restart it. Use the separate Vite dev server for HMR.

See [vosu's mount rules](https://github.com/shiruviaa/vosu/blob/main/README.md#dashboard-and-counters)
and the [counter package reference](/vosu/dev/counter-packages).

## Test the actual consumers

1. Browser: check numbers during play, retry, pause, results, and returning to song select.
2. Settings page: change the accent and hide/show keys without reloading the overlay.
3. OBS: add the hosted URL as a browser source at **640 × 220**. Confirm transparency,
   text clarity, key transitions, and that refresh reconnects.
4. [vosulay](/vosulay/getting-started): add the hosted URL as an overlay at the metadata
   size, position it, and check readability over gameplay.
5. Stop and restart the daemon. The status should move through retrying and return to
   live data without accumulating DOM nodes or outbound messages.
6. Repeat with tosu: the status should be `Full v2 fallback`, four compatibility keys
   should work, and missing extension values should remain dashes.

::: info Example verification
The finished project was checked with oxlint 1.87.0, oxfmt 0.72.0, TypeScript 7.0.2,
and Vite 8.3.4. A headless Chromium test against temporary WebSocket mocks exercises
vosu snapshot/update/removal frames and a tosu server that rejects subscribe and serves
regular plus precise v2. That verifies browser rendering and fallback, not real osu!
process capture or OBS/vosulay integration. Run the consumer checklist above on your system.
:::

Keep iterating with [performance](/vosu/dev/performance) and [tooling](/vosu/dev/tooling).
