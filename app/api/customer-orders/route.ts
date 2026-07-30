import { NextResponse } from 'next/server'
import { getCustomerOrderUser } from '@/lib/customer-order-access'
import { deserializeManualOrder } from '@/lib/manual-orders-db'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: Request) {
  const access = await getCustomerOrderUser(request)
  if (!access.ok) {
    return NextResponse.json({ ok: false, error: access.error }, { status: access.status })
  }

  const supabase = getSupabaseAdmin()
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Customer order access is not configured.' }, { status: 503 })
  }

  const email = access.user.email?.trim().toLowerCase()
  if (!email) {
    return NextResponse.json({ ok: false, error: 'Please sign in to view order history.' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('manual_orders')
    .select('*')
    .eq('customer_email', email)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ ok: false, error: 'We could not load your orders.' }, { status: 502 })
  }

  return NextResponse.json({
    ok: true,
    orders: (data ?? []).map((row) => deserializeManualOrder(row as never)),
  })
}
