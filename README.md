# shiruviaa.github.io

Source for <https://shiruviaa.github.io/>: the shiruviaa organization site and the documentation for
[vosu](https://github.com/shiruviaa/vosu) and [vosulay](https://github.com/shiruviaa/vosulay).

Built with [VitePress](https://vitepress.dev/), linted with [oxlint](https://oxc.rs/docs/guide/usage/linter),
and formatted with [oxfmt](https://oxc.rs/docs/guide/usage/formatter).

## Develop

```sh
pnpm install
pnpm dev          # http://localhost:5173/
pnpm check        # oxlint, oxfmt --check, production build (fails on dead links)
pnpm fmt          # format in place
```

## Layout

| Path                        | Content                                                                                       |
| --------------------------- | --------------------------------------------------------------------------------------------- |
| `docs/index.md`             | Organization home page                                                                        |
| `docs/vosu/guide/`          | vosu user guide                                                                               |
| `docs/vosu/dev/`            | vosu developer docs: API reference, security boundary, overlay tutorial, performance, tooling |
| `docs/vosulay/`             | vosulay user docs                                                                             |
| `docs/.vitepress/`          | Site config, sidebars, and the brand theme                                                    |
| `examples/starter-overlay/` | The finished project from the overlay tutorial                                                |

Documentation describes the published `main` branches of vosu and vosulay. When an API or setting
changes there, update the matching page here.

## Deploy

`.github/workflows/deploy.yml` lints, format-checks, and builds every push and pull request, then
publishes `main` to GitHub Pages. In the repository settings, set **Pages → Source** to
**GitHub Actions**.

## License

[MIT](LICENSE), covering the site code, documentation, and `examples/starter-overlay/`. The vosu
and vosulay icons in `docs/public/` remain under their own projects' terms.
