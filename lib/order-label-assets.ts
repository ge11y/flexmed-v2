import { getSupabaseAdmin } from '@/lib/supabase-admin'

export const ORDER_LABEL_BUCKET = 'order-labels'

function getFileExtension(fileName: string) {
  const extension = fileName.split('.').pop()?.trim().toLowerCase()
  return extension && extension !== fileName.toLowerCase() ? extension : ''
}

export function getOrderLabelStoragePath(orderId: string, fileName: string) {
  const extension = getFileExtension(fileName)
  return `${orderId}/label${extension ? `.${extension}` : ''}`
}

export function getOrderLabelProxyUrl(orderId: string) {
  return `/api/admin/orders/label/${orderId}`
}

export async function ensureOrderLabelBucket() {
  const supabase = getSupabaseAdmin()
  if (!supabase) return

  const { data: buckets } = await supabase.storage.listBuckets()
  const existingBucket = buckets?.find((entry) => entry.name === ORDER_LABEL_BUCKET)
  if (existingBucket) {
    await supabase.storage.updateBucket(ORDER_LABEL_BUCKET, {
      public: false,
      allowedMimeTypes: ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'],
    })
    return
  }

  await supabase.storage.createBucket(ORDER_LABEL_BUCKET, {
    public: false,
    allowedMimeTypes: ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'],
  })
}

export async function getOrderLabelObjectName(orderId: string) {
  const supabase = getSupabaseAdmin()
  if (!supabase) return null

  const { data, error } = await supabase.storage.from(ORDER_LABEL_BUCKET).list(orderId, { limit: 10 })
  if (error || !data) return null

  const label = data.find((entry) => entry.name.toLowerCase().startsWith('label'))
  return label?.name ?? null
}
