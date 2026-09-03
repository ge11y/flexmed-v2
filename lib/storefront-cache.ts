import { revalidateTag, unstable_cache } from 'next/cache'

// ============================================================
// Storefront read cache
//
// Every public page used to rebuild the catalog from Supabase on each
// request: one products query, one supply query and two storage listings
// per product (about 230 round trips), which is where the 2.5–3.5 s of
// server time went. Storefront reads now go through the Data Cache with a
// short TTL, and admin writes expire the tags so the next visitor sees the
// change. Checkout quotes and order submission keep reading fresh so stock
// and prices are validated live.
// ============================================================

/** 'storefront' may serve a cached read; 'fresh' always hits Supabase. */
export type CatalogFreshness = 'storefront' | 'fresh'

export const STOREFRONT_CACHE_TAGS = {
  catalog: 'storefront-catalog',
  promos: 'storefront-promos',
  vialCases: 'storefront-vial-cases',
} as const

export const STOREFRONT_CACHE_SECONDS = 60

/**
 * Wraps a loader in the cross-request Data Cache. The loader must throw on
 * failure rather than return a degraded value, so a bad read is never stored.
 */
export function cacheStorefrontRead<T>(key: string, tag: string, load: () => Promise<T>) {
  return unstable_cache(load, ['storefront', key], { tags: [tag], revalidate: STOREFRONT_CACHE_SECONDS })
}

/** Expire cached storefront reads right away so the next request rebuilds them. */
export function expireStorefrontCache(...tags: string[]) {
  const targets = tags.length > 0 ? tags : Object.values(STOREFRONT_CACHE_TAGS)
  for (const tag of targets) revalidateTag(tag, { expire: 0 })
}
