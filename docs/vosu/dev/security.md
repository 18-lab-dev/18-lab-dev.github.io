---
title: Overlay security
description: Understand the separate dashboard origin, management authority, and safe settings paths.
---

# Overlay security

## Separate dashboard origin in vosu 1.1.0

Installed counters stay at `http://127.0.0.1:24050` (`SERVER_IP:SERVER_PORT`), preserving URLs, localStorage, and IndexedDB. Trusted dashboard pages and management APIs move to `http://127.0.0.1:24051` (`DASHBOARD_IP:DASHBOARD_PORT`). The dashboard never serves overlay scripts or static files; previews use the overlay origin.

[ADR 0016](https://github.com/18-lab-dev/vosu/blob/d0851c8/docs/decisions/0016-separate-dashboard-origin.md) supersedes ADR 0013's shared-origin decision. Installed overlays no longer have dashboard management authority. This is browser-origin separation, not a general-purpose sandbox: overlays retain game-data reads and their settings command protocol, and third-party code can make external requests.

Old overlay-origin dashboard page links redirect with HTTP 302, preserving path and query. `GET /api/dashboard` on the overlay origin publishes the effective dashboard origin. Redirect authorities use the effective listener rather than arbitrary Host headers; wildcard binds map to loopback for local discovery.

## Do not cross the management boundary

::: danger Developer responsibility
Do not attempt dashboard management operations from an overlay. Overlay-origin browser management mutations return **403**, even with matching overlay provenance. Rendering a counter is not justification to install/delete code, change the daemon, collect diagnostics, or write another counter's settings.
:::

| Management surface <Badge type="warning" text="management" />    | Why an overlay should not invoke it                                                          |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `POST /api/settingsSave`                                         | Changes daemon configuration, listener, and sampling behavior                                |
| `POST /api/runUpdates`                                           | Starts binary update/replacement                                                             |
| `POST /api/counters/download/{url}`                              | Installs or replaces executable browser code                                                 |
| `POST /api/counters/delete/{name}`                               | Deletes a counter or its mount                                                               |
| `POST /api/counters/open/{name}`, `POST /api/counters/open-root` | Opens host filesystem locations                                                              |
| Writes to `/api/counters/settings/{name}` for **other counters** | Modifies another counter's user values or schema                                             |
| `saveSettings` targeting **other counters**                      | Changes persisted settings; the connection `l` is the save namespace, not the payload's name |
| `POST /api/generateReport`                                       | Captures machine/configuration/log diagnostics that may contain private information          |

These HTTP management operations live on the dashboard origin and require its provenance plus CSRF token. Explicitly scoped API keys and the loopback native broker credential retain only their documented overlay-origin value/profile exceptions. The existing command-socket settings protocol is unchanged; technical access to unrelated settings is not a user authorization to change them.

## What to use instead

- Read-only state: `/json/v2`, `/json/v2/precise`, and matching [WebSocket streams](/vosu/dev/websocket-api); prefer selected-field subscriptions where supported.
- Your **own** settings read: `GET /api/counters/settings/<name>` or `getSettings` on a socket whose `l` matches your counter.
- User edits: link the hosted **`/settings?overlay=<name>`** page on the discovered dashboard origin. URL-encode the name; old overlay-origin settings links redirect. vosulay uses the local broker credential below so counters running in game can save their own settings.
- Per-counter package schema and values: [counter settings](/vosu/dev/counter-packages), not a shared in-game namespace.

Hosted counters that intentionally implement their own settings UI may use the existing own-counter settings protocol. This does not grant daemon or dashboard management authority.

## What the checks actually protect

Read authorization uses the configured trusted-peer/network and Origin/Referer policy; headerless and opaque/file-origin reads remain possible for trusted peers. Dashboard mutations require trusted peers, the dashboard's **exact scheme, host, and port**, and a per-start random **`X-Vosu-CSRF`** token injected only into dashboard pages. `Origin` is authoritative; only if absent may `Referer` supply provenance. Missing, malformed, duplicate, or `null` provenance does not authorize writes. Provenance/CSRF rejections return 403. Scoped API keys and the loopback native broker credential retain their specific overlay-origin value/profile grants.

`saveSettings` uses provenance captured at WebSocket upgrade, a valid local broker credential on `/websocket/commands`, or an API key with `settings:write`, and closes 1008 before saving/relaying when none authorizes the write. Reads (`getSettings`), echo replies (`updateSettings`), and own-socket filters (`applyFilters`) remain available without write provenance.

Dashboard requests also check Host against the effective safe origin and reject all WebSocket upgrades. Dashboard HTML uses same-origin-script CSP, inert JSON runtime context, and `X-Content-Type-Options: nosniff`. Every dashboard page sends `frame-ancestors 'none'`; no query parameter enables framing. Native editors use the settings/profile HTTP API through their host, not framed dashboard pages or parent-window notifications.

Native same-account clients can read dashboard pages and forge browser provenance. This boundary isolates installed browser overlays, **not malicious local programs**. Forwarded headers are not trusted; an HTTPS reverse-proxy origin is not automatically a same-origin exception. CORS headers are not a management grant.

Keep loopback binding and normal-user execution. Root-confined file serving, escaped reports, bounded requests, HTTPS download checks, and ZIP safety checks reduce particular risks; they do not sandbox counter JavaScript or provide a global resource budget.

## API key trust boundary

<Badge type="tip" text="vosu only" /> **Added in vosu 1.1.0.** Named, revocable API keys authorize trusted sandboxed, remote, or web clients without giving them full dashboard authority. Create them through [Settings → API keys](/vosu/guide/dashboard#api-keys); the secret is shown once. Names can change; scopes cannot (revoke and recreate).

- `settings:write` grants command-socket writes and HTTP overlay value saves, never `?update=yes` schema saves.
- `profiles:manage` grants all profile mutations.
- Neither grants updates, counter installation/deletion, reports, daemon settings, or key management. Key management, including metadata listing, requires dashboard-origin provenance and the dashboard's per-start CSRF token.

Native clients present Bearer headers for [HTTP](/vosu/dev/http-api#api-keys) or command WebSocket upgrades. Browser WebSockets offer `vosu.key` and `vosu.key.<key>`; only `vosu.key` is echoed. **Never put keys in query strings**: no URL parameter authenticates them. Cross-origin browser HTTP is not supported; CORS does not allow Authorization. Invalid/revoked keys and insufficient scopes return 401.

Remote peers still need `ALLOWED_IPS` permission. A key never bypasses the peer gate, and forwarded headers do not change that policy. **Plain HTTP/WS on a LAN exposes credentials to network observers**: keep loopback by default and use a trusted TLS reverse proxy for remote access. Treat keys as passwords; keep them out of logs, public pages, and untrusted overlay code.

Revocation immediately closes associated command sockets with **1008**, even while idle, preventing further settings relays. HTTP POSTs re-check scope after body receipt and before dispatch, preventing mutations whose uploads finish after revocation.

Keys persist across restarts. Config-root `api-keys.toml` stores SHA-256 hashes and metadata, not recoverable secrets. Unix files are created 0600 and atomically replaced; unsafe ownership or group/world access warns without disabling otherwise valid keys. Windows inherits directory ACLs: protect the directory and its parents. Malformed/unreadable registries disable keys with a warning without stopping vosu or overwriting the file; back it up before an explicit key-management change replaces it.

The per-start loopback `broker.json` token below keeps zero-config native broker integration on the overlay origin. It authorizes command-socket writes and HTTP value saves/profile actions, not schema saves or general management. Scoped API-key settings/profile writes also remain on that origin.

Sources: [ADR 0016](https://github.com/18-lab-dev/vosu/blob/d0851c8/docs/decisions/0016-separate-dashboard-origin.md), [API key contract](https://github.com/18-lab-dev/vosu/blob/d0851c8/README.md#api-keys), [network exposure](https://github.com/18-lab-dev/vosu/blob/d0851c8/docs/security.md#network-exposure), and [operations runbook](https://github.com/18-lab-dev/vosu/blob/d0851c8/docs/operations/runbook.md).

## Local broker trust boundary

vosu rotates a private `broker.json` credential each start. On Linux it lives at `$XDG_RUNTIME_DIR/vosu/broker.json`, falling back to `${XDG_CONFIG_HOME:-$HOME/.config}/vosu/broker.json` when `XDG_RUNTIME_DIR` is unset or empty; directory/file modes are 0700/0600. On Windows it lives at `%LOCALAPPDATA%\vosu\broker.json`, not next to the executable.

Native brokers such as vosulay send `Authorization: Bearer <token>` to the file's loopback origin for `/websocket/commands` upgrades, HTTP settings value saves (`POST /api/counters/settings/<name>[?profile=<name>]`), and profile actions (`POST /api/counters/profiles`). HTTP grants are exactly `settings:write` and `profiles:manage`; schema saves (`?update=yes`) and management remain forbidden. Authorization is rechecked after each POST body is read. Invalid, stale, wrong-scope or non-loopback credentials return 401 even when provenance would permit the write. Bearer is case-insensitive; other authorization schemes are ignored. No token preserves existing behavior.

The published origin uses the listener's actual port and maps wildcard `0.0.0.0` to `127.0.0.1` and `::` to `[::1]`; specific binds remain unchanged. Successful rebinds update it, but the credential still authenticates only loopback peers. vosu never deletes `broker.json`: after shutdown its token is stale and authenticates nothing; the next start atomically replaces the file. On 401, reread it and retry once, then fall back to existing read-only behavior. See the [broker contract](/vosu/dev/websocket-api#native-broker-credential).

Any same-account process that can read this file can write counter settings and invoke other same-origin command-socket mutations. This makes native-client trust explicit, rather than solving the existing ability to forge Origin. Keep the token out of page JavaScript and logs. The broker must authorize its own inbound counter-frame Origin/Host and session secret before forwarding requests.

**Windows residual risk:** the file inherits its directory's ACL. A pre-existing `%LOCALAPPDATA%\vosu` directory or its parents with broad inheritable permissions can expose the token to other accounts. vosu does not reset those ACLs; protect the directory and its parents. LocalAppData placement alone is not a security guarantee, and administrators or other principals already entitled to read remain trusted.

Sources: [broker integration contract](https://github.com/18-lab-dev/vosu/blob/main/README.md#native-overlay-brokers), [network exposure and ACL limits](https://github.com/18-lab-dev/vosu/blob/main/docs/security.md#network-exposure), [ADR 0013 amendment](https://github.com/18-lab-dev/vosu/blob/main/docs/decisions/0013-counters-share-dashboard-origin.md#native-broker-authentication-2026-10-16-amendment).

## Removed in-game endpoint <Badge type="danger" text="deprecated" />

Upstream tosu has `/api/ingame`, its embedded in-game overlay page, and dedicated `__ingame__` settings. vosu removed that surface in [ADR 0008](https://github.com/18-lab-dev/vosu/blob/main/docs/decisions/0008-external-in-game-overlays.md). Its [router](https://github.com/18-lab-dev/vosu/blob/main/src/server/routes.rs) reserves unknown `/api/` paths and returns **404** for `/api/ingame`; it cannot fall through to counter HTML.

Overlays must not depend on `/api/ingame` or `__ingame__`, and should never have used that in-game product surface to manage even their own settings or configuration. In-game rendering is [vosulay's](/vosulay/) job. Store each counter's settings using the counter settings mechanism; external renderers own their UI and persistence.

Sources: [management authorization README](https://github.com/18-lab-dev/vosu/blob/main/README.md#pages-counters-reports-and-updates), [runbook security](https://github.com/18-lab-dev/vosu/blob/main/docs/operations/runbook.md#security-hardening-and-remaining-trust), [privacy policy](https://github.com/18-lab-dev/vosu/blob/main/PRIVACY.md), [security policy](https://github.com/18-lab-dev/vosu/blob/main/SECURITY.md).
