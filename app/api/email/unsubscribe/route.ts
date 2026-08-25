import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get('token')?.trim() || ''
  const supabase = getSupabaseAdmin()
  if (!token || !supabase) {
    return new NextResponse('<h1>Unsubscribe unavailable</h1><p>Please contact the site owner for help.</p>', {
      status: 503,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('marketing_subscribers')
    .update({ is_subscribed: false, unsubscribed_at: now, updated_at: now })
    .eq('unsubscribe_token', token)
    .select('email')

  if (error) {
    return new NextResponse('<h1>Unsubscribe unavailable</h1><p>Please try again later.</p>', {
      status: 502,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  // An update that matches nothing is not an error in PostgREST, so confirm a
  // row actually changed rather than reporting a success that never happened.
  if (!data || data.length === 0) {
    return new NextResponse('<h1>Unsubscribe link not recognized</h1><p>This link may have already been used or has expired. Please contact the site owner for help.</p>', {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  return new NextResponse('<h1>You are unsubscribed</h1><p>You will no longer receive promotional email updates from FlexMed.</p>', {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
