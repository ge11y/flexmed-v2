import { NextResponse } from 'next/server'
import { customerOwnsOrder, getCustomerOrderUser } from '@/lib/customer-order-access'
import { deserializeManualOrder } from '@/lib/manual-orders-db'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const access = await getCustomerOrderUser(request)
  if (!access.ok) {
    return NextResponse.json({ ok: false, error: access.error }, { status: access.status })
  }

  const supabase = getSupabaseAdmin()
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Customer order access is not configured.' }, { status: 503 })
  }

  const { orderId } = await params
  const { data, error } = await supabase.from('manual_orders').select('*').eq('id', orderId).maybeSingle()

  if (error) {
    return NextResponse.json({ ok: false, error: 'We could not load this order.' }, { status: 502 })
  }
  if (!data || !customerOwnsOrder(access.user, data.customer_email)) {
    return NextResponse.json({ ok: false, error: 'Order not found for this account.' }, { status: 404 })
  }

  return NextResponse.json({ ok: true, order: deserializeManualOrder(data as never) })
}
