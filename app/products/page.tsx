import type { Metadata } from 'next'
import { PRODUCTS, PRODUCT_CATEGORIES } from '@/lib/data-products'
import { CategoryFilter } from '@/components/CategoryFilter'

export const metadata: Metadata = {
  title: 'Catalog',
  description: 'Browse the FlexMed research compound catalog. Filtered by research category.',
}

export default function ProductsPage() {
  const products = Object.values(PRODUCTS).filter((p) => p.publishStatus !== 'on_hold')

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
          <div className="section-label" style={{ marginBottom: '12px' }}>Research Catalog</div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2rem, 5vw, 3rem)',
              fontWeight: 400,
              marginBottom: '16px',
            }}
          >
            Compound catalog
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)', maxWidth: '480px', lineHeight: 1.7 }}>
            Browse research-grade compounds by category. All compounds include batch-specific documentation. Use the filters below to navigate by research area.
          </p>
        </div>
      </section>

      {/* Catalog grid */}
      <section style={{ padding: '48px 0 var(--space-3xl)' }}>
        <div className="container">
          <CategoryFilter products={products} categories={PRODUCT_CATEGORIES} />
        </div>
      </section>
    </div>
  )
}
