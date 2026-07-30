import { NextResponse } from 'next/server'
import { getPromoImageStoragePath, PROMO_IMAGE_BUCKET } from '@/lib/promo-assets'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

interface Context {
  params: Promise<{ id: string }>
}

function missingImageResponse() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="720" viewBox="0 0 1200 720" role="img" aria-label="Promotion image pending"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#112c5c"/><stop offset="1" stop-color="#0f7678"/></linearGradient></defs><rect width="1200" height="720" fill="url(#g)"/><circle cx="965" cy="145" r="170" fill="#63c9d4" opacity=".18"/><circle cx="210" cy="600" r="230" fill="#f2b84b" opacity=".14"/><text x="600" y="368" text-anchor="middle" font-family="Arial, sans-serif" font-size="42" font-weight="700" fill="#ffffff">Promotion image</text></svg>`
  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=300',
    },
  })
}

export async function GET(_request: Request, context: Context) {
  const { id } = await context.params
  const supabase = getSupabaseAdmin()
  if (!supabase) return missingImageResponse()

  const { data, error } = await supabase.storage.from(PROMO_IMAGE_BUCKET).download(getPromoImageStoragePath(id))
  if (error || !data) return missingImageResponse()

  return new NextResponse(await data.arrayBuffer(), {
    headers: {
      'Content-Type': data.type || 'application/octet-stream',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
