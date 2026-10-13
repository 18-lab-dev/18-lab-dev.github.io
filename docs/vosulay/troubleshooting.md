---
title: Troubleshooting vosulay
description: Source-grounded fixes for missing counters, input, saving, attachment and remote pages.
---

# Troubleshooting vosulay

## Missing or blank overlays

| Symptom                                                   | What to check                                                                                                                                                                     |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nothing appears in game                                   | Focus a supported game, clear **tray → Hide vosulay**, check the placement is **Enabled** and inside the viewport.                                                                |
| Installed counters are missing                            | Run the backend separately. Verify **Settings → Advanced → vosu URL** and restart after changing it. Default is `http://127.0.0.1:24050/`.                                        |
| Counter catalog reports a failure                         | Restore backend reachability, then use the catalog's retry action.                                                                                                                |
| Linux game was already running                            | Live attachment may be restricted. Restart through the refreshed shortcut or use the documented [preload/Vulkan layer](/vosulay/linux). Do not weaken ptrace policy to bypass it. |
| Overlay broke after replacing files                       | Keep the host, injected libraries and CEF runtime from the same complete package. Exit the host and close the game before replacing libraries.                                    |
| Windows with tosu behaves incorrectly                     | Disable tosu's **In-Game Overlay**; two overlay hosts in the same game are unsupported. See [Windows](/vosulay/windows).                                                          |
| A counter relying on vosu-only data stays empty with tosu | tosu does not provide vosu's `/websocket/v2/subscribe`. Use the backend required by the counter.                                                                                  |
| A different running game was selected                     | Selection follows game focus, not process start/enumeration order. Focus the intended supported game.                                                                             |

**Keep overlays in view** only constrains the selected placement during editing. It does not automatically relocate every off-screen counter.

## Editor and input

| Symptom                                             | Fix or explanation                                                                                                                       |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Edit shortcut has no effect                         | Focus the attached game; Linux shortcuts run through game input and Windows edit toggle is focus-gated. Default is **Ctrl+Shift+Space**. |
| Windows reports a hotkey registration warning       | Another app owns the chord. Choose a different one in **Settings → Shortcuts**.                                                          |
| Tray Edit mode is checked but input is not captured | Focus the game. The request stays pending until then; selecting it again cancels it.                                                     |
| Editor disappears while switching windows           | Default focus-loss behavior ends editing. Turn off **Leave edit mode when the game loses focus** to retain it visually.                  |
| Input capture fails or vosulay exits                | Capture/heartbeat failures release input or terminate the host within the five-second safety bound. Restart vosulay if needed.           |
| No Linux tray icon                                  | Your desktop needs StatusNotifierItem tray support.                                                                                      |
| Starting the app again exits immediately            | Single-instance behavior: a host is already running. Hiding is not quitting; use **Exit vosulay**.                                       |

## Startup and saving

- **Chromium will not start from a tarball on Ubuntu 24.04+:** use the distribution package or the trusted helper setup in [Install](/vosulay/install#tarball). Restricted user namespaces may block the sandbox route.
- **Source-installed Linux runtime/cache is missing:** Cargo installs depend on retained runtime/overlay caches. Reinstall rather than copying only the executable.
- **Configuration load error:** malformed/unreadable JSON or an unsupported schema is an error, not silently reset. Back up and repair the selected [config file](/vosulay/settings#configuration-files).
- **Save error:** unsaved local edits may remain onscreen. For a revision conflict, edit again to retry, or restart vosulay to accept the saved configuration. For a later local edit awaiting retry, edit again. Do not assume an onscreen layout was persisted until the toolbar reports **Saved**.

## Remote page problems

| Symptom                                      | Check                                                                                                                                                                 |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Local counters work but remote page does not | A remote-port bind failure does not stop the separate in-game broker. Check logs and choose an available listener port; restart after changing it.                    |
| LAN device cannot reach a page               | Default listener is loopback-only. Set a LAN interface IP or `0.0.0.0`, list the client's IP, restart, and use the host's actual LAN address in the URL.              |
| Remote counters cannot reach backend data    | Backend permissions must allow the vosulay host, not each viewing device.                                                                                             |
| OBS/browser page is not editable             | Enable **Allow editing on this computer**, use `127.0.0.1` or `localhost` on that computer, then press the edit shortcut inside the page. LAN pages remain view-only. |
| OBS display capture contains vosulay         | Expected: Linux game-capture exclusion does not apply to Display Capture. Windows third-party-overlay capture settings are not a guaranteed exclusion switch.         |

See [Remote profiles](/vosulay/remote) before widening listener access.

## Get help

For setup questions, use [Discussions → Q&A](https://github.com/shiruviaa/vosulay/discussions/categories/q-a). Report reproducible bugs with the [bug form](https://github.com/shiruviaa/vosulay/issues/new?template=bug_report.yml), including vosulay version, OS, game/backend versions and logs.

If a counter works standalone but not in vosulay, use the [counter compatibility form](https://github.com/shiruviaa/vosulay/issues/new?template=counter_compatibility.yml). `cef.log` is in `cef-cache` beside the selected configuration. Review logs and redact private URLs/paths before posting. Report security problems [privately](https://github.com/shiruviaa/vosulay/blob/main/SECURITY.md).

Sources: [troubleshooting](https://github.com/shiruviaa/vosulay/blob/main/README.md#troubleshooting), [operations](https://github.com/shiruviaa/vosulay/blob/main/docs/operations.md#attachment-and-troubleshooting), [support](https://github.com/shiruviaa/vosulay/blob/main/SUPPORT.md), [save-error behavior](https://github.com/shiruviaa/vosulay/blob/main/assets/manager.js).
