import { NextResponse } from 'next/server'
import { STOREFRONT_CACHE_TAGS, expireStorefrontCache } from '@/lib/storefront-cache'
import {
  normalizePromoRow,
  type PromoDiscountType,
  type PromoKind,
  type PromoPlacement,
} from '@/lib/site-promos'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

type PromoPayload = {
  id?: string
  title: string
  detail: string
  promoKind: PromoKind
  placements: PromoPlacement[]
  scope: string
  targetSlug?: string | null
  targetSlugs?: string[]
  targetFamilyKeys?: string[]
  targetVialCaseIds?: string[]
  badgeLabel?: string
  popupImageUrl?: string
  discountType: PromoDiscountType
  discountPercent?: number | null
  buyQuantity?: number
  getQuantity?: number
  isActive: boolean
  startsAt?: string | null
  endsAt?: string | null
}

const PROMO_KINDS = new Set<PromoKind>(['sitewide', 'product_selection', 'collection', 'vial_cases'])
const PLACEMENTS = new Set<PromoPlacement>(['banner', 'popup', 'product', 'checkout'])
const DISCOUNT_TYPES = new Set<PromoDiscountType>([
  'percentage',
  'bogo',
  'free_shipping',
  'announcement',
])

function normalizeLegacyPayload(value: unknown) {
  if (!value || typeof value !== 'object') return value
  const record = value as Record<string, unknown>
  if (Array.isArray(record.placements) && typeof record.discountType === 'string') return value

  const legacyPlacement = typeof record.placement === 'string' ? record.placement : 'banner'
  const normalizedPlacement: PromoPlacement =
    legacyPlacement === 'product_badge'
      ? 'product'
      : legacyPlacement === 'free_shipping'
        ? 'checkout'
        : legacyPlacement === 'popup'
          ? 'popup'
          : 'banner'
  const inferredDiscountType: PromoDiscountType =
    typeof record.discountPercent === 'number'
      ? 'percentage'
      : legacyPlacement === 'free_shipping'
        ? 'free_shipping'
        : 'announcement'

  return {
    ...record,
    promoKind: typeof record.promoKind === 'string' ? record.promoKind : 'sitewide',
    placements: [normalizedPlacement],
    discountType: typeof record.discountType === 'string' ? record.discountType : inferredDiscountType,
    isActive: typeof record.isActive === 'boolean' ? record.isActive : true,
  }
}

function isPayload(value: unknown): value is PromoPayload {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return (
    typeof record.title === 'string' &&
    typeof record.detail === 'string' &&
    typeof record.promoKind === 'string' &&
    PROMO_KINDS.has(record.promoKind as PromoKind) &&
    Array.isArray(record.placements) &&
    record.placements.length > 0 &&
    record.placements.every((placement) => PLACEMENTS.has(placement as PromoPlacement)) &&
    typeof record.discountType === 'string' &&
    DISCOUNT_TYPES.has(record.discountType as PromoDiscountType) &&
    typeof record.isActive === 'boolean'
  )
}

function validatePayload(payload: PromoPayload) {
  if (!payload.title.trim()) return 'Promo title is required.'
  if (payload.discountType === 'percentage') {
    if (
      typeof payload.discountPercent !== 'number' ||
      !Number.isInteger(payload.discountPercent) ||
      payload.discountPercent < 1 ||
      payload.discountPercent > 100
    ) {
      return 'Percentage discounts must be a whole number from 1 to 100.'
    }
  }
  if (payload.discountType === 'bogo') {
    if (
      !Number.isInteger(payload.buyQuantity) ||
      !Number.isInteger(payload.getQuantity) ||
      (payload.buyQuantity ?? 0) < 1 ||
      (payload.getQuantity ?? 0) < 1
    ) {
      return 'BOGO quantities must be positive whole numbers.'
    }
  }
  if (
    payload.promoKind === 'product_selection' &&
    (payload.targetSlugs?.length ?? 0) === 0 &&
    (payload.targetFamilyKeys?.length ?? 0) === 0
  ) {
    return 'Choose at least one product family or strength.'
  }
  if (payload.promoKind === 'vial_cases' && (payload.targetVialCaseIds?.length ?? 0) === 0) {
    return 'Choose at least one vial case.'
  }
  if (payload.startsAt && !Number.isFinite(Date.parse(payload.startsAt))) {
    return 'The promo start time is invalid.'
  }
  if (payload.endsAt && !Number.isFinite(Date.parse(payload.endsAt))) {
    return 'The promo end time is invalid.'
  }
  if (payload.startsAt && payload.endsAt && Date.parse(payload.endsAt) <= Date.parse(payload.startsAt)) {
    return 'The promo end time must be after its start time.'
  }
  return null
}

type PromoMutation = ReturnType<typeof buildPromoMutation>

function withoutPopupImage(mutation: PromoMutation) {
  const fallbackMutation: Partial<PromoMutation> = { ...mutation }
  delete fallbackMutation.popup_image_url
  return fallbackMutation
}

function isMissingPopupImageColumn(error: { message?: string; code?: string } | null | undefined) {
  if (!error) return false
  const message = error.message ?? ''
  return error.code === 'PGRST204' || /popup_image_url|schema cache|Could not find the .* column/i.test(message)
}

function buildPromoMutation(payload: PromoPayload) {
  const legacyPlacement =
    payload.discountType === 'free_shipping'
      ? 'free_shipping'
      : payload.placements.includes('product')
        ? 'product_badge'
        : payload.placements[0]

  return {
    title: payload.title.trim(),
    detail: payload.detail.trim(),
    promo_kind: payload.promoKind,
    placement: legacyPlacement,
    placements: payload.placements,
    scope: payload.scope || 'sitewide',
    target_slug: payload.targetSlug ?? null,
    target_slugs: payload.targetSlugs ?? [],
    target_family_keys: payload.targetFamilyKeys ?? [],
    target_vial_case_ids: payload.targetVialCaseIds ?? [],
    badge_label: payload.badgeLabel?.trim() ?? '',
    popup_image_url: payload.popupImageUrl?.trim() ?? '',
    discount_type: payload.discountType,
    discount_percent: payload.discountType === 'percentage' ? payload.discountPercent ?? null : null,
    buy_quantity: payload.discountType === 'bogo' ? payload.buyQuantity ?? 1 : 1,
    get_quantity: payload.discountType === 'bogo' ? payload.getQuantity ?? 1 : 1,
    is_active: payload.isActive,
    starts_at: payload.startsAt ?? null,
    ends_at: payload.endsAt ?? null,
    updated_at: new Date().toISOString(),
  }
}

function promoError(error: { message: string }) {
  const normalized = error.message.toLowerCase()
  const schemaError =
    normalized.includes('schema cache') ||
    normalized.includes('discount_type') ||
    normalized.includes('placements') ||
    normalized.includes('popup_image_url') ||
    normalized.includes('target_family_keys') ||
    normalized.includes('target_vial_case_ids')

  return NextResponse.json(
    {
      ok: false,
      error: schemaError
        ? 'Promo setup is not finished in Supabase. Run docs/supabase-promo-v1.sql in the Supabase SQL Editor, then try again.'
        : error.message,
      detail: error.message,
    },
    { status: 502 },
  )
}

export async function GET() {
  const supabase = getSupabaseAdmin()
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Supabase is not configured.' }, { status: 503 })
  }

  const { data, error } = await supabase.from('site_promos').select('*').order('created_at', { ascending: false })
  if (error) {
    return promoError(error)
  }

  return NextResponse.json({
    ok: true,
    promos: (data as Record<string, unknown>[] | null)?.map(normalizePromoRow) ?? [],
  })
}

export async function POST(request: Request) {
  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON payload.' }, { status: 400 })
  }
  payload = normalizeLegacyPayload(payload)
  if (!isPayload(payload)) {
    return NextResponse.json({ ok: false, error: 'Promo payload is invalid.' }, { status: 400 })
  }
  const validationError = validatePayload(payload)
  if (validationError) {
    return NextResponse.json({ ok: false, error: validationError }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Supabase is not configured.' }, { status: 503 })
  }

  const mutation = buildPromoMutation(payload)
  let { data, error } = await supabase.from('site_promos').insert(mutation).select('*').single()
  if (error && isMissingPopupImageColumn(error) && !payload.popupImageUrl?.trim()) {
    const retry = await supabase.from('site_promos').insert(withoutPopupImage(mutation)).select('*').single()
    data = retry.data
    error = retry.error
  }

  if (error) return promoError(error)
  expireStorefrontCache(STOREFRONT_CACHE_TAGS.promos)
  return NextResponse.json({ ok: true, promo: data ? normalizePromoRow(data as Record<string, unknown>) : null })
}

export async function PATCH(request: Request) {
  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON payload.' }, { status: 400 })
  }
  payload = normalizeLegacyPayload(payload)
  const record = payload as Record<string, unknown>
  const id = typeof record.id === 'string' ? record.id : ''
  if (!id || !isPayload(payload)) {
    return NextResponse.json({ ok: false, error: 'Promo payload is invalid.' }, { status: 400 })
  }
  const validationError = validatePayload(payload)
  if (validationError) {
    return NextResponse.json({ ok: false, error: validationError }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Supabase is not configured.' }, { status: 503 })
  }

  const mutation = buildPromoMutation(payload)
  let { data, error } = await supabase
    .from('site_promos')
    .update(mutation)
    .eq('id', id)
    .select('*')
    .single()
  if (error && isMissingPopupImageColumn(error) && !payload.popupImageUrl?.trim()) {
    const retry = await supabase
      .from('site_promos')
      .update(withoutPopupImage(mutation))
      .eq('id', id)
      .select('*')
      .single()
    data = retry.data
    error = retry.error
  }

  if (error) return promoError(error)
  expireStorefrontCache(STOREFRONT_CACHE_TAGS.promos)
  return NextResponse.json({ ok: true, promo: data ? normalizePromoRow(data as Record<string, unknown>) : null })
}

export async function DELETE(request: Request) {
  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON payload.' }, { status: 400 })
  }
  const record = payload as Record<string, unknown>
  const id = typeof record.id === 'string' ? record.id : ''
  if (!id) {
    return NextResponse.json({ ok: false, error: 'Promo id is required.' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Supabase is not configured.' }, { status: 503 })
  }
  const { error } = await supabase.from('site_promos').delete().eq('id', id)
  if (error) return promoError(error)
  expireStorefrontCache(STOREFRONT_CACHE_TAGS.promos)
  return NextResponse.json({ ok: true })
}
