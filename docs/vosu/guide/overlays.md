---
title: Overlays
description: Install trusted counters, configure them, and use their hosted URLs in OBS or vosulay.
---

# Overlays

vosu calls browser overlays **counters**. It serves their HTML, JavaScript, and assets from its static folder and supplies live game data through compatible APIs.

::: warning Install only trusted counters
Counters are third-party web pages, not isolated plugins. Their scripts share the dashboard's origin and can read game data and invoke dashboard management actions, including installing or deleting counters and changing settings. Their authors may also make external network requests. vosu does not review or endorse them.
:::

## Install from Available

1. Open the [dashboard](/vosu/guide/dashboard) and choose **Available**.
2. Search by name, author, or compatible client. Inspect the author links and intended use.
3. Click **Install**. The archive comes from the catalog's download link, not a vosu-maintained mirror.
4. Return to **Installed** and copy the new counter's URL.

Use **Update** in Available when offered. Check the author's license before modifying or redistributing a counter. Catalog and download outages belong to the [tosu project](https://github.com/tosuapp/tosu/issues); install failures name the download host when relevant.

## Manual installation

Extract a trusted counter into a directory below the static root, keeping its assets together. A typical layout is:

```text
static/
  my-counter/
    index.html
    metadata.txt
    settings.schema.toml
```

`index.html` is the usual entry point. Optional `metadata.txt` supplies the displayed name, author links, description, version, and `WxH` resolution. An immediate `ignore.txt` excludes that directory; discovery never traverses directories named `node_modules`.

| OS      | Default static root                                 |
| ------- | --------------------------------------------------- |
| Linux   | `${XDG_DATA_HOME:-$HOME/.local/share}/vosu/static/` |
| Windows | `static/` next to `vosu.exe`                        |

An overlay in `my-counter` is hosted at `http://127.0.0.1:24050/my-counter/`. Prefer the card's copied URL if you changed the listener. [Configuration](/vosu/guide/configuration) explains custom static roots and data locations.

## Symlink mounts

A directory symlink **directly under the static root** is an explicit local mount and may point outside it. For example, on Linux:

```sh
mkdir -p "${XDG_DATA_HOME:-$HOME/.local/share}/vosu/static"
ln -s /absolute/path/to/my-counter "${XDG_DATA_HOME:-$HOME/.local/share}/vosu/static/my-counter"
```

Discovery follows the top-level alias, not nested directory symlinks. Served files remain confined to that alias's current target. **Open folder** follows the alias; **Delete** removes the alias itself, not its target. Counter settings work through aliases, but final symlinked settings files are rejected.

## Counter settings

Use an installed card's **Settings** button when present. The package owns `settings.schema.toml`; mutable values are stored separately:

| OS      | Values                                                                           |
| ------- | -------------------------------------------------------------------------------- |
| Linux   | `${XDG_CONFIG_HOME:-$HOME/.config}/vosu/settings/<counter>.settings.values.toml` |
| Windows | `settings/<counter>.settings.values.toml` next to `vosu.exe`                     |

Controls can include text, colors, numbers, checkboxes, buttons, choices, commands, textareas, passwords, and headers. File-loaded or other non-hosted overlays may read settings, but must use the **hosted settings page** to write them because writes require same-origin browser provenance.

## Add to OBS

1. Click the installed card's URL bar to copy the hosted URL.
2. Add a **Browser** source in OBS and paste that URL, not a local file path.
3. Set the source width and height to the card's declared resolution; click the size to copy it.
4. Keep vosu running while the source needs telemetry.

For this machine's default listener, the URL has the form `http://127.0.0.1:24050/my-counter/`. Remote OBS needs deliberate [network configuration](/vosu/guide/configuration#listener-and-remote-access); never expose vosu to the internet.

## Render inside osu!

Use [vosulay](/vosulay/) to render counters inside the game. vosu supplies telemetry and hosted counters; vosulay manages the in-game rendering. Start with [vosulay getting started](/vosulay/getting-started).

Want to make a counter? See the [overlay tutorial](/vosu/dev/tutorial/). For failures, see [troubleshooting](/vosu/guide/troubleshooting).

Source: [dashboard and counters README](https://github.com/shiruviaa/vosu/blob/main/README.md#dashboard-and-counters).
