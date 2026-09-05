# Able Activator - Program Example

## What is Able Activator

Able Activator is a program that helps people take the step from intention to
action: it pairs participants with volunteering and community initiatives,
guides them through a structured activation program, and gives organizers the
tools to run and track that program.

The official website of the initiative is **<https://activator.bg/>**, which is
the place to go for the program itself, its schedule, and how to join.

This repository is a **demo** app used to host and preview standalone landing pages for the program.

## Live deployment

The project with the landing pages is currently running at:

**<https://able-activator.vercel.app/>**

The root URL is an index that lists every landing page. Each landing is served
from its own short URL:

| Landing | URL |
| --- | --- |
| Landing Page 1 | <https://able-activator.vercel.app/landing-1> |
| Landing Page 2 | <https://able-activator.vercel.app/landing-2> |

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

Vite prints a local URL (by default <http://localhost:5173>). Landing pages are
served at `/{slug}` (for example `/landing-1`).

While `pnpm dev` is running, edits in `landings-src/` reload the page on their
own. You do not need `pnpm flatten-landing` until you want to update the
committed static files for preview or deploy.

### 4. Other scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Start the Vite dev server with HMR |
| `pnpm build` | Type-check (`tsc -b`) and build to `dist/` |
| `pnpm preview` | Serve the production build locally |
| `pnpm lint` | Run ESLint over the project |
| `pnpm add-landing <file.html> [slug] [title]` | Copy a standalone HTML file into `public/landings/` and register it in `landings.json` |
| `pnpm flatten-landing` | Prerender `landings-src/*.dc.html` into `public/landings/<slug>/index.html` |
| `node scripts/flatten-landing.mjs <src.html> <out.html>` | Flatten one Design Compiler or bundler HTML file |

### 5. Landing sources and the flatten command

Editable Design Compiler documents live in `landings-src/`:

| File | What it is |
| --- | --- |
| `landing-1/landing-1.dc.html` | Landing page 1 (full page) |
| `landing-1/landing-1-modules.dc.html` | Landing page 1 modules section |
| `landing-2/landing-2.dc.html` | Landing page 2 (full page) |
| `landing-2/landing-2-modules.dc.html` | Landing page 2 modules section |

During `pnpm dev`, save a file in `landings-src/` and the open landing reloads.

When you want to update the committed static files for Vercel / `pnpm preview`:

```bash
pnpm flatten-landing
```

That writes `public/landings/<slug>/index.html` (committed in the repo) and
updates `public/landings/landings.json` from `landings-src/landings.json`.

To register a finished standalone HTML file that is not a Design Compiler page:

```bash
pnpm add-landing ./my-page.html landing-3 "Landing Page 3"
```
