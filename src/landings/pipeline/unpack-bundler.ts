import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import { ROOT } from './paths.ts'

type BundlerEntry = {
  mime: string
  data: string
  compressed?: boolean
}

type ExtResource = {
  id: string
  uuid: string
}

const [inRel, outRel] = process.argv.slice(2)
if (!inRel || !outRel) {
  console.error('usage: pnpm unpack-bundler <bundler.html> <out-dir>')
  process.exit(1)
}

const bundled = path.resolve(ROOT, inRel)
const outDir = path.resolve(ROOT, outRel)
const html = fs.readFileSync(bundled, 'utf8')

const extractJson = (type: string) => {
  const re = new RegExp(
    `<script type="${type}">\\s*([\\s\\S]*?)\\s*</script>`,
    'i',
  )
  const match = html.match(re)
  if (!match?.[1]) throw new Error(`Missing ${type}`)
  return JSON.parse(match[1]) as unknown
}

const manifest = extractJson('__bundler/manifest') as Record<string, BundlerEntry>
const template = extractJson('__bundler/template') as string
const extResources = extractJson('__bundler/ext_resources') as ExtResource[]

const decodeEntry = (entry: BundlerEntry) => {
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
  const support = manifest[supportUuid]
  if (support) {
    fs.writeFileSync(path.join(outDir, 'support.js'), decodeEntry(support).text)
  }
}

const written = new Set<string>()
for (const resource of extResources) {
  if (!resource.id.endsWith('.dc.html')) continue
  if (written.has(resource.uuid)) continue
  written.add(resource.uuid)
  const name = path.basename(resource.id)
  const entry = manifest[resource.uuid]
  if (!entry) continue
  fs.writeFileSync(path.join(outDir, name), decodeEntry(entry).text)
  console.log('sibling', name)
}

const imports = [...pageHtml.matchAll(/<(?:dc-import|x-import)\b[^>]*\bname=["']([^"']+)["']/gi)].map(
  (m) => m[1],
)
console.log('entry imports', imports)
console.log('wrote', outDir, 'bytes', pageHtml.length)
