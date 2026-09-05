import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const [inRel, outRel] = process.argv.slice(2)
if (!inRel || !outRel) {
  console.error('usage: node scripts/unpack-bundler.mjs <bundler.html> <out-dir>')
  process.exit(1)
}

const bundled = path.resolve(root, inRel)
const outDir = path.resolve(root, outRel)
const html = fs.readFileSync(bundled, 'utf8')

const extractJson = (type) => {
  const re = new RegExp(
    `<script type="${type}">\\s*([\\s\\S]*?)\\s*</script>`,
    'i',
  )
  const match = html.match(re)
  if (!match) throw new Error(`Missing ${type}`)
  return JSON.parse(match[1])
}

const manifest = extractJson('__bundler/manifest')
const template = extractJson('__bundler/template')
const extResources = extractJson('__bundler/ext_resources')

const decodeEntry = (entry) => {
  const bytes = Buffer.from(entry.data, 'base64')
  const raw = entry.compressed ? zlib.gunzipSync(bytes) : bytes
  return { raw, text: raw.toString('utf8') }
}

const supportUuid = Object.entries(manifest).find(
  ([, entry]) =>
    entry.mime.includes('javascript') &&
    decodeEntry(entry).text.includes('GENERATED from dc-runtime'),
)?.[0]

let pageHtml = template
if (supportUuid) pageHtml = pageHtml.replaceAll(supportUuid, './support.js')

pageHtml = pageHtml.replace(
  /<style>\/\* vietnamese \*\/[\s\S]*?<\/style>/,
  `<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700;800&family=Barlow:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet" />`,
)

fs.mkdirSync(outDir, { recursive: true })
fs.writeFileSync(path.join(outDir, 'Page.dc.html'), pageHtml)
if (supportUuid) {
  fs.writeFileSync(path.join(outDir, 'support.js'), decodeEntry(manifest[supportUuid]).text)
}

const written = new Set()
for (const resource of extResources) {
  if (!resource.id.endsWith('.dc.html')) continue
  if (written.has(resource.uuid)) continue
  written.add(resource.uuid)
  const name = path.basename(resource.id)
  fs.writeFileSync(path.join(outDir, name), decodeEntry(manifest[resource.uuid]).text)
  console.log('sibling', name)
}

const imports = [...pageHtml.matchAll(/<(?:dc-import|x-import)\b[^>]*\bname=["']([^"']+)["']/gi)].map(
  (m) => m[1],
)
console.log('entry imports', imports)
console.log('wrote', outDir, 'bytes', pageHtml.length)
