import { NextResponse } from 'next/server'
import type { ManualOrderSubmission } from '@/lib/manual-orders'
import { deserializeManualOrder, deserializePaymentProof } from '@/lib/manual-orders-db'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { getInventoryStatusFromCount } from '@/lib/inventory-state'

type OrderPatch = Partial<
  Pick<
    ManualOrderSubmission,
    | 'status'
    | 'paymentMethod'
    | 'paymentProofStatus'
    | 'order'
    | 'fulfillmentNotes'
    | 'trackingCarrier'
    | 'trackingNumber'
    | 'packageType'
    | 'packageDetails'
    | 'shipmentPhotoPreviewUrl'
    | 'labelDocumentName'
    | 'labelDocumentUrl'
    | 'labelDocumentType'
    | 'labelExtraction'
    | 'fulfillmentUpdatedAt'
    | 'inventoryChangeSummary'
    | 'inventoryAdjustedAt'
  >
>

function isPatchPayload(value: unknown): value is { id: string; patch: OrderPatch } {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return typeof record.id === 'string' && typeof record.patch === 'object' && record.patch !== null
}

function normalizeKeyPart(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function normalizeMatchText(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim()
}

function parseStrengthLabel(strengthLabel?: string) {
  const match = strengthLabel?.trim().match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)$/)
  if (!match) return null
  const strength = Number(match[1])
  if (!Number.isFinite(strength)) return null
  return {
    strength,
    unit: normalizeKeyPart(match[2]),
  }
}

export async function GET() {
  const supabase = getSupabaseAdmin()
  if (!supabase) {
    return NextResponse.json({ ok: false, code: 'missing_supabase', error: 'Supabase is not configured.' }, { status: 503 })
  }

  const [{ data: orders, error: ordersError }, { data: proofs, error: proofsError }] = await Promise.all([
    supabase.from('manual_orders').select('*').order('created_at', { ascending: false }),
    supabase.from('payment_proofs').select('*').order('created_at', { ascending: false }),
  ])

  if (ordersError || proofsError) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Supabase could not load the shared order queue.',
        detail: ordersError?.message ?? proofsError?.message ?? 'Unknown error',
      },
      { status: 502 },
    )
  }

  const { data: emailLogs, error: emailLogsError } = await supabase
    .from('order_messages')
    .select('*')
    .eq('source', 'email')
    .order('created_at', { ascending: false })

  if (emailLogsError) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Supabase could not load the email history.',
        detail: emailLogsError.message,
      },
      { status: 502 },
    )
  }

  return NextResponse.json({
    ok: true,
    orders: (orders ?? []).map(deserializeManualOrder),
    proofs: (proofs ?? []).map(deserializePaymentProof),
    emailLogs: (emailLogs ?? []).map((row) => ({
      id: row.id as string,
      orderId: (row.order_id as string | null) ?? null,
      messageType: row.message_type as string,
      messageText: (row.message_text as string) ?? '',
      status: row.status as string,
      createdAt: row.created_at as string,
    })),
  })
}

export async function PATCH(request: Request) {
  let payload: unknown

  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON payload.' }, { status: 400 })
  }

  if (!isPatchPayload(payload)) {
    return NextResponse.json({ ok: false, error: 'Order patch payload is missing required fields.' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  if (!supabase) {
    return NextResponse.json({ ok: false, code: 'missing_supabase', error: 'Supabase is not configured.' }, { status: 503 })
  }

  const { data: currentRow, error: currentRowError } = await supabase.from('manual_orders').select('*').eq('id', payload.id).single()
  if (currentRowError || !currentRow) {
    return NextResponse.json({ ok: false, error: 'Order not found.' }, { status: 404 })
  }

  const currentOrder = deserializeManualOrder(currentRow)
  const nextStatus = payload.patch.status ?? currentOrder.status
  const dbPatch = {
    status: payload.patch.status,
    payment_method: payload.patch.paymentMethod,
    payment_proof_status: payload.patch.paymentProofStatus,
    order_json: payload.patch.order,
    fulfillment_notes: payload.patch.fulfillmentNotes,
    tracking_carrier: payload.patch.trackingCarrier,
    tracking_number: payload.patch.trackingNumber,
    package_type: payload.patch.packageType,
    package_details: payload.patch.packageDetails,
    shipment_photo_url: payload.patch.shipmentPhotoPreviewUrl,
    label_document_name: payload.patch.labelDocumentName,
    label_document_url: payload.patch.labelDocumentUrl,
    label_document_type: payload.patch.labelDocumentType,
    label_extraction_json: payload.patch.labelExtraction,
    fulfillment_updated_at: payload.patch.fulfillmentUpdatedAt ?? new Date().toISOString(),
    inventory_change_json: payload.patch.inventoryChangeSummary,
    inventory_adjusted_at: payload.patch.inventoryAdjustedAt,
  }

  const cleanedPatch = Object.fromEntries(Object.entries(dbPatch).filter(([, value]) => value !== undefined))

  const { error } = await supabase.from('manual_orders').update(cleanedPatch).eq('id', payload.id)

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Supabase rejected the order update.',
        detail: error.message,
      },
      { status: 502 },
    )
  }

  const transitionedToFulfilled = currentOrder.status !== 'fulfilled' && nextStatus === 'fulfilled'
  if (transitionedToFulfilled) {
    const productLines = currentOrder.order.lines.filter((line) => (line.itemType ?? 'product') === 'product')

    if (productLines.length === 0) {
      const inventoryAdjustedAt = new Date().toISOString()
      await supabase
        .from('manual_orders')
        .update({
          inventory_change_json: [],
          inventory_adjusted_at: inventoryAdjustedAt,
        })
        .eq('id', payload.id)

      return NextResponse.json({
        ok: true,
        inventoryChangeSummary: [],
        unmatchedLines: [],
      })
    }

    const lineSlugs = productLines.map((line) => line.slug)
    const [{ data: catalogRows }, { data: pendingSupplyRows }] = await Promise.all([
      supabase.from('catalog_products').select('slug, inventory_on_hand, display_name, strength_value, unit').in('slug', lineSlugs),
      supabase
        .from('inventory_purchase_logs')
        .select('slug')
        .in('slug', lineSlugs)
        .eq('status', 'ordered')
        .is('inventory_applied_at', null),
    ])

    const allCatalogRowsResponse = await supabase
      .from('catalog_products')
      .select('slug, inventory_on_hand, display_name, strength_value, unit')

    const directRows = (catalogRows ?? []) as Array<{
      slug: string
      inventory_on_hand: number | null
      display_name?: string | null
      strength_value?: number | null
      unit?: string | null
    }>
    const allCatalogRows = (allCatalogRowsResponse.data ?? []) as Array<{
      slug: string
      inventory_on_hand: number | null
      display_name?: string | null
      strength_value?: number | null
      unit?: string | null
    }>

    const rowMap = new Map(directRows.map((row) => [row.slug as string, row.inventory_on_hand as number | null]))
    const pendingSupplySlugs = new Set((pendingSupplyRows ?? []).map((row) => row.slug as string))

    const inventoryChangeSummary: NonNullable<ManualOrderSubmission['inventoryChangeSummary']> = []
    const unmatchedLines: Array<{ slug: string; displayName: string; strengthLabel: string }> = []

    for (const line of productLines) {
      let matchedSlug = line.slug
      let currentInventory = rowMap.get(matchedSlug)

      if (currentInventory === null || currentInventory === undefined) {
        const parsedStrength = parseStrengthLabel(line.strengthLabel)
        const normalizedDisplayName = normalizeMatchText(line.displayName)
        const fallbackRow = allCatalogRows.find((row) => {
          const sameName = normalizeMatchText(String(row.display_name ?? '')) === normalizedDisplayName
          if (!sameName || !parsedStrength) return false
          return (
            Number(row.strength_value ?? NaN) === parsedStrength.strength &&
            normalizeKeyPart(String(row.unit ?? '')) === parsedStrength.unit
          )
        })

        if (fallbackRow) {
          matchedSlug = fallbackRow.slug
          currentInventory = fallbackRow.inventory_on_hand as number | null
        }
      }

      if (currentInventory === null || currentInventory === undefined) continue
      const nextInventory = Math.max(0, currentInventory - line.quantity)

      await supabase
        .from('catalog_products')
        .update({
          inventory_on_hand: nextInventory,
          status: getInventoryStatusFromCount(
            nextInventory,
            nextInventory === 0 && pendingSupplySlugs.has(matchedSlug) ? 'incoming' : 'out_of_stock',
          ),
          updated_at: new Date().toISOString(),
        })
        .eq('slug', matchedSlug)

      inventoryChangeSummary.push({
        slug: matchedSlug,
        displayName: line.displayName,
        strengthLabel: line.strengthLabel,
        quantityDeducted: line.quantity,
        previousInventory: currentInventory,
        nextInventory,
      })

      if (matchedSlug !== line.slug) {
        rowMap.set(matchedSlug, nextInventory)
      } else {
        rowMap.set(line.slug, nextInventory)
      }
    }

    for (const line of productLines) {
      const wasMatched = inventoryChangeSummary.some(
        (change) =>
          change.displayName === line.displayName &&
          change.strengthLabel === line.strengthLabel &&
          change.quantityDeducted === line.quantity,
      )
      if (!wasMatched) {
        unmatchedLines.push({
          slug: line.slug,
          displayName: line.displayName,
          strengthLabel: line.strengthLabel,
        })
      }
    }

    await supabase
      .from('manual_orders')
      .update({
        inventory_change_json: inventoryChangeSummary,
        inventory_adjusted_at: new Date().toISOString(),
      })
      .eq('id', payload.id)

    return NextResponse.json({
      ok: true,
      inventoryChangeSummary,
      unmatchedLines,
    })
  }

  return NextResponse.json({ ok: true })
}
