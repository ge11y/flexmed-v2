import { getSupabaseAdmin } from '@/lib/supabase-admin'
import type { ManualPaymentMethod } from '@/lib/manual-orders'

export const PAYMENT_QR_BUCKET = 'payment-qr'
export const PAYMENT_QR_METHODS: ManualPaymentMethod[] = ['cashapp', 'paypal', 'venmo', 'zelle', 'crypto', 'other']

export function isPaymentQrMethod(value: string): value is ManualPaymentMethod {
  return PAYMENT_QR_METHODS.includes(value as ManualPaymentMethod)
}

export function getPaymentQrStoragePath(method: ManualPaymentMethod) {
  return `${method}/qr`
}

export function getPaymentQrProxyUrl(method: ManualPaymentMethod, version?: string) {
  const base = `/api/payment-qr/${method}`
  return version ? `${base}?v=${encodeURIComponent(version)}` : base
}

export function normalizePaymentQrImageUrl(method: ManualPaymentMethod, value?: string) {
  const trimmed = value?.trim()
  if (!trimmed) return undefined
  const builtInImagePaths = new Set([
    '/payment-qr/cashapp.jpg',
    '/payment-qr/cashapp-screenshot-original.jpg',
    '/payment-qr/venmo.jpg',
    '/payment-qr/venmo-screenshot-original.jpg',
  ])
  if (trimmed.startsWith('/payment-qr/') && !builtInImagePaths.has(trimmed)) return getPaymentQrProxyUrl(method)
  return trimmed
}

export async function ensurePaymentQrBucket() {
  const supabase = getSupabaseAdmin()
  if (!supabase) return

  const { data: buckets, error: listError } = await supabase.storage.listBuckets()
  if (listError) throw new Error(listError.message)
  if (buckets?.some((bucket) => bucket.name === PAYMENT_QR_BUCKET)) {
    const { error } = await supabase.storage.updateBucket(PAYMENT_QR_BUCKET, {
      public: false,
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
    })
    if (error) throw new Error(error.message)
    return
  }

  const { error } = await supabase.storage.createBucket(PAYMENT_QR_BUCKET, {
    public: false,
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
  })
  if (error && !error.message.toLowerCase().includes('already exists')) throw new Error(error.message)
}
