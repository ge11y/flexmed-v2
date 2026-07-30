import Link from 'next/link'
import type { Metadata } from 'next'
import { ClipboardCheck, FlaskConical, PackageCheck, ShieldCheck } from 'lucide-react'
import { getLiveCatalogProducts } from '@/lib/catalog-live'

export const metadata: Metadata = {
  title: 'About',
  description: 'About FlexMed — research-first cataloging, third-party testing, and live documentation.',
}

export const dynamic = 'force-dynamic'

function formatCollection(value: string) {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export default async function AboutPage() {
  const products = await getLiveCatalogProducts()
  const visibleProducts = products.filter((product) => product.publicVisible !== false)
  const collections = Array.from(
    new Set(visibleProducts.map((product) => product.category || product.researchCategory).filter(Boolean)),
  ).slice(0, 6)

  const process = [
    {
      title: 'Cataloged for research',
      body: 'Listings focus on product identity, format, strength, availability, and documentation status without consumer-use claims.',
      icon: FlaskConical,
    },
    {
      title: 'Third-party testing workflow',
      body: 'Batch documentation is maintained separately from marketing copy so researchers can review source records clearly.',
      icon: ShieldCheck,
    },
    {
      title: 'Live inventory source',
      body: 'Availability and product data are maintained from live catalog records, so public listings stay current.',
      icon: PackageCheck,
    },
    {
      title: 'CoA-aware presentation',
      body: 'Published CoAs are linked where available, while products marked as not requiring CoA documentation avoid pending labels.',
      icon: ClipboardCheck,
    },
  ]

  return (
    <main className="storefront-blue-shell" style={{ minHeight: '100vh' }}>
      <section
        className="products-page-header-visual"
        style={{
          padding: 'calc(56px + var(--promo-banner-offset, 0px)) 0 30px',
          borderBottom: '1px solid var(--border)',
          position: 'relative',
        }}
      >
        <div className="container">
          <div>
            <div className="section-label" style={{ marginBottom: '12px' }}>About FlexMed</div>
            <h1 style={{ fontSize: 'clamp(1.9rem, 3.4vw, 3rem)', lineHeight: 1.06, fontWeight: 900, margin: 0, maxWidth: '680px', color: '#FFFFFF', textWrap: 'balance' }}>
              Research catalog structure with live documentation discipline.
            </h1>
            <p style={{ fontSize: '15px', color: 'rgba(246,250,255,0.9)', maxWidth: '620px', lineHeight: 1.7, margin: '16px 0 0' }}>
              FlexMed is built as a research-use storefront. The public site is designed to keep product families, strengths, availability, and CoA status easy to review while keeping the language centered on laboratory research.
            </p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '24px' }}>
              <Link className="fm-btn-primary" href="/products?group=peptides">Browse catalog</Link>
              <Link className="fm-btn-outline" href="/coa">View CoA library</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="catalog-shopping-section-visual" style={{ padding: '34px 0 72px', position: 'relative' }}>
        <div className="container" style={{ display: 'grid', gap: '34px' }}>
          {collections.length > 0 ? (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <strong style={{ color: '#FFFFFF' }}>Live groups:</strong>
              {collections.map((collection) => (
                <span key={collection} className="badge badge-blue">{formatCollection(collection)}</span>
              ))}
            </div>
          ) : null}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '14px' }}>
            {process.map((item) => {
              const Icon = item.icon
              return (
                <article key={item.title} className="card" style={{ padding: '22px', display: 'grid', gap: '12px' }}>
                  <Icon size={24} color="#63c9d4" aria-hidden="true" />
                  <h2 style={{ margin: 0, color: '#FFFFFF', fontSize: '18px', fontWeight: 850 }}>{item.title}</h2>
                  <p style={{ margin: 0, color: 'rgba(246,250,255,0.88)', lineHeight: 1.7, fontSize: '14px' }}>{item.body}</p>
                </article>
              )
            })}
          </div>

          <div className="card" style={{ padding: '26px', display: 'grid', gridTemplateColumns: 'minmax(0, 0.9fr) minmax(280px, 1.1fr)', gap: '28px', alignItems: 'start' }}>
            <div>
              <div className="section-label" style={{ marginBottom: '12px' }}>Operating Standard</div>
              <h2 style={{ margin: 0, color: '#FFFFFF', fontSize: '24px', fontWeight: 900 }}>Clear research-use boundaries.</h2>
            </div>
            <div style={{ display: 'grid', gap: '14px', color: 'rgba(246,250,255,0.9)', lineHeight: 1.75, fontSize: '14px' }}>
              <p style={{ margin: 0 }}>
                Product pages are written as catalog entries rather than marketing pages. They do not include therapeutic claims, dosage guidance, or human-use instructions.
              </p>
              <p style={{ margin: 0 }}>
                The catalog is intended to help researchers identify product families, compare available strengths, review availability, and access documentation where applicable.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
