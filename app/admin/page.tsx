'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { AdminShell } from '@/components/AdminShell'
import { getPurchaseMutationPolicy } from '@/lib/purchase-ledger'
import type { ManualOrderSubmission, ManualPaymentProofSubmission } from '@/lib/manual-orders'
import type { CatalogInventoryRecord } from '@/lib/catalog-admin'
import type { AdminSettingsPayload } from '@/lib/admin-settings'

type ClientSummary = {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string
  createdAt: string
  orderCount: number
  completedCount: number
  pendingCount: number
  totalSpent: number
  latestOrderAt: string | null
  lastStatus: ManualOrderSubmission['status'] | null
}

type CostLog = {
  id: string
  slug: string
  product_name: string
  strength_label: string
  vendor_name?: string
  status?: 'ordered' | 'arrived'
  vial_quantity?: number
  kit_quantity?: number
  units_per_kit?: number
  quantity_ordered: number
  ordered_on: string
  price_per_vial?: string | number
  price_per_kit?: string | number
  cost_paid: string
  created_at: string
}

function getSupplyOrderUnits(log: {
  vial_quantity?: number | null
  kit_quantity?: number | null
  units_per_kit?: number | null
}) {
  return Number(log.vial_quantity ?? 0) + Number(log.kit_quantity ?? 0) * Number(log.units_per_kit ?? 10)
}

function getSupplyOrderAveragePricePerVial(log: {
  vial_quantity?: number | null
  kit_quantity?: number | null
  units_per_kit?: number | null
  cost_paid?: string | number | null
}) {
  const totalUnits = getSupplyOrderUnits(log)
  if (totalUnits <= 0) return 0
  return Number(log.cost_paid ?? 0) / totalUnits
}

export default function AdminOverviewPage() {
  const [orders, setOrders] = useState<ManualOrderSubmission[]>([])
  const [proofs, setProofs] = useState<ManualPaymentProofSubmission[]>([])
  const [clients, setClients] = useState<ClientSummary[]>([])
  const [costLogs, setCostLogs] = useState<CostLog[]>([])
  const [catalogRecords, setCatalogRecords] = useState<CatalogInventoryRecord[]>([])
  const [settings, setSettings] = useState<AdminSettingsPayload | null>(null)
  const [costMessage, setCostMessage] = useState('')
  const [savingCost, setSavingCost] = useState(false)
  const [editingCostId, setEditingCostId] = useState<string | null>(null)
  const [costForm, setCostForm] = useState({
    slug: '',
    strengthLabel: '',
    vendorName: '',
    vialQuantity: '0',
    kitQuantity: '0',
    unitsPerKit: '10',
    orderedOn: new Date().toISOString().slice(0, 10),
    pricePerVial: '',
    pricePerKit: '',
    markIncoming: true,
  })
  const [loading, setLoading] = useState(true)
  const [pendingFilter, setPendingFilter] = useState<'all' | 'needs_review' | 'waiting_to_ship' | 'shipped'>('all')
  const [showAllLowStock, setShowAllLowStock] = useState(false)
  const [showAllOutOfStock, setShowAllOutOfStock] = useState(false)

  const load = useCallback(async () => {
    try {
      const [ordersResponse, clientsResponse, costsResponse, catalogResponse, settingsResponse] = await Promise.all([
        fetch('/api/admin/orders', { cache: 'no-store' }),
        fetch('/api/admin/clients', { cache: 'no-store' }),
        fetch('/api/admin/inventory-costs', { cache: 'no-store' }),
        fetch('/api/catalog-source', { cache: 'no-store' }),
        fetch('/api/admin/settings', { cache: 'no-store' }),
      ])

      const ordersResult = (await ordersResponse.json()) as {
        ok: boolean
        orders?: ManualOrderSubmission[]
        proofs?: ManualPaymentProofSubmission[]
      }
      const clientsResult = (await clientsResponse.json()) as { ok: boolean; clients?: ClientSummary[] }
      const costsResult = (await costsResponse.json()) as { ok: boolean; logs?: CostLog[] }
      const catalogResult = (await catalogResponse.json()) as { ok: boolean; records?: CatalogInventoryRecord[] }
      const settingsResult = (await settingsResponse.json()) as { ok: boolean; settings?: AdminSettingsPayload }

      if (ordersResponse.ok && ordersResult.ok) {
        setOrders(ordersResult.orders ?? [])
        setProofs(ordersResult.proofs ?? [])
      }
      if (clientsResponse.ok && clientsResult.ok) {
        setClients(clientsResult.clients ?? [])
      }
      if (costsResponse.ok && costsResult.ok) {
        setCostLogs(costsResult.logs ?? [])
      }
      if (catalogResponse.ok && catalogResult.ok) {
        setCatalogRecords(catalogResult.records ?? [])
      }
      if (settingsResponse.ok && settingsResult.ok && settingsResult.settings) {
        setSettings(settingsResult.settings)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()

    const interval = window.setInterval(() => {
      void load()
    }, 10000)

    const handleFocus = () => {
      void load()
    }

    window.addEventListener('focus', handleFocus)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', handleFocus)
    }
  }, [load])

  const pendingOrders = useMemo(() => orders.filter((order) => order.status !== 'fulfilled'), [orders])
  const proofReceivedCount = useMemo(() => orders.filter((order) => order.paymentProofStatus === 'submitted').length, [orders])
  const totalRevenue = useMemo(() => orders.reduce((sum, order) => sum + order.order.totals.total, 0), [orders])
  const pendingRevenue = useMemo(
    () => pendingOrders.reduce((sum, order) => sum + order.order.totals.total, 0),
    [pendingOrders],
  )
  const totalSpend = useMemo(() => costLogs.reduce((sum, log) => sum + Number(log.cost_paid || 0), 0), [costLogs])
  const historicalAverageSpendPerVial = useMemo(() => {
    const totalUnits = costLogs.reduce((sum, log) => sum + getSupplyOrderUnits(log), 0)
    if (totalUnits <= 0) return 0
    return totalSpend / totalUnits
  }, [costLogs, totalSpend])
  const shippedCount = useMemo(() => orders.filter((order) => order.status === 'shipped').length, [orders])
  const outOfStockItems = useMemo(
    () => catalogRecords.filter((record) => !record.archived && record.status === 'out_of_stock'),
    [catalogRecords],
  )
  const lowStockItems = useMemo(() => {
    const threshold = settings?.inventoryDefaults.lowStockThreshold ?? 4
    return catalogRecords
      .filter((record) => {
        if (record.archived) return false
        if (record.status !== 'in_stock') return false
        if (record.inventoryOnHand === null || record.inventoryOnHand === undefined) return false
        return record.inventoryOnHand <= (record.lowStockThreshold ?? threshold)
      })
      .sort((a, b) => {
        const left = a.inventoryOnHand ?? Number.MAX_SAFE_INTEGER
        const right = b.inventoryOnHand ?? Number.MAX_SAFE_INTEGER
        if (left !== right) return left - right
        return a.displayName.localeCompare(b.displayName)
      })
  }, [catalogRecords, settings])
  const visibleLowStockItems = useMemo(
    () => (showAllLowStock ? lowStockItems : lowStockItems.slice(0, 6)),
    [lowStockItems, showAllLowStock],
  )
  const sortedOutOfStockItems = useMemo(
    () =>
      [...outOfStockItems].sort((a, b) => {
        const left = a.inventoryOnHand ?? 0
        const right = b.inventoryOnHand ?? 0
        if (left !== right) return left - right
        return a.displayName.localeCompare(b.displayName)
      }),
    [outOfStockItems],
  )
  const visibleOutOfStockItems = useMemo(
    () => (showAllOutOfStock ? sortedOutOfStockItems : sortedOutOfStockItems.slice(0, 6)),
    [showAllOutOfStock, sortedOutOfStockItems],
  )
  const filteredPendingOrders = useMemo(() => {
    if (pendingFilter === 'waiting_to_ship') {
      return pendingOrders.filter((order) => order.status === 'waiting_to_ship')
    }
    if (pendingFilter === 'shipped') {
      return pendingOrders.filter((order) => order.status === 'shipped')
    }
    if (pendingFilter === 'needs_review') {
      return pendingOrders.filter(
        (order) =>
          order.status === 'submitted' ||
          order.status === 'payment_pending' ||
          order.status === 'proof_received',
      )
    }
    return pendingOrders
  }, [pendingFilter, pendingOrders])
  const recentFilteredPendingOrders = useMemo(() => filteredPendingOrders.slice(0, 6), [filteredPendingOrders])
  const selectedCostRecord = useMemo(
    () => catalogRecords.find((record) => record.slug === costForm.slug) ?? null,
    [catalogRecords, costForm.slug],
  )

  async function refreshCosts() {
    const response = await fetch('/api/admin/inventory-costs', { cache: 'no-store' })
    const result = (await response.json()) as { ok: boolean; logs?: CostLog[] }
    if (response.ok && result.ok) {
      setCostLogs(result.logs ?? [])
    }
  }

  async function refreshCatalogRecords() {
    const response = await fetch('/api/catalog-source', { cache: 'no-store' })
    const result = (await response.json()) as { ok: boolean; records?: CatalogInventoryRecord[] }
    if (response.ok && result.ok) {
      setCatalogRecords(result.records ?? [])
    }
  }

  async function saveCostEntry() {
    if (!selectedCostRecord) {
      setCostMessage('Choose the product and strength first.')
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
          slug: selectedCostRecord.slug,
          productName: selectedCostRecord.displayName,
          strengthLabel: costForm.strengthLabel || `${selectedCostRecord.strength} ${selectedCostRecord.unit}`,
          vendorName: costForm.vendorName,
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
      setEditingCostId(null)
      setCostForm({
        slug: '',
        strengthLabel: '',
        vendorName: '',
        vialQuantity: '0',
        kitQuantity: '0',
        unitsPerKit: '10',
        orderedOn: new Date().toISOString().slice(0, 10),
        pricePerVial: '',
        pricePerKit: '',
        markIncoming: true,
      })
      await Promise.all([refreshCosts(), refreshCatalogRecords()])
    } catch {
      setCostMessage('Supply order could not be saved.')
    } finally {
      setSavingCost(false)
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
      strengthLabel: entry.strength_label,
      vendorName: entry.vendor_name ?? '',
      vialQuantity: String(entry.vial_quantity ?? 0),
      kitQuantity: String(entry.kit_quantity ?? 0),
      unitsPerKit: String(entry.units_per_kit ?? 10),
      orderedOn: entry.ordered_on,
      pricePerVial: String(entry.price_per_vial ?? ''),
      pricePerKit: String(entry.price_per_kit ?? ''),
      markIncoming: false,
    })
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
      active="/admin"
      title="Dashboard Overview"
      description="This is the founder home screen. Orders, clients, revenue, and spending all live here first so the team can see the whole operation at a glance."
      purpose="Use this page as the command center. Start here to see what needs attention, then open the deeper section only when you need to work an individual workflow."
      workflow={[
        'Check the top numbers to see open orders, clients, revenue, and spending.',
        'Open pending orders from this page when new work comes in.',
        'Use the spending section to watch product costs and supplier movement.',
        'Move into Orders, Clients, or Catalog only when more detail is needed.',
      ]}
      teamNotes={[
        'Pending orders are anything not marked complete.',
        'Proof received means founder still needs to confirm payment.',
        'Spending totals come from the cost log in the catalog inventory page.',
      ]}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
        {[
          ['All Orders', String(orders.length)],
          ['Pending Orders', String(pendingOrders.length)],
          ['Proof Received', String(proofReceivedCount)],
          ['Shipped', String(shippedCount)],
          ['Low Stock', String(lowStockItems.length)],
          ['Out of Stock', String(outOfStockItems.length)],
          ['Clients', String(clients.length)],
          ['Revenue', `$${totalRevenue.toFixed(2)}`],
          ['Pending Revenue', `$${pendingRevenue.toFixed(2)}`],
          ['Total Spend', `$${totalSpend.toFixed(2)}`],
          ['Avg Spend / Vial', `$${historicalAverageSpendPerVial.toFixed(2)}`],
        ].map(([label, value]) => (
          <div key={label} className="card" style={{ padding: '18px', display: 'grid', gap: '8px' }}>
            <div className="section-label">{label}</div>
            <div style={{ fontSize: '28px', fontWeight: 600 }}>{value}</div>
          </div>
        ))}
      </div>

      {loading ? <div className="card" style={{ padding: '18px', color: 'var(--text-secondary)' }}>Loading dashboard…</div> : null}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.35fr) minmax(0, 0.95fr)', gap: '18px', alignItems: 'start' }}>
        <div className="card" style={{ padding: '18px', display: 'grid', gap: '14px', alignSelf: 'start' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <div className="section-label">Pending Orders</div>
              <div style={{ color: 'var(--text-secondary)', marginTop: '6px' }}>
                Open orders grouped by stage so founder can move through the queue quickly.
              </div>
            </div>
            <Link href="/admin/orders" className="fm-btn-outline" style={{ textDecoration: 'none' }}>
              Open Orders
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '10px' }}>
            {[
              ['Needs Review', pendingOrders.filter((order) => order.status === 'submitted' || order.status === 'payment_pending' || order.status === 'proof_received').length],
              ['Waiting to Ship', pendingOrders.filter((order) => order.status === 'waiting_to_ship').length],
              ['Shipped', pendingOrders.filter((order) => order.status === 'shipped').length],
              ['Open Total', pendingOrders.length],
            ].map(([label, count]) => (
              <div key={String(label)} className="card" style={{ padding: '12px 14px', display: 'grid', gap: '4px' }}>
                <div className="section-label" style={{ fontSize: '11px' }}>{label}</div>
                <div style={{ fontSize: '22px', fontWeight: 600 }}>{count}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              ['all', 'All Pending', pendingOrders.length],
              [
                'needs_review',
                'Needs Review',
                pendingOrders.filter(
                  (order) =>
                    order.status === 'submitted' ||
                    order.status === 'payment_pending' ||
                    order.status === 'proof_received',
                ).length,
              ],
              ['waiting_to_ship', 'Waiting to Ship', pendingOrders.filter((order) => order.status === 'waiting_to_ship').length],
              ['shipped', 'Shipped', pendingOrders.filter((order) => order.status === 'shipped').length],
            ].map(([value, label, count]) => {
              const active = pendingFilter === value
              return (
                <button
                  key={String(value)}
                  type="button"
                  className={active ? 'fm-btn-primary' : 'fm-btn-outline'}
                  onClick={() => setPendingFilter(value as typeof pendingFilter)}
                  style={{ padding: '7px 10px', fontSize: '12px' }}
                >
                  {label} ({count})
                </button>
              )
            })}
          </div>

          <div style={{ display: 'grid', gap: '10px', maxHeight: '430px', overflowY: 'auto', paddingRight: '4px' }}>
            {recentFilteredPendingOrders.length === 0 ? (
              <div style={{ color: 'var(--text-muted)' }}>No orders match this stage right now.</div>
            ) : (
              recentFilteredPendingOrders.map((order) => {
                const matchingProof = proofs.find((proof) => proof.orderId === order.id)
                return (
                  <Link
                    key={order.id}
                    href={`/admin/orders?open=${order.id}`}
                    className="card"
                    style={{ padding: '12px 14px', display: 'grid', gap: '8px', textDecoration: 'none', color: 'inherit' }}
                  >
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.25fr) minmax(0, 0.9fr) auto auto', gap: '10px', alignItems: 'center' }}>
                      <strong style={{ color: 'var(--text-primary)' }}>{order.id}</strong>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {order.customer.firstName} {order.customer.lastName}
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                        ${order.order.totals.total.toFixed(2)}
                      </div>
                      <span className={`badge ${order.status === 'shipped' ? 'badge-green' : order.status === 'waiting_to_ship' ? 'badge-blue' : 'badge-amber'}`}>
                        {order.status.replaceAll('_', ' ')}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', color: 'var(--text-muted)', fontSize: '12px' }}>
                      <span>{order.order.lines.reduce((sum, line) => sum + line.quantity, 0)} items</span>
                      <span>{matchingProof ? 'Proof submitted' : 'Awaiting proof'}</span>
                      <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </div>

        <div id="supply-orders" className="card" style={{ padding: '18px', display: 'grid', gap: '14px', scrollMarginTop: '120px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <div className="section-label">Supply Orders & Spending</div>
              <div style={{ color: 'var(--text-secondary)', marginTop: '6px' }}>
                Use Supply as the source of truth for inbound vendor orders, arrival tracking, and inventory increases.
              </div>
            </div>
            <Link href="/admin/supply" className="fm-btn-outline" style={{ textDecoration: 'none' }}>
              Open Supply
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
            <div className="card" style={{ padding: '16px', display: 'grid', gap: '6px' }}>
              <div className="section-label">Cost Entries</div>
              <div style={{ fontSize: '24px', fontWeight: 600 }}>{costLogs.length}</div>
            </div>
            <div className="card" style={{ padding: '16px', display: 'grid', gap: '6px' }}>
              <div className="section-label">Total Spend</div>
              <div style={{ fontSize: '24px', fontWeight: 600 }}>${totalSpend.toFixed(2)}</div>
            </div>
            <div className="card" style={{ padding: '16px', display: 'grid', gap: '6px' }}>
              <div className="section-label">Revenue Less Spend</div>
              <div style={{ fontSize: '24px', fontWeight: 600 }}>${(totalRevenue - totalSpend).toFixed(2)}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
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
                      strengthLabel: record ? `${record.strength} ${record.unit}` : '',
                    }))
                  }}
                  style={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '12px 14px', fontSize: '14px' }}
                >
                  <option value="">Select product</option>
                  {catalogRecords.filter((record) => !record.archived).map((record) => (
                    <option key={record.slug} value={record.slug}>
                      {record.displayName}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'grid', gap: '8px' }}>
                <label className="section-label">Strength</label>
                <input value={costForm.strengthLabel} onChange={(event) => setCostForm((current) => ({ ...current, strengthLabel: event.target.value }))} style={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '12px 14px', fontSize: '14px' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
              <div style={{ display: 'grid', gap: '8px' }}>
                <label className="section-label">Vendor</label>
                <input value={costForm.vendorName} onChange={(event) => setCostForm((current) => ({ ...current, vendorName: event.target.value }))} placeholder="Distributor" style={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '12px 14px', fontSize: '14px' }} />
              </div>
              <div style={{ display: 'grid', gap: '8px' }}>
                <label className="section-label">Date Ordered</label>
                <input type="date" value={costForm.orderedOn} onChange={(event) => setCostForm((current) => ({ ...current, orderedOn: event.target.value }))} style={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '12px 14px', fontSize: '14px' }} />
              </div>
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

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                <input type="checkbox" checked={costForm.markIncoming} onChange={(event) => setCostForm((current) => ({ ...current, markIncoming: event.target.checked }))} />
                Mark matching product as incoming
              </label>
              <button type="button" className="fm-btn-primary" onClick={saveCostEntry} disabled={savingCost}>
                {savingCost ? 'Saving...' : editingCostId ? 'Update Supply Order' : 'Save Supply Order'}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Link href="/admin/clients" className="fm-btn-outline" style={{ textDecoration: 'none' }}>
              Open Clients
            </Link>
          </div>
          {costMessage ? <div style={{ color: 'var(--text-secondary)' }}>{costMessage}</div> : null}

          <div style={{ marginTop: '4px', paddingTop: '14px', borderTop: '1px solid var(--border)', display: 'grid', gap: '10px' }}>
            <div>
              <div className="section-label">Recent Supply Orders</div>
              <div style={{ color: 'var(--text-secondary)', marginTop: '6px' }}>
                Review all logged replenishment orders, vendor costs, and quantities here.
              </div>
            </div>
            {costLogs.length === 0 ? (
              <div style={{ color: 'var(--text-muted)' }}>No cost entries saved yet.</div>
            ) : (
              costLogs.map((entry) => (
                <div key={entry.id} className="card" style={{ padding: '14px', display: 'grid', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'start', flexWrap: 'wrap' }}>
                    <div>
                      <strong style={{ color: 'var(--text-primary)' }}>{entry.product_name}</strong>
                      <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '4px' }}>{entry.strength_label}</div>
                    </div>
                    <div style={{ fontWeight: 600 }}>${Number(entry.cost_paid || 0).toFixed(2)}</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px' }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                      <div className="section-label" style={{ fontSize: '11px' }}>Vendor</div>
                      <div style={{ marginTop: '4px' }}>{entry.vendor_name || 'No vendor'}</div>
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                      <div className="section-label" style={{ fontSize: '11px' }}>Ordered</div>
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
                      <div className="section-label" style={{ fontSize: '11px' }}>Per Vial</div>
                      <div style={{ marginTop: '4px' }}>${Number(entry.price_per_vial || 0).toFixed(2)}</div>
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                      <div className="section-label" style={{ fontSize: '11px' }}>Per Kit</div>
                      <div style={{ marginTop: '4px' }}>${Number(entry.price_per_kit || 0).toFixed(2)}</div>
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                      <div className="section-label" style={{ fontSize: '11px' }}>Avg / Vial</div>
                      <div style={{ marginTop: '4px' }}>${getSupplyOrderAveragePricePerVial(entry).toFixed(2)}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
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
              ))
            )}
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '18px', display: 'grid', gap: '14px', alignSelf: 'start' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <div className="section-label">Low Stock</div>
              <div style={{ color: 'var(--text-secondary)', marginTop: '6px' }}>
                Any active listing at or below {settings?.inventoryDefaults.lowStockThreshold ?? 4} will show here.
              </div>
            </div>
            <Link href="/admin#supply-orders" className="fm-btn-outline" style={{ textDecoration: 'none' }}>
              Place Order
            </Link>
          </div>

          <div style={{ display: 'grid', gap: '10px' }}>
            {lowStockItems.length === 0 ? (
              <div style={{ color: 'var(--text-muted)' }}>Nothing is low right now.</div>
            ) : (
              visibleLowStockItems.map((item) => (
                <div key={item.slug} className="card" style={{ padding: '14px', display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) 120px 120px', gap: '12px', alignItems: 'center' }}>
                  <div>
                    <strong style={{ color: 'var(--text-primary)' }}>{item.displayName}</strong>
                    <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '4px' }}>
                      {item.strength} {item.unit}
                    </div>
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                    {item.inventoryOnHand} left
                  </div>
                  <div>
                    <span className="badge badge-amber">Low Stock</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {lowStockItems.length > 6 ? (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                type="button"
                className="fm-btn-outline"
                onClick={() => setShowAllLowStock((current) => !current)}
              >
                {showAllLowStock ? 'Show Less' : `View More (${lowStockItems.length - 6} more)`}
              </button>
            </div>
          ) : null}

          <div style={{ marginTop: '8px', paddingTop: '14px', borderTop: '1px solid var(--border)', display: 'grid', gap: '10px' }}>
            <div>
              <div className="section-label">Out of Stock</div>
              <div style={{ color: 'var(--text-secondary)', marginTop: '6px' }}>
                These are fully out and will only show incoming once founder places a replenishment order in the supply tracker.
              </div>
            </div>
            {sortedOutOfStockItems.length === 0 ? (
              <div style={{ color: 'var(--text-muted)' }}>Nothing is fully out right now.</div>
            ) : (
              visibleOutOfStockItems.map((item) => (
                <div key={`${item.slug}-out`} className="card" style={{ padding: '14px', display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) 120px 120px', gap: '12px', alignItems: 'center' }}>
                  <div>
                    <strong style={{ color: 'var(--text-primary)' }}>{item.displayName}</strong>
                    <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '4px' }}>
                      {item.strength} {item.unit}
                    </div>
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                    {item.inventoryOnHand ?? 0} left
                  </div>
                  <div>
                    <span className="badge badge-muted">Out of Stock</span>
                  </div>
                </div>
              ))
            )}

            {sortedOutOfStockItems.length > 6 ? (
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button
                  type="button"
                  className="fm-btn-outline"
                  onClick={() => setShowAllOutOfStock((current) => !current)}
                >
                  {showAllOutOfStock ? 'Show Less' : `View More (${sortedOutOfStockItems.length - 6} more)`}
                </button>
              </div>
            ) : null}
          </div>
      </div>

    </AdminShell>
  )
}
