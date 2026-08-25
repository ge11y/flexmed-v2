import type { NextConfig } from 'next'
import { INDEXABLE_SHOP_HOSTS } from './lib/site-indexing'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  async headers() {
    return [
      ...INDEXABLE_SHOP_HOSTS.map((host) => ({
        source: '/:path*',
        has: [{ type: 'host' as const, value: host }],
        headers: [{ key: 'X-Robots-Tag', value: 'index, follow' }],
      })),
      {
        source: '/:path*',
        missing: INDEXABLE_SHOP_HOSTS.map((host) => ({
          type: 'host' as const,
          value: host,
        })),
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ]
  },
}

export default nextConfig
