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
point. You can instead download the [finished example](https://github.com/shiruviaa/shiruviaa.github.io/tree/main/examples/starter-overlay)
and run `pnpm install` in its folder.

## Scripts and configuration

Use this `package.json`. The package script copies counter descriptors into the build.

<<< ../../../../examples/starter-overlay/package.json

`vite.config.ts` uses a **relative base**: installed assets must resolve below the counter
folder, not the daemon's `/assets/` directory. The explicit output target is ES2020;
you still need to test the actual browser engine used by OBS and vosulay.

<<< ../../../../examples/starter-overlay/vite.config.ts

Use `tsconfig.json` for strict, no-emit type checking:

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
  scripts/package.mjs
  metadata.txt
  settings.schema.toml
  settings.json
  vite.config.ts
  tsconfig.json
  package.json
  dist/                         # created by pnpm build; install this content
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
See [vosu's counter documentation](https://github.com/shiruviaa/vosu/blob/main/README.md#dashboard-and-counters)
and [tosu's settings parser](https://github.com/tosuapp/tosu/blob/master/packages/server/utils/parseSettings.ts).

Next: [connect to live state](/vosu/dev/tutorial/02-connect).
