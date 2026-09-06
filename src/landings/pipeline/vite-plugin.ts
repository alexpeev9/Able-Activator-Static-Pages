import fs from 'node:fs'
import path from 'node:path'
import type { Connect, Plugin } from 'vite'
import { assembleLiveHtml, readManifest, resolveLandingEntry } from './assemble.ts'
import { isLandingSlug, LANDINGS_SRC, PUBLIC_LANDINGS, slugFromUrl } from './paths.ts'

const serveFlattened: Connect.NextHandleFunction = (req, res, next) => {
  const slug = slugFromUrl(req.url ?? '/')
  if (!isLandingSlug(slug)) return next()

  const file = path.join(PUBLIC_LANDINGS, slug, 'index.html')
  if (!file.startsWith(PUBLIC_LANDINGS) || !fs.existsSync(file)) return next()

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.end(fs.readFileSync(file))
}

const isWatchedLandingFile = (file: string) => {
  const resolved = path.resolve(file)
  const watchRoot = path.resolve(LANDINGS_SRC)
  if (!resolved.startsWith(watchRoot)) return false
  return !resolved.startsWith(path.join(watchRoot, 'pipeline'))
}

/**
 * Dev: assemble `src/landings` on each request and reload when those files change.
 * Preview: serve the flattened `public/landings` HTML.
 */
export const landingRoutes = (): Plugin => ({
  name: 'landing-routes',
  configureServer(server) {
    server.watcher.add(path.resolve(LANDINGS_SRC))
    const reloadLandings = (file: string) => {
      if (!isWatchedLandingFile(file)) return
      server.ws.send({ type: 'full-reload' })
    }
    server.watcher.on('change', reloadLandings)
    server.watcher.on('add', reloadLandings)

    server.middlewares.use((req, res, next) => {
      const slug = slugFromUrl(req.url ?? '/')
      if (!isLandingSlug(slug)) return next()

      const landing = readManifest().find((entry) => entry.slug === slug)
      if (!landing) return serveFlattened(req, res, next)

      const entry = resolveLandingEntry(landing.entry)
      if (!fs.existsSync(entry)) return serveFlattened(req, res, next)

      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      res.end(assembleLiveHtml(entry, landing.title, { viteClient: true }))
    })
  },
  configurePreviewServer(server) {
    server.middlewares.use(serveFlattened)
  },
})
