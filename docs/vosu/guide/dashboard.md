---
title: Dashboard
description: Use vosu's installed overlays, community catalog, tray controls, and runtime settings.
---

# Dashboard

Start vosu and open `http://127.0.0.1:24050/` (or your configured listener). The dashboard normally opens automatically; disable **Settings → General → Open dashboard at startup** if you prefer.

## Tray and second launch

The Linux StatusNotifier host or Windows notification area shows a tray icon when available. Choose **Open dashboard** or **Quit**. Headless sessions continue without a tray.

Launching vosu a second time recognizes an existing vosu listener, opens its dashboard, and exits. A different application on the same port does not trigger that handoff: it causes a bind error. See [troubleshooting](/vosu/guide/troubleshooting).

## Installed

Each installed overlay has a live preview, name, version, author, size, and URL.

| Control                       | Action                                                            |
| ----------------------------- | ----------------------------------------------------------------- |
| Preview                       | Open an enlarged live view.                                       |
| Size                          | Copy the declared resolution.                                     |
| URL bar                       | Copy the overlay's OBS URL; Shift-click opens it in a new window. |
| Pin                           | Keep the card above unpinned cards.                               |
| Settings button, when present | Open that counter's settings.                                     |
| Card's **⋯** menu             | Open folder, delete, or move a pin earlier/later.                 |

Pins retain their order in browser local storage. They belong to the dashboard's origin: `localhost`, `127.0.0.1`, and different ports have separate pin lists.

## Available

**Available** lists third-party counters from the tosu catalog. Rows show previews, author links, resolution, intended use, compatible clients, and **Install** or **Update**. Preview arrows browse images; clicking a preview enlarges it.

::: warning Trusted code
Installed overlays run with the dashboard's authority and can invoke management actions. vosu does not review or endorse catalog overlays. Install only trusted counters; read [overlay installation](/vosu/guide/overlays) and [privacy and security](/vosu/guide/privacy-security).
:::

If catalog retrieval fails, Available may show an error while the locally discovered installed count remains available.

## Search

Press `/` outside an editable control to focus search. Installed search filters loaded cards; Available search queries the catalog; Settings search filters options. Counter search matches words against name, author, or compatible clients.

## Settings

The **Settings** page at `/settings` includes General, Game data, Server, and Advanced options. Fields save when they lose focus; checkboxes save when changed. Blank or out-of-range numeric entries are rejected instead of saved. Changing the listener waits for the new address and reconnects the page.

See the complete [configuration reference](/vosu/guide/configuration). **Automatic updates** is disabled with an explanation for externally managed installations; use [package updates](/vosu/guide/updates) instead.

### API keys

<Badge type="tip" text="vosu only" /> **Added in vosu 1.1.0.** Open **Settings → API keys** to create a named credential for trusted sandboxed, remote, or web software. Select one or both permissions:

- **`settings:write`**: command-socket writes and overlay value saves, not package schema edits.
- **`profiles:manage`**: all profile mutations.

Copy the secret immediately: it is **shown only once**. You can rename or revoke a key later, but cannot edit its permissions; revoke and recreate it instead. Revocation immediately closes associated command sockets with code **1008**, even while idle. Key management requires the same-origin dashboard and is not shown in the embedded overlay editor (`embed=1`).

Neither permission grants daemon settings, updates, counter installation/deletion, reports, or key management. Keys persist across restarts; the per-start loopback `broker.json` token remains unchanged for zero-config native brokers.

Treat keys as passwords: never put them in URLs, logs, public pages, or untrusted overlay code. Remote peers still need `ALLOWED_IPS` permission. Plain HTTP/WS on a LAN exposes keys to network observers; keep loopback by default or use a trusted TLS reverse proxy for remote access. See [native HTTP usage](/vosu/dev/http-api#api-keys), [browser WebSocket usage](/vosu/dev/websocket-api#api-key-authentication), and the [security boundary](/vosu/dev/security#api-key-trust-boundary).

Source: [API key contract](https://github.com/shiruviaa/vosu/blob/09341cc/README.md#api-keys).

### Overlay settings

<Badge type="tip" text="vosu only" /> **Added in vosu 1.1.0.** Installed-card settings and `/settings?overlay=<name>&profile=<p>` share named profiles: select, create/copy, rename, delete, or activate a profile globally. This is separate from the daemon's General/Game data/Server/Advanced settings. Existing values remain in reserved `default`; other profiles use schema defaults where values have not been saved.

The overlay editor's search box matches titles, descriptions and IDs while retaining matching section headers. Header navigation jumps to sections; it is hidden for schemas without headers. The inline page is the supported vosulay embedding surface. See [profiles and per-instance pinning](/vosu/guide/overlays#settings-profiles).

### Start at login

On Linux, **Settings → General → Start at login** records the current executable in a marked systemd user unit for the next graphical session. Enabling it does not launch a second daemon now; disabling it does not stop the running daemon. An unrelated `vosu.service` is never overwritten. A service-change failure leaves the saved setting unchanged and displays an error.

This setting is off by default and hidden on Windows. Packages do not enable it automatically. Disable it before [uninstalling](/vosu/guide/uninstall).

Source: [dashboard README](https://github.com/shiruviaa/vosu/blob/main/README.md#dashboard-and-counters) and [settings UI implementation](https://github.com/shiruviaa/vosu/blob/main/src/runtime/render.rs).
