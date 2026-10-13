---
title: "6. Package, install, and test"
description: "Build a self-contained counter folder and test it in a browser, OBS, and vosulay."
---

# 6. Package, install, and test

Add `public/metadata.txt`. The size is the browser viewport, not a responsive layout
promise. Vite copies metadata and both settings schemas from `public/` on every build.

<<< ../../../../examples/starter-overlay/public/metadata.txt{text}

## Check and build

```sh
pnpm install
pnpm lint
pnpm format:check
pnpm typecheck
pnpm build
```

For formatting changes, run `pnpm format`, then re-run the checks.
`dist/starter-overlay/` is the deployable folder: its name comes from `package.json`.
Source TypeScript, tooling configs, and `node_modules/` are not runtime dependencies.

## Install the built folder

Copy the **whole** `dist/starter-overlay/` folder into the daemon's static root.
The output is already correctly named: do not rename `dist/` or add a nested `dist/`
inside the counter.

| Daemon                | Static root                                          |
| --------------------- | ---------------------------------------------------- |
| vosu, Linux default   | `${XDG_DATA_HOME:-$HOME/.local/share}/vosu/static/`  |
| vosu, Windows default | `<program>/static/`                                  |
| tosu                  | Its configured static folder (`STATIC_FOLDER_PATH`). |

For the default vosu Linux root:

```sh
mkdir -p "${XDG_DATA_HOME:-$HOME/.local/share}/vosu/static"
cp -R dist/starter-overlay "${XDG_DATA_HOME:-$HOME/.local/share}/vosu/static/"
```

Each overlay has its own `dist/<package name>/`; rebuilding one clears only its own
output folder, not sibling counter folders. If several built overlays share a
`dist/` directory, install all correctly named folders in one copy:

```sh
cp -R dist/* "${XDG_DATA_HOME:-$HOME/.local/share}/vosu/static/"
```

Open `http://127.0.0.1:24050/starter-overlay/` while the daemon is running. If its
listener is customized, use that host and port. The daemon injects the counter path,
so settings and sockets follow the hosting server.

## Recommended build loop

For ongoing development, build once and symlink the **named output directory**.
Choose this instead of copying, and use an unused mount name; do not overwrite an
existing counter.

```sh
pnpm build
mkdir -p "${XDG_DATA_HOME:-$HOME/.local/share}/vosu/static"
ln -s "$PWD/dist/starter-overlay" "${XDG_DATA_HOME:-$HOME/.local/share}/vosu/static/starter-overlay"
pnpm exec vite build --watch
```

Every `pnpm build` or watch build updates the installed overlay in place, including
regular metadata/settings files copied from `public/`. Default output cleanup stays
enabled: Vite empties the target's contents and keeps the directory, so the existing
directory symlink remains valid. This was verified by rebuilding through a temporary
static mount and checking the target and copied files.

vosu permits a **top-level directory symlink** as an explicit mount, even outside its
static root. It rejects symlinked **settings files**, not regular settings files
inside that mounted directory. Vite's copies are regular files, so this layout is valid.
See [ADR 0005](https://github.com/shiruviaa/vosu/blob/main/docs/decisions/0005-root-confined-file-serving.md),
[settings file checks](https://github.com/shiruviaa/vosu/blob/main/src/counters/settings.rs),
and the [counter package reference](/vosu/dev/counter-packages).

Use `pnpm dev` with HMR for UI work. Use this symlinked build when testing inside vosu,
OBS, or vosulay. Mount **built files**, never source TypeScript; reload the hosted page
after rebuilding because `vite build --watch` is not HMR.

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
