---
title: Dashboard
description: Use vosu's installed overlays, community catalog, tray controls, and runtime settings.
---

# Dashboard

Start vosu and open <http://127.0.0.1:24051/> (or `DASHBOARD_IP:DASHBOARD_PORT`). In vosu 1.1.0 the trusted dashboard has its own origin; overlays stay on port **24050**, preserving their URLs, localStorage, and IndexedDB. Old dashboard links on the overlay origin redirect with path and query preserved. Integrations discover the effective dashboard origin with `GET /api/dashboard` on the overlay origin.

The dashboard normally opens automatically; disable **Settings → General → Open dashboard at startup** if you prefer. Startup, tray, and second-launch links use the effective dashboard listener. Startup and successful rebind logs print full clickable `http://` URLs for both the overlay/API and dashboard listeners, mapping wildcard binds to loopback.

## Tray and second launch

The Linux StatusNotifier host or Windows notification area shows a tray icon when available. Choose **Open dashboard** or **Quit**. Headless sessions continue without a tray.

Launching vosu a second time recognizes an existing vosu listener, opens its dashboard, and exits. A different application on the same port does not trigger that handoff: it causes a bind error. See [troubleshooting](/vosu/guide/troubleshooting).

## Installed

Each installed overlay has a live preview, name, version, author, size, and URL.

Previews load from the overlay origin and stay at or below their native size; reduced previews show their scale. Installed cards also match against the catalog, so an available update appears without first visiting Available and updates the actual local folder even when renamed. Update actions use a warning colour. Update/delete dialogs identify the folder and show a bounded on-disk size scan; deletion remains available if that scan is incomplete or unavailable.

Per-instance information shows attachment, version, and polling details. Identified live WebSocket connection counts include previews and profile-qualified command sockets, not unique users; unidentified connections are omitted.

| Control                       | Action                                                            |
| ----------------------------- | ----------------------------------------------------------------- |
| Preview                       | Open an enlarged live view.                                       |
| Size                          | Copy the declared resolution.                                     |
| URL bar                       | Copy the overlay's OBS URL; Shift-click opens it in a new window. |
| Pin                           | Keep the card above unpinned cards.                               |
| Settings button, when present | Open that counter's settings.                                     |
| Card's **⋯** menu             | Open folder, delete, or move a pin earlier/later.                 |

Drag pinned cards to reorder them; a visible insertion marker shows the destination. The **Move pin earlier/later** menu actions remain available for keyboard use. Pins retain their order in browser local storage. They belong to the dashboard's origin: `localhost`, `127.0.0.1`, and different ports have separate pin lists. Dashboard storage moves to the new origin in 1.1.0; overlay storage does not.

## Available

**Available** lists third-party counters from the tosu catalog. Rows show previews, author links, resolution, intended use, compatible clients, and **Install** or **Update**. Preview arrows browse images; clicking a preview enlarges it.

The community-overlay notice can be dismissed permanently in this browser. Use the **About** link to reopen it. Preview carousel controls are quieter and display metadata is normalized.

::: warning Trusted code
Installed overlays can read game data and use their existing settings protocol, but no longer share dashboard management authority. They remain third-party code, not a general-purpose sandbox. vosu does not review or endorse catalog overlays. Install only trusted counters; read [overlay installation](/vosu/guide/overlays) and [privacy and security](/vosu/guide/privacy-security).
:::

If catalog retrieval fails, Available may show an error while the locally discovered installed count remains available.

## Search

Press `/` outside an editable control to focus search. Installed search filters loaded cards; Available search queries the catalog; Settings search filters options. Counter search matches words against name, author, or compatible clients.

## Settings

The **Settings** page at `/settings` includes General, Game data, Server, and Advanced options. Non-network fields save when they lose focus; checkboxes save when changed. Blank or out-of-range numeric entries are rejected instead of saved. Intervals show their units.

Network fields (`SERVER_IP`, `SERVER_PORT`, `DASHBOARD_IP`, `DASHBOARD_PORT`, `ALLOWED_IPS`) require **Apply network settings**, then **Keep network settings** from the new dashboard origin within **30 seconds**. Only one change can be pending. Without confirmation, the server restores the previous network fields and listeners even if the page closes. Keep succeeds only when both effective listeners match the requested targets. Other settings continue autosaving.

Allowlist entries appear one per line. IPv4/IPv6 CIDRs are supported; use **`100.64.0.0/10`** for Tailscale, not `100.*.*.*`, which also covers public addresses. The UI warns about public-space CIDRs, `0.0.0.0/0`, `::/0`, and broad wildcards.

**Diagnostics report** downloads a local report through an authenticated fetch. Review it before sharing; it can include machine details, configuration, counters, and logs, and is never uploaded automatically.

See the complete [configuration reference](/vosu/guide/configuration). **Automatic updates** is disabled with an explanation for externally managed installations; use [package updates](/vosu/guide/updates) instead.

### API keys

<Badge type="tip" text="vosu only" /> **Added in vosu 1.1.0.** Open **Settings → API keys** to create a named credential for trusted sandboxed, remote, or web software. Select one or both permissions:

- **`settings:write`**: command-socket writes and overlay value saves, not package schema edits.
- **`profiles:manage`**: all profile mutations.

API keys use the same groups and rows as runtime settings, with compact permission dialogs and per-key **⋯** actions. Copy the secret from the copyable **show-once** dialog immediately: it cannot be recovered later. You can rename or revoke a key, but cannot edit its permissions; revoke and recreate it instead. Revocation immediately closes associated command sockets with code **1008**, even while idle. Key management requires dashboard-origin provenance and the per-start `X-Vosu-CSRF` token.

Neither permission grants daemon settings, updates, counter installation/deletion, reports, or key management. Keys persist across restarts; the per-start loopback `broker.json` token supports zero-config native brokers, including HTTP value saves and profile actions, but not schema saves or management.

Treat keys as passwords: never put them in URLs, logs, public pages, or untrusted overlay code. Remote peers still need `ALLOWED_IPS` permission. Plain HTTP/WS on a LAN exposes keys to network observers; keep loopback by default or use a trusted TLS reverse proxy for remote access. See [native HTTP usage](/vosu/dev/http-api#api-keys), [browser WebSocket usage](/vosu/dev/websocket-api#api-key-authentication), and the [security boundary](/vosu/dev/security#api-key-trust-boundary).

Source: [API key contract](https://github.com/18-lab-dev/vosu/blob/d0851c8/README.md#api-keys).

### Overlay settings

<Badge type="tip" text="vosu only" /> **Added in vosu 1.1.0.** Installed-card settings and `/settings?overlay=<name>&profile=<p>` share a profile dropdown and **⋯** menu with **Create**, **Copy**, **Rename**, **Delete**, and **Set as default** (API action `activate`). The dropdown marks the profile used by unpinned overlays with `(default)`; the reserved `default` profile needs no suffix. Naming and delete confirmation use in-app dialogs. This is separate from the daemon's General/Game data/Server/Advanced settings. Existing values remain in reserved `default`; other profiles use schema defaults where values have not been saved.

The overlay editor's search box matches titles, descriptions and IDs while retaining matching section headers. Header navigation jumps to sections; it is hidden for schemas without headers. Dashboard pages forbid framing and send no parent-window notifications. Native editors such as vosulay use the settings and profiles HTTP API through their Rust host. See [profiles and per-instance pinning](/vosu/guide/overlays#settings-profiles) and the [HTTP contract](/vosu/dev/http-api#settings-profiles).

### Start at login

On Linux, **Settings → General → Start at login** records the current executable in a marked systemd user unit for the next graphical session. Enabling it does not launch a second daemon now; disabling it does not stop the running daemon. An unrelated `vosu.service` is never overwritten. A service-change failure leaves the saved setting unchanged and displays an error.

This setting is off by default and hidden on Windows. Packages do not enable it automatically. Disable it before [uninstalling](/vosu/guide/uninstall).

Sources: [vosu 1.1.0 origin decision](https://github.com/18-lab-dev/vosu/blob/d0851c8/docs/decisions/0016-separate-dashboard-origin.md), [1.1.0 release changes](https://github.com/18-lab-dev/vosu/blob/d0851c8/CHANGELOG.md#110--2026-10-17), and [operations runbook](https://github.com/18-lab-dev/vosu/blob/d0851c8/docs/operations/runbook.md).
