---
title: Configuration
description: Every vosu.toml binding, defaults, valid ranges, environment controls, and platform data paths.
---

# Configuration

Use the [dashboard's Settings page](/vosu/guide/dashboard#settings) or edit `vosu.toml`. It is flat, typed TOML with uppercase binding names, not a collection of TOML sections.

## File locations

| Data           | Linux                                                                            | Windows                                             |
| -------------- | -------------------------------------------------------------------------------- | --------------------------------------------------- |
| Configuration  | `${XDG_CONFIG_HOME:-$HOME/.config}/vosu/vosu.toml`                               | `<program>/vosu.toml`                               |
| Counters       | `${XDG_DATA_HOME:-$HOME/.local/share}/vosu/static/`                              | `<program>/static/`                                 |
| Counter schema | `<static-root>/<counter>/settings.schema.toml`                                   | Same relative to the static root                    |
| Counter values | `${XDG_CONFIG_HOME:-$HOME/.config}/vosu/settings/<counter>.settings.values.toml` | `<program>/settings/<counter>.settings.values.toml` |
| Logs           | `${XDG_DATA_HOME:-$HOME/.local/share}/vosu/logs/`                                | `<program>/logs/`                                   |
| Cache          | `${XDG_CACHE_HOME:-$HOME/.cache}/vosu/`                                          | `<program>/.cache/`                                 |

`<program>` means the directory containing `vosu.exe`. Default static paths `./static` and `.\static` map to the platform data root, not necessarily the shell's working directory. A custom relative static path resolves from the launch directory; an absolute one is used as written.

## Complete binding reference

These are all 16 bindings in the [configuration schema](https://github.com/shiruviaa/vosu/blob/main/src/config/schema.rs). Numeric intervals are milliseconds; fractional intervals are supported.

| Key                           | Default                          | Valid range / type                                                      | Meaning                                                                                                                                                                      |
| ----------------------------- | -------------------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ENABLE_AUTOUPDATE`           | `true`                           | Boolean                                                                 | Install stable releases at startup for self-updating installs. Disabling installation does not disable their startup update check.                                           |
| `OPEN_DASHBOARD_ON_STARTUP`   | `true`                           | Boolean                                                                 | Open the effective dashboard listener after startup.                                                                                                                         |
| `START_AT_LOGIN`              | `false`                          | Boolean; Linux only                                                     | Run through a systemd user unit at graphical login. Hidden on Windows.                                                                                                       |
| `DEBUG_LOG`                   | `false`                          | Boolean                                                                 | Enable debug-level console and file logging.                                                                                                                                 |
| `CALCULATE_PP`                | `true`                           | Boolean                                                                 | Enable live performance-point calculations.                                                                                                                                  |
| `ENABLE_KEY_OVERLAY`          | `true`                           | Boolean                                                                 | Publish key-overlay data in compatible schemas.                                                                                                                              |
| `ENABLE_MANIA_KEY_HIT_ERRORS` | `false`                          | Boolean                                                                 | <Badge type="tip" text="vosu only" /> Added in vosu 1.1.0. Opt in to per-column mania press/release timing arrays in v2 and precise payloads.                                |
| `POLL_RATE`                   | `150`                            | `100`–`60000` ms                                                        | Regular game-state interval.                                                                                                                                                 |
| `PRECISE_DATA_POLL_RATE`      | `10`                             | `1`–`60000` ms                                                          | Precise key and hit-error state interval.                                                                                                                                    |
| `V2_SUBSCRIPTION_DEBOUNCE`    | `1`                              | `1`–`60000` ms                                                          | Selected-field sampling interval and minimum time between subscription WebSocket frames.                                                                                     |
| `SHOW_MP_COMMANDS`            | `false`                          | Boolean                                                                 | Include multiplayer commands where supported, in tournament chat data.                                                                                                       |
| `READ_MANIA_SCROLL_SPEED`     | `true`                           | Boolean                                                                 | Read mania scroll speed from game memory.                                                                                                                                    |
| `SERVER_IP`                   | `"127.0.0.1"`                    | String: listener hostname or address                                    | Choose where the HTTP/WebSocket server listens.                                                                                                                              |
| `SERVER_PORT`                 | `24050`                          | Whole number `1`–`65535` in Settings; file/listener accepts `0`–`65535` | Listener port. File value `0` requests an OS-assigned port; use a fixed nonzero port for ordinary overlay URLs.                                                              |
| `STATIC_FOLDER_PATH`          | `"./static"`                     | String: directory path                                                  | Root scanned and served for counters.                                                                                                                                        |
| `ALLOWED_IPS`                 | `"127.0.0.1,localhost,absolute"` | String: comma-separated policy tokens                                   | Allowed network peer patterns and Origin/Referer host tokens. `absolute` is a legacy raw-header token; opaque/file-origin reads are allowed independently for trusted peers. |

Listener port validation differs from the dashboard: [the listener](https://github.com/shiruviaa/vosu/blob/main/src/runtime/lifecycle.rs) accepts the full integral `u16` range, while [Settings](https://github.com/shiruviaa/vosu/blob/main/src/runtime/render.rs) requires 1–65535. Do not run the daemon as root to bind a privileged port.

### Example

```toml
ENABLE_AUTOUPDATE = true
OPEN_DASHBOARD_ON_STARTUP = false
START_AT_LOGIN = false
POLL_RATE = 150.0
PRECISE_DATA_POLL_RATE = 10.0
V2_SUBSCRIPTION_DEBOUNCE = 1.0
SERVER_IP = "127.0.0.1"
SERVER_PORT = 24050.0
STATIC_FOLDER_PATH = "./static"
ALLOWED_IPS = "127.0.0.1,localhost,absolute"
```

Omitted keys take their schema defaults at startup. Unknown keys are ignored. A known key with the wrong TOML type, including a nonfinite numeric TOML value, falls back to that key's default. File intervals below the minimum or above 60000 are clamped with a warning. Dashboard saves reject invalid intervals or ports **as a whole** without saving part of the update.

## Reload and migration

vosu watches the configuration's parent directory and applies supported changes without restarting. Writes use atomic same-directory replacement. Malformed TOML during reload leaves the last-good configuration and dependent resources active; malformed canonical TOML at startup leaves all source files untouched.

Startup migration precedence is `vosu.toml > vosu.env > tosu.env > defaults`. The `.env` files are **legacy migration inputs**, not the current configuration format. vosu writes canonical TOML before removing readable legacy files. On Linux, legacy `tosu` XDG data moves to `vosu` roots without overwriting existing files.

## Environment controls

The TOML binding names above are file keys; do not assume setting `POLL_RATE` or `SERVER_IP` in your shell overrides the file. The documented runtime environment controls are separate:

| Variable              | Default / values                                         | Effect                                                                                                           |
| --------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `VOSU_OSU_PATH`       | Unset; absolute game-install path when supplied          | Override game-path discovery. Useful when Wine does not expose the install directory.                            |
| `VOSU_PROCESS_EVENTS` | Unset = `auto`; `auto`, `ebpf`, `cn-proc`, `poll`, `off` | Linux process-event backend selection when compiled with `linux-process-events`; `poll` and `off` force polling. |
| `XDG_CONFIG_HOME`     | `$HOME/.config`                                          | Linux configuration base.                                                                                        |
| `XDG_DATA_HOME`       | `$HOME/.local/share`                                     | Linux data base.                                                                                                 |
| `XDG_CACHE_HOME`      | `$HOME/.cache`                                           | Linux cache base.                                                                                                |

Example for experimental Linux osu!stable through Wine:

```sh
VOSU_OSU_PATH=/absolute/path/to/osu\! VOSU_PROCESS_EVENTS=auto vosu
```

Linux can also read the game path from `${XDG_DATA_HOME:-$HOME/.local/share}/osuconfig/osupath`. See [Linux setup](/vosu/guide/linux) for permissions and backend behavior.

## Listener and remote access

Keep `SERVER_IP = "127.0.0.1"` unless remote access is deliberate and protected. `0.0.0.0` is a wildcard listener, not a security setting. A network client must match an allowed peer pattern **and**, when supplied, an allowed Origin/Referer token. Hostname tokens alone do not authorize arbitrary remote peers; wildcard octets such as `192.168.*.*` are supported.

::: danger No internet exposure
The API uses plain HTTP/WebSocket, has no login, and exposes game state, files, counters, and the dashboard. Never expose it to the internet. Other local programs can read the default listener.
:::

Management actions require exact same-origin browser provenance matching the native listener's scheme, host, and port. Forwarded headers do not authorize HTTPS reverse-proxy origins. Installed counters share that origin, and native programs can forge the headers: this is CSRF protection, not authentication or counter isolation.

See [privacy and security](/vosu/guide/privacy-security), [developer security](/vosu/dev/security), and [troubleshooting](/vosu/guide/troubleshooting). Release installation and update choices are covered in [install](/vosu/guide/install) and [updates](/vosu/guide/updates).

Sources: [schema](https://github.com/shiruviaa/vosu/blob/main/src/config/schema.rs), [parsing and validation](https://github.com/shiruviaa/vosu/blob/main/src/config/document.rs), [migration](https://github.com/shiruviaa/vosu/blob/main/src/config/migration.rs), and [configuration README](https://github.com/shiruviaa/vosu/blob/main/README.md#configuration).
