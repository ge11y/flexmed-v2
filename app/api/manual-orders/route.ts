import { NextResponse } from 'next/server'
import { getAdminSettings } from '@/lib/admin-settings'
import { getLiveCatalogInventoryRecords } from '@/lib/catalog-live'
import type { ManualOrderSubmission } from '@/lib/manual-orders'
import { serializeManualOrder } from '@/lib/manual-orders-db'
import { normalizeAffiliateCode } from '@/lib/affiliates'
import { buildOrderDayPrefix } from '@/lib/order-ids'
import { ensureMarketingSubscription } from '@/lib/email-campaigns'
import { buildCheckoutQuote } from '@/lib/promo-pricing'
import { getActiveSitePromos } from '@/lib/site-promos'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { canSendTransactionalEmail, sendTransactionalEmail } from '@/lib/transactional-email'
import { getPublicVialCases } from '@/lib/vial-cases'

const REQUIRED_FIELDS = ['id', 'createdAt', 'status', 'paymentMethod', 'order', 'customer'] as const

function isLegacyManualOrderSchemaError(message: string) {
  const normalized = message.toLowerCase()
  return (
    normalized.includes('package_type') ||
    normalized.includes('affiliate_id') ||
    normalized.includes('affiliate_code') ||
    normalized.includes('affiliate_name') ||
    normalized.includes('affiliate_source') ||
    normalized.includes('affiliate_landing_path') ||
    normalized.includes('label_document_name') ||
    normalized.includes('label_document_url') ||
    normalized.includes('label_document_type') ||
    normalized.includes('label_extraction_json')
  )
}

function buildLegacyManualOrderInsert(order: ManualOrderSubmission) {
  const serialized = serializeManualOrder(order) as Record<string, unknown>
  delete serialized.package_type
  delete serialized.affiliate_id
  delete serialized.affiliate_code
  delete serialized.affiliate_name
  delete serialized.affiliate_source
  delete serialized.affiliate_landing_path
  delete serialized.label_document_name
  delete serialized.label_document_url
  delete serialized.label_document_type
  delete serialized.label_extraction_json
  return serialized
}

function isManualOrderSubmission(value: unknown): value is ManualOrderSubmission {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return REQUIRED_FIELDS.every((field) => field in record)
}

async function generateSequentialOrderId() {
  const supabase = getSupabaseAdmin()
  const now = new Date()
  const prefix = buildOrderDayPrefix(now)

  if (!supabase) {
    return { orderId: `${prefix}00`, createdAt: now.toISOString() }
  }

  const { data, error } = await supabase
    .from('manual_orders')
    .select('id')
    .like('id', `${prefix}%`)
    .order('id', { ascending: false })
    .limit(1)

  if (error) {
    throw new Error(error.message)
  }

  const latestId = data?.[0]?.id
  const nextSequence = latestId && latestId.startsWith(prefix) ? Number(latestId.slice(prefix.length)) + 1 : 0

  return {
    orderId: `${prefix}${String(nextSequence).padStart(2, '0')}`,
    createdAt: now.toISOString(),
  }
}

export async function POST(request: Request) {
  let payload: unknown

  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON payload.' }, { status: 400 })
  }

  if (!isManualOrderSubmission(payload)) {
    return NextResponse.json({ ok: false, error: 'Order payload is missing required fields.' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()

  try {
    const [catalog, vialCases, promos, settings] = await Promise.all([
      getLiveCatalogInventoryRecords('fresh'),
      getPublicVialCases(),
      getActiveSitePromos(),
      getAdminSettings(),
    ])
    const quote = buildCheckoutQuote({
      items: payload.order.lines.map((line) => ({
        itemType: line.itemType ?? 'product',
        slug: line.slug,
        quantity: line.quantity,
        option: line.itemType === 'vial_case' ? 'case' : 'vial',
      })),
      catalog,
      vialCases,
      promos,
      settings: settings.checkoutOperations,
      shippingPostalCode: payload.shippingAddress.postalCode,
    })

    if (quote.errors.length > 0) {
      return NextResponse.json(
        {
          ok: false,
          error: 'The order changed before submission. Review the cart and try again.',
          detail: quote.errors.join(' '),
          quote: quote.order,
        },
        { status: 409 },
      )
    }

    const maxAttempts = 4

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const { orderId, createdAt } = await generateSequentialOrderId()
      const normalizedOrder: ManualOrderSubmission = {
        ...payload,
        id: orderId,
        createdAt,
        order: {
          ...quote.order,
          orderId,
          createdAt,
        },
      }

      const submittedAffiliateCode = normalizeAffiliateCode(payload.affiliateCode ?? '')

      if (submittedAffiliateCode) {
        normalizedOrder.affiliateCode = submittedAffiliateCode
        normalizedOrder.affiliateSource = payload.affiliateSource ?? 'link'
        normalizedOrder.affiliateLandingPath = payload.affiliateLandingPath ?? '/products'

        if (supabase) {
          const { data: affiliateRow } = await supabase
            .from('affiliates')
            .select('id, name, code, is_active')
            .ilike('code', submittedAffiliateCode)
            .eq('is_active', true)
            .maybeSingle()

          if (affiliateRow) {
            normalizedOrder.affiliateId = affiliateRow.id as string
            normalizedOrder.affiliateName = affiliateRow.name as string
            normalizedOrder.affiliateCode = affiliateRow.code as string
          }
        }

        normalizedOrder.order = {
          ...normalizedOrder.order,
          metadata: {
            ...normalizedOrder.order.metadata,
            affiliate: {
              id: normalizedOrder.affiliateId,
              code: normalizedOrder.affiliateCode,
              name: normalizedOrder.affiliateName,
              source: normalizedOrder.affiliateSource,
              landingPath: normalizedOrder.affiliateLandingPath,
            },
          },
        }
      }

      if (supabase) {
        const serializedOrder = serializeManualOrder(normalizedOrder)
        let { error } = await supabase.from('manual_orders').insert(serializedOrder)

        if (error && isLegacyManualOrderSchemaError(error.message)) {
          const legacyInsert = buildLegacyManualOrderInsert(normalizedOrder)
          const retry = await supabase.from('manual_orders').insert(legacyInsert)
          error = retry.error
        }

        if (error) {
          const message = error.message.toLowerCase()
          if (message.includes('duplicate key') || message.includes('unique')) {
            continue
          }

          return NextResponse.json(
            {
              ok: false,
              error: 'Supabase rejected the order submission.',
              detail: error.message,
            },
            { status: 502 },
          )
        }

        // Opt-out model: placing an order adds the customer to marketing.
        // Never fail the order over this, and never override a past unsubscribe.
        try {
          await ensureMarketingSubscription({
            email: normalizedOrder.customer.email,
            source: 'order',
          })
        } catch (subscriptionError) {
          console.error('marketing subscription on order failed', subscriptionError)
        }

        let emailStatus: { sent: boolean; code?: string } = { sent: false, code: 'missing_email_config' }
        if (canSendTransactionalEmail()) {
          try {
            const emailResult = await sendTransactionalEmail(normalizedOrder, 'order_received')
            emailStatus = emailResult.ok ? { sent: true } : { sent: false, code: emailResult.code }
          } catch (emailError) {
            console.error('order_received email failed', emailError)
            emailStatus = { sent: false, code: 'send_failed' }
          }
        }

        return NextResponse.json({ ok: true, synced: 'supabase', order: normalizedOrder, email: emailStatus })
      }

      return NextResponse.json({ ok: true, synced: 'local', order: normalizedOrder })
    }
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Unable to generate a valid order ID.',
        detail: error instanceof Error ? error.message : 'Unknown order id error.',
      },
      { status: 500 },
    )
  }

  return NextResponse.json(
    {
      ok: false,
      error: 'Unable to reserve the next order number.',
    },
    { status: 409 },
  )
}
