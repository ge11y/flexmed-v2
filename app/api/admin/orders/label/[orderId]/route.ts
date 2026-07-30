import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { getOrderLabelObjectName, ORDER_LABEL_BUCKET } from '@/lib/order-label-assets'

function getContentTypeForObjectName(objectName: string, fallback?: string) {
  const normalized = objectName.toLowerCase()
  if (normalized.endsWith('.pdf')) return 'application/pdf'
  if (normalized.endsWith('.png')) return 'image/png'
  if (normalized.endsWith('.jpg') || normalized.endsWith('.jpeg')) return 'image/jpeg'
  if (normalized.endsWith('.webp')) return 'image/webp'
  return fallback || 'application/octet-stream'
}

export async function GET(_: Request, context: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await context.params
  const supabase = getSupabaseAdmin()
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Supabase is not configured.' }, { status: 503 })
  }

  const objectName = await getOrderLabelObjectName(orderId)
  if (!objectName) {
    return NextResponse.json({ ok: false, error: 'No label file found for this order.' }, { status: 404 })
  }

  const { data, error } = await supabase.storage.from(ORDER_LABEL_BUCKET).download(`${orderId}/${objectName}`)
  if (error || !data) {
    return NextResponse.json(
      {
        ok: false,
        error: 'The saved label file could not be loaded.',
        detail: error?.message,
      },
      { status: 404 },
    )
  }

  return new NextResponse(data, {
    status: 200,
    headers: {
      'Content-Type': getContentTypeForObjectName(objectName, data.type),
      'Cache-Control': 'no-store',
      'Content-Disposition': `inline; filename="${objectName}"`,
    },
  })
}
