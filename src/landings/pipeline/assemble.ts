import fs from 'node:fs'
import path from 'node:path'
import { LANDINGS_SRC, MANIFEST_PATH } from './paths.ts'
import type { LandingManifestEntry } from './types.ts'

export const escapeScript = (code: string) => code.replace(/<\/script/gi, '<\\/script')

export const isBundler = (html: string) =>
  html.includes('__bundler/manifest') || html.includes('type="__bundler/')

export const isDcDocument = (html: string) => /<x-dc[\s>]/.test(html)

export const collectSiblings = (entryHtml: string, entryDir: string) => {
  const names = new Set<string>()
  const re = /<(?:dc-import|x-import)\b[^>]*\bname=["']([^"']+)["']/gi
  let match: RegExpExecArray | null
  while ((match = re.exec(entryHtml))) names.add(match[1] ?? '')

  const blobs: Record<string, string> = {}
  for (const name of names) {
    if (!name) continue
    const file = path.join(entryDir, `${name}.dc.html`)
    if (!fs.existsSync(file)) {
      throw new Error(`Missing sibling for <dc-import name="${name}">: ${file}`)
    }
    const url = `./${encodeURIComponent(name)}.dc.html`
    blobs[url] = fs.readFileSync(file, 'utf8')
  }
  return blobs
}

export const extractDcParts = (entryHtml: string) => {
  const xdcOpen = /<x-dc(?:\s[^>]*)?>/.exec(entryHtml)
  const xdcClose = entryHtml.lastIndexOf('</x-dc>')
  if (!xdcOpen || xdcClose === -1) {
    throw new Error('Entry is missing an <x-dc> block')
  }
  const dcInner = entryHtml.slice(xdcOpen.index, xdcClose + '</x-dc>'.length)
  const scriptMatch = entryHtml.match(
    /<script\b[^>]*data-dc-script[^>]*>[\s\S]*?<\/script>/i,
  )
  return { dcInner, dcScript: scriptMatch ? scriptMatch[0] : '' }
}

export const blobBootScript = (blobs: Record<string, string>) =>
  `window.__resourceBlobs = Object.fromEntries(${JSON.stringify(
    Object.entries(blobs),
  )}.map(([url, text]) => [url, new Blob([text], { type: "text/html" })]));`

export const readManifest = (): LandingManifestEntry[] => {
  if (!fs.existsSync(MANIFEST_PATH)) return []
  return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8')) as LandingManifestEntry[]
}

export const writeManifest = (manifest: LandingManifestEntry[]) => {
  fs.writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`)
}

export const assembleLiveHtml = (
  entryPath: string,
  title: string,
  { viteClient = false } = {},
) => {
  const entryDir = path.dirname(entryPath)
  const entryHtml = fs.readFileSync(entryPath, 'utf8')
  if (!isDcDocument(entryHtml)) {
    throw new Error(`Not a Design Compiler document: ${entryPath}`)
  }
  const supportPath = path.join(entryDir, 'support.js')
  if (!fs.existsSync(supportPath)) {
    throw new Error(`Missing support.js next to ${entryPath}`)
  }
  const { dcInner, dcScript } = extractDcParts(entryHtml)
  const blobs = collectSiblings(entryHtml, entryDir)
  const safeTitle = String(title || 'Landing').replace(/</g, '&lt;')
  const viteTag = viteClient
    ? '<script type="module" src="/@vite/client"></script>\n'
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="dark">
  <title>${safeTitle}</title>
  ${viteTag}<style>html, body { margin: 0; background: #1c1c1c; }</style>
</head>
<body>
${dcInner}
${dcScript}
<script>${escapeScript(blobBootScript(blobs))}</script>
<script>${escapeScript(fs.readFileSync(supportPath, 'utf8'))}</script>
</body>
</html>
`
}

export const resolveLandingEntry = (entry: string) => {
  const resolved = path.resolve(LANDINGS_SRC, entry)
  if (!resolved.startsWith(path.resolve(LANDINGS_SRC))) {
    throw new Error(`Landing entry escapes src/landings: ${entry}`)
  }
  return resolved
}
