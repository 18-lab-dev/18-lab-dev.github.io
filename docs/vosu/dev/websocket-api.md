---
title: WebSocket API
description: State streams, selected-field subscriptions, compatibility filters, and counter commands.
---

# WebSocket API

Default origin: `ws://127.0.0.1:24050`. All upgrades require GET and the configured trusted-peer policy. Unknown/near-miss paths return 404 without upgrading; unauthorized requests return 403 (invalid broker credentials or invalid/revoked/insufficient-scope API keys return 401, as described below). Inbound frames and assembled messages are capped at **1 MiB** (close 1009 on overflow). Protocol errors close 1002; shutdown uses 1001. State delivery is latest-only under backpressure, not an event log.

| Upgrade path                                                    | Published data                                     |
| --------------------------------------------------------------- | -------------------------------------------------- |
| `/ws`                                                           | v1 regular state                                   |
| `/tokens`                                                       | streamCompanion regular state                      |
| `/websocket/v2`                                                 | Regular [v2 document](/vosu/dev/schema)            |
| `/websocket/v2/precise`                                         | [Precise v2 document](/vosu/dev/schema#precise-v2) |
| `/websocket/v2/subscribe` <Badge type="tip" text="vosu only" /> | Selected fields from the regular v2 document       |
| `/websocket/commands`                                           | Settings/control replies; no state stream          |

## Compatibility state streams

Text frames contain JSON documents. Check for `error` before reading game fields. Compatibility streams republish the whole document every poll interval: regular streams use `POLL_RATE`, and precise v2 uses `PRECISE_DATA_POLL_RATE`. vosu's regular v2 includes keys; upstream tosu's regular v2 does not, so use its precise endpoint for fallback keys.

```js
const socket = new WebSocket("ws://127.0.0.1:24050/websocket/v2");
socket.onmessage = ({ data }) => {
  const state = JSON.parse(data);
  if (state.error || !state.play) return;
  document.querySelector("#pp").textContent = state.play.pp.current.toFixed(0);
};
```

The legacy streams also accept the command protocol below. `/tokens` additionally accepts a raw JSON filter array, normalizing it to `applyFilters`.

## Selected-field subscription <Badge type="tip" text="vosu only" />

**Change-only delivery:** after the initial baseline, an update is an event identifying exactly which selected fields changed or disappeared. If no selected value changed, **no update frame is sent**. Each update contains only changed `[index, value]` pairs and removed indices, so your overlay can react to those events without client-side diffing, polling, or full-document parsing. Select the fields you need rather than the root document; compatibility streams instead republish the whole document every poll interval.

Send exactly one complete text message **within five seconds of upgrading**: a JSON array of **1–256 non-overlapping RFC 6901 JSON Pointers**.

```json
["/play/pp/current", "/beatmap/mode", "/keys/all"]
```

Pointers are at most **512 UTF-8 bytes** and **32 tokens** deep. Escape `~` as `~0` and `/` as `~1`. The empty pointer selects the entire document and therefore cannot coexist with another selection. Duplicates and ancestor/descendant pairs are invalid. Array indices use canonical decimal notation (`0`, `1`, …; not `01` or `-`). Syntactically valid pointers to missing values are allowed; they simply have no initial entry.

Selection order assigns stable zero-based indices for the connection. It cannot be changed in place: reconnect to choose different fields.

### Server frames

| JSON frame                                                  | Meaning                                                                                       |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `[0, revision, [[index, value], ...]]`                      | Initial state; only currently present selections included                                     |
| `[1, revision, [[index, value], ...], [removedIndex, ...]]` | Changes since the last delivered baseline; replace changed selections and delete removed ones |
| `[2, code, message]`                                        | Terminal application error; followed by a close frame                                         |

Values can be any JSON value, including `null`. Missing values are **not** null: they are omitted initially and listed as removed on update. Store selected subtrees as replacements, not nested patches. Revisions can skip; do not assume contiguous revisions or delivery of every game event. No changed fields means no update frame.

```js
const pointers = ["/play/pp/current", "/keys/all"];
const values = new Map();
const socket = new WebSocket("ws://127.0.0.1:24050/websocket/v2/subscribe");
socket.onopen = () => socket.send(JSON.stringify(pointers));
socket.onmessage = ({ data }) => {
  const [kind, revisionOrCode, entries, removed = []] = JSON.parse(data);
  if (kind === 2) {
    console.error("Subscription error", revisionOrCode, entries);
    return;
  }
  if (kind === 0) values.clear();
  for (const [index, value] of entries) values.set(index, value);
  for (const index of removed) values.delete(index);
  // Schedule rendering separately; values.get(0) is the selected PP number.
};
```

### Sampling and readiness

While at least one established selection exists, vosu samples using `V2_SUBSCRIPTION_DEBOUNCE` <Badge type="tip" text="vosu only" /> (milliseconds), never slower than the regular/precise sampling intervals. This can expose selected changes before HTTP and compatibility payloads, which keep their own publication rates. It is sampling/debounce, not a lossless queue of changes. Missing/unready source documents result in absent selections/removals rather than a full HTTP error envelope.

### Ping/pong and closes

Keepalive uses **WebSocket control Ping/Pong only**. vosu answers each Ping with a Pong carrying the same payload; native Pong is ignored. A full established pong control queue closes 1011. Browser `WebSocket` cannot send control pings, so browser clients send **no heartbeat**.

After the selection is established, **any text message**, including `["ping", nonce]`, receives `[2, 5, "subscription already established"]` followed by close **1008**. Reconnect to change your selection; do not send an application text heartbeat.

| Application code | Message                            | Close |
| ---------------- | ---------------------------------- | ----- |
| 1                | `invalid subscription request`     | 1008  |
| 2                | `invalid JSON Pointer`             | 1008  |
| 3                | `subscription timed out`           | 1008  |
| 4                | `state serialization failed`       | 1011  |
| 5                | `subscription already established` | 1008  |

Binary messages close 1003. Invalid protocol closes 1002; oversized input closes 1009; server shutdown closes 1001. Native ping before the initial selection does not extend the five-second deadline.

## Commands and compatibility filters

Connect with `?l=<encoded-counter-name>`, for example `/websocket/commands?l=my-counter`. The decoded `l` identifies the settings namespace. Text commands use `command:encodedOverlay:payload`. The first two colons delimit the envelope; colons inside a JSON payload are fine. Replies are JSON, not colon-delimited text.

| Command                                                   | Request                                                                                           | Reply / effect                                                                                                                                 |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `getSettings`                                             | `getSettings:my-counter:`                                                                         | `{"command":"getSettings","message":{...compactValues}}`; error object if the envelope name differs from `l` (`Wrong overlay`) or lookup fails |
| `updateSettings`                                          | `updateSettings:my-counter:{"size":20}`                                                           | `{"command":"updateSettings","message":{"size":20}}`; echo only, no persistence                                                                |
| `saveSettings` <Badge type="warning" text="management" /> | `saveSettings:my-counter:{"size":20}`                                                             | No acknowledgment; schedules persistence after a shared 500 ms debounce, and relays `updateSettings` to matching peers except the sender       |
| `applyFilters`                                            | `applyFilters:my-counter:["state",{"field":"play","keys":["pp"]}]` or legacy `applyFilters:[...]` | No acknowledgment; replaces that socket's state filters                                                                                        |
| Unknown command                                           | `name:my-counter:`                                                                                | `{"command":"name"}` when authorized; no catalog operation                                                                                     |

Malformed commands without a colon, invalid URI encoding, invalid JSON, or invalid filter arrays get no acknowledgment. `getOverlays`/`getCounters` are not implemented catalog commands.

### Settings provenance and target

`saveSettings` requires same-origin provenance captured **at upgrade**, a valid native broker credential on a loopback `/websocket/commands` upgrade, or an [API key with `settings:write`](#api-key-authentication); otherwise the socket closes **1008 `Same-origin required` before saving or relaying**. Headerless/file-origin clients without credentials can use `getSettings`, `updateSettings`, and `applyFilters`. Counters in OBS or browsers can save via the hosted `/settings?overlay=<name>` page; vosulay uses the broker credential so counters running in game can save their own settings. Unauthorized unknown commands also close 1008.

Persistence targets the connection's decoded `l`, **not** the envelope's overlay name. The latter controls relay targeting. Always keep them equal; a reply is not evidence of a durable save. The shared debounce coordinator retains only the latest pending save, and save errors are not acknowledged. HTTP/settings changes relay `getSettings` refreshes to clients with matching `l`.

```js
const counter = window.COUNTER_PATH;
const socket = new WebSocket(
  `ws://127.0.0.1:24050/websocket/commands?l=${encodeURIComponent(counter)}`,
);
socket.onopen = () => socket.send(`getSettings:${encodeURIComponent(counter)}:`);
socket.onmessage = ({ data }) => {
  const reply = JSON.parse(data);
  if (reply.command === "getSettings" && !reply.message?.error) {
    console.log("Own settings", reply.message);
  }
};
```

### API key authentication <Badge type="tip" text="vosu only" />

**Added in vosu 1.1.0.** Create a key with **`settings:write`** in [Settings → API keys](/vosu/guide/dashboard#api-keys) to authorize existing `/websocket/commands` writes. Native WebSocket clients set `Authorization: Bearer <key>` on the upgrade. `profiles:manage` instead authorizes [HTTP profile mutations](/vosu/dev/http-api#settings-profiles); neither scope grants general dashboard management.

Browser WebSockets cannot set Authorization. With your saved secret in `key`, offer **both** subprotocols:

```js
const socket = new WebSocket("ws://127.0.0.1:24050/websocket/commands?l=my-overlay", [
  "vosu.key",
  "vosu.key." + key,
]);
// socket.protocol === "vosu.key": vosu never echoes the secret subprotocol.
```

The `l` query parameter still identifies the counter; **no query parameter authenticates a key**. Never put the secret in a URL. Invalid/revoked keys and insufficient scopes return **401**. Revoking a key immediately closes all associated command sockets with **1008**, even while idle, so they cannot keep receiving settings relays. With no key, existing behavior remains.

Remote peers must still pass `ALLOWED_IPS`; keys never bypass that policy. Plain HTTP/WS on a LAN exposes secrets to network observers: keep loopback by default and use a trusted TLS reverse proxy (`wss://` for WebSockets) for remote access. Cross-origin browser HTTP Authorization is not supported by CORS.

Persistent API keys are separate from the unchanged per-start, loopback-only `broker.json` token below, which keeps zero-config native broker integration and grants no HTTP write authority. See the [API key trust boundary](/vosu/dev/security#api-key-trust-boundary) and [README example](https://github.com/shiruviaa/vosu/blob/09341cc/README.md#api-keys).

### Native broker credential <Badge type="tip" text="vosu only" />

Each vosu start rotates a private `broker.json` containing `version`, the bound listener's `origin`, and a 64-character hex `token` generated from 32 OS-random bytes:

| Platform | Credential path                                                                                                                   |
| -------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Linux    | `$XDG_RUNTIME_DIR/vosu/broker.json`; if `XDG_RUNTIME_DIR` is unset or empty, `${XDG_CONFIG_HOME:-$HOME/.config}/vosu/broker.json` |
| Windows  | `%LOCALAPPDATA%\vosu\broker.json`, never the program folder                                                                       |

Linux paths must be absolute; invalid paths disable broker support with a warning. The directory/file modes are 0700/0600. Windows inherits directory ACLs; see the [security boundary](/vosu/dev/security#local-broker-trust-boundary) before relying on that location.

A native broker sends **`Authorization: Bearer <token>` only on `/websocket/commands` upgrades**, only to loopback, matching the file's origin scheme, host, and port (`localhost` and `127.0.0.1` may be treated as equivalent). vosu accepts it only from loopback peers. Never attach it to HTTP requests or other WebSocket routes.

A valid file token grants **exactly the same command-socket write permission as same-origin provenance**, not HTTP management authority. The Bearer scheme is case-insensitive; non-Bearer schemes, such as a reverse proxy's Basic authorization, are ignored. A wrong or stale file token returns **HTTP 401**, even if Origin would otherwise authorize the write. Without a credential, existing authorization and read-only behavior remain unchanged; HTTP management POSTs still require exact same-origin provenance unless a separate scoped API key authorizes that route.

On 401, reread the file and retry once; if that fails, connect without the token for the existing read-only behavior. vosu never deletes the file: once the daemon stops, its token is stale and authenticates nothing, and the next start atomically replaces it. Publication failures warn and disable broker writes without stopping vosu. Keep the token out of page JavaScript and logs, and authorize the broker's inbound counter-frame Origin/Host and session secret before forwarding: it must not become an open local proxy.

See the [native broker integration contract](https://github.com/shiruviaa/vosu/blob/main/README.md#native-overlay-brokers) for the full lifecycle and trust boundary.

### Profile-aware commands

<Badge type="tip" text="vosu only" /> **Added in vosu 1.1.0.** An overlay page pinned with `?vosuProfile=stream` receives `window.COUNTER_PATH="/@vosu-profile/stream/<overlay>"` and `window.VOSU_PROFILE="stream"`. Keep using the injected `COUNTER_PATH`, URI-encoded, for **both** the socket's `l` parameter and `getSettings`, `saveSettings`, and `updateSettings` envelope names. The existing example works without a new frame format: vosu decodes the qualified identity at the settings boundary and resolves the pinned profile.

Without a page override, the existing counter identity and injected metadata remain unchanged; commands use the global active profile. Global activation refreshes only unpinned clients over `/websocket/commands`. Saving or copying overlay values refreshes clients pinned to that profile and unpinned clients when it is active. Existing bounded queues and save coalescing still apply.

Renaming/deleting a profile does not rewrite already-open socket identities: reload pinned instances with a valid override. An unknown page override resolves to the active profile at page load, whereas explicit unknown HTTP API profiles fail. The qualified `COUNTER_PATH` is a **settings identity, not an asset URL**; construct assets from the page URL.

Management uses [`GET/POST /api/counters/profiles` and `?profile=` on `/api/counters/settings/<name>`](/vosu/dev/http-api#settings-profiles). For user editing/embedding, use `/settings?overlay=<name>&profile=<p>`; its `profile` parameter is separate from the overlay page's `vosuProfile`.

### Filter syntax and bounds

Filters are an array of field strings or nested `{ "field": "fieldName", "keys": [...] }` descriptors. Strings select whole fields; nested descriptors select child fields. An empty filter list restores unfiltered state. The parser accepts JavaScript-compatible truthy/coerced descriptor `field` values, but use nonempty strings. Non-descriptor items are ignored; exceeding **256 nodes** or **eight nesting levels** rejects the whole filter request. Equivalent filter plans are deduplicated. Ordered overlapping selections follow last-write projection behavior, not JSON Pointer subscription rules.

Filters apply to the socket receiving the command; sending them to `/websocket/commands` does not alter another state socket. Send them to your state connection instead. Control queues and the shared relay mailbox each hold at most **16** frames/events. Saturation drops new relay refreshes; a recipient with a full control queue disconnects without stalling other clients.

Sources: [subscription implementation](https://github.com/shiruviaa/vosu/blob/main/src/server/v2_subscription.rs), [transport](https://github.com/shiruviaa/vosu/blob/main/src/server/service/websocket_transport.rs), [commands](https://github.com/shiruviaa/vosu/blob/main/src/server/commands.rs), [filter parser](https://github.com/shiruviaa/vosu/blob/main/src/server/commands/framing.rs), [WebSocket hub](https://github.com/shiruviaa/vosu/blob/main/src/server/websocket.rs).
