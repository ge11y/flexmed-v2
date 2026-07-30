import { NextResponse } from 'next/server'
import { customerOwnsOrder, getCustomerOrderUser } from '@/lib/customer-order-access'
import type { ManualPaymentProofSubmission } from '@/lib/manual-orders'
import { deserializeManualOrder, serializePaymentProof } from '@/lib/manual-orders-db'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { canSendTransactionalEmail, sendTransactionalEmail } from '@/lib/transactional-email'

const REQUIRED_FIELDS = ['id', 'orderId', 'createdAt', 'customerName', 'customerEmail', 'paymentMethod'] as const

function isPaymentProofSubmission(value: unknown): value is ManualPaymentProofSubmission {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return REQUIRED_FIELDS.every((field) => field in record)
}

export async function POST(request: Request) {
  const access = await getCustomerOrderUser(request)
  if (!access.ok) {
    return NextResponse.json({ ok: false, error: access.error }, { status: access.status })
  }

  let payload: unknown

  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON payload.' }, { status: 400 })
  }

  if (!isPaymentProofSubmission(payload)) {
    return NextResponse.json({ ok: false, error: 'Payment proof payload is missing required fields.' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  if (!supabase) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Supabase is not configured yet for payment proof sync.',
        code: 'missing_supabase',
      },
      { status: 503 },
    )
  }

  const { data: orderRow, error: orderLookupError } = await supabase
    .from('manual_orders')
    .select('*')
    .eq('id', payload.orderId)
    .maybeSingle()

  if (orderLookupError) {
    return NextResponse.json({ ok: false, error: 'We could not verify the linked order.' }, { status: 502 })
  }
  if (!orderRow || !customerOwnsOrder(access.user, orderRow.customer_email)) {
    return NextResponse.json({ ok: false, error: 'Order not found for this account.' }, { status: 404 })
  }

  const order = deserializeManualOrder(orderRow as never)
  const verifiedProof: ManualPaymentProofSubmission = {
    ...payload,
    customerName: `${order.customer.firstName} ${order.customer.lastName}`.trim(),
    customerEmail: order.customer.email,
    paymentMethod: order.paymentMethod,
  }

  const { error: proofError } = await supabase.from('payment_proofs').upsert(serializePaymentProof(verifiedProof))

  if (proofError) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Supabase rejected the payment proof submission.',
        detail: proofError.message,
      },
      { status: 502 },
    )
  }

  const { data: updatedRow, error: orderError } = await supabase
    .from('manual_orders')
    .update({
      status: 'proof_received',
      payment_proof_status: 'submitted',
    })
    .eq('id', payload.orderId)
    .select('*')
    .single()

  if (orderError) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Payment proof saved, but the linked order could not be updated.',
        detail: orderError.message,
      },
      { status: 502 },
    )
  }

  const updatedOrder = deserializeManualOrder(updatedRow as never)
  if (canSendTransactionalEmail()) {
    try {
      await sendTransactionalEmail(updatedOrder, 'proof_received')
    } catch (emailError) {
      console.error('proof_received email failed', emailError)
    }
  }

  return NextResponse.json({ ok: true, synced: 'supabase', order: updatedOrder })
}
