import type { ManualOrderSubmission, ManualPaymentProofSubmission } from '@/lib/manual-orders'

type ManualOrderRow = {
  id: string
  created_at: string
  status: ManualOrderSubmission['status']
  payment_method: ManualOrderSubmission['paymentMethod']
  customer_first_name: string
  customer_last_name: string
  customer_email: string
  customer_phone: string | null
  shipping_address_json: ManualOrderSubmission['shippingAddress']
  billing_address_json: ManualOrderSubmission['billingAddress']
  order_json: ManualOrderSubmission['order']
  payment_proof_status: ManualOrderSubmission['paymentProofStatus']
  notes: string | null
  fulfillment_notes: string | null
  tracking_carrier: string | null
  tracking_number: string | null
  package_type: ManualOrderSubmission['packageType'] | null
  package_details: string | null
  shipment_photo_url: string | null
  label_document_name: string | null
  label_document_url: string | null
  label_document_type: string | null
  label_extraction_json: ManualOrderSubmission['labelExtraction'] | null
  fulfillment_updated_at: string | null
  affiliate_id: string | null
  affiliate_code: string | null
  affiliate_name: string | null
  affiliate_source: ManualOrderSubmission['affiliateSource'] | null
  affiliate_landing_path: string | null
  inventory_change_json: ManualOrderSubmission['inventoryChangeSummary'] | null
  inventory_adjusted_at: string | null
}

type PaymentProofRow = {
  id: string
  order_id: string
  created_at: string
  customer_name: string
  customer_email: string
  payment_method: ManualPaymentProofSubmission['paymentMethod']
  amount_paid: number | string
  transaction_reference: string | null
  notes: string | null
  screenshot_name: string | null
  screenshot_url: string | null
  status: ManualPaymentProofSubmission['status']
}

export function serializeManualOrder(order: ManualOrderSubmission) {
  return {
    id: order.id,
    created_at: order.createdAt,
    status: order.status,
    payment_method: order.paymentMethod,
    customer_first_name: order.customer.firstName,
    customer_last_name: order.customer.lastName,
    customer_email: order.customer.email,
    customer_phone: order.customer.phone || null,
    shipping_address_json: order.shippingAddress,
    billing_address_json: order.billingAddress,
    order_json: order.order,
    payment_proof_status: order.paymentProofStatus,
    notes: order.notes ?? null,
    fulfillment_notes: order.fulfillmentNotes ?? null,
    tracking_carrier: order.trackingCarrier ?? null,
    tracking_number: order.trackingNumber ?? null,
    package_type: order.packageType ?? null,
    package_details: order.packageDetails ?? null,
    shipment_photo_url: order.shipmentPhotoPreviewUrl ?? null,
    label_document_name: order.labelDocumentName ?? null,
    label_document_url: order.labelDocumentUrl ?? null,
    label_document_type: order.labelDocumentType ?? null,
    label_extraction_json: order.labelExtraction ?? null,
    fulfillment_updated_at: order.fulfillmentUpdatedAt ?? null,
    affiliate_id: order.affiliateId ?? null,
    affiliate_code: order.affiliateCode ?? null,
    affiliate_name: order.affiliateName ?? null,
    affiliate_source: order.affiliateSource ?? null,
    affiliate_landing_path: order.affiliateLandingPath ?? null,
    inventory_change_json: order.inventoryChangeSummary ?? null,
    inventory_adjusted_at: order.inventoryAdjustedAt ?? null,
  }
}

export function deserializeManualOrder(row: ManualOrderRow): ManualOrderSubmission {
  const affiliateSnapshot = row.order_json.metadata.affiliate

  return {
    id: row.id,
    createdAt: row.created_at,
    status: row.status,
    paymentMethod: row.payment_method,
    customer: {
      firstName: row.customer_first_name,
      lastName: row.customer_last_name,
      email: row.customer_email,
      phone: row.customer_phone ?? '',
    },
    shippingAddress: row.shipping_address_json,
    billingAddress: row.billing_address_json,
    order: row.order_json,
    paymentProofStatus: row.payment_proof_status,
    notes: row.notes ?? undefined,
    fulfillmentNotes: row.fulfillment_notes ?? undefined,
    trackingCarrier: row.tracking_carrier ?? undefined,
    trackingNumber: row.tracking_number ?? undefined,
    packageType: row.package_type ?? undefined,
    packageDetails: row.package_details ?? undefined,
    shipmentPhotoPreviewUrl: row.shipment_photo_url ?? undefined,
    shipmentPhotoName: row.shipment_photo_url ? 'Packed order photo' : undefined,
    labelDocumentName: row.label_document_name ?? undefined,
    labelDocumentUrl: row.label_document_url ?? undefined,
    labelDocumentType: row.label_document_type ?? undefined,
    labelExtraction: row.label_extraction_json ?? undefined,
    fulfillmentUpdatedAt: row.fulfillment_updated_at ?? undefined,
    affiliateId: row.affiliate_id ?? affiliateSnapshot?.id ?? undefined,
    affiliateCode: row.affiliate_code ?? affiliateSnapshot?.code ?? undefined,
    affiliateName: row.affiliate_name ?? affiliateSnapshot?.name ?? undefined,
    affiliateSource: row.affiliate_source ?? affiliateSnapshot?.source ?? undefined,
    affiliateLandingPath: row.affiliate_landing_path ?? affiliateSnapshot?.landingPath ?? undefined,
    inventoryChangeSummary: row.inventory_change_json ?? undefined,
    inventoryAdjustedAt: row.inventory_adjusted_at ?? undefined,
  }
}

export function serializePaymentProof(proof: ManualPaymentProofSubmission) {
  return {
    id: proof.id,
    order_id: proof.orderId,
    created_at: proof.createdAt,
    customer_name: proof.customerName,
    customer_email: proof.customerEmail,
    payment_method: proof.paymentMethod,
    amount_paid: proof.amountPaid,
    transaction_reference: proof.transactionReference || null,
    notes: proof.notes ?? null,
    screenshot_name: proof.screenshotName ?? null,
    screenshot_url: proof.screenshotPreviewUrl ?? null,
    status: proof.status,
  }
}

export function deserializePaymentProof(row: PaymentProofRow): ManualPaymentProofSubmission {
  return {
    id: row.id,
    orderId: row.order_id,
    createdAt: row.created_at,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    paymentMethod: row.payment_method,
    amountPaid: typeof row.amount_paid === 'string' ? Number(row.amount_paid) : row.amount_paid,
    transactionReference: row.transaction_reference ?? '',
    notes: row.notes ?? undefined,
    screenshotName: row.screenshot_name ?? undefined,
    screenshotPreviewUrl: row.screenshot_url ?? undefined,
    status: row.status,
  }
}
