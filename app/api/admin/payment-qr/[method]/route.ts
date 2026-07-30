import { NextResponse } from 'next/server'
import { getAdminSettings, saveAdminSettings } from '@/lib/admin-settings'
import { ensurePaymentQrBucket, getPaymentQrProxyUrl, getPaymentQrStoragePath, isPaymentQrMethod, PAYMENT_QR_BUCKET } from '@/lib/payment-qr-assets'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

interface Context {
  params: Promise<{ method: string }>
}

export async function POST(request: Request, context: Context) {
  const { method } = await context.params
  if (!isPaymentQrMethod(method)) return NextResponse.json({ ok: false, error: 'Unsupported payment method.' }, { status: 400 })

  const supabase = getSupabaseAdmin()
  if (!supabase) return NextResponse.json({ ok: false, error: 'Supabase is not configured.' }, { status: 503 })

  const file = (await request.formData()).get('file')
  if (!(file instanceof File)) return NextResponse.json({ ok: false, error: 'Choose a QR image first.' }, { status: 400 })
  const extension = file.name.split('.').pop()?.toLowerCase()
  const contentType = file.type || ({ png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp' } as Record<string, string>)[extension ?? '']
  if (!contentType || !['image/png', 'image/jpeg', 'image/webp'].includes(contentType)) {
    return NextResponse.json({ ok: false, error: 'Use a PNG, JPG, JPEG, or WEBP image.' }, { status: 400 })
  }

  try {
    await ensurePaymentQrBucket()
    const { error: uploadError } = await supabase.storage.from(PAYMENT_QR_BUCKET).upload(getPaymentQrStoragePath(method), file, {
      upsert: true,
      contentType,
    })
    if (uploadError) return NextResponse.json({ ok: false, error: 'QR upload failed.', detail: uploadError.message }, { status: 502 })

    const settings = await getAdminSettings()
    const updatedAt = new Date().toISOString()
    const nextSettings = {
      ...settings,
      businessDetails: {
        ...settings.businessDetails,
        paymentMethods: settings.businessDetails.paymentMethods.map((entry) =>
          entry.method === method ? { ...entry, qrImageUrl: getPaymentQrProxyUrl(method, updatedAt) } : entry,
        ),
      },
    }
    const result = await saveAdminSettings(nextSettings)
    if (!result.ok) return NextResponse.json({ ok: false, error: 'QR uploaded but settings could not be saved.', detail: result.error }, { status: 502 })
    return NextResponse.json({ ok: true, imageUrl: getPaymentQrProxyUrl(method, updatedAt) })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: 'QR upload could not be completed.', detail: error instanceof Error ? error.message : 'Unknown storage error.' },
      { status: 502 },
    )
  }
}
