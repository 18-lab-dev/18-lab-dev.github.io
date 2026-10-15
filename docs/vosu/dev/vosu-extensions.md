---
title: vosu extensions
description: Source-compared additions, intentional differences, removed tosu routes, and optional feature detection.
---

# vosu extensions

vosu keeps the tosu-compatible API families while adding optional native features and deliberately removing the embedded in-game product. This comparison is based on the published vosu source and upstream tosu source, **not** the assumption that every field described in vosu's README is exclusive.

The README says the additive input fields are planned for a tosu port **soon(tm)**. Treat all extensions as optional; do not make server-name guesses into required capabilities.

The selected-field subscription <Badge type="tip" text="vosu only" /> provides **change-only delivery**: after the initial baseline, each update is an event naming exactly which selected fields changed or disappeared. Nothing changed means no update frame. Overlays can react without client-side diffing, polling, or full-document parsing, unlike compatibility streams that republish the whole document every poll interval.

## Added endpoints, parameters, and headers

| vosu addition                                                                                                                                                                    | Upstream comparison                                                                                                               | Reference                                                                    |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `/websocket/v2/subscribe` <Badge type="tip" text="vosu only" />                                                                                                                  | No matching upgrade in tosu's socket router                                                                                       | [Subscription protocol](/vosu/dev/websocket-api#selected-field-subscription) |
| `V2_SUBSCRIPTION_DEBOUNCE` configuration binding <Badge type="tip" text="vosu only" />                                                                                           | No selected-field sampler/binding in tosu; vosu uses 1–60000 ms                                                                   | [Sampling](/vosu/dev/websocket-api#sampling-and-readiness)                   |
| `POST /api/counters/open-root` <Badge type="tip" text="vosu only" /> <Badge type="warning" text="management" />                                                                  | No dedicated route in tosu; its old open handler special-cases `static.exe`/`tosu.exe`                                            | [HTTP management](/vosu/dev/http-api#counters-and-settings)                  |
| `POST /api/counters/download/{url}`, `/api/counters/open/{name}`, `/api/counters/delete/{name}` <Badge type="tip" text="vosu only" /> <Badge type="warning" text="management" /> | tosu serves GET at these paths; vosu replaces those methods, with no GET shim                                                     | [HTTP management](/vosu/dev/http-api#counters-and-settings)                  |
| `POST /api/runUpdates`, `POST /api/generateReport` <Badge type="tip" text="vosu only" /> <Badge type="warning" text="management" />                                              | tosu serves GET; vosu uses same-origin POST                                                                                       | [Reports/updates](/vosu/dev/http-api#reports-and-updates)                    |
| Counter-search query `source=installed\|available` <Badge type="tip" text="vosu only" />                                                                                         | tosu infers catalog search from Referer path `/available`; vosu makes it explicit and rejects unknown values with 400             | [Search](/vosu/dev/http-api#counters-and-settings)                           |
| Calculator query `lazer=true\|false` <Badge type="tip" text="vosu only" />                                                                                                       | Not read by tosu's calculator route                                                                                               | [Calculator](/vosu/dev/http-api#calculation-query)                           |
| Calculator `mods` JSON object/array and acronym text <Badge type="tip" text="vosu only" />                                                                                       | tosu's route accepts a parsed array or numeric coercion; vosu explicitly parses JSON-encoded object/array and two-letter acronyms | [Calculator](/vosu/dev/http-api#calculation-query)                           |
| Response header `X-Vosu-Identity: vosu` on `/favicon.ico` <Badge type="tip" text="vosu only" />                                                                                  | No such header in tosu's favicon handler                                                                                          | Bounded identity hint, not a security credential                             |

The path-based calculator `path` parameter is **not new**, but vosu honors the supplied canonical regular `.osu` file. The examined tosu route tests whether `query.path` exists and then reads the **current** beatmap path. Do not assume identical behavior just because the parameter name matches.

vosu's exact same-origin management provenance policy is a behavioral difference: POSTs require exact listener scheme/host/port and `saveSettings` uses provenance captured at upgrade (1008 on forbidden writes). `Origin` and `Referer` themselves are standard browser headers, **not custom vosu headers**. See [security](/vosu/dev/security); the checks are CSRF protection, not authentication.

## Added document fields

Each field below is additive; original timing arrays and four-button shapes remain compatible.

| Field paths                                                                                                                                                  | Type / meaning                                                                                                    | Upstream comparison                                                         |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| v1 `gameplay.hits.pressHitErrors`, `gameplay.hits.releaseHitErrors`; tournament `tourney.ipcClients[].gameplay.hits.*` <Badge type="tip" text="vosu only" /> | Number arrays separating presses and hold releases                                                                | tosu v1 only has original `hitErrorArray`                                   |
| streamCompanion `pressHitErrors`, `releaseHitErrors` <Badge type="tip" text="vosu only" />                                                                   | Number arrays                                                                                                     | tosu token type only has original `hitErrors`                               |
| Regular v2 `play.pressHitErrors`, `play.releaseHitErrors`; `tourney.clients[].play.*` <Badge type="tip" text="vosu only" />                                  | Number arrays                                                                                                     | Absent from tosu Play type/builder                                          |
| Precise v2 `pressHitErrors`, `releaseHitErrors`; `tourney[].pressHitErrors`, `tourney[].releaseHitErrors` <Badge type="tip" text="vosu only" />              | Number arrays                                                                                                     | tosu precise type only exposes `hitErrors`                                  |
| Regular v2 root `keys` <Badge type="tip" text="vosu only" />                                                                                                 | `{k1,k2,m1,m2,all}`                                                                                               | tosu regular v2 root has no keys; its precise v2 does have the four buttons |
| `keys.all` and precise `tourney[].keys.all` <Badge type="tip" text="vosu only" />                                                                            | All source-reported logical inputs in order                                                                       | tosu precise KeyOverlay has only k1/k2/m1/m2                                |
| `keys.all[].name`, `.isPressed`, `.count`, `.pressedAt`, `.releasedAt` (and precise tournament equivalents) <Badge type="tip" text="vosu only" />            | String, boolean, integer, nullable number, nullable number; gameplay ms (stable frame edges, lazer sampled edges) | No all-key element in tosu                                                  |

Together the press and release arrays hold every value of the original array exactly once, in order. osu!lazer and native osu!stable mania maps (including Mirror) are classified; stable converted maps and maps without metadata stay press-only, and an unmatched error falls back to a press within 250 ms of replay time or one second. **Added in vosu 1.1.0:** stable `keys.all` counts retained replay-frame edges and timestamps them at frame time; lazer still timestamps sampled transitions only. See [schema](/vosu/dev/schema#timing-and-input-semantics).

## Gameplay extensions added in vosu 1.1.0

<Badge type="tip" text="vosu only" /> **Added in vosu 1.1.0.** Treat these fields as optional on other servers. They are additive to regular and precise v2, not v1 or streamCompanion.

| Regular v2          | Precise v2     | Shape                                                 |
| ------------------- | -------------- | ----------------------------------------------------- |
| `play.hitOffsets`   | `hitOffsets`   | `number[]`, flat stride-3 `[x, y, error, …]`          |
| `play.keyHitErrors` | `keyHitErrors` | Optional `{ press: number[][], release: number[][] }` |
| `play.catcher`      | `catcher`      | Optional `{ x: number, dashing: boolean }`            |

### Standard hit offsets

Each triple describes an osu!standard circle or slider-head hit: X/Y are **cursor minus stacked center**, in displayed 512×384 playfield pixels, and `error` is the original matching timing error in milliseconds. The array is empty outside standard gameplay. Missing spatial evidence omits a triple rather than inventing a position.

Stable matches replay down-edges to unjudged map heads using `press time - error` (±1 ms), with calculator stacking and HR reflection. Pending evidence expires after 250 ms without blocking later matched judgements. Mirror and other positional transformations are unsupported on stable; Mirror produces no triples. Stable's replay button byte and HR cursor coordinate frame still need live-client verification.

Lazer reads the actual judgement cursor and object's position/stack/scale, so applied positional mods need no map reconstruction. **The new lazer spatial offsets are unmeasured zero sentinels in the embedded template: lazer emits no triples until measured offsets are supplied.**

JSON delivers a number array, not a binary typed-array buffer. Convert it when needed:

```js
function hitOffsetTriples(regular, precise) {
  const values = regular?.play?.hitOffsets ?? precise?.hitOffsets;
  return Array.isArray(values) ? Float32Array.from(values) : null;
}

const offsets = hitOffsetTriples(regularState, preciseState);
if (offsets) {
  for (let i = 0; i < offsets.length; i += 3) {
    const [x, y, errorMs] = offsets.subarray(i, i + 3);
    console.log({ x, y, errorMs });
  }
}
```

A 3D hit-offsets demo overlay will be published separately.

### Mania per-key errors

Enable `ENABLE_MANIA_KEY_HIT_ERRORS = true` to expose `keyHitErrors`; it is **omitted entirely by default**. The outer index is the zero-based displayed lane, including Mirror. Each inner array contains timing errors in milliseconds; untouched lanes before the highest observed lane are empty. Outside mania attempts both outer arrays are empty.

History follows the existing aggregate hit-error reset/retention rules: pause/results retain it, exiting or retrying resets it, and enabling mid-attempt starts with subsequent classifications without rebuilding earlier events.

Stable includes only errors matched to native mania map judgements and replay transitions. Unmatched errors published by the 250 ms/one-second fallback, Random plays, and converted maps have unknown columns and are excluded here, but remain in aggregate arrays. Lazer reads each judged object's column; when a hold aggregate arrives later it moves the tail's timing from that column's press array to its release array. Missing/unmeasured column offsets omit events rather than inventing lanes.

```js
function laneTiming(regular, precise, lane) {
  const errors = regular?.play?.keyHitErrors ?? precise?.keyHitErrors;
  if (!errors) return null; // Disabled or unsupported, not an empty history.
  return {
    press: errors.press[lane] ?? [],
    release: errors.release[lane] ?? [],
  };
}
```

### Catcher position and dash

`catcher` appears only during catch gameplay when evidence is available; it is omitted in menus, results and other rulesets. `x` is the client's stored position in osu! playfield pixels (0–512), **not screen space**. `dashing` is ordinary dash, not hyperdash.

Stable selects the replay frame at current play time, including preloaded watched replays, independently of new judgements. The legacy X slot and dash value `1` follow lazer's legacy catch replay conversion; their live stable memory mapping still needs measurement. Lazer reads native X and Dashing during precise polling; the new catch offset template entries must be measured before that client's field can be emitted.

### Logical keys and remaining parity limits

Stable now publishes replay-frame logical actions with lazer-compatible `B1`-onwards names/order, independently of in-game overlay visibility. Lazer accepts up to 20 mania actions (dual-stage, stage one then stage two). See the [ruleset mapping](/vosu/dev/schema#logical-action-order) for each name and stable replay bit.

`ENABLE_KEY_OVERLAY` still gates updates after the opening 150 ms, and legacy `k1`, `k2`, `m1`, `m2` sources are unchanged. Edge timestamps are nullable gameplay milliseconds. Stable counts every retained down-edge with exact frame timestamps, including complete taps between polls, stopping at the play clock even for preloaded replays/spectating. Retry/rewind resets the attempt. Rolling eviction preserves accumulated counts, but missing more than 8192 frames establishes a new baseline without inventing a press; evicted history is not recoverable when attaching midway either.

Lazer records sampled-edge timestamps; count jumps may reveal missed complete taps without fabricating timestamps. Stable catch left/right remain unpressed with zero counts and null timestamps because stable records position instead; dash is available. These and unrecoverable history remain parity differences, not physical-input measurements. Native stable's in-memory button byte and hidden-overlay behavior still require live-client verification.

## Package-level differences

| vosu behavior                                                                                                                                | Upstream comparison                                                                                                                                                                 |
| -------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Package `settings.schema.toml` and central `<name>.settings.values.toml` <Badge type="tip" text="vosu only" />                               | tosu's parser uses package `settings.json` and JSON values; vosu migrates these once, then keeps TOML authoritative                                                                 |
| Explicit top-level alias mount confinement; delete unlinks mount, install rejects symlink destinations <Badge type="tip" text="vosu only" /> | tosu uses generic path join/stat/read and recursive delete; it does not implement this explicit confined-mount contract. Basic filesystem symlinks are not themselves a new concept |

Descriptors, setting types, `?update=yes`, `?update=true`, and `window.COUNTER_PATH` are **shared compatibility mechanisms**, not exclusive additions. See [packages](/vosu/dev/counter-packages).

**Added in vosu 1.1.0** <Badge type="tip" text="vosu only" />: [settings profiles](/vosu/dev/http-api#settings-profiles), per-instance `?vosuProfile=`, qualified `COUNTER_PATH`, and `window.VOSU_PROFILE`. Schemas remain shared and the reserved `default` profile keeps legacy values paths. No override preserves the existing served bytes/metadata; a qualified identity is not an asset URL. See [profile-aware packages](/vosu/dev/counter-packages#per-instance-settings-profiles).

## tosu surfaces vosu does not serve

| tosu route/surface                                                                                     | vosu behavior / replacement                                                                                                                  |
| ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/ingame` <Badge type="danger" text="deprecated" />                                            | 404; embedded in-game product removed                                                                                                        |
| `__ingame__` dedicated settings <Badge type="danger" text="deprecated" />                              | Removed; use ordinary per-counter settings, not this namespace                                                                               |
| `getOverlays` / `getCounters` catalog commands                                                         | Removed as operations; authorized unknown commands only receive a command-name reply                                                         |
| `GET /api/counters/download/{url}`, `GET /api/counters/open/{name}`, `GET /api/counters/delete/{name}` | 404; dashboard uses POST                                                                                                                     |
| `GET /api/runUpdates`, `GET /api/generateReport`                                                       | 404; dashboard uses POST                                                                                                                     |
| Built-in `/local-overlays` instruction page                                                            | No dedicated page in vosu; it reaches ordinary counter-static fallback and is normally missing unless a matching static resource is supplied |
| Special counter-open names `tosu.exe`, `static.exe`                                                    | No magic aliases; use the normal name or dedicated `/api/counters/open-root`                                                                 |

Overlays must not depend on `/api/ingame` or `__ingame__`, and should never have used that in-game endpoint even to manage their own settings/configuration. In-game rendering is [vosulay's](/vosulay/) job. [ADR 0008](https://github.com/shiruviaa/vosu/blob/main/docs/decisions/0008-external-in-game-overlays.md) is the clean-cutover rationale; [the router](https://github.com/shiruviaa/vosu/blob/main/src/server/routes.rs) confirms `/api/ingame` cannot fall through to counter serving.

## Feature detection

1. Try the selected-field upgrade and send selectors immediately. If the upgrade fails or the initial selection is rejected, fall back to the compatibility v2 stream. Do not probe management operations.
2. Use regular v2 for map/play state and precise v2 for fallback keys. Check properties, not an assumed server version.
3. For press history, fall back to the original array. For release history, an absent field means unsupported—do not reinterpret every event as a hold release.
4. Use the four-button shape when `keys.all` is absent. A favicon identity hint can identify vosu but is not proof that a particular future extension exists.

```js
function inputCapabilities(regular, precise) {
  const keys = regular.keys ?? precise?.keys;
  const original = regular.play?.hitErrorArray ?? precise?.hitErrors ?? [];
  return {
    keys,
    allKeys: Array.isArray(keys?.all) ? keys.all : null,
    presses: regular.play?.pressHitErrors ?? precise?.pressHitErrors ?? original,
    releases: regular.play?.releaseHitErrors ?? precise?.releaseHitErrors ?? null,
  };
}
```

`null` here means unsupported, not an observed empty history. The [tutorial](/vosu/dev/tutorial/) shows subscription-first fallback handling. Keepalive uses [WebSocket control Ping/Pong only](/vosu/dev/websocket-api#ping-pong-and-closes); browser clients send no heartbeat.

## Comparison sources

- vosu: [routes](https://github.com/shiruviaa/vosu/blob/main/src/server/routes.rs), [handlers](https://github.com/shiruviaa/vosu/blob/main/src/server/service/routing.rs), [v2 DTO](https://github.com/shiruviaa/vosu/blob/main/src/model/api/v2.rs), [README input extensions](https://github.com/shiruviaa/vosu/blob/main/README.md#state-and-calculation).
- tosu: [HTTP router](https://github.com/tosuapp/tosu/blob/HEAD/packages/server/router/index.ts), [upgrade router](https://github.com/tosuapp/tosu/blob/HEAD/packages/server/router/socket.ts), [v1 types](https://github.com/tosuapp/tosu/blob/HEAD/packages/tosu/src/api/types/v1.ts), [streamCompanion types](https://github.com/tosuapp/tosu/blob/HEAD/packages/tosu/src/api/types/sc.ts), [v2 types](https://github.com/tosuapp/tosu/blob/HEAD/packages/tosu/src/api/types/v2.ts), [settings parser](https://github.com/tosuapp/tosu/blob/HEAD/packages/server/utils/parseSettings.ts), [directory serving](https://github.com/tosuapp/tosu/blob/HEAD/packages/server/utils/directories.ts).
