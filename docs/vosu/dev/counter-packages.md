---
title: Counter packages
description: Package discovery, metadata, setting schemas, values migration, mounts, and catalog installation.
---

# Counter packages

A counter is a web page served from vosu's configured `STATIC_FOLDER_PATH`. A normal package is one top-level directory with `index.html` and its assets. Use a **single normal folder component** for the name: mutation/settings APIs reject path traversal and multi-component names, even though discovery is recursive.

```text
static/
  my-counter/
    index.html
    main.js
    style.css
    metadata.txt
    settings.schema.toml
```

The page is available at `http://127.0.0.1:24050/my-counter/`. It runs at the **dashboard origin**, with its authority: [read the security boundary](/vosu/dev/security).

## Discovery and metadata

Discovery separately searches recursively for `metadata.txt` and `index.html`. Metadata with a nonempty name creates a card; index-only folders get local-counter defaults. If a directory has metadata, its index does not create another card. An `ignore.txt` inside an **immediate child directory of the static root** excludes that directory and its subtree. The scanner does not apply the ignore check again deeper in recursion. `node_modules` directories are never traversed.

Each named-file search permits at most **4096 matches**. A metadata file must be a regular opened file, at most **64 KiB**; Unix metadata symlinks/FIFOs are rejected. Top-level directory mounts are followed, nested directory symlinks are skipped.

```text
Name: My counter
Author: Your name
Version: 1.0
Resolution: 640x240
AuthorLinks: https://github.com/your-name,https://your-site.example
```

| Metadata key  | Interpretation                                                            |
| ------------- | ------------------------------------------------------------------------- |
| `Name`        | Display name; empty names are not listed as metadata counters             |
| `Author`      | Display author                                                            |
| `Version`     | Version string; defaults to `1.0` if missing/empty                        |
| `Resolution`  | `WxH` size (`x` or `X`); parsed integer dimensions, otherwise `Any × Any` |
| `AuthorLinks` | Comma-separated author links                                              |

Recognized keys are `Name`, `Author`, `AuthorLinks` (comma-separated), `Version`, and `Resolution` (`WxH`), matched case-insensitively. Other keys are ignored. Lines split at the first colon, values are trimmed, and `##` starts an inline comment.

## `window.COUNTER_PATH`

Successful full HTML responses append a script that sets `window.COUNTER_PATH` to the **logical parent directory**, for example `my-counter` for `/my-counter/index.html`. A mounted package keeps the alias name, not its external filesystem target. This preserves stock-counter settings protocol compatibility with tosu.

The script is appended **after** the file content, not injected before your inline scripts. Read it after document loading, or in a deferred/module entry point; do not expect an early inline script to see it. Use it for your own settings namespace and URL-encode it when constructing query/path values. It is not a token or authorization secret.

## Setting schema <Badge type="tip" text="vosu only" />

The package owns authoritative `settings.schema.toml`. It is a TOML document with a `settings` array of descriptors, normally written as repeated `[[settings]]` tables.

```toml
[[settings]]
uniqueID = "textColor"
type = "color"
title = "Text color"
description = "Counter text color"
value = "#ffffff"

[[settings]]
uniqueID = "fontSize"
type = "number"
title = "Font size"
value = 32

[[settings]]
uniqueID = "showLabel"
type = "checkbox"
title = "Show label"
value = true
```

| Descriptor field | Type / behavior                                                    |
| ---------------- | ------------------------------------------------------------------ |
| `uniqueID`       | Required string; key in the compact value map                      |
| `type`           | Required lowercase setting type below                              |
| `title`          | String, default empty                                              |
| `description`    | String, default empty                                              |
| `value`          | Default JSON-compatible value (representable in TOML)              |
| `uniqueCheck`    | Optional string                                                    |
| `options`        | Optional JSON-compatible value; shape is consumed by the hosted UI |

Supported types: **`text`, `color`, `number`, `checkbox`, `button`, `options`, `commands`, `textarea`, `password`, `header`**. These descriptor types are compatibility types, not vosu-exclusive. Number reads coerce numeric text; invalid numeric text becomes zero. Checkbox text is true only for `"true"`. Compact command reads remove header entries. Developer schema saves sanitize IDs to ASCII letters/digits; use such IDs from the start. Unknown IDs in HTTP user-value updates are ignored.

Read `GET /api/counters/settings/<name>` for `{ "settings": [...descriptors], "values": {...storedValues} }`; command `getSettings` returns the compact defaults/coerced-value map instead. For user editing, link **`/settings?overlay=<name>`**. [Commands](/vosu/dev/websocket-api#commands-and-compatibility-filters) and [HTTP writes](/vosu/dev/http-api#counters-and-settings) are management-sensitive.

## Mutable values <Badge type="tip" text="vosu only" />

vosu stores mutable values centrally rather than modifying package defaults:

| Platform         | Authoritative schema                                     | Mutable values                                        |
| ---------------- | -------------------------------------------------------- | ----------------------------------------------------- |
| Linux (defaults) | `~/.local/share/vosu/static/<name>/settings.schema.toml` | `~/.config/vosu/settings/<name>.settings.values.toml` |
| Windows          | `<program>/static/<name>/settings.schema.toml`           | `<program>/settings/<name>.settings.values.toml`      |

Linux respects `XDG_DATA_HOME` / `XDG_CONFIG_HOME`; a custom static root changes the schema location. Value files are top-level TOML key/value maps, for example `fontSize = 32`. Settings files themselves may not be symlinks. Settings/schema storage has no complete aggregate size budget; the HTTP 1 MiB cap is not a promise about all disk content.

### tosu `settings.json` compatibility

vosu does **not** require existing tosu counters to ship a new schema immediately. If `settings.schema.toml` already exists, it is authoritative. Otherwise, vosu creates it using the first available source:

1. Package-root `settings.json`: a JSON array of compatibility CounterSetting descriptors.
2. Package-root `settings.toml`: infer descriptors from scalar values (string → text, integer/float → number, boolean → checkbox); key becomes ID/title/default. Arrays, tables, and datetimes cannot be inferred and fail explicitly.
3. Prior central `<name>.settings.toml` schema.
4. Prior central `<name>.settings.json` schema.
5. Empty settings array.

Once created, later edits to the old `settings.json` do **not** replace the authoritative schema. Migration reads the old source rather than making it the ongoing write target.

If central `<name>.settings.values.toml` exists, it wins. Otherwise initial values come from scalar package-root `settings.toml` when a root schema exists, then central `<name>.values.json`, then package-root `settings.values.json`, then non-null schema defaults. A schema-shaped `settings.toml` is not treated as a values map. Existing authoritative files are not overwritten by migration. Steady-state developer saves write the package schema; user saves write only the central values file.

## Local symlink mounts <Badge type="tip" text="vosu only" />

A top-level directory symlink directly below the static root is an explicit local mount declaration and may target a directory outside that root. An `index.html` marker is not required to authorize the mount (though a page needs content to serve). Each requested file is confined to the alias's current target and streamed through the retained file handle. Nested symlinks do not create new mount roots; discovery skips them.

Settings work through aliases, including writes to the mounted package's schema. **Open** follows the alias target. **Delete** removes only the alias, not its target. Catalog install/update rejects a symlink destination rather than replacing the external project. Keep this distinction in mind when using a live development directory.

## Catalog installation

The **Available** page reads the upstream catalog at `https://tosu.app/api.json`; vosu does not operate, review, or endorse it. Installing a catalog counter executes third-party JavaScript with the dashboard's access. Install only authors you trust.

Installation uses `POST /api/counters/download/<encoded-url>?name=<name>` <Badge type="tip" text="vosu only" /> <Badge type="warning" text="management" />. Existing directories require `update=true`. The implementation stages the download and extracts with same-filesystem atomic replacement; it validates archive paths/symlinks rather than unpacking unrestricted paths into the package root.

| Limit                   | Value                                                 |
| ----------------------- | ----------------------------------------------------- |
| Concurrent install jobs | 4 shared across root reloads; excess returns HTTP 429 |
| Download size           | 1 GiB                                                 |
| Redirects               | At most 5                                             |
| ZIP entries             | At most 100,000                                       |
| Expanded ZIP size       | At most 2 GiB                                         |

Downloads require HTTPS; downgrade redirects and loopback/private/reserved destinations are rejected. Shutdown cancels and joins admitted jobs even if the initiating HTTP client disconnects. These checks do not make downloaded JavaScript trusted.

Sources: [counter service/discovery](https://github.com/shiruviaa/vosu/blob/main/src/counters/service.rs), [settings/migration](https://github.com/shiruviaa/vosu/blob/main/src/counters/settings.rs), [descriptor model](https://github.com/shiruviaa/vosu/blob/main/src/counters/model.rs), [static response injection](https://github.com/shiruviaa/vosu/blob/main/src/server/service/responses.rs), [download and ZIP policy](https://github.com/shiruviaa/vosu/blob/main/src/net/streaming.rs).
