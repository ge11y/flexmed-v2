'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { AdminShell } from '@/components/AdminShell'
import type { CatalogInventoryRecord } from '@/lib/catalog-admin'
import { getPurchaseMutationPolicy } from '@/lib/purchase-ledger'

type CostLog = {
  id: string
  slug: string
  product_name: string
  strength_label: string
  vendor_name?: string
  note?: string | null
  status?: 'ordered' | 'arrived'
  vial_quantity?: number
  kit_quantity?: number
  units_per_kit?: number
  quantity_ordered: number
  ordered_on: string
  price_per_vial?: string | number
  price_per_kit?: string | number
  cost_paid: string
  arrived_at?: string | null
  inventory_applied_at?: string | null
  created_at: string
}

function parseMoney(value: string | number | null | undefined) {
  const normalized = String(value ?? '').replace(/[^0-9.]/g, '')
  const amount = Number(normalized || '0')
  return Number.isFinite(amount) ? amount : 0
}

function getSupplyOrderUnits(input: {
  vial_quantity?: number | null
  kit_quantity?: number | null
  units_per_kit?: number | null
}) {
  return Number(input.vial_quantity ?? 0) + Number(input.kit_quantity ?? 0) * Number(input.units_per_kit ?? 10)
}

function getSupplyOrderAveragePricePerVial(input: {
  vial_quantity?: number | null
  kit_quantity?: number | null
  units_per_kit?: number | null
  price_per_vial?: string | number | null
  price_per_kit?: string | number | null
}) {
  const totalUnits = getSupplyOrderUnits(input)
  if (totalUnits <= 0) return 0

  const totalCost =
    Number(input.vial_quantity ?? 0) * parseMoney(input.price_per_vial) +
    Number(input.kit_quantity ?? 0) * parseMoney(input.price_per_kit)

  return totalCost / totalUnits
}

export default function AdminSupplyPage() {
  const formCardRef = useRef<HTMLDivElement | null>(null)
  const [costLogs, setCostLogs] = useState<CostLog[]>([])
  const [catalogRecords, setCatalogRecords] = useState<CatalogInventoryRecord[]>([])
  const [costMessage, setCostMessage] = useState('')
  const [savingCost, setSavingCost] = useState(false)
  const [receivingId, setReceivingId] = useState<string | null>(null)
  const [editingCostId, setEditingCostId] = useState<string | null>(null)
  const [costForm, setCostForm] = useState({
    slug: '',
    productName: '',
    strengthLabel: '',
    vendorName: '',
    note: '',
    vialQuantity: '0',
    kitQuantity: '0',
    unitsPerKit: '10',
    orderedOn: new Date().toISOString().slice(0, 10),
    pricePerVial: '',
    pricePerKit: '',
    markIncoming: true,
  })

  function resetCostForm() {
    setEditingCostId(null)
    setCostForm({
      slug: '',
      productName: '',
      strengthLabel: '',
      vendorName: '',
      note: '',
      vialQuantity: '0',
      kitQuantity: '0',
      unitsPerKit: '10',
      orderedOn: new Date().toISOString().slice(0, 10),
      pricePerVial: '',
      pricePerKit: '',
      markIncoming: true,
    })
  }

  useEffect(() => {
    let active = true

    async function load() {
      const [costsResponse, catalogResponse] = await Promise.all([
        fetch('/api/admin/inventory-costs', { cache: 'no-store' }),
        fetch('/api/catalog-source', { cache: 'no-store' }),
      ])

      const costsResult = (await costsResponse.json()) as { ok: boolean; logs?: CostLog[] }
      const catalogResult = (await catalogResponse.json()) as { ok: boolean; records?: CatalogInventoryRecord[] }

      if (!active) return
      if (costsResponse.ok && costsResult.ok) setCostLogs(costsResult.logs ?? [])
      if (catalogResponse.ok && catalogResult.ok) setCatalogRecords(catalogResult.records ?? [])
    }

    void load()
    return () => {
      active = false
    }
  }, [])

  const selectedCostRecord = useMemo(
    () => catalogRecords.find((record) => record.slug === costForm.slug) ?? null,
    [catalogRecords, costForm.slug],
  )

  const orderedLogs = useMemo(
    () => costLogs.filter((entry) => entry.status !== 'arrived' && !entry.inventory_applied_at),
    [costLogs],
  )
  const arrivedLogs = useMemo(
    () => costLogs.filter((entry) => entry.status === 'arrived' || entry.inventory_applied_at),
    [costLogs],
  )
  const totalSpend = useMemo(() => costLogs.reduce((sum, log) => sum + Number(log.cost_paid || 0), 0), [costLogs])
  const totalIncomingVials = useMemo(
    () =>
      orderedLogs.reduce(
        (sum, log) => sum + Number(log.vial_quantity ?? 0) + Number(log.kit_quantity ?? 0) * Number(log.units_per_kit ?? 10),
        0,
      ),
    [orderedLogs],
  )
  const liveAveragePricePerVial = useMemo(
    () =>
      getSupplyOrderAveragePricePerVial({
        vial_quantity: Number(costForm.vialQuantity || '0'),
        kit_quantity: Number(costForm.kitQuantity || '0'),
        units_per_kit: Number(costForm.unitsPerKit || '10'),
        price_per_vial: costForm.pricePerVial,
        price_per_kit: costForm.pricePerKit,
      }),
    [costForm.kitQuantity, costForm.pricePerKit, costForm.pricePerVial, costForm.unitsPerKit, costForm.vialQuantity],
  )

  async function refreshCosts() {
    const response = await fetch('/api/admin/inventory-costs', { cache: 'no-store' })
    const result = (await response.json()) as { ok: boolean; logs?: CostLog[] }
    if (response.ok && result.ok) setCostLogs(result.logs ?? [])
  }

  async function refreshCatalogRecords() {
    const response = await fetch('/api/catalog-source', { cache: 'no-store' })
    const result = (await response.json()) as { ok: boolean; records?: CatalogInventoryRecord[] }
    if (response.ok && result.ok) setCatalogRecords(result.records ?? [])
  }

  async function saveCostEntry() {
    const payloadSlug = selectedCostRecord?.slug || costForm.slug.trim()
    const payloadProductName = selectedCostRecord?.displayName || costForm.productName.trim()

    if (!payloadSlug || !payloadProductName) {
      setCostMessage('Choose the product first, or use the existing order product while editing.')
      return
    }

    setSavingCost(true)
    setCostMessage('')

    try {
      const response = await fetch('/api/admin/inventory-costs', {
        method: editingCostId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(editingCostId ? { id: editingCostId } : {}),
          slug: payloadSlug,
          productName: payloadProductName,
          strengthLabel:
            costForm.strengthLabel ||
            (selectedCostRecord ? `${selectedCostRecord.strength} ${selectedCostRecord.unit}` : ''),
          vendorName: costForm.vendorName,
          note: costForm.note,
          vialQuantity: Number(costForm.vialQuantity || '0'),
          kitQuantity: Number(costForm.kitQuantity || '0'),
          unitsPerKit: Number(costForm.unitsPerKit || '10'),
          orderedOn: costForm.orderedOn,
          pricePerVial: costForm.pricePerVial,
          pricePerKit: costForm.pricePerKit,
          markIncoming: costForm.markIncoming,
        }),
      })
      const result = (await response.json()) as { ok?: boolean; error?: string }
      if (!response.ok || !result.ok) {
        setCostMessage(result.error || 'Supply order could not be saved.')
        return
      }

      setCostMessage('Supply order saved.')
      resetCostForm()
      await Promise.all([refreshCosts(), refreshCatalogRecords()])
    } catch {
      setCostMessage('Supply order could not be saved.')
    } finally {
      setSavingCost(false)
    }
  }

  async function markArrived(entry: CostLog) {
    setReceivingId(entry.id)
    setCostMessage('')
    try {
      const response = await fetch('/api/admin/inventory-costs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: entry.id }),
      })
      const result = (await response.json()) as { ok?: boolean; error?: string; receivedUnits?: number }
      if (!response.ok || !result.ok) {
        setCostMessage(result.error || 'This supply order could not be marked arrived.')
        return
      }
      setCostMessage(`Supply order received. ${result.receivedUnits ?? 0} vial units were added to inventory.`)
      await Promise.all([refreshCosts(), refreshCatalogRecords()])
    } catch {
      setCostMessage('This supply order could not be marked arrived.')
    } finally {
      setReceivingId(null)
    }
  }

  function editCostEntry(entry: CostLog) {
    const policy = getPurchaseMutationPolicy(entry)
    if (!policy.canEditCost) {
      setCostMessage(policy.lockedReason ?? 'This purchase is locked.')
      return
    }
    setEditingCostId(entry.id)
    setCostForm({
      slug: entry.slug,
      productName: entry.product_name,
      strengthLabel: entry.strength_label,
      vendorName: entry.vendor_name ?? '',
      note: entry.note ?? '',
      vialQuantity: String(entry.vial_quantity ?? 0),
      kitQuantity: String(entry.kit_quantity ?? 0),
      unitsPerKit: String(entry.units_per_kit ?? 10),
      orderedOn: entry.ordered_on,
      pricePerVial: String(entry.price_per_vial ?? ''),
      pricePerKit: String(entry.price_per_kit ?? ''),
      markIncoming: entry.status !== 'arrived',
    })
    setCostMessage(`Editing ${entry.product_name} ${entry.strength_label}. Update the fields below, then press Update Supply Order.`)
    window.setTimeout(() => {
      formCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }

  async function deleteCostEntry(id: string) {
    const entry = costLogs.find((item) => item.id === id)
    const policy = entry ? getPurchaseMutationPolicy(entry) : null
    if (policy && !policy.canDelete) {
      setCostMessage(policy.lockedReason ?? 'This purchase is locked.')
      return
    }
    const confirmed = window.confirm('Delete this supply order entry?')
    if (!confirmed) return

    const response = await fetch('/api/admin/inventory-costs', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    const result = (await response.json()) as { ok?: boolean; error?: string }
    if (!response.ok || !result.ok) {
      setCostMessage(result.error || 'Supply order could not be deleted.')
      return
    }
    setCostMessage('Supply order deleted.')
    await refreshCosts()
  }

  return (
    <AdminShell
      active="/admin/supply"
      title="Supply Orders"
      description="Track vendor orders, mark products incoming, and only add inventory when founder confirms the shipment has arrived."
      purpose="Use this page as the source of truth for inbound supply. Orders placed with vendors live here first, then they move inventory only when they arrive."
      workflow={[
        'Choose the product and strength being ordered from the vendor.',
        'Enter vials, kits, pricing, and vendor details.',
        'Save the supply order to mark that product incoming.',
        'When the shipment arrives, press Mark Arrived to add the units into inventory.',
      ]}
      teamNotes={[
        'One kit defaults to 10 vials, but you can adjust that number per order.',
        'Incoming means the founder has placed the replenishment order but it has not landed yet.',
        'Inventory only increases when a supply order is marked arrived.',
        'Every restock is a new supply order. Received orders can no longer be edited or deleted, so the purchase-cost history stays complete.',
      ]}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
        {[
          ['Supply Orders', String(costLogs.length)],
          ['Ordered', String(orderedLogs.length)],
          ['Arrived', String(arrivedLogs.length)],
          ['Incoming Vials', String(totalIncomingVials)],
          ['Total Spend', `$${totalSpend.toFixed(2)}`],
        ].map(([label, value]) => (
          <div key={label} className="card" style={{ padding: '18px', display: 'grid', gap: '8px' }}>
            <div className="section-label">{label}</div>
            <div style={{ fontSize: '28px', fontWeight: 600 }}>{value}</div>
          </div>
        ))}
      </div>

      <div
        ref={formCardRef}
        className="card"
        style={{
          padding: '18px',
          display: 'grid',
          gap: '14px',
          border: editingCostId ? '1px solid rgba(96, 165, 250, 0.55)' : undefined,
          boxShadow: editingCostId ? '0 0 0 3px rgba(59, 130, 246, 0.12)' : undefined,
        }}
      >
          <div>
          <div className="section-label">{editingCostId ? 'Edit Supply Order' : 'New Supply Order'}</div>
          <div style={{ color: 'var(--text-secondary)', marginTop: '6px' }}>
            {editingCostId
              ? 'Update the quantities, pricing, or vendor details of an order that has not arrived yet. Received orders are locked as cost history; log a new order for a restock.'
              : 'Add vendor orders here. If you need something like BAC water first, add it in Inventory, then come back and select it here.'}
          </div>
        </div>

        <div style={{ display: 'grid', gap: '10px' }}>
          <div style={{ display: 'grid', gap: '8px' }}>
            <label className="section-label">Product</label>
            <select
              value={costForm.slug}
              onChange={(event) => {
                const slug = event.target.value
                const record = catalogRecords.find((item) => item.slug === slug)
                setCostForm((current) => ({
                  ...current,
                  slug,
                  productName: record?.displayName ?? current.productName,
                  strengthLabel: record ? `${record.strength} ${record.unit}` : '',
                }))
              }}
              style={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '12px 14px', fontSize: '14px' }}
            >
              <option value="">Select product</option>
              {catalogRecords.filter((record) => !record.archived).map((record) => (
                <option key={record.slug} value={record.slug}>
                  {record.displayName} {record.strength} {record.unit}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px' }}>
            <div style={{ display: 'grid', gap: '8px' }}>
              <label className="section-label">Strength</label>
              <input value={costForm.strengthLabel} onChange={(event) => setCostForm((current) => ({ ...current, strengthLabel: event.target.value }))} style={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '12px 14px', fontSize: '14px' }} />
            </div>
            <div style={{ display: 'grid', gap: '8px' }}>
              <label className="section-label">Vendor</label>
              <input value={costForm.vendorName} onChange={(event) => setCostForm((current) => ({ ...current, vendorName: event.target.value }))} placeholder="Distributor or vendor" style={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '12px 14px', fontSize: '14px' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gap: '8px' }}>
            <label className="section-label">Note</label>
            <input value={costForm.note} onChange={(event) => setCostForm((current) => ({ ...current, note: event.target.value }))} placeholder="Optional, e.g. lot number or why this order was placed" style={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '12px 14px', fontSize: '14px' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px' }}>
            <div style={{ display: 'grid', gap: '8px' }}>
              <label className="section-label">Vials Ordered</label>
              <input type="number" min="0" value={costForm.vialQuantity} onChange={(event) => setCostForm((current) => ({ ...current, vialQuantity: event.target.value }))} style={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '12px 14px', fontSize: '14px' }} />
            </div>
            <div style={{ display: 'grid', gap: '8px' }}>
              <label className="section-label">Kits Ordered</label>
              <input type="number" min="0" value={costForm.kitQuantity} onChange={(event) => setCostForm((current) => ({ ...current, kitQuantity: event.target.value }))} style={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '12px 14px', fontSize: '14px' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '10px' }}>
            <div style={{ display: 'grid', gap: '8px' }}>
              <label className="section-label">Vials Per Kit</label>
              <input type="number" min="1" value={costForm.unitsPerKit} onChange={(event) => setCostForm((current) => ({ ...current, unitsPerKit: event.target.value }))} style={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '12px 14px', fontSize: '14px' }} />
            </div>
            <div style={{ display: 'grid', gap: '8px' }}>
              <label className="section-label">Price Per Vial</label>
              <input value={costForm.pricePerVial} onChange={(event) => setCostForm((current) => ({ ...current, pricePerVial: event.target.value }))} placeholder="$0.00" style={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '12px 14px', fontSize: '14px' }} />
            </div>
            <div style={{ display: 'grid', gap: '8px' }}>
              <label className="section-label">Price Per Kit</label>
              <input value={costForm.pricePerKit} onChange={(event) => setCostForm((current) => ({ ...current, pricePerKit: event.target.value }))} placeholder="$0.00" style={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '12px 14px', fontSize: '14px' }} />
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '10px',
              padding: '12px 14px',
              borderRadius: '12px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
              <div className="section-label" style={{ fontSize: '11px' }}>Total Incoming Vials</div>
              <div style={{ marginTop: '4px', color: 'var(--text-primary)', fontWeight: 600 }}>
                {getSupplyOrderUnits({
                  vial_quantity: Number(costForm.vialQuantity || '0'),
                  kit_quantity: Number(costForm.kitQuantity || '0'),
                  units_per_kit: Number(costForm.unitsPerKit || '10'),
                })}
              </div>
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
              <div className="section-label" style={{ fontSize: '11px' }}>Average Price Per Vial</div>
              <div style={{ marginTop: '4px', color: 'var(--text-primary)', fontWeight: 600 }}>
                ${liveAveragePricePerVial.toFixed(2)}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px', alignItems: 'end' }}>
            <div style={{ display: 'grid', gap: '8px' }}>
              <label className="section-label">Date Ordered</label>
              <input type="date" value={costForm.orderedOn} onChange={(event) => setCostForm((current) => ({ ...current, orderedOn: event.target.value }))} style={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '12px 14px', fontSize: '14px' }} />
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              {editingCostId ? (
                <button type="button" className="fm-btn-outline" onClick={resetCostForm} disabled={savingCost}>
                  Cancel Edit
                </button>
              ) : null}
              <button type="button" className="fm-btn-primary" onClick={saveCostEntry} disabled={savingCost}>
                {savingCost ? 'Saving...' : editingCostId ? 'Update Supply Order' : 'Save Supply Order'}
              </button>
            </div>
          </div>

          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '13px' }}>
            <input type="checkbox" checked={costForm.markIncoming} onChange={(event) => setCostForm((current) => ({ ...current, markIncoming: event.target.checked }))} />
            Mark this product incoming as soon as the vendor order is placed
          </label>
        </div>

        {costMessage ? <div style={{ color: 'var(--text-secondary)' }}>{costMessage}</div> : null}
      </div>

      <div className="card" style={{ padding: '18px', display: 'grid', gap: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <div className="section-label">Supply Order Queue</div>
            <div style={{ color: 'var(--text-secondary)', marginTop: '6px' }}>
              Ordered items stay incoming until founder confirms they arrived. Then the vial amount is added to inventory automatically.
            </div>
          </div>
          <Link href="/admin/inventory" className="fm-btn-outline" style={{ textDecoration: 'none' }}>
            Open Inventory
          </Link>
        </div>

        {costLogs.length === 0 ? (
          <div style={{ color: 'var(--text-muted)' }}>No supply orders saved yet.</div>
        ) : (
          <div style={{ display: 'grid', gap: '10px' }}>
            {costLogs.map((entry) => {
              const totalUnits = Number(entry.vial_quantity ?? 0) + Number(entry.kit_quantity ?? 0) * Number(entry.units_per_kit ?? 10)
              const isArrived = entry.status === 'arrived' || Boolean(entry.inventory_applied_at)
              return (
                <div key={entry.id} className="card" style={{ padding: '14px', display: 'grid', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'start', flexWrap: 'wrap' }}>
                    <div>
                      <strong style={{ color: 'var(--text-primary)' }}>{entry.product_name}</strong>
                      <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '4px' }}>
                        {entry.strength_label} • {entry.vendor_name || 'No vendor'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span className={`badge ${isArrived ? 'badge-green' : 'badge-amber'}`}>
                        {isArrived ? 'Arrived' : 'Ordered'}
                      </span>
                      <div style={{ fontWeight: 600 }}>${Number(entry.cost_paid || 0).toFixed(2)}</div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px' }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                      <div className="section-label" style={{ fontSize: '11px' }}>Date Ordered</div>
                      <div style={{ marginTop: '4px' }}>{entry.ordered_on}</div>
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                      <div className="section-label" style={{ fontSize: '11px' }}>Vials</div>
                      <div style={{ marginTop: '4px' }}>{entry.vial_quantity ?? 0}</div>
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                      <div className="section-label" style={{ fontSize: '11px' }}>Kits</div>
                      <div style={{ marginTop: '4px' }}>{entry.kit_quantity ?? 0}</div>
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                      <div className="section-label" style={{ fontSize: '11px' }}>Vials Per Kit</div>
                      <div style={{ marginTop: '4px' }}>{entry.units_per_kit ?? 10}</div>
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                      <div className="section-label" style={{ fontSize: '11px' }}>Total Incoming</div>
                      <div style={{ marginTop: '4px' }}>{totalUnits} vials</div>
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                      <div className="section-label" style={{ fontSize: '11px' }}>Avg / Vial</div>
                      <div style={{ marginTop: '4px' }}>
                        $
                        {getSupplyOrderAveragePricePerVial({
                          vial_quantity: entry.vial_quantity,
                          kit_quantity: entry.kit_quantity,
                          units_per_kit: entry.units_per_kit,
                          price_per_vial: entry.price_per_vial,
                          price_per_kit: entry.price_per_kit,
                        }).toFixed(2)}
                      </div>
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                      <div className="section-label" style={{ fontSize: '11px' }}>Arrived</div>
                      <div style={{ marginTop: '4px' }}>{entry.arrived_at ? new Date(entry.arrived_at).toLocaleString() : 'Not yet'}</div>
                    </div>
                    {entry.note ? (
                      <div style={{ color: 'var(--text-secondary)', fontSize: '13px', gridColumn: '1 / -1' }}>
                        <div className="section-label" style={{ fontSize: '11px' }}>Note</div>
                        <div style={{ marginTop: '4px' }}>{entry.note}</div>
                      </div>
                    ) : null}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    {!isArrived ? (
                      <button type="button" className="fm-btn-primary" style={{ padding: '8px 10px', fontSize: '12px' }} onClick={() => markArrived(entry)} disabled={receivingId === entry.id}>
                        {receivingId === entry.id ? 'Applying...' : 'Mark Arrived'}
                      </button>
                    ) : null}
                    {getPurchaseMutationPolicy(entry).canEditCost ? (
                      <>
                        <button type="button" className="fm-btn-outline" style={{ padding: '8px 10px', fontSize: '12px' }} onClick={() => editCostEntry(entry)}>
                          Edit
                        </button>
                        <button type="button" className="fm-btn-outline" style={{ padding: '8px 10px', fontSize: '12px' }} onClick={() => deleteCostEntry(entry.id)}>
                          Delete
                        </button>
                      </>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '12px', alignSelf: 'center' }}>Received · locked as cost history</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AdminShell>
  )
}
