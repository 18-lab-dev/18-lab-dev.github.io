---
title: Install vosulay
description: Install verified Linux or Windows releases and keep the complete runtime together.
---

# Install vosulay

The current release is **1.5.0**. vosulay needs a [running backend](/vosulay/getting-started); installing it does not install vosu.

## Install from the vosu dashboard

With vosu 1.2.0 or newer, open **Tools → Available**, install **vosulay** from the official `18-lab-dev/vosulay` catalog source, then choose **Open** for the full profile editor. See [vosu tools](/vosu/guide/tools).

vosu owns the host's lifetime: use its dashboard **Start / Stop / Restart** controls; exiting vosu stops vosulay too. The tray keeps editing/visibility controls and **Open in vosu dashboard**, without an Exit item. Opening the tool URL directly (or reloading) shows a view-only profile; open again from the dashboard to edit.

Launching the standalone app, a saved autostart entry, or the CLI while a running vosu has this tool enabled hands off to vosu instead of creating a second host. If vosu is absent or the tool is disabled, standalone operation is unchanged. Starting the tool asks an existing compatible standalone host to flush and release ownership first; it never force-kills a process.

The tool uses vosu's backend and separate tool data/cache directories. On its first start into an empty data directory it copies an existing standalone configuration, including profiles, without changing the original. Stop a standalone vosulay before enabling the tool: only one host may own your user. Tool mode does not register launchers or rewrite game shortcuts. Linux game launch integration must use the matching packaged compositor/lookup libraries described [below](#linux-packages); restart the game after changing versions.

## Standalone installation

Standalone packages remain available for vosu or tosu, with their existing configuration, launcher registration and lifecycle. Download the x86_64 package for your platform from the [v1.5.0 release](https://github.com/18-lab-dev/vosulay/releases/tag/v1.5.0).

## Verify the download

Published releases include `SHA256SUMS`. Compare your file's SHA-256 with its entry:

::: code-group
```sh [Linux]
sha256sum vosulay-1.5.0-linux-x86_64.tar.gz
```

```powershell [Windows]
Get-FileHash .\vosulay-1.5.0-windows-x86_64-setup.exe -Algorithm SHA256
```
:::

Releases **after v1.2.0** also include a detached `<file>.sig` for every asset. Download the [public release key](https://github.com/18-lab-dev/vosulay/blob/main/packaging/release-signing-key.asc) as `release-signing-key.asc`. Its fingerprint is:

```text
6F0F 0D30 C09D 3A03 6246  A810 2CB6 524B B54B 2CDA
```

With GnuPG installed, inspect the imported key's fingerprint and verify the matching asset:

```sh
gpg --import release-signing-key.asc
gpg --fingerprint B54B2CDA
gpg --verify <file>.sig <file>
```

v1.2.0 predates detached release signatures. OpenPGP asset signatures are not Windows executable signing: the published Windows binaries are unsigned and SmartScreen may warn.

## Linux packages

| Distribution               | Command                                             |
| -------------------------- | --------------------------------------------------- |
| Ubuntu 22.04+ / Debian 12+ | `sudo apt install ./vosulay_1.5.0-1_amd64.deb`      |
| Fedora                     | `sudo dnf install ./vosulay-1.5.0-1.x86_64.rpm`     |
| Arch Linux                 | `sudo pacman -U vosulay-1.5.0-1-x86_64.pkg.tar.zst` |

Launch **Vosulay** from the applications menu or run `vosulay`. Packages include the runtime and system launcher; startup does not create a duplicate user launcher. Linux releases require glibc 2.35 or newer.

### Tarball

For another compatible distribution, extract `vosulay-1.5.0-linux-x86_64.tar.gz` and run `./vosulay` inside it. Install the CEF runtime dependencies listed in [package metadata](https://github.com/18-lab-dev/vosulay/blob/main/packaging/linux/nfpm.yaml).

Keep the executable, CEF resources/locales, sandbox helper, compositor/lookup libraries and Vulkan manifest together. Startup registers a user launcher pointing to this location. If you move it, launch again to update registration. Startup downloads nothing.

::: warning Chromium sandbox
On Ubuntu 24.04+ restricted unprivileged user namespaces may prevent a tarball launch. Prefer the `.deb`, or configure **only a verified, trusted release's** helper from inside its extracted directory:

```sh
sudo chown root:root chrome-sandbox && sudo chmod 4755 chrome-sandbox
```

Distribution packages already install this helper setuid root. This is Chromium's sandbox helper, not elevation of the overlay host.
:::

## Windows

Run `vosulay-1.5.0-windows-x86_64-setup.exe`. The per-user Inno Setup installer needs no administrator privileges and defaults to `%LOCALAPPDATA%\Programs\Vosulay`.

It creates a Start Menu shortcut. Desktop and start-with-Windows shortcuts are optional and unchecked by default; the final page offers to launch vosulay. See [Windows](/vosulay/windows) for SmartScreen and game integration.

Alternatively extract `vosulay-1.5.0-windows-x86_64.zip` and run `vosulay.exe`. Keep `vosulay.dll`, CEF runtime files/locales and both injection DLLs beside it. **The ZIP uses the same user configuration as the installer; it is not portable config by default.**

## Upgrade

Stop the managed tool in vosu's dashboard, or choose **tray → Exit vosulay** for standalone use. Hiding is not quitting. Close games that have loaded the overlay before replacing libraries.

- Linux packages: download and install the newer package with the same command. No apt/dnf/pacman repository is configured, so a system upgrade does not fetch vosulay releases.
- Linux tarball: replace the complete extracted runtime, not only the executable.
- Windows installer: run the newer installer over the existing installation.
- Windows ZIP: replace the unpacked directory as a complete runtime.

Keep a backup of your [configuration](/vosulay/settings#configuration-files). See [Uninstall](/vosulay/uninstall) for retained data and launcher cleanup.

## Build from source

Follow the repository's [native prerequisites and contribution guide](https://github.com/18-lab-dev/vosulay/blob/main/CONTRIBUTING.md), then its [source installation instructions](https://github.com/18-lab-dev/vosulay/blob/main/README.md#build-from-source). Cargo acquires the pinned precompiled CEF distribution when needed; this is not a Chromium source build. Linux source installs rely on retained runtime/overlay caches, so copying only the executable is insufficient.

Source: [installation instructions](https://github.com/18-lab-dev/vosulay/blob/main/README.md#install).
