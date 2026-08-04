'use client'

import NextImage from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { type CSSProperties, type FormEvent, useEffect, useMemo, useState } from 'react'
import { fetchCustomerOrder, getCustomerAccessToken } from '@/lib/customer-order-client'
import type { BusinessDetailsSettings } from '@/lib/admin-settings'
import {
  appendPaymentProof,
  findManualOrder,
  getConfiguredManualPaymentInstructions,
  getManualOrderStatusLabel,
  replaceManualOrder,
  type ManualOrderSubmission,
  type ManualPaymentProofSubmission,
} from '@/lib/manual-orders'
import { formatCurrency } from '@/lib/cart'

function fieldStyle(): CSSProperties {
  return {
    width: '100%',
    borderRadius: '14px',
    border: '1px solid var(--border)',
    background: 'var(--bg-card)',
    color: 'var(--text-primary)',
    padding: '13px 14px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  }
}

const paymentPageStyles = `
  .payment-page-shell {
    --text-primary: #ffffff;
    --text-secondary: rgba(235, 245, 255, 0.86);
    --text-muted: rgba(207, 226, 255, 0.76);
    --bg-card: rgba(8, 30, 68, 0.74);
    --bg-elevated: rgba(10, 33, 76, 0.72);
    --border: rgba(77, 211, 232, 0.26);
    --amber: #5de7d8;
    --amber-muted: rgba(93, 231, 216, 0.12);
    --amber-border: rgba(93, 231, 216, 0.34);
    background: #071a3d;
    min-height: 100vh;
    padding: 112px 24px 72px;
  }

  .payment-page-inner {
    max-width: 1120px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 28px;
  }

  .payment-page-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 360px;
    gap: 24px;
    align-items: start;
  }

  .payment-page-main,
  .payment-page-summary {
    display: flex;
    flex-direction: column;
    gap: 20px;
    min-width: 0;
  }

  .payment-page-card {
    background:
      linear-gradient(165deg, rgba(38, 82, 145, 0.96), rgba(26, 62, 116, 0.94)),
      radial-gradient(circle at 100% 0%, rgba(77, 211, 232, 0.12), transparent 34%);
    border-color: rgba(77, 211, 232, 0.24);
    color: #ffffff;
  }

  .payment-page-shell .payment-page-card h1,
  .payment-page-shell .payment-page-card h2,
  .payment-page-shell .payment-page-card h3,
  .payment-page-shell .payment-page-card strong,
  .payment-page-shell .payment-page-value,
  .payment-page-shell .payment-total-value {
    color: #ffffff !important;
  }

  .payment-page-shell .payment-page-card .section-label,
  .payment-page-shell .payment-muted-copy {
    color: rgba(223, 238, 255, 0.82) !important;
  }

  .payment-warning-card {
    background: rgba(245, 158, 11, 0.13);
    border-color: rgba(251, 191, 36, 0.42);
  }

  .payment-warning-label,
  .payment-warning-copy {
    color: #fbbf24 !important;
  }

  .payment-warning-title {
    color: #fff7ed !important;
  }

  .payment-caution-card {
    color: #fbbf24 !important;
    background: rgba(245, 158, 11, 0.12) !important;
    border-color: rgba(251, 191, 36, 0.34) !important;
  }

  .payment-method-card,
  .payment-order-id-card,
  .payment-line-card,
  .payment-qr-card {
    background: rgba(10, 33, 76, 0.62);
    border-color: rgba(77, 211, 232, 0.24);
  }

  .payment-qr-card {
    display: grid;
    gap: 12px;
    justify-items: center;
    padding: 16px;
    border-radius: 18px;
    border: 1px solid rgba(77, 211, 232, 0.24);
  }

  .payment-qr-image {
    width: min(100%, 290px);
    max-height: 360px;
    object-fit: contain;
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.18);
    background: #ffffff;
    box-shadow: 0 18px 42px rgba(0, 0, 0, 0.24);
  }

  .payment-line-card {
    display: flex;
    justify-content: space-between;
    gap: 12px;
  }

  .payment-actions {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  @media (max-width: 860px) {
    .payment-page-shell {
      padding: calc(112px + var(--promo-banner-offset, 0px)) 16px 86px;
    }

    .payment-page-layout {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .payment-page-main,
    .payment-page-summary {
      width: 100%;
    }

    .payment-page-summary {
      order: 2;
    }

    .payment-page-card {
      border-color: rgba(77, 211, 232, 0.32);
      box-shadow: 0 18px 44px rgba(0, 0, 0, 0.24);
    }
  }

  @media (max-width: 560px) {
    .payment-page-shell {
      padding-left: 14px;
      padding-right: 14px;
    }

    .payment-page-inner {
      gap: 22px;
    }

    .payment-page-title {
      font-size: 30px !important;
      line-height: 1.08;
      overflow-wrap: anywhere;
    }

    .payment-page-card {
      padding: 18px !important;
    }

    .payment-line-card {
      flex-direction: column;
      align-items: stretch;
    }

    .payment-actions .fm-btn-primary,
    .payment-actions .fm-btn-outline,
    .payment-page-shell .fm-btn-primary,
    .payment-page-shell .fm-btn-outline {
      width: 100%;
      justify-content: center;
      text-align: center;
    }
  }
`

async function fileToPreview(file: File): Promise<{ screenshotName: string; screenshotPreviewUrl: string }> {
  const image = new Image()
  const objectUrl = URL.createObjectURL(file)

  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve()
      image.onerror = () => reject(new Error('Unable to read image'))
      image.src = objectUrl
    })

    const maxDimension = 1200
    const scale = Math.min(1, maxDimension / Math.max(image.width, image.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(image.width * scale))
    canvas.height = Math.max(1, Math.round(image.height * scale))
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Unable to prepare image preview')
    context.drawImage(image, 0, 0, canvas.width, canvas.height)

    return {
      screenshotName: file.name,
      screenshotPreviewUrl: canvas.toDataURL('image/jpeg', 0.78),
    }
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

export default function PaymentInstructionsPage() {
  const params = useParams<{ orderId: string }>()
  const router = useRouter()
  const orderId = params?.orderId ?? ''
  const localOrder = useMemo<ManualOrderSubmission | null>(() => {
    if (!orderId) return null
    return findManualOrder(orderId)
  }, [orderId])

  const [order, setOrder] = useState<ManualOrderSubmission | null>(localOrder)
  const [orderLoading, setOrderLoading] = useState(true)
  const [orderError, setOrderError] = useState('')
  const [amountPaid, setAmountPaid] = useState(() => localOrder?.order.totals.total.toFixed(2) ?? '')
  const [enteredOrderId, setEnteredOrderId] = useState(() => localOrder?.id ?? orderId)
  const [transactionReference, setTransactionReference] = useState('')
  const [notes, setNotes] = useState('')
  const [fileName, setFileName] = useState('')
  const [submitMessage, setSubmitMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [copyMessage, setCopyMessage] = useState('')
  const [businessDetails, setBusinessDetails] = useState<BusinessDetailsSettings | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadSharedOrder() {
      if (!orderId) {
        setOrderLoading(false)
        setOrderError('Order number is missing.')
        return
      }

      try {
        const sharedOrder = await fetchCustomerOrder(orderId)
        if (cancelled) return
        setOrder(sharedOrder)
        replaceManualOrder(sharedOrder)
        setEnteredOrderId(sharedOrder.id)
        setAmountPaid((current) => current || sharedOrder.order.totals.total.toFixed(2))
        setOrderError('')
      } catch (error) {
        if (!cancelled && !localOrder) {
          setOrderError(error instanceof Error ? error.message : 'We could not load this order.')
        }
      } finally {
        if (!cancelled) setOrderLoading(false)
      }
    }

    void loadSharedOrder()
    return () => {
      cancelled = true
    }
  }, [localOrder, orderId])

  useEffect(() => {
    let cancelled = false

    async function loadBusinessDetails() {
      try {
        const response = await fetch('/api/checkout-settings', { cache: 'no-store' })
        const result = (await response.json()) as { ok?: boolean; businessDetails?: BusinessDetailsSettings }
        if (!cancelled && response.ok && result.ok) {
          setBusinessDetails(result.businessDetails ?? null)
        }
      } catch {
        if (!cancelled) setBusinessDetails(null)
      }
    }

    void loadBusinessDetails()
    return () => {
      cancelled = true
    }
  }, [])

  if (orderLoading && !order) {
    return (
      <div className="payment-page-shell">
        <style>{paymentPageStyles}</style>
        <div className="container" style={{ display: 'grid', gap: '14px', maxWidth: '760px' }}>
          <div className="section-label">Order Placed</div>
          <h1 className="payment-page-title" style={{ fontSize: '36px', margin: 0 }}>Loading payment instructions...</h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            We&apos;re securely loading the order tied to your account.
          </p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="payment-page-shell">
        <style>{paymentPageStyles}</style>
        <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="section-label">Payment Instructions</div>
          <h1 className="payment-page-title" style={{ fontSize: '36px', margin: 0 }}>We couldn&apos;t open this order.</h1>
          <p style={{ margin: 0, maxWidth: '720px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            {orderError || 'Sign in with the account that placed the order, then try again.'}
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Link href="/checkout" className="fm-btn-primary">
              Return to checkout
            </Link>
            <Link href="/products" className="fm-btn-outline">
              Browse catalog
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const instructions = getConfiguredManualPaymentInstructions(order.paymentMethod, businessDetails)

  async function handleProofSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const activeOrder = order
    if (!activeOrder) {
      setSubmitMessage('We could not find the current order. Please return to checkout and try again.')
      return
    }
    const formData = new FormData(event.currentTarget)
    const screenshot = formData.get('screenshot')

    if (enteredOrderId.trim() !== activeOrder.id) {
      setSubmitMessage(`Please use the exact order ID: ${activeOrder.id}`)
      return
    }

    if (!(screenshot instanceof File) || screenshot.size === 0) {
      setSubmitMessage('Please attach a screenshot or proof-of-payment image before submitting.')
      return
    }

    setSubmitting(true)
    setSubmitMessage('')

    try {
      const preview = await fileToPreview(screenshot)
      const proof: ManualPaymentProofSubmission = {
        id: `proof_${activeOrder.id}_${Date.now()}`,
        orderId: activeOrder.id,
        createdAt: new Date().toISOString(),
        customerName: `${activeOrder.customer.firstName} ${activeOrder.customer.lastName}`,
        customerEmail: activeOrder.customer.email,
        paymentMethod: activeOrder.paymentMethod,
        amountPaid: Number(amountPaid || '0'),
        transactionReference,
        notes,
        screenshotName: preview.screenshotName,
        screenshotPreviewUrl: preview.screenshotPreviewUrl,
        status: 'submitted',
      }

      const accessToken = await getCustomerAccessToken()
      if (!accessToken) {
        throw new Error('Please sign in again before submitting payment proof.')
      }

      const response = await fetch('/api/payment-proofs', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(proof),
      })
      const result = (await response.json()) as {
        ok: boolean
        error?: string
        detail?: string
        order?: ManualOrderSubmission
      }

      if (!response.ok || !result.ok || !result.order) {
        throw new Error(result.detail || result.error || 'Payment proof could not be saved.')
      }

      appendPaymentProof(proof)
      replaceManualOrder(result.order)
      setOrder(result.order)
      setFileName(preview.screenshotName)
      router.replace(`/checkout/confirmation/${activeOrder.id}`)
    } catch (error) {
      setSubmitMessage(
        error instanceof Error
          ? error.message
          : 'We could not submit that proof. Please try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  async function copyOrderId() {
    if (!order) return
    try {
      await navigator.clipboard.writeText(order.id)
      setCopyMessage('Order ID copied.')
      window.setTimeout(() => setCopyMessage(''), 1800)
    } catch {
      setCopyMessage('Copy failed. Please copy the order ID manually.')
    }
  }

  return (
    <div className="payment-page-shell">
      <style>{paymentPageStyles}</style>
      <div className="payment-page-inner">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div className="section-label">Order Placed</div>
          <h1 className="payment-page-title" style={{ fontSize: '36px', margin: 0 }}>Complete payment for {order.id}</h1>
          <p style={{ margin: 0, maxWidth: '780px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            Your cart is cleared and the order is saved. Send payment, use your Order ID in the payment note, then upload proof.
          </p>
        </div>

        <div className="payment-page-layout">
          <div className="payment-page-main">
            <div className="card payment-page-card" style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="section-label">Step 1</div>
              <h2 style={{ margin: 0, fontSize: '24px' }}>Send payment</h2>
              <div
                style={{
                  padding: '18px 20px',
                  borderRadius: '18px',
                  background: 'rgba(245, 158, 11, 0.13)',
                  border: '1px solid rgba(251, 191, 36, 0.42)',
                  display: 'grid',
                  gap: '10px',
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: '#fbbf24',
                    fontWeight: 700,
                  }}
                >
                  Important payment note instructions
                </div>
                <div className="payment-warning-title" style={{ fontSize: '19px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.45 }}>
                  Paste your full Order ID or the last 6 characters of your Order ID in the payment note.
                </div>
                <div className="payment-warning-copy" style={{ fontSize: '15px', color: '#fbbf24', lineHeight: 1.65 }}>
                  Do not include product names, item details, or anything else in the payment note.
                </div>
              </div>
              <div
                style={{
                  padding: '18px',
                  borderRadius: '18px',
                  background: 'rgba(10, 33, 76, 0.62)',
                  border: '1px solid rgba(77, 211, 232, 0.24)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '14px',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'grid', gap: '6px' }}>
                  <div className="section-label">Order ID</div>
                  <div className="payment-page-value" style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '0.03em' }}>{order.id}</div>
                </div>
                <div style={{ display: 'grid', gap: '8px', justifyItems: 'start' }}>
                  <button type="button" className="fm-btn-outline" onClick={copyOrderId}>
                    Copy Order ID
                  </button>
                  {copyMessage ? <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{copyMessage}</div> : null}
                </div>
              </div>
              <div
                style={{
                  padding: '18px',
                  borderRadius: '18px',
                  background: 'rgba(10, 33, 76, 0.62)',
                  border: '1px solid rgba(77, 211, 232, 0.24)',
                  display: 'grid',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'grid', gap: '6px' }}>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)' }}>
                    Payment method
                  </div>
                  <div className="payment-page-value" style={{ fontSize: '20px', fontWeight: 600 }}>{instructions.label}</div>
                </div>
                {instructions.qrImageUrl ? (
                  <div className="payment-qr-card">
                    <NextImage
                      className="payment-qr-image"
                      src={instructions.qrImageUrl}
                      alt={`${instructions.label} QR code`}
                      width={360}
                      height={520}
                      unoptimized
                    />
                    <div style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.55, textAlign: 'center' }}>
                      Scan this {instructions.label} code, then include only the Order ID in the payment note.
                    </div>
                  </div>
                ) : null}
                <div style={{ display: 'grid', gap: '6px' }}>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)' }}>
                    Destination
                  </div>
                  <div className="payment-page-value" style={{ fontSize: '18px', fontWeight: 600 }}>{instructions.destination}</div>
                  {instructions.link ? (
                    <a href={instructions.link} target="_blank" rel="noopener noreferrer" className="fm-btn-outline" style={{ width: 'fit-content' }}>
                      Open {instructions.label}
                    </a>
                  ) : null}
                </div>
                <div style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>{instructions.detail}</div>
                <div
                  style={{
                    color: '#fbbf24',
                    lineHeight: 1.75,
                    fontSize: '15px',
                    fontWeight: 700,
                    padding: '14px 16px',
                    borderRadius: '14px',
                    background: 'rgba(245, 158, 11, 0.12)',
                    border: '1px solid rgba(251, 191, 36, 0.34)',
                  }}
                >
                  {instructions.caution}
                </div>
              </div>
              <div style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>Submit verification within 48 hours.</div>
            </div>

            {order.paymentProofStatus === 'submitted' ? (
              <div
                className="card payment-page-card"
                style={{
                  padding: '24px',
                  display: 'grid',
                  gap: '14px',
                  background: 'rgba(5, 150, 105, 0.07)',
                  borderColor: 'rgba(5, 150, 105, 0.3)',
                }}
              >
                <div className="badge badge-green-light" style={{ width: 'fit-content' }}>Proof received</div>
                <h2 style={{ margin: 0, fontSize: '24px' }}>Your payment proof is awaiting review.</h2>
                <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                  We&apos;ll send another update after payment is confirmed.
                </p>
                <Link href={`/checkout/confirmation/${order.id}`} className="fm-btn-primary" style={{ width: 'fit-content' }}>
                  View order confirmation
                </Link>
              </div>
            ) : (
              <form className="card payment-page-card" style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '16px' }} onSubmit={handleProofSubmit}>
              <div className="section-label">Step 2</div>
              <h2 style={{ margin: 0, fontSize: '24px' }}>Upload proof of payment</h2>
              <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                Enter the same Order ID used in your payment note, then upload proof of payment.
              </p>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span className="section-label">Order ID</span>
                <input
                  value={enteredOrderId}
                  onChange={(e) => setEnteredOrderId(e.target.value)}
                  style={fieldStyle()}
                  placeholder={order.id}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span className="section-label">Amount paid</span>
                <input value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} style={fieldStyle()} />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span className="section-label">Transaction reference</span>
                <input
                  value={transactionReference}
                  onChange={(e) => setTransactionReference(e.target.value)}
                  style={fieldStyle()}
                  placeholder="Receipt ID, note, or blockchain hash"
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span className="section-label">Screenshot or proof image</span>
                <input name="screenshot" type="file" accept="image/*" style={fieldStyle()} />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span className="section-label">Notes</span>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{ ...fieldStyle(), minHeight: '110px', resize: 'vertical' }}
                  placeholder="Optional note for payment matching."
                />
              </label>

              <div className="payment-actions">
                <button type="submit" className="fm-btn-primary" disabled={submitting} style={{ opacity: submitting ? 0.75 : 1 }}>
                  {submitting ? 'Submitting proof...' : 'Submit verification'}
                </button>
                <Link href="/checkout" className="fm-btn-outline">
                  Back to checkout
                </Link>
              </div>

              {submitMessage ? <div style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>{submitMessage}</div> : null}
              {fileName ? <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Latest proof received: {fileName}</div> : null}
              </form>
            )}
          </div>

          <div className="payment-page-summary">
            <div className="card payment-page-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="section-label">Order Summary</div>
              <div className="payment-page-value" style={{ fontSize: '18px', fontWeight: 600 }}>{order.id}</div>
              <div style={{ color: 'var(--text-secondary)' }}>
                Status: {getManualOrderStatusLabel(order.status)}
              </div>
              <div style={{ display: 'grid', gap: '10px' }}>
                {order.order.lines.map((line) => (
                  <div
                    key={`${order.id}_${line.slug}`}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '14px',
                      background: 'rgba(10, 33, 76, 0.62)',
                      border: '1px solid rgba(77, 211, 232, 0.24)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: '12px',
                    }}
                  >
                    <div>
                      <strong className="payment-page-value">{line.displayName}</strong>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        {line.strengthLabel} · {line.formatType}
                      </div>
                    </div>
                    <div className="payment-page-value" style={{ fontWeight: 600 }}>{formatCurrency(line.lineSubtotal)}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'grid', gap: '8px', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                  <span>Subtotal</span>
                  <strong className="payment-page-value">{formatCurrency(order.order.totals.subtotal)}</strong>
                </div>
                {order.order.totals.discount > 0 ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                    <span>Discount</span>
                    <strong className="payment-page-value">-{formatCurrency(order.order.totals.discount)}</strong>
                  </div>
                ) : null}
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                  <span>Shipping</span>
                  <strong className="payment-page-value">
                    {order.order.totals.shipping > 0 ? formatCurrency(order.order.totals.shipping) : 'Included / none'}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                  <span>Tax</span>
                  <strong className="payment-page-value">
                    {order.order.totals.tax > 0 ? formatCurrency(order.order.totals.tax) : 'Not collected'}
                  </strong>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', borderTop: '1px solid rgba(77, 211, 232, 0.24)', paddingTop: '12px' }}>
                <span>Total</span>
                <strong className="payment-total-value">{formatCurrency(order.order.totals.total)}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
