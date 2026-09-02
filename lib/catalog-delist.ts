// ============================================================
// FlexMed v2 — Delisted catalog entries
// Products the founder has withdrawn from sale. They stay off every public
// surface (catalog, search, nav, feature rails, product and CoA pages,
// checkout) no matter what the shared Supabase catalog or the static
// fallback catalog says about them.
//
// Keep this module free of server-only imports: the NavBar and the cart
// run it in the browser.
// ============================================================

/** Whole collections withdrawn from the storefront. */
export const DELISTED_COLLECTIONS: ReadonlySet<string> = new Set(['sprays'])

/** Individual SKUs withdrawn from the storefront: every BAC Water size plus every spray. */
export const DELISTED_PRODUCT_SLUGS: ReadonlySet<string> = new Set([
  // BAC Water — every size variant that has existed in the shared catalog
  'bac-h2o-3ml',
  'bac-h2o-10ml',
  'bac-water-5ml',
  'bac-water-5ml-5mg',
  'bac-water-10ml',
  'bac-water-30ml',
  'bac-test-0mg',
  // Nasal sprays
  'adalink-nasal-spray-10mg',
  'adamax-nasal-spray-10mg',
  'selank-nasal-spray-10mg',
  'semax-nasal-spray-10mg',
  'semax-selank-nasal-blend-20mg',
  'adalank-adamax-10-10',
])

const BAC_WATER_PATTERN = /\bbac\b|bacteriostatic/i

export interface DelistCandidate {
  slug: string
  sku?: string | null
  displayName?: string | null
  fullName?: string | null
  collection?: string | null
  category?: string | null
  formatType?: string | null
  variantGroup?: string | null
}

export function isDelistedProductSlug(slug: string) {
  return DELISTED_PRODUCT_SLUGS.has(slug.trim().toLowerCase())
}

/**
 * True when a catalog entry must stay off the storefront. Matches by slug,
 * by collection, by spray format, and by BAC Water naming, so a row that is
 * re-created or un-archived in the admin cannot bring the product back.
 */
export function isDelistedCatalogEntry(entry: DelistCandidate) {
  if (isDelistedProductSlug(entry.slug)) return true

  const collection = (entry.collection ?? entry.category ?? '').trim().toLowerCase()
  if (DELISTED_COLLECTIONS.has(collection)) return true

  if ((entry.formatType ?? '').toLowerCase().includes('spray')) return true

  if ((entry.variantGroup ?? '').trim().toLowerCase().startsWith('bac-')) return true
  if ((entry.sku ?? '').trim().toUpperCase().startsWith('BAC-')) return true

  return BAC_WATER_PATTERN.test(entry.displayName ?? '') || BAC_WATER_PATTERN.test(entry.fullName ?? '')
}
