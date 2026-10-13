---
title: "Overlay developer tooling"
description: "Use Vite, oxlint, and oxfmt for a small, reproducible overlay toolchain."
---

# Overlay developer tooling

The [starter overlay](https://github.com/shiruviaa/shiruviaa.github.io/tree/main/examples/starter-overlay)
uses Vite for development/builds, TypeScript for checking, oxlint for linting, and oxfmt
for formatting. These are separate jobs; a successful Vite build is not a type check.

## Where the tools fit

| Tool                                                        | Role in an overlay project                                                                                                       |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| [Vite](https://vite.dev/guide/)                             | Development server, HMR, and a production build of HTML/CSS/TypeScript.                                                          |
| [Oxc / oxlint](https://oxc.rs/docs/guide/usage/linter.html) | JavaScript/TypeScript diagnostics using explicitly configured rules.                                                             |
| [oxfmt](https://oxc.rs/docs/guide/usage/formatter.html)     | Consistent source formatting and a check-only mode for CI.                                                                       |
| [Rolldown](https://rolldown.rs/)                            | Bundler used by current Vite; no separate bundler configuration is needed here.                                                  |
| [Vitest](https://vitest.dev/guide/)                         | Optional Vite-powered tests for pointer traversal, frame reconstruction, or formatting helpers. The starter does not install it. |

This is the VoidZero ecosystem's role in development tooling, not an overlay runtime.
The installed counter only contains built web assets and package descriptors.

## Install and pin

Use Node.js 22.12+ (or 20.19+ for this Vite version). Create a plain TypeScript app:

```sh
pnpm create vite starter-overlay --template vanilla-ts
cd starter-overlay
pnpm add -D vite@8.3.4 typescript@7.0.2 oxlint@1.87.0 oxfmt@0.72.0 @types/node@24
```

The tested Oxc CLIs are **oxlint 1.87.0** and **oxfmt 0.72.0**. Their actual options can
be inspected without installing a project:

```sh
npx --yes oxlint@1.87.0 --help
npx --yes oxfmt@0.72.0 --help
```

Commit your package-manager lockfile alongside the config. When starting from the
example, run `pnpm install` in `examples/starter-overlay/`, not in an unrelated repository.

## Configure the project

`vite.config.ts` sets `base: "./"` for counter-relative asset URLs and builds into
`dist/<package name>/`. The unscoped package name is the installed folder name.
Vite copies `public/` metadata and schemas on every build, including watch builds.
JavaScript targets ES2026; `cssTarget: "es2025"` works around Lightning CSS's unsupported
`es2026` target. TypeScript 7.0.2 uses `ESNext` for no-emit checks, while Vite handles
ES2026 lowering. Its serve-only plugin supplies the same counter-path value as a daemon.

<<< ../../../examples/starter-overlay/vite.config.ts

Use `.oxlintrc.json`; correctness rules are errors, browser globals are enabled for
runtime code, and Node globals are enabled only for build files:

<<< ../../../examples/starter-overlay/.oxlintrc.json

Use `.oxfmtrc.json`; this is deliberately ordinary formatting configuration:

<<< ../../../examples/starter-overlay/.oxfmtrc.json

The CLIs support `--init` to generate their default config. `-c` / `--config` selects an
explicit config. oxlint's category switches are `-D` (deny), `-W` (warn), and `-A`
(allow), evaluated in command-line order. Enable rules intentionally rather than
turning on every plugin or every category for a small browser HUD.

## Scripts

The tutorial's complete `package.json` is the source of these commands:

<<< ../../../examples/starter-overlay/package.json

| Command             | Result                                                                           |
| ------------------- | -------------------------------------------------------------------------------- |
| `pnpm dev`          | Vite development server; daemon defaults to `127.0.0.1:24050`.                   |
| `pnpm lint`         | `oxlint --deny-warnings`; warnings also fail the command.                        |
| `pnpm format`       | `oxfmt --write`; edits files in place.                                           |
| `pnpm format:check` | `oxfmt --check`; fails if formatting differs.                                    |
| `pnpm typecheck`    | `tsc --noEmit`; checks types without generating assets.                          |
| `pnpm build`        | `vite build`; output and copied `public/` files go into `dist/starter-overlay/`. |
| `pnpm preview`      | Preview built files; this is not the osu! telemetry daemon.                      |

oxfmt writes by default; use `--check` in automation. Both tools honor the project
ignore files; the example's `.gitignore` excludes `node_modules/` and `dist/`.
`oxfmt --threads=1` is available when limiting formatting parallelism matters.

## Editors and IDEs

### VS Code

Install the official [Oxc VS Code extension](https://marketplace.visualstudio.com/items?itemName=oxc.oxc-vscode),
also available on [Open VSX](https://open-vsx.org/extension/oxc/oxc-vscode).
Keep both CLI packages installed locally: the extension uses their language servers.

Recommend it in `.vscode/extensions.json`:

```json
{
  "recommendations": ["oxc.oxc-vscode"]
}
```

Use `.vscode/settings.json`:

```json
{
  "editor.defaultFormatter": "oxc.oxc-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.oxc": "always"
  }
}
```

See the official [linter editor setup](https://oxc.rs/docs/guide/usage/linter/editors.html)
and [formatter editor setup](https://oxc.rs/docs/guide/usage/formatter/editors.html).
Other LSP-capable editors can use `oxlint --lsp` and `oxfmt --lsp`.

### JetBrains IDEs

Install the [Oxc plugin](https://plugins.jetbrains.com/plugin/27061-oxc) through
**Settings → Plugins → Marketplace**, search **Oxc**, and select **Install**.
It supports both oxlint and oxfmt: inline lint diagnostics, quick fixes/fix-on-save,
and formatting through **Code → Reformat Code** / **Reformat File**, plus format-on-save.
See the [official plugin README](https://github.com/oxc-project/oxc-intellij-plugin)
for capabilities and installation.

### Zed

Open **Extensions** (`zed: extensions`), search **Oxc**, and install the
[official extension](https://github.com/oxc-project/oxc-zed). Its documented minimums
are **Zed 0.205.0** and **oxlint 1.35.0**; the pinned oxlint here satisfies that minimum.

Configure `.zed/settings.json` to use oxfmt on save for JavaScript and TypeScript,
following the extension's [combined configuration example](https://github.com/oxc-project/oxc-zed/blob/main/examples/both/.zed/settings.json):

```json
{
  "languages": {
    "JavaScript": {
      "format_on_save": "on",
      "prettier": { "allowed": false },
      "formatter": [{ "language_server": { "name": "oxfmt" } }]
    },
    "TypeScript": {
      "format_on_save": "on",
      "prettier": { "allowed": false },
      "formatter": [{ "language_server": { "name": "oxfmt" } }]
    }
  }
}
```

## CI

For a standalone overlay repository, add this GitHub Actions workflow. Commit a
`pnpm-lock.yaml` first. In the site repository, set `defaults.run.working-directory`
to `examples/starter-overlay`; that folder has its own workspace and lockfile.

```yaml
name: Overlay checks
on: [push, pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 11.28.5
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm format:check
      - run: pnpm typecheck
      - run: pnpm build
```

These static checks do not prove socket compatibility or in-game rendering. Exercise
both servers and test the built folder in the actual consumers; see
[package and test](/vosu/dev/tutorial/06-package).

## Migrate an existing project

### From Prettier or Biome formatting

oxfmt's verified migration flag generates `.oxfmtrc.json` from the existing formatter:

```sh
pnpm exec oxfmt --migrate=prettier
```

Or, when the source is Biome:

```sh
pnpm exec oxfmt --migrate=biome
```

Choose one, review the generated config, format the project, and replace the old
formatting script/editor formatter. Biome's **lint rules** are not migrated by a
formatter migration. Do not keep two format-on-save providers fighting over a file.

### From ESLint

Oxlint does not blindly consume an ESLint flat config. Use the official migration
utility, then inspect supported rules and plugins:

```sh
npx @oxlint/migrate
pnpm exec oxlint
```

The [official migration guide](https://oxc.rs/docs/guide/usage/linter/migrate-from-eslint.html)
explains flat-config conversion and the legacy ESLint v8 caveat: legacy configs need
manual translation or conversion to a flat config first. If a required rule is not
covered, retain only that part of ESLint temporarily; `eslint-plugin-oxlint` can disable
overlapping ESLint rules. Remove the obsolete config and dependency once the project's
required coverage has actually moved. This starter needs neither ESLint nor Biome.

Next: [build the overlay](/vosu/dev/tutorial/) or [optimize the render path](/vosu/dev/performance).
