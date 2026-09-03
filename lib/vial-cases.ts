import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { getVialCaseImageProxyUrl, VIAL_CASE_IMAGE_BUCKET } from '@/lib/vial-case-assets'

export interface VialCaseRecord {
  id: string
  name: string
  description: string
  priceLabel: string
  priceAmount: number
  imageUrl?: string
  imageSource?: 'uploaded' | 'none'
  images: VialCaseImage[]
  publicVisible: boolean
  archived: boolean
  sortOrder: number
  createdAt?: string
  updatedAt?: string
}

export interface VialCaseImage {
  id: string
  url: string
  label?: string
  isPrimary?: boolean
  sortOrder?: number
  uploadedAt?: string
}

type VialCaseRow = {
  id: string
  name: string
  description: string | null
  price_label: string
  price_amount: number | string | null
  image_url: string | null
  image_source: 'uploaded' | 'none' | null
  image_gallery: unknown
  public_visible: boolean | null
  archived: boolean | null
  sort_order: number | null
  created_at: string | null
  updated_at: string | null
}

export function parseVialCasePrice(value?: string | null) {
  if (!value) return 0
  const numeric = Number(value.replace(/[^0-9.]/g, ''))
  return Number.isFinite(numeric) ? numeric : 0
}

function toNumber(value: unknown, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const numeric = Number(value)
    if (Number.isFinite(numeric)) return numeric
  }
  return fallback
}

function normalizeGallery(value: unknown, fallbackUrl?: string): VialCaseImage[] {
  const parsed = Array.isArray(value) ? value : []
  const images: VialCaseImage[] = []
  parsed.forEach((entry, index) => {
    if (!entry || typeof entry !== 'object') return
    const record = entry as Record<string, unknown>
    const id = typeof record.id === 'string' && record.id.trim() ? record.id.trim() : `image-${index + 1}`
    const url = typeof record.url === 'string' ? record.url.trim() : ''
    if (!url) return
    images.push({
      id,
      url,
      label: typeof record.label === 'string' ? record.label : undefined,
      isPrimary: Boolean(record.isPrimary),
      sortOrder: toNumber(record.sortOrder, index),
      uploadedAt: typeof record.uploadedAt === 'string' ? record.uploadedAt : undefined,
    })
  })
  images.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))

  if (images.length > 0) {
    const hasPrimary = images.some((image) => image.isPrimary)
    return hasPrimary ? images : images.map((image, index) => ({ ...image, isPrimary: index === 0 }))
  }

  return fallbackUrl
    ? [
        {
          id: 'front',
          url: fallbackUrl,
          label: 'Front',
          isPrimary: true,
          sortOrder: 0,
        },
      ]
    : []
}

export const DEFAULT_VIAL_CASES: VialCaseRecord[] = [
  {
    id: 'default-3ml-single-vial',
    name: '3ml single vial',
    description: 'Single 3ml vial presentation case.',
    priceLabel: '$2 each',
    priceAmount: 2,
    images: [],
    publicVisible: true,
    archived: false,
    sortOrder: 10,
  },
  {
    id: 'default-3ml-diamond-cut',
    name: '3ml diamond cut',
    description: 'Diamond-cut 3ml case option.',
    priceLabel: '$5 each',
    priceAmount: 5,
    images: [],
    publicVisible: true,
    archived: false,
    sortOrder: 20,
  },
  {
    id: 'default-3ml-4-count',
    name: '3ml 4 ct',
    description: 'Four-count 3ml vial case.',
    priceLabel: '$8',
    priceAmount: 8,
    images: [],
    publicVisible: true,
    archived: false,
    sortOrder: 30,
  },
  {
    id: 'default-3ml-10-count',
    name: '3ml 10 ct',
    description: 'Ten-count 3ml vial case.',
    priceLabel: '$12',
    priceAmount: 12,
    images: [],
    publicVisible: true,
    archived: false,
    sortOrder: 40,
  },
  {
    id: 'default-3ml-20-count',
    name: '3ml 20 ct',
    description: 'Twenty-count 3ml vial case.',
    priceLabel: '$20',
    priceAmount: 20,
    images: [],
    publicVisible: true,
    archived: false,
    sortOrder: 50,
  },
  {
    id: 'default-10ml-diamond-cut',
    name: '10ml diamond cut',
    description: 'Diamond-cut 10ml case option.',
    priceLabel: '$8 each',
    priceAmount: 8,
    images: [],
    publicVisible: true,
    archived: false,
    sortOrder: 60,
  },
  {
    id: 'default-larger-cases',
    name: 'Larger cases',
    description: 'Large vial case option.',
    priceLabel: '$35',
    priceAmount: 35,
    images: [],
    publicVisible: true,
    archived: false,
    sortOrder: 70,
  },
]

function mapVialCaseRow(row: VialCaseRow): VialCaseRecord {
  const priceLabel = row.price_label
  const priceAmount = toNumber(row.price_amount, parseVialCasePrice(priceLabel))
  const images = normalizeGallery(row.image_gallery, row.image_url ?? undefined)
  const primaryImage = images.find((image) => image.isPrimary) ?? images[0]
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? '',
    priceLabel,
    priceAmount,
    imageUrl: primaryImage?.url ?? row.image_url ?? undefined,
    imageSource: row.image_source ?? 'none',
    images,
    publicVisible: row.public_visible ?? true,
    archived: row.archived ?? false,
    sortOrder: row.sort_order ?? 0,
    createdAt: row.created_at ?? undefined,
    updatedAt: row.updated_at ?? undefined,
  }
}

function ensureSinglePrimaryImage(images: VialCaseImage[], primaryUrl?: string | null) {
  if (images.length === 0) return []
  const primaryIndex = primaryUrl ? images.findIndex((image) => image.url === primaryUrl) : -1
  const fallbackPrimaryIndex = primaryIndex >= 0 ? primaryIndex : images.findIndex((image) => image.isPrimary)
  const targetIndex = fallbackPrimaryIndex >= 0 ? fallbackPrimaryIndex : 0

  return images
    .map((image, index) => ({
      ...image,
      isPrimary: index === targetIndex,
      sortOrder: image.sortOrder ?? index,
    }))
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
}

async function getStorageGalleryImages(id: string, primaryUrl?: string | null): Promise<VialCaseImage[]> {
  const supabase = getSupabaseAdmin()
  if (!supabase) return []

  const { data, error } = await supabase.storage.from(VIAL_CASE_IMAGE_BUCKET).list(id, { limit: 100 })
  if (error || !data) return []

  return data
    .filter((entry) => entry.name && !entry.name.startsWith('.'))
    .map((entry, index) => {
      const url = getVialCaseImageProxyUrl(id, entry.name)
      return {
        id: entry.name,
        url,
        label: entry.name === 'front' ? 'Front' : `Image ${index + 1}`,
        isPrimary: primaryUrl ? url === primaryUrl : index === 0,
        sortOrder: index,
        uploadedAt: entry.created_at ?? undefined,
      }
    })
}

async function hydrateStorageImages(record: VialCaseRecord): Promise<VialCaseRecord> {
  const storageImages = await getStorageGalleryImages(record.id, record.imageUrl)
  if (storageImages.length === 0) return record

  const imagesById = new Map<string, VialCaseImage>()
  record.images.forEach((image, index) => {
    imagesById.set(image.id, { ...image, sortOrder: image.sortOrder ?? index })
  })
  storageImages.forEach((image) => {
    const existing = imagesById.get(image.id)
    imagesById.set(image.id, existing ? { ...image, ...existing, url: image.url } : image)
  })

  const imagesByUrl = new Map<string, VialCaseImage>()
  Array.from(imagesById.values()).forEach((image) => {
    const existing = imagesByUrl.get(image.url)
    if (!existing || image.url === record.imageUrl || image.isPrimary) {
      imagesByUrl.set(image.url, image)
    }
  })

  const images = ensureSinglePrimaryImage(Array.from(imagesByUrl.values()), record.imageUrl)
  const primaryImage = images.find((image) => image.isPrimary) ?? images[0]
  return {
    ...record,
    imageUrl: primaryImage?.url ?? record.imageUrl,
    imageSource: primaryImage ? 'uploaded' : record.imageSource,
    images,
  }
}

async function hydrateStorageImagesForRecords(records: VialCaseRecord[]) {
  return Promise.all(records.map((record) => hydrateStorageImages(record)))
}

/** Reads the public cases and throws on a query error, so a cached caller never stores a bad read. */
export async function queryPublicVialCases(): Promise<VialCaseRecord[]> {
  const supabase = getSupabaseAdmin()
  if (!supabase) return DEFAULT_VIAL_CASES

  const { data, error } = await supabase
    .from('vial_cases')
    .select('*')
    .eq('public_visible', true)
    .eq('archived', false)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) throw new Error(`vial_cases query failed: ${error.message}`)
  if (!data || data.length === 0) return DEFAULT_VIAL_CASES
  return hydrateStorageImagesForRecords((data as VialCaseRow[]).map(mapVialCaseRow))
}

/** Fresh read, used by checkout and order submission. Pages use getStorefrontVialCases(). */
export async function getPublicVialCases(): Promise<VialCaseRecord[]> {
  try {
    return await queryPublicVialCases()
  } catch {
    return DEFAULT_VIAL_CASES
  }
}

export async function getAdminVialCases(): Promise<{ cases: VialCaseRecord[]; error?: string } > {
  const supabase = getSupabaseAdmin()
  if (!supabase) return { cases: [], error: 'Supabase is not configured.' }

  const { data, error } = await supabase
    .from('vial_cases')
    .select('*')
    .order('archived', { ascending: true })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) return { cases: [], error: error.message }
  return { cases: await hydrateStorageImagesForRecords(((data ?? []) as VialCaseRow[]).map(mapVialCaseRow)) }
}

export async function getVialCaseById(id: string) {
  const supabase = getSupabaseAdmin()
  if (!supabase) return null

  const { data, error } = await supabase.from('vial_cases').select('*').eq('id', id).maybeSingle()
  if (error || !data) return null
  return hydrateStorageImages(mapVialCaseRow(data as VialCaseRow))
}
