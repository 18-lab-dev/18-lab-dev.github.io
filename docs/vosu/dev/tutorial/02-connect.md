---
title: "2. Connect to live state"
description: "A vosu-first connection with bounded state and a tosu full-stream fallback."
---

# 2. Connect to live state

Create `src/connection.ts` from the complete module below. It exports `Telemetry`,
`SettingsChannel`, and a small object guard. Step 5 explains the settings channel;
for now concentrate on `Telemetry` and the pointer list.

## Select the fields

The pointer array names the values needed by the HUD. Indices in subscription frames
refer to this array, not arbitrary object keys. `/keys` selects one object containing
both compatibility keys and vosu's optional `all` array; subscribing to `/keys/all` too
would overlap and be rejected.

RFC 6901 pointers are slash-separated paths, not JavaScript expressions or JSONPath.
`/play/pp/current` means `document.play.pp.current`. The fallback pre-decodes tokens
once and traverses the same paths locally.

## Reconstruct the subscription

On `/websocket/v2/subscribe`, send the pointer array **once, immediately on open**.
vosu requires the first text message within five seconds.

| Frame                                                       | Client action                                                    |
| ----------------------------------------------------------- | ---------------------------------------------------------------- |
| `[0, revision, [[index, value], ...]]`                      | Clear old values, then apply the full selected-field snapshot.   |
| `[1, revision, [[index, value], ...], [removedIndex, ...]]` | Replace changed values and clear removed values to `undefined`.  |
| `[2, code, message]`                                        | Report the subscription error; the server closes the connection. |

Only increasing revisions are accepted within a connection. A reconnect resets the
revision and value array; revisions from different connections are not compared.
Missing fields are not the same as `null` or a present empty array.

vosu sends an update **only when at least one selected value changes**. The frame
carries only changed indices and removals, so it is a change event, not a polling
snapshot. The client turns those indices into a bit mask and forwards it to the
renderer without comparing their values again.

::: warning Send the selection once
Send exactly one text message: the pointer array. Any later text, including
`["ping", nonce]`, produces `[2, 5, "subscription already established"]` and close
code `1008`. Keepalive uses WebSocket control ping/pong: vosu answers control pings
and browsers handle control frames themselves, so browser clients send no heartbeat.
:::

## Fall back without guessing the server brand

A failed upgrade cannot be diagnosed precisely from browser JavaScript. If subscribe
closes before its first snapshot, this client tries full streams. It also abandons a
subscription that produces no initial snapshot within 4.5 seconds.

- `/websocket/v2` provides the ordinary tosu-compatible state.
- `/websocket/v2/precise` supplies upstream tosu's `k1`, `k2`, `m1`, and `m2` inputs.
  **The published tosu regular v2 type has no `keys` field.** Opening only regular v2
  would leave its key strip empty.
- Full payloads do not identify changes, so `compareFallback()` compares each selected
  value structurally, including arrays and objects. Only different values set bits
  in the same change mask used by subscribe. Identical payloads do not request a paint.
- If regular state lacks `keys`, keep the latest precise keys rather than clearing
  them on every regular message; precise keys get the same local comparison.
- Reconnect uses 250 ms exponential backoff, capped at 5 seconds. It probes subscribe
  again so a restarted or replaced daemon can upgrade the client back to vosu.

There is one selected-value array, not an event history, and no outbound telemetry
queue. If a precise fallback connection dies, both fallback streams reconnect together.
`close()` cancels timers and prevents another reconnect.

## Resolve the listener

Both daemons inject `window.COUNTER_PATH` as the counter directory relative to
`static/`, with no leading or trailing slash. vosu uses a quoted JavaScript string;
tosu uses a template literal, but the value is the same. Our Vite serve-only plugin
injects that value too, so local settings target the correct installed counter.

`import.meta.env.DEV` distinguishes Vite HMR from a daemon-hosted build. During
`pnpm dev`, sockets default to `127.0.0.1:24050`, **not** Vite's `localhost:5173`.
A built counter uses `location.host` and preserves HTTPS as WSS. A
`?daemon=host:port` override selects another listener.

With default allowlists, both servers accept reads with Origin
`http://localhost:5173`: they compare the hostname, not the port, and allow
`localhost`. vosu also requires an allowed network peer; a local loopback connection
satisfies that requirement. This does not grant vosu's same-origin management access.
See [vosu authorization](https://github.com/shiruviaa/vosu/blob/main/src/server/auth.rs)
and [tosu authorization](https://github.com/tosuapp/tosu/blob/master/packages/server/utils/index.ts).

## Complete module

::: details src/connection.ts
<<< ../../../../examples/starter-overlay/src/connection.ts
:::

Sources: [vosu subscription implementation](https://github.com/shiruviaa/vosu/blob/main/src/server/v2_subscription.rs),
[vosu transport](https://github.com/shiruviaa/vosu/blob/main/src/server/service/websocket_transport.rs),
[tosu v2 types](https://github.com/tosuapp/tosu/blob/master/packages/tosu/src/api/types/v2.ts).
See the [WebSocket reference](/vosu/dev/websocket-api) for the complete contract.

Next: [render a useful HUD](/vosu/dev/tutorial/03-render).
