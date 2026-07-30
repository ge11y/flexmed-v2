'use client'

import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { type ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { AdminShell } from '@/components/AdminShell'
import type { EmailLogRecord } from '@/lib/email-admin'
import { dispatchAdminOrdersUpdated, markOrderSeen } from '@/lib/admin-notifications'
import { PRODUCTS, getProductImageSrc } from '@/lib/data-products'
import {
  CHECKOUT_FORM_STORAGE_KEY,
  MANUAL_ORDER_STORAGE_KEY,
  PACKAGE_TYPE_OPTIONS,
  PAYMENT_PROOF_STORAGE_KEY,
  SHIPPING_CARRIER_OPTIONS,
  getManualOrderStatusLabel,
  loadManualOrders,
  loadPaymentProofs,
  saveManualOrders,
  savePaymentProofs,
  type ManualOrderStatus,
  type ManualOrderSubmission,
  type ManualPaymentMethod,
  type ManualPaymentProofSubmission,
} from '@/lib/manual-orders'

const PAYMENT_METHOD_OPTIONS: Array<{ value: ManualPaymentMethod; label: string }> = [
  { value: 'paypal', label: 'PayPal' },
  { value: 'zelle', label: 'Zelle' },
  { value: 'cashapp', label: 'Cash App' },
  { value: 'venmo', label: 'Venmo' },
  { value: 'crypto', label: 'Crypto' },
  { value: 'other', label: 'Other' },
]

const STATUS_FLOW: ManualOrderStatus[] = [
  'submitted',
  'payment_pending',
  'proof_received',
  'waiting_to_ship',
  'shipped',
]

async function fileToPreview(file: File): Promise<{ name: string; previewUrl: string }> {
  const image = new window.Image()
  const objectUrl = URL.createObjectURL(file)

  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve()
      image.onerror = () => reject(new Error('Unable to read image'))
      image.src = objectUrl
    })

    const maxDimension = 1400
    const scale = Math.min(1, maxDimension / Math.max(image.width, image.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(image.width * scale))
    canvas.height = Math.max(1, Math.round(image.height * scale))
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Unable to prepare image preview')
    context.drawImage(image, 0, 0, canvas.width, canvas.height)

    return {
      name: file.name,
      previewUrl: canvas.toDataURL('image/jpeg', 0.8),
    }
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

async function readApiResponse(response: Response) {
  const text = await response.text()
  if (!text) return {}

  try {
    return JSON.parse(text) as Record<string, unknown>
  } catch {
    return {
      error: response.ok ? 'The server returned an unreadable response.' : `Upload failed with HTTP ${response.status}.`,
      detail: text.slice(0, 240),
    }
  }
}

function formatExtractedAddress(address?: NonNullable<ManualOrderSubmission['labelExtraction']>['recipientAddress']) {
  if (!address || typeof address !== 'object') return ''
  const record = address as NonNullable<NonNullable<ManualOrderSubmission['labelExtraction']>['recipientAddress']>
  if (record.raw) return record.raw

  return [
    record.address1,
    record.address2,
    record.city || record.state || record.postalCode ? `${record.city ?? ''}, ${record.state ?? ''} ${record.postalCode ?? ''}`.replace(/^,\s*/, '').trim() : '',
    record.country,
  ]
    .filter(Boolean)
    .join('\n')
}

function toMoney(value: number) {
  return Math.round(value * 100) / 100
}

function getOrderTotalWithShipping(order: ManualOrderSubmission, shipping: number) {
  const totals = order.order.totals
  return toMoney(totals.subtotal - totals.discount + shipping + totals.tax)
}

function buildShippingOverrideOrder(order: ManualOrderSubmission, disableShipping: boolean): ManualOrderSubmission['order'] {
  const currentOverride = order.order.metadata.shippingOverride
  const originalShipping = currentOverride?.originalShipping ?? order.order.totals.shipping
  const nextShipping = disableShipping ? 0 : originalShipping

  return {
    ...order.order,
    totals: {
      ...order.order.totals,
      shipping: toMoney(nextShipping),
      total: getOrderTotalWithShipping(order, nextShipping),
    },
    metadata: {
      ...order.order.metadata,
      shippingOverride: disableShipping
        ? {
            disabledByAdmin: true,
            originalShipping: toMoney(originalShipping),
            updatedAt: new Date().toISOString(),
            reason: 'Local pickup / admin shipping override',
          }
        : currentOverride
          ? {
              ...currentOverride,
              disabledByAdmin: false,
              updatedAt: new Date().toISOString(),
            }
          : undefined,
    },
  }
}

export default function AdminOrdersPage() {
  const searchParams = useSearchParams()
  const [orders, setOrders] = useState<ManualOrderSubmission[]>(() => {
    if (typeof window === 'undefined') return []
    return loadManualOrders()
  })
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)
  const [expandedProofOrderId, setExpandedProofOrderId] = useState<string | null>(null)
  const [expandedShipmentOrderId, setExpandedShipmentOrderId] = useState<string | null>(null)
  const [expandedProcessorOrderId, setExpandedProcessorOrderId] = useState<string | null>(null)
  const [emailMessage, setEmailMessage] = useState<string | null>(null)
  const [proofs, setProofs] = useState(() => {
    if (typeof window === 'undefined') return []
    return loadPaymentProofs()
  })
  const [emailLogs, setEmailLogs] = useState<EmailLogRecord[]>([])
  const [sendingEmailKey, setSendingEmailKey] = useState<string | null>(null)
  const [loadingRemote, setLoadingRemote] = useState(true)
  const [uploadingLabelOrderId, setUploadingLabelOrderId] = useState<string | null>(null)
  const activeOrders = useMemo(() => orders.filter((order) => order.status !== 'fulfilled'), [orders])
  const summary = useMemo(
    () => ({
      total: activeOrders.length,
      paymentPending: activeOrders.filter((order) => order.status === 'payment_pending' || order.status === 'submitted').length,
      proofReceived: activeOrders.filter((order) => order.status === 'proof_received').length,
      waitingToShip: activeOrders.filter((order) => order.status === 'waiting_to_ship').length,
      shipped: activeOrders.filter((order) => order.status === 'shipped').length,
      completed: orders.filter((order) => order.status === 'fulfilled').length,
    }),
    [activeOrders, orders],
  )

  const loadRemote = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/orders', { cache: 'no-store' })
      const result = (await response.json()) as {
        ok: boolean
        orders?: ManualOrderSubmission[]
        proofs?: ManualPaymentProofSubmission[]
        emailLogs?: EmailLogRecord[]
      }

      if (response.ok && result.ok) {
        setOrders(result.orders ?? [])
        setProofs(result.proofs ?? [])
        setEmailLogs(result.emailLogs ?? [])
      }
    } catch {
      // Keep the local browser queue as a fallback.
    } finally {
      setLoadingRemote(false)
    }
  }, [])

  useEffect(() => {
    const openOrderId = searchParams.get('open')
    if (!openOrderId) return
    const match = orders.find((order) => order.id === openOrderId)
    if (!match) return

    const timer = window.setTimeout(() => {
      setExpandedOrderId(openOrderId)
      markOrderSeen(openOrderId)
    }, 0)

    return () => window.clearTimeout(timer)
  }, [orders, searchParams])

  useEffect(() => {
    const initialLoad = window.setTimeout(() => {
      void loadRemote()
    }, 0)

    const interval = window.setInterval(() => {
      void loadRemote()
    }, 10000)

    const handleFocus = () => {
      void loadRemote()
    }

    window.addEventListener('focus', handleFocus)
    return () => {
      window.clearTimeout(initialLoad)
      window.clearInterval(interval)
      window.removeEventListener('focus', handleFocus)
    }
  }, [loadRemote])

  async function sendTransactionalEmail(orderId: string, type: 'payment_confirmed' | 'order_shipped') {
    const emailKey = `${orderId}:${type}`
    setSendingEmailKey(emailKey)
    setEmailMessage(null)
    try {
      const response = await fetch('/api/admin/orders/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, type }),
      })
      const result = (await readApiResponse(response)) as { ok?: boolean; error?: string; detail?: string; code?: string }
      if (!response.ok || !result.ok) {
        setEmailMessage(result.detail || result.error || 'Email could not be sent.')
        return
      }

      setEmailMessage(type === 'payment_confirmed' ? `Payment email sent for ${orderId}.` : `Shipment email sent for ${orderId}.`)
      await loadRemote()
      setEmailLogs((current) =>
        current.some((log) => log.orderId === orderId && log.messageType === type && log.status === 'sent')
          ? current
          : [
              {
                id: `local-${orderId}-${type}-${Date.now()}`,
                orderId,
                messageType: type,
                messageText: '',
                status: 'sent',
                createdAt: new Date().toISOString(),
              },
              ...current,
            ],
      )
    } catch {
      setEmailMessage('Email could not be sent. Check Resend/Supabase settings and try again.')
    } finally {
      setSendingEmailKey((current) => (current === emailKey ? null : current))
    }
  }

  async function updateStatus(orderId: string, status: ManualOrderStatus) {
    const next = orders.map((order) =>
      order.id === orderId
        ? {
            ...order,
            status,
            paymentProofStatus:
              status === 'waiting_to_ship' || status === 'shipped' || status === 'fulfilled'
                ? order.paymentProofStatus === 'not_received'
                  ? 'not_received'
                  : 'confirmed'
                : order.paymentProofStatus,
          }
        : order,
    )
    setOrders(next)
    saveManualOrders(next)
    dispatchAdminOrdersUpdated(next)

    try {
      const response = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: orderId,
          patch: {
            status,
            paymentProofStatus:
              status === 'waiting_to_ship' || status === 'shipped' || status === 'fulfilled'
                ? next.find((order) => order.id === orderId)?.paymentProofStatus
                : undefined,
          },
        }),
      })
      const result = (await response.json()) as {
        ok?: boolean
        inventoryChangeSummary?: ManualOrderSubmission['inventoryChangeSummary']
        unmatchedLines?: Array<{ slug: string; displayName: string; strengthLabel: string }>
        error?: string
        detail?: string
      }

      if (response.ok && result.ok && result.inventoryChangeSummary) {
        setOrders((current) => {
          const updated = current.map((order) =>
            order.id === orderId
              ? {
                  ...order,
                  inventoryChangeSummary: result.inventoryChangeSummary,
                  inventoryAdjustedAt: new Date().toISOString(),
                }
              : order,
          )
          saveManualOrders(updated)
          dispatchAdminOrdersUpdated(updated)
          return updated
        })
      }

      const outcome = {
        ok: response.ok && Boolean(result.ok),
        inventoryChangeSummary: result.inventoryChangeSummary ?? [],
        unmatchedLines: result.unmatchedLines ?? [],
        error: result.detail || result.error || '',
      }

      if (status === 'shipped' && outcome.ok) {
        void sendTransactionalEmail(orderId, 'order_shipped')
      }

      return outcome
    } catch {
      // Keep the local state so the current session is still usable.
      return {
        ok: false,
        inventoryChangeSummary: [],
        unmatchedLines: [],
        error: 'The shared order update did not finish.',
      }
    }

  }

  async function updateOrderDetails(orderId: string, patch: Partial<ManualOrderSubmission>) {
    const next = orders.map((order) =>
      order.id === orderId
        ? {
            ...order,
            ...patch,
            fulfillmentUpdatedAt: new Date().toISOString(),
          }
        : order,
    )
    setOrders(next)
    saveManualOrders(next)
    dispatchAdminOrdersUpdated(next)

    try {
      await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: orderId,
          patch: {
            ...patch,
            fulfillmentUpdatedAt: new Date().toISOString(),
          },
        }),
      })
    } catch {
      // Keep the local state so the current session is still usable.
    }
  }

  async function toggleShippingOverride(order: ManualOrderSubmission, disableShipping: boolean) {
    const nextOrderDraft = buildShippingOverrideOrder(order, disableShipping)
    await updateOrderDetails(order.id, { order: nextOrderDraft })
    setEmailMessage(
      disableShipping
        ? `Shipping removed for order ${order.id}. Customer total is now $${nextOrderDraft.totals.total.toFixed(2)}.`
        : `Shipping restored for order ${order.id}. Customer total is now $${nextOrderDraft.totals.total.toFixed(2)}.`,
    )
    window.setTimeout(() => setEmailMessage(null), 3200)
  }

  async function handleShipmentPhotoUpload(orderId: string, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const preview = await fileToPreview(file)
      updateOrderDetails(orderId, {
        shipmentPhotoName: preview.name,
        shipmentPhotoPreviewUrl: preview.previewUrl,
      })
    } catch {
      // Keep failure quiet for now; we can add a toast once the admin surface moves to shared state.
    }
  }

  async function handleShippingLabelUpload(orderId: string, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setEmailMessage(`Uploading label for ${orderId} and checking for carrier/tracking details...`)
    setUploadingLabelOrderId(orderId)

    try {
      const formData = new FormData()
      formData.append('orderId', orderId)
      formData.append('file', file)

      const response = await fetch('/api/admin/orders/label', {
        method: 'POST',
        body: formData,
      })

      const result = (await readApiResponse(response)) as {
        ok?: boolean
        error?: string
        detail?: string
        warning?: string
        labelDocumentName?: string
        labelDocumentUrl?: string
        labelDocumentType?: string
        labelExtraction?: ManualOrderSubmission['labelExtraction']
      }

      if (!response.ok || !result.ok) {
        const message = [result.error || `The label could not be uploaded for ${orderId}.`, result.detail].filter(Boolean).join(' ')
        setEmailMessage(message)
        window.setTimeout(() => setEmailMessage(null), 7000)
        return
      }

      const extraction = result.labelExtraction
      const nextOrders = orders.map((order) =>
        order.id === orderId
          ? {
              ...order,
              labelDocumentName: result.labelDocumentName,
              labelDocumentUrl: result.labelDocumentUrl,
              labelDocumentType: result.labelDocumentType,
              labelExtraction: extraction,
              trackingCarrier: extraction?.carrier || order.trackingCarrier,
              trackingNumber: extraction?.trackingNumber || order.trackingNumber,
              packageDetails: extraction?.packageDetails || order.packageDetails,
              fulfillmentUpdatedAt: new Date().toISOString(),
            }
          : order,
      )

      setOrders(nextOrders)
      saveManualOrders(nextOrders)
      dispatchAdminOrdersUpdated(nextOrders)

      const summary =
        extraction?.trackingNumber || extraction?.carrier
          ? ` Found ${[extraction?.carrier, extraction?.trackingNumber].filter(Boolean).join(' · ')}.`
          : ' No tracking details were detected, so please enter carrier and tracking manually.'
      setEmailMessage(`${result.warning ? `${result.warning} ` : ''}Saved label for ${orderId}.${summary}`)
      window.setTimeout(() => setEmailMessage(null), result.warning ? 10000 : 5200)
    } catch (error) {
      setEmailMessage(error instanceof Error ? `The label upload failed for ${orderId}: ${error.message}` : `The label upload failed for ${orderId}.`)
      window.setTimeout(() => setEmailMessage(null), 7000)
    } finally {
      setUploadingLabelOrderId(null)
      event.target.value = ''
    }
  }

  function applyLabelExtraction(order: ManualOrderSubmission) {
    if (!order.labelExtraction) {
      setEmailMessage(`No extracted label details are ready for ${order.id} yet.`)
      window.setTimeout(() => setEmailMessage(null), 2600)
      return
    }

    const patch: Partial<ManualOrderSubmission> = {
      trackingCarrier: order.labelExtraction.carrier || order.trackingCarrier,
      trackingNumber: order.labelExtraction.trackingNumber || order.trackingNumber,
      packageDetails: order.labelExtraction.packageDetails || order.packageDetails,
    }

    void updateOrderDetails(order.id, patch)
    setEmailMessage(`Applied extracted label details to ${order.id}.`)
    window.setTimeout(() => setEmailMessage(null), 2600)
  }

  function clearLocalData() {
    const confirmation = window.prompt(
      'This will permanently delete the local order queue, payment proofs, and saved checkout form data from this browser. This action cannot be undone.\n\nType CLEAR QUEUE to continue.',
      '',
    )

    if (confirmation !== 'CLEAR QUEUE') {
      return
    }

    window.localStorage.removeItem(CHECKOUT_FORM_STORAGE_KEY)
    window.localStorage.removeItem(MANUAL_ORDER_STORAGE_KEY)
    window.localStorage.removeItem(PAYMENT_PROOF_STORAGE_KEY)
    setOrders([])
    setProofs([])
    setExpandedOrderId(null)
    setExpandedProofOrderId(null)
    setExpandedShipmentOrderId(null)
  }

  function markShippedAndNotify(order: ManualOrderSubmission) {
    if (!order.trackingNumber?.trim()) {
      setEmailMessage(`Add tracking information for ${order.id} before marking it shipped.`)
      window.setTimeout(() => setEmailMessage(null), 2400)
      return
    }

    void updateStatus(order.id, 'shipped')
    setEmailMessage(`Marked ${order.id} as shipped and sent the shipment email.`)
    window.setTimeout(() => setEmailMessage(null), 2400)
  }

  async function markOrderComplete(orderId: string) {
    const order = orders.find((entry) => entry.id === orderId)
    const result = await updateStatus(orderId, 'fulfilled')
    if (order) {
      const hasProductLines = order.order.lines.some((line) => (line.itemType ?? 'product') === 'product')
      if (!result?.ok) {
        setEmailMessage(`Order ${order.id} was marked complete, but the shared inventory update failed. ${result?.error || ''}`.trim())
      } else if (result.inventoryChangeSummary.length === 0 && hasProductLines) {
        setEmailMessage(`Order ${order.id} completed, but no matching inventory rows were adjusted. Please verify the product slugs for this order.`)
      } else if (result.inventoryChangeSummary.length === 0) {
        setEmailMessage(`Order ${order.id} completed. No catalog inventory adjustment was needed for this order.`)
      } else {
        const summary = result.inventoryChangeSummary
          .map((line) => `${line.displayName} ${line.strengthLabel}: -${line.quantityDeducted}`)
          .join(' · ')
        const unmatchedSummary = result.unmatchedLines.length
          ? ` Unmatched: ${result.unmatchedLines.map((line) => `${line.displayName} ${line.strengthLabel}`).join(' · ')}.`
          : ''
        setEmailMessage(`Order ${order.id} completed. Inventory deducted for: ${summary}.${unmatchedSummary}`)
      }
      window.setTimeout(() => setEmailMessage(null), 5000)
    }
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null)
      setExpandedProofOrderId((current) => (current === orderId ? null : current))
      setExpandedShipmentOrderId((current) => (current === orderId ? null : current))
    }
  }

  async function confirmPayment(orderId: string, proofId: string) {
    const nextOrders = orders.map((order) =>
      order.id === orderId
        ? {
            ...order,
            paymentProofStatus: 'confirmed' as const,
          }
        : order,
    )
    const nextProofs = proofs.map((proof) =>
      proof.id === proofId
        ? {
            ...proof,
            status: 'reviewed' as const,
          }
        : proof,
    )

    setOrders(nextOrders)
    setProofs(nextProofs)
    saveManualOrders(nextOrders)
    savePaymentProofs(nextProofs)
    dispatchAdminOrdersUpdated(nextOrders)

    try {
      await Promise.all([
        fetch('/api/admin/orders', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: orderId,
            patch: {
              paymentProofStatus: 'confirmed',
            },
          }),
        }),
        fetch('/api/admin/payment-proofs', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: proofId,
            status: 'reviewed',
          }),
        }),
      ])
    } catch {
      // Keep the confirmed state in the current session even if the shared update misses this round.
    }

    void sendTransactionalEmail(orderId, 'payment_confirmed')
  }

  function getPaymentProofLabel(order: ManualOrderSubmission) {
    if (order.paymentProofStatus === 'confirmed') return 'Paid'
    if (order.paymentProofStatus === 'submitted') return 'Proof received'
    return 'Not received'
  }

  function toggleOrderOpen(orderId: string, currentlyExpanded: boolean) {
    setExpandedOrderId(currentlyExpanded ? null : orderId)
    if (currentlyExpanded) {
      setExpandedProofOrderId((current) => (current === orderId ? null : current))
      setExpandedShipmentOrderId((current) => (current === orderId ? null : current))
      return
    }

    markOrderSeen(orderId)
  }

  return (
    <AdminShell
      active="/admin/orders"
      title="Manual Order Queue"
      description="Review each order here, confirm payment proof, prepare the package, add shipment details, and move the order to the next stage."
      purpose="This page is the day-to-day fulfillment queue. Founder and team members can work through orders one by one and keep the shipping status current for the rest of the team."
      workflow={[
        'Open the order and confirm the payment proof matches the order ID.',
        'Review the product summary and prepare the package.',
        'Add notes, shipment photo, and tracking details.',
        'Mark the order as waiting to ship or shipped when it is ready.',
      ]}
      teamNotes={[
        'Use the order ID as the matching key between the order, payment proof, and shipment details.',
        'Keep the status current so founder can see what still needs packing versus what has already gone out.',
        'Use fulfillment notes for anything a teammate may need to know later.',
      ]}
    >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
          {[
            ['Open Orders', String(summary.total)],
            ['Payment Pending', String(summary.paymentPending)],
            ['Proof Received', String(summary.proofReceived)],
            ['Waiting to Ship', String(summary.waitingToShip)],
            ['Shipped', String(summary.shipped)],
            ['Completed', String(summary.completed)],
          ].map(([label, value]) => (
            <div key={label} className="card" style={{ padding: '18px', display: 'grid', gap: '8px' }}>
              <div className="section-label">{label}</div>
              <div style={{ fontSize: '28px', fontWeight: 600 }}>{value}</div>
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: '18px 20px', display: 'flex', justifyContent: 'space-between', gap: '20px', alignItems: 'center' }}>
          <div style={{ color: 'var(--text-secondary)' }}>
            Review incoming orders here, confirm payment, and move each order through packing and shipment.
          </div>
          <button type="button" className="fm-btn-outline" onClick={clearLocalData}>
            Clear local queue
          </button>
        </div>

        {emailMessage ? (
          <div className="card" style={{ padding: '14px 18px', color: 'var(--text-secondary)' }}>
            {emailMessage}
          </div>
        ) : null}

        {loadingRemote ? (
          <div className="card" style={{ padding: '14px 18px', color: 'var(--text-secondary)' }}>
            Loading shared order queue...
          </div>
        ) : null}

        {activeOrders.length === 0 ? (
          <div className="card" style={{ padding: '28px', color: 'var(--text-secondary)' }}>
            No active orders need work right now.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {activeOrders.map((order) => {
              const matchingProof = proofs.find((proof) => proof.orderId === order.id)
              const matchingEmailLogs = emailLogs.filter((log) => log.orderId === order.id)
              const hasPaymentEmail = matchingEmailLogs.some((log) => log.messageType === 'payment_confirmed' && log.status === 'sent')
              const hasShippedEmail = matchingEmailLogs.some((log) => log.messageType === 'order_shipped' && log.status === 'sent')
              const hasReceivedEmail = matchingEmailLogs.some((log) => log.messageType === 'order_received' && log.status === 'sent')
              const isExpanded = expandedOrderId === order.id
              const isProofExpanded = expandedProofOrderId === order.id
              const canConfirmPayment = order.paymentProofStatus !== 'confirmed' && Boolean(matchingProof)
              const shippingOverride = order.order.metadata.shippingOverride
              const shippingOverrideActive = shippingOverride?.disabledByAdmin === true
              const originalShipping = shippingOverride?.originalShipping ?? order.order.totals.shipping

              return (
              <div key={order.id} className="card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) repeat(3, minmax(120px, 0.8fr)) auto', gap: '14px', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: 600 }}>{order.id}</div>
                    <div style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
                      {order.customer.firstName} {order.customer.lastName} · {order.customer.email}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                      {[
                        ['Order Email', hasReceivedEmail],
                        ['Payment Email', hasPaymentEmail],
                        ['Shipped Email', hasShippedEmail],
                      ].map(([label, active]) => (
                        <span
                          key={String(label)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            borderRadius: '999px',
                            padding: '4px 10px',
                            fontSize: '11px',
                            fontWeight: 700,
                            background: active ? 'rgba(2, 122, 72, 0.12)' : 'rgba(100, 116, 139, 0.12)',
                            color: active ? '#027a48' : '#64748b',
                            border: active ? '1px solid rgba(2, 122, 72, 0.18)' : '1px solid rgba(100, 116, 139, 0.18)',
                          }}
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="section-label">Payment Method</div>
                    <select
                      value={order.paymentMethod}
                      onChange={(event) => updateOrderDetails(order.id, { paymentMethod: event.target.value as ManualPaymentMethod })}
                      style={{
                        marginTop: '6px',
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        background: 'var(--bg-card)',
                        color: 'var(--text-primary)',
                        padding: '7px 9px',
                        fontSize: '12px',
                        maxWidth: '130px',
                      }}
                      aria-label={`Payment method for order ${order.id}`}
                    >
                      {PAYMENT_METHOD_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <div className="section-label">Proof Status</div>
                    <div style={{ marginTop: '6px' }}>{getPaymentProofLabel(order)}</div>
                  </div>
                  <div>
                    <div className="section-label">Total</div>
                    <div style={{ marginTop: '6px' }}>${order.order.totals.total.toFixed(2)}</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="fm-btn-outline"
                      onClick={() => markOrderComplete(order.id)}
                      style={{ padding: '8px 12px', fontSize: '12px' }}
                    >
                      Complete
                    </button>
                    <span className={`badge ${order.status === 'fulfilled' || order.status === 'shipped' ? 'badge-green' : order.status === 'proof_received' || order.status === 'ready_to_fulfill' || order.status === 'waiting_to_ship' ? 'badge-blue' : 'badge-amber'}`}>
                      {getManualOrderStatusLabel(order.status)}
                    </span>
                    <button
                      type="button"
                      className={isExpanded ? 'fm-btn-primary' : 'fm-btn-outline'}
                      onClick={() => toggleOrderOpen(order.id, isExpanded)}
                      style={{ padding: '8px 12px', fontSize: '12px' }}
                    >
                      {isExpanded ? 'Close Order' : 'Open Order'}
                    </button>
                  </div>
                </div>

                {isExpanded ? (
                  <>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        padding: '14px 16px',
                        borderRadius: '14px',
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <div className="section-label">Product Summary</div>
                      <div style={{ display: 'grid', gap: '10px' }}>
                        {order.order.lines.map((line) => {
                          const itemType = line.itemType ?? 'product'
                          const product = itemType === 'product' ? PRODUCTS[line.slug] : undefined
                          const imageSrc = line.imageUrl || (product ? getProductImageSrc(product) : '/products/front.png')
                          const descriptor = [line.strengthLabel, line.formatType].filter(Boolean).join(' · ')

                          return (
                            <div
                              key={`${order.id}_${itemType}_${line.slug}`}
                              style={{
                                display: 'grid',
                                gridTemplateColumns: '56px minmax(0, 1fr) auto',
                                gap: '12px',
                                alignItems: 'center',
                                padding: '10px 12px',
                                borderRadius: '12px',
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border)',
                              }}
                            >
                              <div
                                style={{
                                  position: 'relative',
                                  width: '56px',
                                  height: '56px',
                                  borderRadius: '10px',
                                  overflow: 'hidden',
                                  background: '#fff',
                                  border: '1px solid rgba(15, 23, 42, 0.08)',
                                }}
                              >
                                <Image
                                  src={imageSrc}
                                  alt={line.displayName}
                                  fill
                                  unoptimized
                                  style={{ objectFit: 'contain' }}
                                />
                              </div>

                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontWeight: 600 }}>{line.displayName}</div>
                                {descriptor ? (
                                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                    {descriptor}
                                  </div>
                                ) : null}
                                <div style={{ marginTop: '8px' }}>
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      padding: '6px 10px',
                                      borderRadius: '999px',
                                      background: 'rgba(15, 118, 110, 0.14)',
                                      color: '#0f766e',
                                      fontSize: '14px',
                                      fontWeight: 700,
                                      letterSpacing: '0.01em',
                                      border: '1px solid rgba(15, 118, 110, 0.18)',
                                    }}
                                  >
                                    Qty {line.quantity}
                                  </span>
                                  {line.freeUnits ? (
                                    <span
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        marginLeft: '8px',
                                        padding: '6px 10px',
                                        borderRadius: '999px',
                                        background: 'rgba(2, 122, 72, 0.12)',
                                        color: '#027a48',
                                        fontSize: '12px',
                                        fontWeight: 700,
                                        border: '1px solid rgba(2, 122, 72, 0.18)',
                                      }}
                                    >
                                      {line.freeUnits} free
                                    </span>
                                  ) : null}
                                </div>
                              </div>

                              <div style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>${(line.lineTotal ?? line.lineSubtotal).toFixed(2)}</div>
                            </div>
                          )
                        })}
                      </div>
	                    </div>

	                    <div
	                      style={{
	                        display: 'grid',
	                        gap: '12px',
	                        padding: '14px 16px',
	                        borderRadius: '14px',
	                        background: 'var(--bg-elevated)',
	                        border: shippingOverrideActive ? '1px solid rgba(15, 118, 110, 0.28)' : '1px solid var(--border)',
	                      }}
	                    >
	                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
	                        <div>
	                          <div className="section-label">Shipping Override</div>
	                          <div style={{ color: 'var(--text-secondary)', marginTop: '6px', fontSize: '13px' }}>
	                            Turn shipping off for local pickup or special handling on this order only.
	                          </div>
	                        </div>
	                        <label
	                          style={{
	                            display: 'inline-flex',
	                            alignItems: 'center',
	                            gap: '8px',
	                            padding: '10px 12px',
	                            borderRadius: '999px',
	                            border: '1px solid var(--border)',
	                            background: 'var(--bg-card)',
	                            color: 'var(--text-primary)',
	                            fontSize: '13px',
	                            fontWeight: 700,
	                          }}
	                        >
	                          <input
	                            type="checkbox"
	                            checked={shippingOverrideActive}
	                            onChange={(event) => void toggleShippingOverride(order, event.target.checked)}
	                          />
	                          No shipping / pickup
	                        </label>
	                      </div>
	                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
	                        {[
	                          ['Original Shipping', `$${originalShipping.toFixed(2)}`],
	                          ['Current Shipping', `$${order.order.totals.shipping.toFixed(2)}`],
	                          ['Current Total', `$${order.order.totals.total.toFixed(2)}`],
	                        ].map(([label, value]) => (
	                          <div key={label} className="card" style={{ padding: '12px 14px', display: 'grid', gap: '5px' }}>
	                            <div className="section-label" style={{ fontSize: '11px' }}>{label}</div>
	                            <strong style={{ color: 'var(--text-primary)' }}>{value}</strong>
	                          </div>
	                        ))}
	                      </div>
	                    </div>
	
	                    {order.inventoryChangeSummary && order.inventoryChangeSummary.length > 0 ? (
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px',
                          padding: '14px 16px',
                          borderRadius: '14px',
                          background: 'var(--bg-elevated)',
                          border: '1px solid var(--border)',
                        }}
                      >
                        <div className="section-label">Inventory Deduction</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                          {order.inventoryAdjustedAt ? `Adjusted ${new Date(order.inventoryAdjustedAt).toLocaleString()}` : 'Adjusted when the order was completed.'}
                        </div>
                        <div style={{ display: 'grid', gap: '10px' }}>
                          {order.inventoryChangeSummary.map((change) => (
                            <div
                              key={`${order.id}-${change.slug}`}
                              style={{
                                display: 'grid',
                                gridTemplateColumns: 'minmax(0, 1fr) auto',
                                gap: '10px',
                                alignItems: 'center',
                                padding: '10px 12px',
                                borderRadius: '12px',
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border)',
                              }}
                            >
                              <div style={{ display: 'grid', gap: '4px' }}>
                                <strong style={{ color: 'var(--text-primary)' }}>{change.displayName}</strong>
                                <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                                  {change.strengthLabel} · {change.previousInventory ?? 0} to {change.nextInventory}
                                </div>
                              </div>
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  padding: '6px 10px',
                                  borderRadius: '999px',
                                  background: 'rgba(180, 35, 24, 0.1)',
                                  color: '#b42318',
                                  fontSize: '13px',
                                  fontWeight: 700,
                                  border: '1px solid rgba(180, 35, 24, 0.14)',
                                }}
                              >
                                -{change.quantityDeducted}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <div
                      style={{
                        padding: '14px 16px',
                        borderRadius: '14px',
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.7,
                      }}
                    >
                      <strong style={{ color: 'var(--text-primary)' }}>Matching key:</strong> {order.id}
                      <div>
                        {matchingProof
                          ? 'A payment verification with this same order ID should have been submitted. View and confirm.'
                          : 'No payment verification with this order ID has been submitted yet.'}
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gap: '12px',
                        padding: '14px 16px',
                        borderRadius: '14px',
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <div className="section-label">Label Information</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
                        <div style={{ display: 'grid', gap: '6px' }}>
                          <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Customer</div>
                          <div style={{ color: 'var(--text-primary)' }}>
                            {order.customer.firstName} {order.customer.lastName}
                          </div>
                          <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{order.customer.email}</div>
                          <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{order.customer.phone || 'No phone saved'}</div>
                        </div>
                        <div style={{ display: 'grid', gap: '6px' }}>
                          <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Ship To</div>
                          <div style={{ color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                            {[
                              order.shippingAddress.address1,
                              order.shippingAddress.address2,
                              `${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}`,
                              order.shippingAddress.country,
                            ]
                              .filter(Boolean)
                              .join('\n')}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        padding: '14px 16px',
                        borderRadius: '14px',
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div className="section-label">Email History</div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            className={hasPaymentEmail ? 'fm-btn-primary' : 'fm-btn-outline'}
                            style={{ padding: '8px 12px', fontSize: '12px' }}
                            disabled={sendingEmailKey === `${order.id}:payment_confirmed`}
                            onClick={() => void sendTransactionalEmail(order.id, 'payment_confirmed')}
                          >
                            {sendingEmailKey === `${order.id}:payment_confirmed`
                              ? 'Sending...'
                              : hasPaymentEmail
                                ? 'Payment Email Sent'
                                : 'Send Payment Email'}
                          </button>
                          <button
                            type="button"
                            className={hasShippedEmail ? 'fm-btn-primary' : 'fm-btn-outline'}
                            style={{ padding: '8px 12px', fontSize: '12px' }}
                            disabled={sendingEmailKey === `${order.id}:order_shipped`}
                            onClick={() => void sendTransactionalEmail(order.id, 'order_shipped')}
                          >
                            {sendingEmailKey === `${order.id}:order_shipped`
                              ? 'Sending...'
                              : hasShippedEmail
                                ? 'Shipped Email Sent'
                                : 'Send Shipped Email'}
                          </button>
                        </div>
                      </div>

                      {matchingEmailLogs.length === 0 ? (
                        <div style={{ color: 'var(--text-muted)' }}>No customer emails logged for this order yet.</div>
                      ) : (
                        <div style={{ display: 'grid', gap: '10px' }}>
                          {matchingEmailLogs.map((log) => (
                            <div key={log.id} className="card" style={{ padding: '12px 14px', display: 'grid', gap: '6px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                                <strong style={{ color: 'var(--text-primary)' }}>{log.messageType.replaceAll('_', ' ')}</strong>
                                <span style={{ color: log.status === 'sent' ? '#027a48' : '#b42318', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                                  {log.status}
                                </span>
                              </div>
                              <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{new Date(log.createdAt).toLocaleString()}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {matchingProof ? (
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '16px',
                          padding: '16px',
                          borderRadius: '16px',
                          background: 'var(--bg-elevated)',
                          border: '1px solid var(--border)',
                        }}
                      >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div className="section-label">Payment Verification</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                          {matchingProof.screenshotName || 'Proof image uploaded'}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="fm-btn-outline"
                        onClick={() => setExpandedProofOrderId(isProofExpanded ? null : order.id)}
                        style={{ padding: '8px 12px', fontSize: '12px' }}
                      >
                        {isProofExpanded ? 'Hide Screenshot' : 'View Screenshot'}
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px' }}>
                        <div>
                          <div className="section-label">Method</div>
                          <div style={{ marginTop: '6px' }}>{matchingProof.paymentMethod.toUpperCase()}</div>
                        </div>
                        <div>
                          <div className="section-label">Amount</div>
                          <div style={{ marginTop: '6px' }}>${matchingProof.amountPaid.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="section-label">Reference</div>
                          <div style={{ marginTop: '6px' }}>{matchingProof.transactionReference || 'Not provided'}</div>
                        </div>
                      </div>
                      {matchingProof.notes ? (
                        <div style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                          <strong style={{ color: 'var(--text-primary)' }}>Notes:</strong> {matchingProof.notes}
                        </div>
                      ) : null}
                      <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                        Verification status: {matchingProof.status === 'reviewed' ? 'Confirmed' : 'Proof received'}
                      </div>
                    </div>

                    {isProofExpanded ? (
                      <div
                        style={{
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border)',
                          borderRadius: '14px',
                          padding: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minHeight: '220px',
                        }}
                      >
                        {matchingProof.screenshotPreviewUrl ? (
                          <div style={{ position: 'relative', width: '100%', height: '320px' }}>
                            <Image
                              src={matchingProof.screenshotPreviewUrl}
                              alt={matchingProof.screenshotName || `Proof for ${matchingProof.orderId}`}
                              fill
                              unoptimized
                              style={{ objectFit: 'contain', borderRadius: '10px' }}
                            />
                          </div>
                        ) : (
                          <div style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No proof image available</div>
                        )}
                      </div>
                    ) : null}

                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className={order.paymentProofStatus === 'confirmed' || canConfirmPayment ? 'fm-btn-primary' : 'fm-btn-outline'}
                        onClick={() => confirmPayment(order.id, matchingProof.id)}
                        disabled={order.paymentProofStatus === 'confirmed'}
                      >
                        {order.paymentProofStatus === 'confirmed' ? 'Payment Received' : 'Confirm Payment Received'}
                      </button>
                    </div>
                  </div>
                    ) : null}

                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px',
                        padding: '16px',
                        borderRadius: '16px',
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border)',
                      }}
                    >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div className="section-label">Fulfillment</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                        Update packaging details, upload the packed-order photo, and mark shipment progress.
                      </div>
                    </div>
                    {order.shipmentPhotoPreviewUrl ? (
                      <button
                        type="button"
                        className="fm-btn-outline"
                        onClick={() => setExpandedShipmentOrderId(expandedShipmentOrderId === order.id ? null : order.id)}
                        style={{ padding: '8px 12px', fontSize: '12px' }}
                      >
                        {expandedShipmentOrderId === order.id ? 'Hide Packed Order Photo' : 'View Packed Order Photo'}
                      </button>
                    ) : null}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px' }}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <span className="section-label">Package Type</span>
                      <select
                        value={order.packageType ?? ''}
                        onChange={(event) =>
                          updateOrderDetails(order.id, {
                            packageType: (event.target.value || undefined) as ManualOrderSubmission['packageType'],
                          })
                        }
                        style={{
                          width: '100%',
                          borderRadius: '12px',
                          border: '1px solid var(--border)',
                          background: 'var(--bg-card)',
                          color: 'var(--text-primary)',
                          padding: '11px 12px',
                          fontSize: '14px',
                        }}
                      >
                        <option value="">Select package type</option>
                        {PACKAGE_TYPE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <span className="section-label">Carrier</span>
                      <select
                        value={SHIPPING_CARRIER_OPTIONS.includes((order.trackingCarrier ?? '') as (typeof SHIPPING_CARRIER_OPTIONS)[number]) ? (order.trackingCarrier ?? '') : order.trackingCarrier ? 'Other' : ''}
                        onChange={(event) =>
                          updateOrderDetails(order.id, {
                            trackingCarrier: event.target.value === 'Other' ? 'Other' : event.target.value || undefined,
                          })
                        }
                        style={{
                          width: '100%',
                          borderRadius: '12px',
                          border: '1px solid var(--border)',
                          background: 'var(--bg-card)',
                          color: 'var(--text-primary)',
                          padding: '11px 12px',
                          fontSize: '14px',
                        }}
                      >
                        <option value="">Select carrier</option>
                        {SHIPPING_CARRIER_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      {(order.trackingCarrier === 'Other' ||
                        (order.trackingCarrier && !SHIPPING_CARRIER_OPTIONS.includes(order.trackingCarrier as (typeof SHIPPING_CARRIER_OPTIONS)[number]))) ? (
                        <input
                          value={order.trackingCarrier === 'Other' ? '' : order.trackingCarrier ?? ''}
                          onChange={(event) => updateOrderDetails(order.id, { trackingCarrier: event.target.value || 'Other' })}
                          style={{
                            width: '100%',
                            borderRadius: '12px',
                            border: '1px solid var(--border)',
                            background: 'var(--bg-card)',
                            color: 'var(--text-primary)',
                            padding: '11px 12px',
                            fontSize: '14px',
                          }}
                          placeholder="Enter custom carrier"
                        />
                      ) : null}
                    </label>

                    <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <span className="section-label">Tracking Number / Label</span>
                      <input
                        value={order.trackingNumber ?? ''}
                        onChange={(event) => updateOrderDetails(order.id, { trackingNumber: event.target.value })}
                        style={{
                          width: '100%',
                          borderRadius: '12px',
                          border: '1px solid var(--border)',
                          background: 'var(--bg-card)',
                          color: 'var(--text-primary)',
                          padding: '11px 12px',
                          fontSize: '14px',
                        }}
                        placeholder="Tracking number or shipping label reference"
                      />
                    </label>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gap: '12px',
                      padding: '14px 16px',
                      borderRadius: '14px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <div>
                        <div className="section-label">Shipping Label File</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '6px' }}>
                          Upload the saved label PDF or screenshot. We will try to pull the carrier and tracking number before founder confirms it.
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {order.labelDocumentUrl ? (
                          <a href={order.labelDocumentUrl} target="_blank" rel="noreferrer" className="fm-btn-outline" style={{ padding: '8px 12px', fontSize: '12px', textDecoration: 'none' }}>
                            Open Saved Label
                          </a>
                        ) : null}
                        <label
                          className="fm-btn-outline"
                          style={{
                            padding: '8px 12px',
                            fontSize: '12px',
                            cursor: uploadingLabelOrderId === order.id ? 'wait' : 'pointer',
                            opacity: uploadingLabelOrderId === order.id ? 0.68 : 1,
                          }}
                        >
                          {uploadingLabelOrderId === order.id ? 'Uploading...' : 'Upload Label'}
                          <input
                            type="file"
                            accept="application/pdf,image/png,image/jpeg,image/webp,.pdf,.png,.jpg,.jpeg,.webp"
                            disabled={uploadingLabelOrderId === order.id}
                            onChange={(event) => void handleShippingLabelUpload(order.id, event)}
                            style={{ display: 'none' }}
                          />
                        </label>
                      </div>
                    </div>

                    {order.labelDocumentName ? (
                      <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                        Saved file: {order.labelDocumentName}
                      </div>
                    ) : null}

                    {order.labelExtraction ? (
                      <div
                        style={{
                          display: 'grid',
                          gap: '12px',
                          padding: '12px 14px',
                          borderRadius: '12px',
                          background: 'rgba(37, 99, 235, 0.06)',
                          border: '1px solid rgba(37, 99, 235, 0.14)',
                        }}
                      >
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                          <div>
                            <div className="section-label">Detected Carrier</div>
                            <div style={{ marginTop: '6px' }}>{order.labelExtraction.carrier || 'Not detected yet'}</div>
                          </div>
                          <div>
                            <div className="section-label">Detected Tracking</div>
                            <div style={{ marginTop: '6px', wordBreak: 'break-word' }}>{order.labelExtraction.trackingNumber || 'Not detected yet'}</div>
                          </div>
                          <div>
                            <div className="section-label">Confidence</div>
                            <div style={{ marginTop: '6px', textTransform: 'capitalize' }}>{order.labelExtraction.confidence || 'low'}</div>
                          </div>
                          <div>
                            <div className="section-label">Recipient</div>
                            <div style={{ marginTop: '6px' }}>{order.labelExtraction.recipientName || 'Not detected yet'}</div>
                          </div>
                        </div>

                        {order.labelExtraction.recipientAddress ? (
                          <div
                            style={{
                              display: 'grid',
                              gap: '6px',
                              padding: '10px 12px',
                              borderRadius: '10px',
                              background: 'rgba(15, 23, 42, 0.04)',
                              border: '1px solid rgba(15, 23, 42, 0.08)',
                            }}
                          >
                            <div className="section-label">
                              Label Address {order.labelExtraction.recipientAddress.source === 'order' ? '(from order fallback)' : '(from label)'}
                            </div>
                            <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                              {formatExtractedAddress(order.labelExtraction.recipientAddress) || 'Not detected yet'}
                            </div>
                          </div>
                        ) : null}

                        {order.labelExtraction.rawTextPreview ? (
                          <div style={{ color: 'var(--text-secondary)', fontSize: '12px', lineHeight: 1.6 }}>
                            <strong style={{ color: 'var(--text-primary)' }}>Extraction preview:</strong> {order.labelExtraction.rawTextPreview}
                          </div>
                        ) : null}

                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <button type="button" className="fm-btn-primary" style={{ padding: '8px 12px', fontSize: '12px' }} onClick={() => applyLabelExtraction(order)}>
                            Use Extracted Details
                          </button>
                          <div style={{ color: 'var(--text-muted)', fontSize: '12px', alignSelf: 'center' }}>
                            Review first. Founder can still edit the fields after applying.
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span className="section-label">Package Info</span>
                    <input
                      value={order.packageDetails ?? ''}
                      onChange={(event) => updateOrderDetails(order.id, { packageDetails: event.target.value })}
                      style={{
                        width: '100%',
                        borderRadius: '12px',
                        border: '1px solid var(--border)',
                        background: 'var(--bg-card)',
                        color: 'var(--text-primary)',
                        padding: '11px 12px',
                        fontSize: '14px',
                      }}
                      placeholder="Package type, count, weight, or anything founder wants saved"
                    />
                  </label>

                  <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span className="section-label">Fulfillment Notes</span>
                    <textarea
                      value={order.fulfillmentNotes ?? ''}
                      onChange={(event) => updateOrderDetails(order.id, { fulfillmentNotes: event.target.value })}
                      style={{
                        width: '100%',
                        minHeight: '96px',
                        resize: 'vertical',
                        borderRadius: '12px',
                        border: '1px solid var(--border)',
                        background: 'var(--bg-card)',
                        color: 'var(--text-primary)',
                        padding: '11px 12px',
                        fontSize: '14px',
                      }}
                      placeholder="Packing notes, shipment notes, or internal follow-up"
                    />
                  </label>

                  <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span className="section-label">Packed Order Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) => handleShipmentPhotoUpload(order.id, event)}
                      style={{
                        width: '100%',
                        borderRadius: '12px',
                        border: '1px solid var(--border)',
                        background: 'var(--bg-card)',
                        color: 'var(--text-primary)',
                        padding: '11px 12px',
                        fontSize: '14px',
                      }}
                    />
                    {order.shipmentPhotoName ? (
                      <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{order.shipmentPhotoName}</div>
                    ) : null}
                  </label>

                  {expandedShipmentOrderId === order.id && order.shipmentPhotoPreviewUrl ? (
                    <div
                      style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: '14px',
                        padding: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '220px',
                      }}
                    >
                      <div style={{ position: 'relative', width: '100%', height: '320px' }}>
                        <Image
                          src={order.shipmentPhotoPreviewUrl}
                          alt={order.shipmentPhotoName || `Packed order ${order.id}`}
                          fill
                          unoptimized
                          style={{ objectFit: 'contain', borderRadius: '10px' }}
                        />
                      </div>
                    </div>
                  ) : null}

                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className={order.status === 'waiting_to_ship' || order.status === 'ready_to_fulfill' ? 'fm-btn-primary' : 'fm-btn-outline'}
                      onClick={() => updateStatus(order.id, 'waiting_to_ship')}
                    >
                      Waiting to Ship
                    </button>
                    <button
                      type="button"
                      className={order.status === 'shipped' || order.status === 'fulfilled' ? 'fm-btn-primary' : 'fm-btn-outline'}
                      onClick={() => markShippedAndNotify(order)}
                    >
                      Shipped / Send Shipment Email
                    </button>
                  </div>
                    </div>
                  </>
                ) : null}

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {STATUS_FLOW.map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => updateStatus(order.id, status)}
                      className={order.status === status ? 'fm-btn-primary' : 'fm-btn-outline'}
                      style={{ padding: '8px 12px', fontSize: '12px' }}
                    >
                      {getManualOrderStatusLabel(status)}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setExpandedProcessorOrderId((current) => (current === order.id ? null : order.id))}
                    className={expandedProcessorOrderId === order.id ? 'fm-btn-primary' : 'fm-btn-outline'}
                    style={{ padding: '8px 12px', fontSize: '12px' }}
                  >
                    Processor Data
                  </button>
                </div>
                {expandedProcessorOrderId === order.id ? (
                  <pre
                    style={{
                      margin: '12px 0 0',
                      padding: '12px',
                      borderRadius: '10px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      overflowX: 'auto',
                      fontSize: '11px',
                      lineHeight: 1.6,
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {JSON.stringify(
                      {
                        orderId: order.order.orderId,
                        customerEmail: order.customer.email,
                        totals: order.order.totals,
                        lineCount: order.order.lines.length,
                        lines: order.order.lines.map((line) => ({
                          itemType: line.itemType ?? 'product',
                          sourceId: line.sourceId ?? line.slug,
                          sku: line.sku,
                          displayName: line.displayName,
                          strengthLabel: line.strengthLabel,
                          quantity: line.quantity,
                          unitPrice: line.unitPrice,
                          lineSubtotal: line.lineSubtotal,
                        })),
                      },
                      null,
                      2,
                    )}
                  </pre>
                ) : null}
              </div>
            )})}
          </div>
        )}
    </AdminShell>
  )
}
