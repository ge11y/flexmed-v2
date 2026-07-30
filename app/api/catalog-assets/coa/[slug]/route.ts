import { NextResponse } from 'next/server'
import { CATALOG_COA_BUCKET, getCatalogCoAObjectName, getCatalogCoAObjectNames } from '@/lib/catalog-assets'
import { hasPublishedCoA } from '@/lib/data-testing'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

interface Context {
  params: Promise<{ slug: string }>
}

export async function GET(request: Request, context: Context) {
  const { slug } = await context.params
  const supabase = getSupabaseAdmin()
  const fallback = hasPublishedCoA(slug) ? `/coa/${slug}` : null
  const requestedFile = new URL(request.url).searchParams.get('file')

  if (!supabase) {
    if (fallback) return NextResponse.redirect(new URL(fallback, request.url))
    return NextResponse.json({ ok: false, error: 'COA not found.' }, { status: 404 })
  }

  const availableObjectNames = await getCatalogCoAObjectNames(slug)
  const objectName =
    requestedFile && availableObjectNames.includes(requestedFile)
      ? requestedFile
      : (await getCatalogCoAObjectName(slug))
  if (!objectName) {
    if (fallback) return NextResponse.redirect(new URL(fallback, request.url))
    return NextResponse.json({ ok: false, error: 'COA not found.' }, { status: 404 })
  }

  const { data, error } = await supabase.storage.from(CATALOG_COA_BUCKET).download(`${slug}/${objectName.split('/').pop()}`)
  if (error || !data) {
    if (fallback) return NextResponse.redirect(new URL(fallback, request.url))
    return NextResponse.json({ ok: false, error: 'COA not found.' }, { status: 404 })
  }

  const extension = objectName.split('.').pop()?.toLowerCase()
  const downloadName =
    extension && extension !== 'coa'
      ? `${slug}-coa.${extension}`
      : data.type === 'image/png'
        ? `${slug}-coa.png`
        : data.type === 'image/jpeg'
          ? `${slug}-coa.jpg`
          : data.type === 'image/webp'
            ? `${slug}-coa.webp`
            : `${slug}-coa.pdf`

  return new NextResponse(await data.arrayBuffer(), {
    headers: {
      'Content-Type': data.type || 'application/octet-stream',
      'Content-Disposition': `inline; filename="${downloadName}"`,
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
