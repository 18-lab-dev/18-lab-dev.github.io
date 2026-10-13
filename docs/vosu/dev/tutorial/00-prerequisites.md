---
title: "0. Prerequisites"
description: "A curated browser reading list before writing an osu! overlay."
---

# 0. Prerequisites

You need a running vosu or tosu instance for live data, Node.js **22.12+** (or
**20.19+**), pnpm, and a text editor. Run one daemon on port 24050 at a time.
Start with [vosu installation](/vosu/guide/install) if needed.

An installed counter is HTML, CSS, and JavaScript served below the daemon's static
folder. A browser source does not run your TypeScript files directly: Vite builds them
into browser JavaScript first. The page receives JSON over a WebSocket and changes
its own DOM; it does not read osu! process memory.

## Learn the minimum

You do not need to read every specification cover to cover. Learn these concepts first:

| Reading                                                                                                 | Why it matters                                                                     |
| ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| [MDN web development](https://developer.mozilla.org/en-US/docs/Learn_web_development)                   | HTML structures the HUD, CSS styles it, and JavaScript connects data to the UI.    |
| [DOM introduction](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Introduction) | Elements are objects you can cache and update without rebuilding the page.         |
| [TypeScript handbook](https://www.typescriptlang.org/docs/handbook/intro.html)                          | Types describe code expectations; incoming JSON still needs runtime checks.        |
| [WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)                                 | Understand open/message/error/close events and why reconnect is application logic. |
| [requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame)  | Batch many incoming messages into one update before a browser repaint.             |
| [CSS transform](https://developer.mozilla.org/en-US/docs/Web/CSS/transform)                             | Move or scale an element without animating its layout dimensions.                  |
| [CSS will-change](https://developer.mozilla.org/en-US/docs/Web/CSS/will-change)                         | It is a selective optimization hint, not a property to put on every element.       |
| [RFC 6901](https://www.rfc-editor.org/rfc/rfc6901)                                                      | JSON Pointers name subscription fields; `~1` escapes `/` and `~0` escapes `~`.     |

## Authoritative references

| Specification                                            | Use it when…                                                       |
| -------------------------------------------------------- | ------------------------------------------------------------------ |
| [WHATWG HTML](https://html.spec.whatwg.org/)             | You need exact HTML, script, event-loop, or rendering behavior.    |
| [W3C CSS](https://www.w3.org/Style/CSS/)                 | You need the CSS specification index rather than a tutorial.       |
| [WHATWG DOM](https://dom.spec.whatwg.org/)               | You need exact node, event, or mutation semantics.                 |
| [WHATWG WebSockets](https://websockets.spec.whatwg.org/) | You need the browser WebSocket API's transport and security rules. |
| [ECMAScript](https://tc39.es/ecma262/)                   | You need precise JavaScript language behavior.                     |

::: tip First checkpoint
Before continuing, be able to select an element, set its `textContent`, parse a JSON
string, and explain why a WebSocket callback and a paint callback are different things.
:::

Next: [set up the project](/vosu/dev/tutorial/01-project).
