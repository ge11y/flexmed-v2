import type { Metadata } from 'next'
import { SITE_SETTINGS } from '@/lib/data-site'
import { InquiryForm } from '@/components/InquiryForm'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Submit an institutional inquiry or quote request to FlexMed.',
}

export default function ContactPage() {
  return (
    <div>
      {/* Hero */}
      <section style={{ padding: '64px 0 48px', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div className="section-label" style={{ marginBottom: '12px' }}>Contact</div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2rem, 5vw, 3rem)',
              fontWeight: 400,
              marginBottom: '16px',
            }}
          >
            Institutional inquiries.
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)', maxWidth: '480px', lineHeight: 1.7 }}>
            Submit an inquiry to receive a formal quote. All inquiries are reviewed by our institutional accounts team.
            Response within 1–2 business days.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="section">
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '48px',
              maxWidth: '900px',
            }}
          >
            {/* Contact info */}
            <div>
              <div className="section-label" style={{ marginBottom: '20px' }}>Contact Information</div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '24px',
                }}
              >
                {[
                  {
                    label: 'Institutional Email',
                    value: SITE_SETTINGS.institutionalEmail,
                    note: 'For inquiries and quote requests',
                  },
                  {
                    label: 'Business Address',
                    value: SITE_SETTINGS.businessAddress,
                    note: 'Primary operating location',
                  },
                  {
                    label: 'Company Registration',
                    value: SITE_SETTINGS.companyRegistration,
                    note: 'Registered business details',
                  },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="label" style={{ marginBottom: '4px', fontSize: '10px' }}>
                      {item.label}
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: '14px',
                        color: item.value.includes('[') ? 'var(--text-muted)' : 'var(--text-primary)',
                        marginBottom: '4px',
                      }}
                    >
                      {item.value}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.note}</div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '24px' }}>
                <div className="section-label" style={{ marginBottom: '12px' }}>Response Time</div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                  All inquiries are reviewed by our institutional accounts team. Typical response time is 1–2 business days.
                  For urgent procurement needs, please indicate this in your inquiry.
                </p>
              </div>
            </div>

            {/* Inquiry form — client component */}
            <div>
              <div className="section-label" style={{ marginBottom: '20px' }}>Submit Inquiry</div>
              <InquiryForm />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
