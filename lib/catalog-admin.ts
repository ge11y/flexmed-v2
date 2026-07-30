import { PRODUCTS, PUBLIC_SLUGS, getProductImageSrc, isBioRegulator, isPlaceholderProductImage } from '@/lib/data-products'
import { getProductCoALink } from '@/lib/data-testing'
import type { Product, ProductStatus } from '@/lib/types'

export const CATALOG_ADMIN_DRAFT_STORAGE_KEY = 'flexmed_catalog_admin_draft_v1'

export type CatalogCollection =
  | 'peptides'
  | 'blends'
  | 'sprays'
  | 'topicals'
  | 'bio_regulators'
  | 'water'

export interface CatalogInventoryRecord {
  slug: string
  sku: string
  displayName: string
  fullName: string
  strength: number
  unit: string
  collection: CatalogCollection
  researchCategory: string
  formatType: string
  summaryShort: string
  summaryFull: string
  researchFocusPoints: string[]
  listingNotes: string[]
  coaNotRequired: boolean
  variantGroup?: string
  variantLabel?: string
  status: ProductStatus
  priceVial: string
  inventoryOnHand: number | null
  lowStockThreshold: number | null
  promoLabel: string
  promoDetail: string
  featured: boolean
  featuredOrder: number | null
  publicVisible: boolean
  imageUrl: string
  imageSource: 'catalog' | 'uploaded' | 'placeholder'
  coaUrl: string | null
  coaSource: 'uploaded' | 'packet' | 'none'
  customProduct: boolean
  archived: boolean
  updatedAt?: string
}

export type CatalogInventoryOverride = Partial<
  Pick<
    CatalogInventoryRecord,
    | 'sku'
    | 'displayName'
    | 'fullName'
    | 'strength'
    | 'unit'
    | 'collection'
    | 'researchCategory'
    | 'formatType'
    | 'summaryShort'
    | 'summaryFull'
    | 'researchFocusPoints'
    | 'listingNotes'
    | 'coaNotRequired'
    | 'variantGroup'
    | 'variantLabel'
    | 'status'
    | 'priceVial'
    | 'inventoryOnHand'
    | 'lowStockThreshold'
    | 'promoLabel'
    | 'promoDetail'
    | 'featured'
    | 'featuredOrder'
    | 'publicVisible'
    | 'imageUrl'
    | 'imageSource'
    | 'coaUrl'
    | 'coaSource'
    | 'customProduct'
    | 'archived'
    | 'updatedAt'
  >
>

function getCollection(product: Product): CatalogCollection {
  if (isBioRegulator(product)) return 'bio_regulators'
  if (product.formatType.includes('serum')) return 'topicals'
  if (product.formatType.includes('topical')) return 'topicals'
  if (product.formatType.includes('spray')) return 'sprays'
  if (product.formatType.includes('blend')) return 'blends'
  return 'peptides'
}

export function getCatalogInventoryRecords(): CatalogInventoryRecord[] {
  return Object.values(PRODUCTS).map((product) => {
    const coaUrl = getProductCoALink(product)
    return {
      slug: product.slug,
      sku: product.sku ?? product.slug.toUpperCase(),
      displayName: product.displayName,
      fullName: product.fullName,
      strength: product.strength,
      unit: product.unit,
      collection: getCollection(product),
      researchCategory: product.researchCategory,
      formatType: product.formatType,
      summaryShort: product.summaryShort,
      summaryFull: product.summaryFull,
      researchFocusPoints: product.researchFocusPoints ?? [],
      listingNotes: product.listingNotes ?? [],
      coaNotRequired: Boolean(product.coaNotRequired),
      variantGroup: product.variantGroup,
      variantLabel: product.variantLabel,
      status: 'out_of_stock' as ProductStatus,
      priceVial: product.priceVial ?? '',
      inventoryOnHand: null,
      lowStockThreshold: 5,
      promoLabel: '',
      promoDetail: '',
      featured: false,
      featuredOrder: null,
      publicVisible: PUBLIC_SLUGS.includes(product.slug as (typeof PUBLIC_SLUGS)[number]),
      imageUrl: getProductImageSrc(product),
      imageSource: (isPlaceholderProductImage(product) ? 'placeholder' : 'catalog') as CatalogInventoryRecord['imageSource'],
      coaUrl,
      coaSource: (coaUrl ? 'packet' : 'none') as CatalogInventoryRecord['coaSource'],
      customProduct: Boolean(product.customProduct),
      archived: Boolean(product.archived),
    }
  }).sort((a, b) => a.displayName.localeCompare(b.displayName))
}

export function applyCatalogInventoryOverrides(
  records: CatalogInventoryRecord[],
  overrides: Record<string, CatalogInventoryOverride>,
) {
  const merged = records.map((record) => ({
    ...record,
    ...(overrides[record.slug] ?? {}),
  }))

  const knownSlugs = new Set(merged.map((record) => record.slug))
  const draftOnlyRecords = Object.entries(overrides)
    .filter(([slug, override]) => !knownSlugs.has(slug) && override.customProduct)
    .map(([slug, override]) => ({
      slug,
      sku: override.sku ?? slug.toUpperCase(),
      displayName: override.displayName ?? slug,
      fullName: override.fullName ?? override.displayName ?? slug,
      strength: typeof override.strength === 'number' ? override.strength : 0,
      unit: override.unit ?? 'mg',
      collection: override.collection ?? 'peptides',
      researchCategory: override.researchCategory ?? 'General Research',
      formatType: override.formatType ?? 'vial',
      summaryShort: override.summaryShort ?? '',
      summaryFull: override.summaryFull ?? '',
      researchFocusPoints: override.researchFocusPoints ?? [],
      listingNotes: override.listingNotes ?? [],
      coaNotRequired: override.coaNotRequired ?? false,
      variantGroup: override.variantGroup,
      variantLabel: override.variantLabel,
      status: override.status ?? 'out_of_stock',
      priceVial: override.priceVial ?? '',
      inventoryOnHand: override.inventoryOnHand ?? null,
      lowStockThreshold: override.lowStockThreshold ?? 5,
      promoLabel: override.promoLabel ?? '',
      promoDetail: override.promoDetail ?? '',
      featured: override.featured ?? false,
      featuredOrder: override.featuredOrder ?? null,
      publicVisible: override.publicVisible ?? false,
      imageUrl: override.imageUrl ?? '/products/front.png',
      imageSource: override.imageSource ?? ('placeholder' as const),
      coaUrl: override.coaUrl ?? null,
      coaSource: override.coaSource ?? ('none' as const),
      customProduct: true,
      archived: override.archived ?? false,
    }))

  return [...merged, ...draftOnlyRecords].sort((a, b) => {
    if (a.archived !== b.archived) return a.archived ? 1 : -1
    if (a.displayName !== b.displayName) return a.displayName.localeCompare(b.displayName)
    return a.strength - b.strength
  })
}

export function buildCatalogSheetRows(records: CatalogInventoryRecord[]) {
  return records.map((record) => ({
    slug: record.slug,
    sku: record.sku,
    display_name: record.displayName,
    full_name: record.fullName,
    strength: record.strength,
    unit: record.unit,
    collection: record.collection,
    research_category: record.researchCategory,
    format_type: record.formatType,
    summary_short: record.summaryShort,
    summary_full: record.summaryFull,
    research_focus_points: JSON.stringify(record.researchFocusPoints ?? []),
    listing_notes: JSON.stringify(record.listingNotes ?? []),
    coa_not_required: record.coaNotRequired ? 'yes' : 'no',
    variant_group: record.variantGroup ?? '',
    variant_label: record.variantLabel ?? '',
    public_visible: record.publicVisible ? 'yes' : 'no',
    status: record.status,
    inventory_on_hand: record.inventoryOnHand ?? '',
    low_stock_threshold: record.lowStockThreshold ?? '',
    promo_label: record.promoLabel,
    promo_detail: record.promoDetail,
    featured: record.featured ? 'yes' : 'no',
    featured_order: record.featuredOrder ?? '',
    price_vial: record.priceVial,
    image_url: record.imageUrl,
    image_source: record.imageSource,
    coa_url: record.coaUrl ?? '',
    coa_source: record.coaSource,
    custom_product: record.customProduct ? 'yes' : 'no',
    archived: record.archived ? 'yes' : 'no',
  }))
}

export function buildCatalogCsv(records: CatalogInventoryRecord[]) {
  const rows = buildCatalogSheetRows(records)
  const headers = Object.keys(rows[0] ?? {
    slug: '',
    sku: '',
    display_name: '',
    full_name: '',
    strength: '',
    unit: '',
    collection: '',
    research_category: '',
    format_type: '',
    summary_short: '',
    summary_full: '',
    research_focus_points: '[]',
    listing_notes: '[]',
    coa_not_required: '',
    variant_group: '',
    variant_label: '',
    public_visible: '',
    status: '',
    inventory_on_hand: '',
    low_stock_threshold: '',
    promo_label: '',
    promo_detail: '',
    featured: '',
    featured_order: '',
    price_vial: '',
    image_url: '',
    image_source: '',
    coa_url: '',
    coa_source: '',
    custom_product: '',
    archived: '',
  })

  const body = rows.map((row) =>
    headers
      .map((header) => {
        const value = String(row[header as keyof typeof row] ?? '')
        return `"${value.replace(/"/g, '""')}"`
      })
      .join(','),
  )

  return [headers.join(','), ...body].join('\n')
}
