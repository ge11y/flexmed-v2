import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Resources',
  description: 'FlexMed research resources, documentation, and compliance references.',
}

const resourceLinks = [
  {
    label: 'COA Testing',
    href: '/testing',
    body: 'Browse published certificates of analysis and batch-linked laboratory documentation.',
  },
  {
    label: 'FAQ',
    href: '/faq',
    body: 'Review common catalog, documentation, shipping, and compliance questions.',
  },
  {
    label: 'Research Disclaimer',
    href: '/disclaimer',
    body: 'Review research-use-only terms, intended-use limits, and handling responsibility.',
  },
  {
    label: 'Shipping & Returns',
    href: '/shipping-returns',
    body: 'See fulfillment, damaged-item, and returns policy details.',
  },
]

export default function ResourcesPage() {
  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>
      <section style={{ padding: '88px 40px 40px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="section-label" style={{ marginBottom: '12px' }}>Resources</div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2rem, 5vw, 2.8rem)', marginBottom: '16px' }}>
            Documentation and research resources.
          </h1>
          <p style={{ maxWidth: 620, fontSize: '15px', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
            FlexMed organizes its catalog around published documentation, research-use clarity, and accessible reference material.
          </p>
        </div>
      </section>

      <section style={{ padding: '48px 40px 80px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
          {resourceLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                textDecoration: 'none',
                color: 'inherit',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '20px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', color: 'var(--text-primary)' }}>{item.label}</div>
              <div style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-secondary)' }}>{item.body}</div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
