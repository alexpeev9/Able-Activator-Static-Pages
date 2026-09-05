import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig, type Connect } from 'vite'

const LANDINGS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'public/landings')

/**
 * Serves the standalone HTML landing pages in public/landings/<slug>/index.html
 * at clean URLs like /landing-1 (dev + preview). No React involved.
 */
function landingRoutes() {
  const middleware: Connect.NextHandleFunction = (req, res, next) => {
    const url = (req.url ?? '/').split('?')[0]
    const slug = decodeURIComponent(url).replace(/^\/+|\/+$/g, '')
    if (!/^[a-z0-9-]+$/i.test(slug)) return next()

    const file = path.join(LANDINGS_DIR, slug, 'index.html')
    if (!file.startsWith(LANDINGS_DIR) || !fs.existsSync(file)) return next()

    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.end(fs.readFileSync(file))
  }

  return {
    name: 'landing-routes',
    configureServer(server) {
      server.middlewares.use(middleware)
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware)
    },
  } satisfies import('vite').Plugin
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), landingRoutes()],
})
