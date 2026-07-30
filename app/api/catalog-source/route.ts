import { NextResponse } from 'next/server'
import { getAdminCatalogInventoryRecords } from '@/lib/catalog-live'

export async function GET() {
  const records = await getAdminCatalogInventoryRecords()
  return NextResponse.json({ ok: true, records })
}
