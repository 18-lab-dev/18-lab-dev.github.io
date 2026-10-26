---
title: vosu user guide
description: Install vosu, connect osu!, and use compatible browser overlays.
---

# vosu user guide

vosu is a native Rust daemon that reads live osu! game state and serves a dashboard, counters, and tosu-compatible HTTP and WebSocket APIs. It needs no separately installed Node.js, Electron, or .NET runtime. It reads the game without injecting code, modifying game memory, or automating gameplay.

vosu hosts browser overlays; it does not render them inside osu! itself. For in-game rendering, use [vosulay](/vosulay/). vosu is not affiliated with tosu or ppy.

## Platform support

| Platform | osu!stable                                                                                  | osu!lazer                                                                                                                                                 |
| -------- | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Linux    | Experimental through Wine; **not release-verified**. Wine discovery and native reads exist. | Supported native client. The official executable or AppImage layout must expose `osu!.deps.json`; sandbox policy must permit process discovery and reads. |
| Windows  | Supported 32-bit client.                                                                    | Supported 64-bit client; offsets are resolved for the exact client version.                                                                               |

Run vosu as the same desktop user as osu!, never as root or Administrator. Linux releases require glibc 2.35 or newer, plus the system `libelf.so.1` and `libz.so.1` libraries.

## First steps

1. [Install vosu](/vosu/guide/install) from [GitHub releases](https://github.com/18-lab-dev/vosu/releases).
2. On Linux, follow [process-access setup](/vosu/guide/linux).
3. Start osu! and vosu, then open <http://127.0.0.1:24051/>.
4. Explore the [dashboard](/vosu/guide/dashboard) and [install an overlay](/vosu/guide/overlays).
5. Add its URL to OBS or [vosulay](/vosulay/).
6. Install official [tools](/vosu/guide/tools) such as the practice tool or map preview from the dashboard's **Tools** page.

## Keep it local

Both default listeners are loopback-only. Since vosu 1.1.0, the dashboard and management APIs use port **24051**, while overlays and telemetry remain on **24050**, preserving overlay URLs and browser storage. Installed counters no longer share dashboard management authority, but remain third-party code: install only authors you trust. Tools are not sandboxed either: approve only tools you trust. Read [privacy and security](/vosu/guide/privacy-security) before changing network access.

See [configuration](/vosu/guide/configuration), [updates](/vosu/guide/updates), [troubleshooting](/vosu/guide/troubleshooting), and [uninstall](/vosu/guide/uninstall) for ongoing use.

Source: [vosu README](https://github.com/18-lab-dev/vosu/blob/main/README.md) and [security disclosure](https://github.com/18-lab-dev/vosu/blob/main/docs/security.md).
