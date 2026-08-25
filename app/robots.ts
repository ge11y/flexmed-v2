import type { MetadataRoute } from 'next'
import { headers } from 'next/headers'
import {
  CANONICAL_SHOP_ORIGIN,
  hostFromRequestHeaders,
  isIndexableShopHost,
} from '@/lib/site-indexing'

export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = hostFromRequestHeaders(await headers())

  if (!isIndexableShopHost(host)) {
    return {
      rules: {
        userAgent: '*',
        disallow: '/',
      },
    }
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api/'],
    },
    host: CANONICAL_SHOP_ORIGIN,
  }
}
