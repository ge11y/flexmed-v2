import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { saveMarketingSubscription } from '@/lib/email-campaigns'

type RegisterPayload = {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  marketingOptIn?: boolean
}

function isRegisterPayload(value: unknown): value is RegisterPayload {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return (
    typeof record.email === 'string' &&
    typeof record.password === 'string' &&
    typeof record.firstName === 'string' &&
    typeof record.lastName === 'string'
  )
}

export async function POST(request: Request) {
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

  if (!isRegisterPayload(payload)) {
    return NextResponse.json({ ok: false, error: 'Registration is missing required fields.' }, { status: 400 })
  }

  const email = payload.email.trim().toLowerCase()
  const password = payload.password.trim()
  const firstName = payload.firstName.trim()
  const lastName = payload.lastName.trim()
  const phone = payload.phone?.trim() ?? ''

  if (!email || !password || !firstName || !lastName) {
    return NextResponse.json({ ok: false, error: 'Please complete all required account fields.' }, { status: 400 })
  }

  if (password.length < 8) {
    return NextResponse.json({ ok: false, error: 'Password must be at least 8 characters.' }, { status: 400 })
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      firstName,
      lastName,
      phone,
      source: 'checkout',
      marketingOptIn: payload.marketingOptIn === true,
    },
  })

  if (error) {
    const message = error.message.toLowerCase()
    const isConflict = message.includes('already') || message.includes('exists') || message.includes('registered')
    return NextResponse.json(
      {
        ok: false,
        error: isConflict ? 'An account with this email already exists.' : 'Account creation failed.',
        detail: error.message,
      },
      { status: isConflict ? 409 : 502 },
    )
  }

  const marketingResult = await saveMarketingSubscription({
    email,
    userId: data.user.id,
    subscribed: payload.marketingOptIn === true,
    source: 'account_creation',
  })
  if (!marketingResult.ok && !/not configured|relation .*does not exist|schema cache/i.test(marketingResult.error)) {
    return NextResponse.json({ ok: false, error: 'Account created, but email preferences could not be saved.' }, { status: 502 })
  }

  return NextResponse.json({
    ok: true,
    user: {
      id: data.user.id,
      email: data.user.email,
      firstName,
      lastName,
      phone,
    },
  })
}
