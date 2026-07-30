'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AdminShell } from '@/components/AdminShell'
import { buildAffiliateLink } from '@/lib/affiliates'
import { formatCurrency } from '@/lib/cart'
import { getManualOrderStatusLabel, type ManualOrderStatus } from '@/lib/manual-orders'

type AffiliateDashboardRecord = {
  id: string
  name: string
  email: string
  code: string
  notes: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  orderCount: number
  completedCount: number
  pendingCount: number
  totalRevenue: number
  orders: Array<{
    id: string
    createdAt: string
    status: ManualOrderStatus
    customerName: string
    total: number
  }>
}

const EMPTY_FORM = {
  name: '',
  email: '',
  code: '',
  notes: '',
}

const AFFILIATE_LINK_ORIGIN = 'https://flexmedpeptides.com'

export default function AdminAffiliatesPage() {
  const [affiliates, setAffiliates] = useState<AffiliateDashboardRecord[]>([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const formRef = useRef<HTMLDivElement | null>(null)
  const [origin] = useState(() => {
    if (typeof window === 'undefined') return AFFILIATE_LINK_ORIGIN
    return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? window.location.origin
      : AFFILIATE_LINK_ORIGIN
  })
  const [query, setQuery] = useState('')

  async function loadAffiliates() {
    const response = await fetch('/api/admin/affiliates', { cache: 'no-store' })
    const result = (await response.json()) as { ok: boolean; error?: string; affiliates?: AffiliateDashboardRecord[] }
    if (!response.ok || !result.ok) {
      setMessage(result.error || 'Affiliate data could not be loaded.')
      return
    }
    setAffiliates(result.affiliates ?? [])
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadAffiliates()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [])

  const filteredAffiliates = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return affiliates
    return affiliates.filter((affiliate) =>
      [affiliate.name, affiliate.email, affiliate.code].some((value) => value.toLowerCase().includes(normalized)),
    )
  }, [affiliates, query])

  const totals = useMemo(
    () =>
      filteredAffiliates.reduce(
        (summary, affiliate) => {
          summary.affiliates += 1
          summary.orders += affiliate.orderCount
          summary.revenue += affiliate.totalRevenue
          return summary
        },
        { affiliates: 0, orders: 0, revenue: 0 },
      ),
    [filteredAffiliates],
  )

  async function saveAffiliate() {
    if (!form.name.trim()) {
      setMessage('Add the affiliate name first.')
      return
    }

    setSaving(true)
    setMessage('')
    try {
      const response = await fetch('/api/admin/affiliates', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingId ? { id: editingId, ...form } : form),
      })
      const result = (await response.json()) as { ok: boolean; error?: string }
      if (!response.ok || !result.ok) {
        setMessage(result.error || 'Affiliate could not be saved.')
        return
      }
      setMessage(editingId ? 'Affiliate updated.' : 'Affiliate created.')
      setForm(EMPTY_FORM)
      setEditingId(null)
      await loadAffiliates()
    } catch {
      setMessage('Affiliate could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  function startEdit(affiliate: AffiliateDashboardRecord) {
    setEditingId(affiliate.id)
    setForm({
      name: affiliate.name,
      email: affiliate.email,
      code: affiliate.code,
      notes: affiliate.notes,
    })
    setMessage(`Editing ${affiliate.name}.`)
    window.setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 0)
  }

  async function toggleActive(affiliate: AffiliateDashboardRecord) {
    const response = await fetch('/api/admin/affiliates', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: affiliate.id, isActive: !affiliate.isActive }),
    })
    const result = (await response.json()) as { ok: boolean; error?: string }
    if (!response.ok || !result.ok) {
      setMessage(result.error || 'Affiliate status could not be updated.')
      return
    }
    setMessage(`${affiliate.name} is now ${affiliate.isActive ? 'inactive' : 'active'}.`)
    await loadAffiliates()
  }

  async function removeAffiliate(affiliate: AffiliateDashboardRecord) {
    const confirmed = window.confirm(
      `Remove ${affiliate.name} from affiliates?\n\nThis removes the affiliate profile and link from the CRM. Existing orders keep their saved referral details.`,
    )
    if (!confirmed) return

    setDeletingId(affiliate.id)
    setMessage('')
    try {
      const response = await fetch('/api/admin/affiliates', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: affiliate.id }),
      })
      const result = (await response.json()) as { ok?: boolean; error?: string }
      if (!response.ok || !result.ok) {
        setMessage(result.error || 'Affiliate could not be removed.')
        return
      }
      if (editingId === affiliate.id) {
        setEditingId(null)
        setForm(EMPTY_FORM)
      }
      setMessage(`${affiliate.name} removed.`)
      await loadAffiliates()
    } catch {
      setMessage('Affiliate could not be removed.')
    } finally {
      setDeletingId(null)
    }
  }

  async function copyLink(code: string) {
    const link = buildAffiliateLink(origin, code)
    await navigator.clipboard.writeText(link)
    setMessage(`Copied affiliate link for ${code}.`)
  }

  return (
    <AdminShell
      active="/admin/affiliates"
      title="Affiliates"
      description="Create affiliate codes, hand out trackable links, and monitor which referred orders are turning into revenue."
      purpose="Use this page as the command center for founder's referral program. Every approved affiliate gets a code and a trackable shopping link, and referred orders roll up here automatically."
      workflow={[
        'Create the affiliate profile with a name, code, and optional contact email.',
        'Copy the generated referral link and give it to the affiliate partner.',
        'Review referred order counts and revenue here as new orders come in.',
      ]}
      teamNotes={[
        'Link-based tracking is the simplest path now, so customers do not need to type a code manually if they arrive through the affiliate link.',
        'A self-serve affiliate registration flow can be added later without changing the order tracking model.',
      ]}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {[
          ['Affiliates', String(totals.affiliates)],
          ['Referred Orders', String(totals.orders)],
          ['Tracked Revenue', formatCurrency(totals.revenue)],
        ].map(([label, value]) => (
          <div key={label} className="card" style={{ padding: '18px', display: 'grid', gap: '8px' }}>
            <div className="section-label">{label}</div>
            <div style={{ fontSize: '28px', fontWeight: 600 }}>{value}</div>
          </div>
        ))}
      </div>

      <div
        ref={formRef}
        className="card"
        style={{
          padding: '20px',
          display: 'grid',
          gap: '18px',
          border: editingId ? '1px solid rgba(96, 165, 250, 0.55)' : undefined,
          boxShadow: editingId ? '0 0 0 3px rgba(59, 130, 246, 0.12)' : undefined,
        }}
      >
        <div style={{ display: 'grid', gap: '6px' }}>
          <div className="section-label">{editingId ? 'Edit Affiliate' : 'Add Affiliate'}</div>
          <div style={{ color: 'var(--text-secondary)' }}>
            Create a code once, then use the tracked link for automatic referral attribution.
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '14px' }}>
          <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Affiliate name" style={{ borderRadius: '14px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '12px 14px', fontSize: '14px' }} />
          <input value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} placeholder="Contact email" style={{ borderRadius: '14px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '12px 14px', fontSize: '14px' }} />
          <input value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))} placeholder="Affiliate code (optional)" style={{ borderRadius: '14px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '12px 14px', fontSize: '14px' }} />
          <input value={editingId && form.code ? buildAffiliateLink(origin, form.code) : ''} readOnly placeholder="Tracked link will appear here after code is set" style={{ borderRadius: '14px', border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-muted)', padding: '12px 14px', fontSize: '14px' }} />
          <textarea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Partner notes" rows={4} style={{ gridColumn: '1 / -1', borderRadius: '14px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '12px 14px', fontSize: '14px', resize: 'vertical' }} />
        </div>

        {message ? <div style={{ color: 'var(--text-secondary)' }}>{message}</div> : null}

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button type="button" className="fm-btn-primary" onClick={saveAffiliate} disabled={saving}>
            {saving ? 'Saving...' : editingId ? 'Update Affiliate' : 'Create Affiliate'}
          </button>
          {editingId ? (
            <button
              type="button"
              className="fm-btn-outline"
              onClick={() => {
                setEditingId(null)
                setForm(EMPTY_FORM)
                setMessage('')
              }}
            >
              Cancel Edit
            </button>
          ) : null}
        </div>
      </div>

      <div className="card" style={{ padding: '20px', display: 'grid', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'grid', gap: '6px' }}>
            <div className="section-label">Affiliate Tracking</div>
            <div style={{ color: 'var(--text-secondary)' }}>Track codes, links, and referred orders here.</div>
          </div>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search affiliates"
            style={{ minWidth: '260px', borderRadius: '14px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '12px 14px', fontSize: '14px' }}
          />
        </div>

        <div style={{ display: 'grid', gap: '14px' }}>
          {filteredAffiliates.map((affiliate) => (
            <div key={affiliate.id} className="card" style={{ padding: '18px', display: 'grid', gap: '14px', background: 'var(--bg-base)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) repeat(4, minmax(0, 1fr)) auto', gap: '14px', alignItems: 'center' }}>
                <div style={{ display: 'grid', gap: '6px' }}>
                  <div style={{ fontSize: '18px', fontWeight: 600 }}>{affiliate.name}</div>
                  <div style={{ color: 'var(--text-secondary)' }}>{affiliate.email || 'No contact email saved'}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Code: {affiliate.code}</div>
                </div>
                <div>
                  <div className="section-label">Orders</div>
                  <div style={{ fontSize: '18px', fontWeight: 600 }}>{affiliate.orderCount}</div>
                </div>
                <div>
                  <div className="section-label">Pending</div>
                  <div style={{ fontSize: '18px', fontWeight: 600 }}>{affiliate.pendingCount}</div>
                </div>
                <div>
                  <div className="section-label">Completed</div>
                  <div style={{ fontSize: '18px', fontWeight: 600 }}>{affiliate.completedCount}</div>
                </div>
                <div>
                  <div className="section-label">Revenue</div>
                  <div style={{ fontSize: '18px', fontWeight: 600 }}>{formatCurrency(affiliate.totalRevenue)}</div>
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  <button type="button" className="fm-btn-outline" onClick={() => copyLink(affiliate.code)}>
                    Copy Link
                  </button>
                  <button type="button" className="fm-btn-outline" onClick={() => startEdit(affiliate)}>
                    Edit
                  </button>
                  <button type="button" className="fm-btn-outline" onClick={() => toggleActive(affiliate)}>
                    {affiliate.isActive ? 'Pause' : 'Activate'}
                  </button>
                  <button
                    type="button"
                    className="fm-btn-outline"
                    disabled={deletingId === affiliate.id}
                    onClick={() => removeAffiliate(affiliate)}
                    style={{
                      color: '#b42318',
                      borderColor: 'rgba(180, 35, 24, 0.28)',
                      opacity: deletingId === affiliate.id ? 0.65 : 1,
                    }}
                  >
                    {deletingId === affiliate.id ? 'Removing...' : 'Remove'}
                  </button>
                </div>
              </div>

              {affiliate.notes ? <div style={{ color: 'var(--text-secondary)' }}>{affiliate.notes}</div> : null}

              <div style={{ display: 'grid', gap: '10px' }}>
                <div className="section-label">Tracked Link</div>
                <div style={{ borderRadius: '14px', border: '1px solid var(--border)', background: 'var(--bg-elevated)', padding: '12px 14px', color: 'var(--text-secondary)', wordBreak: 'break-all' }}>
                  {buildAffiliateLink(origin, affiliate.code)}
                </div>
              </div>

              <div style={{ display: 'grid', gap: '10px' }}>
                <div className="section-label">Referred Orders</div>
                {affiliate.orders.length === 0 ? (
                  <div style={{ color: 'var(--text-secondary)' }}>No referred orders yet.</div>
                ) : (
                  <div style={{ display: 'grid', gap: '10px' }}>
                    {affiliate.orders.map((order) => (
                      <div key={order.id} style={{ borderRadius: '14px', border: '1px solid var(--border)', background: 'var(--bg-elevated)', padding: '14px 16px', display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) 1fr auto auto', gap: '12px', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 600 }}>{order.id}</div>
                          <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{order.customerName}</div>
                        </div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{new Date(order.createdAt).toLocaleDateString()}</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{getManualOrderStatusLabel(order.status)}</div>
                        <div style={{ fontWeight: 600 }}>{formatCurrency(order.total)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminShell>
  )
}
