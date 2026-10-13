---
title: "3. Render a play HUD"
description: "Render pp, accuracy, combo, judgements, timing, and keys without rebuilding the DOM."
---

# 3. Render a play HUD

Replace `index.html` with the HUD markup. Elements have stable IDs so JavaScript can
cache them once. The body stays transparent for OBS and vosulay.

<<< ../../../../examples/starter-overlay/index.html

Create `src/style.css`. The HUD's declared dimensions match its metadata. Key motion
uses `transform` and `opacity`; color changes occur only on input transitions.

<<< ../../../../examples/starter-overlay/src/style.css

Create `src/main.ts`. It imports the connection module and stylesheet, caches DOM
references, creates a fixed pool of 18 key nodes, and wires the telemetry callback.

::: details src/main.ts
<<< ../../../../examples/starter-overlay/src/main.ts
:::

## Understand the update path

1. A vosu frame updates the selected-value array and marks just the supplied indices
   and removals. Unchanged selected values produce no server frame.
2. The callback ORs that mask into `dirty` and calls `schedule()`.
3. `schedule()` requests a frame only if one is not already pending.
4. `render()` writes only the DOM groups selected by the accumulated mask, then clears
   it. Indices 5–8 share one timing row; index 4 owns the bounded key strip.

For vosu, these are already change events: there is no client-side value/DOM diff or
polling loop. On tosu's full-stream fallback, `compareFallback()` performs structural
value comparison first and produces the same mask; repeated identical payloads do
not repaint the HUD.

There is **no permanently running frame loop**. Events arriving before a paint
coalesce, retaining all changed bits and the latest values. No arrays, DOM nodes, or
callbacks are created by an idle animation loop. JSON parsing and formatted text
still allocate on data events; this is not an allocation-free renderer.

Use `textContent`, never interpolate daemon data into `innerHTML`. Cache references
rather than querying the DOM in every callback. Do not force layout measurements
between writes. The example intentionally does not add blanket `will-change` hints.

The input strip is bounded to 18 displayed slots; extra source inputs are not drawn.
The HUD is a compact state display, not a lossless timing graph: events that occur
between samples are not reconstructed as animations.

## Try it

```sh
pnpm dev
```

Open the printed Vite URL and play a map with vosu or tosu running. The status line
shows `vosu subscription` or `Full v2 fallback`. Before live data arrives, numeric
values show zero and missing timing values show a dash.

Use HMR with `pnpm dev` for UI work. For testing inside vosu, OBS, or vosulay,
use the [symlinked build loop](/vosu/dev/tutorial/06-package#recommended-build-loop).

For deeper advice, read [overlay performance](/vosu/dev/performance).

Next: [understand optional vosu fields](/vosu/dev/tutorial/04-extensions).
