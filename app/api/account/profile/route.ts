import { NextResponse } from 'next/server'
import { getCustomerOrderUser } from '@/lib/customer-order-access'
import type { ManualOrderAddress } from '@/lib/manual-orders'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { saveMarketingSubscription } from '@/lib/email-campaigns'

type ProfilePayload = {
  firstName?: string
  lastName?: string
  phone?: string
  shippingAddress?: ManualOrderAddress | null
  billingAddress?: ManualOrderAddress | null
  marketingOptIn?: boolean
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

function getString(record: Record<string, unknown>, key: string) {
  return typeof record[key] === 'string' ? record[key].trim() : ''
}

function normalizeAddress(value: unknown): ManualOrderAddress | null {
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

function buildProfile(email: string, metadata: Record<string, unknown>) {
  return {
    email,
    firstName: getString(metadata, 'firstName'),
    lastName: getString(metadata, 'lastName'),
    phone: getString(metadata, 'phone'),
    shippingAddress: normalizeAddress(metadata.shippingAddress),
    billingAddress: normalizeAddress(metadata.billingAddress),
    marketingOptIn: metadata.marketingOptIn === true,
  }
}

function parsePayload(value: unknown): ProfilePayload {
  const record = asRecord(value)
  return {
    firstName: getString(record, 'firstName'),
    lastName: getString(record, 'lastName'),
    phone: getString(record, 'phone'),
    shippingAddress: normalizeAddress(record.shippingAddress),
    billingAddress: normalizeAddress(record.billingAddress),
    marketingOptIn: record.marketingOptIn === true,
  }
}

export async function GET(request: Request) {
  const access = await getCustomerOrderUser(request)
  if (!access.ok) {
    return NextResponse.json({ ok: false, error: access.error }, { status: access.status })
  }

  const metadata = asRecord(access.user.user_metadata)
  return NextResponse.json({
    ok: true,
    profile: buildProfile(access.user.email ?? '', metadata),
  })
}

export async function PATCH(request: Request) {
  const access = await getCustomerOrderUser(request)
  if (!access.ok) {
    return NextResponse.json({ ok: false, error: access.error }, { status: access.status })
  }

  const supabase = getSupabaseAdmin()
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Account editing is not configured.' }, { status: 503 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON payload.' }, { status: 400 })
  }

  const payload = parsePayload(body)
  if (!payload.firstName || !payload.lastName) {
    return NextResponse.json({ ok: false, error: 'First and last name are required.' }, { status: 400 })
  }

  const currentMetadata = asRecord(access.user.user_metadata)
  const nextMetadata = {
    ...currentMetadata,
    firstName: payload.firstName,
    lastName: payload.lastName,
    phone: payload.phone ?? '',
    shippingAddress: payload.shippingAddress,
    billingAddress: payload.billingAddress,
    marketingOptIn: payload.marketingOptIn === true,
  }

  const { data, error } = await supabase.auth.admin.updateUserById(access.user.id, {
    user_metadata: nextMetadata,
  })

  if (error || !data.user) {
    return NextResponse.json(
      { ok: false, error: 'Account details could not be saved.', detail: error?.message },
      { status: 502 },
    )
  }

  const marketingResult = await saveMarketingSubscription({
    email: data.user.email ?? access.user.email ?? '',
    userId: data.user.id,
    subscribed: payload.marketingOptIn === true,
    source: 'account_settings',
  })
  if (!marketingResult.ok && !/not configured|relation .*does not exist|schema cache/i.test(marketingResult.error)) {
    return NextResponse.json({ ok: false, error: 'Account details saved, but email preferences could not be updated.' }, { status: 502 })
  }

  return NextResponse.json({
    ok: true,
    profile: buildProfile(data.user.email ?? access.user.email ?? '', asRecord(data.user.user_metadata)),
  })
}
