---
title: "Build a compatible overlay"
description: "Build a TypeScript play HUD with vosu subscriptions and a tosu fallback."
---

# Build a compatible overlay

An overlay is a web page that displays live osu! data. OBS loads it as a browser source;
vosulay loads it inside osu!; a regular browser is useful while developing. The daemon
serves the installed page and its API, normally on port **24050**.

This tutorial builds one 640 × 220 HUD: pp, accuracy, combo, judgement counts, timing,
and a key strip. It uses vosu's selected-field subscription first, then falls back to
tosu-compatible full streams. It does not require a framework.

## Follow the steps

| Step                                                        | What you build                                         |
| ----------------------------------------------------------- | ------------------------------------------------------ |
| [0. Prerequisites](/vosu/dev/tutorial/00-prerequisites)     | The browser concepts and tools you need                |
| [1. Project setup](/vosu/dev/tutorial/01-project)           | Vite, TypeScript, Oxc, and the counter layout          |
| [2. Connect](/vosu/dev/tutorial/02-connect)                 | Subscriptions, reconstruction, fallback, and reconnect |
| [3. Render a HUD](/vosu/dev/tutorial/03-render)             | Cached DOM references and one-shot rAF batching        |
| [4. Optional vosu fields](/vosu/dev/tutorial/04-extensions) | All inputs, separate timing events, and hit windows    |
| [5. Settings](/vosu/dev/tutorial/05-settings)               | One schema per server and a read-only settings channel |
| [6. Package and test](/vosu/dev/tutorial/06-package)        | A deployable folder for OBS and vosulay                |

The finished project is [`examples/starter-overlay`](https://github.com/shiruviaa/shiruviaa.github.io/tree/main/examples/starter-overlay).
Code includes in these pages come directly from that project, not a second implementation.

## Real-world reference

[qt715's EZ2ON overlays](https://github.com/qt715/EZ2ON-REBOOT-R-vosu-overlays-recreation)
show standalone counter folders, selected-field subscriptions, settings, and focused UI
modules. Their shared [`vosu.js`](https://github.com/qt715/EZ2ON-REBOOT-R-vosu-overlays-recreation/blob/main/ez2on-play-info/js/vosu.js)
provided useful connection/reconstruction and settings patterns. The published module
is vosu-specific: it retries the subscribe endpoint rather than implementing a tosu
fallback. This tutorial's independent client adds that fallback; no fonts or visual
assets from the reference are bundled.

Go deeper with [performance](/vosu/dev/performance), [tooling](/vosu/dev/tooling),
and the [developer API reference](/vosu/dev/).
