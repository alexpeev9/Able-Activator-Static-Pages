# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Package manager is **pnpm** (pinned via `packageManager`; Node 20+).

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Vite dev server (default <http://localhost:5173>) |
| `pnpm build` | `tsc -b` type-check, then `vite build` into `dist/` |
| `pnpm preview` | Serve the production build (landing routes work here too) |
| `pnpm lint` | ESLint over the project |
| `pnpm add-landing <file.html> [slug] [title]` | Register a standalone HTML page as a landing |
| `pnpm flatten-landing` | Prerender `landings-src` Design Compiler pages into `public/landings/` |
| `node scripts/flatten-landing.mjs <src.html> <out.html>` | Flatten one `.dc.html` or bundler HTML file |

There is no test suite.

## Architecture

Three layers that barely touch each other:

1. **The React index** (`src/`) — a single page listing the available landings. `src/Landings.tsx` fetches `/landings/landings.json` at runtime (not a build-time import) and renders one `<a href="/{slug}">` per entry. Adding a landing therefore requires no React change.
2. **Editable landing sources** (`landings-src/`) — Design Compiler documents (`.dc.html` + `support.js`). This is the readable source of truth. `pnpm dev` assembles them on each request and full-reloads when they change.
3. **The landing pages** (`public/landings/<slug>/index.html`) — flattened standalone HTML produced by `pnpm flatten-landing` for preview and deploy. They are copied verbatim into `dist/` by Vite's public-dir handling.

### Clean-URL routing is duplicated per environment

`/landing-1` → `public/landings/landing-1/index.html` is implemented **twice**, and both must stay in sync when the URL scheme changes:

- `vite.config.ts` — the `landingRoutes()` plugin registers middleware on both `configureServer` and `configurePreviewServer`. It matches `^[a-z0-9-]+$`, resolves under `public/landings/`, and guards against path escape.
- `vercel.json` — a rewrite `"/:slug([a-z0-9-]+)"` → `"/landings/:slug/index.html"` for the deployed site (<https://able-activator.vercel.app/>).

The slug regex `[a-z0-9-]+` appears in three places (both routers plus `scripts/add-landing.mjs` validation).

### `public/landings/landings.json` is the manifest

An array of `{ slug, title }`. It drives the index page and is appended to by `scripts/add-landing.mjs`, which also creates the slug directory and copies the HTML. Note the script writes a `description` field the React types ignore — harmless, but the manifest shape is looser than `Landing` in `Landings.tsx`.

### `scripts/flatten-landing.mjs`

Standalone tooling, not part of `build`. With no args it reads `landings-src/landings.json` and writes each entry to `public/landings/<slug>/index.html`. Design Compiler pages are opened in headless Chromium (`playwright`), expanded, captured as a no-JS prerender, then packed with inlined `support.js`, sibling `.dc.html` blobs, and latin/latin-ext fonts as `data:` URIs so the page still boots for FAQ/module toggles. A Claude Design bundler export can still be flattened with explicit `<src.html> <out.html>` args.
