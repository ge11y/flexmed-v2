import { cache } from 'react'
import { getActiveSitePromos, queryActiveSitePromos } from '@/lib/site-promos'
import { STOREFRONT_CACHE_TAGS, cacheStorefrontRead } from '@/lib/storefront-cache'
import { getPublicVialCases, queryPublicVialCases } from '@/lib/vial-cases'

// Cached reads for rendering. Checkout and order submission keep calling the
// fresh loaders in lib/site-promos.ts and lib/vial-cases.ts directly.

const getCachedActivePromos = cacheStorefrontRead('active-promos', STOREFRONT_CACHE_TAGS.promos, queryActiveSitePromos)
const getCachedPublicVialCases = cacheStorefrontRead('public-vial-cases', STOREFRONT_CACHE_TAGS.vialCases, queryPublicVialCases)

export const getStorefrontPromos = cache(async () => {
  try {
    return await getCachedActivePromos()
  } catch {
    return getActiveSitePromos()
  }
})

export const getStorefrontVialCases = cache(async () => {
  try {
    return await getCachedPublicVialCases()
  } catch {
    return getPublicVialCases()
  }
})
