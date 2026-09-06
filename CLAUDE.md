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
| `pnpm add-landing <file.html> [slug] [title]` | Register a standalone HTML page under `src/landings/` |
| `pnpm flatten-landing` | Prerender `src/landings` Design Compiler pages into `public/landings/` |
| `pnpm flatten-landing <src.html> <out.html>` | Flatten one `.dc.html` or bundler HTML file |
| `pnpm unpack-bundler <bundler.html> <out-dir>` | Unpack a Claude Design bundler export |

There is no test suite.

## Architecture

This is one React/Vite app. Everything you edit lives under `src/`. Root files are Vite/tooling config only (`index.html`, `vite.config.ts`, `eslint.config.js`).

```
src/
  main.tsx / App.tsx     React catalog (lists landings)
  landings/
    landings.json        Source-of-truth manifest
    catalog.ts           Typed export of that manifest for React
    landing-1/ …         Design Compiler documents (.dc.html + support.js)
    pipeline/            Node tools: assemble, Vite plugin, flatten, add, unpack
public/landings/         Flattened HTML for preview and Vercel (generated)
```

1. **Catalog UI** — `Landings.tsx` imports `src/landings/catalog.ts`. Adding a landing is a manifest + folder change, not a React change.
2. **Landing documents** — `src/landings/<slug>/` is the readable source of truth. `pnpm dev` assembles them on each request and full-reloads when they change.
3. **Pipeline** — `src/landings/pipeline/` is the Node side of the same feature: live assemble, flatten for deploy, add/unpack helpers. Vite imports `landingRoutes()` from here.
4. **Deploy copies** — `public/landings/<slug>/index.html` is produced by `pnpm flatten-landing` and copied into `dist/` by Vite's public-dir handling.

### Clean-URL routing

`/landing-1` is implemented twice; keep the slug scheme in sync:

- `src/landings/pipeline/vite-plugin.ts` + `paths.ts` (`SLUG_PATTERN`) for `pnpm dev` / `pnpm preview`
- `vercel.json` rewrite `"/:slug([a-z0-9-]+)"` → `"/landings/:slug/index.html"` for <https://able-activator.vercel.app/>

### Manifests

- **Source:** `src/landings/landings.json` — `{ slug, title, entry }`
- **Deploy copy:** `public/landings/landings.json` — `{ slug, title }`, rewritten by flatten

### Flatten

Standalone tooling, not part of `build`. With no args it reads `src/landings/landings.json` and writes each entry to `public/landings/<slug>/index.html`. Design Compiler pages are opened in headless Chromium (`playwright`), expanded, captured as a no-JS prerender, then packed with inlined `support.js`, sibling `.dc.html` blobs, and latin/latin-ext fonts as `data:` URIs so the page still boots for FAQ/module toggles.
