import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

interface InventoryCostLogInput {
  id?: string
  slug: string
  productName: string
  strengthLabel: string
  vendorName: string
  vialQuantity: number
  kitQuantity: number
  unitsPerKit: number
  orderedOn: string
  pricePerVial: string
  pricePerKit: string
  markIncoming?: boolean
  markArrived?: boolean
}

function isPayload(value: unknown): value is InventoryCostLogInput {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return (
    typeof record.slug === 'string' &&
    typeof record.productName === 'string' &&
    typeof record.strengthLabel === 'string' &&
    typeof record.vendorName === 'string' &&
    typeof record.vialQuantity === 'number' &&
    typeof record.kitQuantity === 'number' &&
    typeof record.unitsPerKit === 'number' &&
    typeof record.orderedOn === 'string' &&
    typeof record.pricePerVial === 'string' &&
    typeof record.pricePerKit === 'string'
  )
}

function parseMoney(value: string) {
  const normalized = value.replace(/[^0-9.]/g, '')
  const amount = Number(normalized || '0')
  return Number.isFinite(amount) ? amount : 0
}

function buildTotalCost(payload: InventoryCostLogInput) {
  return payload.vialQuantity * parseMoney(payload.pricePerVial) + payload.kitQuantity * parseMoney(payload.pricePerKit)
}

function buildTotalUnits(payload: Pick<InventoryCostLogInput, 'vialQuantity' | 'kitQuantity' | 'unitsPerKit'>) {
  return payload.vialQuantity + payload.kitQuantity * payload.unitsPerKit
}

function shouldMarkIncomingForInventory(inventoryOnHand: number | null | undefined) {
  return Number(inventoryOnHand ?? 0) <= 0
}

function formatInventoryCostError(errorMessage: string) {
  const normalized = errorMessage.toLowerCase()
  if (
    normalized.includes('vendor_name') ||
    normalized.includes('status') ||
    normalized.includes('vial_quantity') ||
    normalized.includes('kit_quantity') ||
    normalized.includes('units_per_kit') ||
    normalized.includes('price_per_vial') ||
    normalized.includes('price_per_kit') ||
    normalized.includes('arrived_at') ||
    normalized.includes('inventory_applied_at')
  ) {
    return 'The supply-order schema is out of date. Rerun the latest Supabase schema, then try saving this order again.'
  }

  return errorMessage
}

export async function GET() {
  const supabase = getSupabaseAdmin()
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Supabase is not configured.' }, { status: 503 })
  }

  const { data, error } = await supabase.from('inventory_purchase_logs').select('*').order('ordered_on', { ascending: false }).order('created_at', { ascending: false })
  if (error) {
    return NextResponse.json({ ok: false, error: formatInventoryCostError(error.message), detail: error.message }, { status: 502 })
  }

  return NextResponse.json({ ok: true, logs: data ?? [] })
}

export async function POST(request: Request) {
  let payload: unknown

  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON payload.' }, { status: 400 })
  }

  if (!isPayload(payload)) {
    return NextResponse.json({ ok: false, error: 'Inventory cost payload is invalid.' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Supabase is not configured.' }, { status: 503 })
  }

  const totalUnits = buildTotalUnits(payload)

  const now = new Date().toISOString()
  const { data: insertedLog, error } = await supabase
    .from('inventory_purchase_logs')
    .insert({
      slug: payload.slug,
      product_name: payload.productName,
      strength_label: payload.strengthLabel,
      vendor_name: payload.vendorName,
      status: payload.markArrived ? 'arrived' : 'ordered',
      vial_quantity: payload.vialQuantity,
      kit_quantity: payload.kitQuantity,
      units_per_kit: payload.unitsPerKit,
      ordered_on: payload.orderedOn,
      price_per_vial: parseMoney(payload.pricePerVial),
      price_per_kit: parseMoney(payload.pricePerKit),
      quantity_ordered: totalUnits,
      cost_paid: buildTotalCost(payload),
      arrived_at: payload.markArrived ? now : null,
      inventory_applied_at: null,
    })
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ ok: false, error: formatInventoryCostError(error.message), detail: error.message }, { status: 502 })
  }

  if (payload.markIncoming) {
    const { data: currentProduct } = await supabase
      .from('catalog_products')
      .select('inventory_on_hand')
      .eq('slug', payload.slug)
      .single()

    if (shouldMarkIncomingForInventory(currentProduct?.inventory_on_hand as number | null | undefined)) {
      await supabase
        .from('catalog_products')
        .update({ status: 'incoming', updated_at: new Date().toISOString() })
        .eq('slug', payload.slug)
    }
  }

  if (payload.markArrived) {
    const { data: product, error: productError } = await supabase
      .from('catalog_products')
      .select('inventory_on_hand, low_stock_threshold')
      .eq('slug', payload.slug)
      .single()

    if (productError) {
      return NextResponse.json({ ok: false, error: productError.message }, { status: 502 })
    }

    const nextInventory = Number(product.inventory_on_hand ?? 0) + totalUnits
    const nextStatus = nextInventory > 0 ? 'in_stock' : 'out_of_stock'

    const { error: inventoryError } = await supabase
      .from('catalog_products')
      .update({
        inventory_on_hand: nextInventory,
        status: nextStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('slug', payload.slug)

    if (inventoryError) {
      return NextResponse.json({ ok: false, error: inventoryError.message }, { status: 502 })
    }

    await supabase
      .from('inventory_purchase_logs')
      .update({ inventory_applied_at: now })
      .eq('id', insertedLog.id)
  }

  return NextResponse.json({ ok: true })
}

export async function PATCH(request: Request) {
  let payload: unknown

  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON payload.' }, { status: 400 })
  }

  const rawRecord = payload as Record<string, unknown>
  const id = typeof rawRecord.id === 'string' ? rawRecord.id : ''
  if (!id || !isPayload(payload)) {
    return NextResponse.json({ ok: false, error: 'Inventory cost payload is invalid.' }, { status: 400 })
  }
  const record = payload as InventoryCostLogInput

  const supabase = getSupabaseAdmin()
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Supabase is not configured.' }, { status: 503 })
  }

  const { data: existingLog, error: existingLogError } = await supabase
    .from('inventory_purchase_logs')
    .select('*')
    .eq('id', id)
    .single()

  if (existingLogError || !existingLog) {
    return NextResponse.json(
      { ok: false, error: formatInventoryCostError(existingLogError?.message || 'Supply order not found.') },
      { status: 404 },
    )
  }

  const existingUnits =
    Number(existingLog.vial_quantity ?? 0) + Number(existingLog.kit_quantity ?? 0) * Number(existingLog.units_per_kit ?? 10)
  const totalUnits = buildTotalUnits(record)
  const alreadyApplied = Boolean(existingLog.inventory_applied_at)
  const shouldRemainArrived = alreadyApplied || Boolean(record.markArrived)
  const nextStatus = shouldRemainArrived ? 'arrived' : 'ordered'
  const nextArrivedAt = shouldRemainArrived ? existingLog.arrived_at ?? new Date().toISOString() : null

  const { error } = await supabase
    .from('inventory_purchase_logs')
    .update({
      slug: record.slug,
      product_name: record.productName,
      strength_label: record.strengthLabel,
      vendor_name: record.vendorName,
      status: nextStatus,
      vial_quantity: record.vialQuantity,
      kit_quantity: record.kitQuantity,
      units_per_kit: record.unitsPerKit,
      ordered_on: record.orderedOn,
      price_per_vial: parseMoney(record.pricePerVial),
      price_per_kit: parseMoney(record.pricePerKit),
      quantity_ordered: totalUnits,
      cost_paid: buildTotalCost(record),
      arrived_at: nextArrivedAt,
    })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ ok: false, error: formatInventoryCostError(error.message), detail: error.message }, { status: 502 })
  }

  if (record.markIncoming) {
    const { data: currentProduct } = await supabase
      .from('catalog_products')
      .select('inventory_on_hand')
      .eq('slug', record.slug)
      .single()

    if (shouldMarkIncomingForInventory(currentProduct?.inventory_on_hand as number | null | undefined)) {
      await supabase
        .from('catalog_products')
        .update({ status: 'incoming', updated_at: new Date().toISOString() })
        .eq('slug', record.slug)
    }
  }

  if (shouldRemainArrived) {
    const { data: product, error: productError } = await supabase
      .from('catalog_products')
      .select('inventory_on_hand')
      .eq('slug', record.slug)
      .single()

    if (productError) {
      return NextResponse.json({ ok: false, error: formatInventoryCostError(productError.message), detail: productError.message }, { status: 502 })
    }

    const inventoryDelta = alreadyApplied ? totalUnits - existingUnits : totalUnits
    const nextInventory = Math.max(0, Number(product.inventory_on_hand ?? 0) + inventoryDelta)
    const nextProductStatus = nextInventory > 0 ? 'in_stock' : 'out_of_stock'

    const { error: inventoryError } = await supabase
      .from('catalog_products')
      .update({
        inventory_on_hand: nextInventory,
        status: nextProductStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('slug', record.slug)

    if (inventoryError) {
      return NextResponse.json({ ok: false, error: formatInventoryCostError(inventoryError.message), detail: inventoryError.message }, { status: 502 })
    }

    if (!alreadyApplied) {
      await supabase
        .from('inventory_purchase_logs')
        .update({ inventory_applied_at: new Date().toISOString() })
        .eq('id', id)
    }
  }

  return NextResponse.json({ ok: true })
}

export async function PUT(request: Request) {
  let payload: unknown

  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON payload.' }, { status: 400 })
  }

  const record = payload as Record<string, unknown>
  const id = typeof record.id === 'string' ? record.id : ''
  if (!id) {
    return NextResponse.json({ ok: false, error: 'Supply order id is required.' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Supabase is not configured.' }, { status: 503 })
  }

  const { data: log, error: logError } = await supabase
    .from('inventory_purchase_logs')
    .select('*')
    .eq('id', id)
    .single()

  if (logError || !log) {
    return NextResponse.json({ ok: false, error: formatInventoryCostError(logError?.message || 'Supply order not found.') }, { status: 404 })
  }

  if (log.inventory_applied_at) {
    return NextResponse.json({ ok: false, error: 'This supply order has already been received and applied.' }, { status: 400 })
  }

  const totalUnits = Number(log.vial_quantity ?? 0) + Number(log.kit_quantity ?? 0) * Number(log.units_per_kit ?? 10)
  const now = new Date().toISOString()

  const { data: product, error: productError } = await supabase
    .from('catalog_products')
    .select('inventory_on_hand')
    .eq('slug', log.slug)
    .single()

  if (productError) {
    return NextResponse.json({ ok: false, error: formatInventoryCostError(productError.message), detail: productError.message }, { status: 502 })
  }

  const nextInventory = Number(product.inventory_on_hand ?? 0) + totalUnits
  const nextStatus = nextInventory > 0 ? 'in_stock' : 'out_of_stock'

  const { error: updateProductError } = await supabase
    .from('catalog_products')
    .update({
      inventory_on_hand: nextInventory,
      status: nextStatus,
      updated_at: now,
    })
    .eq('slug', log.slug)

  if (updateProductError) {
    return NextResponse.json({ ok: false, error: formatInventoryCostError(updateProductError.message), detail: updateProductError.message }, { status: 502 })
  }

  const { error: updateLogError } = await supabase
    .from('inventory_purchase_logs')
    .update({
      status: 'arrived',
      arrived_at: now,
      inventory_applied_at: now,
    })
    .eq('id', id)

  if (updateLogError) {
    return NextResponse.json({ ok: false, error: formatInventoryCostError(updateLogError.message), detail: updateLogError.message }, { status: 502 })
  }

  return NextResponse.json({ ok: true, receivedUnits: totalUnits, nextInventory })
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
    return NextResponse.json({ ok: false, error: 'Cost entry id is required.' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Supabase is not configured.' }, { status: 503 })
  }

  const { error } = await supabase.from('inventory_purchase_logs').delete().eq('id', id)
  if (error) {
    return NextResponse.json({ ok: false, error: formatInventoryCostError(error.message), detail: error.message }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}
