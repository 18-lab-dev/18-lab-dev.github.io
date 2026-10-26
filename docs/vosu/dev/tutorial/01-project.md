---
title: "1. Set up the project"
description: "Create a vanilla TypeScript overlay with Vite, oxlint, and oxfmt."
---

# 1. Set up the project

Create a vanilla TypeScript project, then replace the scaffold's demo files with the
files in this tutorial. Keep the scaffold outside the daemon's static folder.

```sh
pnpm create vite starter-overlay --template vanilla-ts
cd starter-overlay
pnpm add -D vite@8.3.4 typescript@7.0.2 oxlint@1.87.0 oxfmt@0.72.0 @types/node@24
```

Remove the scaffold's demo module, images, and sample CSS when replacing its entry
point. You can instead download the [finished example](https://github.com/18-lab-dev/18-lab-dev.github.io/tree/main/examples/starter-overlay)
and run `pnpm install` in its folder.

## Scripts and configuration

Use this `package.json`. Its unscoped `name`, `starter-overlay`, is the installed
counter-folder name by convention; use one normal path component for each overlay.

<<< ../../../../examples/starter-overlay/package.json

`vite.config.ts` uses a **relative base**: assets resolve below the counter folder,
not the daemon's `/assets/` directory. It builds into `dist/<package name>/`.
JavaScript targets **ES2026**; CSS targets **ES2025** because Lightning CSS does not
accept `es2026` yet. Test the actual browser engine used by OBS and vosulay.

The small serve-only plugin injects `window.COUNTER_PATH="starter-overlay";` for
Vite development. Both daemons supply the same counter-directory value when hosting
the built page; the plugin never injects it into production output.

<<< ../../../../examples/starter-overlay/vite.config.ts

Use `tsconfig.json` for strict, no-emit type checking. TypeScript 7.0.2 does not accept
`ES2026`, so it uses `ESNext` and browser libraries; Vite handles ES2026 lowering.

<<< ../../../../examples/starter-overlay/tsconfig.json

Use `.oxlintrc.json` for browser code and Node-based build files:

<<< ../../../../examples/starter-overlay/.oxlintrc.json

Use `.oxfmtrc.json` for formatting:

<<< ../../../../examples/starter-overlay/.oxfmtrc.json

Add `.gitignore` so builds and installed dependencies stay out of source control:

<<< ../../../../examples/starter-overlay/.gitignore{text}

[Tooling](/vosu/dev/tooling) explains the scripts, editor extension, and migration options.
This example does not use Vitest.

## Source folder versus counter folder

```text
starter-overlay/                 # development project
  index.html
  src/connection.ts
  src/main.ts
  src/style.css
  public/                       # Vite copies these every build
    metadata.txt
    settings.schema.toml
    settings.json
  vite.config.ts
  tsconfig.json
  package.json
  dist/
    starter-overlay/            # copy this correctly named folder into static/
      index.html
      assets/
      metadata.txt
      settings.schema.toml
      settings.json
```

| Installed file         | Purpose                                                    |
| ---------------------- | ---------------------------------------------------------- |
| `index.html`           | Counter entry point, served by the daemon.                 |
| `assets/`              | Vite's compiled JavaScript and CSS.                        |
| `metadata.txt`         | Name, author, version, and declared `Resolution: 640x220`. |
| `settings.schema.toml` | Authoritative vosu settings schema.                        |
| `settings.json`        | tosu settings schema with matching IDs and defaults.       |

vosu discovers counters recursively and honors top-level symlink mounts. Its settings
schema belongs to the package, while mutable user values are stored centrally.
See [vosu's counter documentation](https://github.com/18-lab-dev/vosu/blob/main/README.md#dashboard-and-counters)
and [tosu's settings parser](https://github.com/tosuapp/tosu/blob/master/packages/server/utils/parseSettings.ts).

Next: [connect to live state](/vosu/dev/tutorial/02-connect).
