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

  const { error } = await supabase
    .from('marketing_subscribers')
    .update({ is_subscribed: false, unsubscribed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('unsubscribe_token', token)

  if (error) {
    return new NextResponse('<h1>Unsubscribe unavailable</h1><p>Please try again later.</p>', {
      status: 502,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  return new NextResponse('<h1>You are unsubscribed</h1><p>You will no longer receive promotional email updates from FlexMed.</p>', {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
