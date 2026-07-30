'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { Product } from '@/lib/types'
import { ProductCard } from './ProductCard'

interface CategoryFilterProps {
  products: Product[]
  categories: string[]
}

export function CategoryFilter({ products, categories }: CategoryFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  // Initialize active filter from URL param without setState in effect
  const initialCategory = searchParams.get('category')
  const [active, setActive] = useState<string>(initialCategory && categories.includes(initialCategory) ? initialCategory : 'All')
  const [hovered, setHovered] = useState<string | null>(null)

  const handleFilter = (cat: string) => {
    setActive(cat)
    const params = new URLSearchParams(searchParams.toString())
    if (cat === 'All') {
      params.delete('category')
    } else {
      params.set('category', cat)
    }
    const query = params.toString()
    startTransition(() => {
      router.push(query ? `/products?${query}` : '/products', { scroll: false })
    })
  }

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
            onClick={() => handleFilter(cat)}
            onMouseEnter={() => setHovered(cat)}
            onMouseLeave={() => setHovered(null)}
            style={{
              padding: '7px 16px',
              borderRadius: '9999px',
              border: '1.5px solid',
              borderColor: active === cat ? 'var(--amber)' : hovered === cat ? 'var(--border-strong)' : 'var(--border)',
              background: active === cat ? 'var(--amber-muted)' : hovered === cat ? 'rgba(42, 79, 174, 0.04)' : 'transparent',
              color: active === cat ? 'var(--amber)' : hovered === cat ? 'var(--amber)' : 'var(--text-secondary)',
              fontFamily: 'var(--font-body)',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              letterSpacing: '0.01em',
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
