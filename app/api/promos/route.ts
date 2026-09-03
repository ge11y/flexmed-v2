import { NextResponse } from 'next/server'
import { getLiveCatalogProducts } from '@/lib/catalog-live'
import { buildPromoDisplayCopy } from '@/lib/promo-display'
import { getStorefrontPromos, getStorefrontVialCases } from '@/lib/storefront-data'

export async function GET() {
  const [promos, products, vialCases] = await Promise.all([
    getStorefrontPromos(),
    getLiveCatalogProducts(),
    getStorefrontVialCases(),
  ])
  const displayPromos = promos.map((promo) => ({
    ...promo,
    ...buildPromoDisplayCopy(promo, { products, vialCases }),
  }))

  return NextResponse.json({ ok: true, promos: displayPromos })
}
