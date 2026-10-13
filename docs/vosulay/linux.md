---
title: vosulay on Linux
description: Game attachment, refreshed launchers, Wine input and OBS capture on Linux.
---

# vosulay on Linux

vosulay supports Vulkan, EGL/OpenGL and GLX/OpenGL games, including native Wayland and X11/XWayland presentation. [Install the complete runtime](/vosulay/install); do not mix the host, injected libraries and CEF assets from different packages.

## Refreshed game shortcuts

On startup vosulay refreshes recognized osu! desktop shortcuts with absolute compositor/lookup preload paths and Vulkan settings. Foreign preloads, launch arguments and OBS capture flags are preserved; obsolete vosulay paths and duplicate environment assignments are removed.

User shortcuts are modified in place. System shortcuts receive per-user overrides under the XDG applications directory; system files are not changed. This affects the **next game launch**, not one already running. Unsupported launch commands and D-Bus-activated entries are not rewritten.

Removing the package does not reverse user shortcut edits. See [Uninstall](/vosulay/uninstall).

## Live attachment or launch-time integration

vosulay discovers same-user native game processes and attempts live attachment. OS injection policy may prevent this. Restart through a refreshed shortcut rather than weakening ptrace policy or launching elevated to bypass restrictions. Live attachment does not reach Wine games: a Wine game started with the preload connects by itself, and one started without it gets a single warning asking for a relaunch.

For a manual OpenGL/Wine launch, replace both absolute paths and the game command:

```sh
LD_PRELOAD="/absolute/path/to/vosulay/libvosulay_lookup.so:${LD_PRELOAD:+$LD_PRELOAD:}/absolute/path/to/vosulay/libvosulay_overlay.so" /path/to/game
```

For a Vulkan launch, point the loader to the packaged layer:

```sh
VK_LAYER_PATH="${VK_LAYER_PATH:+$VK_LAYER_PATH:}/absolute/path/to/vosulay" \
VK_INSTANCE_LAYERS="${VK_INSTANCE_LAYERS:+$VK_INSTANCE_LAYERS:}VK_LAYER_VOSULAY_overlay" /path/to/game
```

Distribution packages place the runtime under `/usr/lib/vosulay`. Tarball users should use the extracted runtime's absolute directory.

## osu!stable under Wine

Wine's **X11 driver** is supported, including osu-winello, Lutris and plain Wine. Launch through the refreshed shortcut or the same preload command. Launch-script additions such as osu-winello's OBS preload can appear in any order.

The visible Wine window can differ from its offscreen render window. vosulay treats the game as focused when any window belonging to its process has X input focus. While editing it reads Wine's X event queue, routes keyboard and mouse to the editor, displays a normal pointer and holds raw mouse input back from the game.

## Game selection and editing focus

The selected game follows authenticated game-focus notifications, not process enumeration order. Focusing an unrelated window retains the selection; another supported game takes over only when focused. If the selected game exits, vosulay waits for a supported game to gain focus rather than choosing a background process.

Shortcuts use the focused game's input path, not a desktop-global key grab. **Ctrl+Shift+Space** toggles editing. For a desktop-wide key, bind `vosulay --toggle-edit` in your compositor or desktop (for example a Hyprland or KDE shortcut); like the tray item, it starts editing once the game is focused. Default focus loss ends editing; [Settings](/vosulay/settings) can keep the editor visible without capturing another app's input.

The tray needs **StatusNotifierItem** support from your desktop. Use **Exit vosulay**, not **Hide vosulay**, to quit.

## OBS game capture

Refreshed shortcuts use **lookup helper → foreign preloads → compositor** order. OBS's installed Vulkan layer stays before vosulay. For supported Linux GL and Vulkan game-capture routes, OBS captures the clean game frame before vosulay composes the overlay; vosulay does not change OBS scenes, sources or settings.

**Display Capture includes the overlay.** Game-capture ordering is not screen-capture exclusion. vosulay does not hide or repair OBS image-export failures.

To include an independently rendered profile in a stream, use a [remote profile page](/vosulay/remote) as a browser source.

Sources: [Linux integration and capture](https://github.com/shiruviaa/vosulay/blob/main/README.md#linux-1), [launcher/security disclosure](https://github.com/shiruviaa/vosulay/blob/main/docs/security.md).
