'use client'

import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import { AdminShell } from '@/components/AdminShell'
import {
  loadManualOrders,
  loadPaymentProofs,
  savePaymentProofs,
  type ManualOrderSubmission,
  type ManualPaymentProofSubmission,
} from '@/lib/manual-orders'

export default function AdminInboxPage() {
  const [proofs, setProofs] = useState<ManualPaymentProofSubmission[]>(() => {
    if (typeof window === 'undefined') return []
    return loadPaymentProofs()
  })
  const [orders, setOrders] = useState<ManualOrderSubmission[]>(() => {
    if (typeof window === 'undefined') return []
    return loadManualOrders()
  })
  const [loadingRemote, setLoadingRemote] = useState(true)
  const summary = useMemo(
    () => ({
      total: proofs.length,
      submitted: proofs.filter((proof) => proof.status === 'submitted').length,
      reviewed: proofs.filter((proof) => proof.status === 'reviewed').length,
      matchedOrders: proofs.filter((proof) => orders.some((order) => order.id === proof.orderId)).length,
    }),
    [proofs, orders],
  )

  useEffect(() => {
    let active = true

    async function loadRemote() {
      try {
        const response = await fetch('/api/admin/orders', { cache: 'no-store' })
        const result = (await response.json()) as {
          ok: boolean
          orders?: ManualOrderSubmission[]
          proofs?: ManualPaymentProofSubmission[]
        }

        if (!active) return
        if (response.ok && result.ok) {
          setOrders(result.orders ?? [])
          setProofs(result.proofs ?? [])
        }
      } catch {
        // Fall back to local draft data in the current browser.
      } finally {
        if (active) setLoadingRemote(false)
      }
    }

    loadRemote()
    return () => {
      active = false
    }
  }, [])

  async function markReviewed(proofId: string) {
    const next = proofs.map((proof) => (proof.id === proofId ? { ...proof, status: 'reviewed' as const } : proof))
    setProofs(next)
    savePaymentProofs(next)

    try {
      await fetch('/api/admin/payment-proofs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: proofId, status: 'reviewed' }),
      })
    } catch {
      // Keep the local reviewed state even if the shared update misses this round.
    }
  }

  return (
    <AdminShell
      active="/admin/inbox"
      title="Inbox and Proof Review"
      description="Review payment verification here, confirm that the proof matches the order, and clear it for fulfillment."
      purpose="This page is the payment-proof inbox. Use it to check screenshots, payment references, and verification details before the order moves deeper into fulfillment."
      workflow={[
        'Open the proof and confirm the screenshot matches the order amount and order ID.',
        'Compare the proof with the linked order status.',
        'Mark the proof as confirmed so the fulfillment team knows it has been cleared.',
      ]}
      teamNotes={[
        'This page is for proof review only; shipment handling still happens in the Orders tab.',
        'If anything looks off, leave the proof unconfirmed and check the matching order before moving forward.',
        'Use the linked order status to see whether the order is still waiting on payment confirmation.',
      ]}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
        {[
          ['Proofs', String(summary.total)],
          ['Waiting Review', String(summary.submitted)],
          ['Confirmed', String(summary.reviewed)],
          ['Matched Orders', String(summary.matchedOrders)],
        ].map(([label, value]) => (
          <div key={label} className="card" style={{ padding: '18px', display: 'grid', gap: '8px' }}>
            <div className="section-label">{label}</div>
            <div style={{ fontSize: '28px', fontWeight: 600 }}>{value}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div className="section-label">Current scope</div>
        <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.8, maxWidth: '860px' }}>
          Payment verification is shown here for review. If shared sync is available, this queue reflects the Supabase-backed order flow across devices.
        </p>
      </div>

      {loadingRemote ? (
        <div className="card" style={{ padding: '16px', color: 'var(--text-secondary)' }}>
          Loading shared payment verification queue...
        </div>
      ) : null}

      {proofs.length === 0 ? (
        <div className="card" style={{ padding: '24px', color: 'var(--text-secondary)' }}>
          No payment-proof submissions have been captured in this browser yet.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {proofs.map((proof) => {
            const order = orders.find((item) => item.id === proof.orderId)
            return (
              <div key={proof.id} className="card" style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 260px', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: '18px', fontWeight: 600 }}>{proof.orderId}</div>
                      <div style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
                        {proof.customerName} · {proof.customerEmail}
                      </div>
                    </div>
                    <span className={`badge ${proof.status === 'reviewed' ? 'badge-green' : 'badge-amber'}`}>
                      {proof.status === 'reviewed' ? 'Confirmed' : 'Submitted'}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px' }}>
                    <div>
                      <div className="section-label">Method</div>
                      <div style={{ marginTop: '6px' }}>{proof.paymentMethod.toUpperCase()}</div>
                    </div>
                    <div>
                      <div className="section-label">Amount</div>
                      <div style={{ marginTop: '6px' }}>${proof.amountPaid.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="section-label">Reference</div>
                      <div style={{ marginTop: '6px' }}>{proof.transactionReference || 'Not provided'}</div>
                    </div>
                  </div>

                  {order ? (
                    <div style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                      Linked order status: <strong>{order.status.replaceAll('_', ' ')}</strong>
                    </div>
                  ) : null}

                  {proof.notes ? (
                    <div style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                      <strong>Notes:</strong> {proof.notes}
                    </div>
                  ) : null}

                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {proof.status !== 'reviewed' ? (
                      <button type="button" className="fm-btn-primary" onClick={() => markReviewed(proof.id)}>
                        Mark confirmed
                      </button>
                    ) : null}
                  </div>
                </div>

                <div
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: '16px',
                    padding: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '240px',
                  }}
                >
                  {proof.screenshotPreviewUrl ? (
                    <div style={{ position: 'relative', width: '100%', height: '220px' }}>
                      <Image
                        src={proof.screenshotPreviewUrl}
                        alt={proof.screenshotName || `Proof for ${proof.orderId}`}
                        fill
                        unoptimized
                        style={{ objectFit: 'contain', borderRadius: '10px' }}
                      />
                    </div>
                  ) : (
                    <div style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No preview available</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </AdminShell>
  )
}
