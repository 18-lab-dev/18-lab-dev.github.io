---
title: Benchmarks against tosu
description: vosu 1.0.0 measured against the tosu 4.26.2 baseline in live osu! clients on Windows and Linux; hot paths, live readers, daemon CPU, memory, and latency.
---

<script setup>
import data from "../.vitepress/data/benchmarks-tosu-4.26.2.json";
</script>

# Benchmarks against tosu

vosu 1.0.0 against the **tosu 4.26.2** baseline, both from their published release assets, run
against live osu!stable and osu!lazer clients on Windows and Linux. **Lower is better** on every
chart. The `tosu / vosu` chip is tosu's value divided by vosu's: above 1× means vosu used less
time or memory, below 1× means tosu did.

These numbers come from vosu's maintained
[benchmark guide](https://github.com/shiruviaa/vosu/blob/9c47ccb/docs/testing/benchmarks.md#100-against-tosu-4262-in-live-clients--2026-10-11)
(section "1.0.0 against tosu 4.26.2 in live clients", 2026-10-11, vosu commit `9c47ccb`). That
guide holds the full tables, method, and caveats; this page charts every measured value from it.

## Setup

| Item              | Details                                                                                                                                                                                      |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Releases**      | vosu `v1.0.0` and tosu `v4.26.2` release assets, fresh per-run copies                                                                                                                        |
| **Settings**      | `POLL_RATE` 150, `PRECISE_DATA_POLL_RATE` 10, pp calculation and key overlay on, loopback-only listeners, automatic updates off, tosu's in-game overlay off, warmed vosu lazer offsets cache |
| **Workload**      | One silent 25-minute map with 6001 circles, played by Autoplay in the osu! ruleset on lazer `2026.1005.0` and stable `b20260924.1`                                                           |
| **Host**          | Ryzen 9 9950X3D, RTX 5090 passed through to one guest at a time                                                                                                                              |
| **Windows guest** | Windows 11 IoT Enterprise LTSC 26100, 8 logical processors                                                                                                                                   |
| **Linux guest**   | Arch Linux, `linux-zen` 7.1.4, 8 vCPUs pinned to the V-cache CCD, 24 GiB; clients on headless labwc (Vulkan) through Xwayland; stable through osu-winello's Wine 11.8 Staging                |

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
- Linux stable (Wine) has one vosu invocation and no tosu run. The tosu harness's own guard
  requires a 32-bit process, and osu-winello's Wine reported `osu!.exe` as 64-bit. That guard
  belongs to the harness, not to tosu.
:::

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
- No tosu head-to-head ran on Linux stable (Wine); see live readers above.
:::

## Hot paths

Measured on idle guests before any client started. vosu used Criterion on the release commit. The
tosu harness gives each case at least 3 s of warm-up and 100 equally weighted samples of about
50 ms, reporting the mean; that is Criterion-like, not Criterion. Bars are means per iteration.
Each chart has its own scale.

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
[benchmark guide](https://github.com/shiruviaa/vosu/blob/9c47ccb/docs/testing/benchmarks.md#reproduce).
The tosu-side harness lives outside the vosu repository; it bundles tosu commit `b21b452` with
benchmark entry points that call the unchanged production functions. Launch identities, collector
configurations, per-window samples, and reader logs are kept with the measurement evidence.
