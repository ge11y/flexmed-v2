import { NextResponse } from 'next/server'
import { getStorefrontVialCases } from '@/lib/storefront-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  const cases = await getStorefrontVialCases()
  return NextResponse.json({ ok: true, cases })
}
