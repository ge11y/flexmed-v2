'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { normalizeAffiliateCode, saveAffiliateReferralCapture } from '@/lib/affiliates'

export function AffiliateReferralCapture() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    const rawCode =
      searchParams.get('ref') ||
      searchParams.get('affiliate') ||
      searchParams.get('affiliate_code') ||
      ''

    const code = normalizeAffiliateCode(rawCode)
    if (!code) return

    saveAffiliateReferralCapture({
      code,
      source: 'link',
      landingPath: pathname || '/products',
      capturedAt: new Date().toISOString(),
    })
  }, [pathname, searchParams])

  return null
}
