---
layout: home
title: shiruviaa
titleTemplate: osu! tooling, engineered for performance and power users

hero:
  name: shiruviaa
  text: osu! tooling, engineered for performance and power users.
  tagline: Native, measured, open source. We build the daemon that reads the game and the overlay manager that draws inside it, on Linux and Windows.
  image:
    src: /kitsune-hero.svg
    alt: The shiruviaa kitsune, a white fox mask in front of nine pink and violet tails.
  actions:
    - theme: brand
      text: Get vosu
      link: /vosu/guide/install
    - theme: alt
      text: Get vosulay
      link: /vosulay/install
    - theme: alt
      text: Build an overlay
      link: /vosu/dev/tutorial/
---

<HomeProjects />

<HomePillars />

<HomeCta>

```js
// vosu: stream only the fields this overlay draws
const fields = ["/play/pp/current", "/play/accuracy", "/play/combo/current"];
const url = "ws://127.0.0.1:24050/websocket/v2/subscribe";
const ws = new WebSocket(url);

ws.onopen = () => ws.send(JSON.stringify(fields));
ws.onmessage = ({ data }) => {
  // [0, rev, pairs] once, then [1, rev, pairs, removed]
  const [kind, , pairs] = JSON.parse(data);
  if (kind > 1) return; // [2, code, message] is an error
  for (const [i, value] of pairs) render(fields[i], value);
};
```

</HomeCta>
