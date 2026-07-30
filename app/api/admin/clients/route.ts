import { NextResponse } from 'next/server'
import type { ManualOrderSubmission } from '@/lib/manual-orders'
import { deserializeManualOrder } from '@/lib/manual-orders-db'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

type ClientSummary = {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string
  createdAt: string
  latestShippingAddress: ManualOrderSubmission['shippingAddress'] | null
  latestBillingAddress: ManualOrderSubmission['billingAddress'] | null
  orderCount: number
  completedCount: number
  pendingCount: number
  totalSpent: number
  latestOrderAt: string | null
  lastStatus: ManualOrderSubmission['status'] | null
  orders: Array<{
    id: string
    createdAt: string
    status: ManualOrderSubmission['status']
    total: number
    itemCount: number
  }>
}

type ClientEditPayload = {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string
  shippingAddress: ManualOrderSubmission['shippingAddress'] | null
  billingAddress: ManualOrderSubmission['billingAddress'] | null
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

function getString(record: Record<string, unknown>, key: string) {
  return typeof record[key] === 'string' ? record[key].trim() : ''
}

function normalizeAddress(value: unknown): ManualOrderSubmission['shippingAddress'] | null {
  const record = asRecord(value)
  const address1 = getString(record, 'address1')
  const city = getString(record, 'city')
  const state = getString(record, 'state')
  const postalCode = getString(record, 'postalCode')
  const country = getString(record, 'country') || 'US'

  if (!address1 && !city && !state && !postalCode) return null

  return {
    address1,
    address2: getString(record, 'address2'),
    city,
    state,
    postalCode,
    country,
  }
}

function parseEditPayload(value: unknown): ClientEditPayload | null {
  const record = asRecord(value)
  const id = getString(record, 'id')
  const email = getString(record, 'email').toLowerCase()
  const firstName = getString(record, 'firstName')
  const lastName = getString(record, 'lastName')

  if (!id || !email || !firstName || !lastName) return null

  return {
    id,
    email,
    firstName,
    lastName,
    phone: getString(record, 'phone'),
    shippingAddress: normalizeAddress(record.shippingAddress),
    billingAddress: normalizeAddress(record.billingAddress),
  }
}

export async function GET() {
  const supabase = getSupabaseAdmin()
  if (!supabase) {
    return NextResponse.json({ ok: false, code: 'missing_supabase', error: 'Supabase is not configured.' }, { status: 503 })
  }

  const [{ data: authUsersData, error: authError }, { data: orderRows, error: ordersError }] = await Promise.all([
    supabase.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    supabase.from('manual_orders').select('*').order('created_at', { ascending: false }),
  ])

  if (authError || ordersError) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Supabase could not load the client CRM view.',
        detail: authError?.message ?? ordersError?.message ?? 'Unknown error',
      },
      { status: 502 },
    )
  }

  const orders = (orderRows ?? []).map(deserializeManualOrder)
  const ordersByEmail = new Map<string, ManualOrderSubmission[]>()

  for (const order of orders) {
    const key = order.customer.email.trim().toLowerCase()
    const existing = ordersByEmail.get(key) ?? []
    existing.push(order)
    ordersByEmail.set(key, existing)
  }

  const clients: ClientSummary[] = []
  const users = authUsersData?.users ?? []

  for (const user of users) {
    const email = user.email?.trim().toLowerCase()
    if (!email) continue
    const clientOrders = ordersByEmail.get(email) ?? []
    const metadata = (user.user_metadata ?? {}) as Record<string, unknown>

    const totalSpent = clientOrders.reduce((sum, order) => sum + order.order.totals.total, 0)
    const completedCount = clientOrders.filter((order) => order.status === 'shipped' || order.status === 'fulfilled').length
    const pendingCount = clientOrders.filter((order) => order.status !== 'shipped' && order.status !== 'fulfilled').length
    const latestOrder = clientOrders[0] ?? null

    clients.push({
      id: user.id,
      email,
      firstName:
        typeof metadata.firstName === 'string'
          ? metadata.firstName
          : latestOrder?.customer.firstName ?? '',
      lastName:
        typeof metadata.lastName === 'string'
          ? metadata.lastName
          : latestOrder?.customer.lastName ?? '',
      phone:
        typeof metadata.phone === 'string'
          ? metadata.phone
          : latestOrder?.customer.phone ?? '',
      createdAt: user.created_at,
      latestShippingAddress: latestOrder?.shippingAddress ?? null,
      latestBillingAddress: latestOrder?.billingAddress ?? null,
      orderCount: clientOrders.length,
      completedCount,
      pendingCount,
      totalSpent,
      latestOrderAt: latestOrder?.createdAt ?? null,
      lastStatus: latestOrder?.status ?? null,
      orders: clientOrders.map((order) => ({
        id: order.id,
        createdAt: order.createdAt,
        status: order.status,
        total: order.order.totals.total,
        itemCount: order.order.lines.reduce((sum, line) => sum + line.quantity, 0),
      })),
    })
  }

  const clientsByEmail = new Set(clients.map((client) => client.email))

  for (const [email, clientOrders] of ordersByEmail.entries()) {
    if (clientsByEmail.has(email)) continue
    const latestOrder = clientOrders[0]
    const totalSpent = clientOrders.reduce((sum, order) => sum + order.order.totals.total, 0)
    const completedCount = clientOrders.filter((order) => order.status === 'shipped' || order.status === 'fulfilled').length
    const pendingCount = clientOrders.filter((order) => order.status !== 'shipped' && order.status !== 'fulfilled').length

    clients.push({
      id: `legacy-${email}`,
      email,
      firstName: latestOrder.customer.firstName,
      lastName: latestOrder.customer.lastName,
      phone: latestOrder.customer.phone,
      createdAt: latestOrder.createdAt,
      latestShippingAddress: latestOrder.shippingAddress,
      latestBillingAddress: latestOrder.billingAddress,
      orderCount: clientOrders.length,
      completedCount,
      pendingCount,
      totalSpent,
      latestOrderAt: latestOrder.createdAt,
      lastStatus: latestOrder.status,
      orders: clientOrders.map((order) => ({
        id: order.id,
        createdAt: order.createdAt,
        status: order.status,
        total: order.order.totals.total,
        itemCount: order.order.lines.reduce((sum, line) => sum + line.quantity, 0),
      })),
    })
  }

  clients.sort((a, b) => {
    const aTime = a.latestOrderAt ? new Date(a.latestOrderAt).getTime() : 0
    const bTime = b.latestOrderAt ? new Date(b.latestOrderAt).getTime() : 0
    return bTime - aTime
  })

  return NextResponse.json({ ok: true, clients })
}

export async function PATCH(request: Request) {
  const supabase = getSupabaseAdmin()
  if (!supabase) {
    return NextResponse.json({ ok: false, code: 'missing_supabase', error: 'Supabase is not configured.' }, { status: 503 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON payload.' }, { status: 400 })
  }

  const payload = parseEditPayload(body)
  if (!payload) {
    return NextResponse.json({ ok: false, error: 'Client id, email, first name, and last name are required.' }, { status: 400 })
  }

  if (!payload.id.startsWith('legacy-')) {
    const { data: userData, error: getUserError } = await supabase.auth.admin.getUserById(payload.id)
    if (getUserError) {
      return NextResponse.json(
        { ok: false, error: 'The client account could not be loaded before editing.', detail: getUserError.message },
        { status: 502 },
      )
    }

    const metadata = asRecord(userData.user?.user_metadata)
    const { error: authError } = await supabase.auth.admin.updateUserById(payload.id, {
      user_metadata: {
        ...metadata,
        firstName: payload.firstName,
        lastName: payload.lastName,
        phone: payload.phone,
        shippingAddress: payload.shippingAddress,
        billingAddress: payload.billingAddress,
      },
    })

    if (authError) {
      return NextResponse.json(
        { ok: false, error: 'The client account could not be updated.', detail: authError.message },
        { status: 502 },
      )
    }
  }

  const orderPatch: Record<string, unknown> = {
    customer_first_name: payload.firstName,
    customer_last_name: payload.lastName,
    customer_phone: payload.phone || null,
  }
  if (payload.shippingAddress) orderPatch.shipping_address_json = payload.shippingAddress
  if (payload.billingAddress) orderPatch.billing_address_json = payload.billingAddress

  const { error: ordersError } = await supabase
    .from('manual_orders')
    .update(orderPatch)
    .eq('customer_email', payload.email)

  if (ordersError) {
    return NextResponse.json(
      { ok: false, error: 'Linked order contact details could not be updated.', detail: ordersError.message },
      { status: 502 },
    )
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request) {
  const supabase = getSupabaseAdmin()
  if (!supabase) {
    return NextResponse.json({ ok: false, code: 'missing_supabase', error: 'Supabase is not configured.' }, { status: 503 })
  }

  let payload: unknown

  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON payload.' }, { status: 400 })
  }

  const record = payload as Record<string, unknown>
  const clientId = typeof record?.id === 'string' ? record.id : ''
  const email = typeof record?.email === 'string' ? record.email.trim().toLowerCase() : ''

  if (!email) {
    return NextResponse.json({ ok: false, error: 'Client email is required for removal.' }, { status: 400 })
  }

  if (clientId && !clientId.startsWith('legacy-')) {
    const { error: authError } = await supabase.auth.admin.deleteUser(clientId)
    if (authError) {
      return NextResponse.json(
        {
          ok: false,
          error: 'The client account could not be removed.',
          detail: authError.message,
        },
        { status: 502 },
      )
    }
  }

  const { data: orders, error: ordersLookupError } = await supabase
    .from('manual_orders')
    .select('id')
    .eq('customer_email', email)

  if (ordersLookupError) {
    return NextResponse.json(
      {
        ok: false,
        error: 'The client orders could not be checked before removal.',
        detail: ordersLookupError.message,
      },
      { status: 502 },
    )
  }

  const orderIds = (orders ?? []).map((order) => order.id)

  if (orderIds.length > 0) {
    const { error: proofsDeleteError } = await supabase.from('payment_proofs').delete().in('order_id', orderIds)
    if (proofsDeleteError) {
      return NextResponse.json(
        {
          ok: false,
          error: 'The client payment proofs could not be removed.',
          detail: proofsDeleteError.message,
        },
        { status: 502 },
      )
    }

    const { error: messagesDeleteError } = await supabase.from('order_messages').delete().in('order_id', orderIds)
    if (messagesDeleteError) {
      return NextResponse.json(
        {
          ok: false,
          error: 'The client order messages could not be removed.',
          detail: messagesDeleteError.message,
        },
        { status: 502 },
      )
    }
  }

  const { error: ordersDeleteError } = await supabase.from('manual_orders').delete().eq('customer_email', email)
  if (ordersDeleteError) {
    return NextResponse.json(
      {
        ok: false,
        error: 'The client orders could not be removed.',
        detail: ordersDeleteError.message,
      },
      { status: 502 },
    )
  }

  return NextResponse.json({ ok: true })
}
