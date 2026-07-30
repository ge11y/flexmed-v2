import type { Metadata } from 'next'
import Image from 'next/image'
import { VialCaseCatalog } from '@/components/VialCaseCatalog'
import { getActiveSitePromos } from '@/lib/site-promos'
import { getPublicVialCases } from '@/lib/vial-cases'

export const metadata: Metadata = {
  title: 'Vial Cases',
  description: 'FlexMed vial-case and storage presentation standards.',
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function VialCasesPage() {
  const [vialCases, promos] = await Promise.all([getPublicVialCases(), getActiveSitePromos()])

  return (
    <div className="storefront-blue-shell" style={{ minHeight: '100vh' }}>
      <section className="products-page-header-visual" style={{ padding: '96px 40px 52px' }}>
        <div
          style={{
            maxWidth: 1180,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
            gap: '28px',
            alignItems: 'center',
          }}
        >
          <div>
            <div className="section-label" style={{ marginBottom: '12px', color: 'rgba(230,240,255,0.72)' }}>
              Vial Cases
            </div>
            <h1
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(2rem, 5vw, 2.8rem)',
                lineHeight: 1.08,
                marginBottom: '16px',
                color: '#ffffff',
                fontWeight: 850,
                textWrap: 'balance',
              }}
            >
              Vial storage, transport, and presentation.
            </h1>
            <p style={{ maxWidth: 640, fontSize: '15px', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
              Browse available vial case options with the same cart, promo, and checkout flow as the research catalog.
            </p>
          </div>
          <div
            style={{
              position: 'relative',
              minHeight: '320px',
              borderRadius: '16px',
              overflow: 'hidden',
              border: '1px solid rgba(140,175,225,0.24)',
              background: 'linear-gradient(165deg, rgba(38,82,145,0.92), rgba(26,62,116,0.90))',
            }}
          >
            <Image
              src="/claude-storefront/banners/vialcases.png"
              alt="Vial case product display"
              fill
              priority
              sizes="(max-width: 900px) 100vw, 540px"
              style={{ objectFit: 'cover' }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(180deg, rgba(5,14,32,0.02), rgba(5,14,32,0.34))',
              }}
            />
          </div>
        </div>
      </section>

      <section className="catalog-shopping-section-visual" style={{ padding: '48px 40px 90px' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', display: 'grid', gap: '24px' }}>
          <div>
            <div className="section-label" style={{ marginBottom: '12px', color: 'rgba(230,240,255,0.72)' }}>
              Available Case Products
            </div>
            <VialCaseCatalog vialCases={vialCases} promos={promos} />
          </div>
        </div>
      </section>
    </div>
  )
}
