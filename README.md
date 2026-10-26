# 18-LAB site and documentation

Production site: <https://18-lab-dev.github.io/>. The approved 18-LAB design uses
Workstation (graphite/amber) and Drafting (paper/blueprint) modes, with locally
bundled Barlow Condensed, Barlow and IBM Plex Mono fonts.

## Develop and publish

Use Bun 1.4.4:

```sh
bun install --frozen-lockfile
bun run dev
bun run lint
bun run build
node scripts/check-links.mjs
bun run preview
```

`build` generates static HTML from every Markdown page in `docs/`, checks
TypeScript and builds all pages with Vite 8. The generated root `vosu/` and
`vosulay/` directories are ignored: edit `docs/`, not generated HTML. Restart the
development command after editing Markdown. The header/footer and theme controls
are shared with the landing and brand pages. Page filtering in the docs navigation
is local and needs no service. Benchmark data remains in `data/`; the complete
series and ranges render as accessible tables. The runnable overlay tutorial is
in `examples/starter-overlay/` and keeps its own pnpm-based toolchain.

`.github/workflows/deploy.yml` runs on pushes to `main`, pull requests and manual
workflow dispatch. It installs the frozen Bun lockfile, lints, generates docs,
typechecks, builds and checks internal output links/anchors. Non-PR runs upload
`dist/` with `actions/upload-pages-artifact` and deploy it with
`actions/deploy-pages` to the `github-pages` environment using Pages/OIDC write
permissions. PRs build/check without publishing. Pages must use **GitHub Actions**
as its build source; no branch build or `/docs` folder setting is used.

At release the coordinator renames the existing Pages repository to
`18-lab-dev.github.io`, then merges/pushes the approved `rebrand/18-lab` branch to
`main`. Keep Pages set to GitHub Actions and its default domain; the site builds
for `/`, not a repository subpath. No custom domain is configured. All original
product documentation paths are retained (GitHub Pages resolves clean URLs to
`.html`); `/docs.html` redirects to the install guide, preserving query/hash.

## Licenses

Code and documentation: MIT, © 2026 18-LAB (see `LICENSE`). Artwork and branding:
© 2026 sxlvia; not included in the code license. Font software remains under SIL
OFL 1.1. Complete font and dependency notices are in `THIRD-PARTY-LICENSES.txt`.
