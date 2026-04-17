import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About',
  description: 'About FlexMed — research-first presentation, packaging consistency, and testing documentation.',
}

export default function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <section style={{ padding: '64px 0 48px', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div className="section-label" style={{ marginBottom: '12px' }}>About FlexMed</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 400, marginBottom: '16px', maxWidth: '640px' }}>
            Built around research procurement standards.
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)', maxWidth: '520px', lineHeight: 1.7 }}>
            FlexMed is a research compound catalog designed for institutional buyers who need batch-verified documentation before they procure.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="section">
        <div className="container">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', maxWidth: '720px' }}>
            {/* Research-first */}
            <div>
              <div className="section-label" style={{ marginBottom: '12px' }}>Research-First Presentation</div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 400, marginBottom: '16px' }}>
                Catalog entries, not marketing pages.
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '16px' }}>
                Every compound in the FlexMed catalog is presented as a research reference entry — not a product sales page. There are no usage instructions, no therapeutic claims, and no dosage guidance. The catalog exists to support procurement decisions at research institutions.
              </p>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                Compound descriptions are drawn from established scientific literature and are classified by research area. The goal is to make the catalog useful to researchers who need to identify, verify, and document the compounds they intend to use in their work.
              </p>
            </div>

            {/* Packaging */}
            <div>
              <div className="section-label" style={{ marginBottom: '12px' }}>Packaging &amp; Consistency</div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 400, marginBottom: '16px' }}>
                Universal container system.
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '16px' }}>
                All compounds in the FlexMed catalog are labeled using a standardized format. The container family is consistent across the full product range — only the label text and accent color change by compound. This is a deliberate design decision that reflects the operational standardization FlexMed applies to its fulfillment process.
              </p>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                Label content per compound includes: compound name, format and strength, batch/lot number, date of manufacture, storage conditions, and purity (from the batch CoA). No claims, no directions, no medical language.
              </p>
            </div>

            {/* Testing */}
            <div>
              <div className="section-label" style={{ marginBottom: '12px' }}>Testing &amp; Documentation</div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 400, marginBottom: '16px' }}>
                Independent verification, batch by batch.
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '16px' }}>
                Every compound batch is tested by an independent, ISO-accredited third-party laboratory before it is released. Testing is not self-certified. The laboratory has no commercial relationship with FlexMed.
              </p>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                Testing results — identity, purity, molecular weight — are published on the relevant product page and in the Testing section before any order is fulfilled. If a CoA is not available for a batch, that batch is not available for order.
              </p>
            </div>

            {/* Values */}
            <div>
              <div className="section-label" style={{ marginBottom: '16px' }}>Operational Standards</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                {[
                  { title: 'Institutional verification', body: 'All orders are reviewed against institutional credentials before acceptance.' },
                  { title: 'Documentation-first', body: 'Published CoAs precede all product availability. No exceptions.' },
                  { title: 'No self-certification', body: 'Testing is conducted by independent, accredited third-party laboratories.' },
                  { title: 'Quote-first model', body: 'No pricing displayed in the catalog. Quotes are issued based on current batch availability.' },
                ].map((item) => (
                  <div
                    key={item.title}
                    style={{
                      padding: '20px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-lg)',
                    }}
                  >
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '8px' }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      {item.body}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Placeholder team section */}
            <div>
              <div className="section-label" style={{ marginBottom: '12px' }}>Team</div>
              <div
                style={{
                  padding: '32px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '16px', color: 'var(--text-primary)', marginBottom: '8px' }}>
                  [FOUNDER OR TEAM DETAILS REQUIRED]
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  [TITLE REQUIRED]
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
