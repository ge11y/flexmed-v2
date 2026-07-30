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

async function hasStorageObject(bucket: string, slug: string, fileName: string) {
  const supabase = getSupabaseAdmin()
  if (!supabase) return false

  const { data, error } = await supabase.storage.from(bucket).list(slug, { limit: 20 })
  if (error) return false
  return Boolean(data?.some((entry) => entry.name === fileName))
}

function sortCoAPageNames(names: string[]) {
  return [...names].sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
}

export async function getCatalogCoAObjectNames(slug: string) {
  const supabase = getSupabaseAdmin()
  if (!supabase) return []

  const { data, error } = await supabase.storage.from(CATALOG_COA_BUCKET).list(slug, { limit: 20 })
  if (error || !data) return []

  const names = data
    .map((entry) => entry.name)
    .filter((name) => name === 'coa' || name.toLowerCase().startsWith('coa.') || name.toLowerCase().startsWith('page-'))

  return sortCoAPageNames(names)
}

export async function getCatalogCoAObjectName(slug: string) {
  const objectNames = await getCatalogCoAObjectNames(slug)
  return objectNames[0] ?? null
}

export async function getCatalogAssetSnapshot(slug: string): Promise<CatalogAssetSnapshot> {
  const product = PRODUCTS[slug]
  const fallbackImage = product ? getProductImageSrc(product) : '/products/front.png'
  const fallbackCoa = product ? getProductCoALink(product) : null

  const [imageUploaded, coaUploaded] = await Promise.all([
    hasStorageObject(CATALOG_IMAGE_BUCKET, slug, 'front'),
    getCatalogCoAObjectNames(slug).then((names) => names.length > 0),
  ])

  return {
    slug,
    imageUrl: imageUploaded ? getCatalogImageProxyUrl(slug) : fallbackImage,
    imageSource: imageUploaded ? 'uploaded' : product && isPlaceholderProductImage(product) ? 'placeholder' : 'catalog',
    coaUrl: coaUploaded ? getCatalogCoAViewerUrl(slug) : fallbackCoa,
    coaSource: coaUploaded ? 'uploaded' : fallbackCoa ? 'packet' : 'none',
  }
}

export async function getCatalogAssetSnapshots(slugs: string[]) {
  const entries = await Promise.all(slugs.map(async (slug) => [slug, await getCatalogAssetSnapshot(slug)] as const))
  return Object.fromEntries(entries)
}

export async function getCatalogUploadedImageSlugSet() {
  const supabase = getSupabaseAdmin()
  if (!supabase) return new Set<string>()

  const { data, error } = await supabase.storage.from(CATALOG_IMAGE_BUCKET).list('', { limit: 1000 })
  if (error || !data) return new Set<string>()

  return new Set(data.map((entry) => entry.name).filter(Boolean))
}
