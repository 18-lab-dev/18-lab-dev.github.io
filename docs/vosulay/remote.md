---
title: Remote profile pages
description: Show a profile in OBS or on trusted LAN devices, edit from this computer, or run vosulay as an overlay server only.
---

# Remote profile pages

vosulay serves the active profile at:

```text
http://127.0.0.1:5050/overlay
```

Use this URL in a browser or an OBS browser source on the same computer. To show a particular profile, append its **1-based list position**:

```text
http://127.0.0.1:5050/overlay?profile=2
```

Reordering [profiles](/vosulay/profiles) changes that position. Remote clients remain usable independently of an in-game view.

## Reach another device on the LAN

1. In **Settings → Remote overlay server**, change **Listener address** from `127.0.0.1` to this computer's specific LAN interface IP, or `0.0.0.0` for every interface.
2. Set **Listener port** (default `5050`).
3. Add trusted viewing devices to **Allowed client IPs**. Supported remote entries are exact IPs or four-part IPv4 patterns such as `192.168.*.*`. Loopback is always allowed.
4. **Save** and restart vosulay for listener address/port changes.
5. On the device, open `http://<vosulay computer's LAN IP>:<port>/overlay`.

Clients use the actual LAN IP, **not `0.0.0.0`**. The allowlist controls vosulay, not the backend. Installed counters load through vosulay, so the backend must permit the vosulay host, not every viewing device. Custom pages on unrelated HTTP(S) origins still load directly.

::: danger Trusted-network service, not authenticated sharing
The listener has **no access token and no TLS**. An allowed client can select any profile, view counters/game data, retrieve readable resources in authorized local overlay directories and access the proxied backend, including bidirectional WebSocket command routes. A view-only profile is not a read-only backend security boundary.

Restrict the bind address and allowlist to trusted devices/networks. Host/Origin checks are additional guards, not user authentication. Do not expose this service as a public sharing endpoint.
:::

## Edit from OBS or a local browser

Enable **Settings → Advanced → Allow editing on this computer**. It is off by default and takes effect without restarting. vosulay's full editor is then served, to this computer only, at:

```text
http://manage.localhost:5050/overlay
```

Open it in a browser tab or an OBS browser source; in OBS, use the source's **Interact** window. Press **Ctrl+Shift+Space** inside the page (or your configured edit shortcut), then use the same editor as in game: profiles, settings, local HTML files and imports included. File choices open native dialogs on this computer. Changes apply as they do in game; the in-game editor receives them immediately and other open editor pages update within about two seconds.

The plain `/overlay` address stays view-only for everyone, including this computer. As in game, counters on the editor take no clicks outside edit mode, so the page keeps the keyboard for the edit shortcut; press **Ctrl+I** while editing to interact with them.

::: tip Why a separate address
Counters on the editor load from the plain listener address, a different origin than `manage.localhost`, so neither they nor other websites can use the editing routes. The editor refuses to load inside another page's frame, so it cannot be overlaid with deceptive content to trick clicks. A page can only add a local HTML file you chose in a file dialog.
:::

## Use vosulay as the frontend of other overlay software

Overlay renderers that draw a web page over the game themselves, such as idk-overlay or a Linux window built for tosu's in-game page, can use vosulay's editor as their whole UI:

1. Enable **Allow editing on this computer**.
2. Load `http://manage.localhost:<port>/overlay` as a **top-level** page sized to the game. Outside edit mode it shows only the counters on a transparent background; in edit mode it is the full editor. Framed (iframe) loads are refused.
3. Switch edit mode the way tosu's in-game overlay does, by running `window.postMessage('editingStarted')` or `window.postMessage('editingEnded')` in the page.
4. Listen for `message` events: the page posts the same strings when it enters or leaves edit mode itself (shortcut, Escape, **Done**), so the host knows when to capture input or restore click-through. Messages from counter frames are ignored.

To keep vosulay from also drawing inside the game, run it as an overlay server only (next section).

## Run as an overlay server only

```sh
vosulay --server-only
```

This serves the remote pages, the backend broker and the editor at `manage.localhost`, but never discovers, injects into or attaches to games, rewrites Linux game launchers, shows a tray or starts the in-game browser. The startup message names the page and editor URLs. Stop it with `vosulay --quit`; `--vosu-url` and `--config` still apply, while game-selection and frame-rate options are rejected. See [Settings → Command line](/vosulay/settings#command-line).

## Which listeners run?

| Listener               | Default / purpose                                                                                                      |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Remote overlay server  | `127.0.0.1:5050`; starts with the host even without a viewer. Also serves `manage.localhost` when local editing is on. |
| In-game backend broker | Separate loopback listener on an OS-assigned port; serves local counters.                                              |
| Local control channel  | Not a network listener: a per-user socket (Linux) or pipe (Windows) for `vosulay --toggle-edit` and `vosulay --quit`.  |

If the remote port is occupied, a bind failure is logged but local counters can still use the broker. **Hide vosulay** does not stop any of them. **Exit vosulay** (or `vosulay --quit`) stops the host and its listeners.

Sources: [remote usage](https://github.com/18-lab-dev/vosulay/blob/main/README.md#remote-profile-pages), [network disclosure](https://github.com/18-lab-dev/vosulay/blob/main/docs/security.md#network-exposure-and-web-content).
