---
title: Troubleshooting
description: Diagnose listener failures, game readiness, Linux permissions, offsets, catalog failures, and reports.
---

# Troubleshooting

Start with the listener, then authorization, then game access. Run vosu as the same desktop user as osu!, never as root or Administrator. Use the supported combinations in the [platform table](/vosu/guide/).

## Symptoms and next steps

| Symptom                                                              | What to check / do                                                                                                                                                                                                                                                                                                                                                                       |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dashboard does not open                                              | Open `http://127.0.0.1:24051/` manually, or the effective dashboard address discovered by `GET /api/dashboard` on the overlay origin. Check `DASHBOARD_IP`, `DASHBOARD_PORT`, and `OPEN_DASHBOARD_ON_STARTUP` in `vosu.toml`. Startup and successful rebind logs print clickable URLs for both listeners. Old dashboard links on port 24050 redirect with path/query preserved.          |
| Port in use / bind error                                             | A second vosu launch should hand off to an existing vosu instance. Another application on a port is not vosu: free that port or choose a different valid `SERVER_PORT` (overlay/data) or `DASHBOARD_PORT` (dashboard). Update overlay URLs only if the overlay listener changes. A failed rebind retains the preceding effective listener.                                               |
| `500 {"error":"osu is not ready/running"}`                           | The server is responding, but no focused ready instance is published. Check that osu! is running, focus its window, and inspect discovery, permissions, client architecture, paths, and offset resolution. This is not by itself a server failure.                                                                                                                                       |
| Linux `CAP_SYS_PTRACE` warning                                       | Run the exact installed `vosu --setup` as your desktop user, authenticate through polkit, then restart normally. Replacement removes capabilities, so repeat after an update.                                                                                                                                                                                                            |
| Setup authentication fails or never prompts                          | Confirm a trusted `pkexec` and a working graphical or terminal polkit authentication agent are available. Cancellation, failure, or missing trusted tools leaves the executable unchanged; there is no sudo fallback.                                                                                                                                                                    |
| Linux game detected but reads fail                                   | Kernel ptrace policy may block same-user reads. Complete setup; confirm osu! and vosu share the real UID and that sandbox policy allows process access.                                                                                                                                                                                                                                  |
| Linux lazer path not found                                           | The official executable/AppImage layout must expose `osu!.deps.json`. Check the discovered install layout and, if necessary, set `VOSU_OSU_PATH` to its absolute installation path.                                                                                                                                                                                                      |
| Wine stable install not found                                        | Set `VOSU_OSU_PATH` or the `osuconfig/osupath` file described in [Linux setup](/vosu/guide/linux). Wine stable remains experimental and not release-verified.                                                                                                                                                                                                                            |
| Offsets or signatures remain pending                                 | Resolution retries while the process is alive. Pending is not proof of supported-client status. Inspect logs for the exact version and generator errors; see below.                                                                                                                                                                                                                      |
| SmartScreen warns on Windows                                         | Windows executables are unsigned. [Verify the detached release signature](/vosu/guide/install#verify-release-signatures) and the exact fingerprint. Do not run directly from an archive or OneDrive folder.                                                                                                                                                                              |
| Available errors, but Installed works                                | Catalog retrieval is separate from local discovery. Check the named catalog/download host; report upstream catalog outages to [tosu](https://github.com/tosuapp/tosu/issues).                                                                                                                                                                                                            |
| Counter download says it is not a ZIP                                | The host may have returned a text/rate-limit page even with HTTP 200. Inspect the reported host and retry when it is serving the archive. vosu rejects unsafe redirects and invalid archives.                                                                                                                                                                                            |
| Settings writes return 403/401 or a settings socket closes with 1008 | Use vosu's hosted dashboard/settings page, or a valid credential with the required permission. File-origin clients without credentials can read but not save settings. Check [API key scopes/revocation](/vosu/dev/http-api#api-keys) or the [loopback broker token](/vosu/dev/websocket-api#native-broker-credential); forwarded proxy headers do not bypass provenance or peer policy. |
| Edited config seems ignored                                          | Confirm the [platform file location](/vosu/guide/configuration#file-locations), uppercase keys, and correct TOML types. A syntax error during reload keeps the last-good configuration.                                                                                                                                                                                                  |
| Automatic updates is disabled                                        | The executable directory is not user-writable, so vosu considers the install externally managed. [Update it through its installation method](/vosu/guide/updates).                                                                                                                                                                                                                       |

## Offset resolution and generation

For each discovered osu!lazer version, resolution tries a valid `<version>.json` cache entry, matching embedded offsets, then the embedded local generator for that exact PID and version. It never downloads offsets or scans another process. A failed generation does not replace an existing cache entry.

Release executables include the self-contained helper; end users do **not** install .NET, an SDK, or a source checkout. A debug binary without a prepared payload reports a missing-bundle error: use the appropriate [release](https://github.com/18-lab-dev/vosu/releases) for normal use.

Offsets live in:

- Linux: `${XDG_CACHE_HOME:-$HOME/.cache}/vosu/offsets/`.
- Windows: `.cache/offsets/` beside `vosu.exe`.

The helper-payload cache is separately keyed by platform/runtime and embedded checksum. Do not assume a pending resolver establishes support for a new game version.

## Logs and a diagnostic report

Check `logs/` under the platform data root and the effective `vosu.toml`. Use **Settings → Advanced → Debug logging** while investigating, then turn it off when finished.

**Diagnostics report** downloads through an authenticated dashboard fetch and generates a local report with machine information, configuration, installed counters, and recent logs. vosu does not upload it. Review it before sharing: it can contain paths and other personal details. Reports mark truncated log content explicitly.

For ordinary bugs, use [vosu issues](https://github.com/18-lab-dev/vosu/issues) with the platform, game client/version, vosu version, and relevant reviewed diagnostics. For vulnerabilities, use the repository's **Security → Report a vulnerability**, not a public issue.

See also [configuration](/vosu/guide/configuration), [privacy and security](/vosu/guide/privacy-security), and [updates](/vosu/guide/updates).

Sources: [README](https://github.com/18-lab-dev/vosu/blob/main/README.md), [operations runbook](https://github.com/18-lab-dev/vosu/blob/main/docs/operations/runbook.md), and [security policy](https://github.com/18-lab-dev/vosu/blob/main/SECURITY.md).
