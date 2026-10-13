---
title: Performance for overlay developers
description: High-yield ways to reduce telemetry parsing, DOM work, allocations, and animation overhead in OBS and vosulay overlays.
---

# Performance for overlay developers

Start with less data, fewer DOM writes, and less work per frame—not a new rendering engine. These wins apply to OBS browser sources and vosulay's in-game CEF renderer. [vosulay renders a complete profile in one transparent browser](https://github.com/shiruviaa/vosulay/blob/main/README.md#linux), so one expensive overlay can affect the others.

This guide credits **breadles5** for customHitErrorBar's pooled tick management and rendering work, and **qt715** for its animation/median improvements and the EZ2ON overlay optimizations. Snippets are shortened adaptations, not complete overlays. **Before** shows the expensive pattern; where it is illustrative rather than a historical diff, that is stated. Keep your existing reset and error handling when adapting them.

For a working starting point, use the [overlay tutorial](/vosu/dev/tutorial/). For protocol details, see the [WebSocket API](/vosu/dev/websocket-api).

## 1. Subscribe to the fields you actually use

<Badge type="tip" text="vosu only" />

JSON parsing and reconstruction happen before you can decide not to draw. Receiving a full document for a two-field counter spends bandwidth and main-thread time on unrelated state.

**Before — full-payload pattern:**

```js
const socket = new WebSocket("ws://127.0.0.1:24050/websocket/v2");
socket.onmessage = (event) => {
  const state = JSON.parse(event.data);
  updateState(state.state.number, state.play.mode.number);
};
```

**After — adapted from the EZ2ON `Subscription` client:**

```js
const socket = new WebSocket("ws://127.0.0.1:24050/websocket/v2/subscribe");
socket.onopen = () => {
  socket.send(JSON.stringify(["/state/number", "/play/mode/number"]));
};
// Decode compact frames and reconstruct the selected values here,
// using the WebSocket API guide or the source's Subscription class.
```

Do not pass these frames to a handler expecting a full v2 document. The array you send is an ordered list of RFC 6901 JSON Pointers; returned indices refer to that order.

| Detail                | Behavior                                                                                                                                                                                       |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Initial request       | One JSON array of 1–256 non-overlapping pointers, within five seconds of connecting                                                                                                            |
| Initial frame         | `[0, revision, [[index, value], ...]]`                                                                                                                                                         |
| Update frame          | `[1, revision, [[changedIndex, value], ...], [removedIndex, ...]]`                                                                                                                             |
| Missing field         | Omitted initially; removal is reported by index. This is not the same as a JSON `null`.                                                                                                        |
| Field-set change      | Open a new connection with the new selection; do not send another text request on the established socket.                                                                                      |
| Sampling and delivery | `V2_SUBSCRIPTION_DEBOUNCE` controls selected-field sampling and the minimum interval between state frames per client. Only changed selected values cause frames, carrying the latest snapshot. |

The setting defaults to **1 ms**, accepts fractional milliseconds, and ranges from **1–60000 ms**. Selected-field sampling runs while a selection is established and is never slower than the regular/precise sampling cadence. This is **not** a wait-until-input-goes-quiet debounce: continuous changes can keep producing frames at the interval. Faster sampling reruns memory reads and live pp calculation, so do not turn it down just to make a static label feel faster. HTTP and compatibility streams retain their own `POLL_RATE` / `PRECISE_DATA_POLL_RATE` cadence.

**tosu fallback:** use `/websocket/v2` and extract the same values from its full payload. The selected-field endpoint is vosu-specific; choose the backend deliberately rather than silently retrying an unsupported endpoint forever. Use `/websocket/v2/precise` only when the overlay actually needs its precise fields/cadence—not as the default for every counter. Use streams for live updates; **do not poll HTTP in a loop**. One-off snapshots are different from continuous polling.

Sources: [EZ2ON subscription client](https://github.com/qt715/EZ2ON-REBOOT-R-vosu-overlays-recreation/blob/main/ez2on-timing-bar/js/vosu.js), [vosu stream/configuration reference](https://github.com/shiruviaa/vosu/blob/main/README.md#websocket-api), [vosu delivery implementation](https://github.com/shiruviaa/vosu/blob/main/src/server/v2_subscription.rs), [subscription transport](https://github.com/shiruviaa/vosu/blob/main/src/server/service/websocket_transport.rs), and [tosu socket routes](https://github.com/tosuapp/tosu/blob/master/packages/server/router/socket.ts).

### Watch out for growing arrays

Selecting `/play/hitErrorArray` is still selecting the **whole array**: every append changes that value. Long maps therefore make every update more expensive, even if you only plot the newest hit.

**Before — qt715's timing bar selected the whole history:**

```js
const pointers = ["/play/hitErrorArray"];
```

**After — adapted from its sliding-window stream:**

```js
const ARRAY = "/play/hitErrorArray";
const WINDOW = 256;
const start = Math.max(0, length - 1);
const pointers = Array.from({ length: WINDOW }, (_, i) => `${ARRAY}/${start + i}`);
```

This is an advanced optimization for history consumers, not a replacement for a simple two-field subscription. qt715's implementation takes an initial whole-array snapshot, closes that subscription, then watches a window of indices. It opens overlapping windows before exhaustion and deduplicates their results. The **last delivered index is an anchor**: its removal/change reveals a retry that shrinks the array. Without that anchor, a selection containing only nonexistent future indices might remain silent until the new attempt outgrows the old one.

Reuse the complete [`HitErrorStream`](https://github.com/qt715/EZ2ON-REBOOT-R-vosu-overlays-recreation/blob/main/ez2on-timing-bar/js/hitErrors.js) logic rather than copying only the selector construction. Sources: qt715's [long-map fix](https://github.com/qt715/EZ2ON-REBOOT-R-vosu-overlays-recreation/commit/c6fdbbc71cbc8ba52b4c197bc6f710d50a4136ac) and [retry-anchor correction](https://github.com/qt715/EZ2ON-REBOOT-R-vosu-overlays-recreation/commit/652e23383b8e46dbd4c552cdf484744db8b5ff9b).

## 2. Pool short-lived visual elements

Repeatedly creating and removing ticks means allocating nodes and changing the DOM tree during gameplay. Allocate a bounded pool once, then reposition and reactivate an existing element.

**Before — illustrative create/remove pattern:**

```js
function plot(error) {
  const tick = document.createElement("div");
  container.appendChild(tick);
  tick.style.transform = `translateX(${error * 2}px)`;
  setTimeout(() => tick.remove(), lifetime);
}
```

**After — adapted from breadles5's tick pool:**

```js
// Once at initialization; renderTicksOnLoad attaches elements to these ticks.
const poolSize = 100;
const pool = Array.from({ length: poolSize }, () => new TickImpl());

// Only newly appended hits, not the entire history on every update.
for (let i = processedHits; i < hitErrors.length; i++) {
  const tick = pool[i % poolSize];
  if (tick.active) tick.setInactive();
  tick.setActive(hitErrors[i]);
}
processedHits = hitErrors.length;
```

The source builds the DOM nodes in a `DocumentFragment` once and assigns them to the pool. Pool size is a visual policy: wraparound can replace an active tick, so size it for the number you want visible, not the total map history. Reset `processedHits` and visual state on a new attempt.

Source: breadles5's [tick-manager commit](https://github.com/breadles5/customHitErrorBar/commit/65298b3b6890b9ce3b677e1cfa747ccb182d3944), with current [tick manager](https://github.com/breadles5/customHitErrorBar/blob/master/src/calculation/tickManager.ts) and [one-time element creation](https://github.com/breadles5/customHitErrorBar/blob/master/src/rendering/ticks.ts).

## 3. Batch visual updates with one pending animation frame

One `requestAnimationFrame` callback per incoming message can queue several updates for the same displayed frame. Keep the newest visual value and schedule at most one callback; this also avoids creating a callback for every message while one is pending.

**Before — customHitErrorBar's earlier arrow update:**

```js
function updateArrow(targetPosition) {
  requestAnimationFrame(() => {
    if (targetPosition === oldPosition) return;
    oldPosition = targetPosition;
    arrow.style.transform = `translate3d(${targetPosition * 2}px, 0, 0)`;
  });
}
```

**After — adapted from qt715's coalescing change:**

```js
let pendingPosition = null;
let frame = null;
function updateArrow(targetPosition) {
  pendingPosition = targetPosition;
  if (frame !== null) return;
  frame = requestAnimationFrame(() => {
    if (pendingPosition !== null && pendingPosition !== oldPosition) {
      oldPosition = pendingPosition;
      arrow.style.transform = `translate3d(${oldPosition * 2}px, 0, 0)`;
    }
    frame = null;
    pendingPosition = null;
  });
}
```

This throttles **drawing** to browser frames, not necessarily telemetry processing. Do not discard individual hits or key edges when replacing the pending visual value: update your event/history model first, then render it once. A score label can keep only the newest score; a hit-error plot must retain all newly received hits.

Source: qt715's [animation batching and cleanup commit](https://github.com/breadles5/customHitErrorBar/commit/de04edf49a9d84cac06f6590882bcbef5f3c3036). Browser behavior: [MDN `requestAnimationFrame`](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame).

## 4. Skip unchanged DOM writes

A draw loop does not mean every attribute changed. Compare the value before writing, particularly attributes used by CSS selectors and frequently updated transforms.

**Before — EZ2ON key visualizer:**

```js
root.dataset.direction = down ? "down" : "up";
```

**After — qt715's change:**

```js
const directionName = down ? "down" : "up";
if (root.dataset.direction !== directionName) {
  root.dataset.direction = directionName;
}
```

customHitErrorBar similarly caches the last applied X coordinate and checks class names before writing them. Apply that pattern to score text, judgement counts, colors, and settings-derived CSS—not just transforms.

Sources: qt715's [unchanged direction guard](https://github.com/qt715/EZ2ON-REBOOT-R-vosu-overlays-recreation/commit/c6fdbbc71cbc8ba52b4c197bc6f710d50a4136ac) and breadles5's [tick DOM update guards](https://github.com/breadles5/customHitErrorBar/blob/master/src/calculation/tickManager.ts).

## 5. Avoid forced layout; animate transform and opacity

A geometry read after a DOM/style write can force the browser to resolve pending layout immediately. Repeating write/read cycles during hit bursts is especially costly; transform and opacity animations avoid the geometry changes caused by properties such as `left` and `width`.

**Before — customHitErrorBar restarted a CSS animation with forced reflow:**

```js
const originalDisplay = element.style.display;
element.style.display = "none";
void element.offsetHeight;
element.style.display = originalDisplay || "";
void element.offsetHeight;
```

**After — adapted from qt715's Web Animations API replacement:**

```js
currentAnimation?.cancel();
element.style.opacity = String(tickOpacity);
element.style.visibility = "visible";
currentAnimation = element.animate([{ opacity: tickOpacity }, { opacity: 0 }], {
  duration: fadeOutDuration,
  delay: tickDuration,
  easing: "linear",
  fill: "forwards",
});
```

For movement, the tick manager writes `translate3d(...)` only when X changes. If layout measurements are necessary, collect them together before applying writes; do not use `offsetHeight` as an animation-reset mechanism. Transform/opacity are good defaults, **not a guarantee** of zero paint or GPU work: compositing depends on the actual page and renderer.

Sources: qt715's [WAAPI and reflow-removal commit](https://github.com/breadles5/customHitErrorBar/commit/228feb9859c437150abb61c0460b262d52ed6876), [tick transform implementation](https://github.com/breadles5/customHitErrorBar/blob/master/src/calculation/tickManager.ts), and [MDN's rendering waterfall/property costs](https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/Animation_performance_and_frame_rate).

## 6. Reuse scratch memory, but keep statistics honest

Copying an array to calculate a median creates temporary garbage on every update; rebuilding frame data has the same problem. Reuse scratch storage and calculate statistics when the input changes, rather than just because another frame arrived.

**Before — customHitErrorBar median:**

```js
const sorted = [...errors].sort((a, b) => a - b);
```

**After — shortened from qt715's reusable-buffer change:**

```js
let medianBuffer = []; // Outside the calculation function.
function median(errors) {
  if (errors.length === 0) return 0;
  for (let i = 0; i < errors.length; i++) medianBuffer[i] = errors[i];
  medianBuffer.length = errors.length;
  medianBuffer.sort((a, b) => a - b);
  const middle = Math.floor(errors.length / 2);
  return errors.length % 2
    ? medianBuffer[middle]
    : (medianBuffer[middle - 1] + medianBuffer[middle]) / 2;
}
```

This removes the explicit spread-copy allocation; **it does not make sorting incremental or allocation-free**, and it still copies and sorts the input. Growing/trimming JavaScript arrays and the engine's sort implementation can allocate. Do not advertise an incremental median or UR algorithm based on this patch. If you display the server's statistic, prefer receiving that field over independently recomputing it every frame.

For large numeric draw lists, qt715's EZ2ON key visualizer uses a reusable `Float32Array`: resetting the batch only sets `count = 0`, and storage grows only when capacity is exceeded. That is a better fit than allocating one object per rectangle, but not a reason to rewrite a small text counter.

Source: qt715's [median-buffer patch](https://github.com/breadles5/customHitErrorBar/commit/de04edf49a9d84cac06f6590882bcbef5f3c3036) and [EZ2ON `InstanceBatch`](https://github.com/qt715/EZ2ON-REBOOT-R-vosu-overlays-recreation/blob/main/ez2on-key-visualizer/js/renderer.js).

### Reuse frame descriptors too

Even small arrays add up when allocated every frame. In a renderer you already maintain, move reusable descriptor objects and submit arrays out of the hot loop; keep the per-frame GPU objects that the API actually requires.

**Before — EZ2ON WebGPU submission:**

```js
device.queue.submit([encoder.finish()]);
```

**After — qt715's change:**

```js
// Constructor:
this.commandBuffers = [null];
// Each frame:
this.commandBuffers[0] = encoder.finish();
device.queue.submit(this.commandBuffers);
```

The same patch reuses the render-pass descriptor and changes only the current texture view. This avoids the JavaScript wrapper allocations; it does not reuse a consumed command buffer or eliminate GPU resource costs.

Source: qt715's [trim per-frame allocations commit](https://github.com/qt715/EZ2ON-REBOOT-R-vosu-overlays-recreation/commit/652e23383b8e46dbd4c552cdf484744db8b5ff9b).

## 7. Stop old work and reconnect with backoff

Abandoned subscriptions, timers, and animation callbacks keep doing work after their widget is reset or removed. Reconnect immediately in a tight loop and a backend outage becomes another source of avoidable activity.

**Before — illustrative reconnect/lifecycle mistake:**

```js
socket.onclose = () => connect();
function close() {
  socket.close();
} // onclose opens it again.
```

**After — shortened from qt715's shared client:**

```js
function reconnectDelay(attempt) {
  return Math.min(5000, 250 * 2 ** attempt);
}
// In connect(); reset attempt to 0 in onopen.
socket.onclose = () => {
  if (this.socket !== socket) return;
  this.socket = null;
  this.timer = setTimeout(() => this.connect(), reconnectDelay(this.attempt++));
};
// Explicit disposal; nulling first suppresses this socket's reconnect.
function close() {
  clearTimeout(this.timer);
  const socket = this.socket;
  this.socket = null;
  socket?.close();
}
```

Also cancel pending rAF callbacks on reset/disposal and cancel an element's previous animation before reusing it. A completed `fill: "forwards"` animation can still control a pooled element's appearance until canceled. Cleanup should belong to the widget/subscription lifecycle, not rely solely on the browser eventually unloading the page.

Sources: qt715's [subscription `close()` change](https://github.com/qt715/EZ2ON-REBOOT-R-vosu-overlays-recreation/commit/c6fdbbc71cbc8ba52b4c197bc6f710d50a4136ac), [backoff client](https://github.com/qt715/EZ2ON-REBOOT-R-vosu-overlays-recreation/blob/main/ez2on-timing-bar/js/vosu.js), [rAF reset cleanup](https://github.com/breadles5/customHitErrorBar/commit/de04edf49a9d84cac06f6590882bcbef5f3c3036), and [animation cancellation](https://github.com/breadles5/customHitErrorBar/commit/228feb9859c437150abb61c0460b262d52ed6876).

## Measure the actual bottleneck

1. Open the overlay in Chrome/Chromium and record a representative hit burst in the [DevTools Performance panel](https://developer.chrome.com/docs/devtools/performance). Look for JSON parsing, script time, garbage collection, style recalculation, layout, and paint—not just your drawing function. Inspect frame duration spikes as well as averages.
2. Repeat near the end of a long map, after a retry, and after reconnecting. A test at the first ten hits will not reveal whole-history resend costs. Measure the full vosulay profile too; a standalone browser is useful for diagnosis but is not proof of in-game performance.
3. For a Chromium-wide trace, `chrome://tracing` is another entry point. See [Chromium's tracing instructions](https://www.chromium.org/developers/how-tos/trace-event-profiling-tool/); do not assume an embedded CEF renderer exposes that internal page or DevTools by default.
4. In OBS browser-source properties, check **Use custom frame rate** and **FPS**. Choose the rate the output actually needs; higher requested FPS does not repair slow JavaScript. [OBS documents these controls](https://obsproject.com/kb/browser-source). vosulay has its own [frame-rate scheduling limit](https://github.com/shiruviaa/vosulay/blob/main/README.md#frame-rate); it is a limit, not guaranteed rendered FPS.

For a quick local timing, use a monotonic timer:

```js
const start = performance.now();
updateModelAndRender();
const elapsedMs = performance.now() - start;
// Aggregate samples; inspect/log the summary outside the hot path.
```

This measures synchronous work, not a GPU-completed frame or end-to-end input latency. For named spans visible in tooling, use `performance.mark("overlay-start")`, `performance.mark("overlay-end")`, and `performance.measure("overlay-update", "overlay-start", "overlay-end")`; clear marks/measures after collecting samples so an endless session does not accumulate entries.

References: [MDN `performance.now()`](https://developer.mozilla.org/en-US/docs/Web/API/Performance/now), [User Timing](https://developer.mozilla.org/en-US/docs/Web/API/Performance_API/User_timing), and [frame budgets/rendering costs](https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/Animation_performance_and_frame_rate). At 60 FPS the complete frame budget is roughly 16.7 ms; at 30 FPS it is roughly 33.3 ms. Your handler shares that budget with layout, paint, compositing, and other page work.

## Checklist

- [ ] Use vosu's selected-field stream for only the values the overlay needs; use regular v2 full payloads for tosu compatibility.
- [ ] Use precise data only for a concrete need; do not continuously poll HTTP.
- [ ] Do not repeatedly receive an entire growing history when only new entries are needed.
- [ ] Preserve all newly received events, but batch visual changes into one pending rAF callback.
- [ ] Allocate tick elements once and reuse them; bound visible history deliberately.
- [ ] Skip unchanged text, attribute, class, and transform writes.
- [ ] Avoid forced write/read layout cycles; prefer transform/opacity for movement and fades.
- [ ] Reuse scratch arrays and existing renderer descriptors; do not claim a reused-buffer sort is incremental or zero-allocation.
- [ ] Reset attempt-specific cursors and visuals on retry; watch resets when streaming array indices.
- [ ] Cancel animations, rAF callbacks, and timers when resetting/discarding a widget; close unused sockets without reconnecting them.
- [ ] Reconnect with bounded backoff rather than a tight loop.
- [ ] Measure long maps, bursts, retries, reconnects, and the complete OBS/vosulay workload at the intended frame rate.
