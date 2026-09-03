import { NextResponse } from 'next/server'
import { STOREFRONT_CACHE_TAGS, expireStorefrontCache } from '@/lib/storefront-cache'
import { CATALOG_IMAGE_BUCKET, ensureCatalogBucket, getCatalogImageProxyUrl, getCatalogImageStoragePath } from '@/lib/catalog-assets'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

interface Context {
  params: Promise<{ slug: string }>
}

export async function POST(request: Request, context: Context) {
  const { slug } = await context.params
  const supabase = getSupabaseAdmin()
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Supabase is not configured.' }, { status: 503 })
  }

  const formData = await request.formData()
  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: 'Image upload is missing a file.' }, { status: 400 })
  }

  await ensureCatalogBucket(CATALOG_IMAGE_BUCKET, {
    public: false,
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
  })

  const { error } = await supabase.storage.from(CATALOG_IMAGE_BUCKET).upload(getCatalogImageStoragePath(slug), file, {
    upsert: true,
    contentType: file.type || 'application/octet-stream',
  })

  if (error) {
    return NextResponse.json({ ok: false, error: 'Image upload failed.', detail: error.message }, { status: 502 })
  }

  const updatedAt = new Date().toISOString()

  await supabase
    .from('catalog_products')
    .update({
      image_url: getCatalogImageProxyUrl(slug, updatedAt),
      image_source: 'uploaded',
      updated_at: updatedAt,
    })
    .eq('slug', slug)

  expireStorefrontCache(STOREFRONT_CACHE_TAGS.catalog)
  return NextResponse.json({ ok: true })
}

export async function DELETE(_request: Request, context: Context) {
  const { slug } = await context.params
  const supabase = getSupabaseAdmin()
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Supabase is not configured.' }, { status: 503 })
  }

  const { error } = await supabase.storage.from(CATALOG_IMAGE_BUCKET).remove([getCatalogImageStoragePath(slug)])
  if (error) {
    return NextResponse.json({ ok: false, error: 'Image removal failed.', detail: error.message }, { status: 502 })
  }

  await supabase
    .from('catalog_products')
    .update({
      image_url: '/products/front.png',
      image_source: 'placeholder',
      updated_at: new Date().toISOString(),
    })
    .eq('slug', slug)

  expireStorefrontCache(STOREFRONT_CACHE_TAGS.catalog)
  return NextResponse.json({ ok: true })
}
