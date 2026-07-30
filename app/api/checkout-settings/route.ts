import { NextResponse } from 'next/server'
import { getAdminSettings } from '@/lib/admin-settings'

export async function GET() {
  const settings = await getAdminSettings()
  return NextResponse.json({
    ok: true,
    checkoutOperations: settings.checkoutOperations,
    businessDetails: settings.businessDetails,
  })
}
