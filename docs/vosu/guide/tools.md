---
title: Tools
description: Install official tools from the dashboard's Tools page, run them with vosux, and build your own.
---

# Tools

A **tool** is an application vosu installs and runs beside your overlays, in its own process. A tool can have a browser UI under `/tools/<id>/`, a supervised background service, and a command line run through `vosux <id>`, in any combination. vosu embeds no tools: the official 18-LAB tools and their SDK live in [vosu-tools](https://github.com/18-lab-dev/vosu-tools), and vosu installs them from its catalog. Tools need vosu 1.2.0 or newer.

## Official tools

| Tool                 | id                | Interfaces       | Purpose                                                                                                                                                                         |
| -------------------- | ----------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| osu! practice tool   | `practice`        | CLI, UI          | Offline rates, ruleset-specific transforms, trims to chosen sections with cut audio, a playfield preview of the result and named profiles                                       |
| Server pp calculator | `server-pp`       | service, CLI, UI | Reproduce pinned public Akatsuki and Mamestagram calculator snapshots and run user-supplied WebAssembly pp calculators                                                          |
| Map analysis         | `map-analysis`    | service, CLI, UI | Official stars, skills and accuracy-target pp for the selected map in all four rulesets at the played mods and rate, section timelines, and Etterna, Quaver, Interlude, Prism and dan ratings for osu!mania |
| Skin studio          | `skin-studio`     | UI               | Browse and preview stable and lazer skins, mix their elements into a new skin or `.osk`, edit osu!mania key counts with calibration from your last play, and edit skin.ini with checks and backups |
| Map preview          | `map-preview`     | UI               | Follows the game's current map, mods, clock and skin live in all four rulesets                                                                                                  |
| Replay renderer      | `replay-renderer` | CLI, UI          | Deterministic multi-replay studio rendering browser WebM and native MP4                                                                                                         |
| Beatmap downloader   | `downloader`      | UI               | Context-aware discovery, a read-only stable library and history view, and a polite validated mirror queue                                                                       |
| Lazer library        | `lazer-library`   | service          | Read-only, consistent osu!lazer library snapshots for map lookup, owned sets, skins and replay files                                                                            |

[vosulay](/vosulay/) is also available as an optional official tool for in-game overlays. Each tool's details are in the [vosu-tools README](https://github.com/18-lab-dev/vosu-tools#readme). Map analysis replaced **Mania ratings** (`mania-ratings`) in vosu-tools 0.4.0; see [renamed tools](#renamed-tools).

## Install from the dashboard

1. Open the dashboard at <http://127.0.0.1:24051/> and choose **Tools**.
2. **Available** lists the tools from your catalog sources, with each tool's icon and banner. Choose **Install**.
3. vosu downloads the package over HTTPS, checks it against the catalog's SHA-256 and size, and installs it atomically, dependencies first.
4. Choose **Open** to use the tool's UI.

The Tools page also updates and uninstalls installed tools. Updating restarts a running service.

Opening a tool from the dashboard grants its UI a write session; opening the same URL directly is read-only.

Since vosu 1.2.1, the dashboard loads catalog card art through vosu itself, because release downloads serve SVG art as a generic download that browsers do not display. vosu fetches only art URLs that the loaded catalog lists, over HTTPS to public hosts, at most 1 MiB, and serves it inert, so an opened SVG cannot run script on the dashboard.

### Renamed tools

A catalog can declare that a tool replaces a former tool ID. On vosu **1.2.2** or newer, the former tool's card offers **Update to…** the new tool, as does `vosux --update <old-id>` in a terminal. The update moves the tool's data, settings and cache to the new ID and keeps your trust, enabled and **Start with vosu** choices; a running service restarts under the new ID. The former ID and its `/tools/<old-id>/` address stop existing. Tools that require the former ID are still satisfied by its replacement, but requests to the old address are not redirected.

Only trusted tools installed from a catalog migrate, and only to a replacement from that same catalog source; manual installations and `vosu --tool` development tools never do. The update overwrites nothing: if the new tool's directory, data, settings or cache already exist, it stops with an error and leaves them for you to resolve. An interrupted migration finishes the next time vosu starts.

On vosu 1.2.0 and 1.2.1 there is no migration: install Map analysis as a new tool. Mania ratings keeps working without further updates, but its data and settings are not carried over. See [catalog identity updates](https://github.com/18-lab-dev/vosu/blob/v1.2.2/docs/tools/catalog.md).

### Interfaces and services

Cards show each public interface: **UI**, **SERVICE** and **CLI**. A UI or CLI tool's native backend starts on demand and stops after ten idle minutes; it has no separate service controls.

Background services have **Start**, **Stop**, **Restart** and **Start with vosu** in **Details** and **Settings**. The toggle overrides the author's default for your installation, and **Use default** restores it. Server pp, map analysis and lazer library default to on-demand: enable startup for the services you use. Only enabled, trusted services start at launch, dependencies first, without delaying overlay serving.

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
vosux --update <id>               # also migrates a renamed tool: vosux --update mania-ratings
vosux --uninstall <id> --keep-data   # or --remove-data
vosux --autostart <id> on|off|default
vosux --sources                   # configured catalog sources
```

vosu must already be running; `vosux` never starts a second daemon. Options apply only before the tool id, so `vosux practice --help` is the practice tool's help. A UI-only tool opens its UI when run without arguments. Tools inherit the terminal's input and output and return their exit status, without shell expansion.

## Build your own

Start with [Create a tool](https://github.com/18-lab-dev/vosu/blob/main/docs/tools/create-a-tool.md), a guided path from an empty directory to a published catalog. Keep the [authoring reference](https://github.com/18-lab-dev/vosu/blob/main/docs/tools/authoring.md) and [protocol contract](https://github.com/18-lab-dev/vosu/blob/main/docs/tools/protocol.md) nearby. During development, `vosu --tool <directory>` loads a trusted tool straight from a checkout. The Rust SDK is in [vosu-tools](https://github.com/18-lab-dev/vosu-tools).

Source: [vosu README, Tools](https://github.com/18-lab-dev/vosu/blob/main/README.md#tools) and the [vosu-tools README](https://github.com/18-lab-dev/vosu-tools#readme).
