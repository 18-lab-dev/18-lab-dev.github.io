---
title: Overlay security
description: Understand the shared dashboard origin, management authority, and safe settings paths.
---

# Overlay security

## Same origin means shared authority

Installed counters run their authors' JavaScript at the same origin as vosu's dashboard: `http://127.0.0.1:24050` by default. They are **trusted code, not isolated tenants**. A counter can technically satisfy the management checks and act beyond its own settings. A catalog listing does not make third-party code safe.

[ADR 0013](https://github.com/shiruviaa/vosu/blob/main/docs/decisions/0013-counters-share-dashboard-origin.md) deliberately preserves counter URLs, browser storage, settings links, and compatibility rather than adding a separate origin or sandbox. That is a disclosed trust boundary, not an authentication guarantee.

## Do not cross the management boundary

::: danger Developer responsibility
Do not call management endpoints from an overlay without a **strong, documented justification** that the user can understand. Rendering a counter is not justification to install/delete code, change the daemon, collect diagnostics, or write another counter's settings.
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

If a product genuinely needs a management operation, document its exact scope and user-visible purpose, and make the action deliberate rather than a background effect of opening an overlay. Do not hide it behind a routine telemetry connection.

## What to use instead

- Read-only state: `/json/v2`, `/json/v2/precise`, and matching [WebSocket streams](/vosu/dev/websocket-api); prefer selected-field subscriptions where supported.
- Your **own** settings read: `GET /api/counters/settings/<name>` or `getSettings` on a socket whose `l` matches your counter.
- User edits: link the hosted **`/settings?overlay=<name>`** page. URL-encode the name. Counters in OBS or browsers still save via this page; vosulay uses the local broker credential below so counters running in game can save their own settings.
- Per-counter package schema and values: [counter settings](/vosu/dev/counter-packages), not a shared in-game namespace.

Hosted counters that intentionally implement their own settings UI may use the existing own-counter settings protocol, but shared-origin technical permission is not permission to manage unrelated counters or the daemon.

## What the checks actually protect

Read authorization uses the configured trusted-peer/network and Origin/Referer policy; headerless and opaque/file-origin reads remain possible for trusted peers. Management POSTs additionally require provenance matching the native listener's **exact scheme, host, and port**. `Origin` is authoritative; only if absent may `Referer` authorize a mutation. Missing, malformed, duplicate, or `null` provenance does not authorize writes. Rejections return 403.

`saveSettings` uses provenance captured at WebSocket upgrade, or a valid local broker credential on `/websocket/commands`, and closes 1008 before saving/relaying when neither authorizes the write. Reads (`getSettings`), echo replies (`updateSettings`), and own-socket filters (`applyFilters`) remain available without write provenance.

This is **CSRF protection, not authentication** against installed counter scripts or malicious local programs. Native clients can forge Origin. Forwarded headers are not trusted; an HTTPS reverse-proxy origin is not automatically a same-origin exception. CORS headers are not a grant of management authority.

Keep loopback binding and normal-user execution. Root-confined file serving, escaped reports, bounded requests, HTTPS download checks, and ZIP safety checks reduce particular risks; they do not sandbox counter JavaScript or provide a global resource budget.

## Local broker trust boundary

vosu rotates a private `broker.json` credential each start. On Linux it lives at `$XDG_RUNTIME_DIR/vosu/broker.json`, falling back to `${XDG_CONFIG_HOME:-$HOME/.config}/vosu/broker.json` when `XDG_RUNTIME_DIR` is unset or empty; directory/file modes are 0700/0600. On Windows it lives at `%LOCALAPPDATA%\vosu\broker.json`, not next to the executable.

Native brokers such as vosulay may send `Authorization: Bearer <token>` **only on loopback `/websocket/commands` upgrades**, matching the credential file's origin. It grants exactly the same-origin command-socket write permission, **not HTTP management authority**. Bearer is case-insensitive; other authorization schemes are ignored. A wrong/stale token fails the upgrade with 401 even when Origin would authorize it; no token preserves existing behavior. See the [command WebSocket contract](/vosu/dev/websocket-api#native-broker-credential) for origin matching and restart/retry handling.

Any same-account process that can read this file can write counter settings and invoke other same-origin command-socket mutations. This makes native-client trust explicit, rather than solving the existing ability to forge Origin. Keep the token out of page JavaScript and logs. The broker must authorize its own inbound counter-frame Origin/Host and session secret before forwarding requests.

**Windows residual risk:** the file inherits its directory's ACL. A pre-existing `%LOCALAPPDATA%\vosu` directory or its parents with broad inheritable permissions can expose the token to other accounts. vosu does not reset those ACLs; protect the directory and its parents. LocalAppData placement alone is not a security guarantee, and administrators or other principals already entitled to read remain trusted.

Sources: [broker integration contract](https://github.com/shiruviaa/vosu/blob/main/README.md#native-overlay-brokers), [network exposure and ACL limits](https://github.com/shiruviaa/vosu/blob/main/docs/security.md#network-exposure), [ADR 0013 amendment](https://github.com/shiruviaa/vosu/blob/main/docs/decisions/0013-counters-share-dashboard-origin.md#native-broker-authentication-2026-10-16-amendment).

## Removed in-game endpoint <Badge type="danger" text="deprecated" />

Upstream tosu has `/api/ingame`, its embedded in-game overlay page, and dedicated `__ingame__` settings. vosu removed that surface in [ADR 0008](https://github.com/shiruviaa/vosu/blob/main/docs/decisions/0008-external-in-game-overlays.md). Its [router](https://github.com/shiruviaa/vosu/blob/main/src/server/routes.rs) reserves unknown `/api/` paths and returns **404** for `/api/ingame`; it cannot fall through to counter HTML.

Overlays must not depend on `/api/ingame` or `__ingame__`, and should never have used that in-game product surface to manage even their own settings or configuration. In-game rendering is [vosulay's](/vosulay/) job. Store each counter's settings using the counter settings mechanism; external renderers own their UI and persistence.

Sources: [management authorization README](https://github.com/shiruviaa/vosu/blob/main/README.md#pages-counters-reports-and-updates), [runbook security](https://github.com/shiruviaa/vosu/blob/main/docs/operations/runbook.md#security-hardening-and-remaining-trust), [privacy policy](https://github.com/shiruviaa/vosu/blob/main/PRIVACY.md), [security policy](https://github.com/shiruviaa/vosu/blob/main/SECURITY.md).
