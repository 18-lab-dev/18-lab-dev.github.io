---
title: Your first overlay
description: Connect a backend, focus osu!, add a counter and save its placement.
---

# Your first overlay

## 1. Start the backend

Start [vosu](/vosu/guide/) or a tosu-compatible backend separately. Install the counters you want in that backend. vosulay discovers its counter catalog; it does not replace the backend.

By default vosulay connects to `http://127.0.0.1:24050/`. For a different origin, open **Settings → Advanced → vosu URL**, enter its HTTP(S) scheme, host and port, click **Save**, then restart vosulay. Backend API paths are absolute: do not use a path-prefix deployment.

::: warning tosu on Windows
Disable tosu's own in-game overlay before using vosulay: **tosu dashboard → Settings → Overlay → In-Game Overlay**, or `ENABLE_INGAME_OVERLAY=false` in `tosu.env` beside `tosu.exe`. Two overlay hosts hooking the same game are unsupported. Linux does not need this change.
:::

## 2. Launch vosulay and the game

Launch **Vosulay** from your application menu or run its executable. On Linux, startup refreshes recognized osu! shortcuts for the **next launch**; if attachment does not work for an already running game, restart it through the refreshed shortcut. See [Linux attachment](/vosulay/linux).

Focus osu!stable or osu!lazer. The active game follows focus rather than process launch order. Launching vosulay a second time does not create another instance.

## 3. Open the editor

With the game focused, press **Ctrl+Shift+Space**. This is the default **Toggle edit mode** shortcut. You can also choose **Edit mode** in the tray, then focus the game.

During editing, vosulay receives keyboard and pointer input instead of the game. Editing normally ends when the game loses focus. [Editor behavior](/vosulay/editor) explains interaction and focus settings.

## 4. Add and arrange a counter

1. Find the counter in **Installed counters**. **Search counters** matches name, author or folder.
2. Click its catalog entry to add it to the active profile.
3. Drag it into position. Select it to use resize handles or the **Counter properties** inspector.
4. Use **X**, **Y**, **Width**, **Height**, **Scale**, **Layer**, **Opacity %** and **Rotation** for exact placement.

For custom web pages, use **Add URL** or **HTML file** instead. See [Overlays](/vosulay/overlays) before loading untrusted content.

## 5. Finish and check saving

Placement edits save automatically. The toolbar reports **Saving…** and then **Saved**; resolve a save error before assuming a layout is retained. Click **Done**, press **Escape** with no dialog/menu consuming it, or use the edit toggle to return to the game. App settings use their own **Save** button.

The default profile is **Default** and starts empty. Create more layouts in [Profiles](/vosulay/profiles).

::: tip Existing tosu layout
An untouched/default vosulay configuration can automatically import a tosu layout when exactly one source is detected. To choose a file explicitly, use **Settings → tosu layout → Import tosu layout**. Import appends profiles without changing the source file or replacing your existing profiles.
:::

Missing or blank counters? Follow [Troubleshooting](/vosulay/troubleshooting).

Sources: [README](https://github.com/shiruviaa/vosulay/blob/main/README.md), [editor controls](https://github.com/shiruviaa/vosulay/blob/main/assets/manager.html), [saving behavior](https://github.com/shiruviaa/vosulay/blob/main/assets/manager.js).
