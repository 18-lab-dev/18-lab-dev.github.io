---
title: Developer API
description: Choose a vosu telemetry API and build a same-origin osu! counter.
---

# Developer API

vosu serves HTTP and WebSocket APIs at **`http://127.0.0.1:24050`** by default. Installed counters are served from that same origin, for example `/my-counter/`. vosu supplies telemetry; [vosulay](/vosulay/) handles in-game rendering. vosu is not affiliated with tosu or ppy.

## Choose an API

| Family                                                | HTTP                 | WebSocket                 | Use                                      |
| ----------------------------------------------------- | -------------------- | ------------------------- | ---------------------------------------- |
| gosuMemory v1                                         | `/json`              | `/ws`                     | Existing v1 counters                     |
| streamCompanion                                       | `/json/sc`           | `/tokens`                 | Existing token consumers                 |
| v2                                                    | `/json/v2`           | `/websocket/v2`           | New overlays and structured game state   |
| Precise v2                                            | `/json/v2/precise`   | `/websocket/v2/precise`   | Keys and timing-error data               |
| Selected fields <Badge type="tip" text="vosu only" /> | —                    | `/websocket/v2/subscribe` | Only the v2 fields your overlay needs    |
| Commands                                              | Counter settings GET | `/websocket/commands`     | Settings reads and compatibility filters |

For new overlays, use v2 and precise v2. Prefer the selected-field stream when available; it selects from the regular v2 document, including vosu's added keys. For tosu fallback, regular v2 does **not** include keys: use its precise stream. See [extensions and feature detection](/vosu/dev/vosu-extensions).

The selected-field stream is **change-only**: after its initial baseline, each update is an event naming exactly which selected fields changed or disappeared. If nothing changed, vosu sends no update. Overlays can react to those events without client-side diffing, polling, or parsing the full document; compatibility streams republish the whole document every poll interval.

## Readiness and delivery

State HTTP requests return `500 {"error":"osu is not ready/running"}` until a focused ready instance is published. Treat this as readiness, not evidence of a broken HTTP server. Compatibility streams can also carry error documents; do not assume every received object has `beatmap` or `play`.

WebSocket frames and assembled inbound messages are limited to **1 MiB**. Slow clients receive latest-state delivery, not an unbounded replay of every sample. Subscription revisions are snapshots, not an event log; arrays and counts must be interpreted accordingly.

::: warning Counters are trusted code
Installed counter JavaScript runs on the overlay origin, separate from the dashboard/management origin (default `http://127.0.0.1:24052`) in vosu 1.1.0. It retains game-data reads and its settings protocol, not general dashboard authority. Keep overlays on read-only state APIs and their own settings; read the [security boundary](/vosu/dev/security) before implementing writes.
:::

## Start building

- [Overlay tutorial](/vosu/dev/tutorial/): a runnable counter, step by step.
- [Tooling](/vosu/dev/tooling): develop and inspect an overlay.
- [Performance](/vosu/dev/performance): efficient subscriptions and rendering.
- [HTTP reference](/vosu/dev/http-api), [WebSocket reference](/vosu/dev/websocket-api), and [field schema](/vosu/dev/schema).
- [Counter packages](/vosu/dev/counter-packages): metadata, schemas, and settings migration.

Source: [published README](https://github.com/shiruviaa/vosu/blob/main/README.md#http-api).
