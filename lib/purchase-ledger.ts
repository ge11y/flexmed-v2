// ============================================================
// Purchase cost ledger (admin only)
//
// Every restock is one row in inventory_purchase_logs. A row that has been
// received is part of the cost history: its quantities and costs are never
// overwritten or deleted, and a restock always adds a new row. The current
// cost of a SKU is the unit cost of its most recent received purchase; the
// earlier purchases stay visible underneath it. Nothing here is used by the
// public storefront.
// ============================================================

export interface PurchaseLedgerRow {
  id: string
  slug: string
  product_name: string
  strength_label: string
  vendor_name?: string | null
  note?: string | null
  status?: string | null
  vial_quantity?: number | null
  kit_quantity?: number | null
  units_per_kit?: number | null
  quantity_ordered?: number | null
  ordered_on: string
  price_per_vial?: string | number | null
  price_per_kit?: string | number | null
  cost_paid?: string | number | null
  arrived_at?: string | null
  inventory_applied_at?: string | null
  created_at?: string | null
}

export interface PurchaseMutationPolicy {
  canEditCost: boolean
  canDelete: boolean
  lockedReason: string | null
}

export interface PurchaseLedgerSummary {
  entries: number
  receivedEntries: number
  currentRow: PurchaseLedgerRow | null
  currentBasis: 'received' | 'ordered' | null
  currentUnitCost: number | null
  averageUnitCost: number | null
  totalUnits: number
  totalSpend: number
  lastPurchaseOn: string | null
  lastVendor: string
}

export const RECEIVED_PURCHASE_LOCK_REASON =
  'This purchase has been received and is part of the cost history. It cannot be changed or deleted; log a new purchase for a restock or a correction.'

export function parseMoney(value: string | number | null | undefined): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  const normalized = String(value ?? '').replace(/[^0-9.]/g, '')
  const amount = Number(normalized || '0')
  return Number.isFinite(amount) ? amount : 0
}

export function formatMoney(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

/** Vials in the purchase: loose vials plus kits multiplied by vials per kit. */
export function getPurchaseUnits(row: Pick<PurchaseLedgerRow, 'vial_quantity' | 'kit_quantity' | 'units_per_kit'>) {
  return Number(row.vial_quantity ?? 0) + Number(row.kit_quantity ?? 0) * Number(row.units_per_kit ?? 10)
}

/** What was paid for the purchase: the stored total, or the line prices when no total was stored. */
export function getPurchaseTotalCost(row: PurchaseLedgerRow) {
  const paid = parseMoney(row.cost_paid)
  if (paid > 0) return paid
  return Number(row.vial_quantity ?? 0) * parseMoney(row.price_per_vial) + Number(row.kit_quantity ?? 0) * parseMoney(row.price_per_kit)
}

/** Cost per vial for the purchase, or null when nothing can be derived. */
export function getPurchaseUnitCost(row: PurchaseLedgerRow): number | null {
  const units = getPurchaseUnits(row)
  if (units > 0) return getPurchaseTotalCost(row) / units
  const perVial = parseMoney(row.price_per_vial)
  return perVial > 0 ? perVial : null
}

export function isPurchaseReceived(row: Pick<PurchaseLedgerRow, 'status' | 'inventory_applied_at'>) {
  return row.status === 'arrived' || Boolean(row.inventory_applied_at)
}

/** The date the purchase counts from: arrival when received, otherwise the order date. */
export function getPurchaseDate(row: PurchaseLedgerRow) {
  if (isPurchaseReceived(row) && row.arrived_at) return row.arrived_at.slice(0, 10)
  return row.ordered_on
}

export function getPurchaseMutationPolicy(row: Pick<PurchaseLedgerRow, 'status' | 'inventory_applied_at'>): PurchaseMutationPolicy {
  if (isPurchaseReceived(row)) {
    return { canEditCost: false, canDelete: false, lockedReason: RECEIVED_PURCHASE_LOCK_REASON }
  }
  return { canEditCost: true, canDelete: true, lockedReason: null }
}

/** Newest first, by the date the purchase counts from, then by creation time. */
export function sortPurchaseRows(rows: PurchaseLedgerRow[]) {
  return [...rows].sort(
    (a, b) =>
      getPurchaseDate(b).localeCompare(getPurchaseDate(a)) || String(b.created_at ?? '').localeCompare(String(a.created_at ?? '')),
  )
}

export function groupPurchaseRowsBySlug(rows: PurchaseLedgerRow[]) {
  const grouped = new Map<string, PurchaseLedgerRow[]>()
  for (const row of rows) {
    const existing = grouped.get(row.slug)
    if (existing) existing.push(row)
    else grouped.set(row.slug, [row])
  }
  return grouped
}

export function summarizePurchaseLedger(rows: PurchaseLedgerRow[]): PurchaseLedgerSummary {
  const sorted = sortPurchaseRows(rows)
  const received = sorted.filter(isPurchaseReceived)
  const currentRow = received[0] ?? sorted[0] ?? null
  const currentBasis = currentRow ? (isPurchaseReceived(currentRow) ? 'received' : 'ordered') : null

  const totalUnits = rows.reduce((sum, row) => sum + getPurchaseUnits(row), 0)
  const totalSpend = rows.reduce((sum, row) => sum + getPurchaseTotalCost(row), 0)
  const priced = rows.filter((row) => getPurchaseUnits(row) > 0)
  const pricedUnits = priced.reduce((sum, row) => sum + getPurchaseUnits(row), 0)
  const pricedSpend = priced.reduce((sum, row) => sum + getPurchaseTotalCost(row), 0)
  const last = sorted[0] ?? null

  return {
    entries: rows.length,
    receivedEntries: received.length,
    currentRow,
    currentBasis,
    currentUnitCost: currentRow ? getPurchaseUnitCost(currentRow) : null,
    averageUnitCost: pricedUnits > 0 ? pricedSpend / pricedUnits : null,
    totalUnits,
    totalSpend,
    lastPurchaseOn: last ? getPurchaseDate(last) : null,
    lastVendor: last?.vendor_name?.trim() ?? '',
  }
}
