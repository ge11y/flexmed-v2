import type { CheckoutOperationsSettings } from '@/lib/admin-settings'
import { getCartLineKey, type CartItem, type CartItemType, type OrderDraft, type OrderDraftLine } from '@/lib/cart'
import type { CatalogInventoryRecord } from '@/lib/catalog-admin'
import {
  promoMatchesVialCase,
  promoMatchesProduct,
  type AppliedPromotionSnapshot,
  type SitePromoRecord,
} from '@/lib/site-promos'
import type { VialCaseRecord } from '@/lib/vial-cases'

export type CheckoutQuote = {
  order: OrderDraft
  errors: string[]
}

function money(value: number) {
  return Number(value.toFixed(2))
}

function parseCurrency(value?: string | null) {
  if (!value) return null
  const numeric = Number(value.replace(/[^0-9.]/g, ''))
  return Number.isFinite(numeric) ? numeric : null
}

function settingNumber(value: string | null | undefined) {
  return parseCurrency(value) ?? 0
}

function normalizeZip(value?: string | null) {
  const match = value?.match(/\d{5}/)
  return match?.[0] ?? ''
}

function expandZipTokens(value?: string | null) {
  const zips = new Set<string>()
  for (const rawToken of (value ?? '').split(',')) {
    const token = rawToken.trim()
    if (!token) continue
    const rangeMatch = token.match(/^(\d{5})\s*-\s*(\d{5})$/)
    if (rangeMatch) {
      const start = Number(rangeMatch[1])
      const end = Number(rangeMatch[2])
      if (Number.isFinite(start) && Number.isFinite(end) && end >= start && end - start <= 250) {
        for (let zip = start; zip <= end; zip += 1) {
          zips.add(String(zip).padStart(5, '0'))
        }
      }
      continue
    }
    const zip = normalizeZip(token)
    if (zip) zips.add(zip)
  }
  return zips
}

const ZIP_COORDINATES: Record<string, { lat: number; lng: number }> = {
  '35640': { lat: 34.4434, lng: -86.9353 },
  '35601': { lat: 34.6059, lng: -86.9833 },
  '35603': { lat: 34.5407, lng: -86.9597 },
  '35619': { lat: 34.3183, lng: -86.7342 },
  '35621': { lat: 34.3376, lng: -86.7257 },
  '35622': { lat: 34.4668, lng: -87.0672 },
  '35649': { lat: 34.4731, lng: -86.7508 },
  '35650': { lat: 34.4843, lng: -87.2934 },
  '35670': { lat: 34.4774, lng: -86.7991 },
  '35673': { lat: 34.5459, lng: -86.7419 },
  '35055': { lat: 34.1748, lng: -86.8436 },
  '35057': { lat: 34.1744, lng: -86.8853 },
  '35058': { lat: 34.2012, lng: -86.7329 },
  '35555': { lat: 34.3729, lng: -86.9081 },
  '35556': { lat: 34.3051, lng: -87.0008 },
  '35557': { lat: 34.3787, lng: -87.0926 },
  '35558': { lat: 34.3261, lng: -87.1819 },
}

function distanceMiles(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const radiusMiles = 3958.8
  const toRadians = (value: number) => (value * Math.PI) / 180
  const dLat = toRadians(b.lat - a.lat)
  const dLng = toRadians(b.lng - a.lng)
  const lat1 = toRadians(a.lat)
  const lat2 = toRadians(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return radiusMiles * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

function isLocalFreeShippingZip(args: {
  postalCode?: string | null
  settings: CheckoutOperationsSettings
}) {
  if (!args.settings.localFreeShippingEnabled) return false
  const destinationZip = normalizeZip(args.postalCode)
  if (!destinationZip) return false

  const explicitZips = expandZipTokens(args.settings.localFreeShippingZipCodes)
  if (explicitZips.has(destinationZip)) return true

  const homeZip = normalizeZip(args.settings.localFreeShippingHomeZip) || '35640'
  const home = ZIP_COORDINATES[homeZip]
  const destination = ZIP_COORDINATES[destinationZip]
  const radius = settingNumber(args.settings.localFreeShippingRadiusMiles)
  if (!home || !destination || radius <= 0) return false

  return distanceMiles(home, destination) <= radius
}

function buildAppliedSnapshot(
  promo: SitePromoRecord,
  discountAmount: number,
  freeUnits: number,
): AppliedPromotionSnapshot {
  return {
    id: promo.id,
    title: promo.title,
    badgeLabel: promo.badgeLabel,
    discountType: promo.discountType,
    discountPercent: promo.discountPercent,
    discountAmount: money(discountAmount),
    freeUnits,
  }
}

function quoteLine(
  item: Pick<CartItem, 'slug' | 'quantity'>,
  record: CatalogInventoryRecord,
  promos: SitePromoRecord[],
) {
  const quantity = Math.max(1, Math.floor(item.quantity))
  const unitPrice = parseCurrency(record.priceVial) ?? 0
  const lineSubtotal = money(unitPrice * quantity)
  const productShape = {
    slug: record.slug,
    displayName: record.displayName,
    variantGroup: record.variantGroup,
    category: record.collection,
    researchCategory: record.researchCategory,
  }
  const promoCandidates = promos
    .filter((promo) => promoMatchesProduct(promo, productShape))
    .filter((promo) => promo.discountType === 'percentage' || promo.discountType === 'bogo')
    .map((promo) => {
      if (promo.discountType === 'percentage') {
        return {
          promo,
          freeUnits: 0,
          discountAmount: money(lineSubtotal * ((promo.discountPercent ?? 0) / 100)),
        }
      }

      const groupSize = promo.buyQuantity + promo.getQuantity
      const completedGroups = Math.floor(quantity / groupSize)
      const freeUnits = completedGroups * promo.getQuantity
      return {
        promo,
        freeUnits,
        discountAmount: money(freeUnits * unitPrice),
      }
    })
    .sort((a, b) => b.discountAmount - a.discountAmount)
  const winningPromo = promoCandidates[0]
  const promo = winningPromo?.promo
  const discountAmount = winningPromo?.discountAmount ?? 0
  const freeUnits = winningPromo?.freeUnits ?? 0

  const line: OrderDraftLine = {
    itemType: 'product',
    sourceId: record.slug,
    slug: record.slug,
    sku: record.sku || record.slug.toUpperCase(),
    displayName: record.displayName,
    fullName: record.fullName,
    strengthLabel: record.variantLabel || `${record.strength} ${record.unit}`.trim(),
    formatType: record.formatType,
    quantity,
    unitPrice,
    lineSubtotal,
    discountAmount,
    lineTotal: money(lineSubtotal - discountAmount),
    freeUnits,
    imageUrl: record.imageUrl,
    appliedPromotion: promo
      ? {
          id: promo.id,
          title: promo.title,
          badgeLabel: promo.badgeLabel,
          discountType: promo.discountType,
          discountPercent: promo.discountPercent,
          buyQuantity: promo.buyQuantity,
          getQuantity: promo.getQuantity,
        }
      : undefined,
  }

  return {
    line,
    appliedPromotion: promo ? buildAppliedSnapshot(promo, discountAmount, freeUnits) : null,
  }
}

function quoteVialCaseLine(
  item: Pick<CartItem, 'slug' | 'quantity'>,
  record: VialCaseRecord,
  promos: SitePromoRecord[],
) {
  const quantity = Math.max(1, Math.floor(item.quantity))
  const unitPrice = record.priceAmount
  const lineSubtotal = money(unitPrice * quantity)
  const promoCandidates = promos
    .filter((promo) => promoMatchesVialCase(promo, record.id))
    .filter((promo) => promo.discountType === 'percentage' || promo.discountType === 'bogo')
    .map((promo) => {
      if (promo.discountType === 'percentage') {
        return {
          promo,
          freeUnits: 0,
          discountAmount: money(lineSubtotal * ((promo.discountPercent ?? 0) / 100)),
        }
      }

      const groupSize = promo.buyQuantity + promo.getQuantity
      const completedGroups = Math.floor(quantity / groupSize)
      const freeUnits = completedGroups * promo.getQuantity
      return {
        promo,
        freeUnits,
        discountAmount: money(freeUnits * unitPrice),
      }
    })
    .sort((a, b) => b.discountAmount - a.discountAmount)
  const winningPromo = promoCandidates[0]
  const promo = winningPromo?.promo
  const discountAmount = winningPromo?.discountAmount ?? 0
  const freeUnits = winningPromo?.freeUnits ?? 0

  const line: OrderDraftLine = {
    itemType: 'vial_case',
    sourceId: record.id,
    slug: record.id,
    sku: `CASE-${record.id}`,
    displayName: record.name,
    fullName: record.name,
    strengthLabel: '',
    formatType: 'Vial Case',
    quantity,
    unitPrice,
    lineSubtotal,
    discountAmount,
    lineTotal: money(lineSubtotal - discountAmount),
    freeUnits,
    imageUrl: record.imageUrl,
    appliedPromotion: promo
      ? {
          id: promo.id,
          title: promo.title,
          badgeLabel: promo.badgeLabel,
          discountType: promo.discountType,
          discountPercent: promo.discountPercent,
          buyQuantity: promo.buyQuantity,
          getQuantity: promo.getQuantity,
        }
      : undefined,
  }

  return {
    line,
    appliedPromotion: promo ? buildAppliedSnapshot(promo, discountAmount, freeUnits) : null,
  }
}

export function buildCheckoutQuote(args: {
  items: Array<Pick<CartItem, 'itemType' | 'slug' | 'quantity'> & Partial<Pick<CartItem, 'option'>>>
  catalog: CatalogInventoryRecord[]
  vialCases?: VialCaseRecord[]
  promos: SitePromoRecord[]
  settings: CheckoutOperationsSettings
  shippingPostalCode?: string | null
}): CheckoutQuote {
  const recordMap = new Map(args.catalog.map((record) => [record.slug, record]))
  const vialCaseMap = new Map((args.vialCases ?? []).map((record) => [record.id, record]))
  const errors: string[] = []
  const lines: OrderDraftLine[] = []
  const appliedPromotions: AppliedPromotionSnapshot[] = []
  const quantityByLine = new Map<string, { slug: string; itemType: CartItemType; quantity: number }>()

  for (const item of args.items) {
    const itemType = item.itemType ?? 'product'
    const quantity = Math.max(1, Math.floor(item.quantity))
    const key = getCartLineKey({ itemType, slug: item.slug, option: item.option ?? (itemType === 'vial_case' ? 'case' : 'vial') })
    const current = quantityByLine.get(key)
    quantityByLine.set(key, {
      slug: item.slug,
      itemType,
      quantity: (current?.quantity ?? 0) + quantity,
    })
  }

  for (const item of quantityByLine.values()) {
    if (item.itemType === 'vial_case') {
      const record = vialCaseMap.get(item.slug)
      if (!record || record.archived || !record.publicVisible) {
        errors.push(`${item.slug} is no longer available.`)
        continue
      }

      if (record.priceAmount <= 0) {
        errors.push(`${record.name} does not have a checkout price yet.`)
        continue
      }

      const result = quoteVialCaseLine(item, record, args.promos)
      lines.push(result.line)
      if (result.appliedPromotion) appliedPromotions.push(result.appliedPromotion)
      continue
    }

    const record = recordMap.get(item.slug)
    if (!record || record.archived || !record.publicVisible) {
      errors.push(`${item.slug} is no longer available.`)
      continue
    }

    if (
      record.status === 'out_of_stock' ||
      record.inventoryOnHand === 0 ||
      (record.inventoryOnHand !== null && record.inventoryOnHand < item.quantity)
    ) {
      errors.push(`${record.displayName} does not have enough stock for quantity ${item.quantity}.`)
      continue
    }

    const result = quoteLine(item, record, args.promos)
    lines.push(result.line)
    if (result.appliedPromotion) appliedPromotions.push(result.appliedPromotion)
  }

  const subtotal = money(lines.reduce((sum, line) => sum + line.lineSubtotal, 0))
  const merchandiseDiscount = money(lines.reduce((sum, line) => sum + (line.discountAmount ?? 0), 0))
  const discountedMerchandise = money(Math.max(0, subtotal - merchandiseDiscount))

  const freeShippingPromo = args.promos
    .filter((promo) => promo.discountType === 'free_shipping')
    .filter((promo) => lines.some((line) => {
      if ((line.itemType ?? 'product') === 'vial_case') {
        return promoMatchesVialCase(promo, line.sourceId ?? line.slug)
      }
      const record = recordMap.get(line.slug)
      return record ? promoMatchesProduct(promo, {
        slug: record.slug,
        displayName: record.displayName,
        variantGroup: record.variantGroup,
        category: record.collection,
        researchCategory: record.researchCategory,
      }) : false
    }))[0]

  const flatRate = settingNumber(args.settings.flatRate)
  const shouldUseFlatRate = args.settings.shippingMode === 'flat_rate'
  const localFreeShipping = isLocalFreeShippingZip({
    postalCode: args.shippingPostalCode,
    settings: args.settings,
  })
  const threshold = settingNumber(args.settings.freeShippingThreshold)
  const thresholdShipping =
    shouldUseFlatRate &&
    args.settings.freeShippingEnabled &&
    threshold > 0 &&
    subtotal >= threshold
  const freeShippingApplied = Boolean(freeShippingPromo || thresholdShipping || localFreeShipping)
  const shipping =
    shouldUseFlatRate && !freeShippingApplied
      ? flatRate
      : 0

  if (freeShippingPromo) {
    appliedPromotions.push(buildAppliedSnapshot(freeShippingPromo, money(flatRate), 0))
  }

  const taxRate = settingNumber(args.settings.taxRate)
  const taxableBase = discountedMerchandise + shipping
  const tax =
    args.settings.taxMode === 'collect_at_checkout' && taxRate > 0
      ? money((taxableBase * taxRate) / 100)
      : 0
  const total = money(discountedMerchandise + shipping + tax)

  return {
    errors,
    order: {
      orderId: 'Generated at submission',
      currency: 'USD',
      createdAt: new Date().toISOString(),
      compliance: {
        researchUseAcknowledged: true,
        ageGateAcknowledged: true,
      },
      lines,
      totals: {
        subtotal,
        shipping,
        tax,
        discount: merchandiseDiscount,
        total,
        itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
      },
      metadata: {
        source: 'flexmed_site',
        status: 'cart_draft',
        appliedPromotions,
        quotedAt: new Date().toISOString(),
      },
    },
  }
}
