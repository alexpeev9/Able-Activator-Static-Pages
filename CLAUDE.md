# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Package manager is **pnpm** (pinned via `packageManager`; Node 20+).

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Vite dev server (default <http://localhost:5173>) |
| `pnpm build` | `tsc -b` type-check, then `vite build` into `dist/` |
| `pnpm preview` | Serve the production build (page routes work here too) |
| `pnpm lint` | ESLint over the project |

There is no test suite.

## Architecture

This is one React/Vite app whose only job is to index a set of pre-built static
HTML pages. The pages themselves are committed artifacts — there is no build
pipeline that generates them.

```
src/
  main.tsx / App.tsx     React catalog shell
  Pages.tsx              Renders every section and its page cards
  pages.json             Source-of-truth manifest (sections -> pages)
vite/
  page-routes.ts         Dev/preview middleware mirroring the Vercel rewrite
public/pages/
  pages.json             Deploy copy of the manifest
  <section>/<slug>/index.html   The static pages
```

1. **Catalog UI** — `App.tsx` renders `Pages.tsx`, which maps over
   `src/pages.json`. Adding a page or a section is a manifest + folder change,
   never a React change.
2. **Sections** — a section is `{ id, title, blurb?, pages: [{ slug, title }] }`.
   `id` is the first URL segment and must equal the folder name under
   `public/pages/`. A section with no pages renders a "Coming soon" placeholder.
3. **Pages** — `public/pages/<section>/<slug>/index.html` is a self-contained
   flattened document (inlined CSS/JS/fonts). Treat these files as opaque
   artifacts; edit them only when deliberately changing that page's design.

### Clean-URL routing

`/program/program-1` is implemented twice; keep the two in sync:

- `vite/page-routes.ts` rewrites `/<section>/<slug>` to
  `/pages/<section>/<slug>/index.html` for `pnpm dev` and `pnpm preview`
- `vercel.json` rewrite `"/:section([a-z0-9-]+)/:slug([a-z0-9-]+)"` ->
  `"/pages/:section/:slug/index.html"` for <https://able-activator.vercel.app/>

### Manifests

Both must be updated together:

- **Source:** `src/pages.json` — sections with `{ slug, title }` pages, plus an
  optional `blurb` per section
- **Deploy copy:** `public/pages/pages.json` — same data without `blurb`
