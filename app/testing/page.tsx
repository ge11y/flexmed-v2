import type { Metadata } from 'next'
import Link from 'next/link'
import { TESTING_LABS, TESTING_RECORDS } from '@/lib/data-testing'
import { PRODUCTS, PUBLIC_SLUGS } from '@/lib/data-products'

export const metadata: Metadata = {
  title: 'COA Testing',
  description:
    'FlexMed certificate of analysis access, laboratory verification, and batch documentation.',
}

function cleanLabValue(val: string | undefined | null): string | null {
  if (!val) return null
  if (
    /^\[.+(REQUIRED|PENDING|DATE|LABEL|PRODUCT|IMAGE).*\]$/i.test(
      val.trim()
    )
  )
    return null
  return val
}

function hasRealLabData(): boolean {
  return Boolean(cleanLabValue(TESTING_LABS.primary.name))
}

function formatTestingDate(value: string): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function TestingPage() {
  const lab = TESTING_LABS.primary
  const publicProducts = PUBLIC_SLUGS.map((s) => PRODUCTS[s]).filter(Boolean)
  const labIsPopulated = hasRealLabData()
  const publicProductSet = new Set(publicProducts.map((product) => product.slug))
  const publishedRecords = Object.entries(TESTING_RECORDS)
    .filter(([slug, records]) => publicProductSet.has(slug) && records.some((record) => record.status === 'available' && record.coaUrl))
    .flatMap(([slug, records]) =>
      records
        .filter((record) => record.status === 'available' && record.coaUrl)
        .map((record) => ({
          product: PRODUCTS[slug],
          record,
        }))
    )

  return (
    <div style={{ backgroundColor: 'var(--bg-base)', minHeight: '100vh' }}>

      {/* ─── Hero with protein illustration ─────────────────── */}
      <section
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderBottom: '1px solid var(--border)',
        }}
      >
        {/* Full-bleed protein illustration as background */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'url(/banners/testing-hero.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center 35%',
            opacity: 0.35,
          }}
        />

        {/* Left-side dark fade so text is readable */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
              background:
              'linear-gradient(to right, rgba(255,255,255,0.60) 0%, rgba(255,255,255,0.08) 50%, transparent 100%)',
          }}
        />

        {/* Content */}
        <div
          className="container"
          style={{ position: 'relative', zIndex: 1, padding: '72px 40px 64px' }}
        >
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              marginBottom: '14px',
              fontWeight: 500,
            }}
          >
            COA Testing
          </p>
          <h1
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(26px, 5vw, 42px)',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: '18px',
              maxWidth: '560px',
              letterSpacing: '-0.02em',
              lineHeight: 1.15,
            }}
          >
            Certificates of analysis and verification standards.
          </h1>
          <p
            style={{
              fontSize: '16px',
              color: 'var(--text-secondary)',
              maxWidth: '520px',
              lineHeight: 1.7,
            }}
          >
            Every batch released through FlexMed is tested by an accredited
            third-party laboratory. Testing data is published batch-by-batch —
            not as a generic product sheet.
          </p>
        </div>
      </section>

      {/* ─── Body ───────────────────────────────────────────── */}
      <section style={{ padding: '64px 0 80px' }}>
        <div className="container">
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '56px',
              maxWidth: '720px',
            }}
          >
            {/* ── Workflow ── */}
            <div>
              <p
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  letterSpacing: '0.10em',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  marginBottom: '16px',
                  fontWeight: 500,
                }}
              >
                COA Testing Workflow
              </p>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                {[
                  {
                    step: '01',
                    title: 'Batch submission',
                    body: 'Each peptide batch is submitted to a third-party testing laboratory following production. No batch is released for fulfillment before testing is complete.',
                  },
                  {
                    step: '02',
                    title: 'Third-party HPLC + MS analysis',
                    body: 'Testing is conducted using High-Performance Liquid Chromatography (HPLC) for purity and Mass Spectrometry (MS) for identity confirmation and molecular weight verification.',
                  },
                  {
                    step: '03',
                    title: 'CoA publication',
                    body: 'Results are compiled into a Certificate of Analysis (CoA) and published on the relevant product page. The batch is marked as available only after the CoA is live.',
                  },
                  {
                    step: '04',
                    title: 'Batch traceability',
                    body: 'Each CoA is tied to a specific batch number. Researchers can verify the exact batch they are ordering against the published documentation.',
                  },
                ].map((item) => (
                  <div
                    key={item.step}
                    style={{
                      display: 'flex',
                      gap: '20px',
                      padding: '20px 22px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-lg)',
                    }}
                  >
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11px',
                        color: 'var(--accent-400)',
                        letterSpacing: '0.1em',
                        paddingTop: '2px',
                        flexShrink: 0,
                        fontWeight: 500,
                      }}
                    >
                      {item.step}
                    </div>
                    <div>
                      <div
                        style={{
                          fontFamily: 'var(--font-body)',
                          fontSize: '15px',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          marginBottom: '6px',
                        }}
                      >
                        {item.title}
                      </div>
                      <div
                        style={{
                          fontSize: '14px',
                          color: 'var(--text-secondary)',
                          lineHeight: 1.7,
                        }}
                      >
                        {item.body}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Methodology cards ── */}
            <div>
              <p
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  letterSpacing: '0.10em',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  marginBottom: '16px',
                  fontWeight: 500,
                }}
              >
                Methodology
              </p>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '12px',
                }}
              >
                {[
                  {
                    abbr: 'HPLC',
                    full: 'High-Performance Liquid Chromatography',
                    use: 'Purity quantification',
                  },
                  {
                    abbr: 'MS',
                    full: 'Mass Spectrometry',
                    use: 'Identity + molecular weight verification',
                  },
                ].map((m) => (
                  <div
                    key={m.abbr}
                    style={{
                      padding: '20px 22px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-lg)',
                    }}
                  >
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '13px',
                        color: 'var(--accent-400)',
                        marginBottom: '8px',
                        fontWeight: 600,
                        letterSpacing: '0.04em',
                      }}
                    >
                      {m.abbr}
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: '14px',
                        color: 'var(--text-primary)',
                        marginBottom: '6px',
                        fontWeight: 500,
                      }}
                    >
                      {m.full}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      {m.use}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Testing lab ── */}
            {labIsPopulated ? (
              <div>
                <p
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    letterSpacing: '0.10em',
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    marginBottom: '16px',
                    fontWeight: 500,
                  }}
                >
                  Testing Laboratory
                </p>
                <div
                  style={{
                    padding: '24px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: '20px',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      marginBottom: '18px',
                    }}
                  >
                    {lab.name}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}
                  >
                    {[
                      {
                        label: 'Accreditation Body',
                        value: cleanLabValue(lab.accreditationBody),
                      },
                      {
                        label: 'Accreditation Number',
                        value: cleanLabValue(lab.accreditationNumber),
                      },
                      { label: 'Website', value: cleanLabValue(lab.website) },
                    ]
                      .filter((row) => row.value !== null)
                      .map((row) => (
                        <div
                          key={row.label}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '14px',
                          }}
                        >
                          <span style={{ color: 'var(--text-muted)' }}>
                            {row.label}
                          </span>
                          <span
                            style={{
                              color: 'var(--text-secondary)',
                              fontFamily: 'var(--font-mono)',
                              fontSize: '12px',
                            }}
                          >
                            {row.value}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <p
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    letterSpacing: '0.10em',
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    marginBottom: '16px',
                    fontWeight: 500,
                  }}
                >
                  Testing Laboratory
                </p>
                <div
                  style={{
                    padding: '24px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '14px',
                    lineHeight: 1.6,
                  }}
                >
                  Testing laboratory details are confirmed at the time of batch
                  testing and published with each CoA.
                </div>
              </div>
            )}

            {/* ── Batch records table ── */}
            <div>
              <p
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  letterSpacing: '0.10em',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  marginBottom: '16px',
                  fontWeight: 500,
                }}
              >
                Batch Records
              </p>

              {publishedRecords.length > 0 ? (
                <>
                  <div
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-lg)',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Table header */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr',
                        gap: '16px',
                        padding: '12px 20px',
                        borderBottom: '1px solid var(--border)',
                        background: 'var(--bg-elevated)',
                      }}
                    >
                      {['Peptide', 'Batch', 'Lab', 'Test Date', 'Purity', 'CoA'].map(
                        (h) => (
                          <div
                            key={h}
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: '10px',
                              letterSpacing: '0.08em',
                              textTransform: 'uppercase',
                              color: 'var(--text-muted)',
                              fontWeight: 500,
                            }}
                          >
                            {h}
                          </div>
                        )
                      )}
                    </div>
                    {/* Table rows */}
                    {publishedRecords.map(({ product, record }) => (
                      <div
                        key={`${product.slug}-${record.coaUrl}`}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr',
                          gap: '16px',
                          padding: '14px 20px',
                          borderBottom: '1px solid var(--border)',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <Link
                            href={`/products/${product.slug}`}
                            style={{
                              fontFamily: 'var(--font-heading)',
                              fontSize: '14px',
                              fontWeight: 600,
                              color: 'var(--text-primary)',
                              textDecoration: 'none',
                            }}
                          >
                            {product.displayName}
                          </Link>
                        </div>
                        <div
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '11px',
                            color: 'var(--text-muted)',
                          }}
                        >
                          {cleanLabValue(record.batchNumber) ?? '—'}
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                          {cleanLabValue(record.testingLab) ?? '—'}
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                          {formatTestingDate(record.testDate)}
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                          {cleanLabValue(record.purityPercent) ?? '—'}
                        </div>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                          <a
                            href={record.coaUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: '11px',
                              letterSpacing: '0.05em',
                              color: 'var(--accent-500)',
                              textDecoration: 'none',
                              fontWeight: 500,
                            }}
                          >
                            View
                          </a>
                          <a
                            href={record.coaUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: '11px',
                              letterSpacing: '0.05em',
                              color: 'var(--text-secondary)',
                              textDecoration: 'none',
                              fontWeight: 500,
                            }}
                          >
                            Print
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p
                    style={{
                      marginTop: '12px',
                      fontSize: '13px',
                      color: 'var(--text-muted)',
                      lineHeight: 1.6,
                    }}
                  >
                    Testing is completed prior to batch purchase and shipment.
                    This page is the central location for CoA access and batch
                    documentation.
                  </p>
                </>
              ) : (
                <div
                  style={{
                    padding: '32px 24px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '14px',
                    lineHeight: 1.6,
                  }}
                >
                  CoA documents and batch testing records are being organized
                  here. Testing is completed prior to batch purchase and
                  shipment.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
