import { NextResponse } from 'next/server'
import { sendTransactionalEmail, canSendTransactionalEmail } from '@/lib/transactional-email'
import type { ManualOrderSubmission } from '@/lib/manual-orders'

type EmailKey = 'order_received' | 'payment_confirmed' | 'order_shipped'

function isPayload(value: unknown): value is { to: string; key: EmailKey } {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return (
    typeof record.to === 'string' &&
    (record.key === 'order_received' || record.key === 'payment_confirmed' || record.key === 'order_shipped')
  )
}

function buildSampleOrder(to: string): ManualOrderSubmission {
  return {
    id: '2614901',
    createdAt: new Date().toISOString(),
    status: 'waiting_to_ship',
    paymentMethod: 'paypal',
    paymentProofStatus: 'confirmed',
    customer: {
      firstName: 'FlexMed',
      lastName: 'Admin',
      email: to,
      phone: '555-555-5555',
    },
    shippingAddress: {
      address1: '123 Admin Way',
      address2: '',
      city: 'Birmingham',
      state: 'AL',
      postalCode: '35203',
      country: 'US',
    },
    billingAddress: {
      address1: '123 Admin Way',
      address2: '',
      city: 'Birmingham',
      state: 'AL',
      postalCode: '35203',
      country: 'US',
    },
    order: {
      orderId: '2614901',
      createdAt: new Date().toISOString(),
      currency: 'USD',
      lines: [
        {
          slug: 'reta-20mg',
          sku: 'RETA-20MG',
          displayName: 'Reta',
          fullName: 'Reta 20mg',
          strengthLabel: '20 mg',
          formatType: 'vial',
          quantity: 2,
          unitPrice: 125,
          lineSubtotal: 250,
        },
      ],
      totals: {
        subtotal: 250,
        shipping: 0,
        tax: 0,
        discount: 0,
        total: 250,
        itemCount: 2,
      },
      compliance: {
        researchUseAcknowledged: true,
        ageGateAcknowledged: true,
      },
      metadata: {
        source: 'flexmed_site',
        status: 'cart_draft',
      },
    },
    notes: '',
    trackingCarrier: 'UPS',
    trackingNumber: '1Z999AA10123456784',
    packageDetails: 'Small box',
    fulfillmentNotes: '',
  }
}

export async function POST(request: Request) {
  let payload: unknown

  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON payload.' }, { status: 400 })
  }

  if (!isPayload(payload)) {
    return NextResponse.json({ ok: false, error: 'Test email payload is invalid.' }, { status: 400 })
  }

  if (!canSendTransactionalEmail()) {
    return NextResponse.json({ ok: false, error: 'Email delivery is not configured yet.' }, { status: 503 })
  }

  const result = await sendTransactionalEmail(buildSampleOrder(payload.to.trim()), payload.key)
  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: result.code,
        detail: 'detail' in result ? result.detail : undefined,
      },
      { status: 502 },
    )
  }

  return NextResponse.json({ ok: true })
}
