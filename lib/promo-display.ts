import type { SitePromoRecord } from '@/lib/site-promos'
import type { Product } from '@/lib/types'
import type { VialCaseRecord } from '@/lib/vial-cases'

export interface PromoDisplayCopy {
  offerLabel: string
  targetLabel: string
  summaryLabel: string
}

type PromoTargetContext = {
  products?: Array<Pick<Product, 'slug' | 'displayName' | 'variantGroup'>>
  vialCases?: Array<Pick<VialCaseRecord, 'id' | 'name'>>
}

function normalizeFamilyKey(value: string) {
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

function getFamilyKey(product: Pick<Product, 'displayName' | 'variantGroup'>) {
  return normalizeFamilyKey(product.variantGroup || stripStrength(product.displayName))
}

function titleCaseLabel(value: string) {
  return value
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function compactList(labels: string[], fallback: string) {
  const unique = Array.from(new Set(labels.map((label) => label.trim()).filter(Boolean)))
  if (unique.length === 0) return fallback
  if (unique.length <= 3) return unique.join(', ')
  return `${unique.slice(0, 3).join(', ')} +${unique.length - 3} more`
}

export function getPromoOfferLabel(promo: SitePromoRecord) {
  if (promo.discountType === 'percentage' && promo.discountPercent) return `${promo.discountPercent}% off`
  if (promo.discountType === 'bogo') return `Buy ${promo.buyQuantity}, get ${promo.getQuantity} free`
  if (promo.discountType === 'free_shipping') return 'Free shipping'
  return 'Announcement'
}

export function getPromoTargetLabel(promo: SitePromoRecord, context: PromoTargetContext = {}) {
  if (promo.promoKind === 'sitewide') return 'sitewide'

  if (promo.promoKind === 'collection') {
    return promo.scope ? titleCaseLabel(promo.scope) : 'selected collection'
  }

  if (promo.promoKind === 'vial_cases') {
    const caseNames =
      context.vialCases
        ?.filter((vialCase) => promo.targetVialCaseIds.includes(vialCase.id))
        .map((vialCase) => vialCase.name) ?? []
    return compactList(caseNames, promo.targetVialCaseIds.length > 0 ? 'selected vial cases' : 'vial cases')
  }

  const products = context.products ?? []
  const selectedSlugs = new Set([promo.targetSlug, ...promo.targetSlugs].filter((slug): slug is string => Boolean(slug)))
  const labels = products
    .filter((product) => selectedSlugs.has(product.slug) || promo.targetFamilyKeys.includes(getFamilyKey(product)))
    .map((product) => (promo.targetFamilyKeys.includes(getFamilyKey(product)) ? stripStrength(product.displayName) : product.displayName))

  return compactList(labels, selectedSlugs.size > 0 || promo.targetFamilyKeys.length > 0 ? 'selected products' : 'selected products')
}

export function buildPromoDisplayCopy(promo: SitePromoRecord, context: PromoTargetContext = {}): PromoDisplayCopy {
  const offerLabel = getPromoOfferLabel(promo)
  const targetLabel = getPromoTargetLabel(promo, context)
  const normalizedTarget = targetLabel === 'sitewide' ? 'sitewide' : `on ${targetLabel}`
  const summaryLabel =
    promo.discountType === 'announcement'
      ? `${promo.title}${targetLabel ? ` - ${normalizedTarget}` : ''}`
      : `${offerLabel} ${normalizedTarget}`

  return {
    offerLabel,
    targetLabel,
    summaryLabel,
  }
}
