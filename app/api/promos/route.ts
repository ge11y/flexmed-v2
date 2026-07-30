import { NextResponse } from 'next/server'
import { getLiveCatalogProducts } from '@/lib/catalog-live'
import { buildPromoDisplayCopy } from '@/lib/promo-display'
import { getActiveSitePromos } from '@/lib/site-promos'
import { getPublicVialCases } from '@/lib/vial-cases'

export async function GET() {
  const [promos, products, vialCases] = await Promise.all([
    getActiveSitePromos(),
    getLiveCatalogProducts(),
    getPublicVialCases(),
  ])
  const displayPromos = promos.map((promo) => ({
    ...promo,
    ...buildPromoDisplayCopy(promo, { products, vialCases }),
  }))

  return NextResponse.json({ ok: true, promos: displayPromos })
}
