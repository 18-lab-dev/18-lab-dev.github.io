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

::: warning Ping/pong in the published transport
The vosu README advertises an application-text ping exchange, but the published
[transport](https://github.com/shiruviaa/vosu/blob/main/src/server/service/websocket_transport.rs)
treats **every subsequent text message as a second subscription**, returning an error
and closing. Do not send `["ping", nonce]`. WebSocket **control** ping/pong is separate;
the browser handles it automatically. This example sends no application heartbeat.
:::

## Fall back without guessing the server brand

A failed upgrade cannot be diagnosed precisely from browser JavaScript. If subscribe
closes before its first snapshot, this client tries full streams. It also abandons a
subscription that produces no initial snapshot within 4.5 seconds.

- `/websocket/v2` provides the ordinary tosu-compatible state.
- `/websocket/v2/precise` supplies upstream tosu's `k1`, `k2`, `m1`, and `m2` inputs.
  **The published tosu regular v2 type has no `keys` field.** Opening only regular v2
  would leave its key strip empty.
- Each regular payload replaces selected values. If regular state lacks `keys`, keep
  the latest precise keys rather than clearing them on every regular message.
- Reconnect uses 250 ms exponential backoff, capped at 5 seconds. It probes subscribe
  again so a restarted or replaced daemon can upgrade the client back to vosu.

There is one selected-value array, not an event history, and no outbound telemetry
queue. If a precise fallback connection dies, both fallback streams reconnect together.
`close()` cancels timers and prevents another reconnect.

## Resolve the listener

Hosted counter pages receive `window.COUNTER_PATH` from both servers. When it is
present, the module uses `location.host` and preserves HTTPS as WSS. Port 24050 is
also recognized for direct daemon pages. An unhosted Vite page defaults to
`127.0.0.1:24050`; a `?daemon=host:port` override selects another listener.
A custom-port hosted page still works because the daemon injects the counter path.

## Complete module

::: details src/connection.ts
<<< ../../../../examples/starter-overlay/src/connection.ts
:::

Sources: [vosu subscription implementation](https://github.com/shiruviaa/vosu/blob/main/src/server/v2_subscription.rs),
[vosu transport](https://github.com/shiruviaa/vosu/blob/main/src/server/service/websocket_transport.rs),
[tosu v2 types](https://github.com/tosuapp/tosu/blob/master/packages/tosu/src/api/types/v2.ts).
See the [WebSocket reference](/vosu/dev/websocket-api) for the complete contract.

Next: [render a useful HUD](/vosu/dev/tutorial/03-render).
