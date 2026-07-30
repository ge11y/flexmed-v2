import type { Metadata } from 'next'
import { Mail, MessageSquareText, PackageSearch } from 'lucide-react'
import { SITE_SETTINGS } from '@/lib/data-site'
import { getLiveCatalogProducts } from '@/lib/catalog-live'
import { InquiryForm } from '@/components/InquiryForm'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Contact FlexMed for catalog questions, availability updates, and documentation requests.',
}

export const dynamic = 'force-dynamic'

export default async function ContactPage() {
  const products = await getLiveCatalogProducts()
  const visibleProducts = products.filter((product) => product.publicVisible !== false)
  const supportItems = [
    {
      label: 'Email support',
      value: SITE_SETTINGS.institutionalEmail,
      note: 'Catalog questions, availability checks, documentation requests, and account support.',
      icon: Mail,
      href: `mailto:${SITE_SETTINGS.institutionalEmail}`,
    },
    {
      label: 'Live catalog',
      value: `${visibleProducts.length} active listings`,
      note: 'Product records are pulled from the shared live catalog data.',
      icon: PackageSearch,
    },
  ]

  return (
    <main className="storefront-blue-shell" style={{ minHeight: '100vh' }}>
      <section
        className="products-page-header-visual"
        style={{
          padding: 'calc(56px + var(--promo-banner-offset, 0px)) 0 30px',
          borderBottom: '1px solid var(--border)',
          position: 'relative',
        }}
      >
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(260px, 360px)', gap: '24px', alignItems: 'start' }}>
          <div>
            <div className="section-label" style={{ marginBottom: '12px' }}>Contact</div>
            <h1 style={{ fontSize: 'clamp(1.9rem, 3.4vw, 3rem)', lineHeight: 1.06, fontWeight: 900, margin: 0, color: '#FFFFFF', textWrap: 'balance' }}>
              Questions, documentation requests, and catalog support.
            </h1>
            <p style={{ fontSize: '15px', color: 'rgba(246,250,255,0.9)', maxWidth: '620px', lineHeight: 1.7, margin: '16px 0 0' }}>
              Send FlexMed the product name, strength, order number, or documentation request you need help with. Typical response time is 1–2 business days.
            </p>
          </div>
          <div className="card" style={{ padding: '16px', display: 'grid', gap: '10px' }}>
            <MessageSquareText size={26} color="#63c9d4" aria-hidden="true" />
            <strong style={{ color: '#FFFFFF' }}>Best message details</strong>
            <p style={{ margin: 0, color: 'rgba(246,250,255,0.84)', fontSize: '14px', lineHeight: 1.65 }}>
              Include product names, strengths, order numbers, or CoA details so the team can respond faster.
            </p>
          </div>
        </div>
      </section>

      <section className="catalog-shopping-section-visual" style={{ padding: '34px 0 72px', position: 'relative' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 0.85fr) minmax(320px, 1.15fr)', gap: '28px', alignItems: 'start' }}>
          <aside style={{ display: 'grid', gap: '14px' }}>
            {supportItems.map((item) => {
              const Icon = item.icon
              const content = (
                <article className="card" style={{ padding: '20px', display: 'grid', gap: '10px' }}>
                  <Icon size={22} color="#63c9d4" aria-hidden="true" />
                  <div>
                    <div className="section-label" style={{ marginBottom: '6px' }}>{item.label}</div>
                    <strong style={{ color: '#FFFFFF', fontSize: '16px' }}>{item.value}</strong>
                  </div>
                  <p style={{ margin: 0, color: 'rgba(246,250,255,0.84)', fontSize: '13px', lineHeight: 1.65 }}>{item.note}</p>
                </article>
              )
              return item.href ? (
                <a key={item.label} href={item.href} style={{ textDecoration: 'none' }}>{content}</a>
              ) : (
                <div key={item.label}>{content}</div>
              )
            })}
          </aside>

          <section>
            <div style={{ marginBottom: '16px' }}>
              <div className="section-label" style={{ marginBottom: '8px' }}>Send Message</div>
              <h2 style={{ margin: 0, color: '#FFFFFF', fontSize: '24px', fontWeight: 900 }}>Tell us what you need.</h2>
            </div>
            <InquiryForm />
          </section>
        </div>
      </section>
    </main>
  )
}
