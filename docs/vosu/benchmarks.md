---
title: Benchmarks against tosu
description: vosu benchmark results through 1.2.2, including the tosu 4.26.2 comparison, paired 1.2.0 measurements, selected-field projection costs, and controlled Windows overlays.
---

<script setup>
import data from "../.vitepress/data/benchmarks-tosu-4.26.2.json";
import paired from "../.vitepress/data/benchmarks-1.1.0-paired.json";
</script>

# Benchmarks against tosu

vosu against the **tosu 4.26.2** baseline, with separately dated paired and overlay
measurements through **1.2.2**. **Lower is better** on every comparison chart. The
`tosu / vosu` chip is tosu's value divided by vosu's: above 1× means vosu used less time or memory,
below 1× means tosu did.

The [benchmark guide](https://github.com/18-lab-dev/vosu/blob/fe080ce/docs/testing/benchmarks.md#released-tosu-comparison)
(guide commit `fe080ce`, vosu v1.2.2) is the source. Current Windows stable
live-client results use vosu **1.2.0** (`774fd0f`), measured **2026-10-25** alongside
1.1.0 (`c791512`). Linux live-client rows retain **1.1.0** (`c791512`), measured
**2026-10-17**; the separate tosu hot-path comparison retains **v1.0.0**, measured
**2026-10-11**. Reruns replace their rows; earlier results remain in Git history.
Windows lazer has no current live result and its superseded rows are not shown.

## 1.1.0: before and after

These charts compare the 1.0.2 code (`5b855e1`, benchmark prerequisites only, no optimization)
with the 1.1.0 release commit `c791512` on **Linux and native Windows**, measured on 2026-10-17.
Builds ran alternately for three rounds, pinned to vCPU 2, with no client or daemon running.
Bars are medians of three Criterion means; ranges span them. The precise reader is the median
of fifteen invocations. The chip is the speedup since 1.0.2.

Criterion used 2 s warm-up, 20 s measurement and 60 samples. The 1.0.2 filtered harness overrides
these with 1 s warm-up, 2 s measurement and 10 samples; 1.1.0 uses the requested options.
Linux used default release features; Windows used MSVC and `--no-default-features`.
See the [paired method](https://github.com/18-lab-dev/vosu/blob/fe080ce/docs/testing/benchmarks.md#performance-changes-for-110-paired).

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

## 1.2.0: before and after

Measured **2026-10-25**: 1.1.0 `c791512` versus final 1.2.0 `77080cd`
(production-code-identical to Windows-tested `774fd0f`, including `a44183b`).
This table retains every paired result and its change column; positive change is slower.

| Benchmark | 1.1.0 | 1.2.0 | Change | 1.1.0 range | 1.2.0 range |
| --- | ---: | ---: | ---: | ---: | ---: |
| `batch_scan/three_patterns_2mib` | 46.498 µs | 47.752 µs | +2.70% | 45.814–49.307 µs | 47.254–47.972 µs |
| `linux_process_memory/current_process_64_bytes` | 254.575 ns | 249.187 ns | -2.12% | 245.844–255.168 ns | 247.137–249.667 ns |
| `map_calculation/full_difficulty_performance` | 12.197 µs | 11.936 µs | -2.14% | 11.865–12.566 µs | 11.849–12.216 µs |
| `map_calculation/gradual_all_objects` | 10.162 µs | 10.025 µs | -1.35% | 9.986–10.591 µs | 9.946–10.235 µs |
| `map_calculation/parse` | 1.609 µs | 1.553 µs | -3.50% | 1.559–1.624 µs | 1.539–1.584 µs |
| `map_calculation/unchanged_cache_key` | 10.079 ns | 10.140 ns | +0.61% | 10.074–10.197 ns | 10.130–10.352 ns |
| Lazer precise capture | 9.382 µs | 8.842 µs | -5.76% | 8.651–9.446 µs | 8.680–8.952 µs |
| Stable idle decoder | 308.350 ns | 278.410 ns | -9.71% | 280.660–310.750 ns | 271.190–282.350 ns |
| Stable key-overlay decoder | 247.480 ns | 234.410 ns | -5.28% | 234.750–250.320 ns | 233.060–242.160 ns |
| `publication/unfiltered_clients/1` | 2.0057 ms | 2.0070 ms | +0.07% | 2.0055–2.0063 ms | 2.0066–2.0072 ms |
| `publication/unfiltered_clients/100` | 2.0105 ms | 2.0109 ms | +0.02% | 2.0094–2.0117 ms | 2.0087–2.0143 ms |
| `publication/unfiltered_clients/1000` | 2.0460 ms | 2.0492 ms | +0.15% | 2.0414–2.0476 ms | 2.0443–2.0521 ms |
| `raw_snapshot_reads/lazer_regular_fields` | 9.885 µs | 10.725 µs | +8.50% | 9.871–9.890 µs | 10.536–10.900 µs |
| `raw_snapshot_reads/stable_regular_fields` | 81.707 ns | 80.965 ns | -0.91% | 77.419–83.869 ns | 80.018–83.753 ns |
| `serialization_cache/stream_companion_bytes_clone` | 13.081 ns | 12.645 ns | -3.34% | 12.780–13.536 ns | 12.643–13.404 ns |
| `serialization_cache/v1_bytes_clone` | 12.791 ns | 12.659 ns | -1.03% | 12.742–12.871 ns | 12.643–12.869 ns |
| `serialization_cache/v2_bytes_clone` | 13.086 ns | 12.644 ns | -3.38% | 12.789–13.492 ns | 12.642–13.452 ns |
| `serialization_cache/v2_precise_bytes_clone` | 13.080 ns | 12.648 ns | -3.30% | 12.780–13.576 ns | 12.647–13.401 ns |
| `serializers_cold/stream_companion` | 4.405 µs | 1.661 µs | -62.28% | 4.264–4.556 µs | 1.621–1.663 µs |
| `serializers_cold/v1` | 3.976 µs | 1.439 µs | -63.79% | 3.910–3.990 µs | 1.435–1.464 µs |
| `serializers_cold/v2` | 5.367 µs | 2.892 µs | -46.11% | 5.228–5.416 µs | 2.839–3.040 µs |
| `serializers_cold/v2_precise` | 3.599 µs | 1.168 µs | -67.56% | 3.399–3.602 µs | 1.158–1.172 µs |
| `v2_subscription/distinct_plans/1` | 7.676 µs | 7.473 µs | -2.64% | 7.504–8.039 µs | 7.469–7.508 µs |
| `v2_subscription/distinct_plans/100` | 14.698 µs | 14.314 µs | -2.61% | 14.408–15.273 µs | 14.243–14.700 µs |
| `v2_subscription/distinct_plans/1000` | 81.320 µs | 82.628 µs | +1.61% | 80.978–84.454 µs | 81.678–84.289 µs |
| `v2_subscription/shared_plan/1` | 7.785 µs | 7.462 µs | -4.15% | 7.326–8.053 µs | 7.431–7.534 µs |
| `v2_subscription/shared_plan/100` | 12.922 µs | 12.622 µs | -2.33% | 12.690–13.592 µs | 12.614–12.717 µs |
| `v2_subscription/shared_plan/1000` | 58.176 µs | 57.901 µs | -0.47% | 57.575–62.336 µs | 57.856–60.150 µs |

::: details Method and limits
This is the **Ryzen 9 9950X3D host**,
not the Linux guest used in the 1.1.0 paired section; absolute numbers
are not comparable with that earlier section.
Kernel `7.2.10-1-cachyos-bore`, Rust 1.96.1 (`31fca3adb`), performance
governor, boost enabled, default release features, `--locked`; VM off.

Both targets alternated 1.1.0→1.2.0 for three rounds per side, all processes
pinned with `taskset -c 15` on the frequency CCD (32 MiB L3, CPUs
8–15/24–31), not the 96 MiB V-cache CCD. **No pkexec, CPU/IRQ isolation,
cpuset restrictions or boot `isolcpus` were used.** Sibling 31 was unused
by us but other system work could run on either CPU. Conclusions depend
on the paired alternation, not absolute stability. This supersedes the
earlier partial regression-fix measurements.

The runner waited for one-minute host load below 1.0 before each side's round;
five/fifteen-minute loads could remain higher. Builds completed before timing,
using independent target and Criterion directories without shared baselines.
Criterion used 2 s warm-up, 20 s measurement and 60 samples. Values are medians
of three arithmetic means; ranges span those means, not confidence intervals.
The three deterministic-reader metrics summarize three invocation medians of
nine sample means. Both sources have the same 25 Criterion IDs and three reader metrics;
selected-field scheduling is not a separate ID or an unmeasured speedup.

Cold serializers are **46.11–67.56% faster**, with disjoint ranges, but their
owned closures include snapshot destruction: these are not pure encoder timings.
Subscription changes span -4.15% to +1.61%, all with overlapping ranges.
The raw lazer fixture's **+8.50%** is retained: it fails root validation before
new field reads. Follow-up placement controls collapsed the gap; it is not
attributed to added reader work, nor evidence that new fields are free in live captures.
The populated deterministic reader's apparent 5.28–9.71% gains have overlapping
ranges and do not establish resolved improvements.
See the [full method and placement controls](https://github.com/18-lab-dev/vosu/blob/fe080ce/docs/testing/benchmarks.md#performance-changes-for-120-paired).
:::

## Setup

| Item              | Details                                                                                                                                                                                                                                                                               |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Builds** | Windows stable: vosu 1.1.0 `c791512` and 1.2.0 `774fd0f`, native MSVC with `--no-default-features`; retained Linux: 1.1.0 `c791512`, default release features; Rust 1.96.1; tosu `v4.26.2` published assets; fresh per-run copies |
| **Settings**      | `POLL_RATE` 150, `PRECISE_DATA_POLL_RATE` 10, pp calculation and key overlay on, loopback-only listeners, automatic updates off, tosu's in-game overlay off, warmed vosu lazer offsets cache; `ENABLE_HIT_OFFSETS` and `ENABLE_MANIA_KEY_HIT_ERRORS` off except the explicit cost run |
| **Workload**      | One silent 25-minute map with 6001 circles, played by Autoplay in the osu! ruleset on lazer `2026.1005.0` and stable `b20260924.1`                                                                                                                                                    |
| **Host**          | Ryzen 9 9950X3D, RTX 5090 passed through to one guest at a time                                                                                                                                                                                                                       |
| **Windows guest** | Windows 11 IoT Enterprise LTSC 26100, 8 logical processors; stable `b20260924.1`, Autoplay (AT only), 1× speed. Live lazer was not measured for 1.2.0: current and older copied clients crashed in this VM, including OpenGL/Direct3D11 trials. Synthetic fixtures do not close that gap. |
| **Linux guest**   | Arch Linux, `linux-zen` 7.1.4, 8 vCPUs pinned to the V-cache CCD, 24 GiB; clients on headless labwc (Vulkan) through Xwayland; osu!stable through osu-winello's Wine 11.8 Staging, with vosu and tosu running as native Linux processes outside the Wine prefix                       |

## Live readers

Each reader attached directly to the playing client with no daemon running. Windows
stable used five triples, alternating 1.1.0→1.2.0→tosu and reverse order against
the same game, without CPU pinning. Linux retains five alternating vosu/tosu
invocations per client. Each invocation used 100 warm-up cycles, then nine samples
of 1,000 (vosu) or 100 (tosu) cycles. Values are medians of five invocation medians;
ranges span those medians. Setup is excluded; only retained Linux setup is charted.
All 15 current Windows invocations had zero read errors and not-ready counts.

| Windows stable | Regular cycle | Precise cycle |
| --- | ---: | ---: |
| vosu 1.1.0 | 152.285 µs (150.958–165.797) | 27.906 µs (26.974–29.275) |
| vosu 1.2.0 | 157.412 µs (155.088–164.594) | 27.729 µs (27.553–28.283) |

Windows 1.2.0 changes are +3.37% regular and -0.64% precise versus 1.1.0,
with overlapping invocation ranges; no statistically significant change is established.
The following Windows rows use 1.2.0; all Linux rows use 1.1.0.

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

A psutil collector sampled each daemon's process tree once per second after 30 s
warm-up, for three 45 s windows per mode. **background** made only boundary
`/json/v2` requests on new connections; **consumer** requested at 10 Hz over
keep-alive. Values are medians over three windows. Windows ranges span window
values; Windows RSS/private are window means in **MiB**, not the retained Linux **MB**.
Windows campaigns were not claimed CPU-pinned. The game process is excluded.

Windows comparison rows below use **1.2.0**. The background CPU chart includes
its separate vosu-alone run; Windows consumer rows are **vosu alone**, with no
concurrent tosu consumer campaign included. The full accepted Windows campaign
also records the 1.1.0 baseline and vosu-alone memory/latency:

| Stable live campaign | Product | CPU, % one core | RSS, MiB | Private commit, MiB | API latency, ms |
| --- | --- | ---: | ---: | ---: | ---: |
| 1.1 alone, background | vosu 1.1 | 1.91 (1.77–1.91) | 48.69 (48.24–48.80) | 13.94 (13.52–14.05) | 20.066 (2.755–23.961) |
| 1.2 alone, background | vosu 1.2 | 1.56 (1.32–1.63) | 49.11 (49.02–49.13) | 14.42 (14.14–14.43) | 15.786 (2.932–22.638) |
| 1.1 alone, consumer | vosu 1.1 | 2.22 (1.84–2.43) | 49.19 (48.88–49.50) | 14.58 (14.42–14.89) | 0.469 (0.449–0.508) |
| 1.2 alone, consumer | vosu 1.2 | 2.15 (2.01–2.29) | 49.16 (48.96–49.76) | 14.59 (14.49–15.29) | 0.451 (0.438–0.462) |
| 1.1 + tosu, background | vosu 1.1 | 1.60 (1.25–2.53) | 49.76 (49.35–49.85) | 15.18 (15.13–15.45) | 8.812 (4.939–10.788) |
| 1.1 + tosu, background | tosu 4.26.2 | 1.87 (1.74–2.22) | 145.76 (144.95–146.35) | 129.94 (129.25–130.84) | 7.515 (7.139–8.260) |
| 1.2 + tosu, background | vosu 1.2 | 1.46 (1.35–1.94) | 48.03 (48.00–48.11) | 13.24 (13.18–13.31) | 7.994 (7.458–8.574) |
| 1.2 + tosu, background | tosu 4.26.2 | 1.84 (1.39–2.33) | 143.16 (142.77–143.62) | 126.01 (124.98–126.60) | 5.465 (5.385–16.826) |

These eight product rows come from six accepted invocations. Rejected campaigns
are excluded in full. Background latency has too few samples to represent sustained
consumer latency. Linux chart rows retain **1.1.0**: vosu alone ran separately;
the other Linux values come from vosu and tosu running together.

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

These latest tosu-comparison hot-path rows used vosu **v1.0.0 on 2026-10-11**, not 1.2.x, on idle guests before
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

## 1.2.2: selected-field projection and overlay evidence

### Selected-field projection cost

The [projection experiment](https://github.com/18-lab-dev/vosu/blob/fe080ce/docs/testing/benchmarks.md#selected-field-projection-cost)
measured **2026-10-27** Linux process CPU using the same optimized 1.2.1-derived
binary, switching only its former full-document algorithm for selection-pruned
projection. Recorded state held 7,488 combined, 5,042 press and 2,446 release errors.
Twelve clients shared three plans: keys/time/context, visualizer settings/context,
and an intentionally expensive complete combined-history selector. Publications
were requested every 1 ms. Three alternating-order rounds measured three seconds
per case, pinned to CPU 15, with private HOME/XDG directories. Values are medians;
CPU is percent of one core from the child process's own user+system time.

| Histories | Full-document CPU % | Selected CPU % | Full, microseconds per document | Selected, microseconds per document |
| --- | ---: | ---: | ---: | ---: |
| Recorded | 70.347 | 42.915 | 719.709 | 440.719 |
| Empty control | 4.046 | 2.895 | 40.987 | 29.483 |

This removes **39.0%** of process CPU with recorded histories (**38.8%** per document).
Every run sent exactly 12 initial frames and no updates; both algorithms sent
103,516 total bytes with recorded histories and 4,744 with empty histories.
The saving is publication work with unchanged selected values, not reduced delivery.
Maintained synthetic cases cover keys/time, complete histories, individual indices
and whole-document selection with empty and 7,500-entry histories; whole-document
iterations use fresh snapshots to prevent schema-cache reuse from hiding work.

The whole-document copy/normalization path already existed in 1.1.0. These results
**do not establish a 1.2-only regression**, explain or fix renderer frame drops,
or measure whole-daemon/native-game improvement. Recorded payloads and the
standalone collector remain local investigation evidence, not repository fixtures.

::: details Selected-field scheduling is a separate measurement
The [2026-10-23 cadence fixture](https://github.com/18-lab-dev/vosu/blob/fe080ce/docs/testing/benchmarks.md#selected-field-reader-cadence-2026-10-23)
uses real subscriptions and worker/reducer scheduling with a synthetic reader,
not process discovery or live attachment. Each case warms up for 250 ms and
measures five seconds; regular/precise intervals are 150/10 ms, debounce 1 ms.
CPU comes from `CLOCK_PROCESS_CPUTIME_ID`, as percent of one core.

| Established selection | Regular captures/s | Precise captures/s | CPU seconds | CPU % |
| --- | ---: | ---: | ---: | ---: |
| None | 6.598 | 98.776 | 0.026204 | 0.524 |
| `/settings/mode`, `/client`, `/folders/skin`, `/beatmap/checksum` | 6.599 | 99.591 | 0.029537 | 0.591 |
| `/keys`, play context | 6.598 | 967.241 | 0.088958 | 1.778 |
| Empty pointer (whole document) | 923.627 | 963.020 | 0.150711 | 3.014 |

Slow selection leaves both readers at baseline; precise-only selection accelerates
only its producing lane. Whole-document selection is an all-lanes control, **not a
historical binary**. These are one local run's synthetic costs, not native memory
reads, live pp, whole-daemon or rendering results. The small no-subscriber/slow
CPU difference does not establish a meaningful regression. No live-game CPU
improvement or guaranteed 1 kHz delivery is claimed.
:::

### Controlled Windows overlay comparison (2026-10-27)

The [controlled comparison](https://github.com/18-lab-dev/vosu/blob/fe080ce/docs/testing/benchmarks.md#controlled-windows-overlay-comparison-2026-10-27)
used published vosu 1.1.0/1.2.0/1.2.1 with identical isolated copies, settings,
ports and a deterministic osu!stable mania Autoplay map. The real beatmap renderer
retained its 360 fps setting; the EZ2ON Key Visualizer retained 60 fps. Separate
profiles and private daemon HOME/data directories left running user apps unchanged.

The virtual display advertised 2560x1440 at 180 Hz, but **180 Hz presentation was
not established**. A separate five-second DWM probe measured 118.6 waits/s
(p50/p95/p99 8.539/9.151/9.726 ms); Chrome animation probes varied with capture state.
The page results describe observed producer cadence, not a successful 180 fps test.
Two 30-second Chrome 156 windows per version measured daemon process CPU and rAF;
raw-endpoint collectors were disconnected during these windows.

| vosu | CPU %, two windows | Renderer rAF/s, two windows | Renderer rAF p50/p95/p99, ms, second window |
| --- | --- | --- | --- |
| 1.1.0 | 14.91 / 15.27 | 127.63 / 127.61 | 7.69 / 8.44 / 8.68 |
| 1.2.0 | 14.25 / 14.05 | 127.55 / 127.52 | 7.80 / 8.57 / 8.68 |
| 1.2.1 | 13.45 / 13.25 | 128.02 / 128.17 | 7.72 / 8.20 / 8.61 |

No page errors or main-thread long tasks were recorded. The visualizer drew
1,799–1,800 distinct timestamps per window, consistent with its 60 fps setting.
Actual selected-field sockets delivered 3,697 / 3,749 / 3,775 messages in the second
windows, approximately 467 / 484 / 482 kB per page. Over 30 seconds visualizer JSON
parsing used 15.4 / 13.9 / 14.7 ms; renderer-worker parsing used
20.68 / 19.40 / 20.01 ms. These pages did not receive complete precise histories.

Separate matched 60–90 second Autoplay phases added raw V2 and precise clients:

| vosu | V2 messages/s | V2 interarrival p50/p95/p99, ms | Precise messages/s | Precise interarrival p50/p95/p99, ms |
| --- | ---: | --- | ---: | --- |
| 1.1.0 | 14.43 | 101.28 / 104.18 / 108.47 | 87.44 | 15.55 / 16.35 / 16.85 |
| 1.2.0 | 15.50 | 101.11 / 103.54 / 104.61 | 91.46 | 15.52 / 16.31 / 16.85 |
| 1.2.1 | 14.26 | 101.25 / 103.65 / 108.43 | 100.91 | 15.46 / 16.21 / 16.74 |

Complete precise traffic was 21.01 / 21.31 / 23.79 MB per 30 seconds. Message counts
include short extra intervals and are **not a uniform polling period**. This
controlled stable workload shows no worsened 1.2.x producer cadence or page
CPU/parse bottleneck; it does not invalidate reported Linux stutter or identify
its presentation-layer cause.

The fixed vosu 1.2.1 backend also fed published vosulay 1.4.0 and 1.5.0, with the
same two overlays in a mania-bound profile, normal non-editing mode and a 180 fps
native cap. Both native versions ran from NTFS with private caches. Each row is
one 30-second page capture during the same 20–50 second Autoplay phase:

| Native host | Runtime CPU, % of one core | Renderer distinct drawing timestamps/s | Visualizer drawing timestamps/s | Positive rAF gaps p50/p95/p99, ms |
| --- | ---: | ---: | ---: | --- |
| vosulay 1.4.0 standalone | 64.14 | 153.80 | 60.00 | 5.60 / 11.10 / 11.20 |
| vosulay 1.5.0 standalone | 67.31 | 153.27 | 60.00 | 5.60 / 11.10 / 11.20 |
| vosulay 1.5.0 protocol tool-mode supervisor | 78.43 | 153.90 | 59.97 | 5.60 / 11.10 / 11.20 |

Runtime CPU includes the native host and Chromium children, not vosu or the game.
These individual windows do not establish a version/tool-mode CPU regression:
an additional 1.4.0 run measured 72.17%. The supervisor control used the published
protocol and token, not catalog installation or the full vosu ToolHost lifecycle.
Repeated zero-gap rAF timestamps and same-timestamp GPU/canvas calls are deduplicated;
counting callbacks would approximately double the rate. Draw counts are **not
swapchain presents**. No page errors or main-thread long tasks were recorded;
this does not demonstrate a 1.5.0 producer-pacing regression or accidental
in-game 30 fps editor cap.

**Actual game/present pacing remains unmeasured.** PresentMon attempts yielded no
game CSV, and native tracing provided no per-frame delivered timestamps. Neither
rAF nor the visible game fps counter substitutes for that evidence. Windows stable
results cannot establish Linux lazer or browser presentation quality, and **no
frame-drop improvement is claimed** for projection pruning.

## Reproduce

Commands, fixtures, and the live-reader example are in the
[benchmark guide](https://github.com/18-lab-dev/vosu/blob/fe080ce/docs/testing/benchmarks.md#reproduce).
The tosu-side harness lives outside the vosu repository; it bundles tosu commit `b21b452` with
benchmark entry points that call the unchanged production functions. Launch identities, collector
configurations, per-window samples, and reader logs are kept with the measurement evidence.
