import { getSupabaseAdmin } from '@/lib/supabase-admin'

export const VIAL_CASE_IMAGE_BUCKET = 'vial-case-images'

export function getVialCaseImageStoragePath(id: string, imageId = 'front') {
  return `${id}/${imageId}`
}

export function getVialCaseImageProxyUrl(id: string, imageId?: string) {
  const base = `/api/vial-cases/image/${id}`
  return imageId && imageId !== 'front' ? `${base}?image=${encodeURIComponent(imageId)}` : base
}

export async function ensureVialCaseImageBucket() {
  const supabase = getSupabaseAdmin()
  if (!supabase) return

  const { data: buckets } = await supabase.storage.listBuckets()
  const existingBucket = buckets?.find((entry) => entry.name === VIAL_CASE_IMAGE_BUCKET)
  if (existingBucket) {
    await supabase.storage.updateBucket(VIAL_CASE_IMAGE_BUCKET, {
      public: false,
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
    })
    return
  }

  await supabase.storage.createBucket(VIAL_CASE_IMAGE_BUCKET, {
    public: false,
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
  })
}
