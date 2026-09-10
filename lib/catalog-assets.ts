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

export interface CoAObjectEntry {
  name: string
  createdAt?: string | null
}

/** Uploads of several files in one request share a created_at window and stay in page order. */
const COA_BATCH_WINDOW_MS = 2 * 60 * 1000

function isCoAObjectName(name: string) {
  const normalized = name.toLowerCase()
  return normalized === 'coa' || normalized.startsWith('coa.') || normalized.startsWith('page-')
}

export function parseCoAPageNumber(name: string) {
  const pageMatch = name.match(/^page-(\d+)/i)
  return pageMatch ? Number(pageMatch[1]) : 0
}

/** Next `page-NN` index. Uploads still append; display order is newest-first separately. */
export function getNextCoAPageNumber(names: string[]) {
  return names.reduce((max, name) => Math.max(max, parseCoAPageNumber(name)), 0) + 1
}

/**
 * Newest CoA first. Files uploaded together (same ~2 minute window) stay in
 * ascending page order so a multi-page certificate still reads 1, 2, 3.
 * Sequential single-file uploads over time each form their own batch.
 */
export function sortCoAObjectEntriesNewestFirst(entries: CoAObjectEntry[]) {
  const items = entries.map((entry) => ({
    name: entry.name,
    page: parseCoAPageNumber(entry.name),
    createdAt: entry.createdAt ? Date.parse(entry.createdAt) : Number.NaN,
  }))

  items.sort(
    (a, b) => a.page - b.page || a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }),
  )

  const batches: typeof items[] = []
  for (const item of items) {
    const currentBatch = batches[batches.length - 1]
    const previous = currentBatch?.[currentBatch.length - 1]
    const sameUploadWindow =
      previous != null &&
      Number.isFinite(item.createdAt) &&
      Number.isFinite(previous.createdAt) &&
      Math.abs(item.createdAt - previous.createdAt) <= COA_BATCH_WINDOW_MS

    if (currentBatch && sameUploadWindow) {
      currentBatch.push(item)
    } else {
      batches.push([item])
    }
  }

  batches.reverse()
  return batches.flatMap((batch) => batch.map((item) => item.name))
}

/** Lists a product's uploaded CoA pages and throws on a storage error, so a cached caller never stores a bad read. */
export async function queryCatalogCoAObjectNames(slug: string): Promise<string[]> {
  const supabase = getSupabaseAdmin()
  if (!supabase) return []

  const { data, error } = await supabase.storage.from(CATALOG_COA_BUCKET).list(slug, {
    limit: 100,
    sortBy: { column: 'created_at', order: 'desc' },
  })
  if (error) throw new Error(`CoA listing failed for ${slug}: ${error.message}`)

  const entries = (data ?? [])
    .filter((entry) => isCoAObjectName(entry.name))
    .map((entry) => ({ name: entry.name, createdAt: entry.created_at }))

  return sortCoAObjectEntriesNewestFirst(entries)
}

/** Fresh read, used by the download route and the admin. Pages use getStorefrontCoAObjectNames(). */
export async function getCatalogCoAObjectNames(slug: string) {
  try {
    return await queryCatalogCoAObjectNames(slug)
  } catch {
    return []
  }
}

/** Primary CoA object: first page of the newest uploaded certificate. */
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
