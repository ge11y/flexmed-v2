import { NextResponse } from 'next/server'
import { getVialCaseImageStoragePath, VIAL_CASE_IMAGE_BUCKET } from '@/lib/vial-case-assets'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

interface Context {
  params: Promise<{ id: string }>
}

function normalizeImageId(value: string | null) {
  return String(value || 'front')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'front'
}

function missingImageResponse() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900" role="img" aria-label="Vial case image pending"><rect width="1200" height="900" fill="#f5f8ff"/><rect x="330" y="255" width="540" height="390" rx="28" fill="#ffffff" stroke="#d7e3f7" stroke-width="6"/><path d="M460 530h280M460 590h180" stroke="#91a4c7" stroke-width="22" stroke-linecap="round"/><circle cx="742" cy="372" r="54" fill="#dcecff"/><path d="M392 645l210-210 116 116 88-88 118 182" fill="none" stroke="#63c9d4" stroke-width="26" stroke-linecap="round" stroke-linejoin="round"/><text x="600" y="735" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" font-weight="700" fill="#52627e">Image pending</text></svg>`
  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=300',
    },
  })
}

export async function GET(request: Request, context: Context) {
  const { id } = await context.params
  const supabase = getSupabaseAdmin()
  if (!supabase) return missingImageResponse()

  const imageId = normalizeImageId(new URL(request.url).searchParams.get('image'))
  const { data, error } = await supabase.storage.from(VIAL_CASE_IMAGE_BUCKET).download(getVialCaseImageStoragePath(id, imageId))
  if (error || !data) return missingImageResponse()

  return new NextResponse(await data.arrayBuffer(), {
    headers: {
      'Content-Type': data.type || 'application/octet-stream',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
