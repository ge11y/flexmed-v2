import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { deserializeManualOrder } from '@/lib/manual-orders-db'
import type { ManualOrderSubmission } from '@/lib/manual-orders'
import { ensureOrderLabelBucket, getOrderLabelProxyUrl, getOrderLabelStoragePath, ORDER_LABEL_BUCKET } from '@/lib/order-label-assets'
import { extractShippingLabelDetails, type ShippingLabelExtraction } from '@/lib/shipping-label-extraction'

function getNormalizedLabelContentType(file: File, bytes: Uint8Array) {
  const fileName = file.name.toLowerCase()
  const reportedType = file.type || 'application/octet-stream'
  const header = new TextDecoder('latin1').decode(bytes.slice(0, 5))

  if (fileName.endsWith('.pdf') || header === '%PDF-') return 'application/pdf'
  if (reportedType === 'image/jpg') return 'image/jpeg'
  return reportedType
}

function isMissingOrderLabelColumnError(message: string) {
  const normalized = message.toLowerCase()
  return (
    normalized.includes('schema cache') ||
    normalized.includes('column') ||
    normalized.includes('label_document_name') ||
    normalized.includes('label_document_url') ||
    normalized.includes('label_document_type') ||
    normalized.includes('label_extraction_json') ||
    normalized.includes('fulfillment_updated_at')
  )
}

function formatOrderAddress(address: ManualOrderSubmission['shippingAddress']) {
  return [
    address.address1,
    address.address2,
    `${address.city}, ${address.state} ${address.postalCode}`.trim(),
    address.country,
  ]
    .filter(Boolean)
    .join('\n')
}

function fillExtractionFromOrder(extraction: ShippingLabelExtraction, order: ManualOrderSubmission): ShippingLabelExtraction {
  return {
    ...extraction,
    recipientName: extraction.recipientName || `${order.customer.firstName} ${order.customer.lastName}`.trim() || undefined,
    recipientAddress:
      extraction.recipientAddress && (extraction.recipientAddress.address1 || extraction.recipientAddress.raw)
        ? extraction.recipientAddress
        : {
            address1: order.shippingAddress.address1,
            address2: order.shippingAddress.address2,
            city: order.shippingAddress.city,
            state: order.shippingAddress.state,
            postalCode: order.shippingAddress.postalCode,
            country: order.shippingAddress.country,
            raw: formatOrderAddress(order.shippingAddress),
            source: 'order',
          },
  }
}

export async function POST(request: Request) {
  const supabase = getSupabaseAdmin()
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Supabase is not configured.' }, { status: 503 })
  }

  const formData = await request.formData()
  const orderId = formData.get('orderId')
  const file = formData.get('file')

  if (typeof orderId !== 'string' || !orderId.trim() || !(file instanceof File)) {
    return NextResponse.json({ ok: false, error: 'Order ID and label file are required.' }, { status: 400 })
  }

  const { data: currentRow, error: currentError } = await supabase.from('manual_orders').select('*').eq('id', orderId).single()
  if (currentError || !currentRow) {
    return NextResponse.json({ ok: false, error: 'Order not found for label upload.' }, { status: 404 })
  }

  const currentOrder = deserializeManualOrder(currentRow)

  await ensureOrderLabelBucket()

  const { data: existingFiles } = await supabase.storage.from(ORDER_LABEL_BUCKET).list(orderId, { limit: 20 })
  if (existingFiles?.length) {
    await supabase.storage
      .from(ORDER_LABEL_BUCKET)
      .remove(existingFiles.map((entry) => `${orderId}/${entry.name}`))
  }

  const bytes = new Uint8Array(await file.arrayBuffer())
  const contentType = getNormalizedLabelContentType(file, bytes)
  const storagePath = getOrderLabelStoragePath(orderId, file.name)
  const upload = await supabase.storage.from(ORDER_LABEL_BUCKET).upload(storagePath, file, {
    upsert: true,
    contentType,
  })

  if (upload.error) {
    return NextResponse.json(
      {
        ok: false,
        error: 'The shipping label could not be uploaded.',
        detail: upload.error.message,
      },
      { status: 502 },
    )
  }

  const extraction = fillExtractionFromOrder(
    extractShippingLabelDetails({
      fileName: file.name,
      mimeType: contentType,
      fileBytes: bytes,
    }),
    currentOrder,
  )

  const labelDocumentUrl = getOrderLabelProxyUrl(orderId)
  const fulfillmentPatch: Record<string, unknown> = {
    label_document_name: file.name,
    label_document_url: labelDocumentUrl,
    label_document_type: contentType,
    label_extraction_json: extraction,
    fulfillment_updated_at: new Date().toISOString(),
  }

  if (extraction.carrier) fulfillmentPatch.tracking_carrier = extraction.carrier
  if (extraction.trackingNumber) fulfillmentPatch.tracking_number = extraction.trackingNumber
  if (extraction.packageDetails) fulfillmentPatch.package_details = extraction.packageDetails

  const { error: updateError } = await supabase
    .from('manual_orders')
    .update(fulfillmentPatch)
    .eq('id', orderId)

  if (updateError) {
    if (!isMissingOrderLabelColumnError(updateError.message)) {
      return NextResponse.json(
        {
          ok: false,
          error: 'The label uploaded, but the order record could not be updated.',
          detail: updateError.message,
        },
        { status: 502 },
      )
    }

    const fallbackPatch: Record<string, unknown> = {}
    if (extraction.carrier) fallbackPatch.tracking_carrier = extraction.carrier
    if (extraction.trackingNumber) fallbackPatch.tracking_number = extraction.trackingNumber
    if (extraction.packageDetails) fallbackPatch.package_details = extraction.packageDetails

    if (Object.keys(fallbackPatch).length > 0) {
      const fallback = await supabase.from('manual_orders').update(fallbackPatch).eq('id', orderId)
      if (fallback.error) {
        return NextResponse.json(
          {
            ok: false,
            error: 'The label uploaded, but the order record could not be updated.',
            detail: fallback.error.message,
          },
          { status: 502 },
        )
      }
    }

    return NextResponse.json({
      ok: true,
      warning: 'Label uploaded and details extracted, but the latest label columns are missing from Supabase. Run the current schema so saved label metadata syncs across devices.',
      labelDocumentName: file.name,
      labelDocumentUrl,
      labelDocumentType: contentType,
      labelExtraction: {
        ...currentOrder.labelExtraction,
        ...extraction,
      },
    })
  }

  return NextResponse.json({
    ok: true,
    labelDocumentName: file.name,
    labelDocumentUrl,
    labelDocumentType: contentType,
    labelExtraction: {
      ...currentOrder.labelExtraction,
      ...extraction,
    },
  })
}
