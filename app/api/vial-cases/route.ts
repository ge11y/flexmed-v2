import { NextResponse } from 'next/server'
import { getPublicVialCases } from '@/lib/vial-cases'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  const cases = await getPublicVialCases()
  return NextResponse.json({ ok: true, cases })
}
