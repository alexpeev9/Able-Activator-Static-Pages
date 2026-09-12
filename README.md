# Able Activator - Program Example

## What is Able Activator

Able Activator is a program that helps people take the step from intention to
action: it pairs participants with volunteering and community initiatives,
guides them through a structured activation program, and gives organizers the
tools to run and track that program.

The official website of the initiative is **<https://activator.bg/>**, which is
the place to go for the program itself, its schedule, and how to join.

This repository is a **demo** app used to host and preview standalone static pages for the program.

## Live deployment

The project is currently running at:

**<https://able-activator.vercel.app/>**

The root URL is an index that lists every page, grouped into sections. Each page
is served from `/{section}/{slug}`:

| Section | Page | URL |
| --- | --- | --- |
| Program Pages | Program Page 1 | <https://able-activator.vercel.app/program/program-1> |
| Program Pages | Program Page 2 | <https://able-activator.vercel.app/program/program-2> |
| Program Pages | Program Page 3 | <https://able-activator.vercel.app/program/program-3> |
| Program Pages | Program Page 4 | <https://able-activator.vercel.app/program/program-4> |

## Setup with pnpm

This project uses **pnpm** (pinned via `packageManager` in `package.json`).

### 1. Prerequisites

- Node.js 20 or newer
- pnpm 10+: the easiest way to get the pinned version:

```bash
corepack enable
corepack prepare pnpm@10.19.0 --activate
```

Or install it globally:

```bash
npm install -g pnpm
```

### 2. Install dependencies

```bash
git clone https://github.com/alexpeev9/Able-Activator-Static-Pages.git
cd Able-Activator-Static-Pages
pnpm install
```

### 3. Run the dev server

```bash
pnpm dev
```

Vite prints a local URL (by default <http://localhost:5173>). Pages are served
at `/{section}/{slug}`, for example `/program/program-1`.

### 4. Other scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Start the Vite dev server with HMR |
| `pnpm build` | Type-check (`tsc -b`) and build to `dist/` |
| `pnpm preview` | Serve the production build locally |
| `pnpm lint` | Run ESLint over the project |

### 5. Adding a page or a section

Static pages are plain HTML files under `public/pages/<section>/<slug>/index.html`.
Two manifests describe them:

- `src/pages.json` — source of truth, read by the React catalog
- `public/pages/pages.json` — deploy copy, same data without the `blurb` field

To add a page: drop `index.html` into `public/pages/<section>/<slug>/`, then add
`{ "slug": "...", "title": "..." }` to that section's `pages` array in both
manifests.

To add a section: append a new object to both manifests.

```json
{
  "id": "landing",
  "title": "Landing Pages",
  "blurb": "Short campaign entry points.",
  "pages": []
}
```

A section with an empty `pages` array renders in the catalog as "Coming soon".
The `id` is the first URL segment, so it must match the folder name under
`public/pages/`.
