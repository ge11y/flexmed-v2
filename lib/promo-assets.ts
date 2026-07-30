import { getSupabaseAdmin } from '@/lib/supabase-admin'

export const PROMO_IMAGE_BUCKET = 'promo-images'

export function getPromoImageStoragePath(id: string) {
  return `${id}/popup`
}

export function getPromoImageProxyUrl(id: string, updatedAt?: string) {
  const base = `/api/promos/image/${id}`
  return updatedAt ? `${base}?v=${encodeURIComponent(updatedAt)}` : base
}

export async function ensurePromoImageBucket() {
  const supabase = getSupabaseAdmin()
  if (!supabase) return

  const { data: buckets } = await supabase.storage.listBuckets()
  const existingBucket = buckets?.find((entry) => entry.name === PROMO_IMAGE_BUCKET)
  if (existingBucket) {
    await supabase.storage.updateBucket(PROMO_IMAGE_BUCKET, {
      public: false,
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
    })
    return
  }

  await supabase.storage.createBucket(PROMO_IMAGE_BUCKET, {
    public: false,
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
  })
}
