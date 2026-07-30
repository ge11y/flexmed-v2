'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { CheckCircle2, Clipboard, Mail, PackageCheck, ShoppingBag } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useCart } from '@/components/CartProvider'
import { formatCurrency } from '@/lib/cart'
import { fetchCustomerOrder } from '@/lib/customer-order-client'
import {
  findManualOrder,
  getManualOrderStatusLabel,
  replaceManualOrder,
  type ManualOrderSubmission,
} from '@/lib/manual-orders'

export default function OrderConfirmationPage() {
  const params = useParams<{ orderId: string }>()
  const orderId = params?.orderId ?? ''
  const { clearCart } = useCart()
  const localOrder = useMemo(() => (orderId ? findManualOrder(orderId) : null), [orderId])
  const [order, setOrder] = useState<ManualOrderSubmission | null>(localOrder)
  const [loading, setLoading] = useState(Boolean(orderId && !localOrder))
  const [error, setError] = useState(orderId ? '' : 'Order number is missing.')
  const [copyMessage, setCopyMessage] = useState('')

  useEffect(() => {
    clearCart()
  }, [clearCart])

  useEffect(() => {
    let cancelled = false

    async function loadOrder() {
      try {
        const sharedOrder = await fetchCustomerOrder(orderId)
        if (cancelled) return
        setOrder(sharedOrder)
        replaceManualOrder(sharedOrder)
        setError('')
      } catch (loadError) {
        if (!cancelled && !localOrder) {
          setError(loadError instanceof Error ? loadError.message : 'We could not load this order.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    if (orderId) void loadOrder()

    return () => {
      cancelled = true
    }
  }, [localOrder, orderId])

  async function copyOrderId() {
    if (!order) return
    try {
      await navigator.clipboard.writeText(order.id)
      setCopyMessage('Copied')
      window.setTimeout(() => setCopyMessage(''), 1800)
    } catch {
      setCopyMessage('Copy failed')
    }
  }

  if (loading && !order) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)', padding: '112px 24px 72px' }}>
        <div className="container" style={{ maxWidth: '760px', display: 'grid', gap: '14px' }}>
          <div className="section-label">Order Confirmation</div>
          <h1 style={{ margin: 0, fontSize: '36px' }}>Loading your confirmation...</h1>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)', padding: '112px 24px 72px' }}>
        <div className="container" style={{ maxWidth: '760px', display: 'grid', gap: '16px' }}>
          <div className="section-label">Order Confirmation</div>
          <h1 style={{ margin: 0, fontSize: '36px' }}>We couldn&apos;t open this confirmation.</h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            {error || 'Sign in with the account that placed the order and try again.'}
          </p>
          <Link href="/products" className="fm-btn-primary" style={{ width: 'fit-content' }}>
            Return to catalog
          </Link>
        </div>
      </div>
    )
  }

  const proofReceived = order.paymentProofStatus === 'submitted' || order.paymentProofStatus === 'confirmed'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', padding: '96px 24px 72px' }}>
      <div style={{ maxWidth: '980px', margin: '0 auto', display: 'grid', gap: '28px' }}>
        <section style={{ display: 'grid', gap: '14px', maxWidth: '760px' }}>
          <CheckCircle2 size={42} strokeWidth={1.8} color="var(--status-green)" aria-hidden="true" />
          <div className="section-label">{proofReceived ? 'Payment Proof Received' : 'Order Received'}</div>
          <h1 style={{ margin: 0, fontSize: '40px', lineHeight: 1.12, textWrap: 'balance' }}>
            Thank you, {order.customer.firstName || 'your order is in'}.
          </h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.75, maxWidth: '68ch' }}>
            {proofReceived
              ? 'Your proof was saved and the order is awaiting payment review. You do not need to submit it again.'
              : 'Your order was saved. Complete the payment instructions to move it into review.'}
          </p>
        </section>

        <section
          className="card"
          style={{
            padding: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            gap: '20px',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'grid', gap: '6px' }}>
            <div className="section-label">Order Number</div>
            <div style={{ fontSize: '24px', fontWeight: 700 }}>{order.id}</div>
            <div style={{ color: 'var(--text-secondary)' }}>
              {getManualOrderStatusLabel(order.status)} · {formatCurrency(order.order.totals.total)}
            </div>
          </div>
          <button type="button" className="fm-btn-outline" onClick={copyOrderId}>
            <Clipboard size={16} aria-hidden="true" />
            {copyMessage || 'Copy order number'}
          </button>
        </section>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          <section className="card" style={{ padding: '24px', display: 'grid', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShoppingBag size={20} color="var(--amber)" aria-hidden="true" />
              <h2 style={{ margin: 0, fontSize: '20px' }}>Order summary</h2>
            </div>
            <div style={{ display: 'grid', gap: '12px' }}>
              {order.order.lines.map((line) => {
                const descriptor = [line.strengthLabel, line.formatType].filter(Boolean).join(' · ')
                return (
                  <div key={`${order.id}-${line.slug}`} style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{line.displayName}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '3px' }}>
                        {descriptor ? `${descriptor} · ` : ''}Qty {line.quantity}
                      </div>
                      {line.freeUnits ? (
                        <div style={{ color: '#047857', fontSize: '12px', marginTop: '3px' }}>
                          {line.freeUnits} free unit{line.freeUnits === 1 ? '' : 's'} included
                        </div>
                      ) : null}
                    </div>
                    <div style={{ fontWeight: 600 }}>{formatCurrency(line.lineTotal ?? line.lineSubtotal)}</div>
                  </div>
                )
              })}
            </div>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '14px', display: 'flex', justifyContent: 'space-between' }}>
              <span>Total</span>
              <strong>{formatCurrency(order.order.totals.total)}</strong>
            </div>
          </section>

          <section className="card" style={{ padding: '24px', display: 'grid', gap: '18px', alignContent: 'start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <PackageCheck size={20} color="var(--amber)" aria-hidden="true" />
              <h2 style={{ margin: 0, fontSize: '20px' }}>What happens next</h2>
            </div>
            {[
              ['Proof review', proofReceived ? 'Your payment proof is waiting for review.' : 'Submit payment proof to begin review.'],
              ['Payment confirmation', 'You will receive an email after payment is confirmed.'],
              ['Fulfillment', 'The team will package the order and prepare it for shipping.'],
              ['Shipment', 'Tracking details will be emailed when the order ships.'],
            ].map(([title, detail]) => (
              <div key={title} style={{ display: 'grid', gap: '4px' }}>
                <strong>{title}</strong>
                <span style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{detail}</span>
              </div>
            ))}
          </section>
        </div>

        <section
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '18px',
            flexWrap: 'wrap',
            paddingTop: '4px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px', color: 'var(--text-secondary)' }}>
            <Mail size={18} aria-hidden="true" />
            Updates will be sent to {order.customer.email}
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {!proofReceived ? (
              <Link href={`/checkout/payment/${order.id}`} className="fm-btn-primary">
                Complete payment
              </Link>
            ) : null}
            <Link href="/products" className={proofReceived ? 'fm-btn-primary' : 'fm-btn-outline'}>
              Continue shopping
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
