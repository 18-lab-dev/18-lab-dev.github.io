---
title: Remote profile pages
description: Show a profile in OBS or on trusted LAN devices, with optional same-computer editing.
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

Enable **Settings → Advanced → Allow editing on this computer**. It is off by default and takes effect without restarting.

Open the profile page through `127.0.0.1` or `localhost` on the same machine. In OBS, open the browser source's **Interact** window. Press **Ctrl+Shift+Space** inside the page (or your configured edit shortcut), then use the editor.

Changes save to the profile the page shows. The in-game editor receives them immediately; other open pages update within about two seconds. Profile management, app settings and the local HTML picker remain in the in-game editor. Other devices stay view-only.

::: warning Same-origin counters can also edit
Unrelated websites cannot use the editing routes, but installed counters run on the page's own origin and can make the same edits. Enable local editing only with trusted counters. Remote saves cannot authorize new local overlay directories.
:::

## Which listeners run?

| Listener               | Default / purpose                                                         |
| ---------------------- | ------------------------------------------------------------------------- |
| Remote overlay server  | `127.0.0.1:5050`; starts with the host even without a viewer.             |
| In-game backend broker | Separate loopback listener on an OS-assigned port; serves local counters. |

If the remote port is occupied, a bind failure is logged but local counters can still use the broker. **Hide vosulay** does not stop either listener. **Exit vosulay** stops the host and its listeners.

Sources: [remote usage](https://github.com/shiruviaa/vosulay/blob/main/README.md#remote-profile-pages), [network disclosure](https://github.com/shiruviaa/vosulay/blob/main/docs/security.md#network-exposure-and-web-content).
