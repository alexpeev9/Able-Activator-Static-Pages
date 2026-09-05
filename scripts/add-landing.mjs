#!/usr/bin/env node
// Add a standalone HTML landing page.
//   node scripts/add-landing.mjs "<path/to/file.html>" [slug] [title]
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const landingsDir = path.join(root, 'public', 'landings')
const manifestPath = path.join(landingsDir, 'landings.json')

const [source, slugArg, titleArg] = process.argv.slice(2)
if (!source) {
  console.error('usage: node scripts/add-landing.mjs <file.html> [slug] [title]')
  process.exit(1)
}
if (!fs.existsSync(source)) {
  console.error(`No such file: ${source}`)
  process.exit(1)
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
const nextIndex = manifest.length + 1
const slug = (slugArg || `landing-${nextIndex}`).toLowerCase()
if (!/^[a-z0-9-]+$/.test(slug)) {
  console.error(`Invalid slug: ${slug} (use letters, digits and dashes)`)
  process.exit(1)
}
if (manifest.some((entry) => entry.slug === slug)) {
  console.error(`Slug already used: ${slug}`)
  process.exit(1)
}

fs.mkdirSync(path.join(landingsDir, slug), { recursive: true })
fs.copyFileSync(source, path.join(landingsDir, slug, 'index.html'))

manifest.push({
  slug,
  title: titleArg || `Landing page ${nextIndex}`,
  description: path.basename(source, '.html'),
})
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)

console.log(`Added /${slug} -> public/landings/${slug}/index.html`)
