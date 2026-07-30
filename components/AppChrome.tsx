'use client'

import { usePathname } from 'next/navigation'
import { AffiliateReferralCapture } from '@/components/AffiliateReferralCapture'
import { CartProvider } from '@/components/CartProvider'
import { Footer } from '@/components/Footer'
import { NavBar } from '@/components/NavBar'
import { PromoExperience } from '@/components/PromoExperience'
import { ResearchUseGateway } from '@/components/ResearchUseGateway'

export function AppChrome({
  children,
  hasGatewayAcceptance,
}: {
  children: React.ReactNode
  hasGatewayAcceptance: boolean
}) {
  const pathname = usePathname()
  const isAdminRoute = pathname?.startsWith('/admin')

  if (isAdminRoute) {
    return (
      <CartProvider>
        <main style={{ flex: 1 }}>{children}</main>
      </CartProvider>
    )
  }

  return (
    <CartProvider>
      <AffiliateReferralCapture />
      {!hasGatewayAcceptance ? <ResearchUseGateway /> : null}
      <PromoExperience enabled={hasGatewayAcceptance} />
      <NavBar />
      <main style={{ flex: 1, paddingTop: 'var(--promo-banner-offset, 0px)' }}>{children}</main>
      <Footer />
    </CartProvider>
  )
}
