---
title: Benchmarks against tosu
description: vosu measured against the tosu 4.26.2 baseline in live osu! clients on Windows and Linux, including osu!stable under Wine; hot paths, live readers, daemon CPU, memory, and latency.
---

<script setup>
import data from "../.vitepress/data/benchmarks-tosu-4.26.2.json";
import paired from "../.vitepress/data/benchmarks-1.1.0-paired.json";
</script>

# Benchmarks against tosu

vosu **1.1.0** (`c791512`) against the **tosu 4.26.2** baseline, run against live
osu!stable and osu!lazer clients on Windows and Linux. **Lower is better** on every chart. The
`tosu / vosu` chip is tosu's value divided by vosu's: above 1× means vosu used less time or memory,
below 1× means tosu did.

These numbers come from the "Released tosu comparison" section of vosu's maintained
[benchmark guide](https://github.com/18-lab-dev/vosu/blob/a2e3358/docs/testing/benchmarks.md#released-tosu-comparison)
(guide commit `a2e3358`). Live readers and daemon measurements were rerun on **2026-10-17**
with the 1.1.0 release commit; the separately labeled hot paths retain their latest 2026-10-11
vosu `v1.0.0` measurements. A rerun replaces its rows; earlier results remain in Git history.

## 1.1.0: before and after

These charts compare the 1.0.2 code (`5b855e1`, benchmark prerequisites only, no optimization)
with the 1.1.0 release commit `c791512` on **Linux and native Windows**, measured on 2026-10-17.
Builds ran alternately for three rounds, pinned to vCPU 2, with no client or daemon running.
Bars are medians of three Criterion means; ranges span them. The precise reader is the median
of fifteen invocations. The chip is the speedup since 1.0.2.

Criterion used 2 s warm-up, 20 s measurement and 60 samples. The 1.0.2 filtered harness overrides
these with 1 s warm-up, 2 s measurement and 10 samples; 1.1.0 uses the requested options.
Linux used default release features; Windows used MSVC and `--no-default-features`.
See the [paired method](https://github.com/18-lab-dev/vosu/blob/a2e3358/docs/testing/benchmarks.md#performance-changes-for-110-paired).

<BenchChart v-for="chart in paired.charts" :key="chart.id" :chart="chart" />

::: details What changed, and what these numbers don't show
- **Regular reader:** batching reads whole spans rather than individual fields. Linux fixtures
  make 21–72 backend calls per capture instead of 135–314 (lazer gameplay: 28 calls / 5,418
  bytes against 268 / 1,889). This requests more bytes while making far fewer calls.
- **Windows batching:** `read_many` issues one `ReadProcessMemory` per run of ascending requests
  within a 4 KiB page, including gaps, plus a read for any short suffix. A backend call may
  still make several native reads; native read counts were not measured. The regular-reader
  synthetic harness is Linux-only; the live Windows rows below measure the combined effect.
- **Filtered WebSocket fan-out:** production projection and in-process fan-out use changing
  snapshots, a paused Tokio clock and reference byte comparisons. Identical ordered filter
  plans share a broadcast-pass cache (at most 64 variants / 1 MiB); properties shared across
  distinct plans have a work budget.
- **HTTP:** the HTTP path was not optimized; the microbenchmarks are 2–6% slower on both
  platforms, within or near their ranges. New-connection Windows requests cost about 360–370 µs.
- These are synthetic fixtures, not live clients, network transport, or whole-daemon CPU and
  memory. The live measurements below are separate runs.
:::

<BenchChart :chart="paired.calls" />

## Setup

| Item              | Details                                                                                                                                                                                                                                                                               |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Builds**        | vosu 1.1.0 `c791512`, built with Rust 1.96.1 and each platform's release features; tosu `v4.26.2` published assets; fresh per-run copies                                                                                                                                              |
| **Settings**      | `POLL_RATE` 150, `PRECISE_DATA_POLL_RATE` 10, pp calculation and key overlay on, loopback-only listeners, automatic updates off, tosu's in-game overlay off, warmed vosu lazer offsets cache; `ENABLE_HIT_OFFSETS` and `ENABLE_MANIA_KEY_HIT_ERRORS` off except the explicit cost run |
| **Workload**      | One silent 25-minute map with 6001 circles, played by Autoplay in the osu! ruleset on lazer `2026.1005.0` and stable `b20260924.1`                                                                                                                                                    |
| **Host**          | Ryzen 9 9950X3D, RTX 5090 passed through to one guest at a time                                                                                                                                                                                                                       |
| **Windows guest** | Windows 11 IoT Enterprise LTSC 26100, 8 logical processors                                                                                                                                                                                                                            |
| **Linux guest**   | Arch Linux, `linux-zen` 7.1.4, 8 vCPUs pinned to the V-cache CCD, 24 GiB; clients on headless labwc (Vulkan) through Xwayland; osu!stable through osu-winello's Wine 11.8 Staging, with vosu and tosu running as native Linux processes outside the Wine prefix                       |

## Live readers

Each reader attached directly to the playing client with no daemon running, alternating vosu and
tosu for five invocations each. A bar is the median of the five invocation medians; the range in
parentheses spans those medians. Setup time is excluded from the cycle times and charted
separately.

<BenchChart v-for="chart in data.liveReaders" :key="chart.id" :chart="chart" />

::: details What these runs do and don't compare
- Both readers ran their production capture paths with zero read errors in every invocation, but
  they don't read identical field sets: the cycles compare equivalent production work, not
  identical work.
- On Linux lazer, tosu's ranked-play read returned its not-ready sentinel on every regular cycle
  (counted, not an error). The cycle still continued through settings, gameplay, leaderboard, and
  user reads, 504 reads per cycle.
- Batched captures closed the Linux settings gap. Instrumented lazer captures read settings in
  9 vosu backend calls (8.3 µs) against 243 tosu API calls (67.8 µs); the regular cycle was
  24 calls (19.2 µs) against 504 (155.0 µs). Stable was 24 calls (32.2 µs) against 306
  (169.4 µs). These include instrumentation overhead, unlike the charts. The call units differ,
  neither counts syscalls, and tosu string API calls hide a second native read.
- For Linux osu!stable, the tosu harness's own 32-bit process check was relaxed: Wine runs the
  32-bit `osu!.exe` inside a 64-bit process, and tosu's instance manager doesn't make that check.
:::

**Stable precise reads:** 1.1.0 reads replay frames on every precise cycle, in batches, to
derive keys and hit errors in every ruleset. Five alternating pairs of candidate `fe3201c`
(before this change) and `c791512` measured 6.68 → 8.42 µs on Linux (**1.26×**) and
20.22 → 24.74 µs on Windows (**1.22×**). Regular cycles did not change; lazer precise is
unaffected. These are separate same-process pairs, not the tosu comparison above.

## Daemon CPU and memory

A psutil collector sampled each daemon's process tree once per second after 30 s of warm-up, for
three 45 s windows per mode. **background** mode made one `/json/v2` request at the start and
end of each window on a new connection; **consumer** mode requested `/json/v2` at 10 Hz over
keep-alive. Values are medians over the three windows. **vosu alone** ran by itself; the other
bars come from vosu and tosu running together.

<BenchChart v-for="chart in data.daemon" :key="chart.id" :chart="chart" />

::: details Reading these numbers
- CPU is a percentage of one logical core.
- Resident memory is the Windows working set or the Linux resident set.
- Private memory is Windows private commit or Linux `Private_Clean + Private_Dirty +
  Private_Hugetlb`, so it is not comparable across platforms.
- Background latency covers only two cold requests per window, each on a new connection, so it
  mostly measures connection setup.
- tosu 4.26.2 publishes empty play data for osu-winello osu!stable when it isn't started from the
  osu! folder: it resolves Wine's `D:\osu!.exe` command line against its own working directory and
  can't open the map. The Linux osu!stable rows started tosu from the osu! folder, without
  changing tosu.
:::

### ENABLE_HIT_OFFSETS cost

A separate Linux lazer vosu-alone run enabled `ENABLE_HIT_OFFSETS = true` before warm-up,
on a fresh Autoplay of the same map in the same process. `/json/v2` published 432 hit-offset
entries at the start and 5,853 at the end; all six windows were accepted.

| Linux lazer, vosu alone            | Mode       |   CPU |     RSS | Private | `/json/v2` latency |
| ---------------------------------- | ---------- | ----: | ------: | ------: | -----------------: |
| `ENABLE_HIT_OFFSETS` off (default) | background | 0.89% | 37.1 MB | 33.3 MB |            0.56 ms |
| `ENABLE_HIT_OFFSETS` on            | background | 0.91% | 37.2 MB | 33.4 MB |            0.69 ms |
| `ENABLE_HIT_OFFSETS` off (default) | consumer   | 0.96% | 38.5 MB | 34.7 MB |            0.24 ms |
| `ENABLE_HIT_OFFSETS` on            | consumer   | 1.16% | 38.9 MB | 35.0 MB |            0.39 ms |

Enabling it adds precise-reader offset reads and the growing whole offset list to every
`/json/v2` response. The consumer difference was not split between those costs. These
vosu-alone memory values are separate from the simultaneous-daemon charts.

## Hot paths

These latest hot-path rows used vosu **v1.0.0 on 2026-10-11**, not 1.1.0, on idle guests before
any client started. vosu used Criterion on that release commit. The tosu harness gives each
case at least 3 s of warm-up and 100 equally weighted samples of about 50 ms, reporting the
mean; that is Criterion-like, not Criterion. Bars are means per iteration. Each chart has its own scale.

<BenchChart v-for="chart in data.hotPaths" :key="chart.id" :chart="chart" code />

::: details What these rows exercise
The rows exercise the closest tosu production path, not identical work:

- tosu's map calculation goes through its native lazer calculator (`0.6.1-20260729-main.0`),
  including the JavaScript bridge.
- tosu's raw-snapshot cases take error and not-ready paths on the zeroed fixture, and its lazer
  case rescans because the fixture fails its GameBase check.
- `batch_scan` calls tosu's inner scanner through an adapter, not its process-wide scan.
- tosu has no batched read API, so the read-many cases issue eight reads, and every read allocates
  a returned buffer.
- tosu's precise serializer surfaces four keys; vosu's fixture has 18. The serializer inputs
  differ in general, which is part of why `serializers_cold/v2_precise` favors tosu.
- On Windows, vosu's `serializers_cold/v1` and `stream_companion` intervals are wide (6.3–11.6 µs
  and 9.6–15.1 µs).
- `linux_process_memory` and `windows_process_memory` only exist on their own platform.
:::

## Reproduce

Commands, fixtures, and the live-reader example are in the
[benchmark guide](https://github.com/18-lab-dev/vosu/blob/a2e3358/docs/testing/benchmarks.md#reproduce).
The tosu-side harness lives outside the vosu repository; it bundles tosu commit `b21b452` with
benchmark entry points that call the unchanged production functions. Launch identities, collector
configurations, per-window samples, and reader logs are kept with the measurement evidence.
