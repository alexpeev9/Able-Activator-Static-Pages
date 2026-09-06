import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
export const LANDINGS_SRC = path.join(ROOT, 'src', 'landings')
export const PUBLIC_LANDINGS = path.join(ROOT, 'public', 'landings')
export const MANIFEST_PATH = path.join(LANDINGS_SRC, 'landings.json')
export const PUBLIC_MANIFEST_PATH = path.join(PUBLIC_LANDINGS, 'landings.json')

/** Shared by Vite, Vercel, and add-landing. Keep in sync with vercel.json. */
export const SLUG_PATTERN = /^[a-z0-9-]+$/

export const isLandingSlug = (value: string) => SLUG_PATTERN.test(value)

export const slugFromUrl = (raw: string) =>
  decodeURIComponent(raw.split('?')[0] ?? '').replace(/^\/+|\/+$/g, '')
