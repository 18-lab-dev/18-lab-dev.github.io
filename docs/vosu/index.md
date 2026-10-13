---
title: vosu
description: vosu is a native osu! telemetry daemon written in Rust. It reads osu!stable and osu!lazer and serves a dashboard, counters, and tosu-compatible HTTP and WebSocket APIs.
---

# vosu

vosu reads live state from osu!stable and osu!lazer, then serves the dashboard, counters
(overlays), diagnostic reports, and tosu-compatible HTTP and WebSocket APIs on
`http://127.0.0.1:24050/`. It is one native Rust daemon: no Node.js, Electron, or separately
installed .NET runtime.

Upstream [tosu](https://github.com/tosuapp/tosu) defines the compatibility target, so existing
tosu overlays run unchanged. vosu is not affiliated with the tosu project.

<div class="sh-paths">

<a class="sh-path" href="/vosu/guide/">
  <strong>User guide</strong>
  <span>Install vosu, set it up on Linux or Windows, add overlays to OBS, configure, update, and troubleshoot.</span>
</a>

<a class="sh-path" href="/vosu/dev/">
  <strong>Developer docs</strong>
  <span>Every HTTP and WebSocket endpoint, the v2 schema, vosu-only extensions, and the overlay security boundary.</span>
</a>

<a class="sh-path" href="/vosu/dev/tutorial/">
  <strong>Build an overlay</strong>
  <span>A step-by-step guide from an empty folder to an overlay that uses vosu features first and falls back to tosu.</span>
</a>

</div>

## At a glance

| Area          | Details                                                                                               |
| ------------- | ----------------------------------------------------------------------------------------------------- |
| **Games**     | osu!stable and osu!lazer                                                                              |
| **Platforms** | Linux (osu!lazer verified; osu!stable through Wine is experimental) and Windows                       |
| **APIs**      | gosuMemory v1, streamCompanion, v2, precise v2, plus vosu's selected-field stream                     |
| **Overlays**  | Installed counters, the tosu community catalog, OBS browser sources, and [vosulay](/vosulay/) in game |
| **License**   | MIT OR Apache-2.0                                                                                     |

## Get it

- [Latest release](https://github.com/shiruviaa/vosu/releases/latest): portable ZIPs for Linux and
  Windows, plus `.deb`, `.rpm`, and Arch packages.
- [Install guide](/vosu/guide/install): which download to pick and how to verify it.
- [Source on GitHub](https://github.com/shiruviaa/vosu).
