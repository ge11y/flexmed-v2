import type { Metadata } from 'next'
import { LEGAL_PAGES } from '@/lib/data-legal'

export const metadata: Metadata = {
  title: 'Research Disclaimer',
  description: 'Research disclaimer for FlexMed — for laboratory research use only.',
}

export default function DisclaimerPage() {
  const page = LEGAL_PAGES.disclaimer

  return (
    <div>
      <section style={{ padding: '64px 0 48px', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div className="section-label" style={{ marginBottom: '12px' }}>Legal</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 400, marginBottom: '16px' }}>
            {page.title}
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            Last updated: {page.lastUpdated}
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div style={{ maxWidth: '680px' }}>
            <div
              style={{
                fontSize: '14px',
                color: 'var(--text-secondary)',
                lineHeight: 1.9,
                whiteSpace: 'pre-wrap',
              }}
            >
              {page.content}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
