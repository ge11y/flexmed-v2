import { NextResponse } from 'next/server'
import { STOREFRONT_CACHE_TAGS, expireStorefrontCache } from '@/lib/storefront-cache'
import type { CatalogInventoryRecord } from '@/lib/catalog-admin'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

function isRecordPayload(value: unknown): value is { record: CatalogInventoryRecord } {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return Boolean(record.record && typeof record.record === 'object')
}

function isMissingCatalogCopyColumn(message: string) {
  const normalized = message.toLowerCase()
  return (
    normalized.includes('summary_short') ||
    normalized.includes('summary_full') ||
    normalized.includes('research_focus_points') ||
    normalized.includes('listing_notes') ||
    normalized.includes('image_url') ||
    normalized.includes('image_source') ||
    normalized.includes('coa_url') ||
    normalized.includes('coa_source')
  )
}

export async function POST(request: Request) {
  let payload: unknown

  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON payload.' }, { status: 400 })
  }

  if (!isRecordPayload(payload)) {
    return NextResponse.json({ ok: false, error: 'Strength payload must include a record.' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  if (!supabase) {
    return NextResponse.json({ ok: false, code: 'missing_supabase', error: 'Supabase is not configured yet.' }, { status: 503 })
  }

  const { record } = payload

  try {
    const { data: existingRow } = await supabase
      .from('catalog_products')
      .select('slug, inventory_on_hand, low_stock_threshold, status')
      .eq('slug', record.slug)
      .maybeSingle()

    const nextInventory = record.inventoryOnHand ?? existingRow?.inventory_on_hand ?? null
    const nextLowStockThreshold = record.lowStockThreshold ?? existingRow?.low_stock_threshold ?? null
    const nextStatus = nextInventory === null ? (existingRow?.status ?? record.status) : record.status

    const legacyRow = {
      slug: record.slug,
      sku: record.sku,
      display_name: record.displayName,
      full_name: record.fullName,
      strength_value: record.strength,
      unit: record.unit,
      collection: record.collection,
      research_category: record.researchCategory,
      format_type: record.formatType,
      variant_group: record.variantGroup ?? null,
      variant_label: record.variantLabel ?? null,
      status: nextStatus,
      price_vial: record.priceVial,
      inventory_on_hand: nextInventory,
      low_stock_threshold: nextLowStockThreshold,
      promo_label: record.promoLabel,
      promo_detail: record.promoDetail,
      public_visible: record.publicVisible,
      custom_product: record.customProduct,
      archived: record.archived,
      updated_at: new Date().toISOString(),
    }

    const baseRow = {
      ...legacyRow,
      image_url: record.imageUrl,
      image_source: record.imageSource,
      coa_url: record.coaUrl,
      coa_source: record.coaSource,
    }

    const row = {
      ...baseRow,
      summary_short: record.summaryShort,
      summary_full: record.summaryFull,
      research_focus_points: record.researchFocusPoints,
      listing_notes: record.listingNotes,
    }

    let { error } = await supabase.from('catalog_products').upsert(row, { onConflict: 'slug' })

    if (error && isMissingCatalogCopyColumn(error.message)) {
      const retry = await supabase.from('catalog_products').upsert(legacyRow, { onConflict: 'slug' })
      error = retry.error
      if (!error) {
        expireStorefrontCache(STOREFRONT_CACHE_TAGS.catalog)
        return NextResponse.json({ ok: true, synced: 'supabase-legacy', slug: record.slug })
      }
    }

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Supabase rejected the new strength.',
          detail: error.message,
        },
        { status: 502 },
      )
    }

    expireStorefrontCache(STOREFRONT_CACHE_TAGS.catalog)
    return NextResponse.json({ ok: true, synced: 'supabase', slug: record.slug })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Saving this strength failed.',
        detail: error instanceof Error ? error.message : 'Unknown network error',
      },
      { status: 502 },
    )
  }
}
