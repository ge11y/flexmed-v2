import type { Metadata } from 'next'
import Link from 'next/link'
import { getLiveCatalogProducts } from '@/lib/catalog-live'
import { getProductCoALink } from '@/lib/data-testing'

export const metadata: Metadata = {
  title: 'COA Library',
  description: 'Browse all published FlexMed certificates of analysis in one place.',
}

function formatCollection(value: string) {
  return value
    .replaceAll('_', ' ')
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function getCoaHref(product: { slug: string; coaUrl?: string | null }) {
  const href = getProductCoALink(product)
  if (href) return href
  return product.coaUrl && !product.coaUrl.startsWith('[') ? product.coaUrl : ''
}

export default async function CoALibraryPage() {
  const products = await getLiveCatalogProducts()
  const coaRecords = products
    .map((product) => ({
      product,
      href: product.coaNotRequired ? '' : getCoaHref(product),
    }))
    .filter(({ href }) => Boolean(href))
    .sort((a, b) => {
      const familyCompare = a.product.displayName.localeCompare(b.product.displayName)
      if (familyCompare !== 0) return familyCompare
      return a.product.strength - b.product.strength
    })

  const collections = new Set(coaRecords.map(({ product }) => product.category || product.researchCategory).filter(Boolean))

  return (
    <main className="storefront-blue-shell" style={{ minHeight: '100vh', padding: '112px 40px 80px' }}>
      <div className="container" style={{ display: 'grid', gap: '28px' }}>
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) auto',
            gap: '22px',
            alignItems: 'end',
            borderBottom: '1px solid var(--border)',
            paddingBottom: '28px',
          }}
        >
          <div style={{ display: 'grid', gap: '12px', maxWidth: '760px' }}>
            <div className="section-label">COA Library</div>
            <h1 style={{ margin: 0, fontSize: 'clamp(32px, 5vw, 56px)', lineHeight: 1.05, letterSpacing: '-0.02em', color: '#FFFFFF' }}>
              Published certificates of analysis.
            </h1>
            <p style={{ margin: 0, color: 'rgba(246,250,255,0.9)', lineHeight: 1.7, maxWidth: '680px' }}>
              Browse the live FlexMed CoA library. Each link opens the current certificate attached to that product or strength.
            </p>
          </div>
          <div
            style={{
              borderRadius: '16px',
              border: '1px solid var(--border)',
              background: 'var(--bg-card)',
              padding: '16px 18px',
              minWidth: '190px',
              display: 'grid',
              gap: '8px',
            }}
          >
            <div className="section-label">Available CoAs</div>
            <div style={{ fontSize: '32px', fontWeight: 700 }}>{coaRecords.length}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{collections.size} catalog group{collections.size === 1 ? '' : 's'}</div>
          </div>
        </section>

        {coaRecords.length > 0 ? (
          <section
            style={{
              border: '1px solid var(--border)',
              background: 'var(--bg-card)',
              borderRadius: '18px',
              overflow: 'hidden',
            }}
          >
            <div
              className="coa-library-header"
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(220px, 1.5fr) minmax(120px, 0.8fr) minmax(120px, 0.8fr) minmax(120px, 0.8fr) auto',
                gap: '16px',
                padding: '13px 18px',
                borderBottom: '1px solid var(--border)',
                background: 'var(--bg-elevated)',
              }}
            >
              {['Product', 'Strength', 'Category', 'Batch', 'CoA'].map((label) => (
                <div key={label} className="section-label">{label}</div>
              ))}
            </div>

            <div style={{ display: 'grid' }}>
              {coaRecords.map(({ product, href }) => (
                <div
                  key={`${product.slug}-${href}`}
                  className="coa-library-row"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(220px, 1.5fr) minmax(120px, 0.8fr) minmax(120px, 0.8fr) minmax(120px, 0.8fr) auto',
                    gap: '16px',
                    alignItems: 'center',
                    padding: '16px 18px',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <div style={{ display: 'grid', gap: '4px' }}>
                    <Link
                      href={`/products/${product.slug}`}
                      style={{ color: 'var(--text-primary)', textDecoration: 'none', fontSize: '15px', fontWeight: 700 }}
                    >
                      {product.displayName}
                    </Link>
                    <div style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: 1.5 }}>{product.fullName}</div>
                  </div>
                  <div style={{ color: 'rgba(246,250,255,0.88)', fontSize: '14px' }}>
                    {product.variantLabel || `${product.strength}${product.unit}`}
                  </div>
                  <div style={{ color: 'rgba(246,250,255,0.88)', fontSize: '14px' }}>
                    {formatCollection(product.category || product.researchCategory)}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                    {product.batchNumber && !product.batchNumber.startsWith('[') ? product.batchNumber : 'Published'}
                  </div>
                  <Link
                    href={href}
                    target={href.startsWith('http') || href.endsWith('.pdf') || href.includes('/api/') ? '_blank' : undefined}
                    rel={href.startsWith('http') || href.endsWith('.pdf') || href.includes('/api/') ? 'noopener noreferrer' : undefined}
                    className="fm-btn-outline"
                    style={{ padding: '9px 12px', fontSize: '12px', textDecoration: 'none', justifyContent: 'center' }}
                  >
                    View CoA
                  </Link>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <section
            className="card"
            style={{
              padding: '28px',
              display: 'grid',
              gap: '12px',
              color: 'rgba(246,250,255,0.9)',
              lineHeight: 1.7,
            }}
          >
            <strong style={{ color: 'var(--text-primary)' }}>No published CoAs are available yet.</strong>
            CoA documents will appear here when they are available for matching catalog products.
          </section>
        )}
      </div>

      <style>{`
        @media (max-width: 860px) {
          .coa-library-header {
            display: none !important;
          }
          .coa-library-row {
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }
        }
      `}</style>
    </main>
  )
}
