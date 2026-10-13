---
title: Updates
description: Automatic updates, one-launch update flags, manual replacement, and package upgrades.
---

# Updates

Use stable releases from [shiruviaa/vosu](https://github.com/shiruviaa/vosu/releases). The [security policy](https://github.com/shiruviaa/vosu/blob/main/SECURITY.md) supports only the latest release.

## Portable and user-writable installs

`ENABLE_AUTOUPDATE = true` is the default. At startup, release builds check for stable releases and can install them automatically. The updater checks the selected platform archive against its published SHA-256 digest, stages exactly one root executable, and uses a crash-recoverable helper with rollback.

Turn **Settings → General → Automatic updates** off, or set:

```toml
ENABLE_AUTOUPDATE = false
```

A launch flag overrides startup installation for that launch:

::: code-group
```sh [Linux]
vosu --update=false
# Enable installation for this launch instead:
vosu --update=true
```

```powershell [Windows]
.\vosu.exe --update=false
# Enable installation for this launch instead:
.\vosu.exe --update=true
```
:::

::: info Checking is separate from installing
Self-updating release builds still contact GitHub's latest-release endpoint on every startup with automatic installation disabled, so the dashboard can offer **Update Vosu**. Debug and externally managed installs do not check. See [privacy and security](/vosu/guide/privacy-security).
:::

The dashboard's **Update Vosu** action runs the same update path. Use the dashboard served by vosu, not a file-loaded page or mismatched proxy origin.

Do not run the Windows executable from an archive or OneDrive-controlled directory: safe replacement and rollback are unavailable there.

## Externally managed installs

When the current user cannot write the executable's directory, vosu treats the installation as externally managed on Linux and Windows. Startup skips update checking and recovery, and **Automatic updates** is disabled with an explanation. The update action reports that the install is managed by a package manager rather than attempting replacement.

Linux release packages configure no software repository. A normal system upgrade therefore does not fetch a newer vosu release. Download the newer package from [GitHub releases](https://github.com/shiruviaa/vosu/releases) and install it with the same `apt install ./…`, `dnf install ./…`, or `pacman -U …` command used in [installation](/vosu/guide/install#linux-packages). The package manager replaces the installed version.

For `vosu-git`, update with your AUR helper if available, or rebuild the source recipe from current `main`. This is a development-branch package, not a stable-release channel.

## Manual replacement

1. Download and [verify](/vosu/guide/install#verify-release-signatures) the new complete archive.
2. Quit vosu from the tray.
3. Replace the executable and `LICENSE` with the new archive's files.
4. On Linux, run `vosu --setup` against the replaced executable: replacement removes its file capabilities.
5. Restart vosu and check the [dashboard](/vosu/guide/dashboard).

Keep configuration and counter data if you want to retain settings. Their paths are in [configuration](/vosu/guide/configuration#file-locations). For failure diagnosis, see [troubleshooting](/vosu/guide/troubleshooting).

Source: [automatic updates README](https://github.com/shiruviaa/vosu/blob/main/README.md#automatic-updates) and [operations runbook](https://github.com/shiruviaa/vosu/blob/main/docs/operations/runbook.md).
