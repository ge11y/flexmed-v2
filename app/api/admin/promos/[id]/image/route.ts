import { NextResponse } from 'next/server'
import { ensurePromoImageBucket, getPromoImageProxyUrl, getPromoImageStoragePath, PROMO_IMAGE_BUCKET } from '@/lib/promo-assets'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

interface Context {
  params: Promise<{ id: string }>
}

function isMissingColumnError(error: { message?: string; code?: string } | null | undefined) {
  if (!error) return false
  const message = error.message ?? ''
  return error.code === 'PGRST204' || /Could not find the .* column|schema cache/i.test(message)
}

export async function POST(request: Request, context: Context) {
  const { id } = await context.params
  const supabase = getSupabaseAdmin()
  if (!supabase) return NextResponse.json({ ok: false, error: 'Supabase is not configured.' }, { status: 503 })

  const formData = await request.formData()
  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: 'Popup image upload is missing a file.' }, { status: 400 })
  }

  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
    return NextResponse.json({ ok: false, error: 'Use a PNG, JPG, JPEG, or WEBP image for promo popups.' }, { status: 400 })
  }

  await ensurePromoImageBucket()

  const { error: uploadError } = await supabase.storage
    .from(PROMO_IMAGE_BUCKET)
    .upload(getPromoImageStoragePath(id), file, {
      upsert: true,
      contentType: file.type,
    })

  if (uploadError) {
    return NextResponse.json({ ok: false, error: 'Popup image upload failed.', detail: uploadError.message }, { status: 502 })
  }

  const updatedAt = new Date().toISOString()
  const imageUrl = getPromoImageProxyUrl(id, updatedAt)
  const { error: updateError } = await supabase
    .from('site_promos')
    .update({
      popup_image_url: imageUrl,
      updated_at: updatedAt,
    })
    .eq('id', id)

  if (isMissingColumnError(updateError)) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Promo image setup is not finished in Supabase. Run docs/supabase-promo-v1.sql in the Supabase SQL Editor, then try again.',
        detail: updateError?.message,
      },
      { status: 502 },
    )
  }
  if (updateError) return NextResponse.json({ ok: false, error: updateError.message }, { status: 502 })

  return NextResponse.json({ ok: true, imageUrl })
}

export async function DELETE(_request: Request, context: Context) {
  const { id } = await context.params
  const supabase = getSupabaseAdmin()
  if (!supabase) return NextResponse.json({ ok: false, error: 'Supabase is not configured.' }, { status: 503 })

  await supabase.storage.from(PROMO_IMAGE_BUCKET).remove([getPromoImageStoragePath(id)])

  const { error } = await supabase
    .from('site_promos')
    .update({
      popup_image_url: '',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (isMissingColumnError(error)) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Promo image setup is not finished in Supabase. Run docs/supabase-promo-v1.sql in the Supabase SQL Editor, then try again.',
        detail: error?.message,
      },
      { status: 502 },
    )
  }
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 502 })

  return NextResponse.json({ ok: true })
}
