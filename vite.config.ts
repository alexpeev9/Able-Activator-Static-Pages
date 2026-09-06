import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig, type Connect } from 'vite'
import { assembleLiveHtml, readManifest, srcDir } from './scripts/assemble-landing.mjs'

const ROOT = path.dirname(fileURLToPath(import.meta.url))
const LANDINGS_DIR = path.resolve(ROOT, 'public/landings')

const slugFromUrl = (raw: string) =>
  decodeURIComponent(raw.split('?')[0]).replace(/^\/+|\/+$/g, '')

const serveFlattened: Connect.NextHandleFunction = (req, res, next) => {
  const slug = slugFromUrl(req.url ?? '/')
  if (!/^[a-z0-9-]+$/i.test(slug)) return next()

  const file = path.join(LANDINGS_DIR, slug, 'index.html')
  if (!file.startsWith(LANDINGS_DIR) || !fs.existsSync(file)) return next()

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.end(fs.readFileSync(file))
}

/**
 * Dev: assemble landings-src on each request and reload when those files change.
 * Preview: serve the flattened public/landings HTML.
 */
function landingRoutes() {
  return {
    name: 'landing-routes',
    configureServer(server) {
      const watchRoot = path.resolve(srcDir)
      server.watcher.add(watchRoot)
      const reloadLandings = (file: string) => {
        if (!path.resolve(file).startsWith(watchRoot)) return
        server.ws.send({ type: 'full-reload' })
      }
      server.watcher.on('change', reloadLandings)
      server.watcher.on('add', reloadLandings)

      server.middlewares.use((req, res, next) => {
        const slug = slugFromUrl(req.url ?? '/')
        if (!/^[a-z0-9-]+$/i.test(slug)) return next()

        const landing = readManifest().find((entry) => entry.slug === slug)
        if (!landing) return serveFlattened(req, res, next)

        const entry = path.resolve(srcDir, landing.entry)
        if (!entry.startsWith(path.resolve(srcDir)) || !fs.existsSync(entry)) {
          return serveFlattened(req, res, next)
        }

        res.setHeader('Content-Type', 'text/html; charset=utf-8')
        res.end(assembleLiveHtml(entry, landing.title, { viteClient: true }))
      })
    },
    configurePreviewServer(server) {
      server.middlewares.use(serveFlattened)
    },
  } satisfies import('vite').Plugin
}

export default defineConfig({
  plugins: [react(), landingRoutes()],
})
