import { cache } from 'react'
import { getCatalogCoAObjectNames, queryCatalogCoAObjectNames } from '@/lib/catalog-assets'
import { getActiveSitePromos, queryActiveSitePromos } from '@/lib/site-promos'
import { STOREFRONT_CACHE_TAGS, cacheStorefrontRead } from '@/lib/storefront-cache'
import { getPublicVialCases, queryPublicVialCases } from '@/lib/vial-cases'

// Cached reads for rendering. Checkout and order submission keep calling the
// fresh loaders in lib/site-promos.ts and lib/vial-cases.ts directly.

const getCachedActivePromos = cacheStorefrontRead('active-promos', STOREFRONT_CACHE_TAGS.promos, queryActiveSitePromos)
const getCachedPublicVialCases = cacheStorefrontRead('public-vial-cases', STOREFRONT_CACHE_TAGS.vialCases, queryPublicVialCases)
const getCachedCoAObjectNames = cacheStorefrontRead('coa-object-names', STOREFRONT_CACHE_TAGS.catalog, queryCatalogCoAObjectNames)

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

/** A product's uploaded CoA pages for rendering; the slug is part of the cache key. */
export const getStorefrontCoAObjectNames = cache(async (slug: string) => {
  try {
    return await getCachedCoAObjectNames(slug)
  } catch {
    return getCatalogCoAObjectNames(slug)
  }
})
