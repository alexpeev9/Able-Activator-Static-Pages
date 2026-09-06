import fs from 'node:fs'
import path from 'node:path'
import { readManifest, writeManifest } from './assemble.ts'
import { isLandingSlug, LANDINGS_SRC, PUBLIC_LANDINGS } from './paths.ts'
import type { LandingManifestEntry } from './types.ts'

const [source, slugArg, titleArg] = process.argv.slice(2)
if (!source) {
  console.error('usage: pnpm add-landing <file.html> [slug] [title]')
  process.exit(1)
}

const sourcePath = path.resolve(source)
if (!fs.existsSync(sourcePath)) {
  console.error(`No such file: ${sourcePath}`)
  process.exit(1)
}

const manifest = readManifest()
const nextIndex = manifest.length + 1
const slug = (slugArg || `landing-${nextIndex}`).toLowerCase()
if (!isLandingSlug(slug)) {
  console.error(`Invalid slug: ${slug} (use letters, digits and dashes)`)
  process.exit(1)
}
if (manifest.some((entry) => entry.slug === slug)) {
  console.error(`Slug already used: ${slug}`)
  process.exit(1)
}

const title = titleArg || `Landing page ${nextIndex}`
const ext = path.extname(sourcePath) || '.html'
const entryName = `${slug}${ext}`
const sourceDir = path.join(LANDINGS_SRC, slug)
const publicDir = path.join(PUBLIC_LANDINGS, slug)

fs.mkdirSync(sourceDir, { recursive: true })
fs.copyFileSync(sourcePath, path.join(sourceDir, entryName))

fs.mkdirSync(publicDir, { recursive: true })
fs.copyFileSync(sourcePath, path.join(publicDir, 'index.html'))

const next: LandingManifestEntry = {
  slug,
  title,
  entry: `${slug}/${entryName}`,
}
writeManifest([...manifest, next])

console.log(`Added /${slug} -> src/landings/${slug}/${entryName}`)
console.log(`Preview copy -> public/landings/${slug}/index.html`)
