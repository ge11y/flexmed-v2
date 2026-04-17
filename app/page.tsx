import Link from 'next/link'
import { SITE_SETTINGS, FOOTER_LINKS } from '@/lib/data-site'
import { getFeaturedProducts, PRODUCT_CATEGORIES } from '@/lib/data-products'
import { ProductCard } from '@/components/ProductCard'

export default function HomePage() {
  const featured = getFeaturedProducts()

  return (
    <div>
      {/* ─── Hero ─────────────────────────────────────────── */}
      <section
        style={{
          minHeight: 'calc(100vh - 64px)',
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
          borderBottom: '1px solid var(--border)',
        }}
      >
        {/* Background texture */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(196, 168, 130, 0.04) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div className="container" style={{ position: 'relative', zIndex: 1, paddingTop: '80px', paddingBottom: '80px' }}>
          <div style={{ maxWidth: '680px' }}>
            {/* Label */}
            <div className="section-label" style={{ marginBottom: '24px' }}>
              Research Catalog — {SITE_SETTINGS.businessName}
            </div>

            {/* Headline */}
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(2.5rem, 6vw, 4rem)',
                fontWeight: 300,
                color: 'var(--text-primary)',
                lineHeight: 1.15,
                marginBottom: '24px',
                letterSpacing: '-0.02em',
              }}
            >
              {SITE_SETTINGS.heroHeadline}
            </h1>

            {/* Subheadline */}
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'clamp(1rem, 2vw, 1.2rem)',
                color: 'var(--text-secondary)',
                lineHeight: 1.7,
                marginBottom: '40px',
                maxWidth: '520px',
                fontWeight: 300,
              }}
            >
              {SITE_SETTINGS.heroSubheadline}
            </p>

            {/* CTAs */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '48px' }}>
              <Link href="/products" className="btn btn-primary" style={{ padding: '14px 28px', fontSize: '14px' }}>
                {SITE_SETTINGS.heroPrimaryCta}
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 7H11M7.5 3.5L11 7L7.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <Link href="/testing" className="btn btn-outline" style={{ padding: '14px 28px', fontSize: '14px' }}>
                {SITE_SETTINGS.heroSecondaryCta}
              </Link>
            </div>

            {/* Micro disclaimer */}
            <p
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                letterSpacing: '0.06em',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                maxWidth: '400px',
              }}
            >
              {SITE_SETTINGS.heroDisclaimer}
            </p>
          </div>
        </div>
      </section>

      {/* ─── Trust Strip ───────────────────────────────────── */}
      <section
        style={{
          padding: '32px 0',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-surface)',
        }}
      >
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '0',
            }}
          >
            {SITE_SETTINGS.trustSignals.map((signal, i) => (
              <div
                key={signal.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px 20px',
                  borderRight: i < SITE_SETTINGS.trustSignals.length - 1 ? '1px solid var(--border)' : 'none',
                }}
              >
                <TrustIcon type={signal.icon} />
                <span
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                    fontWeight: 400,
                  }}
                >
                  {signal.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Featured Products ─────────────────────────────── */}
      <section className="section">
        <div className="container">
          <div style={{ marginBottom: '40px' }}>
            <div className="section-label">Featured</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 400 }}>
              Research compounds in the catalog
            </h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '20px',
            }}
          >
            {featured.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>

          <div style={{ marginTop: '40px', textAlign: 'center' }}>
            <Link href="/products" className="btn btn-outline">
              View Full Catalog
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 7H11M7.5 3.5L11 7L7.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Quality Section ───────────────────────────────── */}
      <section
        style={{
          padding: 'var(--space-3xl) 0',
          borderTop: '1px solid var(--border)',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-surface)',
        }}
      >
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '48px',
              alignItems: 'center',
            }}
          >
            {/* Text */}
            <div>
              <div className="section-label">Quality</div>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
                  fontWeight: 400,
                  marginBottom: '16px',
                }}
              >
                Quality signals that matter.
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: '400px' }}>
                Every compound in the FlexMed catalog is backed by independent batch testing, verifiable documentation, and standardized labeling — built for researchers who need certainty before they procure.
              </p>
              <Link href="/about" className="btn btn-ghost" style={{ marginTop: '24px', paddingLeft: 0 }}>
                Learn about our standards
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 7H11M7.5 3.5L11 7L7.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>

            {/* Quality bullets */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {[
                {
                  title: 'Independent testing workflow',
                  body: 'Every batch is tested by an ISO-accredited third-party laboratory. No self-certification.',
                },
                {
                  title: 'Batch-specific documentation',
                  body: 'Published CoAs tied to specific batch numbers — not generic product sheets.',
                },
                {
                  title: 'Standardized labeling',
                  body: 'Consistent label format across all compounds in the catalog. Batch, date, purity, format.',
                },
                {
                  title: 'Clear compound identification',
                  body: 'Full names, aliases, structure types, and research categories — no ambiguous naming.',
                },
              ].map((item) => (
                <div key={item.title} style={{ display: 'flex', gap: '16px' }}>
                  <div
                    style={{
                      width: '4px',
                      minHeight: '100%',
                      background: 'var(--amber)',
                      borderRadius: '2px',
                      flexShrink: 0,
                      opacity: 0.5,
                    }}
                  />
                  <div>
                    <div
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: '14px',
                        fontWeight: 500,
                        color: 'var(--text-primary)',
                        marginBottom: '4px',
                      }}
                    >
                      {item.title}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      {item.body}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Testing Section ────────────────────────────────── */}
      <section className="section">
        <div className="container">
          <div style={{ maxWidth: '560px', marginBottom: '48px' }}>
            <div className="section-label">Testing &amp; Verification</div>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
                fontWeight: 400,
                marginBottom: '16px',
              }}
            >
              Testing and verification.
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              Testing details, lab references, and batch-specific documentation will appear here as records are finalized. Browse the full testing library below.
            </p>
          </div>

          {/* Placeholder testing record cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '16px',
              marginBottom: '40px',
            }}
          >
            {[
              { compound: 'CJC/Ipa 10mg', batch: 'FM-CJC-IPA-001', status: 'Pending' },
              { compound: 'TIRZ 15mg', batch: 'FM-TZ-1501', status: 'Pending' },
              { compound: 'NAD+ 500mg', batch: 'FM-NAD-500-001', status: 'Pending' },
              { compound: 'SS-31 50mg', batch: 'FM-SS31-001', status: 'Pending' },
            ].map((record) => (
              <div
                key={record.batch}
                className="card"
                style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}
              >
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '16px', color: 'var(--text-primary)' }}>
                  {record.compound}
                </div>
                <div className="label">Batch {record.batch}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="badge badge-amber">{record.status}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    [LAB DATA REQUIRED]
                  </span>
                </div>
              </div>
            ))}
          </div>

          <Link href="/testing" className="btn btn-outline">
            View Testing Standards
          </Link>
        </div>
      </section>

      {/* ─── CTA Banner ─────────────────────────────────────── */}
      <section
        style={{
          padding: '80px 0',
          borderTop: '1px solid var(--border)',
          background: 'var(--bg-surface)',
          textAlign: 'center',
        }}
      >
        <div className="container">
          <div className="section-label" style={{ marginBottom: '16px' }}>Get Started</div>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
              fontWeight: 300,
              marginBottom: '16px',
            }}
          >
            Ready to explore the catalog?
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '32px', maxWidth: '440px', margin: '0 auto 32px' }}>
            Browse the full research catalog, review testing documentation, and submit an inquiry when you are ready.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/products" className="btn btn-primary" style={{ padding: '14px 32px' }}>
              Browse Catalog
            </Link>
            <Link href="/contact" className="btn btn-outline" style={{ padding: '14px 32px' }}>
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

function TrustIcon({ type }: { type: string }) {
  const icons: Record<string, React.ReactNode> = {
    flask: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ color: 'var(--amber)', flexShrink: 0 }}>
        <path d="M7 2V7L3 13C2.5 14 3 15 4 15H14C15 15 15.5 14 15 13L11 7V2" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
        <path d="M6 2H12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
    batch: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ color: 'var(--amber)', flexShrink: 0 }}>
        <rect x="2" y="4" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
        <path d="M6 4V3C6 2.5 6.5 2 7 2H11C11.5 2 12 2.5 12 3V4" stroke="currentColor" strokeWidth="1.2" />
        <path d="M2 8H16" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    ),
    document: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ color: 'var(--amber)', flexShrink: 0 }}>
        <path d="M10 2H5C4 2 3 3 3 4V14C3 15 4 16 5 16H13C14 16 15 15 15 14V7L10 2Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
        <path d="M10 2V7H15" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
        <path d="M6 10H12M6 13H9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
    catalog: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ color: 'var(--amber)', flexShrink: 0 }}>
        <path d="M3 5C3 3.5 4 2.5 5.5 2.5H12.5C14 2.5 15 3.5 15 5V13.5C15 14.5 14 15.5 13 15.5H5.5C4 15.5 3 14.5 3 13.5V5Z" stroke="currentColor" strokeWidth="1.2" />
        <path d="M6 6H12M6 9H12M6 12H9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  }
  return icons[type] ?? null
}
