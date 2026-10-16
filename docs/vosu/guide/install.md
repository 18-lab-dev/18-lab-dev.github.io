---
title: Install vosu
description: Portable archives, Linux packages, per-user installation, and release signature verification.
---

# Install vosu

Download from [shiruviaa/vosu releases](https://github.com/shiruviaa/vosu/releases). The published README documents v1.0.1; the commands below use that version. For a newer release, substitute its actual asset filename.

## Portable archive

Download `vosu-linux-v1.0.1.zip` or `vosu-windows-v1.0.1.zip` and extract the **whole archive** into a writable directory. The release archive contains the executable and `LICENSE`.

::: code-group
```sh [Linux]
chmod +x vosu
./vosu
```

```powershell [Windows]
.\vosu.exe
```
:::

vosu opens the dashboard by default. You can also open `http://127.0.0.1:24052/` yourself (`DASHBOARD_IP:DASHBOARD_PORT`). Overlay URLs remain on port **24050**, preserving their browser storage. On Linux, complete [capability setup](/vosu/guide/linux).

::: warning Windows installation location
Do not run the executable inside an archive or from a OneDrive-controlled directory: safe updater replacement and rollback are unavailable there. Published v1.0.0 and v1.0.1 Windows executables are unsigned, so SmartScreen may warn. Verify the download below before deciding whether to launch it; an OpenPGP signature is not Windows Authenticode signing.
:::

## Linux packages

Requirements: glibc **2.35 or newer** (Debian 12+, Ubuntu 22.04+, current Fedora and Arch). Choose the matching package from the release.

::: code-group
```sh [Debian / Ubuntu]
sudo apt install ./vosu_1.0.1_amd64.deb
```

```sh [Fedora]
sudo dnf install ./vosu-1.0.1-1.x86_64.rpm
```

```sh [Arch Linux]
sudo pacman -U ./vosu-1.0.1-1-x86_64.pkg.tar.zst
```
:::

Packages install the launcher, icons, executable, and license, and attempt capability setup on install and upgrade. If that fails, installation still succeeds and prints guidance to run `/usr/bin/vosu --setup` as your desktop user. Launch **vosu** from the application menu or run `vosu`; do not run the daemon with `sudo`.

No apt, dnf, or pacman repository or system service is installed. [Update packages manually](/vosu/guide/updates); start at login is opt-in.

### AUR source package

The source recipe is `vosu-git`, targeting the current `main` branch. The published README says it can be installed from the AUR **once published**, so this guide does not assume an AUR listing is live. The canonical [PKGBUILD](https://github.com/shiruviaa/vosu/blob/main/packaging/aur/PKGBUILD) can be built from a local checkout:

```sh
cd packaging/aur
makepkg -si
```

The source package requires the .NET 8 SDK at **build time** for the embedded offset generator; release users do not need it.

## Manual per-user installation

From the extracted archive, install to a user-writable location for self-updates.

::: code-group
```sh [Linux]
install -Dm755 vosu "$HOME/.local/bin/vosu"
install -Dm644 LICENSE "$HOME/.local/share/licenses/vosu/LICENSE"
"$HOME/.local/bin/vosu"
```

```powershell [Windows]
$installDir = Join-Path $env:LOCALAPPDATA "Programs\vosu"
New-Item -ItemType Directory -Force $installDir | Out-Null
Copy-Item .\vosu.exe, .\LICENSE $installDir
& "$installDir\vosu.exe"
```
:::

Add `$HOME/.local/bin` to `PATH` if needed. On Linux, run setup against the **installed executable**, not the extracted copy.

## Verify release signatures

From v1.0.1, every release file has a detached `<file>.sig` signature. Download both the asset and its signature. Obtain [the release public key](https://github.com/shiruviaa/vosu/blob/main/packaging/release-signing-key.asc) and check its fingerprint:

```text
6F0F 0D30 C09D 3A03 6246  A810 2CB6 524B B54B 2CDA
```

With GnuPG installed, and the key saved as `release-signing-key.asc`:

```sh
gpg --show-keys --fingerprint release-signing-key.asc
gpg --import release-signing-key.asc
gpg --verify vosu-linux-v1.0.1.zip.sig vosu-linux-v1.0.1.zip
```

Use the Windows ZIP or Linux package filename when verifying those assets. Require a good signature from the fingerprint above, not just a matching display name.

Next: [dashboard](/vosu/guide/dashboard), [overlays](/vosu/guide/overlays), or [troubleshooting](/vosu/guide/troubleshooting).

Source: [installation and verification README](https://github.com/shiruviaa/vosu/blob/main/README.md#install).
