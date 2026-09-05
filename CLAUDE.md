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
| `node scripts/flatten-landing.mjs <src.html> <out.html>` | Prerender a self-unpacking "bundler" export into plain static HTML |

There is no test suite.

## Architecture

Two layers that barely touch each other:

1. **The React index** (`src/`) — a single page listing the available landings. `src/Landings.tsx` fetches `/landings/landings.json` at runtime (not a build-time import) and renders one `<a href="/{slug}">` per entry. Adding a landing therefore requires no React change.
2. **The landing pages** (`public/landings/<slug>/index.html`) — fully standalone HTML files with no React, no bundling, no shared assets. They are copied verbatim into `dist/` by Vite's public-dir handling.

### Clean-URL routing is duplicated per environment

`/landing-1` → `public/landings/landing-1/index.html` is implemented **twice**, and both must stay in sync when the URL scheme changes:

- `vite.config.ts` — the `landingRoutes()` plugin registers middleware on both `configureServer` and `configurePreviewServer`. It matches `^[a-z0-9-]+$`, resolves under `public/landings/`, and guards against path escape.
- `vercel.json` — a rewrite `"/:slug([a-z0-9-]+)"` → `"/landings/:slug/index.html"` for the deployed site (<https://able-activator.vercel.app/>).

The slug regex `[a-z0-9-]+` appears in three places (both routers plus `scripts/add-landing.mjs` validation).

### `public/landings/landings.json` is the manifest

An array of `{ slug, title }`. It drives the index page and is appended to by `scripts/add-landing.mjs`, which also creates the slug directory and copies the HTML. Note the script writes a `description` field the React types ignore — harmless, but the manifest shape is looser than `Landing` in `Landings.tsx`.

### `scripts/flatten-landing.mjs`

Standalone tooling, not part of `build`. Some landing sources ship the real page as gzipped base64 inside `<script type="__bundler/*">` islands that unpack at runtime. This script decodes the bundle ahead of time, inlines assets (fonts as data: URIs), drops unused Google font subsets (keeps only `latin`/`latin-ext`), and prerenders the DOM with headless Chromium (`playwright`) so the output paints without JS. The original client runtime still boots afterwards for interactivity.
