import Link from 'next/link'
import { FAQ_CATEGORIES, FAQ_ITEMS } from '@/lib/data-faq'

const STRAIGHT_ANSWERS = [
  {
    question: 'Are these products for human use?',
    answer:
      'No. Everything on FlexMed is sold for laboratory and research use only, not for human consumption. Customers must be 21 or older to purchase.',
  },
  {
    question: 'What is a CoA, and where do I find it?',
    answer:
      'A Certificate of Analysis is an outside lab test for a specific batch. When a product is verified, the CoA is linked directly on the product page and tied to the relevant lot or batch record.',
  },
  {
    question: 'How fast do orders ship?',
    answer:
      'FlexMed offers fast tracked domestic shipping. Orders over $200 qualify for free shipping; orders under that amount use the current flat-rate shipping option shown at checkout.',
  },
  {
    question: 'What does “CoA pending” mean?',
    answer:
      'It means the batch is still in testing. FlexMed does not fabricate documentation or placeholder results; the real certificate is posted once the batch clears testing.',
  },
]

export default function FaqPage() {
  return (
    <main className="storefront-blue-shell" style={{ minHeight: '100vh' }}>
      <style>{`
        .faq-straight-answer-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(260px, 1fr));
          gap: 14px;
        }

        @media (max-width: 720px) {
          .faq-straight-answer-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
      <section
        className="products-page-header-visual"
        style={{
          padding: 'calc(56px + var(--promo-banner-offset, 0px)) 0 30px',
          borderBottom: '1px solid var(--border)',
          position: 'relative',
        }}
      >
        <div
          className="container"
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(260px, 390px)',
            gap: '24px',
            alignItems: 'start',
          }}
        >
          <div>
            <div className="section-label" style={{ marginBottom: '12px' }}>FAQ</div>
            <h1 style={{ fontSize: 'clamp(1.9rem, 3.4vw, 3rem)', lineHeight: 1.06, fontWeight: 900, margin: 0, color: '#FFFFFF', textWrap: 'balance' }}>
              Answers for catalog, CoA, checkout, and research-use questions.
            </h1>
            <p style={{ fontSize: '15px', color: 'rgba(246,250,255,0.9)', maxWidth: '620px', lineHeight: 1.7, margin: '16px 0 0' }}>
              Use this page to understand how the FlexMed catalog is organized, how documentation is shown, and what customers should expect during ordering.
            </p>
          </div>
          <div className="card" style={{ padding: '16px', display: 'grid', gap: '10px' }}>
            <strong style={{ color: '#FFFFFF' }}>Quick links</strong>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {FAQ_CATEGORIES.map((category) => (
                <a key={category} className="badge badge-blue" href={`#${category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>
                  {category}
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="catalog-shopping-section-visual" style={{ padding: '34px 0 72px', position: 'relative' }}>
        <div className="container" style={{ display: 'grid', gap: '36px' }}>
          <section>
            <div className="section-label" style={{ marginBottom: '16px' }}>Straight answers</div>
            <div className="faq-straight-answer-grid">
              {STRAIGHT_ANSWERS.map((faq) => (
                <article key={faq.question} className="card" style={{ padding: '20px' }}>
                  <h2 style={{ margin: '0 0 10px', color: '#FFFFFF', fontSize: '17px', lineHeight: 1.35, fontWeight: 850 }}>{faq.question}</h2>
                  <p style={{ margin: 0, color: 'rgba(246,250,255,0.88)', fontSize: '14px', lineHeight: 1.7 }}>{faq.answer}</p>
                </article>
              ))}
            </div>
          </section>

          {FAQ_CATEGORIES.map((category) => {
            const items = FAQ_ITEMS.filter((faq) => faq.category === category).sort((a, b) => a.order - b.order)
            if (items.length === 0) return null
            return (
              <section key={category} id={category.toLowerCase().replace(/[^a-z0-9]+/g, '-')} style={{ scrollMarginTop: '120px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'end', flexWrap: 'wrap', marginBottom: '16px' }}>
                  <div>
                    <div className="section-label" style={{ marginBottom: '8px' }}>{category}</div>
                    <h2 style={{ margin: 0, color: '#FFFFFF', fontSize: '24px', fontWeight: 900 }}>{category} questions</h2>
                  </div>
                  <span style={{ color: 'rgba(218,230,248,0.78)', fontSize: '13px' }}>{items.length} answers</span>
                </div>
                <div style={{ display: 'grid', gap: '10px' }}>
                  {items.map((faq) => (
                    <article key={faq.id} className="card" style={{ padding: '18px 20px' }}>
                      <h3 style={{ margin: '0 0 8px', color: '#FFFFFF', fontSize: '16px', lineHeight: 1.35, fontWeight: 850 }}>{faq.question}</h3>
                      <p style={{ margin: 0, color: 'rgba(246,250,255,0.88)', fontSize: '14px', lineHeight: 1.72 }}>{faq.answer}</p>
                    </article>
                  ))}
                </div>
              </section>
            )
          })}

          <div className="card" style={{ padding: '22px', display: 'flex', justifyContent: 'space-between', gap: '18px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ margin: 0, color: '#FFFFFF', fontSize: '20px', fontWeight: 900 }}>Still need help?</h2>
              <p style={{ margin: '6px 0 0', color: 'rgba(246,250,255,0.84)', fontSize: '14px' }}>Send a catalog or documentation question directly to FlexMed.</p>
            </div>
            <Link className="fm-btn-primary" href="/contact">Contact FlexMed</Link>
          </div>
        </div>
      </section>
    </main>
  )
}
