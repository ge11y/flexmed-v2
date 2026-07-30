import { PRODUCTS } from '@/lib/data-products'

export const CART_STORAGE_KEY = 'flexmed_cart_v1'

export type CartItemType = 'product' | 'vial_case'
export type CartPurchaseOption = 'vial' | 'case'

export interface CartItem {
  itemType?: CartItemType
  slug: string
  sourceId?: string
  displayName: string
  strengthLabel?: string
  option: CartPurchaseOption
  optionLabel: string
  price: string
  quantity: number
  imageUrl?: string
}

export interface OrderDraftLine {
  itemType?: CartItemType
  sourceId?: string
  slug: string
  sku: string
  displayName: string
  fullName: string
  strengthLabel: string
  formatType: string
  quantity: number
  unitPrice: number
  lineSubtotal: number
  discountAmount?: number
  lineTotal?: number
  freeUnits?: number
  imageUrl?: string
  appliedPromotion?: {
    id: string
    title: string
    badgeLabel: string
    discountType: 'percentage' | 'bogo' | 'free_shipping' | 'announcement'
    discountPercent: number | null
    buyQuantity?: number
    getQuantity?: number
  }
}

export interface OrderDraftTotals {
  subtotal: number
  shipping: number
  tax: number
  discount: number
  total: number
  itemCount: number
}

export interface OrderDraft {
  orderId: string
  currency: 'USD'
  createdAt: string
  compliance: {
    researchUseAcknowledged: boolean
    ageGateAcknowledged: boolean
  }
  lines: OrderDraftLine[]
  totals: OrderDraftTotals
  metadata: {
    source: 'flexmed_site'
    status: 'cart_draft'
    appliedPromotions?: Array<{
      id: string
      title: string
      badgeLabel: string
      discountType: 'percentage' | 'bogo' | 'free_shipping' | 'announcement'
      discountPercent: number | null
      discountAmount: number
      freeUnits: number
    }>
    affiliate?: {
      id?: string
      code: string
      name?: string
      source?: 'link' | 'code'
      landingPath?: string
    }
    shippingOverride?: {
      disabledByAdmin: boolean
      originalShipping: number
      updatedAt: string
      reason?: string
    }
    quotedAt?: string
  }
}

export interface OrderDraftPricing {
  shipping?: number
  tax?: number
  discount?: number
}

export interface OrderSpreadsheetRow {
  orderId: string
  createdAt: string
  product: string
  fullName: string
  slug: string
  strength: string
  format: string
  quantity: number
  unitPrice: number
  lineSubtotal: number
  orderSubtotal: number
  orderTotal: number
  currency: 'USD'
  status: 'cart_draft'
}

export function parseCurrency(value?: string | null) {
  if (!value) return null
  const numeric = Number(value.replace(/[^0-9.]/g, ''))
  return Number.isFinite(numeric) ? numeric : null
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value)
}

export function getCartItemCount(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.quantity, 0)
}

export function getCartSubtotal(items: CartItem[]) {
  return items.reduce((sum, item) => {
    const unitPrice = parseCurrency(item.price)
    return sum + (unitPrice ?? 0) * item.quantity
  }, 0)
}

export function getCartLineKey(item: Pick<CartItem, 'itemType' | 'slug' | 'option'>) {
  return `${item.itemType ?? 'product'}:${item.slug}:${item.option}`
}

function getStrengthLabel(slug: string) {
  const product = PRODUCTS[slug]
  if (!product) return ''
  return `${product.strength} ${product.unit}`.trim()
}

export function buildOrderDraft(items: CartItem[], pricing: OrderDraftPricing = {}): OrderDraft {
  const subtotal = getCartSubtotal(items)
  const lines: OrderDraftLine[] = items.map((item) => {
    const itemType = item.itemType ?? 'product'
    const product = itemType === 'product' ? PRODUCTS[item.slug] : undefined
    const unitPrice = parseCurrency(item.price) ?? 0

    return {
      itemType,
      sourceId: item.sourceId ?? item.slug,
      slug: item.slug,
      sku: itemType === 'product' ? item.slug.toUpperCase() : `CASE-${item.slug}`,
      displayName: item.displayName,
      fullName: product?.fullName ?? item.displayName,
      strengthLabel: item.strengthLabel ?? (itemType === 'product' ? getStrengthLabel(item.slug) : ''),
      formatType: product?.formatType ?? item.optionLabel,
      quantity: item.quantity,
      unitPrice,
      lineSubtotal: unitPrice * item.quantity,
      imageUrl: item.imageUrl,
    }
  })

  const shipping = pricing.shipping ?? 0
  const tax = pricing.tax ?? 0
  const discount = pricing.discount ?? 0

  return {
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
      discount,
      total: subtotal + shipping + tax - discount,
      itemCount: getCartItemCount(items),
    },
    metadata: {
      source: 'flexmed_site',
      status: 'cart_draft',
    },
  }
}

export function buildOrderSpreadsheetRows(order: OrderDraft): OrderSpreadsheetRow[] {
  return order.lines.map((line) => ({
    orderId: order.orderId,
    createdAt: order.createdAt,
    product: line.displayName,
    fullName: line.fullName,
    slug: line.slug,
    strength: line.strengthLabel,
    format: line.formatType,
    quantity: line.quantity,
    unitPrice: line.unitPrice,
    lineSubtotal: line.lineSubtotal,
    orderSubtotal: order.totals.subtotal,
    orderTotal: order.totals.total,
    currency: order.currency,
    status: order.metadata.status,
  }))
}
