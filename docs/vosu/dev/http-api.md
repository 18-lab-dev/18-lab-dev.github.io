---
title: HTTP API
description: Every vosu HTTP route, method, request parameter, response, and transport limit.
---

# HTTP API

Base URL: `http://127.0.0.1:24050`. Methods and paths are exact and case-sensitive. Unsupported combinations return **404**, not 405; there are no implicit HEAD or OPTIONS handlers. WebSocket upgrades are listed separately in the [WebSocket reference](/vosu/dev/websocket-api).

All requests pass the configured trusted-peer policy; rejection is **403 `Not Found`**. POSTs require exact same-origin provenance unless a scoped [API key](#api-keys) authorizes the specific value/profile write: authoritative `Origin`, or `Referer` only when Origin is absent. Missing, duplicate, malformed, or opaque provenance otherwise returns 403. POST bodies are capped at **1 MiB**; larger bodies return **413 `{"error":"payload too large"}`**. CORS response headers do not bypass these checks. See [security](/vosu/dev/security).

## API keys

<Badge type="tip" text="vosu only" /> **Added in vosu 1.1.0.** Create a named key in [Settings → API keys](/vosu/guide/dashboard#api-keys) and copy its secret when shown; it cannot be recovered later. Native HTTP clients send `Authorization: Bearer <key>`.

| Scope             | Authorized writes                                                                                              |
| ----------------- | -------------------------------------------------------------------------------------------------------------- |
| `settings:write`  | Command-socket writes and `POST /api/counters/settings/<name>` value saves, **not** `?update=yes` schema saves |
| `profiles:manage` | All `POST /api/counters/profiles` actions                                                                      |

Neither scope grants updates, counter installation/deletion, reports, daemon settings, or key management; those remain exact same-origin only. Invalid/revoked keys and insufficient scopes return **401**, with JSON for HTTP POSTs. POSTs re-check the granted scope after receiving the body and before dispatch, so revocation during an upload prevents the pending mutation. With no key, existing behavior remains.

For a native value save, set `VOSU_API_KEY` to your saved `settings:write` secret:

```sh
curl -H "Authorization: Bearer $VOSU_API_KEY" -H 'Content-Type: application/json' \
  --data '[{"uniqueID":"title","value":"My overlay"}]' \
  http://127.0.0.1:24050/api/counters/settings/my-overlay
```

Keys never authenticate through URL query parameters. Cross-origin browser HTTP is not supported: CORS does not allow Authorization. For browsers, use the [command WebSocket subprotocols](/vosu/dev/websocket-api#api-key-authentication). Remote peers must still be allowed by `ALLOWED_IPS`; a key never bypasses that policy. Plain HTTP/WS on a LAN exposes the secret to network observers: keep loopback by default and use a trusted TLS reverse proxy for remote access.

Keys persist across restarts, unlike the unchanged per-start loopback [`broker.json` token](/vosu/dev/websocket-api#native-broker-credential). The file token still provides zero-config native broker integration, authorizes command-socket writes only, and is not an HTTP credential.

### Dashboard-only key management

Exact same-origin provenance is required for both `GET /api/keys` and `POST /api/keys`; an API key cannot manage itself or other keys. GET returns `{keys:[...]}` metadata without secrets or hashes. POST accepts:

| Action | JSON body                       | Result                                                                   |
| ------ | ------------------------------- | ------------------------------------------------------------------------ |
| Create | `{action:"create",name,scopes}` | `{key,entry}`; secret returned once                                      |
| Rename | `{action:"rename",id,name}`     | Changes the name, not scopes                                             |
| Revoke | `{action:"revoke",id}`          | Immediately closes associated command sockets with 1008, even while idle |

Names are 1–64 printable characters excluding Unicode bidirectional controls. `scopes` contains one or both scope values above. To change permissions, revoke and recreate the key.

Sources: [API key README and examples](https://github.com/shiruviaa/vosu/blob/09341cc/README.md#api-keys), [ADR 0015](https://github.com/shiruviaa/vosu/blob/09341cc/docs/decisions/0015-user-managed-api-keys.md).

## State and calculation

| Method + path           | Parameters                      | 200 response                                    | Other statuses                                                 |
| ----------------------- | ------------------------------- | ----------------------------------------------- | -------------------------------------------------------------- |
| `GET /json`             | None                            | gosuMemory-compatible v1 object                 | 500 readiness/serialization error                              |
| `GET /json/sc`          | None                            | streamCompanion-compatible token object         | 500 readiness/serialization error                              |
| `GET /json/v2`          | None                            | [v2 document](/vosu/dev/schema)                 | 500 readiness/serialization error                              |
| `GET /json/v2/precise`  | None                            | [precise document](/vosu/dev/schema#precise-v2) | 500 readiness/serialization error                              |
| `GET /api/calculate/pp` | Optional query parameters below | Legacy rosu-pp performance object               | 400 input/calculation error; 500 readiness/serialization error |

Readiness errors are `{"error":"osu is not ready/running"}`. Calculation errors use `{"error":"message"}`. An explicit valid `path` can select a file without a current live beatmap.

### Calculation query

| Parameter                                                                    | Type / meaning                                                                                                                                                              |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `path`                                                                       | Canonical regular `.osu` file to calculate; otherwise current map. vosu honors the supplied file; the upstream tosu implementation checks `path` but reads the current map. |
| `lazer` <Badge type="tip" text="vosu only" />                                | Boolean text `true` or `false`; score-system selection                                                                                                                      |
| `mode`                                                                       | Integer: 0 osu!, 1 taiko, 2 catch, 3 mania                                                                                                                                  |
| `ar`, `cs`, `hp`, `od`                                                       | Numeric difficulty overrides                                                                                                                                                |
| `clockRate`                                                                  | Finite number in 0.01–100                                                                                                                                                   |
| `passedObjects`, `combo`, `nMisses`, `n100`, `n300`, `n50`, `nGeki`, `nKatu` | Unsigned 32-bit integer counts                                                                                                                                              |
| `acc`                                                                        | Numeric accuracy                                                                                                                                                            |
| `sliderEndHits`, `smallTickHits`, `largeTickHits`                            | Unsigned 32-bit integer counts                                                                                                                                              |
| `hitresultPriority`                                                          | 0 best case (default), 1 worst case                                                                                                                                         |
| `mods`                                                                       | Legacy unsigned bitmask; vosu also accepts JSON mod objects/arrays and two-letter acronyms <Badge type="tip" text="vosu only" />                                            |

All parameters are optional. Unknown query keys are ignored. Counts accept integral numeric text (including exponent and hexadecimal/binary/octal notation), reject negatives/fractions/nonfinite values, and must fit u32. Acronym strings may contain whitespace or commas, for example `HD,DT`; structured mods contain `acronym` and optional `settings`.

Inputs are capped at **64 MiB**, including opened-file checks and bounded reads. The live calculation facade additionally limits parsed objects to 250,000 with finite start times within ±10,000,000 ms; live graph output is capped at 1,000,000 aggregate bins. These do not constitute a global concurrent-memory ceiling.

The performance response contains `difficulty`, `state`, and numeric `pp`; optional numeric fields include `ppAim`, `ppFlashlight`, `ppSpeed`, `ppAccuracy`, `ppDifficulty`, `effectiveMissCount`, `estimatedUnstableRate`, `speedDeviation`, `comboBasedEstimatedMissCount`, `scoreBasedEstimatedMissCount`, `aimEstimatedSliderBreaks`, and `speedEstimatedSliderBreaks`. `state` contains numeric `maxCombo`, `osuLargeTickHits`, `osuSmallTickHits`, `sliderEndHits`, `nGeki`, `nKatu`, `n300`, `n100`, `n50`, and `misses`.

`difficulty` always contains numeric `mode`, `stars`, `maxCombo`, and boolean `isConvert`. Ruleset-dependent numeric fields are omitted when absent: `aim`, `aimDifficultSliderCount`, `speed`, `flashlight`, `sliderFactor`, `aimTopWeightedSliderFactor`, `speedTopWeightedSliderFactor`, `speedNoteCount`, `aimDifficultStrainCount`, `speedDifficultStrainCount`, `nestedScorePerObject`, `legacyScoreBaseMultiplier`, `maximumLegacyComboScore`, `hp`, `nCircles`, `nSliders`, `nLargeTicks`, `nSpinners`, `stamina`, `rhythm`, `color`, `reading`, `nFruits`, `nDroplets`, `nTinyDroplets`, `nObjects`, `nHoldNotes`, `ar`, `preempt`, `greatHitWindow`, `okHitWindow`, `mehHitWindow`, `monoStaminaFactor`, `mechanicalDifficulty`, and `consistencyFactor`.

## Current game files

| Method + path                   | Resource / path base                                                                                                         |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `GET /backgroundImage`          | Selected map background (legacy alias)                                                                                       |
| `GET /files/beatmap/background` | Selected map background                                                                                                      |
| `GET /files/beatmap/audio`      | Selected map audio                                                                                                           |
| `GET /files/beatmap/file`       | Selected `.osu` file                                                                                                         |
| `GET /Songs/{path}`             | Relative to the current songs root                                                                                           |
| `GET /files/beatmap/{path}`     | Relative to the current songs root, **not** just the selected map folder                                                     |
| `GET /files/skin/{path}`        | Relative to the current stable skin root; lazer returns 500 `{"error":"This endpoint is unavailable for the lazer client."}` |

Paths are percent-decoded once (`+` stays literal). Absolute paths, parent traversal, NULs, malformed encoding, and escapes from the selected root return 404. Missing/unavailable game state returns 500 readiness; missing ready resources return 404. Successful files return bytes with a MIME Content-Type and Content-Length. Directory requests can return 200 HTML listings or 301 trailing-slash redirects.

File serving accepts a validated **single** `Range: bytes=...` request: 206 with Content-Range for a valid range; 416 with `Content-Range: bytes */<length>` for invalid/unsatisfiable ranges. Accepted forms are `bytes=start-end`, `bytes=start-`, and `bytes=-suffixLength`. Multiple ranges, embedded whitespace, zero suffixes, and explicit end positions beyond EOF are rejected (not clamped). Full responses are 200; media extensions `mp3`, `wav`, `ogg`, `gif`, `webm`, `mp4`, `avi`, and `webp` additionally advertise `Accept-Ranges: bytes`. Stream/seek failures can return 500.

## Pages and static content

| Method + path                      | Parameters / response                                                                       |
| ---------------------------------- | ------------------------------------------------------------------------------------------- |
| `GET /`                            | Dashboard HTML                                                                              |
| `GET /settings`                    | Daemon settings HTML; a nonempty `?overlay=<name>` selects the hosted counter-settings page |
| `GET /available`                   | Third-party catalog HTML                                                                    |
| `GET /favicon.ico`                 | Icon bytes; adds `X-Vosu-Identity: vosu` <Badge type="tip" text="vosu only" />              |
| `GET /assets/{path}`               | Embedded dashboard assets, 200 bytes or 404                                                 |
| `GET /{counter}/{path}` (fallback) | Counter/static-root files; `/{counter}/` selects `index.html`                               |

Dynamic page rendering can return 500 JSON errors. Counter fallback uses 200 bytes/HTML, 301 directory redirects, 404 missing/unsafe paths, and the file range behavior above. Successful full counter HTML responses append a script setting `window.COUNTER_PATH` to the logical parent directory. Use [counter packages](/vosu/dev/counter-packages) for its timing and settings contract. API and WebSocket reserved paths are not counter-static fallbacks.

### Removed in-game page <Badge type="danger" text="deprecated" />

`GET /api/ingame` is **not served**: the router returns 404. Dedicated `__ingame__` storage and catalog commands were removed in [ADR 0008](https://github.com/shiruviaa/vosu/blob/main/docs/decisions/0008-external-in-game-overlays.md). Do not depend on this tosu endpoint, including for your own settings/configuration. In-game rendering belongs to [vosulay](/vosulay/); use per-counter settings instead.

## Counters and settings

The write routes below are dashboard management APIs <Badge type="warning" text="management" />. They are **not an overlay's general-purpose API**. Most domain errors deliberately use HTTP 200 with an `error` field: check the body, not just `response.ok`.

| Method + path                                                                                                        | Input                                                                                                                 | Response / status                                                                              |
| -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `GET /api/counters/search/{query}`                                                                                   | Percent-encoded search text; `source=installed` (default) or `source=available` <Badge type="tip" text="vosu only" /> | 200 card HTML; 400 `Error: unknown search source`; 502 escaped `Error:` HTML on lookup failure |
| `POST /api/counters/download/{url}` <Badge type="tip" text="vosu only" /> <Badge type="warning" text="management" /> | Encoded HTTPS ZIP URL; required `name` single folder component; `update=true` permits replacement; body unused        | 200 `{"status":"Finished"}` or `{"error":"..."}`; 429 install capacity full                    |
| `POST /api/counters/open/{name}` <Badge type="tip" text="vosu only" /> <Badge type="warning" text="management" />    | Encoded counter folder name; body unused                                                                              | 200 `{"status":"opened"}` or error                                                             |
| `POST /api/counters/open-root` <Badge type="tip" text="vosu only" /> <Badge type="warning" text="management" />      | No parameters; body unused                                                                                            | 200 `{"status":"opened"}` or error; opens configured static root                               |
| `POST /api/counters/delete/{name}` <Badge type="tip" text="vosu only" /> <Badge type="warning" text="management" />  | Encoded counter folder name; body unused                                                                              | 200 `{"status":"deleted"}` or error                                                            |
| `GET /api/counters/settings/{name}`                                                                                  | Encoded counter name                                                                                                  | 200 `{"settings":[...],"values":{...}}` or error                                               |
| `POST /api/counters/settings/{name}` <Badge type="warning" text="management" />                                      | JSON array of `{ "uniqueID": "id", "value": ... }`                                                                    | 200 `{"result":"success"}` or error; debounced value persistence and settings refresh          |
| `POST /api/counters/settings/{name}?update=yes` <Badge type="warning" text="management" />                           | JSON array of complete CounterSetting descriptors                                                                     | 200 `{"result":"success"}` or error; updates package schema                                    |
| `POST /api/settingsSave` <Badge type="warning" text="management" />                                                  | JSON daemon configuration binding map                                                                                 | 200 `{"status":"updated"}`; 500 JSON parse/save/validation error                               |

Search retains letters, digits, and whitespace; any word can match name, author, or compatible clients. See [package/settings descriptors](/vosu/dev/counter-packages) for descriptor types and storage. Install admission is four shared concurrent jobs; HTTPS/private-destination/ZIP limits are documented there. Unlike tosu, download/open/delete are POST-only; their former GET forms return 404 with no redirect.

Daemon saves reject the **whole** request if interval/port values are nonfinite or outside: `POLL_RATE` 100–60000 ms, `PRECISE_DATA_POLL_RATE` 1–60000 ms, `V2_SUBSCRIPTION_DEBOUNCE` 1–60000 ms <Badge type="tip" text="vosu only" />, `SERVER_PORT` integral 1–65535. Other bindings are described in [configuration](/vosu/guide/configuration).

### Settings profiles

<Badge type="tip" text="vosu only" /> **Added in vosu 1.1.0.** Profiles group per-overlay values while package schemas stay shared.

| Method + path                                                            | Input                 | Response                                                                                            |
| ------------------------------------------------------------------------ | --------------------- | --------------------------------------------------------------------------------------------------- |
| `GET /api/counters/profiles`                                             | None                  | Initially `{"active":"default","profiles":["default"]}`                                             |
| `POST /api/counters/profiles` <Badge type="warning" text="management" /> | One JSON action below | Updated registry on success; HTTP 200 `{"error":"..."}` on domain errors, including unknown actions |

| Action                    | JSON body                                                                               |
| ------------------------- | --------------------------------------------------------------------------------------- |
| Create empty profile      | `{"action":"create","name":"stream"}`                                                   |
| Create by copying         | `{"action":"create","name":"stream","copyFrom":"default"}`                              |
| Rename                    | `{"action":"rename","name":"stream","target":"live"}`                                   |
| Delete                    | `{"action":"delete","name":"live"}`                                                     |
| Activate globally         | `{"action":"activate","name":"stream"}`                                                 |
| Copy one overlay's values | `{"action":"copyOverlay","name":"counter-folder","source":"default","target":"stream"}` |

POST requires exact-origin provenance or an API key with `profiles:manage`, and uses the same body limits as other management writes. Names are case-sensitive references but case-insensitively unique: 1–48 ASCII letters, digits, `_` or `-`. At most 32 profiles including reserved `default` are allowed. `default` cannot be renamed/deleted; deleting the active profile selects `default`.

`GET /api/counters/settings/<name>?profile=stream` keeps the existing `{"settings":[...],"values":{...}}` response. POST to that URL accepts the usual `[{"uniqueID":"field","value":...}]` and returns `{"result":"success"}`. Omit `profile` to use the global active profile. Explicit unknown profiles return a JSON error, not a write to a fallback profile. `update=yes` still edits the **shared** developer schema for every profile.

`default` keeps `<config>/settings/<counter>.settings.values.toml`; other profiles use `<config>/settings/profiles/<profile>/<counter>.settings.values.toml`. `<config>/settings/profiles.json` stores the names and active selection; files are atomically replaced within their own directory. Missing overlay values use schema defaults, never another profile's saved values.

`/settings?overlay=<name>&profile=<p>` opens the inline overlay editor for a profile; without `profile`, it uses the active profile. It and the dashboard card editor share profile selection, creation/copying, rename, deletion, global activation, title/description/ID search, and header navigation (absent for schemas with no headers). Matching sections retain their headers. This is the supported settings embedding surface for vosulay.

For an individual overlay page, use [`?vosuProfile=<name>`](/vosu/dev/counter-packages#per-instance-settings-profiles), not the editor's `profile` query. The injected qualified `COUNTER_PATH` selects the profile in [commands sockets](/vosu/dev/websocket-api#profile-aware-commands). Activating profiles refreshes unpinned clients; saving/copying values refreshes clients pinned to that profile and unpinned clients when it is active.

## Reports and updates

| Method + path                                                                                               | Input             | Response                                                         |
| ----------------------------------------------------------------------------------------------------------- | ----------------- | ---------------------------------------------------------------- |
| `POST /api/generateReport` <Badge type="tip" text="vosu only" /> <Badge type="warning" text="management" /> | None; body unused | 200 HTML attachment (diagnostic report); 500 JSON error          |
| `POST /api/runUpdates` <Badge type="tip" text="vosu only" /> <Badge type="warning" text="management" />     | None; body unused | 200 JSON `status`: `updated`, `latest`, or `noFiles`; or `error` |

Report generation is serialized (one active report). It escapes inserted machine/configuration/counter/log data. Logs: ten newest files, at most 1 MiB/10,000 content lines each, and 8 MiB/100,000 lines overall, with truncation notices. A report can contain private diagnostics; never generate or export one silently from an overlay.

Externally managed installs return a 200 JSON `error` instead of replacing the binary. Updated responses are flushed before the deferred replacement. These POST methods intentionally differ from tosu's GET routes.

## Implementation sources

- [Exact route classifier](https://github.com/shiruviaa/vosu/blob/main/src/server/routes.rs)
- [Production handlers](https://github.com/shiruviaa/vosu/blob/main/src/server/service/routing.rs), [responses](https://github.com/shiruviaa/vosu/blob/main/src/server/service/responses.rs)
- [Files and ranges](https://github.com/shiruviaa/vosu/blob/main/src/server/files.rs), [pages](https://github.com/shiruviaa/vosu/blob/main/src/server/pages.rs)
- [Legacy calculator DTO](https://github.com/shiruviaa/vosu/blob/main/src/calculation/engine.rs)
