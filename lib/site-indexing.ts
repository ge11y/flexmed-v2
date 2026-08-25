export const CANONICAL_SHOP_HOST = 'flexmedpeptides.com'
export const CANONICAL_SHOP_ORIGIN = `https://${CANONICAL_SHOP_HOST}`

export const INDEXABLE_SHOP_HOSTS = [
  CANONICAL_SHOP_HOST,
  `www.${CANONICAL_SHOP_HOST}`,
] as const

export function normalizeHost(hostHeader: string | null | undefined): string {
  const first = (hostHeader ?? '').split(',')[0]?.trim().toLowerCase() ?? ''
  if (!first) return ''
  return first.replace(/:\d+$/, '')
}

export function hostFromRequestHeaders(headerList: {
  get(name: string): string | null
}): string {
  return headerList.get('x-forwarded-host') ?? headerList.get('host') ?? ''
}

export function isIndexableShopHost(hostHeader: string | null | undefined): boolean {
  return (INDEXABLE_SHOP_HOSTS as readonly string[]).includes(normalizeHost(hostHeader))
}

export function shopRobotsDirective(hostHeader: string | null | undefined): {
  index: boolean
  follow: boolean
} {
  const indexable = isIndexableShopHost(hostHeader)
  return { index: indexable, follow: indexable }
}
