import { NextResponse } from 'next/server'
import { STOREFRONT_CACHE_TAGS, expireStorefrontCache } from '@/lib/storefront-cache'
import { CATALOG_COA_BUCKET, ensureCatalogBucket, getCatalogCoAObjectNames, getNextCoAPageNumber } from '@/lib/catalog-assets'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

interface Context {
  params: Promise<{ slug: string }>
}

const SUPPORTED_COA_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp']

function getCoAObjectName(fileName: string, pageNumber: number) {
  const extension = fileName.split('.').pop()?.trim().toLowerCase()
  return `page-${String(pageNumber).padStart(2, '0')}${extension ? `.${extension}` : ''}`
}

export async function POST(request: Request, context: Context) {
  const { slug } = await context.params
  const supabase = getSupabaseAdmin()
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Supabase is not configured.' }, { status: 503 })
  }

  const contentType = request.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    const payload = (await request.json()) as {
      mode?: 'prepare_signed_uploads' | 'finalize_signed_uploads'
      files?: Array<{ name?: string; type?: string }>
      uploadedCount?: number
    }

    if (payload.mode === 'prepare_signed_uploads') {
      const files = Array.isArray(payload.files) ? payload.files : []
      if (files.length === 0) {
        return NextResponse.json({ ok: false, error: 'COA upload is missing a file.' }, { status: 400 })
      }

      const unsupportedFile = files.find((file) => !SUPPORTED_COA_TYPES.includes(file.type ?? ''))
      if (unsupportedFile) {
        return NextResponse.json(
          {
            ok: false,
            error: 'Unsupported CoA file type.',
            detail: `${unsupportedFile.name || 'Selected file'} uses ${unsupportedFile.type || 'an unknown file type'}. Use PDF, PNG, JPG, JPEG, or WEBP.`,
          },
          { status: 400 },
        )
      }

      await ensureCatalogBucket(CATALOG_COA_BUCKET, {
        public: false,
        allowedMimeTypes: SUPPORTED_COA_TYPES,
      })

      const existingObjectNames = await getCatalogCoAObjectNames(slug)
      const nextPageNumber = getNextCoAPageNumber(existingObjectNames)
      const uploads = []

      for (const [index, file] of files.entries()) {
        const objectName = getCoAObjectName(file.name || `page-${index + 1}.pdf`, nextPageNumber + index)
        const path = `${slug}/${objectName}`
        const { data, error } = await supabase.storage.from(CATALOG_COA_BUCKET).createSignedUploadUrl(path, {
          upsert: true,
        })
        if (error || !data) {
          return NextResponse.json(
            {
              ok: false,
              error: 'Could not prepare CoA upload.',
              detail: `${file.name || objectName}: ${error?.message || 'Signed upload URL was not created.'}`,
            },
            { status: 502 },
          )
        }

        uploads.push({
          fileName: file.name || objectName,
          objectName,
          path: data.path,
          token: data.token,
        })
      }

      expireStorefrontCache(STOREFRONT_CACHE_TAGS.catalog)
      return NextResponse.json({ ok: true, uploads })
    }

    if (payload.mode === 'finalize_signed_uploads') {
      await supabase
        .from('catalog_products')
        .update({
          coa_url: `/coa/${slug}`,
          coa_source: 'uploaded',
          updated_at: new Date().toISOString(),
        })
        .eq('slug', slug)

      expireStorefrontCache(STOREFRONT_CACHE_TAGS.catalog)
      return NextResponse.json({ ok: true, uploadedCount: payload.uploadedCount ?? 0 })
    }

    return NextResponse.json({ ok: false, error: 'Unsupported CoA upload request.' }, { status: 400 })
  }

  const formData = await request.formData()
  const files = [...formData.getAll('files'), formData.get('file')].filter((entry): entry is File => entry instanceof File)
  if (files.length === 0) {
    return NextResponse.json({ ok: false, error: 'COA upload is missing a file.' }, { status: 400 })
  }

  await ensureCatalogBucket(CATALOG_COA_BUCKET, {
    public: false,
    allowedMimeTypes: SUPPORTED_COA_TYPES,
  })

  const existingObjectNames = await getCatalogCoAObjectNames(slug)
  const nextPageNumber = getNextCoAPageNumber(existingObjectNames)

  for (const [index, file] of files.entries()) {
    if (!SUPPORTED_COA_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Unsupported CoA file type.',
          detail: `${file.name || 'Selected file'} uses ${file.type || 'an unknown file type'}. Use PDF, PNG, JPG, JPEG, or WEBP.`,
        },
        { status: 400 },
      )
    }

    const pageNumber = nextPageNumber + index
    const objectName = getCoAObjectName(file.name, pageNumber)
    const { error } = await supabase.storage.from(CATALOG_COA_BUCKET).upload(`${slug}/${objectName}`, file, {
      upsert: true,
      contentType: file.type || 'application/octet-stream',
    })

    if (error) {
      return NextResponse.json(
        { ok: false, error: 'COA upload failed.', detail: `${file.name || objectName}: ${error.message}` },
        { status: 502 },
      )
    }
  }

  await supabase
    .from('catalog_products')
    .update({
      coa_url: `/coa/${slug}`,
      coa_source: 'uploaded',
      updated_at: new Date().toISOString(),
    })
    .eq('slug', slug)

  expireStorefrontCache(STOREFRONT_CACHE_TAGS.catalog)
  return NextResponse.json({ ok: true, uploadedCount: files.length })
}

export async function DELETE(_request: Request, context: Context) {
  const { slug } = await context.params
  const supabase = getSupabaseAdmin()
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Supabase is not configured.' }, { status: 503 })
  }

  const existingObjectNames = await getCatalogCoAObjectNames(slug)
  if (existingObjectNames.length === 0) {
    await supabase
      .from('catalog_products')
      .update({
        coa_url: null,
        coa_source: 'none',
        updated_at: new Date().toISOString(),
      })
      .eq('slug', slug)

    expireStorefrontCache(STOREFRONT_CACHE_TAGS.catalog)
    return NextResponse.json({ ok: true })
  }

  const { error } = await supabase.storage.from(CATALOG_COA_BUCKET).remove(existingObjectNames.map((name) => `${slug}/${name}`))
  if (error) {
    return NextResponse.json({ ok: false, error: 'COA removal failed.', detail: error.message }, { status: 502 })
  }

  await supabase
    .from('catalog_products')
    .update({
      coa_url: null,
      coa_source: 'none',
      updated_at: new Date().toISOString(),
    })
    .eq('slug', slug)

  expireStorefrontCache(STOREFRONT_CACHE_TAGS.catalog)
  return NextResponse.json({ ok: true })
}
