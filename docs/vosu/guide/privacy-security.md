---
title: Privacy and security
description: Understand vosu's local data, network requests, process permissions, and trusted overlay boundary.
---

# Privacy and security

vosu has no accounts, telemetry, analytics, advertising, or crash reporting. The maintainers operate no servers receiving data from vosu. This does **not** mean vosu never uses the network: the requests below go directly to third-party services, which see ordinary connection metadata including your IP address.

## What vosu reads

vosu reads a same-account osu! process's game state: menus, modes, beatmaps, gameplay statistics and inputs, player/leaderboard names, multiplayer/tournament details, and exposed tournament chat. It serves requested game files, installed overlays, and settings through its API.

Memory access is read-only. vosu does not inject code, write game memory/files, hook input/graphics, or automate gameplay. Automatic lazer offset generation runs embedded helpers against the client's own runtime and assemblies; it does not attach to, pause, or modify the running game. This still assumes a trusted same-account game installation.

## Local access and trusted counters

The default `127.0.0.1:24050` listener serves plain HTTP/WebSocket. Local applications that connect can read its game data. Browser reads are governed by the allowed peer and Origin/Referer policy.

Management actions additionally require exact same-origin browser provenance. That protects against other websites, **not** native programs that forge headers or counters served from vosu's own origin.

::: danger Counters are not sandboxed
Installed counters share the dashboard's management authority. They may read all API data and invoke actions beyond their own settings. Install only counters whose authors and code you trust. Their scripts may load external resources or send data elsewhere; vosu does not review or control them.
:::

Never expose vosu to the internet. Remote access is unencrypted and has no login; see [listener configuration](/vosu/guide/configuration#listener-and-remote-access) and [developer security](/vosu/dev/security) for the full boundary.

## Network requests

| Request                      | When                                                                                   | Destination / sent information                                                                                                                                           |
| ---------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Update check                 | Every startup of a self-updating release install, even with automatic installation off | `api.github.com`, latest shiruviaa/vosu release GET; User-Agent `vosu/<version>`. Debug and externally managed installs do not check.                                    |
| Update archive               | Startup automatic installation or **Update Vosu**                                      | GitHub release download hosts; HTTP GET with the same User-Agent.                                                                                                        |
| Counter catalog              | Open or search **Available**                                                           | `https://tosu.app/api.json`; User-Agent `vosu/<version> (+https://github.com/shiruviaa/vosu)`.                                                                           |
| Counter archive              | Click **Install** or **Update** for a counter                                          | Catalog-provided download host. The privacy policy's 2026-10-10 catalog snapshot uses `osuck.link` redirecting to `files.osuck.link`; hosts may change with the catalog. |
| Catalog previews             | Browser loads Available previews that scroll into view                                 | Catalog image URLs, `raw.githubusercontent.com` in that policy snapshot. Normal browser headers, with no Referer requested by the dashboard.                             |
| Clicked links                | You click repository, author, catalog, or policy links                                 | The linked website.                                                                                                                                                      |
| Counter resources / requests | As determined by a third-party counter                                                 | Hosts chosen by its author; not controlled by vosu.                                                                                                                      |

vosu's own update/catalog/download requests do not include game state, settings, installed-counter lists, or identifiers beyond the request. Catalog comparisons happen locally. Requests use system DNS and ignore system proxy settings. Catalog/archive downloads require HTTPS and cannot redirect to loopback, private, or reserved destinations.

Disable automatic updates to stop startup **installation**, not the update check. Package-managed installs make no update requests. To stop update-check traffic on a self-updating install, the privacy policy recommends blocking `api.github.com` for vosu in your firewall. Avoid Available to avoid vosu's catalog traffic.

## Data kept locally

| Data                                          | Storage                                                                     |
| --------------------------------------------- | --------------------------------------------------------------------------- |
| Configuration                                 | `vosu.toml`                                                                 |
| Counter packages                              | `STATIC_FOLDER_PATH`                                                        |
| Counter values                                | Configuration root's `settings/`                                            |
| Offsets, generator payload, partial downloads | Platform cache root                                                         |
| Rotated logs                                  | Data root's `logs/`; oldest files removed once the folder exceeds 100 MiB   |
| Active update transaction/staging             | `.vosu-update.json` and staging files next to a self-updating executable    |
| Linux start-at-login unit                     | `${XDG_CONFIG_HOME:-$HOME/.config}/systemd/user/vosu.service`, when enabled |
| Pins and last installed/available counts      | Browser local storage for the dashboard origin                              |

See exact [platform paths](/vosu/guide/configuration#file-locations) and [removal steps](/vosu/guide/uninstall). **Download report** generates machine information, config, installed-overlay lists, and recent logs locally and never uploads them. Review before sharing.

## System changes

Linux [setup](/vosu/guide/linux) grants process-reading capabilities and, when eBPF works, the additional backend capabilities. Normal vosu must not run as root. Windows requires no elevation, installs no driver/service, and writes no registry keys. Linux packages do not configure a package repository or systemd service; the dashboard's opt-in login setting creates a per-user unit.

## Report vulnerabilities privately

Use [shiruviaa/vosu's Security tab](https://github.com/shiruviaa/vosu/security) → **Report a vulnerability**. Do not publish exploit details or private data in issues. Only the latest release is supported; obtain it from [GitHub releases](https://github.com/shiruviaa/vosu/releases).

Authoritative sources: [privacy policy](https://github.com/shiruviaa/vosu/blob/main/PRIVACY.md), [security disclosure](https://github.com/shiruviaa/vosu/blob/main/docs/security.md), and [security policy](https://github.com/shiruviaa/vosu/blob/main/SECURITY.md).
