---
title: WebSocket API
description: State streams, selected-field subscriptions, compatibility filters, and counter commands.
---

# WebSocket API

Default origin: `ws://127.0.0.1:24050`. All upgrades require GET and the configured trusted-peer policy. Unknown/near-miss paths return 404 without upgrading; unauthorized requests return 403. Inbound frames and assembled messages are capped at **1 MiB** (close 1009 on overflow). Protocol errors close 1002; shutdown uses 1001. State delivery is latest-only under backpressure, not an event log.

| Upgrade path                                                    | Published data                                     |
| --------------------------------------------------------------- | -------------------------------------------------- |
| `/ws`                                                           | v1 regular state                                   |
| `/tokens`                                                       | streamCompanion regular state                      |
| `/websocket/v2`                                                 | Regular [v2 document](/vosu/dev/schema)            |
| `/websocket/v2/precise`                                         | [Precise v2 document](/vosu/dev/schema#precise-v2) |
| `/websocket/v2/subscribe` <Badge type="tip" text="vosu only" /> | Selected fields from the regular v2 document       |
| `/websocket/commands`                                           | Settings/control replies; no state stream          |

## Compatibility state streams

Text frames contain JSON documents. Check for `error` before reading game fields. Regular streams retain `POLL_RATE` publication; precise v2 retains `PRECISE_DATA_POLL_RATE`. vosu's regular v2 includes keys; upstream tosu's regular v2 does not, so use its precise endpoint for fallback keys.

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

Native WebSocket Ping frames receive native Pong frames with the same payload. Native Pong is ignored. A full established pong control queue closes 1011. Browser WebSocket APIs handle native control frames automatically and do not expose a method to send Ping.

::: warning Published README discrepancy
The README describes application text `["ping", nonce]` and response `["pong", nonce, revision]`. The published transport does **not** implement these: every post-subscription text message, including that ping, triggers error 5 and close 1008. Use native WebSocket control ping/pong where your client supports it; do not send an application text heartbeat.
:::

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

`saveSettings` requires same-origin provenance captured **at upgrade**; otherwise the socket closes **1008 `Same-origin required` before saving or relaying**. Headerless/file-origin clients can use `getSettings`, `updateSettings`, and `applyFilters`; use `/settings?overlay=<name>` for user edits. Unauthorized unknown commands also close 1008.

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

### Filter syntax and bounds

Filters are an array of field strings or nested `{ "field": "fieldName", "keys": [...] }` descriptors. Strings select whole fields; nested descriptors select child fields. An empty filter list restores unfiltered state. The parser accepts JavaScript-compatible truthy/coerced descriptor `field` values, but use nonempty strings. Non-descriptor items are ignored; exceeding **256 nodes** or **eight nesting levels** rejects the whole filter request. Equivalent filter plans are deduplicated. Ordered overlapping selections follow last-write projection behavior, not JSON Pointer subscription rules.

Filters apply to the socket receiving the command; sending them to `/websocket/commands` does not alter another state socket. Send them to your state connection instead. Control queues and the shared relay mailbox each hold at most **16** frames/events. Saturation drops new relay refreshes; a recipient with a full control queue disconnects without stalling other clients.

Sources: [subscription implementation](https://github.com/shiruviaa/vosu/blob/main/src/server/v2_subscription.rs), [transport](https://github.com/shiruviaa/vosu/blob/main/src/server/service/websocket_transport.rs), [commands](https://github.com/shiruviaa/vosu/blob/main/src/server/commands.rs), [filter parser](https://github.com/shiruviaa/vosu/blob/main/src/server/commands/framing.rs), [WebSocket hub](https://github.com/shiruviaa/vosu/blob/main/src/server/websocket.rs).
