import landings from './landings.json' with { type: 'json' }
import type { LandingManifestEntry } from './pipeline/types.ts'

export const landingCatalog = landings as LandingManifestEntry[]
