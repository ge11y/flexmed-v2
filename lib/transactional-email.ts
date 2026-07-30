import type { ManualOrderSubmission } from '@/lib/manual-orders'
import {
  getEmailSenderSettings,
  logEmailEvent,
  renderEmailTemplate,
  resolveEmailAutomationSetting,
  type EmailAutomationKey,
} from '@/lib/email-admin'
import { getOrderLabelObjectName, ORDER_LABEL_BUCKET } from '@/lib/order-label-assets'
import { getAdminSettings } from '@/lib/admin-settings'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

const RESEND_API_URL = 'https://api.resend.com/emails'

type EmailKind = EmailAutomationKey
type ResendAttachment = {
  filename: string
  content: string
}

function getEmailConfig() {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM || process.env.RESEND_FROM_EMAIL
  if (!apiKey || !from) return null
  return { apiKey, from }
}

async function buildEmailContent(order: ManualOrderSubmission, kind: EmailKind) {
  const resolved = await resolveEmailAutomationSetting(kind)
  if (!resolved) {
    return {
      subject: `FlexMed update — ${order.id}`,
      bodyText: `Order ${order.id}`,
      isEnabled: true,
    }
  }

  return {
    subject: renderEmailTemplate(resolved.subject, order),
    bodyText: renderEmailTemplate(resolved.bodyText, order),
    isEnabled: resolved.isEnabled,
  }
}

async function buildShipmentLabelAttachments(order: ManualOrderSubmission, kind: EmailKind): Promise<ResendAttachment[]> {
  if (kind !== 'order_shipped') return []

  const supabase = getSupabaseAdmin()
  if (!supabase) return []

  const objectName = await getOrderLabelObjectName(order.id)
  if (!objectName) return []

  const { data, error } = await supabase.storage.from(ORDER_LABEL_BUCKET).download(`${order.id}/${objectName}`)
  if (error || !data) return []

  const bytes = Buffer.from(await data.arrayBuffer())
  if (bytes.byteLength === 0) return []

  return [
    {
      filename: order.labelDocumentName || objectName,
      content: bytes.toString('base64'),
    },
  ]
}

export function canSendTransactionalEmail() {
  return Boolean(getEmailConfig())
}

export async function sendTransactionalEmail(order: ManualOrderSubmission, kind: EmailKind) {
  const config = getEmailConfig()
  if (!config) {
    return { ok: false as const, code: 'missing_email_config' }
  }

  const content = await buildEmailContent(order, kind)
  if (!content.isEnabled) {
    return { ok: false as const, code: 'disabled' }
  }
  const attachments = await buildShipmentLabelAttachments(order, kind)
  const senderSettings = await getEmailSenderSettings()
  const replyTo = senderSettings.replyToEmail.trim()
  const businessDetails = (await getAdminSettings()).businessDetails
  const notificationEmail = (businessDetails.orderNotificationEmail || businessDetails.companyEmail).trim().toLowerCase()
  const customerEmail = order.customer.email.trim().toLowerCase()
  const recipients = Array.from(new Set([customerEmail, notificationEmail].filter(Boolean)))
  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: config.from,
      to: recipients,
      subject: content.subject,
      text: content.bodyText,
      ...(replyTo ? { reply_to: replyTo } : {}),
      ...(attachments.length > 0 ? { attachments } : {}),
    }),
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    await logEmailEvent({
      orderId: order.id,
      messageType: kind,
      messageText: `${content.subject}\n\n${content.bodyText}${attachments.length > 0 ? '\n\nAttachment: shipping label' : ''}`,
      status: 'failed',
    })
    return { ok: false as const, code: 'send_failed', detail }
  }

  const result = (await response.json().catch(() => null)) as { id?: string } | null
  await logEmailEvent({
    orderId: order.id,
    messageType: kind,
    messageText: `${content.subject}\n\n${content.bodyText}${attachments.length > 0 ? '\n\nAttachment: shipping label' : ''}`,
    status: 'sent',
  })
  return { ok: true as const, id: result?.id ?? null }
}
