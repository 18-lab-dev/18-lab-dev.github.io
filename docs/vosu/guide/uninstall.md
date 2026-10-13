---
title: Uninstall vosu
description: Remove portable, per-user, and packaged vosu installations and optionally delete local data.
---

# Uninstall vosu

Quit vosu from its tray icon before removing the executable. On Linux, first turn off **Settings → General → Start at login** if enabled.

If you cannot use the dashboard, the README gives the manual service-removal path:

```sh
systemctl --user disable vosu.service
```

Then delete `${XDG_CONFIG_HOME:-$HOME/.config}/systemd/user/vosu.service` if it is the unit vosu created. Do not delete an unrelated user unit with the same name.

## Portable archive

Delete the extracted executable and `LICENSE`, or the whole extracted directory.

- **Linux:** user data is separate under the XDG roots and remains until you remove it.
- **Windows:** the executable directory also contains configuration, overlays, values, logs, and cache. Deleting the whole directory deletes those as well.

If you configured a custom static directory outside that location, handle it separately. Take care with shared or symlink-mounted overlay directories: deleting a mount target removes the original files, not just vosu's reference.

## Manual per-user installation

For the [documented Linux per-user install](/vosu/guide/install#manual-per-user-installation), delete `$HOME/.local/bin/vosu` and `$HOME/.local/share/licenses/vosu/LICENSE`. Remove local data separately below.

For the documented Windows per-user install, delete `%LOCALAPPDATA%\Programs\vosu` after quitting. This removes its adjacent data too. Preserve any configuration or overlays you want to keep first.

## Linux packages

::: code-group
```sh [Debian / Ubuntu]
sudo apt remove vosu
```

```sh [Fedora]
sudo dnf remove vosu
```

```sh [Arch release package]
sudo pacman -R vosu
```

```sh [AUR source package]
sudo pacman -R vosu-git
```
:::

Package removal leaves your per-user configuration, overlays, logs, and caches intact. Packages did not configure a software repository or system service, so there is no vosu repository configuration to remove.

## Optional data removal

Back up anything you want to retain before deleting these directories:

| Data                                            | Linux path                                  |
| ----------------------------------------------- | ------------------------------------------- |
| Configuration and counter values                | `${XDG_CONFIG_HOME:-$HOME/.config}/vosu`    |
| Installed counters and logs                     | `${XDG_DATA_HOME:-$HOME/.local/share}/vosu` |
| Offsets, generator payload, and download caches | `${XDG_CACHE_HOME:-$HOME/.cache}/vosu`      |

On Windows, remove `vosu.toml`, `static/`, `settings/`, `logs/`, and `.cache/` next to the executable if you did not already delete its whole directory. A custom `STATIC_FOLDER_PATH` can be elsewhere; consult [configuration](/vosu/guide/configuration).

Pins and remembered counts also live in browser local storage. Clear the dashboard origin's site data in your browser if you want those removed.

To reinstall later, use [installation](/vosu/guide/install) and [GitHub releases](https://github.com/shiruviaa/vosu/releases).

Sources: [uninstall README](https://github.com/shiruviaa/vosu/blob/main/README.md#uninstall), [privacy policy](https://github.com/shiruviaa/vosu/blob/main/PRIVACY.md#data-stored-on-your-computer), and [security disclosure](https://github.com/shiruviaa/vosu/blob/main/docs/security.md#installation-files-and-removal).
