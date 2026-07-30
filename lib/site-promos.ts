import { getSupabaseAdmin } from '@/lib/supabase-admin'
import type { Product } from '@/lib/types'

export type PromoPlacement = 'banner' | 'popup' | 'product' | 'checkout'
export type PromoDiscountType = 'percentage' | 'bogo' | 'free_shipping' | 'announcement'
export type PromoKind = 'sitewide' | 'product_selection' | 'collection' | 'vial_cases'

export interface SitePromoRecord {
  id: string
  title: string
  detail: string
  promoKind: PromoKind
  placements: PromoPlacement[]
  scope: string
  targetSlug: string | null
  targetSlugs: string[]
  targetFamilyKeys: string[]
  targetVialCaseIds: string[]
  badgeLabel: string
  popupImageUrl: string
  discountType: PromoDiscountType
  discountPercent: number | null
  buyQuantity: number
  getQuantity: number
  isActive: boolean
  startsAt: string | null
  endsAt: string | null
  updatedAt: string | null
  createdAt: string
}

export interface AppliedPromotionSnapshot {
  id: string
  title: string
  badgeLabel: string
  discountType: PromoDiscountType
  discountPercent: number | null
  discountAmount: number
  freeUnits: number
}

function toStringArray(value: unknown) {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : []
}

function normalizePlacement(value: unknown): PromoPlacement | null {
  if (value === 'banner' || value === 'popup' || value === 'product' || value === 'checkout') return value
  if (value === 'product_badge') return 'product'
  if (value === 'free_shipping') return 'checkout'
  return null
}

export function normalizeFamilyKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function stripStrength(value: string) {
  return value
    .replace(/\s+\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|iu)\b.*$/i, '')
    .trim()
}

export function getPromoFamilyKey(product: Pick<Product, 'displayName' | 'variantGroup'>) {
  return normalizeFamilyKey(product.variantGroup || stripStrength(product.displayName))
}

export function normalizePromoRow(row: Record<string, unknown>): SitePromoRecord {
  const legacyPlacement = normalizePlacement(row.placement)
  const placements = toStringArray(row.placements)
    .map(normalizePlacement)
    .filter((value): value is PromoPlacement => Boolean(value))

  const legacyKind = String(row.promo_kind ?? 'sitewide')
  const discountType =
    row.discount_type === 'percentage' ||
    row.discount_type === 'bogo' ||
    row.discount_type === 'free_shipping' ||
    row.discount_type === 'announcement'
      ? row.discount_type
      : row.placement === 'free_shipping'
        ? 'free_shipping'
        : 'announcement'

  return {
    id: String(row.id),
    title: String(row.title ?? ''),
    detail: String(row.detail ?? ''),
    promoKind:
      legacyKind === 'product_selection' || legacyKind === 'collection' || legacyKind === 'vial_cases'
        ? legacyKind
        : 'sitewide',
    placements: placements.length > 0 ? placements : legacyPlacement ? [legacyPlacement] : ['banner'],
    scope: String(row.scope ?? 'sitewide'),
    targetSlug: typeof row.target_slug === 'string' ? row.target_slug : null,
    targetSlugs: toStringArray(row.target_slugs),
    targetFamilyKeys: toStringArray(row.target_family_keys),
    targetVialCaseIds: toStringArray(row.target_vial_case_ids),
    badgeLabel: String(row.badge_label ?? ''),
    popupImageUrl: String(row.popup_image_url ?? ''),
    discountType,
    discountPercent:
      typeof row.discount_percent === 'number' && Number.isFinite(row.discount_percent)
        ? row.discount_percent
        : null,
    buyQuantity:
      typeof row.buy_quantity === 'number' && row.buy_quantity > 0 ? Math.floor(row.buy_quantity) : 1,
    getQuantity:
      typeof row.get_quantity === 'number' && row.get_quantity > 0 ? Math.floor(row.get_quantity) : 1,
    isActive: Boolean(row.is_active),
    startsAt: typeof row.starts_at === 'string' ? row.starts_at : null,
    endsAt: typeof row.ends_at === 'string' ? row.ends_at : null,
    updatedAt: typeof row.updated_at === 'string' ? row.updated_at : null,
    createdAt: String(row.created_at ?? ''),
  }
}

export function isPromoActiveNow(promo: SitePromoRecord, now = new Date()) {
  if (!promo.isActive) return false
  const current = now.getTime()
  if (promo.startsAt && Date.parse(promo.startsAt) > current) return false
  if (promo.endsAt && Date.parse(promo.endsAt) <= current) return false
  return true
}

export function getPromoLifecycle(promo: SitePromoRecord, now = new Date()) {
  if (!promo.isActive) return 'paused' as const
  if (promo.startsAt && Date.parse(promo.startsAt) > now.getTime()) return 'scheduled' as const
  if (promo.endsAt && Date.parse(promo.endsAt) <= now.getTime()) return 'expired' as const
  return 'live' as const
}

export async function getSitePromos(options?: { activeOnly?: boolean }) {
  const supabase = getSupabaseAdmin()
  if (!supabase) return [] as SitePromoRecord[]

  let query = supabase.from('site_promos').select('*').order('updated_at', { ascending: false })
  if (options?.activeOnly) query = query.eq('is_active', true)

  const { data, error } = await query
  if (error || !data) return []

  const promos = (data as Record<string, unknown>[]).map(normalizePromoRow)
  return options?.activeOnly ? promos.filter((promo) => isPromoActiveNow(promo)) : promos
}

export async function getActiveSitePromos() {
  return getSitePromos({ activeOnly: true })
}

export function promoMatchesProduct(
  promo: SitePromoRecord,
  product: Pick<Product, 'slug' | 'displayName' | 'variantGroup' | 'category' | 'researchCategory'>,
) {
  if (promo.promoKind === 'sitewide') return true
  if (promo.promoKind === 'collection') {
    return promo.scope === product.category || promo.scope === product.researchCategory
  }
  if (promo.targetSlug === product.slug || promo.targetSlugs.includes(product.slug)) return true
  return promo.targetFamilyKeys.includes(getPromoFamilyKey(product))
}

export function promoMatchesVialCase(promo: SitePromoRecord, vialCaseId: string) {
  return promo.promoKind === 'sitewide' || promo.targetVialCaseIds.includes(vialCaseId)
}

export function getPromoEffectivePercent(promo: SitePromoRecord) {
  if (promo.discountType === 'percentage') return promo.discountPercent ?? 0
  if (promo.discountType === 'bogo') {
    return (promo.getQuantity / (promo.buyQuantity + promo.getQuantity)) * 100
  }
  return 0
}

export function getBestProductPromo(
  promos: SitePromoRecord[],
  product: Pick<Product, 'slug' | 'displayName' | 'variantGroup' | 'category' | 'researchCategory'>,
) {
  return promos
    .filter(
      (promo) =>
        promoMatchesProduct(promo, product) &&
        (promo.discountType === 'percentage' || promo.discountType === 'bogo'),
    )
    .sort((a, b) => getPromoEffectivePercent(b) - getPromoEffectivePercent(a))[0]
}

export function applyPromosToProduct(product: Product, promos: SitePromoRecord[]) {
  const matchingPromos = promos.filter((promo) => promoMatchesProduct(promo, product))
  const displayPromo = matchingPromos.find((promo) => promo.placements.includes('product'))
  const discountPromo = getBestProductPromo(matchingPromos, product)
  const numericPrice = Number(String(product.priceVial ?? '').replace(/[^0-9.]/g, ''))
  const discountedPrice =
    discountPromo?.discountType === 'percentage' &&
    Number.isFinite(numericPrice) &&
    discountPromo.discountPercent
      ? Math.max(0, numericPrice * (1 - discountPromo.discountPercent / 100))
      : null

  return {
    ...product,
    promoLabel: displayPromo?.badgeLabel || displayPromo?.title || product.promoLabel,
    promoDetail: displayPromo?.detail || product.promoDetail,
    promoId: discountPromo?.id,
    promoDiscountType: discountPromo?.discountType,
    promoDiscountPercent: discountPromo?.discountPercent ?? undefined,
    promoBuyQuantity: discountPromo?.buyQuantity,
    promoGetQuantity: discountPromo?.getQuantity,
    promoDiscountedPrice: discountedPrice,
  }
}
