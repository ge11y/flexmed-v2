import { NextResponse } from 'next/server'
import { deserializeManualOrder } from '@/lib/manual-orders-db'
import { canSendTransactionalEmail, sendTransactionalEmail } from '@/lib/transactional-email'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

type EmailType = 'payment_confirmed' | 'order_shipped'

function isPayload(value: unknown): value is { id: string; type: EmailType } {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return typeof record.id === 'string' && (record.type === 'payment_confirmed' || record.type === 'order_shipped')
}

export async function POST(request: Request) {
  let payload: unknown

  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON payload.' }, { status: 400 })
  }

  if (!isPayload(payload)) {
    return NextResponse.json({ ok: false, error: 'Email payload is missing required fields.' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Supabase is not configured.' }, { status: 503 })
  }

  const { data, error } = await supabase.from('manual_orders').select('*').eq('id', payload.id).single()
  if (error || !data) {
    return NextResponse.json({ ok: false, error: 'Order not found for email send.' }, { status: 404 })
  }

  const order = deserializeManualOrder(data)

  // The shipment email renders carrier/tracking from the persisted row, not from
  // the admin screen's local state. Those two can diverge — the admin UI keeps
  // optimistic state in localStorage even when a save never reached the database
  // — so without this guard a customer can receive "your order has shipped" with
  // "Not provided" on every tracking line while the admin still shows a number.
  if (payload.type === 'order_shipped' && !order.trackingNumber?.trim()) {
    return NextResponse.json(
      {
        ok: false,
        code: 'missing_tracking',
        error: 'No tracking number is saved for this order. Add tracking, confirm it saved, then send the shipment email.',
      },
      { status: 409 },
    )
  }

  if (!canSendTransactionalEmail()) {
    return NextResponse.json({ ok: false, code: 'missing_email_config', error: 'Email delivery is not configured yet.' }, { status: 503 })
  }

  const result = await sendTransactionalEmail(order, payload.type)
  if (!result.ok) {
    return NextResponse.json({ ok: false, code: result.code, detail: 'detail' in result ? result.detail : undefined }, { status: 502 })
  }

  return NextResponse.json({ ok: true, id: result.id })
}
