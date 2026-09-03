import { NextResponse } from 'next/server'
import { getAdminSettings } from '@/lib/admin-settings'
import { getLiveCatalogInventoryRecords } from '@/lib/catalog-live'
import type { CartItem } from '@/lib/cart'
import { buildCheckoutQuote } from '@/lib/promo-pricing'
import { getActiveSitePromos } from '@/lib/site-promos'
import { getPublicVialCases } from '@/lib/vial-cases'

function isItems(value: unknown): value is Array<Pick<CartItem, 'itemType' | 'slug' | 'quantity' | 'option'>> {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        item &&
        typeof item === 'object' &&
        typeof (item as Record<string, unknown>).slug === 'string' &&
        typeof (item as Record<string, unknown>).quantity === 'number' &&
        (
          (item as Record<string, unknown>).itemType === undefined ||
          (item as Record<string, unknown>).itemType === 'product' ||
          (item as Record<string, unknown>).itemType === 'vial_case'
        ),
    )
  )
}

export async function POST(request: Request) {
  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid quote request.' }, { status: 400 })
  }

  const items = (payload as { items?: unknown })?.items
  const shippingPostalCode =
    typeof (payload as { shippingPostalCode?: unknown })?.shippingPostalCode === 'string'
      ? (payload as { shippingPostalCode: string }).shippingPostalCode
      : undefined
  if (!isItems(items)) {
    return NextResponse.json({ ok: false, error: 'Quote items are invalid.' }, { status: 400 })
  }

  const [catalog, vialCases, promos, settings] = await Promise.all([
    getLiveCatalogInventoryRecords('fresh'),
    getPublicVialCases(),
    getActiveSitePromos(),
    getAdminSettings(),
  ])
  const quote = buildCheckoutQuote({
    items,
    catalog,
    vialCases,
    promos,
    settings: settings.checkoutOperations,
    shippingPostalCode,
  })

  return NextResponse.json({
    ok: quote.errors.length === 0,
    quote: quote.order,
    errors: quote.errors,
  }, { status: quote.errors.length === 0 ? 200 : 409 })
}
