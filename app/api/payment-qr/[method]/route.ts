import { NextResponse } from 'next/server'
import { getPaymentQrStoragePath, isPaymentQrMethod, PAYMENT_QR_BUCKET } from '@/lib/payment-qr-assets'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

interface Context {
  params: Promise<{ method: string }>
}

export async function GET(_request: Request, context: Context) {
  const { method } = await context.params
  if (!isPaymentQrMethod(method)) return NextResponse.json({ ok: false, error: 'Unsupported payment method.' }, { status: 404 })

  const supabase = getSupabaseAdmin()
  if (!supabase) return NextResponse.json({ ok: false, error: 'Supabase is not configured.' }, { status: 503 })

  const { data, error } = await supabase.storage.from(PAYMENT_QR_BUCKET).download(getPaymentQrStoragePath(method))
  if (error || !data) return NextResponse.json({ ok: false, error: 'QR image not found.' }, { status: 404 })

  return new NextResponse(data, {
    headers: {
      'Content-Type': data.type || 'image/png',
      'Cache-Control': 'no-store',
    },
  })
}
