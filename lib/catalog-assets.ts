import { getProductCoALink } from '@/lib/data-testing'
import { PRODUCTS, getProductImageSrc, isPlaceholderProductImage } from '@/lib/data-products'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export const CATALOG_IMAGE_BUCKET = 'catalog-images'
export const CATALOG_COA_BUCKET = 'catalog-coas'

export interface CatalogAssetSnapshot {
  slug: string
  imageUrl: string
  imageSource: 'catalog' | 'uploaded' | 'placeholder'
  coaUrl: string | null
  coaSource: 'uploaded' | 'packet' | 'none'
}

export function getCatalogImageStoragePath(slug: string) {
  return `${slug}/front`
}

function getFileExtension(fileName: string) {
  const extension = fileName.split('.').pop()?.trim().toLowerCase()
  return extension && extension !== fileName.toLowerCase() ? extension : ''
}

export function getCatalogCoAStoragePath(slug: string, fileName = 'coa.pdf') {
  const extension = getFileExtension(fileName)
  return `${slug}/coa${extension ? `.${extension}` : ''}`
}

export function getCatalogImageProxyUrl(slug: string, version?: string | null) {
  const baseUrl = `/api/catalog-assets/image/${slug}`
  if (!version) return baseUrl
  return `${baseUrl}?v=${encodeURIComponent(version)}`
}

export function getCatalogCoAProxyUrl(slug: string) {
  return `/api/catalog-assets/coa/${slug}`
}

export function getCatalogCoAViewerUrl(slug: string) {
  return `/coa/${slug}`
}

export async function ensureCatalogBucket(bucket: string, options?: { public?: boolean; allowedMimeTypes?: string[] }) {
  const supabase = getSupabaseAdmin()
  if (!supabase) return

  const { data: buckets } = await supabase.storage.listBuckets()
  const existingBucket = buckets?.find((entry) => entry.name === bucket)
  if (existingBucket) {
    await supabase.storage.updateBucket(bucket, {
      public: options?.public ?? false,
      allowedMimeTypes: options?.allowedMimeTypes,
    })
    return
  }

  await supabase.storage.createBucket(bucket, {
    public: options?.public ?? false,
    allowedMimeTypes: options?.allowedMimeTypes,
  })
}

function sortCoAPageNames(names: string[]) {
  return [...names].sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
}

/** Lists a product's uploaded CoA pages and throws on a storage error, so a cached caller never stores a bad read. */
export async function queryCatalogCoAObjectNames(slug: string): Promise<string[]> {
  const supabase = getSupabaseAdmin()
  if (!supabase) return []

  const { data, error } = await supabase.storage.from(CATALOG_COA_BUCKET).list(slug, { limit: 20 })
  if (error) throw new Error(`CoA listing failed for ${slug}: ${error.message}`)

  const names = (data ?? [])
    .map((entry) => entry.name)
    .filter((name) => name === 'coa' || name.toLowerCase().startsWith('coa.') || name.toLowerCase().startsWith('page-'))

  return sortCoAPageNames(names)
}

/** Fresh read, used by the download route and the admin. Pages use getStorefrontCoAObjectNames(). */
export async function getCatalogCoAObjectNames(slug: string) {
  try {
    return await queryCatalogCoAObjectNames(slug)
  } catch {
    return []
  }
}

export async function getCatalogCoAObjectName(slug: string) {
  const objectNames = await getCatalogCoAObjectNames(slug)
  return objectNames[0] ?? null
}

export interface CatalogAssetIndex {
  /** Product slugs with an uploaded front image (a folder in the image bucket). */
  imageSlugs: string[]
  /** Product slugs with uploaded CoA pages (a folder in the CoA bucket). */
  coaSlugs: string[]
}

/**
 * One listing per bucket tells us which products have uploads. This used to
 * be two listings per product on every page render. Throws on failure so a
 * cached caller never stores an empty index.
 */
export async function fetchCatalogAssetIndex(): Promise<CatalogAssetIndex> {
  const supabase = getSupabaseAdmin()
  if (!supabase) return { imageSlugs: [], coaSlugs: [] }

  const [images, coas] = await Promise.all([
    supabase.storage.from(CATALOG_IMAGE_BUCKET).list('', { limit: 1000 }),
    supabase.storage.from(CATALOG_COA_BUCKET).list('', { limit: 1000 }),
  ])
  if (images.error) throw new Error(`catalog image listing failed: ${images.error.message}`)
  if (coas.error) throw new Error(`catalog CoA listing failed: ${coas.error.message}`)

  const names = (entries: { name: string }[] | null) => (entries ?? []).map((entry) => entry.name).filter(Boolean)
  return { imageSlugs: names(images.data), coaSlugs: names(coas.data) }
}

export function buildCatalogAssetSnapshots(slugs: string[], index: CatalogAssetIndex): Record<string, CatalogAssetSnapshot> {
  const imageSlugs = new Set(index.imageSlugs)
  const coaSlugs = new Set(index.coaSlugs)

  return Object.fromEntries(
    slugs.map((slug) => {
      const product = PRODUCTS[slug]
      const fallbackImage = product ? getProductImageSrc(product) : '/products/front.png'
      const fallbackCoa = product ? getProductCoALink(product) : null
      const imageUploaded = imageSlugs.has(slug)
      const coaUploaded = coaSlugs.has(slug)

      const snapshot: CatalogAssetSnapshot = {
        slug,
        imageUrl: imageUploaded ? getCatalogImageProxyUrl(slug) : fallbackImage,
        imageSource: imageUploaded ? 'uploaded' : product && isPlaceholderProductImage(product) ? 'placeholder' : 'catalog',
        coaUrl: coaUploaded ? getCatalogCoAViewerUrl(slug) : fallbackCoa,
        coaSource: coaUploaded ? 'uploaded' : fallbackCoa ? 'packet' : 'none',
      }
      return [slug, snapshot] as const
    }),
  )
}
