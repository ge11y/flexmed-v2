import { NextResponse } from 'next/server'
import type { CatalogInventoryRecord } from '@/lib/catalog-admin'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

function isCatalogPayload(value: unknown): value is { records: CatalogInventoryRecord[] } {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return Array.isArray(record.records)
}

function isMissingCatalogCopyColumn(message: string) {
  const normalized = message.toLowerCase()
  return (
    normalized.includes('summary_short') ||
    normalized.includes('summary_full') ||
    normalized.includes('research_focus_points') ||
    normalized.includes('listing_notes') ||
    normalized.includes('coa_not_required') ||
    normalized.includes('image_url') ||
    normalized.includes('image_source') ||
    normalized.includes('coa_url') ||
    normalized.includes('coa_source') ||
    normalized.includes('featured')
  )
}

export async function POST(request: Request) {
  let payload: unknown

  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON payload.' }, { status: 400 })
  }

  if (!isCatalogPayload(payload)) {
    return NextResponse.json({ ok: false, error: 'Catalog payload must include a records array.' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  if (!supabase) {
    return NextResponse.json({ ok: false, code: 'missing_supabase', error: 'Supabase is not configured yet.' }, { status: 503 })
  }

  try {
    const slugs = payload.records.map((record) => record.slug)
    const { data: existingRows } = await supabase
      .from('catalog_products')
      .select('slug, inventory_on_hand, low_stock_threshold, status')
      .in('slug', slugs)

    const existingBySlug = new Map(
      (existingRows ?? []).map((row) => [
        row.slug,
        {
          inventory_on_hand: row.inventory_on_hand as number | null,
          low_stock_threshold: row.low_stock_threshold as number | null,
          status: row.status as CatalogInventoryRecord['status'] | null,
        },
      ]),
    )

    const legacyBaseRows = payload.records.map((record) => {
      const existing = existingBySlug.get(record.slug)
      const nextInventory = record.inventoryOnHand ?? existing?.inventory_on_hand ?? null
      const nextLowStockThreshold = record.lowStockThreshold ?? existing?.low_stock_threshold ?? null
      const nextStatus = nextInventory === null ? (existing?.status ?? record.status) : record.status

      return {
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
      }
    })

    const baseRows = payload.records.map((record, index) => ({
      ...legacyBaseRows[index],
      image_url: record.imageUrl,
      image_source: record.imageSource,
      coa_url: record.coaUrl,
      coa_source: record.coaSource,
    }))

    const rows = payload.records.map((record, index) => ({
      ...baseRows[index],
      summary_short: record.summaryShort,
      summary_full: record.summaryFull,
      research_focus_points: record.researchFocusPoints,
      listing_notes: record.listingNotes,
      coa_not_required: record.coaNotRequired,
      featured: record.featured,
      featured_order: record.featuredOrder,
    }))

    let { error } = await supabase.from('catalog_products').upsert(rows, { onConflict: 'slug' })

    if (error && isMissingCatalogCopyColumn(error.message)) {
      const retry = await supabase.from('catalog_products').upsert(legacyBaseRows, { onConflict: 'slug' })
      error = retry.error
      if (!error) {
        return NextResponse.json({ ok: true, synced: 'supabase-legacy', count: legacyBaseRows.length })
      }
    }

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Supabase rejected the catalog update.',
          detail: error.message,
        },
        { status: 502 },
      )
    }

    return NextResponse.json({ ok: true, synced: 'supabase', count: rows.length })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Catalog sync failed.',
        detail: error instanceof Error ? error.message : 'Unknown network error',
      },
      { status: 502 },
    )
  }
}
