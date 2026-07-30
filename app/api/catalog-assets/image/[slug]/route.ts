import { NextResponse } from 'next/server'
import { CATALOG_IMAGE_BUCKET, getCatalogImageStoragePath } from '@/lib/catalog-assets'
import { PRODUCTS, getProductImageSrc } from '@/lib/data-products'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

interface Context {
  params: Promise<{ slug: string }>
}

function getImageContentType(bytes: ArrayBuffer, fallback?: string) {
  const header = Buffer.from(bytes).subarray(0, 12)
  if (header.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png'
  if (header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff) return 'image/jpeg'
  if (header.subarray(0, 4).toString('ascii') === 'RIFF' && header.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp'
  return fallback && fallback.startsWith('image/') ? fallback : 'image/png'
}

export async function GET(request: Request, context: Context) {
  const { slug } = await context.params
  const supabase = getSupabaseAdmin()
  const fallback = PRODUCTS[slug] ? getProductImageSrc(PRODUCTS[slug]) : '/products/front.png'

  if (!supabase) {
    return NextResponse.redirect(new URL(fallback, request.url))
  }

  const { data, error } = await supabase.storage.from(CATALOG_IMAGE_BUCKET).download(getCatalogImageStoragePath(slug))
  if (error || !data) {
    return NextResponse.redirect(new URL(fallback, request.url))
  }

  const bytes = await data.arrayBuffer()

  return new NextResponse(bytes, {
    headers: {
      'Content-Type': getImageContentType(bytes, data.type),
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
