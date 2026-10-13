---
title: Settings and configuration
description: Every vosulay setting, its real default, shortcuts and configuration locations.
---

# Settings and configuration

Enter edit mode, open **Settings**, change the controls, then click **Save**. **Cancel** discards the dialog's draft. Defaults below come from the published [configuration model](https://github.com/shiruviaa/vosulay/blob/main/src/config.rs); labels come from the [editor UI](https://github.com/shiruviaa/vosulay/blob/main/assets/manager.html).

## General

| UI setting                                | JSON key under `settings`      | Default         | Effect                                                                                      |
| ----------------------------------------- | ------------------------------ | --------------- | ------------------------------------------------------------------------------------------- |
| Keep overlays in view                     | `always_keep_overlays_in_view` | `false` (off)   | Constrain only the selected counter during editing, not normal-mode resizing.               |
| Leave edit mode when the game loses focus | `exit_edit_mode_on_focus_loss` | `true` (on)     | Turn off to retain the editor on screen; capture still requires game focus.                 |
| FPS limit                                 | `fps_limit`                    | `0` (Automatic) | Follow the attached display's refresh rate; Fixed accepts 1–1,000,000. Applies immediately. |

Automatic updates when the game moves between displays or display refresh changes. Fixed stays fixed. This limits overlay scheduling, not the game's FPS, and complex overlays can render more slowly than the limit.

`--fps-limit auto`, `--fps-limit 0` or `--fps-limit 120` (`-f`) overrides the saved choice for one run. An explicit automatic value overrides a saved fixed cap.

## Remote overlay server

| UI setting         | JSON key under `settings` | Default                          | Effect                                                                                 |
| ------------------ | ------------------------- | -------------------------------- | -------------------------------------------------------------------------------------- |
| Listener address   | `remote_listen_host`      | `"127.0.0.1"`                    | Bind only loopback; use an interface IP or `0.0.0.0` for LAN access. Restart required. |
| Listener port      | `remote_listen_port`      | `5050`                           | Remote server's TCP port. Restart required.                                            |
| Allowed client IPs | `allowed_ips`             | `"127.0.0.1,localhost,absolute"` | Client allowlist; loopback is always allowed. Empty allows only this computer.         |

The default allowlist string is reproduced exactly, including its `absolute` entry; for remote clients use supported exact IPs or four-part IPv4 patterns such as `192.168.*.*`. The UI accepts comma- or space-separated entries. Invalid listener IPs normalize to loopback; port zero normalizes to 5050.

Read [Remote profiles](/vosulay/remote) before opening access. There is no remote access token or listener TLS.

## Advanced

| UI setting                           | JSON key under `settings`                | Default                     | Effect                                                                                                  |
| ------------------------------------ | ---------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------- |
| vosu URL                             | `vosu_url`                               | `"http://127.0.0.1:24050/"` | vosu or tosu-compatible backend origin. Restart required; `--vosu-url` (`-t`) overrides it for one run. |
| Allow editing on this computer       | `allow_local_profile_editing`            | `false` (off)               | Let loopback profile pages edit the placements they show. Applies without restart.                      |
| Allow unrestricted SharedArrayBuffer | `allow_unrestricted_shared_array_buffer` | `false` (off)               | Compatibility opt-in for all overlays. Restart required.                                                |

Backend URLs accept HTTP(S) without embedded credentials, query or fragment. Use scheme, host and port, not a path prefix: API paths are absolute. Invalid stored URLs fall back to the default.

::: danger Security-sensitive switches
Local profile editing can also be used by installed counters sharing the profile page's origin. Unrestricted SharedArrayBuffer disables a Chromium Spectre mitigation and exposes shared memory to all local/remote overlays. Enable either only with content you trust; neither is needed for an ordinary first setup.
:::

## Shortcuts

All keys below are under `settings.hotkeys`. Click a shortcut and press a new chord; **Esc** cancels recording. Native edit, visibility and interaction shortcuts require Ctrl, Alt or Meta plus a natively mappable key. Only hide/show can be empty: press unmodified **Backspace** or **Delete** during recording to show **Not set**. **Reset defaults** restores shortcut defaults.

| UI label                   | Key                        | Default                        |
| -------------------------- | -------------------------- | ------------------------------ |
| Toggle edit mode           | `toggle_edit`              | `Ctrl+Shift+Space`             |
| Hide vosulay               | `toggle_visibility`        | `""` (Not set)                 |
| Toggle overlay interaction | `toggle_interaction`       | `Ctrl+I`                       |
| Undo                       | `undo`                     | `Ctrl+Z`                       |
| Redo                       | `redo`                     | `Ctrl+Shift+Z`                 |
| Copy overlays              | `copy_overlay`             | `Ctrl+C`                       |
| Paste overlays             | `paste_overlay`            | `Ctrl+V`                       |
| Refresh selected overlays  | `refresh_selected_overlay` | `Ctrl+R`                       |
| Refresh all overlays       | `refresh_all_overlays`     | `Ctrl+Shift+R`                 |
| Profile 1                  | `profile_1`                | `Ctrl+1`                       |
| Profile 2                  | `profile_2`                | `Ctrl+2`                       |
| Profile 3                  | `profile_3`                | `Ctrl+3`                       |
| Profile 4                  | `profile_4`                | `Ctrl+4`                       |
| Profile 5                  | `profile_5`                | `Ctrl+5`                       |
| Profile 6                  | `profile_6`                | `Ctrl+6`                       |
| Profile 7                  | `profile_7`                | `Ctrl+7`                       |
| Profile 8                  | `profile_8`                | `Ctrl+8`                       |
| Profile 9                  | `profile_9`                | `Ctrl+9`                       |
| Profile 0                  | `profile_0`                | `Ctrl+0` (profile position 10) |

Profile shortcuts follow list order. Text fields keep their native undo/redo. On Windows, an already-owned native chord warns rather than stopping startup; choose another binding. See [Editor](/vosulay/editor) for focus/capture rules and non-configurable Delete/Escape actions.

## tosu layout

**Settings → tosu layout → Import tosu layout** is an action, not a persisted setting. It reads the selected JSON and appends profiles; existing profiles and the tosu file are unchanged. See [Profiles](/vosulay/profiles).

## Configuration files

| Mode              | Location                                                                                                                                             |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Linux default     | `$XDG_CONFIG_HOME/vosulay/config.json`, normally `~/.config/vosulay/config.json`                                                                     |
| Windows default   | `%APPDATA%\vosulay\config.json`                                                                                                                      |
| Portable          | Create a `portable` file beside the executable; config becomes adjacent `data/config.json`. An existing adjacent `data/config.json` also selects it. |
| Explicit override | `--config PATH` overrides both default and portable selection.                                                                                       |

The Windows ZIP is **not** portable unless you select portable storage. `cef-cache` beside the selected config contains browser storage and `cef.log`; it is not necessarily in the OS cache directory. Source-build/acquisition caches are separate.

Missing config files receive defaults. Missing fields receive defaults; malformed/unreadable files or unsupported schema versions are errors. Unknown fields are ignored and dropped on later saves. Saves use a temporary file and atomic replacement. Back up the selected config before manual edits or full removal.

### Profile and placement defaults

These are saved layout data, not additional Settings-dialog switches:

| Config field                | Default                                                                            |
| --------------------------- | ---------------------------------------------------------------------------------- |
| `version`                   | `1`                                                                                |
| `active_profile`            | `"default"`                                                                        |
| `profiles`                  | One profile: ID `"default"`, name `"Default"`, empty `overlays`                    |
| `tosu_migration_completed`  | `false` (saved true after completed migration)                                     |
| Placement `counter_id`      | Empty in a default placement; populated when adding an installed counter           |
| Placement `url`, `name`     | Absent                                                                             |
| Placement `top`, `left`     | `0`, `0`                                                                           |
| Placement `width`, `height` | `500`, `300` fallback; installed catalog dimensions are used when adding a counter |
| Placement `scale`           | `1`                                                                                |
| Placement `opacity`         | `1` (100%)                                                                         |
| Placement `rotation`        | `0`                                                                                |
| Placement `enabled`         | `true`                                                                             |
| Placement `z_index`         | `0`                                                                                |

Width/height normalize to at least 10; scale to at least 0.1; opacity to 0–1; rotation to −180–180; layer to 0–999. Duplicate placements and their ordering are preserved. Missing/duplicate profile IDs and invalid active-profile selection are repaired during loading.

Sources: [configuration reference](https://github.com/shiruviaa/vosulay/blob/main/docs/configuration.md), [defaults](https://github.com/shiruviaa/vosulay/blob/main/src/config.rs), [settings controls](https://github.com/shiruviaa/vosulay/blob/main/assets/manager.html).
