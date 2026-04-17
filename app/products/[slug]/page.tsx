import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { PRODUCTS } from '@/lib/data-products'
import { getTestingRecordsForProduct } from '@/lib/data-testing'
import { ProductImage } from '@/components/ProductImage'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return Object.keys(PRODUCTS).map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const product = PRODUCTS[slug]
  if (!product) return { title: 'Product Not Found' }
  return {
    title: product.displayName,
    description: product.summaryShort,
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params
  const product = PRODUCTS[slug]
  if (!product) notFound()

  const testingRecords = getTestingRecordsForProduct(slug)

  const statusLabel: Record<string, string> = {
    in_stock: 'In Stock',
    low_stock: 'Low Stock',
    out_of_stock: 'Out of Stock',
    coming_soon: 'Coming Soon',
  }

  const coaStatusLabel: Record<string, string> = {
    available: 'CoA Available',
    pending: 'CoA Pending',
    not_available: 'CoA Not Available',
  }

  return (
    <div>
      {/* Hero block */}
      <section
        style={{
          padding: '64px 0 48px',
          borderBottom: '1px solid var(--border)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Accent gradient */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: product.accentColorHex,
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(circle at 30% 50%, ${product.accentColorHex}08 0%, transparent 60%)`,
            pointerEvents: 'none',
          }}
        />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          {/* Breadcrumb */}
          <nav style={{ marginBottom: '24px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Link href="/products" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Catalog
            </Link>
            <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>/</span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{product.displayName}</span>
          </nav>

          {/* Pending Confirmation warning — top of hero */}
          {product.publishStatus === 'needs_confirmation' && (
            <div
              style={{
                marginBottom: '24px',
                padding: '12px 16px',
                background: 'rgba(196, 168, 130, 0.08)',
                border: '1px solid rgba(196, 168, 130, 0.3)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <div
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: 'var(--amber)',
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  letterSpacing: '0.06em',
                  color: 'var(--amber)',
                  textTransform: 'uppercase',
                }}
              >
                Pending Founder Confirmation — Not Published to Public Catalog
              </span>
            </div>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '48px',
              alignItems: 'start',
            }}
          >
            {/* Product image — hover-spin capable */}
            <ProductImage
              slug={product.slug}
              displayName={product.displayName}
              accentColorHex={product.accentColorHex}
              image={product.image}
              hoverSpinFrames={product.hoverSpinFrames}
              height={320}
            />

            {/* Product info */}
            <div>
              <div style={{ marginBottom: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span className={`badge ${
                  product.status === 'in_stock' ? 'badge-green' :
                  product.status === 'low_stock' ? 'badge-amber' :
                  product.status === 'out_of_stock' ? 'badge-muted' : 'badge-blue'
                }`}>
                  {statusLabel[product.status]}
                </span>
                <span className={`badge ${
                  product.coaStatus === 'available' ? 'badge-green' :
                  product.coaStatus === 'pending' ? 'badge-amber' : 'badge-muted'
                }`}>
                  {coaStatusLabel[product.coaStatus]}
                </span>
                {product.publishStatus === 'needs_confirmation' && (
                  <span className="badge badge-muted">Pending Confirmation</span>
                )}
              </div>

              <h1
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(2rem, 4vw, 3rem)',
                  fontWeight: 400,
                  marginBottom: '8px',
                }}
              >
                {product.displayName}
              </h1>

              <div className="label" style={{ marginBottom: '24px' }}>{product.fullName}</div>

              <p
                style={{
                  fontSize: '15px',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.7,
                  maxWidth: '480px',
                  marginBottom: '32px',
                }}
              >
                {product.summaryShort}
              </p>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {product.publishStatus === 'needs_confirmation' ? (
                  <Link href="/admin/catalog" className="btn btn-outline">
                    View in Admin Catalog
                  </Link>
                ) : (
                  <>
                    <Link href="/contact" className="btn btn-primary">
                      Request Quote
                    </Link>
                    {product.coaStatus === 'available' && (
                      <a href={product.coaUrl || '#'} className="btn btn-outline" target="_blank" rel="noopener noreferrer">
                        View CoA
                      </a>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section style={{ padding: 'var(--space-3xl) 0' }}>
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '32px',
            }}
          >
            {/* Left column — content */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {/* Research Summary */}
              <div>
                <div className="section-label" style={{ marginBottom: '12px' }}>Research Summary</div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 400, marginBottom: '16px' }}>
                  {product.fullName}
                </h2>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                  {product.summaryFull}
                </p>
              </div>

              {/* Key Product Details */}
              <div>
                <div className="section-label" style={{ marginBottom: '12px' }}>Key Product Details</div>
                <div
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                  }}
                >
                  {[
                    { label: 'Full Compound Name', value: product.fullName },
                    { label: 'Alias', value: product.alias },
                    { label: 'Strength', value: `${product.strength} ${product.unit}` },
                    { label: 'Format Type', value: product.formatType.charAt(0).toUpperCase() + product.formatType.slice(1) },
                    { label: 'Research Category', value: product.researchCategory },
                    { label: 'Structure Type', value: product.structureType },
                    { label: 'Batch / Lot', value: product.batchNumber || '[BATCH REQUIRED]' },
                    { label: 'CoA Status', value: coaStatusLabel[product.coaStatus] },
                    { label: 'Testing Lab', value: product.testingLab || '[LAB REQUIRED]' },
                  ].map((row, i) => (
                    <div
                      key={row.label}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '160px 1fr',
                        gap: '16px',
                        padding: '12px 16px',
                        borderBottom: i < 8 ? '1px solid var(--border)' : 'none',
                        alignItems: 'start',
                      }}
                    >
                      <div className="label" style={{ fontSize: '10px' }}>{row.label}</div>
                      <div
                        style={{
                          fontFamily: 'var(--font-body)',
                          fontSize: '13px',
                          color: row.value.startsWith('[') ? 'var(--text-muted)' : 'var(--text-primary)',
                        }}
                      >
                        {row.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Features */}
              <div>
                <div className="section-label" style={{ marginBottom: '12px' }}>Catalog Features</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {product.features.map((f) => (
                    <div
                      key={f}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontSize: '13px',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      <div
                        style={{
                          width: '4px',
                          height: '4px',
                          borderRadius: '50%',
                          background: product.accentColorHex,
                          flexShrink: 0,
                        }}
                      />
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right column — documentation + packaging */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {/* Documentation */}
              <div>
                <div className="section-label" style={{ marginBottom: '12px' }}>Documentation</div>
                <div
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                  }}
                >
                  {testingRecords.length > 0 ? (
                    testingRecords.map((record) => (
                      <div key={record.batchNumber} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className="label">Batch {record.batchNumber}</span>
                          <span className="badge badge-amber">Pending</span>
                        </div>
                        <div style={{ display: 'grid', gap: '8px' }}>
                          {[
                            { label: 'Testing Lab', value: record.testingLab },
                            { label: 'Test Date', value: record.testDate },
                            { label: 'Purity', value: record.purityPercent },
                            { label: 'Methodology', value: record.methodology.join(', ') },
                          ].map((r) => (
                            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                              <span style={{ color: 'var(--text-muted)' }}>{r.label}</span>
                              <span
                                style={{
                                  color: r.value.includes('[REQUIRED]') || r.value.includes('[PENDING]')
                                    ? 'var(--text-muted)'
                                    : 'var(--text-secondary)',
                                }}
                              >
                                {r.value}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div style={{ marginTop: '4px' }}>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                            [COA DOCUMENT REQUIRED]
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
                      No testing records available yet.
                    </div>
                  )}
                </div>
              </div>

              {/* Packaging */}
              <div>
                <div className="section-label" style={{ marginBottom: '12px' }}>Packaging &amp; Labeling</div>
                <div
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '200px',
                      background: 'var(--bg-elevated)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: product.accentColorHex, marginBottom: '6px' }}>
                        {product.displayName}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        [PRODUCT IMAGE REQUIRED]
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[
                      { label: 'Label View', value: '[LABEL IMAGE REQUIRED]' },
                      { label: 'Lot Number', value: product.batchNumber || '[LOT REQUIRED]' },
                      { label: 'Packaging', value: 'Standard container system' },
                    ].map((r) => (
                      <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>{r.label}</span>
                        <span style={{ color: r.value.startsWith('[') ? 'var(--text-muted)' : 'var(--text-secondary)' }}>
                          {r.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Research-use notice */}
          <div
            style={{
              marginTop: '48px',
              padding: '20px 24px',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              background: 'rgba(196, 168, 130, 0.04)',
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                letterSpacing: '0.06em',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                lineHeight: 1.8,
              }}
            >
              For laboratory research use only. Not for human consumption. No dosage, administration, or reconstitution instructions are provided on this page.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
