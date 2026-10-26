---
title: Performance for overlay developers
description: General browser performance principles for building responsive counters, HUDs, visualizers, and animated overlays in OBS and vosulay.
---

# Performance for overlay developers

Build an overlay that does work when something changes, and only as much work as the visible result needs. That applies to a score label, a multi-widget HUD, a graph, or a full animated key visualizer—not just a particular counter.

Start with the [overlay tutorial](/vosu/dev/tutorial/) for implementation and the [WebSocket API](/vosu/dev/websocket-api) for stream details. The examples below illustrate general principles; snippets are shortened teaching examples, not complete overlays. **breadles5** and **qt715** are credited where their real-world changes demonstrate a technique.

## 1. Know where the time goes

A typical update travels through this pipeline:

```text
message intake / JSON parse → state update → DOM / style writes
                           → layout → paint → composite
```

An inexpensive message handler can still trigger expensive rendering. Layout calculates geometry, paint produces pixels, and compositing combines layers. Changing geometry can require layout and paint; changing a composited transform or opacity can avoid those stages. See [MDN's rendering waterfall](https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/Animation_performance_and_frame_rate).

The frame budget belongs to the **whole page**, not each widget. OBS browser sources use [CEF](https://obsproject.com/kb/browser-source); [vosulay renders the complete profile in one transparent CEF browser](https://github.com/18-lab-dev/vosulay/blob/main/README.md#linux). In vosulay, your work shares that page's budget with the other overlays. Separate OBS sources still compete for the machine's resources; they do not become free because they are separate pages.

Optimize the stage a trace shows is expensive. Usually the first wins are less incoming data, fewer writes, bounded history, and no work while idle—not switching every counter to a GPU renderer.

## 2. Make data intake event-driven

### Ask for less, then react only to changes

<Badge type="tip" text="vosu only" />

Use `/websocket/v2/subscribe` to request only the fields your overlay needs. Smaller messages mean less transfer and JSON parsing before your own code even runs.

**The important property:** after the initial snapshot, vosu sends a state frame **only when at least one selected value changed**. Update frames contain **only changed indices plus removals**, not a replacement copy of every selected field. No changes means no state frame. Your overlay can dispatch updates directly to the affected widgets—no polling loop and no client-side diff of the entire document.

| Protocol detail | Meaning                                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------- |
| Request         | One array of 1–256 non-overlapping RFC 6901 JSON Pointers, sent within five seconds of connecting |
| Initial frame   | `[0, revision, [[index, value], ...]]`                                                            |
| Update frame    | `[1, revision, [[changedIndex, value], ...], [removedIndex, ...]]`                                |
| Index           | Position in your requested pointer list                                                           |
| Missing value   | Omitted initially or reported as removed; not the same as JSON `null`                             |
| New field set   | Open a new connection; the established selection is not editable                                  |

After subscribing, **send nothing**. Browsers handle WebSocket control ping/pong; do not implement a text-message ping on this stream. Sources: [change suppression and delivery](https://github.com/18-lab-dev/vosu/blob/main/src/server/v2_subscription.rs), [transport](https://github.com/18-lab-dev/vosu/blob/main/src/server/service/websocket_transport.rs), and [WebSocket standard](https://websockets.spec.whatwg.org/#ping-and-pong-frames).

For example, the [EZ2ON `Subscription` helper](https://github.com/qt715/EZ2ON-REBOOT-R-vosu-overlays-recreation/blob/main/ez2on-timing-bar/js/vosu.js) reconstructs values and exposes a `changed` set, including removals and initial missing fields:

```js
// Subscription is that helper, not a built-in browser API.
const nodes = [document.querySelector("#state"), document.querySelector("#mode")];
new Subscription(["/state/number", "/play/mode/number"], (values, changed) => {
  for (const index of changed) {
    const text = values[index] == null ? "—" : String(values[index]);
    nodes[index].textContent = text;
  }
});
```

For frequently changing fields, put these writes behind the batching pattern in the next section. Treat a removal as a visible reset, not a reason to keep showing stale data.

### Cadence and compatibility

`V2_SUBSCRIPTION_DEBOUNCE` controls selected-field sampling and the minimum interval between state frames per client. Its default is **1 ms**, its range is **1–60000 ms**, and fractional milliseconds are supported. It is **not** a wait-until-input-goes-quiet debounce: continuous changes can produce frames at that interval. Selected-field sampling runs while a selection exists and is never slower than regular/precise sampling; faster sampling reruns memory reads and live pp calculation. Do not increase backend work just to refresh a mostly static label. [vosu documents the settings and cadence](https://github.com/18-lab-dev/vosu/blob/main/README.md#websocket-api).

For **tosu**, fall back to `/websocket/v2` full documents at its regular poll cadence. Extract your needed values and compare them before writing; a received document does not mean every displayed value changed. The selected-field endpoint is vosu-only. See [tosu's socket routes](https://github.com/tosuapp/tosu/blob/master/packages/server/router/socket.ts) and [WebSocket implementation](https://github.com/tosuapp/tosu/blob/master/packages/server/utils/socket.ts).

Use `/websocket/v2/precise` only for a concrete need for its precise fields/cadence. **Never poll HTTP in a loop for live telemetry**; use the streams. An intentional one-off snapshot is different from continuous polling. See the [WebSocket API](/vosu/dev/websocket-api) for schemas and fallback behavior.

### Advanced: bound growing histories

Selecting an array selects the whole value. If it grows on every event, every update can become more expensive throughout a session. Prefer a server aggregate when that is all you display; when you need events, keep only the history the visualization requires.

**Real-world example:** qt715's [EZ2ON long-map fix](https://github.com/qt715/EZ2ON-REBOOT-R-vosu-overlays-recreation/commit/c6fdbbc71cbc8ba52b4c197bc6f710d50a4136ac) replaces repeated whole `/play/hitErrorArray` delivery with sliding subscriptions to individual indices. Its [retry-anchor correction](https://github.com/qt715/EZ2ON-REBOOT-R-vosu-overlays-recreation/commit/652e23383b8e46dbd4c552cdf484744db8b5ff9b) also watches the last delivered index: a removal/change detects resets even while future indices do not exist. Use the complete [`HitErrorStream`](https://github.com/qt715/EZ2ON-REBOOT-R-vosu-overlays-recreation/blob/main/ez2on-timing-bar/js/hitErrors.js), with snapshot synchronization, overlapping windows, and deduplication—not just its pointer construction.

## 3. Minimize and batch DOM writes

Keep element references from initialization instead of finding the same nodes on every message. Write only the affected text, attribute, class, or style. Use `textContent` for plain labels: `innerHTML` invokes the HTML parser and replaces markup unnecessarily; it also treats input as HTML. Set text on a dedicated label node, since `textContent` replaces its children. See [MDN `textContent`](https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent) and [`querySelector`](https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelector).

**Before — illustrative label update:**

```js
function updateScore(score) {
  document.querySelector("#score").innerHTML = String(score);
}
```

**After — cache, compare, write:**

```js
const scoreNode = document.querySelector("#score");
let displayedScore = null;
function updateScore(score) {
  const text = String(score);
  if (text === displayedScore) return;
  displayedScore = text;
  scoreNode.textContent = text;
}
```

For bursts of updates, schedule **one pending `requestAnimationFrame`**, not one callback for every message. Keep model updates separate from drawing:

```js
let frame = null;
function receive(update) {
  applyToModel(update); // Preserve every event needed by the visualization.
  if (frame === null) frame = requestAnimationFrame(flush);
}
function flush() {
  frame = null;
  renderChangedWidgets(); // Reads the latest model; clears its dirty flags.
}
```

`applyToModel` and `renderChangedWidgets` represent your overlay's existing model/render functions. The reusable `flush` callback avoids making a closure for each message. [rAF runs before a repaint](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame), so this caps DOM batches at the browser's display cadence without a separate fixed-rate timer. A label can keep only its latest value; an event plot must retain all new events before drawing once.

**Real-world examples:** qt715's [customHitErrorBar batching change](https://github.com/breadles5/customHitErrorBar/commit/de04edf49a9d84cac06f6590882bcbef5f3c3036) keeps one pending arrow position and one rAF callback. The [EZ2ON direction guard](https://github.com/qt715/EZ2ON-REBOOT-R-vosu-overlays-recreation/commit/c6fdbbc71cbc8ba52b4c197bc6f710d50a4136ac) avoids writing a CSS-facing data attribute when its value is unchanged. breadles5's [tick updates](https://github.com/breadles5/customHitErrorBar/blob/master/src/calculation/tickManager.ts) similarly guard class and transform writes.

## 4. Control layout, paint, and compositing

### Read geometry before writing styles

A geometry read after a style change can force synchronous layout. Alternating writes and reads across many elements compounds that cost. Read the measurements you need once, then apply writes together. If you genuinely need post-change geometry, accept that layout work or defer the measurement rather than repeatedly forcing it. [web.dev explains layout thrashing](https://web.dev/articles/avoid-large-complex-layouts-and-layout-thrashing).

```js
// Before: interleaved read/write work.
for (const bar of bars) bar.style.width = `${container.offsetWidth}px`;

// After: measure once, then write.
const width = container.offsetWidth;
for (const bar of bars) bar.style.width = `${width}px`;
```

### Prefer cheap animated properties

Move with `transform` and fade with `opacity` instead of animating geometry such as `left`, `top`, or `width`. Keep static decorations outside frequently repainted content where possible. Large blur/shadow effects make painting more expensive, particularly when repainted every frame; inspect paint flashing before deciding where to simplify them. See [MDN's property-cost model](https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/Animation_performance_and_frame_rate) and [web.dev's animation guide](https://web.dev/articles/animations-guide).

Transform/opacity are defaults, **not guarantees** of GPU-only work or zero paint. Avoid blanket `will-change` or `translateZ(0)` on every node: layer promotion should respond to an observed problem, not substitute for profiling. [MDN warns about excessive `will-change`](https://developer.mozilla.org/en-US/docs/Web/CSS/will-change).

### Isolate independent widgets carefully

[CSS `contain`](https://developer.mozilla.org/en-US/docs/Web/CSS/contain) can limit layout/paint effects to a widget subtree. For a deliberately bounded HUD panel, consider:

```css
.hud-panel {
  contain: layout paint;
}
```

This changes layout/stacking behavior and **clips descendants at the panel bounds**; do not apply it blindly to a widget whose glows or popups extend outside. Size containment requires a deliberate sizing strategy rather than relying on descendants.

[`content-visibility: auto`](https://developer.mozilla.org/en-US/docs/Web/CSS/content-visibility) can skip offscreen rendering for long editors or lists. It is not a speedup for an always-visible HUD, and it does not automatically stop your JavaScript. Preserve sensible placeholder geometry with `contain-intrinsic-size` where needed.

**Real-world example:** qt715's [customHitErrorBar reflow removal](https://github.com/breadles5/customHitErrorBar/commit/228feb9859c437150abb61c0460b262d52ed6876) replaces animation resets that toggled `display` and read `offsetHeight` with an explicit animation lifecycle. That principle applies to any transient notification or reused element.

## 5. Let the browser run simple animations

Use CSS transitions for changes between states, CSS keyframes for predefined sequences, or WAAPI when you need a controllable animation handle. Do not implement a simple fade by writing opacity from a JavaScript timer on every frame. This removes your own interpolation loop and gives the browser scheduling control; it is not a claim that CSS is always faster than well-written JavaScript. For simulation-driven motion or canvas, rAF remains appropriate. See [MDN's CSS/JavaScript comparison](https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/CSS_JavaScript_animation_performance).

Cancel an old animation before reusing a visual element, especially one with `fill: "forwards"`, which continues to affect its presentation after playback:

```js
// A widget-owned handle, retained between activations.
let animation = null;
function fadeNotification(element) {
  animation?.cancel();
  animation = element.animate([{ opacity: 1 }, { opacity: 0 }], {
    duration: 300,
    fill: "forwards",
  });
}
```

The duration is illustrative, not a recommended latency. Cancel and clear that handle on disposal too. References: [MDN `animate`](https://developer.mozilla.org/en-US/docs/Web/API/Element/animate), [`Animation.cancel`](https://developer.mozilla.org/en-US/docs/Web/API/Animation/cancel), and [`animation-fill-mode`](https://developer.mozilla.org/en-US/docs/Web/CSS/animation-fill-mode).

**Real-world example:** qt715's [WAAPI change](https://github.com/breadles5/customHitErrorBar/commit/228feb9859c437150abb61c0460b262d52ed6876) cancels a previous fade when a pooled tick is activated, reset, or hidden.

## 6. Keep hot-path memory bounded

Garbage collection follows allocation pressure. In a frequent render/update path, avoid rebuilding arrays, temporary objects, and DOM nodes when existing storage can be reused. First remove unnecessary work; only then optimize allocations a trace exposes. A simple text counter rarely needs a pool or typed array. See [MDN memory management](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Memory_management).

| Workload                                    | Useful approach                                   | Caveat                                                                                |
| ------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Transient markers, particles, notifications | Reuse a bounded element/object pool               | Define what happens at capacity; cancel old animation state.                          |
| Recent-event graph                          | Keep bounded history or a ring buffer             | Reset cursors on a new attempt; do not discard events before the model consumes them. |
| Large numeric draw list                     | Reuse a typed array with a logical count          | Grow outside the common path; do not copy the entire capacity each frame.             |
| Repeated statistics                         | Recalculate on data changes; reuse scratch memory | Reused storage does not make an expensive algorithm incremental.                      |
| Renderer descriptors                        | Reuse stable wrapper objects/arrays               | API-owned per-frame GPU objects may still need recreation.                            |

**Real-world examples:**

- breadles5's [tick-manager commit](https://github.com/breadles5/customHitErrorBar/commit/65298b3b6890b9ce3b677e1cfa747ccb182d3944) processes only new hits and reuses a bounded pool; [DOM elements are created once](https://github.com/breadles5/customHitErrorBar/blob/master/src/rendering/ticks.ts).
- qt715's [median-buffer change](https://github.com/breadles5/customHitErrorBar/commit/de04edf49a9d84cac06f6590882bcbef5f3c3036) avoids an explicit spread-copy allocation. It still copies and sorts: it is **not an incremental median/UR algorithm or a zero-allocation guarantee**.
- qt715's [EZ2ON `InstanceBatch`](https://github.com/qt715/EZ2ON-REBOOT-R-vosu-overlays-recreation/blob/main/ez2on-key-visualizer/js/renderer.js) resets a logical count over a reusable `Float32Array`. The [per-frame allocation patch](https://github.com/qt715/EZ2ON-REBOOT-R-vosu-overlays-recreation/commit/652e23383b8e46dbd4c552cdf484744db8b5ff9b) also reuses render-pass descriptors and the command-buffer submit array, while still creating the required current texture view and command buffer.

## 7. Choose a renderer for the workload

DOM is a good starting point for labels, panels, and modest numbers of independently styled elements. If a measured bottleneck is many moving primitives and their DOM/style work, consider canvas for a batched draw surface; WebGL/WebGPU can suit large GPU-batched visualizations. There is **no universal element-count threshold** and no guarantee a rewrite will help.

Keep static content out of the constantly redrawn portion. Cache repeated drawing where appropriate, batch operations, and size the canvas for the intended output and device pixel ratio. Bigger backing buffers mean more pixels, so do not increase resolution without checking the cost. See [MDN canvas optimization](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas) and [WebGL best practices](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices).

**Real-world example:** qt715's [EZ2ON key-visualizer renderer](https://github.com/qt715/EZ2ON-REBOOT-R-vosu-overlays-recreation/blob/main/ez2on-key-visualizer/js/renderer.js) batches rectangle instance data for WebGPU/WebGL backends instead of maintaining a DOM node for each moving rectangle. Its design is evidence for batching a dense visualization, not a requirement for a score label. Check API availability in the actual OBS/vosulay renderer before choosing a backend.

## 8. Prepare assets before they enter the hot path

Asset loading affects startup, scene changes, and beatmap transitions, not just bundle size. Avoid making an unrelated frame wait for a newly inserted image to decode or for an oversized font to arrive.

- **Fonts:** ship only required weights/styles and appropriate subsets. Preserve glyph coverage for dynamic player names and song titles. Choose `font-display` deliberately: `swap` shows fallback text promptly but may change metrics when the font arrives; `optional` accepts that the custom face might not appear on that load. See [web.dev font loading](https://web.dev/articles/optimize-webfont-loading) and [MDN `font-display`](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/font-display).
- **Images:** provide dimensions or a stable aspect ratio so loading does not rearrange surrounding widgets. Use appropriately sized assets for the displayed result; see [web.dev image sizing](https://web.dev/articles/optimize-cls#images_without_dimensions) and [responsive images](https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Responsive_images).
- **Decode before swapping:** [`HTMLImageElement.decode()`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/decode) resolves when a fetched image is ready to display. Handle failures and stale asynchronous results if a newer asset request supersedes the old one.
- **JavaScript:** ship a production bundle, avoid unnecessary dependencies, and inspect what your overlay imports. [Vite's production build](https://vite.dev/guide/build) is the deployment path; do not ship a development server as the overlay. Production bundling does not fix an inefficient update loop. See [web.dev on reducing JavaScript payloads](https://web.dev/articles/reduce-javascript-payloads-with-code-splitting) and [overlay tooling](/vosu/dev/tooling).

**Before/after — illustrative image insertion:**

```js
// Before: insert before the image is ready.
const image = new Image();
image.src = url;
host.replaceChildren(image);

// After: decode first, preserving the old image if decoding fails.
async function replaceImage(url) {
  const image = new Image();
  image.src = url;
  try {
    await image.decode();
    host.replaceChildren(image);
  } catch (error) {
    console.warn("Overlay image failed to load", error);
  }
}
```

This illustrates decoding for a serialized replacement. If changes can overlap, add a request generation check before insertion so an older completed request cannot overwrite a newer one. Do not decode on every animation frame.

## 9. Give every widget a lifecycle

Every socket, timeout, interval, animation, listener, and pending rAF should have an owner and a disposal path. Cancel old work when resetting or removing a widget; do not leave reconnect timers running after an intentional close. [MDN covers timer cancellation](https://developer.mozilla.org/en-US/docs/Web/API/Window/clearTimeout), [rAF cancellation](https://developer.mozilla.org/en-US/docs/Web/API/Window/cancelAnimationFrame), and [listener removal](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/removeEventListener).

Reconnect with bounded backoff rather than immediately looping through failures. Reset the attempt count on a successful open, discard frames from obsolete sockets, and establish fresh state after reconnecting.

**Real-world example:** qt715's [shared EZ2ON client](https://github.com/qt715/EZ2ON-REBOOT-R-vosu-overlays-recreation/blob/main/ez2on-timing-bar/js/vosu.js) delays retries with `Math.min(5000, 250 * 2 ** attempt)`. Its [explicit-close change](https://github.com/qt715/EZ2ON-REBOOT-R-vosu-overlays-recreation/commit/c6fdbbc71cbc8ba52b4c197bc6f710d50a4136ac) clears the reconnect timer and invalidates the socket before closing it, preventing an intentional close from reconnecting. qt715's [arrow reset cleanup](https://github.com/breadles5/customHitErrorBar/commit/de04edf49a9d84cac06f6590882bcbef5f3c3036) cancels pending rAF work.

Use [Page Visibility](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API) to suspend unnecessary visual work when the document is hidden, and redraw current state when it becomes visible. Do not use focus loss as a substitute for invisibility. Browsers may throttle timers or pause rAF in background documents; do not make correctness depend on those callbacks continuing at a fixed rate. CSS-hiding an iframe does **not** change its document visibility, so per-widget hiding needs an explicit lifecycle signal. If you disconnect while hidden, resynchronize on return instead of assuming you received every intervening event.

OBS can also [unload a browser source when it is not visible](https://obsproject.com/kb/browser-source). Design initialization to tolerate the subsequent reload rather than treating the browser process as persistent storage.

## 10. Measure the complete workload

1. Record a representative update burst in [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance). Look for JSON parsing, script time, garbage collection, style recalculation, layout, paint, and slow frames—not just your own function's duration.
2. Compare idle behavior, dense activity, long sessions, resets, asset changes, and reconnects. Check that DOM size and retained history stop growing when intended. Test the complete OBS scene/vosulay profile: a standalone browser helps diagnosis but does not establish in-game performance.
3. For a Chromium-wide trace, use `chrome://tracing` where available; see [Chromium tracing](https://www.chromium.org/developers/how-tos/trace-event-profiling-tool/). Do not assume an embedded CEF renderer exposes that page or DevTools by default.
4. Measure at the intended output rate. In OBS, check **Use custom frame rate** and **FPS** in [browser-source properties](https://obsproject.com/kb/browser-source). vosulay has its own [frame-rate scheduling limit](https://github.com/18-lab-dev/vosulay/blob/main/README.md#frame-rate). A requested limit is not guaranteed rendered FPS, and increasing it does not fix slow JavaScript.

Use a monotonic timer for local synchronous work:

```js
const start = performance.now();
updateModelAndRender();
const elapsedMs = performance.now() - start;
// Aggregate samples; inspect a summary outside the hot path.
```

This is not a measurement of completed GPU work or end-to-end input latency. Use `performance.mark` / `performance.measure` for named spans in tooling and clear recorded entries after collecting them. References: [MDN `performance.now`](https://developer.mozilla.org/en-US/docs/Web/API/Performance/now) and [User Timing](https://developer.mozilla.org/en-US/docs/Web/API/Performance_API/User_timing).

The complete frame budget is approximately 16.7 ms at 60 FPS or 33.3 ms at 30 FPS—not an allowance for each callback. See [MDN on frame budgets](https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/Animation_performance_and_frame_rate). Change one expensive stage at a time and compare traces before adopting more complex machinery.

## Checklist

- [ ] Request only needed data; react to selected-field changes/removals, or compare values from full compatibility payloads.
- [ ] Use streams rather than HTTP polling; request precise data only when needed.
- [ ] Bound history and detect resets; preserve events in the model before coalescing drawing.
- [ ] Cache DOM references, use plain-text updates for labels, and skip unchanged writes.
- [ ] Batch dirty widgets behind one pending rAF callback; stay idle when nothing changes.
- [ ] Read geometry before writing; avoid forced layout loops and animation-reset reflows.
- [ ] Prefer transform/opacity animations; profile large blurred/shadowed areas and layer costs.
- [ ] Apply containment only where its clipping and layout behavior are appropriate.
- [ ] Reuse measured hot-path storage; use pools/typed arrays only where their complexity is justified.
- [ ] Choose DOM, canvas, or a GPU renderer from the workload and traces—not a universal threshold.
- [ ] Keep font/image/bundle payloads appropriate, reserve image geometry, and decode before dynamic swaps.
- [ ] Cancel obsolete timers, animations, listeners, and rAF callbacks; intentionally closed sockets stay closed.
- [ ] Reconnect with bounded backoff and fresh state; handle hidden/resumed/reloaded views deliberately.
- [ ] Measure dense activity and long sessions in the complete target scene/profile at its intended frame rate.
