import { NextResponse } from 'next/server'
import { STOREFRONT_CACHE_TAGS, expireStorefrontCache } from '@/lib/storefront-cache'
import { ensureVialCaseImageBucket, getVialCaseImageProxyUrl, getVialCaseImageStoragePath, VIAL_CASE_IMAGE_BUCKET } from '@/lib/vial-case-assets'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import type { VialCaseImage } from '@/lib/vial-cases'

interface Context {
  params: Promise<{ id: string }>
}

function normalizeImageId(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

function normalizeGallery(value: unknown): VialCaseImage[] {
  if (!Array.isArray(value)) return []
  const images: VialCaseImage[] = []
  value.forEach((entry, index) => {
    if (!entry || typeof entry !== 'object') return
    const record = entry as Record<string, unknown>
    const id = typeof record.id === 'string' ? record.id.trim() : ''
    const url = typeof record.url === 'string' ? record.url.trim() : ''
    if (!id || !url) return
    images.push({
      id,
      url,
      label: typeof record.label === 'string' ? record.label : undefined,
      isPrimary: Boolean(record.isPrimary),
      sortOrder: typeof record.sortOrder === 'number' ? record.sortOrder : index,
      uploadedAt: typeof record.uploadedAt === 'string' ? record.uploadedAt : undefined,
    })
  })
  return images.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
}

function normalizeGalleryWithFallback(value: unknown, fallbackUrl?: string | null): VialCaseImage[] {
  const images = normalizeGallery(value)
  if (images.length > 0) return images
  return fallbackUrl
    ? [
        {
          id: 'front',
          url: fallbackUrl,
          label: 'Front',
          isPrimary: true,
          sortOrder: 0,
        },
      ]
    : []
}

function normalizePrimaryGallery(images: VialCaseImage[], primaryId?: string) {
  if (images.length === 0) return []
  const targetPrimaryId = primaryId ?? images.find((image) => image.isPrimary)?.id ?? images[0].id
  return images.map((image, index) => ({
    ...image,
    isPrimary: image.id === targetPrimaryId,
    sortOrder: index,
  }))
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
    return NextResponse.json({ ok: false, error: 'Image upload is missing a file.' }, { status: 400 })
  }

  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
    return NextResponse.json({ ok: false, error: 'Use a PNG, JPG, JPEG, or WEBP image for vial cases.' }, { status: 400 })
  }

  await ensureVialCaseImageBucket()

  const requestedImageId = typeof formData.get('imageId') === 'string' ? String(formData.get('imageId')) : ''
  const imageId = normalizeImageId(requestedImageId) || crypto.randomUUID()
  const shouldMakePrimary = formData.get('makePrimary') === 'true'

  const { error } = await supabase.storage.from(VIAL_CASE_IMAGE_BUCKET).upload(getVialCaseImageStoragePath(id, imageId), file, {
    upsert: true,
    contentType: file.type,
  })

  if (error) return NextResponse.json({ ok: false, error: 'Image upload failed.', detail: error.message }, { status: 502 })

  const { data: existingCase, error: existingCaseError } = await supabase
    .from('vial_cases')
    .select('image_gallery, image_url')
    .eq('id', id)
    .maybeSingle()
  const { data: fallbackExistingCase } = existingCaseError && isMissingColumnError(existingCaseError)
    ? await supabase
        .from('vial_cases')
        .select('image_url')
        .eq('id', id)
        .maybeSingle()
    : { data: null }

  const existingRecord = (existingCase ?? fallbackExistingCase) as { image_gallery?: unknown; image_url?: string | null } | null
  const currentGallery = normalizeGalleryWithFallback(existingRecord?.image_gallery, existingRecord?.image_url)
  const uploadedAt = new Date().toISOString()
  const nextImage: VialCaseImage = {
    id: imageId,
    url: getVialCaseImageProxyUrl(id, imageId),
    label: file.name,
    isPrimary: shouldMakePrimary || currentGallery.length === 0,
    sortOrder: currentGallery.length,
    uploadedAt,
  }
  const nextGallery = normalizePrimaryGallery(
    [...currentGallery.filter((image) => image.id !== imageId), nextImage],
    nextImage.isPrimary ? imageId : undefined,
  )
  const primaryImage = nextGallery.find((image) => image.isPrimary) ?? nextGallery[0]

  const { error: updateError } = await supabase
    .from('vial_cases')
    .update({
      image_url: primaryImage?.url ?? getVialCaseImageProxyUrl(id, imageId),
      image_source: 'uploaded',
      image_gallery: nextGallery,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (isMissingColumnError(updateError)) {
    const { error: fallbackUpdateError } = await supabase
      .from('vial_cases')
      .update({
        image_url: primaryImage?.url ?? getVialCaseImageProxyUrl(id, imageId),
        image_source: 'uploaded',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
    if (fallbackUpdateError) return NextResponse.json({ ok: false, error: fallbackUpdateError.message }, { status: 502 })
    expireStorefrontCache(STOREFRONT_CACHE_TAGS.vialCases)
    return NextResponse.json({ ok: true, imageUrl: primaryImage?.url, images: nextGallery })
  }
  if (updateError) return NextResponse.json({ ok: false, error: updateError.message }, { status: 502 })
  expireStorefrontCache(STOREFRONT_CACHE_TAGS.vialCases)
  return NextResponse.json({ ok: true, imageUrl: primaryImage?.url, images: nextGallery })
}

export async function DELETE(request: Request, context: Context) {
  const { id } = await context.params
  const supabase = getSupabaseAdmin()
  if (!supabase) return NextResponse.json({ ok: false, error: 'Supabase is not configured.' }, { status: 503 })

  const url = new URL(request.url)
  const requestedImageId = url.searchParams.get('image')

  const { data: existingCase, error: existingCaseError } = await supabase
    .from('vial_cases')
    .select('image_gallery, image_url')
    .eq('id', id)
    .maybeSingle()
  const { data: fallbackExistingCase } = existingCaseError && isMissingColumnError(existingCaseError)
    ? await supabase
        .from('vial_cases')
        .select('image_url')
        .eq('id', id)
        .maybeSingle()
    : { data: null }
  const existingRecord = (existingCase ?? fallbackExistingCase) as { image_gallery?: unknown; image_url?: string | null } | null
  const currentGallery = normalizeGalleryWithFallback(existingRecord?.image_gallery, existingRecord?.image_url)

  const imageIdsToRemove = requestedImageId
    ? [normalizeImageId(requestedImageId)]
    : currentGallery.length > 0
      ? currentGallery.map((image) => image.id)
      : ['front']
  await supabase.storage.from(VIAL_CASE_IMAGE_BUCKET).remove(imageIdsToRemove.map((imageId) => getVialCaseImageStoragePath(id, imageId)))

  const remainingGallery = requestedImageId
    ? normalizePrimaryGallery(currentGallery.filter((image) => image.id !== normalizeImageId(requestedImageId)))
    : []
  const primaryImage = remainingGallery.find((image) => image.isPrimary) ?? remainingGallery[0]

  const { error } = await supabase
    .from('vial_cases')
    .update({
      image_url: primaryImage?.url ?? null,
      image_source: primaryImage ? 'uploaded' : 'none',
      image_gallery: remainingGallery,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (isMissingColumnError(error)) {
    const { error: fallbackError } = await supabase
      .from('vial_cases')
      .update({
        image_url: primaryImage?.url ?? null,
        image_source: primaryImage ? 'uploaded' : 'none',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
    if (fallbackError) return NextResponse.json({ ok: false, error: fallbackError.message }, { status: 502 })
    expireStorefrontCache(STOREFRONT_CACHE_TAGS.vialCases)
    return NextResponse.json({ ok: true })
  }
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 502 })
  expireStorefrontCache(STOREFRONT_CACHE_TAGS.vialCases)
  return NextResponse.json({ ok: true })
}
