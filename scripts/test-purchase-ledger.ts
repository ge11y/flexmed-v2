import assert from 'node:assert/strict'
import {
  getPurchaseMutationPolicy,
  getPurchaseUnitCost,
  getPurchaseUnits,
  isPurchaseReceived,
  sortPurchaseRows,
  summarizePurchaseLedger,
  type PurchaseLedgerRow,
} from '../lib/purchase-ledger'

function row(overrides: Partial<PurchaseLedgerRow> & { id: string; ordered_on: string }): PurchaseLedgerRow {
  return {
    slug: 'tirz-20mg',
    product_name: 'TIRZ',
    strength_label: '20 mg',
    vendor_name: '',
    status: 'ordered',
    vial_quantity: 0,
    kit_quantity: 0,
    units_per_kit: 10,
    price_per_vial: 0,
    price_per_kit: 0,
    cost_paid: 0,
    arrived_at: null,
    inventory_applied_at: null,
    created_at: `${overrides.ordered_on}T12:00:00Z`,
    ...overrides,
  }
}

// Units and unit cost come from vials, kits and what was paid.
const kitOrder = row({ id: 'a', ordered_on: '2026-07-02', kit_quantity: 1, units_per_kit: 10, cost_paid: 145, status: 'arrived', arrived_at: '2026-07-05T10:00:00Z' })
assert.equal(getPurchaseUnits(kitOrder), 10)
assert.equal(getPurchaseUnitCost(kitOrder), 14.5)
const looseOrder = row({ id: 'b', ordered_on: '2026-07-12', vial_quantity: 5, price_per_vial: 19, cost_paid: 95, status: 'arrived', arrived_at: '2026-07-14T10:00:00Z' })
assert.equal(getPurchaseUnitCost(looseOrder), 19)

// Received purchases are locked; ordered ones are not.
assert.equal(isPurchaseReceived(kitOrder), true)
assert.equal(getPurchaseMutationPolicy(kitOrder).canEditCost, false)
assert.equal(getPurchaseMutationPolicy(kitOrder).canDelete, false)
assert.ok(getPurchaseMutationPolicy(kitOrder).lockedReason)
const pending = row({ id: 'c', ordered_on: '2026-08-20', kit_quantity: 2, cost_paid: 260 })
assert.equal(getPurchaseMutationPolicy(pending).canEditCost, true)
assert.equal(getPurchaseMutationPolicy(pending).canDelete, true)

// Newest first, and the current cost is the latest *received* purchase even when a newer order is pending.
const sorted = sortPurchaseRows([kitOrder, pending, looseOrder])
assert.deepEqual(sorted.map((entry) => entry.id), ['c', 'b', 'a'])
const summary = summarizePurchaseLedger([kitOrder, pending, looseOrder])
assert.equal(summary.entries, 3)
assert.equal(summary.receivedEntries, 2)
assert.equal(summary.currentRow?.id, 'b')
assert.equal(summary.currentBasis, 'received')
assert.equal(summary.currentUnitCost, 19)
assert.equal(summary.totalUnits, 35)
assert.equal(summary.totalSpend, 500)
assert.equal(Number(summary.averageUnitCost?.toFixed(4)), Number((500 / 35).toFixed(4)))
assert.equal(summary.lastPurchaseOn, '2026-08-20')

// With nothing received yet, the latest order is the working number and says so.
const onlyOrdered = summarizePurchaseLedger([pending])
assert.equal(onlyOrdered.currentBasis, 'ordered')
assert.equal(onlyOrdered.currentUnitCost, 13)

// Two restocks of the same SKU are two rows; summarizing never collapses them.
const twice = summarizePurchaseLedger([kitOrder, looseOrder])
assert.equal(twice.entries, 2)
assert.equal(twice.currentUnitCost, 19)

console.log('purchase ledger: all assertions passed')
