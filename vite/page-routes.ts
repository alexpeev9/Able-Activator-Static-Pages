import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import type { Plugin } from 'vite'

/**
 * Mirrors the vercel.json rewrite for `pnpm dev` / `pnpm preview`:
 * `/<section>/<slug>` serves `public/pages/<section>/<slug>/index.html`.
 */
const CLEAN_URL = /^\/([a-z0-9-]+)\/([a-z0-9-]+)\/?$/

export function pageRoutes(): Plugin {
  const rewrite = (url: string | undefined) => {
    const match = CLEAN_URL.exec((url ?? '').split('?')[0])
    if (!match) return null

    const [, section, slug] = match
    const target = `/pages/${section}/${slug}/index.html`
    return existsSync(resolve('public', target.slice(1))) ? target : null
  }

  return {
    name: 'page-routes',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const target = rewrite(req.url)
        if (target) req.url = target
        next()
      })
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, _res, next) => {
        const target = rewrite(req.url)
        if (target) req.url = target
        next()
      })
    },
  }
}
