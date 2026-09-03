import { NextResponse } from 'next/server'
import { STOREFRONT_CACHE_TAGS, expireStorefrontCache } from '@/lib/storefront-cache'
import { getAdminVialCases, parseVialCasePrice, type VialCaseImage } from '@/lib/vial-cases'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type VialCasePayload = {
  id?: string
  name?: string
  description?: string
  priceLabel?: string
  priceAmount?: number
  imageGallery?: VialCaseImage[]
  publicVisible?: boolean
  archived?: boolean
  sortOrder?: number
}

type VialCaseReorderItem = {
  id: string
  sortOrder: number
}

function getString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function toReorderPayload(value: unknown): VialCaseReorderItem[] | null {
  if (!value || typeof value !== 'object') return null
  const record = value as Record<string, unknown>
  if (!Array.isArray(record.reorder)) return null

  const items = record.reorder.map((entry) => {
    if (!entry || typeof entry !== 'object') return null
    const item = entry as Record<string, unknown>
    const id = getString(item.id)
    const sortOrder = typeof item.sortOrder === 'number' && Number.isFinite(item.sortOrder)
      ? item.sortOrder
      : null
    return id && sortOrder !== null ? { id, sortOrder } : null
  })

  if (items.some((item) => item === null)) return []
  const validItems = items as VialCaseReorderItem[]
  const uniqueIds = new Set(validItems.map((item) => item.id))
  return uniqueIds.size === validItems.length ? validItems : []
}

function toPayload(value: unknown): VialCasePayload | null {
  if (!value || typeof value !== 'object') return null
  const record = value as Record<string, unknown>
  return {
    id: getString(record.id),
    name: getString(record.name),
    description: getString(record.description),
    priceLabel: getString(record.priceLabel),
    priceAmount: typeof record.priceAmount === 'number' && Number.isFinite(record.priceAmount) ? record.priceAmount : undefined,
    imageGallery: Array.isArray(record.imageGallery) ? record.imageGallery as VialCaseImage[] : undefined,
    publicVisible: typeof record.publicVisible === 'boolean' ? record.publicVisible : undefined,
    archived: typeof record.archived === 'boolean' ? record.archived : undefined,
    sortOrder: typeof record.sortOrder === 'number' && Number.isFinite(record.sortOrder) ? record.sortOrder : undefined,
  }
}

function getPrimaryImage(images?: VialCaseImage[]) {
  if (!Array.isArray(images) || images.length === 0) return null
  return images.find((image) => image.isPrimary) ?? images[0] ?? null
}

function isMissingColumnError(error: { message?: string; code?: string } | null | undefined) {
  if (!error) return false
  const message = error.message ?? ''
  return error.code === 'PGRST204' || /Could not find the .* column|schema cache/i.test(message)
}

function stripSchemaSensitiveFields(row: ReturnType<typeof rowFromPayload>) {
  const fallbackRow: Record<string, unknown> = { ...row }
  delete fallbackRow.price_amount
  delete fallbackRow.image_gallery
  return fallbackRow
}

function rowFromPayload(payload: VialCasePayload) {
  const primaryImage = getPrimaryImage(payload.imageGallery)
  return {
    name: payload.name,
    description: payload.description ?? '',
    price_label: payload.priceLabel,
    price_amount: payload.priceAmount ?? parseVialCasePrice(payload.priceLabel),
    ...(payload.imageGallery
      ? {
          image_gallery: payload.imageGallery,
          image_url: primaryImage?.url ?? null,
          image_source: primaryImage ? 'uploaded' : 'none',
        }
      : {}),
    public_visible: payload.publicVisible ?? true,
    archived: payload.archived ?? false,
    sort_order: payload.sortOrder ?? 0,
    updated_at: new Date().toISOString(),
  }
}

export async function GET() {
  const result = await getAdminVialCases()
  if (result.error) return NextResponse.json({ ok: false, error: result.error, cases: result.cases }, { status: 502 })
  return NextResponse.json({ ok: true, cases: result.cases })
}

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON payload.' }, { status: 400 })
  }

  const payload = toPayload(body)
  if (!payload?.name || !payload.priceLabel) {
    return NextResponse.json({ ok: false, error: 'Case name and price are required.' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  if (!supabase) return NextResponse.json({ ok: false, error: 'Supabase is not configured.' }, { status: 503 })

  const { data, error } = await supabase
    .from('vial_cases')
    .insert(rowFromPayload(payload))
    .select('id, name')
    .single()
  if (isMissingColumnError(error)) {
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('vial_cases')
      .insert(stripSchemaSensitiveFields(rowFromPayload(payload)))
      .select('id, name')
      .single()
    if (fallbackError) return NextResponse.json({ ok: false, error: fallbackError.message }, { status: 502 })
    expireStorefrontCache(STOREFRONT_CACHE_TAGS.vialCases)
    return NextResponse.json({ ok: true, case: fallbackData })
  }
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 502 })
  expireStorefrontCache(STOREFRONT_CACHE_TAGS.vialCases)
  return NextResponse.json({ ok: true, case: data })
}

export async function PATCH(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON payload.' }, { status: 400 })
  }

  const reorderPayload = toReorderPayload(body)
  if (reorderPayload) {
    if (reorderPayload.length === 0) {
      return NextResponse.json({ ok: false, error: 'Valid case reorder items are required.' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    if (!supabase) return NextResponse.json({ ok: false, error: 'Supabase is not configured.' }, { status: 503 })

    const updatedAt = new Date().toISOString()
    const results = await Promise.all(
      reorderPayload.map((item) =>
        supabase
          .from('vial_cases')
          .update({ sort_order: item.sortOrder, updated_at: updatedAt })
          .eq('id', item.id),
      ),
    )
    const failed = results.find((result) => result.error)
    if (failed?.error) return NextResponse.json({ ok: false, error: failed.error.message }, { status: 502 })
    expireStorefrontCache(STOREFRONT_CACHE_TAGS.vialCases)
    return NextResponse.json({ ok: true })
  }

  const payload = toPayload(body)
  if (!payload?.id || !payload.name || !payload.priceLabel) {
    return NextResponse.json({ ok: false, error: 'Case id, name, and price are required.' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  if (!supabase) return NextResponse.json({ ok: false, error: 'Supabase is not configured.' }, { status: 503 })

  const { data, error } = await supabase
    .from('vial_cases')
    .update(rowFromPayload(payload))
    .eq('id', payload.id)
    .select('id, name')
    .single()
  if (isMissingColumnError(error)) {
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('vial_cases')
      .update(stripSchemaSensitiveFields(rowFromPayload(payload)))
      .eq('id', payload.id)
      .select('id, name')
      .single()
    if (fallbackError) return NextResponse.json({ ok: false, error: fallbackError.message }, { status: 502 })
    expireStorefrontCache(STOREFRONT_CACHE_TAGS.vialCases)
    return NextResponse.json({ ok: true, case: fallbackData })
  }
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 502 })
  expireStorefrontCache(STOREFRONT_CACHE_TAGS.vialCases)
  return NextResponse.json({ ok: true, case: data })
}

export async function DELETE(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON payload.' }, { status: 400 })
  }

  const payload = toPayload(body)
  if (!payload?.id) return NextResponse.json({ ok: false, error: 'Case id is required.' }, { status: 400 })

  const supabase = getSupabaseAdmin()
  if (!supabase) return NextResponse.json({ ok: false, error: 'Supabase is not configured.' }, { status: 503 })

  const { error } = await supabase
    .from('vial_cases')
    .update({ archived: true, public_visible: false, updated_at: new Date().toISOString() })
    .eq('id', payload.id)

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 502 })
  expireStorefrontCache(STOREFRONT_CACHE_TAGS.vialCases)
  return NextResponse.json({ ok: true })
}
