#!/usr/bin/env node
// Flatten Design Compiler (.dc.html) or Claude Design bundler HTML into a
// single static file that paints without JS and keeps the DC runtime for
// interactivity.
//
//   node scripts/flatten-landing.mjs
//   node scripts/flatten-landing.mjs <src.html> <out.html>
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { chromium } from 'playwright'
import {
  blobBootScript,
  collectSiblings,
  escapeScript,
  extractDcParts,
  isBundler,
  isDcDocument,
  readManifest,
  root,
  srcDir,
} from './assemble-landing.mjs'

const publicLandings = path.join(root, 'public', 'landings')

const [srcArg, outArg] = process.argv.slice(2)

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
}

const serveDirectory = (dir) =>
  new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent((req.url ?? '/').split('?')[0])
      const rel = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '')
      const file = path.resolve(dir, rel)
      if (!file.startsWith(path.resolve(dir))) {
        res.writeHead(403)
        res.end()
        return
      }
      if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        res.writeHead(404)
        res.end()
        return
      }
      res.writeHead(200, {
        'Content-Type': MIME[path.extname(file)] ?? 'application/octet-stream',
      })
      fs.createReadStream(file).pipe(res)
    })
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address()
      resolve({
        url: `http://127.0.0.1:${port}`,
        close: () => new Promise((done) => server.close(done)),
      })
    })
    server.on('error', reject)
  })

const filterFontCss = (css) => {
  const blocks = css.split(/\/\*\s*/).filter(Boolean)
  const kept = []
  for (const block of blocks) {
    const commentEnd = block.indexOf('*/')
    const label = commentEnd === -1 ? '' : block.slice(0, commentEnd).trim().toLowerCase()
    const body = commentEnd === -1 ? block : block.slice(commentEnd + 2)
    if (label && !label.startsWith('latin')) continue
    if (!label && /unicode-range:/i.test(body) && !/U\+0{0,4}0|U\+0*0100/i.test(body)) {
      continue
    }
    kept.push(commentEnd === -1 ? block : `/* ${label} */${body}`)
  }
  return kept.join('\n').trim() || css
}

const inlineFontUrls = async (css) => {
  const urls = [...css.matchAll(/url\((['"]?)(https?:\/\/[^'")]+)\1\)/g)].map((m) => m[2])
  const unique = [...new Set(urls)]
  let next = css
  for (const url of unique) {
    const res = await fetch(url)
    if (!res.ok) continue
    const buf = Buffer.from(await res.arrayBuffer())
    const mime = res.headers.get('content-type')?.split(';')[0] || 'font/woff2'
    next = next.split(url).join(`data:${mime};base64,${buf.toString('base64')}`)
  }
  return next
}

const capturePage = async (pageUrl) => {
  const browser = await chromium.launch({ headless: true })
  try {
    const page = await browser.newPage()
    page.on('pageerror', (err) => console.warn('[flatten] pageerror:', err.message))
    page.on('console', (msg) => {
      if (msg.type() === 'error') console.warn('[flatten] console:', msg.text())
    })
    await page.goto(pageUrl, { waitUntil: 'networkidle', timeout: 60_000 })
    await page.waitForFunction(() => {
      const root = document.querySelector('#dc-root')
      return Boolean(root && root.innerText && root.innerText.length > 80)
    }, { timeout: 45_000 })

    await page.evaluate(() => {
      const clickMatching = (re) => {
        for (const btn of document.querySelectorAll('button')) {
          if (re.test(btn.textContent ?? '')) btn.click()
        }
      }
      clickMatching(/expand all/i)
    })
    await page.waitForTimeout(400)
    await page.evaluate(() => {
      for (const btn of document.querySelectorAll('button[aria-expanded="false"]')) {
        btn.click()
      }
    })
    await page.waitForTimeout(400)

    return await page.evaluate(async () => {
      const root = document.querySelector('#dc-root')
      const styles = [...document.querySelectorAll('style')]
        .map((el) => el.textContent ?? '')
        .filter(Boolean)
        .join('\n')
      const fontCss = (
        await Promise.all(
          [...document.querySelectorAll('link[rel="stylesheet"]')]
            .filter((el) => (el.href || '').includes('fonts.googleapis.com'))
            .map(async (el) => {
              const res = await fetch(el.href)
              return res.ok ? await res.text() : ''
            }),
        )
      ).join('\n')
      const h1 = document.querySelector('h1')
      return {
        prerender: root ? root.innerHTML : '',
        styles,
        fontCss,
        title: h1?.innerText?.replace(/\s+/g, ' ').trim() || document.title || 'Landing',
      }
    })
  } finally {
    await browser.close()
  }
}

const buildStaticHtml = ({ title, styles, fontCss, prerender, entryHtml, blobs, supportJs }) => {
  const { dcInner, dcScript } = extractDcParts(entryHtml)
  const blobScript = blobBootScript(blobs)

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="dark">
  <title>${title.replace(/</g, '&lt;')}</title>
  <style>
${fontCss}
${styles}
    html, body { margin: 0; background: #1c1c1c; }
    #__prerender { min-height: 100vh; }
  </style>
</head>
<body>
<div id="__prerender">${prerender}</div>
${dcInner}
${dcScript}
<script>${escapeScript(blobScript)}</script>
<script>${escapeScript(supportJs)}</script>
<script>
(function () {
  var prerender = document.getElementById('__prerender');
  var started = Date.now();
  var timer = setInterval(function () {
    var root = document.getElementById('dc-root');
    if (root && root.innerText && root.innerText.trim().length > 80) {
      prerender.remove();
      clearInterval(timer);
    } else if (Date.now() - started > 15000) {
      clearInterval(timer);
    }
  }, 50);
})();
</script>
</body>
</html>
`
}

const flattenDcFile = async (entryPath, outPath) => {
  const entryDir = path.dirname(entryPath)
  const entryHtml = fs.readFileSync(entryPath, 'utf8')
  if (!isDcDocument(entryHtml)) {
    throw new Error(`Not a Design Compiler document: ${entryPath}`)
  }
  const supportPath = path.join(entryDir, 'support.js')
  if (!fs.existsSync(supportPath)) {
    throw new Error(`Missing support.js next to ${entryPath}`)
  }
  const blobs = collectSiblings(entryHtml, entryDir)
  const server = await serveDirectory(entryDir)
  const captured = await capturePage(
    `${server.url}/${encodeURIComponent(path.basename(entryPath))}`,
  )
  await server.close()

  const fontCss = await inlineFontUrls(filterFontCss(captured.fontCss))
  const html = buildStaticHtml({
    title: captured.title,
    styles: captured.styles,
    fontCss,
    prerender: captured.prerender,
    entryHtml,
    blobs,
    supportJs: fs.readFileSync(supportPath, 'utf8'),
  })

  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, html)
  console.log(`Wrote ${path.relative(root, outPath)} (${html.length} bytes)`)
}

const flattenBundlerFile = async (entryPath, outPath) => {
  const html = fs.readFileSync(entryPath, 'utf8')
  const server = await serveDirectory(path.dirname(entryPath))
  const browser = await chromium.launch({ headless: true })
  try {
    const page = await browser.newPage()
    await page.goto(
      `${server.url}/${encodeURIComponent(path.basename(entryPath))}`,
      { waitUntil: 'networkidle', timeout: 60_000 },
    )
    await page.waitForFunction(() => {
      const loading = document.getElementById('__bundler_loading')
      const thumb = document.getElementById('__bundler_thumbnail')
      return !loading && !thumb && document.body.innerText.length > 80
    }, { timeout: 45_000 })
    const serialized = await page.content()
    fs.mkdirSync(path.dirname(outPath), { recursive: true })
    fs.writeFileSync(outPath, serialized)
    console.log(`Wrote ${path.relative(root, outPath)} (${serialized.length} bytes)`)
  } finally {
    await browser.close()
    await server.close()
  }
}

const flattenOne = async (entryPath, outPath) => {
  const html = fs.readFileSync(entryPath, 'utf8')
  if (isDcDocument(html)) return flattenDcFile(entryPath, outPath)
  if (isBundler(html)) return flattenBundlerFile(entryPath, outPath)
  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.copyFileSync(entryPath, outPath)
  console.log(`Copied plain HTML ${path.relative(root, outPath)}`)
}

const flattenFromManifest = async () => {
  const manifest = readManifest()
  if (!manifest.length) {
    throw new Error(`Missing or empty ${path.relative(root, path.join(srcDir, 'landings.json'))}`)
  }
  for (const landing of manifest) {
    const entry = path.join(srcDir, landing.entry)
    const out = path.join(publicLandings, landing.slug, 'index.html')
    await flattenOne(entry, out)
  }
  fs.writeFileSync(
    path.join(publicLandings, 'landings.json'),
    `${JSON.stringify(
      manifest.map(({ slug, title }) => ({ slug, title })),
      null,
      2,
    )}\n`,
  )
  console.log('Updated public/landings/landings.json')
}

const main = async () => {
  if (srcArg && outArg) {
    await flattenOne(path.resolve(srcArg), path.resolve(outArg))
    return
  }
  if (srcArg || outArg) {
    console.error('usage: node scripts/flatten-landing.mjs [<src.html> <out.html>]')
    process.exit(1)
  }
  await flattenFromManifest()
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
