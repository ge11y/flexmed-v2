import { NextResponse } from 'next/server'
import { buildAffiliateCode, normalizeAffiliateCode } from '@/lib/affiliates'
import { deserializeManualOrder } from '@/lib/manual-orders-db'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

type AffiliateRow = {
  id: string
  name: string
  email: string | null
  code: string
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export async function GET() {
  const supabase = getSupabaseAdmin()
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Supabase admin is not connected.' }, { status: 503 })
  }

  const [{ data: affiliateRows, error: affiliateError }, { data: orderRows, error: orderError }] = await Promise.all([
    supabase.from('affiliates').select('*').order('created_at', { ascending: false }),
    supabase.from('manual_orders').select('*').order('created_at', { ascending: false }),
  ])

  if (affiliateError) {
    return NextResponse.json({ ok: false, error: affiliateError.message }, { status: 502 })
  }

  if (orderError) {
    return NextResponse.json({ ok: false, error: orderError.message }, { status: 502 })
  }

  const orders = (orderRows ?? []).map((row) => deserializeManualOrder(row as never))
  const affiliates = (affiliateRows ?? []).map((row) => {
    const affiliate = row as AffiliateRow
    const matchedOrders = orders.filter(
      (order) =>
        (affiliate.id && order.affiliateId === affiliate.id) ||
        normalizeAffiliateCode(order.affiliateCode ?? '') === normalizeAffiliateCode(affiliate.code),
    )

    return {
      id: affiliate.id,
      name: affiliate.name,
      email: affiliate.email ?? '',
      code: affiliate.code,
      notes: affiliate.notes ?? '',
      isActive: affiliate.is_active,
      createdAt: affiliate.created_at,
      updatedAt: affiliate.updated_at,
      orderCount: matchedOrders.length,
      completedCount: matchedOrders.filter((order) => order.status === 'fulfilled').length,
      pendingCount: matchedOrders.filter((order) => order.status !== 'fulfilled').length,
      totalRevenue: matchedOrders.reduce((sum, order) => sum + Number(order.order.totals.total || 0), 0),
      orders: matchedOrders.map((order) => ({
        id: order.id,
        createdAt: order.createdAt,
        status: order.status,
        customerName: `${order.customer.firstName} ${order.customer.lastName}`.trim() || order.customer.email,
        total: order.order.totals.total,
      })),
    }
  })

  return NextResponse.json({ ok: true, affiliates })
}

export async function POST(request: Request) {
  const supabase = getSupabaseAdmin()
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Supabase admin is not connected.' }, { status: 503 })
  }

  const payload = (await request.json().catch(() => null)) as
    | { name?: string; email?: string; code?: string; notes?: string }
    | null

  const name = payload?.name?.trim() || ''
  if (!name) {
    return NextResponse.json({ ok: false, error: 'Affiliate name is required.' }, { status: 400 })
  }

  const code = normalizeAffiliateCode(payload?.code || buildAffiliateCode(name))
  if (!code) {
    return NextResponse.json({ ok: false, error: 'Affiliate code is required.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('affiliates')
    .insert({
      name,
      email: payload?.email?.trim() || null,
      code,
      notes: payload?.notes?.trim() || null,
      is_active: true,
    })
    .select('*')
    .single()

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 502 })
  }

  return NextResponse.json({ ok: true, affiliate: data })
}

export async function PATCH(request: Request) {
  const supabase = getSupabaseAdmin()
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Supabase admin is not connected.' }, { status: 503 })
  }

  const payload = (await request.json().catch(() => null)) as
    | { id?: string; name?: string; email?: string; code?: string; notes?: string; isActive?: boolean }
    | null

  if (!payload?.id) {
    return NextResponse.json({ ok: false, error: 'Affiliate id is required.' }, { status: 400 })
  }

  const patch = {
    ...(typeof payload.name === 'string' ? { name: payload.name.trim() } : {}),
    ...(typeof payload.email === 'string' ? { email: payload.email.trim() || null } : {}),
    ...(typeof payload.code === 'string' ? { code: normalizeAffiliateCode(payload.code) } : {}),
    ...(typeof payload.notes === 'string' ? { notes: payload.notes.trim() || null } : {}),
    ...(typeof payload.isActive === 'boolean' ? { is_active: payload.isActive } : {}),
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase.from('affiliates').update(patch).eq('id', payload.id).select('*').single()

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 502 })
  }

  return NextResponse.json({ ok: true, affiliate: data })
}

export async function DELETE(request: Request) {
  const supabase = getSupabaseAdmin()
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Supabase admin is not connected.' }, { status: 503 })
  }

  const payload = (await request.json().catch(() => null)) as { id?: string } | null
  if (!payload?.id) {
    return NextResponse.json({ ok: false, error: 'Affiliate id is required.' }, { status: 400 })
  }

  const { error } = await supabase.from('affiliates').delete().eq('id', payload.id)

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}
