---
title: Tools
description: Install official tools from the dashboard's Tools page, run them with vosux, and build your own.
---

# Tools

A **tool** is an application vosu installs and runs beside your overlays, in its own process. A tool can have a browser UI under `/tools/<id>/`, a supervised background service, and a command line run through `vosux <id>`, in any combination. vosu embeds no tools: the official 18-LAB tools and their SDK live in [vosu-tools](https://github.com/18-lab-dev/vosu-tools), and vosu installs them from its catalog. Tools need vosu 1.2.0 or newer.

## Official tools

| Tool                 | id                | Interfaces       | Purpose                                                                                                                                   |
| -------------------- | ----------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| osu! practice tool   | `practice`        | CLI, UI          | Offline rates, ruleset-specific transforms, trims to chosen sections with cut audio, a playfield preview of the result and named profiles |
| Server pp calculator | `server-pp`       | service, CLI, UI | Reproduce pinned public Akatsuki and Mamestagram calculator snapshots and run user-supplied WebAssembly pp calculators                    |
| Mania ratings        | `mania-ratings`   | service, CLI, UI | Etterna, Quaver, Interlude and dan ratings for osu!mania, per map and per section                                                         |
| Skin studio          | `skin-studio`     | UI               | Browse and preview stable and lazer skins, mix their elements into a new stable skin or `.osk`, and edit skin.ini with checks and backups |
| Map preview          | `map-preview`     | UI               | Follows the game's current map, mods, clock and skin live in all four rulesets                                                            |
| Replay renderer      | `replay-renderer` | CLI, UI          | Deterministic multi-replay studio rendering browser WebM and native MP4                                                                   |
| Beatmap downloader   | `downloader`      | UI               | Context-aware discovery, a read-only stable library and history view, and a polite validated mirror queue                                 |
| Lazer library        | `lazer-library`   | service          | Read-only, consistent osu!lazer library snapshots for map lookup, owned sets, skins and replay files                                      |

[vosulay](/vosulay/) is also available as an optional official tool for in-game overlays. Each tool's details are in the [vosu-tools README](https://github.com/18-lab-dev/vosu-tools#readme).

## Install from the dashboard

1. Open the dashboard at <http://127.0.0.1:24051/> and choose **Tools**.
2. **Available** lists the tools from your catalog sources. Choose **Install**.
3. vosu downloads the package over HTTPS, checks it against the catalog's SHA-256 and size, and installs it atomically, dependencies first.
4. Choose **Open** to use the tool's UI.

The Tools page also updates and uninstalls installed tools. Updating restarts a running service.

Opening a tool from the dashboard grants its UI a write session; opening the same URL directly is read-only.

### Interfaces and services

Cards show each public interface: **UI**, **SERVICE** and **CLI**. A UI or CLI tool's native backend starts on demand and stops after ten idle minutes; it has no separate service controls.

Background services have **Start**, **Stop**, **Restart** and **Start with vosu** in **Details** and **Settings**. The toggle overrides the author's default for your installation, and **Use default** restores it. Server pp, mania ratings and lazer library default to on-demand: enable startup for the services you use. Only enabled, trusted services start at launch, dependencies first, without delaying overlay serving.

### Catalog sources

**Settings → Catalog sources** lets you add, remove, disable and reorder sources: `owner/repo[@tag]` references or HTTPS `catalog.json` URLs. The defaults are exactly `18-lab-dev/vosu-tools` and `18-lab-dev/vosulay`, and both are removable. Earlier sources win duplicate ids; later ones are shown as shadowed.

::: warning Tools are not sandboxed
Tools run with your OS account's permissions. Only tools from the exact default sources `18-lab-dev/vosu-tools` and `18-lab-dev/vosulay` are trusted automatically; tools from any other source, including tagged or HTTPS spellings of those repositories, need approval on the dashboard. Review a tool's author and requested permissions before approving it. User tools go under `<vosu data directory>/tools/<id>/`.
:::

## Run tools from a terminal

`vosux` runs installed tools and manages them from a terminal. Linux distribution packages install `vosux` beside `vosu`. Windows ZIPs keep one executable, so use `vosu x` there, which accepts the same options, or create your own link.

```sh
vosux --list                      # installed tools; add --json for JSON
vosux practice --help             # a tool's own help
vosux --open map-preview          # open a tool's UI
vosux --install <id>
vosux --update <id>
vosux --uninstall <id> --keep-data   # or --remove-data
vosux --autostart <id> on|off|default
vosux --sources                   # configured catalog sources
```

vosu must already be running; `vosux` never starts a second daemon. Options apply only before the tool id, so `vosux practice --help` is the practice tool's help. A UI-only tool opens its UI when run without arguments. Tools inherit the terminal's input and output and return their exit status, without shell expansion.

## Build your own

Start with [Create a tool](https://github.com/18-lab-dev/vosu/blob/main/docs/tools/create-a-tool.md), a guided path from an empty directory to a published catalog. Keep the [authoring reference](https://github.com/18-lab-dev/vosu/blob/main/docs/tools/authoring.md) and [protocol contract](https://github.com/18-lab-dev/vosu/blob/main/docs/tools/protocol.md) nearby. During development, `vosu --tool <directory>` loads a trusted tool straight from a checkout. The Rust SDK is in [vosu-tools](https://github.com/18-lab-dev/vosu-tools).

Source: [vosu README, Tools](https://github.com/18-lab-dev/vosu/blob/main/README.md#tools) and the [vosu-tools README](https://github.com/18-lab-dev/vosu-tools#readme).
