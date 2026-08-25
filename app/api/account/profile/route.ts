import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getCustomerOrderUser } from '@/lib/customer-order-access'
import type { ManualOrderAddress } from '@/lib/manual-orders'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import {
  getMarketingSubscription,
  isTolerableMarketingError,
  moveMarketingSubscription,
  saveMarketingSubscription,
} from '@/lib/email-campaigns'

type ProfilePayload = {
  email?: string
  firstName?: string
  lastName?: string
  phone?: string
  shippingAddress?: ManualOrderAddress | null
  billingAddress?: ManualOrderAddress | null
  marketingOptIn?: boolean
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Checkout does not require an account, so orders and payment proofs can exist
// under an email that no auth user owns. Because customerOwnsOrder() authorises
// purely by comparing the signed-in email to customer_email, moving an account
// onto an address that already has guest orders would hand that account someone
// else's order history, addresses and payment proofs. auth.users uniqueness does
// not cover this — a guest has no auth row to collide with. Refuse the change
// instead, and refuse it before the auth email is touched so there is nothing to
// unwind.
async function targetEmailIsClaimed(supabase: SupabaseClient, toEmail: string) {
  const orders = await supabase
    .from('manual_orders')
    .select('id', { count: 'exact', head: true })
    .eq('customer_email', toEmail)
  if (orders.error) return { ok: false as const, error: orders.error.message }
  if ((orders.count ?? 0) > 0) return { ok: true as const, claimed: true }

  const proofs = await supabase
    .from('payment_proofs')
    .select('id', { count: 'exact', head: true })
    .eq('customer_email', toEmail)
  if (proofs.error) return { ok: false as const, error: proofs.error.message }

  return { ok: true as const, claimed: (proofs.count ?? 0) > 0 }
}

// Order history is keyed on manual_orders.customer_email, not on the auth user
// id, so an email change has to carry the customer's past orders and payment
// proofs across with it. Otherwise the account silently loses its history.
//
// The rollback below matches on toEmail, which is only safe because
// targetEmailIsClaimed() has already established that nothing sat there first.
async function relinkCustomerEmail(supabase: SupabaseClient, fromEmail: string, toEmail: string) {
  const orders = await supabase.from('manual_orders').update({ customer_email: toEmail }).eq('customer_email', fromEmail)
  if (orders.error) return { ok: false as const, error: orders.error.message }

  const proofs = await supabase.from('payment_proofs').update({ customer_email: toEmail }).eq('customer_email', fromEmail)
  if (proofs.error) {
    // Put the orders back so they are not stranded on an address no account owns.
    await supabase.from('manual_orders').update({ customer_email: fromEmail }).eq('customer_email', toEmail)
    return { ok: false as const, error: proofs.error.message }
  }

  return { ok: true as const }
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
    // Opt-out model: no recorded preference means subscribed.
    marketingOptIn: metadata.marketingOptIn !== false,
  }
}

function parsePayload(value: unknown): ProfilePayload {
  const record = asRecord(value)
  return {
    email: getString(record, 'email').toLowerCase(),
    firstName: getString(record, 'firstName'),
    lastName: getString(record, 'lastName'),
    phone: getString(record, 'phone'),
    shippingAddress: normalizeAddress(record.shippingAddress),
    billingAddress: normalizeAddress(record.billingAddress),
    marketingOptIn: record.marketingOptIn !== false,
  }
}

export async function GET(request: Request) {
  const access = await getCustomerOrderUser(request)
  if (!access.ok) {
    return NextResponse.json({ ok: false, error: access.error }, { status: access.status })
  }

  const metadata = asRecord(access.user.user_metadata)
  const profile = buildProfile(access.user.email ?? '', metadata)

  // An unsubscribe from a campaign link only touches marketing_subscribers, so
  // read the real state back here. Otherwise the checkbox would show them as
  // subscribed and the next save would quietly resubscribe them.
  const subscription = await getMarketingSubscription(profile.email)
  if (subscription.ok && subscription.isSubscribed !== null) {
    profile.marketingOptIn = subscription.isSubscribed
  }

  return NextResponse.json({ ok: true, profile })
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

  const currentEmail = (access.user.email ?? '').trim().toLowerCase()
  const nextEmail = payload.email ?? ''
  if (!nextEmail) {
    return NextResponse.json({ ok: false, error: 'Email address is required.' }, { status: 400 })
  }
  if (!EMAIL_PATTERN.test(nextEmail)) {
    return NextResponse.json({ ok: false, error: 'Enter a valid email address.' }, { status: 400 })
  }
  const emailChanged = nextEmail !== currentEmail

  if (emailChanged) {
    const claimed = await targetEmailIsClaimed(supabase, nextEmail)
    if (!claimed.ok) {
      return NextResponse.json(
        { ok: false, error: 'Your email could not be changed right now. Please try again.', detail: claimed.error },
        { status: 502 },
      )
    }
    if (claimed.claimed) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'That email address already has orders associated with it. Please contact support so we can merge the accounts safely.',
        },
        { status: 409 },
      )
    }
  }

  const currentMetadata = asRecord(access.user.user_metadata)
  const nextMetadata = {
    ...currentMetadata,
    firstName: payload.firstName,
    lastName: payload.lastName,
    phone: payload.phone ?? '',
    shippingAddress: payload.shippingAddress,
    billingAddress: payload.billingAddress,
    marketingOptIn: payload.marketingOptIn !== false,
  }

  // Email is the login identity, so this also changes how the customer signs in.
  // email_confirm mirrors registration, which creates users pre-confirmed.
  const { data, error } = await supabase.auth.admin.updateUserById(access.user.id, {
    user_metadata: nextMetadata,
    ...(emailChanged ? { email: nextEmail, email_confirm: true } : {}),
  })

  if (error || !data.user) {
    const message = (error?.message ?? '').toLowerCase()
    const isConflict = emailChanged && (message.includes('already') || message.includes('exists') || message.includes('registered'))
    return NextResponse.json(
      {
        ok: false,
        error: isConflict
          ? 'That email address is already used by another FlexMed account. Please use a different address.'
          : 'Account details could not be saved.',
        detail: error?.message,
      },
      { status: isConflict ? 409 : 502 },
    )
  }

  if (emailChanged) {
    const relinked = await relinkCustomerEmail(supabase, currentEmail, nextEmail)
    if (!relinked.ok) {
      // Put the login address back so the customer's order history stays reachable.
      await supabase.auth.admin.updateUserById(access.user.id, { email: currentEmail, email_confirm: true })
      return NextResponse.json(
        {
          ok: false,
          error: 'Your email was not changed because past orders could not be moved to the new address. Nothing was changed.',
          detail: relinked.error,
        },
        { status: 502 },
      )
    }

    const moved = await moveMarketingSubscription({
      fromEmail: currentEmail,
      toEmail: nextEmail,
      userId: data.user.id,
    })
    if (!moved.ok && !isTolerableMarketingError(moved.error)) {
      return NextResponse.json({ ok: false, error: 'Email changed, but email preferences could not be moved to the new address.' }, { status: 502 })
    }
  }

  const marketingResult = await saveMarketingSubscription({
    email: data.user.email ?? nextEmail,
    userId: data.user.id,
    subscribed: payload.marketingOptIn !== false,
    source: 'account_settings',
  })
  if (!marketingResult.ok && !isTolerableMarketingError(marketingResult.error)) {
    return NextResponse.json({ ok: false, error: 'Account details saved, but email preferences could not be updated.' }, { status: 502 })
  }

  return NextResponse.json({
    ok: true,
    profile: buildProfile(data.user.email ?? access.user.email ?? '', asRecord(data.user.user_metadata)),
  })
}
