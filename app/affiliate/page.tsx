import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Affiliate',
  description: 'FlexMed affiliate program overview and partner workflow.',
}

const steps = [
  'Apply for review through FlexMed with your existing audience, publication channel, or research-network presence.',
  'Receive a unique tracking link or code once approved.',
  'Share FlexMed catalog pages, documentation standards, and published CoAs through your channels.',
  'Earn referral commissions on completed qualifying purchases tracked through your link.',
  'Commission payouts are reviewed and released on a scheduled cycle after order completion.',
]

export default function AffiliatePage() {
  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>
      <section style={{ padding: '88px 40px 40px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 980, margin: '0 auto' }}>
          <div className="section-label" style={{ marginBottom: '12px' }}>Affiliate Program</div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2rem, 5vw, 2.8rem)', marginBottom: '16px' }}>
            Partner with FlexMed.
          </h1>
          <p style={{ maxWidth: 640, fontSize: '15px', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
            FlexMed offers an affiliate program for approved partners with an established audience in research, performance science, health, fitness, or biohacking media.
          </p>
        </div>
      </section>

      <section style={{ padding: '48px 40px 80px' }}>
        <div style={{ maxWidth: 980, margin: '0 auto', display: 'grid', gap: '14px' }}>
          {steps.map((step, index) => (
            <div
              key={step}
              style={{
                display: 'grid',
                gridTemplateColumns: '48px 1fr',
                gap: '18px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '18px',
                padding: '20px',
              }}
            >
              <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-400)', fontSize: '12px', letterSpacing: '0.08em' }}>
                {String(index + 1).padStart(2, '0')}
              </div>
              <div style={{ fontSize: '14px', lineHeight: 1.7, color: 'var(--text-secondary)' }}>{step}</div>
            </div>
          ))}

          <div style={{ marginTop: '10px', fontSize: '14px', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
            For affiliate review and current terms, contact <a href="mailto:flexmedpeptides@gmail.com" style={{ color: 'var(--accent-400)', textDecoration: 'none' }}>flexmedpeptides@gmail.com</a>.
          </div>
        </div>
      </section>
    </div>
  )
}
