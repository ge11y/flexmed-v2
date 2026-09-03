'use client'

import { useMemo, useState } from 'react'
import {
  formatMoney,
  getPurchaseTotalCost,
  getPurchaseUnitCost,
  getPurchaseUnits,
  isPurchaseReceived,
  sortPurchaseRows,
  summarizePurchaseLedger,
  type PurchaseLedgerRow,
} from '@/lib/purchase-ledger'

interface PurchaseLedgerProps {
  slug: string
  productName: string
  strengthLabel: string
  onHandNow: number | null
  rows: PurchaseLedgerRow[]
  onChanged: () => Promise<void> | void
}

const inputStyle = {
  borderRadius: '12px',
  border: '1px solid var(--border)',
  background: 'var(--bg-card)',
  color: 'var(--text-primary)',
  padding: '10px 12px',
  fontSize: '13px',
  width: '100%',
  boxSizing: 'border-box' as const,
}

const cellStyle = { padding: '8px 10px', color: 'var(--text-secondary)', verticalAlign: 'top' as const, whiteSpace: 'nowrap' as const }

function today() {
  return new Date().toISOString().slice(0, 10)
}

function emptyForm() {
  return {
    orderedOn: today(),
    vialQuantity: '0',
    kitQuantity: '0',
    unitsPerKit: '10',
    pricePerVial: '',
    pricePerKit: '',
    vendorName: '',
    note: '',
    received: true,
  }
}

/**
 * Per-SKU purchase-cost ledger: the current cost on top, every earlier
 * purchase underneath, and a form that only ever adds a new row.
 */
export function PurchaseLedger({ slug, productName, strengthLabel, onHandNow, rows, onChanged }: PurchaseLedgerProps) {
  const [historyOpen, setHistoryOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null)

  const summary = useMemo(() => summarizePurchaseLedger(rows), [rows])
  const sortedRows = useMemo(() => sortPurchaseRows(rows), [rows])

  const previewUnits = getPurchaseUnits({
    vial_quantity: Number(form.vialQuantity || '0'),
    kit_quantity: Number(form.kitQuantity || '0'),
    units_per_kit: Number(form.unitsPerKit || '10'),
  })
  const previewTotal =
    Number(form.vialQuantity || '0') * Number(String(form.pricePerVial).replace(/[^0-9.]/g, '') || '0') +
    Number(form.kitQuantity || '0') * Number(String(form.pricePerKit).replace(/[^0-9.]/g, '') || '0')

  async function saveRestock() {
    if (previewUnits <= 0) {
      setMessage({ tone: 'error', text: 'Enter the vials or kits that came in.' })
      return
    }
    setSaving(true)
    setMessage(null)
    try {
      const response = await fetch('/api/admin/inventory-costs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          productName,
          strengthLabel,
          vendorName: form.vendorName,
          note: form.note,
          vialQuantity: Number(form.vialQuantity || '0'),
          kitQuantity: Number(form.kitQuantity || '0'),
          unitsPerKit: Number(form.unitsPerKit || '10'),
          orderedOn: form.orderedOn,
          pricePerVial: form.pricePerVial,
          pricePerKit: form.pricePerKit,
          markArrived: form.received,
          markIncoming: !form.received,
        }),
      })
      const result = (await response.json()) as { ok?: boolean; error?: string; warning?: string; receivedUnits?: number; nextInventory?: number }
      if (!response.ok || !result.ok) {
        setMessage({ tone: 'error', text: result.error || 'The purchase could not be saved.' })
        return
      }
      const received =
        typeof result.receivedUnits === 'number'
          ? ` ${result.receivedUnits} vials were added to on-hand (now ${result.nextInventory ?? '?'}); the count box updates when the page reloads.`
          : ' It is logged as ordered and will add to on-hand when it is marked arrived on Supply.'
      setMessage({ tone: 'ok', text: `Restock saved as a new purchase. Earlier purchases are unchanged.${received}${result.warning ? ` ${result.warning}` : ''}` })
      setForm(emptyForm())
      setFormOpen(false)
      setHistoryOpen(true)
      await onChanged()
    } catch {
      setMessage({ tone: 'error', text: 'The purchase could not be saved.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      data-purchase-ledger={slug}
      style={{
        display: 'grid',
        gap: '10px',
        borderRadius: '12px',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        padding: '12px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'grid', gap: '4px' }}>
          <div className="section-label">Purchase cost for {strengthLabel}</div>
          {summary.currentUnitCost === null ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No purchases logged yet.</div>
          ) : (
            <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
              <strong style={{ color: 'var(--text-primary)', fontSize: '16px' }}>{formatMoney(summary.currentUnitCost)}</strong> per vial
              {summary.currentRow ? (
                <span>
                  {' '}
                  · {summary.currentBasis === 'received' ? 'received' : 'ordered, not received yet'} {summary.lastPurchaseOn ? `on ${summary.currentRow.arrived_at?.slice(0, 10) ?? summary.currentRow.ordered_on}` : ''}
                  {summary.currentRow.vendor_name ? ` · ${summary.currentRow.vendor_name}` : ''}
                </span>
              ) : null}
              {summary.averageUnitCost !== null && summary.entries > 1 ? (
                <span style={{ color: 'var(--text-muted)' }}> · average paid {formatMoney(summary.averageUnitCost)} over {summary.entries} purchases</span>
              ) : null}
              {onHandNow !== null ? <span style={{ color: 'var(--text-muted)' }}> · {onHandNow} on hand</span> : null}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button type="button" className="fm-btn-outline" style={{ padding: '8px 10px', fontSize: '12px' }} onClick={() => setHistoryOpen((open) => !open)}>
            {historyOpen ? 'Hide history' : `History (${summary.entries})`}
          </button>
          <button type="button" className="fm-btn-primary" style={{ padding: '8px 10px', fontSize: '12px' }} onClick={() => setFormOpen((open) => !open)}>
            {formOpen ? 'Cancel' : 'Log restock'}
          </button>
        </div>
      </div>

      {message ? (
        <div style={{ color: message.tone === 'error' ? '#fca5a5' : 'var(--text-secondary)', fontSize: '13px' }}>{message.text}</div>
      ) : null}

      {formOpen ? (
        <div style={{ display: 'grid', gap: '10px', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
            This adds a new purchase to the ledger. Earlier purchases are never changed.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px' }}>
            <label style={{ display: 'grid', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
              Date
              <input type="date" value={form.orderedOn} onChange={(event) => setForm((current) => ({ ...current, orderedOn: event.target.value }))} style={inputStyle} />
            </label>
            <label style={{ display: 'grid', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
              Vials
              <input type="number" min="0" value={form.vialQuantity} onChange={(event) => setForm((current) => ({ ...current, vialQuantity: event.target.value }))} style={inputStyle} />
            </label>
            <label style={{ display: 'grid', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
              Price per vial
              <input value={form.pricePerVial} placeholder="$0.00" onChange={(event) => setForm((current) => ({ ...current, pricePerVial: event.target.value }))} style={inputStyle} />
            </label>
            <label style={{ display: 'grid', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
              Kits
              <input type="number" min="0" value={form.kitQuantity} onChange={(event) => setForm((current) => ({ ...current, kitQuantity: event.target.value }))} style={inputStyle} />
            </label>
            <label style={{ display: 'grid', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
              Vials per kit
              <input type="number" min="1" value={form.unitsPerKit} onChange={(event) => setForm((current) => ({ ...current, unitsPerKit: event.target.value }))} style={inputStyle} />
            </label>
            <label style={{ display: 'grid', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
              Price per kit
              <input value={form.pricePerKit} placeholder="$0.00" onChange={(event) => setForm((current) => ({ ...current, pricePerKit: event.target.value }))} style={inputStyle} />
            </label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
            <label style={{ display: 'grid', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
              Vendor
              <input value={form.vendorName} placeholder="Distributor or vendor" onChange={(event) => setForm((current) => ({ ...current, vendorName: event.target.value }))} style={inputStyle} />
            </label>
            <label style={{ display: 'grid', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
              Note
              <input value={form.note} placeholder="Optional" onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))} style={inputStyle} />
            </label>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
              {previewUnits} vials · {formatMoney(previewTotal)} total{previewUnits > 0 ? ` · ${formatMoney(previewTotal / previewUnits)} per vial` : ''}
            </div>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '13px' }}>
              <input type="checkbox" checked={form.received} onChange={(event) => setForm((current) => ({ ...current, received: event.target.checked }))} />
              Already received (adds the vials to on-hand now)
            </label>
            <button type="button" className="fm-btn-primary" style={{ padding: '8px 12px', fontSize: '12px' }} onClick={saveRestock} disabled={saving}>
              {saving ? 'Saving...' : 'Save purchase'}
            </button>
          </div>
        </div>
      ) : null}

      {historyOpen ? (
        <div style={{ overflowX: 'auto', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
          {sortedRows.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Nothing logged for this strength yet.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  <th style={cellStyle}>Date</th>
                  <th style={cellStyle}>Status</th>
                  <th style={cellStyle}>Vials</th>
                  <th style={cellStyle}>Cost / vial</th>
                  <th style={cellStyle}>Total paid</th>
                  <th style={cellStyle}>Vendor</th>
                  <th style={{ ...cellStyle, whiteSpace: 'normal' }}>Note</th>
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((row) => {
                  const received = isPurchaseReceived(row)
                  const unitCost = getPurchaseUnitCost(row)
                  const isCurrent = summary.currentRow?.id === row.id
                  return (
                    <tr key={row.id} style={{ borderTop: '1px solid var(--border)', background: isCurrent ? 'rgba(77, 211, 232, 0.06)' : undefined }}>
                      <td style={{ ...cellStyle, color: 'var(--text-primary)' }}>
                        {received ? row.arrived_at?.slice(0, 10) ?? row.ordered_on : row.ordered_on}
                        {isCurrent ? <div style={{ color: 'var(--accent-500)', fontSize: '11px' }}>current</div> : null}
                      </td>
                      <td style={cellStyle}>
                        <span className={`badge ${received ? 'badge-green' : 'badge-amber'}`}>{received ? 'Received' : 'Ordered'}</span>
                      </td>
                      <td style={cellStyle}>{getPurchaseUnits(row)}</td>
                      <td style={{ ...cellStyle, color: 'var(--text-primary)', fontWeight: 600 }}>{unitCost === null ? '—' : formatMoney(unitCost)}</td>
                      <td style={cellStyle}>{formatMoney(getPurchaseTotalCost(row))}</td>
                      <td style={cellStyle}>{row.vendor_name || '—'}</td>
                      <td style={{ ...cellStyle, whiteSpace: 'normal', minWidth: '140px' }}>{row.note || ''}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
          <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '8px' }}>
            Received purchases are locked as cost history. Orders that have not arrived yet can still be edited or received on the Supply page.
          </div>
        </div>
      ) : null}
    </div>
  )
}
