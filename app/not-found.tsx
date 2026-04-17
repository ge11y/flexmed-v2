import Link from 'next/link'

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: 'calc(100vh - 64px - 300px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '64px var(--space-lg)',
      }}
    >
      <div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            letterSpacing: '0.14em',
            color: 'var(--amber)',
            textTransform: 'uppercase',
            marginBottom: '16px',
          }}
        >
          404 — Not Found
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            fontWeight: 400,
            color: 'var(--text-primary)',
            marginBottom: '16px',
          }}
        >
          Page not found.
        </h1>
        <p
          style={{
            fontSize: '14px',
            color: 'var(--text-secondary)',
            maxWidth: '360px',
            lineHeight: 1.6,
            marginBottom: '40px',
          }}
        >
          The page you are looking for does not exist or has been moved. Return to the catalog to continue.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/" className="btn btn-primary">
            Return Home
          </Link>
          <Link href="/products" className="btn btn-outline">
            View Catalog
          </Link>
        </div>
      </div>
    </div>
  )
}
