import { getEmailSenderSettings } from '@/lib/email-admin'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

const RESEND_API_URL = 'https://api.resend.com/emails'

export type MarketingSubscriber = {
  id: string
  email: string
  unsubscribeToken: string
  subscribedAt: string | null
}

export type EmailCampaignSummary = {
  id: string
  title: string
  subject: string
  status: string
  recipientCount: number
  sentCount: number
  failedCount: number
  createdAt: string
  sentAt: string | null
}

function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://flexmedpeptides.com').replace(/\/$/, '')
}

function getResendConfig() {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM || process.env.RESEND_FROM_EMAIL
  if (!apiKey || !from) return null
  return { apiKey, from }
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase()
}

function missingSchema(error: { message?: string } | null | undefined) {
  return Boolean(error?.message && /relation .*does not exist|schema cache|marketing_subscribers|email_campaign/i.test(error.message))
}

export async function saveMarketingSubscription(args: {
  email: string
  userId?: string | null
  subscribed: boolean
  source?: string
}) {
  const supabase = getSupabaseAdmin()
  const email = normalizeEmail(args.email)
  if (!supabase || !email) return { ok: false as const, error: 'Marketing subscription is not configured.' }

  const now = new Date().toISOString()
  const { error } = await supabase.from('marketing_subscribers').upsert(
    {
      email,
      user_id: args.userId || null,
      is_subscribed: args.subscribed,
      source: args.source || 'account',
      subscribed_at: args.subscribed ? now : null,
      unsubscribed_at: args.subscribed ? null : now,
      updated_at: now,
    },
    { onConflict: 'email' },
  )

  if (error) return { ok: false as const, error: error.message }
  return { ok: true as const }
}

// Opt-out model: customers are added when they create an account or place an
// order. This never overwrites an existing row, so a past unsubscribe is not
// resurrected by the next order.
export async function ensureMarketingSubscription(args: {
  email: string
  userId?: string | null
  source?: string
}) {
  const supabase = getSupabaseAdmin()
  const email = normalizeEmail(args.email)
  if (!supabase || !email) return { ok: false as const, error: 'Marketing subscription is not configured.' }

  const now = new Date().toISOString()
  const { error } = await supabase.from('marketing_subscribers').upsert(
    {
      email,
      user_id: args.userId || null,
      is_subscribed: true,
      source: args.source || 'account',
      subscribed_at: now,
      unsubscribed_at: null,
      updated_at: now,
    },
    { onConflict: 'email', ignoreDuplicates: true },
  )

  if (error) return { ok: false as const, error: error.message }
  return { ok: true as const }
}

// Used when a customer edits their email so their subscription record follows
// the new address instead of being stranded on the old one.
export async function moveMarketingSubscription(args: {
  fromEmail: string
  toEmail: string
  userId?: string | null
}) {
  const supabase = getSupabaseAdmin()
  const fromEmail = normalizeEmail(args.fromEmail)
  const toEmail = normalizeEmail(args.toEmail)
  if (!supabase) return { ok: false as const, error: 'Marketing subscription is not configured.' }
  if (!fromEmail || !toEmail || fromEmail === toEmail) return { ok: true as const }

  const existing = await supabase.from('marketing_subscribers').select('id').eq('email', toEmail).maybeSingle()
  if (existing.error) return { ok: false as const, error: existing.error.message }

  // A row already sits on the new address. Keep its preference — it may be an
  // unsubscribe we have to honour — and retire the old row.
  if (existing.data) {
    const { error } = await supabase.from('marketing_subscribers').delete().eq('email', fromEmail)
    if (error) return { ok: false as const, error: error.message }
    return { ok: true as const }
  }

  const { error } = await supabase
    .from('marketing_subscribers')
    .update({ email: toEmail, user_id: args.userId || null, updated_at: new Date().toISOString() })
    .eq('email', fromEmail)

  if (error) return { ok: false as const, error: error.message }
  return { ok: true as const }
}

// marketing_subscribers is what the campaign sender reads, so it — not the auth
// user metadata — is the source of truth for whether someone is subscribed.
// Returns isSubscribed: null when there is no row for the address yet.
export async function getMarketingSubscription(email: string) {
  const supabase = getSupabaseAdmin()
  const normalized = normalizeEmail(email)
  if (!supabase || !normalized) return { ok: false as const, error: 'Marketing subscription is not configured.' }

  const { data, error } = await supabase
    .from('marketing_subscribers')
    .select('is_subscribed')
    .eq('email', normalized)
    .maybeSingle()

  if (error) return { ok: false as const, error: error.message }
  return { ok: true as const, isSubscribed: data ? Boolean(data.is_subscribed) : null }
}

export function isTolerableMarketingError(message: string) {
  return /not configured|relation .*does not exist|schema cache/i.test(message)
}

export async function getCampaignDashboard() {
  const supabase = getSupabaseAdmin()
  if (!supabase) return { ok: false as const, error: 'Supabase is not configured.' }

  const [subscribersResponse, campaignsResponse] = await Promise.all([
    supabase.from('marketing_subscribers').select('id', { count: 'exact', head: true }).eq('is_subscribed', true),
    supabase.from('email_campaigns').select('*').order('created_at', { ascending: false }).limit(20),
  ])

  if (subscribersResponse.error || campaignsResponse.error) {
    const error = subscribersResponse.error || campaignsResponse.error
    return {
      ok: false as const,
      setupRequired: missingSchema(error),
      error: error?.message || 'Campaign data could not be loaded.',
    }
  }

  return {
    ok: true as const,
    subscriberCount: subscribersResponse.count ?? 0,
    campaigns: (campaignsResponse.data ?? []).map((row) => ({
      id: row.id as string,
      title: row.title as string,
      subject: row.subject as string,
      status: row.status as string,
      recipientCount: Number(row.recipient_count ?? 0),
      sentCount: Number(row.sent_count ?? 0),
      failedCount: Number(row.failed_count ?? 0),
      createdAt: row.created_at as string,
      sentAt: (row.sent_at as string | null) ?? null,
    })),
  }
}

function campaignHtml(bodyText: string, unsubscribeToken: string) {
  const body = bodyText
    .split('\n')
    .map((line) => (line.trim() ? `<p style="margin:0 0 14px">${line.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')}</p>` : '<div style="height:6px"></div>'))
    .join('')
  const unsubscribeUrl = `${getSiteUrl()}/api/email/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`
  return `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#17233f;max-width:640px;margin:auto"><div>${body}</div><hr style="border:0;border-top:1px solid #d9e1ef;margin:28px 0 16px"><p style="font-size:12px;color:#667085">You are receiving this because you have a FlexMed customer account or placed an order. <a href="${unsubscribeUrl}">Unsubscribe</a></p></div>`
}

export async function sendEmailCampaign(args: { title: string; subject: string; bodyText: string; testRecipient?: string }) {
  const supabase = getSupabaseAdmin()
  const config = getResendConfig()
  if (!supabase) return { ok: false as const, error: 'Supabase is not configured.' }
  if (!config) return { ok: false as const, error: 'Resend is not configured. Add RESEND_API_KEY and EMAIL_FROM.' }
  if (!args.subject.trim() || !args.bodyText.trim()) return { ok: false as const, error: 'Campaign subject and message are required.' }

  const query = args.testRecipient
    ? supabase.from('marketing_subscribers').select('id,email,unsubscribe_token,subscribed_at').eq('email', normalizeEmail(args.testRecipient)).limit(1)
    : supabase.from('marketing_subscribers').select('id,email,unsubscribe_token,subscribed_at').eq('is_subscribed', true).order('subscribed_at', { ascending: true })
  const recipientsResponse = await query
  if (recipientsResponse.error) return { ok: false as const, error: recipientsResponse.error.message }

  const recipients = (recipientsResponse.data ?? []) as Array<Record<string, unknown>>
  if (recipients.length === 0) return { ok: false as const, error: args.testRecipient ? 'That email is not opted in.' : 'There are no opted-in subscribers yet.' }

  const { data: campaign, error: campaignError } = await supabase
    .from('email_campaigns')
    .insert({
      title: args.title.trim() || args.subject.trim(),
      subject: args.subject.trim(),
      body_text: args.bodyText.trim(),
      status: 'sending',
      recipient_count: recipients.length,
    })
    .select('id')
    .single()
  if (campaignError || !campaign) return { ok: false as const, error: campaignError?.message || 'Campaign could not be created.' }

  let sentCount = 0
  let failedCount = 0
  for (const recipient of recipients) {
    const email = String(recipient.email)
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: config.from,
        to: [email],
        subject: args.subject.trim(),
        text: `${args.bodyText.trim()}\n\nYou are receiving this because you have a FlexMed customer account or placed an order.\nUnsubscribe: ${getSiteUrl()}/api/email/unsubscribe?token=${recipient.unsubscribe_token}`,
        html: campaignHtml(args.bodyText.trim(), String(recipient.unsubscribe_token)),
      }),
    })
    const responseBody = (await response.json().catch(() => null)) as { id?: string; message?: string } | null
    const sent = response.ok
    if (sent) sentCount += 1
    else failedCount += 1
    await supabase.from('email_campaign_sends').insert({
      campaign_id: campaign.id,
      subscriber_id: recipient.id,
      email,
      resend_id: responseBody?.id || null,
      status: sent ? 'sent' : 'failed',
      error_message: sent ? null : responseBody?.message || `Resend returned ${response.status}`,
    })
  }

  const finalStatus = failedCount > 0 && sentCount === 0 ? 'failed' : 'sent'
  await supabase.from('email_campaigns').update({
    status: finalStatus,
    sent_count: sentCount,
    failed_count: failedCount,
    sent_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq('id', campaign.id)

  return { ok: sentCount > 0, campaignId: campaign.id, sentCount, failedCount, error: sentCount > 0 ? undefined : 'No campaign emails were sent.' }
}

export async function getCampaignSenderPreview() {
  const settings = await getEmailSenderSettings()
  return { sender: settings.senderEmail || process.env.EMAIL_FROM || process.env.RESEND_FROM_EMAIL || '' }
}
