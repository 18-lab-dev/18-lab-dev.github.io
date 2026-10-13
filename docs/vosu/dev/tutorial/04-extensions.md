---
title: "4. Use richer fields"
description: "Use all inputs and richer timing without breaking a tosu overlay."
---

# 4. Use richer fields

The HUD already implements these fallbacks in `render()`. Do not detect a server
brand and assume every extension is present: check each field independently.

| Pointer                    | vosu path                                                                               | Fallback                                                                                                 |
| -------------------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `/keys`                    | `keys.all`: ordered inputs with `name`, `isPressed`, `count`, `pressedAt`, `releasedAt` | `keys.k1`, `k2`, `m1`, `m2`; upstream tosu supplies them via precise v2.                                 |
| `/play/pressHitErrors`     | Note-press timing array                                                                 | `/play/hitErrorArray` only when the extension is absent.                                                 |
| `/play/releaseHitErrors`   | osu!mania hold-note release timing array                                                | No equivalent; show a dash rather than inventing releases.                                               |
| `/beatmap/stats/hitWindow` | Optional `miss`, `meh`, `ok`, `good`, `great`, `perfect` judgement boundaries           | Available in both published v2 schemas; show a dash when the relevant boundary is absent or nonpositive. |

<Badge type="tip" text="vosu only" /> `keys.all` and separate press/release arrays
are optional additions in the published source used here. `beatmap.stats.hitWindow`
is shared with tosu, not a vosu-only extension.

## Preserve meaning, not just display continuity

- A **present but empty** `pressHitErrors` array means no classified presses. Do not
  substitute the combined legacy array, which may include releases.
- Timing arrays carry milliseconds; the HUD displays their latest value, not an average.
  Hold-release classification can lag the legacy array while evidence is pending.
- Input edge timestamps are nullable gameplay milliseconds. A count increase may expose
  missed complete taps without exposing an edge timestamp. Do not fabricate those times.
- Hit windows are maximum absolute timing errors after clock rate adjustment. Fields can
  be omitted; an unavailable map yields an empty object. Catch's zero timing windows
  are not spatial catcher widths. This HUD displays only a positive `great` boundary.
- Choosing `keys.all` when nonempty lets the same HUD show mode-specific input names.
  The compatibility quartet remains the fallback when `all` is absent or empty.

::: tip Growing arrays cost more as the map goes on
Selecting `/play/hitErrorArray` or either press/release array selects the **whole array**,
so every new hit resends its full history. That is fine for a starter HUD that only shows
the latest value. For long maps or a real hit-error bar, switch to the sliding-window
selection described in [performance: bound growing histories](/vosu/dev/performance#advanced-bound-growing-histories).
:::

See [vosu extensions](/vosu/dev/vosu-extensions) and [schema](/vosu/dev/schema).
The source contracts are [vosu v2](https://github.com/shiruviaa/vosu/blob/main/src/model/api/v2.rs)
and [tosu v2](https://github.com/tosuapp/tosu/blob/master/packages/tosu/src/api/types/v2.ts).

Next: [declare settings](/vosu/dev/tutorial/05-settings).
