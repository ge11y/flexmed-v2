import Link from 'next/link'
import { SITE_SETTINGS, FOOTER_LINKS } from '@/lib/data-site'

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer
      style={{
        borderTop: '1px solid var(--border)',
        background: 'var(--bg-surface)',
        paddingTop: '48px',
        paddingBottom: '32px',
      }}
    >
      <div className="container">
        {/* Top row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '40px',
            marginBottom: '48px',
          }}
        >
          {/* Brand column */}
          <div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '18px',
                letterSpacing: '0.06em',
                color: 'var(--text-primary)',
                marginBottom: '12px',
              }}
            >
              {SITE_SETTINGS.businessName}
            </div>
            <p
              style={{
                fontSize: '12px',
                color: 'var(--text-muted)',
                lineHeight: 1.7,
                maxWidth: '200px',
              }}
            >
              Research compounds presented with clarity.
            </p>
          </div>

          {/* Links */}
          <div>
            <div className="label" style={{ marginBottom: '16px' }}>Catalog</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {FOOTER_LINKS.catalog.map((l) => (
                <Link key={l.href} href={l.href} style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <div className="label" style={{ marginBottom: '16px' }}>Company</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {FOOTER_LINKS.company.map((l) => (
                <Link key={l.href} href={l.href} style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <div className="label" style={{ marginBottom: '16px' }}>Legal</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {FOOTER_LINKS.legal.map((l) => (
                <Link key={l.href} href={l.href} style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="divider" style={{ marginBottom: '24px' }} />

        {/* Bottom row */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {SITE_SETTINGS.institutionalEmail}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {SITE_SETTINGS.businessAddress}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {SITE_SETTINGS.companyRegistration}
            </div>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'right', maxWidth: '380px' }}>
            {SITE_SETTINGS.footerDisclaimer}
          </div>
        </div>

        <div
          style={{
            marginTop: '24px',
            fontSize: '11px',
            color: 'var(--text-muted)',
          }}
        >
          &copy; {year} {SITE_SETTINGS.businessName}. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
