---
title: Linux setup
description: Configure vosu process-reading capabilities, process-event backends, and Linux client paths.
---

# Linux setup

Use the [release archive or distribution package](/vosu/guide/install). Linux releases require glibc 2.35+, `libelf.so.1`, and `libz.so.1`; libbpf is included statically in official archives.

## Grant process access

Run the exact installed executable as your normal desktop user:

```sh
vosu --setup
```

For a per-user install not on `PATH`:

```sh
"$HOME/.local/bin/vosu" --setup
```

`--setup` must be the only argument. It configures capabilities and exits; it does not start the daemon. Start vosu normally afterward, under the same user as osu!.

::: danger Do not run the daemon as root
Setup may elevate to configure an executable, but ordinary vosu must run as your desktop user, not root. Same-account process checks remain in force.
:::

### Authentication behavior

Unprivileged setup validates its executable and invokes that exact path through a trusted, root-owned, non-writable `pkexec`. Polkit supplies the graphical or terminal credential prompt; vosu never reads, logs, or retains your password. If authentication is cancelled, fails, has no working agent, or trusted `pkexec` is unavailable, setup exits before calling `setcap`. There is no sudo fallback.

A portable executable or its directory may be user-writable. Setup warns before the prompt because authentication authorizes whichever file occupies that path. Root-owned, write-protected package installations avoid that warning. Do not authenticate an executable whose contents or directory you do not trust.

### Capabilities

| Working backend         | Retained file capabilities                               |
| ----------------------- | -------------------------------------------------------- |
| eBPF                    | `cap_sys_ptrace,cap_sys_resource,cap_perfmon,cap_bpf=ep` |
| No working eBPF backend | `cap_sys_ptrace=ep`                                      |

Normal startup warns when `CAP_SYS_PTRACE` is not effective or cannot be checked. The warning does not prevent startup, but the kernel's ptrace policy may block reads.

Default Linux builds include `linux-process-events`. Setup attempts the maximum compiled set, re-executes to probe eBPF and CN_PROC independently, and retains the extra capabilities only when eBPF works. If the maximum set is unavailable, it retries with `CAP_SYS_PTRACE`; CN_PROC needs no extra file capability. Polling-only builds receive `CAP_SYS_PTRACE` alone.

Packages attempt setup after install and upgrade. Failure is nonfatal to the package transaction; follow the printed `/usr/bin/vosu --setup` guidance.

::: tip After updates
Executable replacement removes file capabilities. Rerun setup after replacing vosu, including a self-update. Package upgrade scripts attempt this automatically.
:::

## Process-event backends

With `linux-process-events` compiled, the default `auto` mode tries eBPF, then the kernel process connector (CN_PROC), then polling. Select a mode for one launch:

```sh
VOSU_PROCESS_EVENTS=poll vosu
```

| Value           | Selection                                   |
| --------------- | ------------------------------------------- |
| Unset or `auto` | eBPF → CN_PROC → polling                    |
| `ebpf`          | Explicit eBPF selection                     |
| `cn-proc`       | Explicit kernel process-connector selection |
| `poll` or `off` | Force polling                               |

eBPF observes kernel process lifecycle events but reports only osu! candidate names to vosu. Process events improve discovery; they do not replace permission to read game memory.

## osu!lazer

Use the official native executable or an AppImage layout exposing `osu!.deps.json`. Sandbox restrictions must allow discovery and memory reads. Versioned offsets resolve automatically from cache, embedded data, then local generation. Release users do not install .NET or an SDK.

## osu!stable through Wine

This path is **experimental and not release-verified**. Existing Wine discovery and native reads do not guarantee compatibility with a particular game build.

If Wine hides the installation directory, set the absolute path:

```sh
VOSU_OSU_PATH='/absolute/path/to/osu!' vosu
```

vosu can also read `${XDG_DATA_HOME:-$HOME/.local/share}/osuconfig/osupath`. Offset or signature resolution can remain pending and retry while the process lives; that alone does not prove support.

Continue with [dashboard](/vosu/guide/dashboard), [configuration](/vosu/guide/configuration), or [troubleshooting](/vosu/guide/troubleshooting).

Sources: [Linux platform README](https://github.com/shiruviaa/vosu/blob/main/README.md#platform-support) and [security disclosure](https://github.com/shiruviaa/vosu/blob/main/docs/security.md#linux).
