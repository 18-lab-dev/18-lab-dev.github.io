---
title: Install vosulay
description: Install verified Linux or Windows releases and keep the complete runtime together.
---

# Install vosulay

Download the x86_64 package for your platform from [GitHub Releases](https://github.com/shiruviaa/vosulay/releases). In filenames below, replace `<v>` with the release version. vosulay needs a [running backend](/vosulay/getting-started); installing it does not install vosu.

## Verify the download

Published releases include `SHA256SUMS`. Compare your file's SHA-256 with its entry:

::: code-group
```sh [Linux]
sha256sum vosulay-<v>-linux-x86_64.tar.gz
```

```powershell [Windows]
Get-FileHash .\vosulay-<v>-windows-x86_64-setup.exe -Algorithm SHA256
```
:::

Releases **after v1.2.0** also include a detached `<file>.sig` for every asset. Download the [public release key](https://github.com/shiruviaa/vosulay/blob/main/packaging/release-signing-key.asc) as `release-signing-key.asc`. Its fingerprint is:

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

| Distribution               | Command                                           |
| -------------------------- | ------------------------------------------------- |
| Ubuntu 22.04+ / Debian 12+ | `sudo apt install ./vosulay_<v>-1_amd64.deb`      |
| Fedora                     | `sudo dnf install ./vosulay-<v>-1.x86_64.rpm`     |
| Arch Linux                 | `sudo pacman -U vosulay-<v>-1-x86_64.pkg.tar.zst` |

Launch **Vosulay** from the applications menu or run `vosulay`. Packages include the runtime and system launcher; startup does not create a duplicate user launcher. Linux releases require glibc 2.35 or newer.

### Tarball

For another compatible distribution, extract `vosulay-<v>-linux-x86_64.tar.gz` and run `./vosulay` inside it. Install the CEF runtime dependencies listed in [package metadata](https://github.com/shiruviaa/vosulay/blob/main/packaging/linux/nfpm.yaml).

Keep the executable, CEF resources/locales, sandbox helper, compositor/lookup libraries and Vulkan manifest together. Startup registers a user launcher pointing to this location. If you move it, launch again to update registration. Startup downloads nothing.

::: warning Chromium sandbox
On Ubuntu 24.04+ restricted unprivileged user namespaces may prevent a tarball launch. Prefer the `.deb`, or configure **only a verified, trusted release's** helper from inside its extracted directory:

```sh
sudo chown root:root chrome-sandbox && sudo chmod 4755 chrome-sandbox
```

Distribution packages already install this helper setuid root. This is Chromium's sandbox helper, not elevation of the overlay host.
:::

## Windows

Run `vosulay-<v>-windows-x86_64-setup.exe`. The per-user Inno Setup installer needs no administrator privileges and defaults to `%LOCALAPPDATA%\Programs\Vosulay`.

It creates a Start Menu shortcut. Desktop and start-with-Windows shortcuts are optional and unchecked by default; the final page offers to launch vosulay. See [Windows](/vosulay/windows) for SmartScreen and game integration.

Alternatively extract `vosulay-<v>-windows-x86_64.zip` and run `vosulay.exe`. Keep `vosulay.dll`, CEF runtime files/locales and both injection DLLs beside it. **The ZIP uses the same user configuration as the installer; it is not portable config by default.**

## Upgrade

Choose **tray → Exit vosulay** first. Hiding is not quitting. Close games that have loaded the overlay before replacing libraries.

- Linux packages: download and install the newer package with the same command. No apt/dnf/pacman repository is configured, so a system upgrade does not fetch vosulay releases.
- Linux tarball: replace the complete extracted runtime, not only the executable.
- Windows installer: run the newer installer over the existing installation.
- Windows ZIP: replace the unpacked directory as a complete runtime.

Keep a backup of your [configuration](/vosulay/settings#configuration-files). See [Uninstall](/vosulay/uninstall) for retained data and launcher cleanup.

## Build from source

Follow the repository's [native prerequisites and contribution guide](https://github.com/shiruviaa/vosulay/blob/main/CONTRIBUTING.md), then its [source installation instructions](https://github.com/shiruviaa/vosulay/blob/main/README.md#build-from-source). Cargo acquires the pinned precompiled CEF distribution when needed; this is not a Chromium source build. Linux source installs rely on retained runtime/overlay caches, so copying only the executable is insufficient.

Source: [installation instructions](https://github.com/shiruviaa/vosulay/blob/main/README.md#install).
