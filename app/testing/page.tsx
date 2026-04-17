import type { Metadata } from 'next'
import { TESTING_LABS } from '@/lib/data-testing'
import { PRODUCTS, CONFIRMED_SLUGS } from '@/lib/data-products'

export const metadata: Metadata = {
  title: 'Testing Standards',
  description: 'FlexMed third-party testing workflow, laboratory verification, and batch documentation.',
}

export default function TestingPage() {
  const lab = TESTING_LABS.primary
  const confirmedProducts = CONFIRMED_SLUGS.map((s) => PRODUCTS[s]).filter(Boolean)

  return (
    <div>
      {/* Hero */}
      <section style={{ padding: '64px 0 48px', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div className="section-label" style={{ marginBottom: '12px' }}>Testing &amp; Verification</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 400, marginBottom: '16px', maxWidth: '600px' }}>
            Testing and verification standards.
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)', maxWidth: '520px', lineHeight: 1.7 }}>
            Every batch released through FlexMed is tested by an independent, accredited laboratory. Testing data is published batch-by-batch — not as a generic product sheet.
          </p>
        </div>
      </section>

      {/* Testing workflow */}
      <section className="section">
        <div className="container">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', maxWidth: '720px' }}>
            {/* Workflow steps */}
            <div>
              <div className="section-label" style={{ marginBottom: '16px' }}>Testing Workflow</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[
                  {
                    step: '01',
                    title: 'Batch submission',
                    body: 'Each batch of compound is submitted to the independent testing laboratory following production. No batch is released for fulfillment before testing is complete.',
                  },
                  {
                    step: '02',
                    title: 'Independent HPLC + MS analysis',
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
                      padding: '20px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-lg)',
                    }}
                  >
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11px',
                        color: 'var(--amber)',
                        letterSpacing: '0.1em',
                        paddingTop: '2px',
                        flexShrink: 0,
                      }}
                    >
                      {item.step}
                    </div>
                    <div>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '6px' }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                        {item.body}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Testing lab */}
            <div>
              <div className="section-label" style={{ marginBottom: '16px' }}>Testing Laboratory</div>
              <div
                style={{
                  padding: '24px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                }}
              >
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--text-primary)', marginBottom: '16px' }}>
                  {lab.name}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { label: 'Accreditation Body', value: lab.accreditationBody },
                    { label: 'Accreditation Number', value: lab.accreditationNumber },
                    { label: 'Website', value: lab.website },
                  ].map((row) => (
                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{row.label}</span>
                      <span
                        style={{
                          color: row.value.includes('[REQUIRED]') ? 'var(--text-muted)' : 'var(--text-secondary)',
                          fontFamily: row.value.includes('[REQUIRED]') ? 'var(--font-body)' : 'var(--font-mono)',
                          fontSize: row.value.includes('[REQUIRED]') ? '13px' : '12px',
                        }}
                      >
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Methodology */}
            <div>
              <div className="section-label" style={{ marginBottom: '16px' }}>Methodology</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                {[
                  { name: 'HPLC', full: 'High-Performance Liquid Chromatography', use: 'Purity quantification' },
                  { name: 'MS', full: 'Mass Spectrometry', use: 'Identity + molecular weight' },
                ].map((method) => (
                  <div
                    key={method.name}
                    style={{
                      padding: '20px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-lg)',
                    }}
                  >
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--amber)', marginBottom: '8px' }}>
                      {method.name}
                    </div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-primary)', marginBottom: '6px' }}>
                      {method.full}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {method.use}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Batch records placeholder */}
            <div>
              <div className="section-label" style={{ marginBottom: '16px' }}>Batch Records</div>
              <div
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                }}
              >
                {/* Header */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
                    gap: '16px',
                    padding: '12px 20px',
                    borderBottom: '1px solid var(--border)',
                    background: 'var(--bg-elevated)',
                  }}
                >
                  {['Compound', 'Batch', 'Lab', 'Test Date', 'Purity'].map((h) => (
                    <div key={h} className="label" style={{ fontSize: '10px' }}>{h}</div>
                  ))}
                </div>
                {/* Rows */}
                {confirmedProducts.slice(0, 8).map((product) => (
                  <div
                    key={product.slug}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
                      gap: '16px',
                      padding: '14px 20px',
                      borderBottom: '1px solid var(--border)',
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '14px', color: 'var(--text-primary)' }}>
                      {product.displayName}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
                      {product.batchNumber || '[BATCH]'}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {product.testingLab || '[LAB]'}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      [DATE]
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {product.purityPercent || '[PURITY]'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
