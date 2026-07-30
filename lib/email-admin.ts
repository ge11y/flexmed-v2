import type { ManualOrderSubmission } from '@/lib/manual-orders'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export type EmailAutomationKey = 'order_received' | 'proof_received' | 'payment_confirmed' | 'order_shipped'

export interface EmailAutomationSetting {
  key: EmailAutomationKey
  label: string
  description: string
  subject: string
  bodyText: string
  isEnabled: boolean
}

export interface EmailLogRecord {
  id: string
  orderId: string | null
  messageType: string
  messageText: string
  status: string
  createdAt: string
}

export interface EmailSenderSettings {
  id: 'primary'
  businessName: string
  senderName: string
  senderEmail: string
  replyToEmail: string
  providerLabel: string
}

function buildOrderLines(order: ManualOrderSubmission) {
  return order.order.lines
    .map((line) => {
      const promotion = line.appliedPromotion
        ? ` — ${line.appliedPromotion.title}${line.freeUnits ? ` (${line.freeUnits} free)` : ''}`
        : ''
      return `${line.displayName}${line.strengthLabel ? ` (${line.strengthLabel})` : ''} x ${line.quantity}${promotion}`
    })
    .join('\n')
}

function buildPromotionSummary(order: ManualOrderSubmission) {
  const promotions = order.order.metadata.appliedPromotions ?? []
  if (promotions.length === 0) return 'None'
  return promotions
    .map((promo) => {
      const savings = promo.discountAmount > 0
        ? ` — ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(promo.discountAmount)} savings`
        : ''
      return `${promo.title}${savings}`
    })
    .join('\n')
}

export function buildDefaultEmailAutomationSettings(): EmailAutomationSetting[] {
  return [
    {
      key: 'order_received',
      label: 'Order Received',
      description: 'Sent after checkout is submitted.',
      subject: 'FlexMed order received — {{order_id}}',
      bodyText: [
        'Hello {{customer_name}},',
        '',
        'We received your order {{order_id}}.',
        '',
        'Order total: {{order_total}}',
        'Promotion savings: {{promotion_savings}}',
        '',
        'Items:',
        '{{order_lines}}',
        '',
        'Applied promotions:',
        '{{promotion_summary}}',
        '',
        'Please send payment and upload proof using this same order ID.',
        '',
        'Thank you,',
        'FlexMed',
      ].join('\n'),
      isEnabled: true,
    },
    {
      key: 'proof_received',
      label: 'Payment Proof Received',
      description: 'Sent after the customer uploads payment proof.',
      subject: 'Payment proof received — {{order_id}}',
      bodyText: [
        'Hello {{customer_name}},',
        '',
        'We received the payment proof for order {{order_id}}.',
        '',
        'Your payment is awaiting review. We will send another update after it is confirmed.',
        '',
        'Order total: {{order_total}}',
        '',
        'Thank you,',
        'FlexMed',
      ].join('\n'),
      isEnabled: true,
    },
    {
      key: 'payment_confirmed',
      label: 'Payment Confirmed',
      description: 'Sent after founder confirms payment.',
      subject: 'Payment confirmed — {{order_id}}',
      bodyText: [
        'Hello {{customer_name}},',
        '',
        'Payment for order {{order_id}} has been confirmed.',
        '',
        'Your order is now being prepared.',
        '',
        'Thank you,',
        'FlexMed',
      ].join('\n'),
      isEnabled: true,
    },
    {
      key: 'order_shipped',
      label: 'Order Shipped',
      description: 'Sent after an order is marked shipped.',
      subject: 'Order shipped — {{order_id}}',
      bodyText: [
        'Hello {{customer_name}},',
        '',
        'Your order {{order_id}} has shipped.',
        '',
        'Carrier: {{carrier}}',
        'Tracking Number: {{tracking_number}}',
        'Package Info: {{package_details}}',
        'Shipping label: attached when available.',
        '',
        'Thank you,',
        'FlexMed',
      ].join('\n'),
      isEnabled: true,
    },
  ]
}

function buildTemplateTokens(order: ManualOrderSubmission) {
  return {
    '{{customer_name}}': `${order.customer.firstName} ${order.customer.lastName}`.trim() || 'there',
    '{{order_id}}': order.id,
    '{{order_total}}': new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(order.order.totals.total),
    '{{promotion_savings}}': new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(order.order.totals.discount),
    '{{promotion_summary}}': buildPromotionSummary(order),
    '{{order_lines}}': buildOrderLines(order),
    '{{carrier}}': order.trackingCarrier || 'Not provided',
    '{{tracking_number}}': order.trackingNumber || 'Not provided',
    '{{package_details}}': order.packageDetails || 'Not provided',
  }
}

export function renderEmailTemplate(template: string, order: ManualOrderSubmission) {
  const tokens = buildTemplateTokens(order)
  return Object.entries(tokens).reduce((output, [token, value]) => output.replaceAll(token, value), template)
}

export async function resolveEmailAutomationSetting(key: EmailAutomationKey) {
  const supabase = getSupabaseAdmin()
  const defaults = buildDefaultEmailAutomationSettings()
  const defaultSetting = defaults.find((setting) => setting.key === key)

  if (!defaultSetting || !supabase) {
    return defaultSetting ?? null
  }

  const { data } = await supabase.from('email_automation_settings').select('*').eq('key', key).maybeSingle()
  if (!data) return defaultSetting

  return {
    ...defaultSetting,
    subject: (data.subject as string) ?? defaultSetting.subject,
    bodyText: (data.body_text as string) ?? defaultSetting.bodyText,
    isEnabled: Boolean(data.is_enabled),
  }
}

export async function getEmailSenderSettings() {
  const supabase = getSupabaseAdmin()
  const defaultSenderSettings: EmailSenderSettings = {
    id: 'primary',
    businessName: 'FlexMed',
    senderName: 'FlexMed',
    senderEmail: '',
    replyToEmail: '',
    providerLabel: 'Resend',
  }

  if (!supabase) return defaultSenderSettings

  const { data } = await supabase.from('email_sender_settings').select('*').eq('id', 'primary').maybeSingle()
  if (!data) return defaultSenderSettings

  return {
    id: 'primary',
    businessName: (data.business_name as string) ?? defaultSenderSettings.businessName,
    senderName: (data.sender_name as string) ?? defaultSenderSettings.senderName,
    senderEmail: (data.sender_email as string) ?? defaultSenderSettings.senderEmail,
    replyToEmail: (data.reply_to_email as string) ?? defaultSenderSettings.replyToEmail,
    providerLabel: (data.provider_label as string) ?? defaultSenderSettings.providerLabel,
  }
}

export async function getEmailAutomationSettings() {
  const supabase = getSupabaseAdmin()
  const defaults = buildDefaultEmailAutomationSettings()
  const defaultSenderSettings: EmailSenderSettings = {
    id: 'primary',
    businessName: 'FlexMed',
    senderName: 'FlexMed',
    senderEmail: '',
    replyToEmail: '',
    providerLabel: 'Resend',
  }

  if (!supabase) {
    return { settings: defaults, logs: [] as EmailLogRecord[], senderSettings: defaultSenderSettings, status: 'missing_supabase' as const }
  }

  const [settingsResponse, logsResponse, senderSettingsResponse] = await Promise.all([
    supabase.from('email_automation_settings').select('*').order('key', { ascending: true }),
    supabase
      .from('order_messages')
      .select('*')
      .eq('source', 'email')
      .order('created_at', { ascending: false })
      .limit(25),
    supabase.from('email_sender_settings').select('*').eq('id', 'primary').maybeSingle(),
  ])

  const settingsMap = new Map(
    (settingsResponse.data ?? []).map((row) => [
      row.key as EmailAutomationKey,
      {
        subject: row.subject as string,
        bodyText: row.body_text as string,
        isEnabled: Boolean(row.is_enabled),
      },
    ]),
  )

  const settings = defaults.map((setting) => ({
    ...setting,
    ...(settingsMap.get(setting.key) ?? {}),
  }))

  const logs: EmailLogRecord[] = (logsResponse.data ?? []).map((row) => ({
    id: row.id as string,
    orderId: (row.order_id as string | null) ?? null,
    messageType: row.message_type as string,
    messageText: (row.message_text as string) ?? '',
    status: row.status as string,
    createdAt: row.created_at as string,
  }))

  const senderSettings: EmailSenderSettings = senderSettingsResponse.data
    ? {
        id: 'primary',
        businessName: (senderSettingsResponse.data.business_name as string) ?? defaultSenderSettings.businessName,
        senderName: (senderSettingsResponse.data.sender_name as string) ?? defaultSenderSettings.senderName,
        senderEmail: (senderSettingsResponse.data.sender_email as string) ?? defaultSenderSettings.senderEmail,
        replyToEmail: (senderSettingsResponse.data.reply_to_email as string) ?? defaultSenderSettings.replyToEmail,
        providerLabel: (senderSettingsResponse.data.provider_label as string) ?? defaultSenderSettings.providerLabel,
      }
    : defaultSenderSettings

  return {
    settings,
    logs,
    senderSettings,
    status: settingsResponse.error || logsResponse.error || senderSettingsResponse.error ? ('partial_error' as const) : ('ok' as const),
    error: settingsResponse.error?.message ?? logsResponse.error?.message ?? senderSettingsResponse.error?.message ?? null,
  }
}

export async function saveEmailAutomationSettings(settings: EmailAutomationSetting[]) {
  const supabase = getSupabaseAdmin()
  if (!supabase) {
    return { ok: false as const, error: 'Supabase is not configured.' }
  }

  const rows = settings.map((setting) => ({
    key: setting.key,
    subject: setting.subject,
    body_text: setting.bodyText,
    is_enabled: setting.isEnabled,
    updated_at: new Date().toISOString(),
  }))

  const { error } = await supabase.from('email_automation_settings').upsert(rows, { onConflict: 'key' })
  if (error) {
    return { ok: false as const, error: error.message }
  }

  return { ok: true as const }
}

export async function saveEmailSenderSettings(settings: EmailSenderSettings) {
  const supabase = getSupabaseAdmin()
  if (!supabase) {
    return { ok: false as const, error: 'Supabase is not configured.' }
  }

  const { error } = await supabase.from('email_sender_settings').upsert(
    {
      id: 'primary',
      business_name: settings.businessName,
      sender_name: settings.senderName,
      sender_email: settings.senderEmail,
      reply_to_email: settings.replyToEmail,
      provider_label: settings.providerLabel,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' },
  )

  if (error) {
    return { ok: false as const, error: error.message }
  }

  return { ok: true as const }
}

export async function logEmailEvent(args: {
  orderId: string
  messageType: EmailAutomationKey
  messageText: string
  status: 'sent' | 'failed'
}) {
  const supabase = getSupabaseAdmin()
  if (!supabase) return

  await supabase.from('order_messages').insert({
    order_id: args.orderId,
    source: 'email',
    message_type: args.messageType,
    message_text: args.messageText,
    status: args.status,
  })
}
