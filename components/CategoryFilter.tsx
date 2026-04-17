'use client'

import { useState } from 'react'
import type { Product } from '@/lib/types'
import { ProductCard } from './ProductCard'

interface CategoryFilterProps {
  products: Product[]
  categories: string[]
}

export function CategoryFilter({ products, categories }: CategoryFilterProps) {
  const [active, setActive] = useState('All')

  const filtered = active === 'All' ? products : products.filter((p) => p.category === active)

  return (
    <div>
      {/* Filter bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          marginBottom: '40px',
          paddingBottom: '24px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActive(cat)}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: '1px solid',
              borderColor: active === cat ? 'var(--amber)' : 'var(--border)',
              background: active === cat ? 'rgba(196, 168, 130, 0.1)' : 'transparent',
              color: active === cat ? 'var(--amber)' : 'var(--text-secondary)',
              fontFamily: 'var(--font-body)',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '20px',
        }}
      >
        {filtered.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '64px 0',
            color: 'var(--text-muted)',
          }}
        >
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', marginBottom: '8px' }}>
            No products in this category
          </div>
          <div style={{ fontSize: '13px' }}>Check back as the catalog expands.</div>
        </div>
      )}
    </div>
  )
}
