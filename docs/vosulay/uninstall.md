---
title: Uninstall vosulay
description: Remove the application, clean up game integration and optionally delete retained profiles and browser data.
---

# Uninstall vosulay

## Before removal

Choose **tray → Exit vosulay**. **Hide vosulay** is not Exit: it leaves attachment and listeners running. Close games that loaded the overlay before deleting or replacing its libraries. Restarting a game without integration ensures previously injected code is no longer loaded.

Save a copy of any profiles/configuration you want to retain. Normal uninstall keeps user settings, profiles and browser cache/logs.

## Windows

### Installer

Use **Windows Settings → Apps → Installed apps / Apps & features → Vosulay → Uninstall**, or the installed Inno uninstaller. It tracks installed files, shortcuts and its per-user uninstall registration. Configuration remains at `%APPDATA%\vosulay\config.json` unless you selected another path.

### ZIP

Delete the extracted runtime directory, then remove its self-created shortcut:

```text
%APPDATA%\Microsoft\Windows\Start Menu\Programs\Vosulay.lnk
```

Remove optional Desktop or Startup shortcuts left by an earlier installation so they do not point to a missing executable.

## Linux

Remove the installed package using the matching package manager:

::: code-group
```sh [Debian / Ubuntu]
sudo apt remove vosulay
```

```sh [Fedora]
sudo dnf remove vosulay
```

```sh [Arch Linux]
sudo pacman -R vosulay
```
:::

For a tarball, remove its extracted directory. For a Cargo install, use:

```sh
cargo uninstall vosulay
```

### Remove retained user integration

Package removal does **not** undo user game-shortcut changes. Inspect recognized osu! desktop entries in `$XDG_DATA_HOME/applications` (normally `~/.local/share/applications`). Remove **only vosulay's** preload paths and Vulkan environment additions, preserving foreign preloads, other layers and arguments.

Delete a generated override of a system shortcut only if there is no other customization to keep. Remove these self-created files under `$XDG_DATA_HOME` if present:

```text
applications/com.vosu.vosulay.desktop
icons/hicolor/scalable/apps/com.vosu.vosulay.svg
vosulay/vulkan/VkLayer_vosulay_overlay.json
```

System package files are the package manager's responsibility; do not remove unrelated game launchers.

## Optional full data removal

After backing up profiles, delete only the **selected configuration directory** and its adjacent `cef-cache`, which contains browser storage and `cef.log`.

| Config selection | Data to review                                                                                          |
| ---------------- | ------------------------------------------------------------------------------------------------------- |
| Linux default    | `$XDG_CONFIG_HOME/vosulay`, normally `~/.config/vosulay`                                                |
| Windows default  | `%APPDATA%\vosulay`                                                                                     |
| Portable         | `data` beside the executable                                                                            |
| `--config PATH`  | The explicitly selected config and adjacent `cef-cache`; preserve unrelated files in a shared directory |

Optional source-build assets under `$XDG_CACHE_HOME/vosulay` or `$HOME/.cache/vosulay` can be removed separately **only when no source-built install still relies on them**. These are distinct from the installed browser cache.

Do not delete overlay source directories or vosu/tosu backend data merely because you are removing vosulay.

::: info Removal scope
These instructions describe the upstream implementation and package-manager paths, not a claim of native uninstall testing. Quitting stops the host and listeners; it does not reverse Linux launcher edits or remove code already loaded in an open game.
:::

Source: [complete upstream removal disclosure](https://github.com/shiruviaa/vosulay/blob/main/docs/security.md#how-to-remove-vosulay-completely).
