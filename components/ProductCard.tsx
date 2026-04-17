'use client'

import Link from 'next/link'
import type { Product } from '@/lib/types'
import { ProductImage } from './ProductImage'
import { getProductImageSrc, getProductHoverSpinFrames } from '@/lib/data-products'

interface ProductCardProps {
  product: Product
}

function StatusBadge({ status }: { status: Product['status'] }) {
  const map: Record<Product['status'], { label: string; className: string }> = {
    in_stock: { label: 'In Stock', className: 'badge-green' },
    low_stock: { label: 'Low Stock', className: 'badge-amber' },
    out_of_stock: { label: 'Out of Stock', className: 'badge-muted' },
    coming_soon: { label: 'Coming Soon', className: 'badge-blue' },
  }
  const { label, className } = map[status]
  return <span className={`badge ${className}`}>{label}</span>
}

function CoaBadge({ coaStatus }: { coaStatus: Product['coaStatus'] }) {
  if (coaStatus === 'available') {
    return <span className="badge badge-green">CoA Available</span>
  }
  if (coaStatus === 'pending') {
    return <span className="badge badge-amber">CoA Pending</span>
  }
  return <span className="badge badge-muted">CoA N/A</span>
}

function PublishBadge({ status }: { status: Product['publishStatus'] }) {
  if (status === 'needs_confirmation') {
    return <span className="badge badge-muted">Pending Confirmation</span>
  }
  return null
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Link href={`/products/${product.slug}`} style={{ display: 'block', textDecoration: 'none' }}>
      <article
        className="card"
        style={{
          padding: '24px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Accent bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: product.accentColorHex,
            opacity: 0.7,
          }}
        />

        {/* Image area — uses ProductImage with hover-spin support */}
        <ProductImage
          slug={product.slug}
          displayName={product.displayName}
          accentColorHex={product.accentColorHex}
          image={getProductImageSrc(product)}
          hoverSpinFrames={getProductHoverSpinFrames(product)}
          height={140}
        />

        {/* Badges */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <StatusBadge status={product.status} />
          <CoaBadge coaStatus={product.coaStatus} />
          <PublishBadge status={product.publishStatus} />
        </div>

        {/* Product info */}
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '18px',
              color: 'var(--text-primary)',
              marginBottom: '4px',
            }}
          >
            {product.displayName}
          </div>
          <div className="label" style={{ marginBottom: '8px' }}>
            {product.fullName}
          </div>
          <p
            style={{
              fontSize: '13px',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            {product.summaryShort}
          </p>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '12px',
            borderTop: '1px solid var(--border)',
          }}
        >
          <span className="label">{product.category}</span>
          <span
            style={{
              fontSize: '12px',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            View
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M2.5 6H9.5M6.5 3L9.5 6L6.5 9"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>
      </article>
    </Link>
  )
}
