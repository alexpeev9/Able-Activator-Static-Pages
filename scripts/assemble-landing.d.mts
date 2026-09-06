export const root: string
export const srcDir: string

export type LandingManifestEntry = {
  slug: string
  title: string
  entry: string
}

export const escapeScript: (code: string) => string
export const isBundler: (html: string) => boolean
export const isDcDocument: (html: string) => boolean
export const collectSiblings: (entryHtml: string, entryDir: string) => Record<string, string>
export const extractDcParts: (entryHtml: string) => { dcInner: string; dcScript: string }
export const blobBootScript: (blobs: Record<string, string>) => string
export const readManifest: () => LandingManifestEntry[]
export const assembleLiveHtml: (
  entryPath: string,
  title: string,
  options?: { viteClient?: boolean },
) => string
