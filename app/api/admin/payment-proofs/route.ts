import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

function isPatchPayload(value: unknown): value is { id: string; status: 'submitted' | 'reviewed' } {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return typeof record.id === 'string' && (record.status === 'submitted' || record.status === 'reviewed')
}

export async function PATCH(request: Request) {
  let payload: unknown

  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON payload.' }, { status: 400 })
  }

  if (!isPatchPayload(payload)) {
    return NextResponse.json({ ok: false, error: 'Payment proof patch payload is missing required fields.' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  if (!supabase) {
    return NextResponse.json({ ok: false, code: 'missing_supabase', error: 'Supabase is not configured.' }, { status: 503 })
  }

  const { error } = await supabase.from('payment_proofs').update({ status: payload.status }).eq('id', payload.id)

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Supabase rejected the payment proof update.',
        detail: error.message,
      },
      { status: 502 },
    )
  }

  return NextResponse.json({ ok: true })
}
