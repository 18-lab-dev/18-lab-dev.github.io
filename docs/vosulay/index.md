---
title: vosulay
description: Render and arrange tosu-compatible counters inside osu! on Linux and Windows.
---

# vosulay

vosulay renders tosu-compatible counters inside osu! using a native Rust host and one Chromium Embedded Framework (CEF) browser runtime. It manages the layout; a **separately running vosu or tosu-compatible backend** supplies installed counters and game data.

These docs cover **vosulay 1.4.0**, including the compact inspector, full placement editor,
native vosu settings editor and per-placement settings-profile pins.

The default backend is `http://127.0.0.1:24050/`. Change it in **Settings → Advanced → vosu URL**, then restart vosulay. Compatibility comes from the public counter API, not the backend's product name. vosu remains independent of vosulay.

[Install vosulay](/vosulay/install) · [First overlay](/vosulay/getting-started) · [Set up vosu](/vosu/guide/)

## What you can do

- Move, resize, scale, crop, rotate, reorder and change overlay opacity; Ctrl+drag scales and Shift+drag crops.
- Disable a placement without deleting it.
- Keep multiple named profiles and switch layouts.
- Search installed counters by name, author or folder.
- Edit vosu counter settings and settings profiles natively; pin each placement to a profile.
- Add custom remote URLs or local HTML files.
- Use Chromium GPU compositing, WebGL, WebGPU where supported, and overlay audio.
- Serve view-only profiles to browsers and streaming clients, and the full editor to OBS, a browser or other overlay software on the same computer.
- Run as an overlay server only (`--server-only`), and toggle editing or quit from scripts and keybinds (`--toggle-edit`, `--quit`).
- Use Automatic FPS to divide the attached display's refresh rate down to 120 fps or less.

## Platforms and rendering

| Platform | Supported game/rendering routes                                                                                                                                                                  |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Linux    | Vulkan, EGL/OpenGL and GLX/OpenGL; native Wayland and X11/XWayland games; osu!stable through Wine's X11 driver, including osu-winello. Live attachment or launch-time preload/layer integration. |
| Windows  | osu!stable (`osu!.exe`) and osu!lazer (`osulazer.exe`) through native asdf-overlay 2.1.0 injection.                                                                                              |

Release downloads target x86_64. Linux binaries require glibc 2.35 or newer. See the [Linux](/vosulay/linux) and [Windows](/vosulay/windows) guides before configuring game capture or attachment.

::: warning Know what is running
vosulay loads overlay code into the game and executes the web content you choose. Use trusted counters. Hiding vosulay does not stop attachment or network listeners; **tray → Exit vosulay** quits the host. Read the upstream [security disclosure](https://github.com/shiruviaa/vosulay/blob/main/docs/security.md).
:::

## Next steps

| Task                        | Guide                                       |
| --------------------------- | ------------------------------------------- |
| Arrange counters            | [Editor](/vosulay/editor)                   |
| Save different layouts      | [Profiles](/vosulay/profiles)               |
| Add or configure content    | [Overlays](/vosulay/overlays)               |
| Use a browser or OBS source | [Remote profiles](/vosulay/remote)          |
| Change defaults             | [Settings](/vosulay/settings)               |
| Fix missing overlays        | [Troubleshooting](/vosulay/troubleshooting) |

Source: [vosulay 1.4.0 README](https://github.com/shiruviaa/vosulay/blob/d2e472a/README.md).
