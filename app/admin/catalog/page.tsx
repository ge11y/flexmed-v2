import type { Metadata } from 'next'
import Link from 'next/link'
import { getAdminCatalogProducts, getPendingConfirmationProducts, CONFIRMED_SLUGS } from '@/lib/data-products'
import { ProductCard } from '@/components/ProductCard'

export const metadata: Metadata = {
  title: 'Catalog — Admin View',
  description: 'Full product catalog including products pending founder confirmation.',
}

export default function AdminCatalogPage() {
  const allProducts = getAdminCatalogProducts()
  const confirmed = allProducts.filter((p) => p.publishStatus === 'confirmed')
  const pending = getPendingConfirmationProducts()

  return (
    <div>
      {/* Page header */}
      <section
        style={{
          padding: '64px 0 48px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="container">
          <div className="section-label" style={{ marginBottom: '12px' }}>
            Admin View
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2rem, 5vw, 3rem)',
              fontWeight: 400,
              marginBottom: '16px',
            }}
          >
            Product catalog — full view
          </h1>
          <p
            style={{
              fontSize: '15px',
              color: 'var(--text-secondary)',
              maxWidth: '520px',
              lineHeight: 1.7,
            }}
          >
            Internal admin view. Includes confirmed products and products pending founder confirmation. On-hold products are excluded. Products marked &#8220;Pending Confirmation&#8221; are not visible in the public catalog.
          </p>
        </div>
      </section>

      {/* Confirmed products */}
      <section style={{ padding: '48px 0 0' }}>
        <div className="container">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
            }}
          >
            <div className="section-label">Confirmed ({confirmed.length})</div>
            <span className="badge badge-green">
              {confirmed.filter((p) => p.coaStatus === 'available').length} CoA Available
            </span>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '16px',
            }}
          >
            {confirmed.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Pending confirmation products */}
      {pending.length > 0 && (
        <section style={{ padding: '48px 0' }}>
          <div className="container">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
              }}
            >
              <div className="section-label">
                Pending Confirmation ({pending.length})
              </div>
              <span className="badge badge-muted">
                Not visible in public catalog
              </span>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '16px',
              }}
            >
              {pending.map((product) => (
                <ProductCard key={product.slug} product={product} />
              ))}
            </div>

            {/* Action panel */}
            <div
              style={{
                marginTop: '40px',
                padding: '24px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '16px', color: 'var(--text-primary)' }}>
                Pending Confirmation — Action Required
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                The {pending.length} products above require founder confirmation before they can be published to the public catalog. Each product is missing batch documentation (batch number, testing lab, CoA URL, purity) and needs the founder to approve the label copy.
              </p>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                }}
              >
                {pending.map((p) => (
                  <div
                    key={p.slug}
                    style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}
                  >
                    <span>
                      <span style={{ color: 'var(--text-secondary)' }}>{p.slug}</span> — {p.displayName}
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>Missing: batch, lab, CoA, purity</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Back link */}
      <section style={{ padding: '0 0 64px' }}>
        <div className="container">
          <Link
            href="/products"
            style={{
              fontSize: '12px',
              color: 'var(--text-muted)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              textDecoration: 'none',
            }}
          >
            &#8592; View public catalog
          </Link>
        </div>
      </section>
    </div>
  )
}
