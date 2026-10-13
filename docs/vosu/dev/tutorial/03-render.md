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

1. A WebSocket message updates the fixed selected-value array.
2. The callback replaces the current array reference and calls `schedule()`.
3. `schedule()` requests a frame only if one is not already pending.
4. `render()` consumes the latest values, updates only changed text/classes/visibility,
   and clears the pending frame ID.

There is **no permanently running frame loop**. Messages arriving before a paint
coalesce into the latest HUD state. No arrays, DOM nodes, or callbacks are created by
an idle animation loop. JSON parsing and formatted text still allocate when new data
arrives; this is not an allocation-free renderer.

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

For deeper advice, read [overlay performance](/vosu/dev/performance).

Next: [understand optional vosu fields](/vosu/dev/tutorial/04-extensions).
