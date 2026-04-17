import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { PRODUCTS, CONFIRMED_SLUGS, getProductImageSrc, getProductHoverSpinFrames, getProductBannerSrc, getProductSideSrc } from '@/lib/data-products'
import { getTestingRecordsForProduct } from '@/lib/data-testing'
import { ProductImage } from '@/components/ProductImage'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return CONFIRMED_SLUGS.map((slug) => ({ slug }))
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

// ─── Placeholder guard ─────────────────────────────────────────
// Returns null for unset fields (empty strings or [XXX REQUIRED] patterns)
// so the UI never renders raw placeholder markers publicly.
// ────────────────────────────────────────────────────────────────

const PLACEHOLDER_PATTERN = /^\[.+(REQUIRED|PENDING).*\]|^\[DATE.*\]|^\[LABEL.*\]|^\[PRODUCT.*\]|^\[IMAGE.*\]/i

function cleanValue(val: string | undefined | null): string | null {
  if (!val) return null
  if (PLACEHOLDER_PATTERN.test(val.trim())) return null
  return val
}

function cleanRows(rows: { label: string; value: string }[]): { label: string; value: string }[] {
  return rows.filter((r) => r.value !== null && r.value !== undefined)
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params
  const product = PRODUCTS[slug]
  if (!product) notFound()

  const testingRecords = getTestingRecordsForProduct(slug)
  const heroBanner = getProductBannerSrc(slug, 'heroBanner')
  const sectionDivider = getProductBannerSrc(slug, 'sectionDivider')

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

  // ─── Clean key details rows ──────────────────────────────────
  // Only render rows where data is actually populated
  const detailRows = [
    { label: 'Full Compound Name', value: cleanValue(product.fullName) },
    { label: 'Alias', value: cleanValue(product.alias) },
    { label: 'Strength', value: product.strength ? cleanValue(`${product.strength} ${product.unit}`) : null },
    { label: 'Format Type', value: cleanValue(product.formatType?.charAt(0).toUpperCase() + product.formatType?.slice(1)) },
    { label: 'Research Category', value: cleanValue(product.researchCategory) },
    { label: 'Structure Type', value: cleanValue(product.structureType) },
    { label: 'Batch / Lot', value: cleanValue(product.batchNumber) },
    { label: 'CoA Status', value: coaStatusLabel[product.coaStatus] || null },
    { label: 'Testing Lab', value: cleanValue(product.testingLab) },
  ].filter((r) => r.value !== null) as { label: string; value: string }[]

  // ─── Clean packaging rows ─────────────────────────────────────
  const packagingRows = [
    { label: 'Lot Number', value: cleanValue(product.batchNumber) },
    { label: 'Packaging', value: 'Standard container system' },
  ].filter((r) => r.value !== null) as { label: string; value: string }[]

  // ─── Product images ───────────────────────────────────────────
  const frontSrc = getProductImageSrc(product)
  const sideSrc = getProductSideSrc(product)

  return (
    <div>
      {/* ─── Hero Section with Atmospheric Banner ─────────────── */}
      <section
        style={{
          position: 'relative',
          overflow: 'hidden',
          minHeight: '520px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Atmospheric banner — full bleed hero background */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${heroBanner})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center 40%',
            opacity: 0.35,
            pointerEvents: 'none',
          }}
        />

        {/* Bottom fade into page content */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '60%',
            background: 'linear-gradient(to bottom, transparent, var(--bg-base) 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* Top accent line */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: `linear-gradient(to right, transparent, ${product.accentColorHex}, transparent)`,
          }}
        />

        {/* Subtle center glow from product accent */}
        <div
          style={{
            position: 'absolute',
            top: '10%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '600px',
            height: '200px',
            background: `radial-gradient(ellipse, ${product.accentColorHex}15 0%, transparent 70%)`,
            pointerEvents: 'none',
          }}
        />

        {/* Content container */}
        <div className="container" style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingTop: '80px', paddingBottom: '48px' }}>
          {/* Breadcrumb */}
          <nav style={{ marginBottom: '24px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Link href="/products" style={{ fontSize: '12px', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
              Catalog
            </Link>
            <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>/</span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', letterSpacing: '0.02em' }}>{product.displayName}</span>
          </nav>

          {/* Pending Confirmation warning */}
          {product.publishStatus === 'needs_confirmation' && (
            <div
              style={{
                marginBottom: '20px',
                padding: '10px 16px',
                background: 'rgba(196, 168, 130, 0.08)',
                border: '1px solid rgba(196, 168, 130, 0.25)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--amber)', flexShrink: 0 }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.08em', color: 'var(--amber)', textTransform: 'uppercase' }}>
                Pending Founder Confirmation — Not Published to Public Catalog
              </span>
            </div>
          )}

          {/* Two-column layout: image + info */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '320px 1fr',
              gap: '56px',
              alignItems: 'center',
            }}
          >
            {/* Product image */}
            <ProductImage
              slug={product.slug}
              displayName={product.displayName}
              accentColorHex={product.accentColorHex}
              image={frontSrc}
              hoverSpinFrames={getProductHoverSpinFrames(product)}
              height={280}
            />

            {/* Product info */}
            <div>
              {/* Status badges */}
              <div style={{ marginBottom: '14px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
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

              {/* Product name */}
              <h1
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)',
                  fontWeight: 400,
                  marginBottom: '6px',
                  letterSpacing: '-0.01em',
                }}
              >
                {product.displayName}
              </h1>

              {/* Full name */}
              <div className="label" style={{ marginBottom: '20px', fontSize: '11px' }}>{product.fullName}</div>

              {/* Summary */}
              <p
                style={{
                  fontSize: '14px',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.75,
                  maxWidth: '440px',
                  marginBottom: '28px',
                }}
              >
                {product.summaryShort}
              </p>

              {/* CTAs */}
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

      {/* ─── Content Section ──────────────────────────────────── */}
      <section style={{ padding: '64px 0 80px' }}>
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 400px',
              gap: '48px',
              alignItems: 'start',
            }}
          >
            {/* Left column — content */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>

              {/* Research Summary */}
              <div>
                <div className="section-label" style={{ marginBottom: '14px' }}>Research Summary</div>
                <h2
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.35rem',
                    fontWeight: 400,
                    marginBottom: '16px',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {product.fullName}
                </h2>
                <p
                  style={{
                    fontSize: '14px',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.85,
                  }}
                >
                  {product.summaryFull}
                </p>
              </div>

              {/* Key Product Details */}
              {detailRows.length > 0 && (
                <div>
                  <div className="section-label" style={{ marginBottom: '14px' }}>Key Product Details</div>
                  <div
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-lg)',
                      overflow: 'hidden',
                    }}
                  >
                    {detailRows.map((row, i) => (
                      <div
                        key={row.label}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '160px 1fr',
                          gap: '20px',
                          padding: '13px 18px',
                          borderBottom: i < detailRows.length - 1 ? '1px solid var(--border)' : 'none',
                          alignItems: 'start',
                        }}
                      >
                        <div className="label" style={{ fontSize: '10px', paddingTop: '1px' }}>{row.label}</div>
                        <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-secondary)' }}>
                          {row.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Features */}
              <div>
                <div className="section-label" style={{ marginBottom: '14px' }}>Catalog Features</div>
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
                          width: '5px',
                          height: '5px',
                          borderRadius: '50%',
                          background: product.accentColorHex,
                          flexShrink: 0,
                          boxShadow: `0 0 6px ${product.accentColorHex}60`,
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
                <div className="section-label" style={{ marginBottom: '14px' }}>Documentation</div>
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
                    testingRecords.map((record) => {
                      const cleanRecordRows = [
                        { label: 'Testing Lab', value: cleanValue(record.testingLab) },
                        { label: 'Test Date', value: cleanValue(record.testDate) },
                        { label: 'Purity', value: cleanValue(record.purityPercent) },
                        { label: 'Methodology', value: record.methodology?.length ? record.methodology.join(', ') : null },
                      ].filter((r) => r.value !== null) as { label: string; value: string }[]

                      return (
                        <div key={record.batchNumber} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span className="label">Batch {record.batchNumber}</span>
                            <span className="badge badge-amber">Pending</span>
                          </div>
                          {cleanRecordRows.length > 0 && (
                            <div style={{ display: 'grid', gap: '8px' }}>
                              {cleanRecordRows.map((r) => (
                                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                  <span style={{ color: 'var(--text-muted)' }}>{r.label}</span>
                                  <span style={{ color: 'var(--text-secondary)' }}>{r.value}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {record.coaUrl ? (
                            <a
                              href={record.coaUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '11px',
                                fontFamily: 'var(--font-mono)',
                                letterSpacing: '0.06em',
                                color: product.accentColorHex,
                                textDecoration: 'none',
                                marginTop: '4px',
                              }}
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                              View CoA Document
                            </a>
                          ) : (
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                              CoA documentation available upon request
                            </div>
                          )}
                        </div>
                      )
                    })
                  ) : (
                    <div
                      style={{
                        textAlign: 'center',
                        padding: '28px 16px',
                        color: 'var(--text-muted)',
                        fontSize: '13px',
                        lineHeight: 1.6,
                      }}
                    >
                      Testing documentation pending.<br />
                      Contact us for current batch records.
                    </div>
                  )}
                </div>
              </div>

              {/* Packaging & Labeling */}
              <div>
                <div className="section-label" style={{ marginBottom: '14px' }}>Packaging &amp; Labeling</div>
                <div
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                  }}
                >
                  {/* Product render area */}
                  <div
                    style={{
                      height: '220px',
                      background: 'var(--bg-elevated)',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    {frontSrc ? (
                      <div style={{ position: 'relative', height: '100%' }}>
                        <img
                          src={frontSrc}
                          alt={`${product.displayName} product render`}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            padding: '20px',
                          }}
                        />
                        {/* Subtle accent glow behind the product */}
                        <div
                          style={{
                            position: 'absolute',
                            inset: 0,
                            background: `radial-gradient(circle at 50% 50%, ${product.accentColorHex}18 0%, transparent 65%)`,
                            pointerEvents: 'none',
                          }}
                        />
                      </div>
                    ) : (
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          height: '100%',
                          gap: '8px',
                        }}
                      >
                        <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: product.accentColorHex, letterSpacing: '0.06em' }}>
                          {product.displayName}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          Additional views coming soon
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Packaging info rows */}
                  {packagingRows.length > 0 && (
                    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {packagingRows.map((r) => (
                        <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                          <span style={{ color: 'var(--text-muted)' }}>{r.label}</span>
                          <span style={{ color: 'var(--text-secondary)' }}>{r.value}</span>
                        </div>
                      ))}
                      {sideSrc && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', marginTop: '4px' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Side View</span>
                          <img
                            src={sideSrc}
                            alt={`${product.displayName} side view`}
                            style={{ width: '64px', height: '48px', objectFit: 'contain', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ─── Section Divider Banner ──────────────────────── */}
          <div
            style={{
              marginTop: '64px',
              height: '120px',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              position: 'relative',
              border: '1px solid var(--border)',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `url(${sectionDivider})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: 0.4,
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(135deg, var(--glow-product) 0%, transparent 60%)',
              }}
            />
          </div>

          {/* ─── Research-use notice ──────────────────────────── */}
          <div
            style={{
              marginTop: '48px',
              padding: '18px 24px',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              background: 'rgba(196, 168, 130, 0.03)',
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                letterSpacing: '0.06em',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                lineHeight: 1.9,
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