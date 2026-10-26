---
title: vosulay on Windows
description: Windows installation, osu! attachment, hotkeys and capture caveats.
---

# vosulay on Windows

vosulay renders inside **osu!stable** (`osu!.exe`) and **osu!lazer** (`osulazer.exe`) through native **asdf-overlay 2.1.0** injection. Run it alongside a separately running vosu or tosu-compatible backend.

## Install and launch

The [release installer](/vosulay/install) installs per user to `%LOCALAPPDATA%\Programs\Vosulay` without administrator privileges. It creates a Start Menu shortcut. Desktop and start-with-Windows shortcuts are optional and unchecked by default; the final page offers launch.

The ZIP distribution runs from its extracted directory but uses `%APPDATA%\vosulay\config.json` by default, just like the installer. Keep `vosulay.exe`, `vosulay.dll`, CEF files/locales and both injection DLLs together. See [portable configuration](/vosulay/settings#configuration-files) if you want adjacent data.

### SmartScreen

Windows releases are currently unsigned. SmartScreen may warn about the installer or binary. Verify its [checksum and release signature](/vosulay/install#verify-the-download) and obtain it from the official releases page before deciding whether to run it. An OpenPGP download signature does not make a Windows executable Authenticode-signed.

Normal operation does not request elevation. Do not elevate just to bypass attachment restrictions.

## Focus the game

The host follows the last focused supported game, stays attached when focus leaves it and switches only after another supported game gains focus. It recovers after a game restart.

Press **Ctrl+Shift+Space** with the game focused to edit. Windows registers configurable global hotkeys; edit toggle acts only with game focus, while a configured hide/show chord can act regardless of focus. If another application owns your chosen chord, select another in **Settings → Shortcuts**.

::: warning Disable tosu's competing overlay
When using tosu, open **tosu dashboard → Settings → Overlay** and disable **In-Game Overlay**, or set `ENABLE_INGAME_OVERLAY=false` in `tosu.env` beside `tosu.exe`.

tosu otherwise starts `tosu-ingame-overlay.exe` and injects another asdf-overlay into the same game. Two hosts hooking the game's presentation and input are unsupported.
:::

## OBS capture

OBS's **Capture third-party overlays** setting is **not a guaranteed exclusion switch**. vosulay's asdf-overlay draws before forwarding DXGI Present/Present1, so exclusion still depends on which presentation hook runs first. The upstream description is source-based, not a native Windows capture-verification claim.

For a separate stream overlay, use [profile pages](/vosulay/remote) as OBS browser sources.

## Upgrade or remove

Choose **tray → Exit vosulay** before upgrading or uninstalling; hiding leaves the host running. Close games that loaded the overlay before replacing its DLLs. Run the newer installer over the existing install, or replace a ZIP's complete runtime directory.

Windows uninstall retains user settings and profiles. See [Uninstall](/vosulay/uninstall) for full removal.

Sources: [Windows README](https://github.com/18-lab-dev/vosulay/blob/main/README.md#windows-1), [installation disclosure](https://github.com/18-lab-dev/vosulay/blob/main/docs/security.md).
