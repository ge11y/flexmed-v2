import type { CheckoutOperationsSettings } from '@/lib/admin-settings'

export type CheckoutPricingSummary = {
  shipping: number
  tax: number
  discount: number
  total: number
  freeShippingApplied: boolean
}

function toNumberString(value: string | null | undefined) {
  if (!value) return 0
  const parsed = Number(String(value).replace(/[^0-9.]/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

export function calculateCheckoutPricing(
  subtotal: number,
  settings: CheckoutOperationsSettings,
): CheckoutPricingSummary {
  const freeShippingThreshold = toNumberString(settings.freeShippingThreshold)
  const flatRate = toNumberString(settings.flatRate)
  const taxRate = toNumberString(settings.taxRate)
  const shouldUseFlatRate = settings.shippingMode === 'flat_rate'

  const freeShippingApplied =
    shouldUseFlatRate &&
    settings.freeShippingEnabled &&
    freeShippingThreshold > 0 &&
    subtotal >= freeShippingThreshold

  const shipping =
    shouldUseFlatRate
      ? freeShippingApplied
        ? 0
        : flatRate
      : 0

  const taxableBase = subtotal + shipping
  const tax =
    settings.taxMode === 'collect_at_checkout' && taxRate > 0
      ? Number(((taxableBase * taxRate) / 100).toFixed(2))
      : 0

  const total = subtotal + shipping + tax

  return {
    shipping,
    tax,
    discount: 0,
    total,
    freeShippingApplied,
  }
}

export function getCheckoutPricingLabel(settings: CheckoutOperationsSettings) {
  if (settings.shippingMode === 'manual_review') return 'Manual review'
  if (settings.shippingMode === 'tiered_placeholder') return 'Tiered placeholder'
  return 'Flat rate'
}
