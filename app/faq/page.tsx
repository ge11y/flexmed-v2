'use client'

import { useState } from 'react'
import type { Metadata } from 'next'
import { FAQ_ITEMS, FAQ_CATEGORIES } from '@/lib/data-faq'

export default function FaqPage() {
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <div>
      {/* Hero */}
      <section style={{ padding: '64px 0 48px', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div className="section-label" style={{ marginBottom: '12px' }}>FAQ</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 400, marginBottom: '16px' }}>
            Frequently asked questions.
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)', maxWidth: '480px', lineHeight: 1.7 }}>
            Common questions about the FlexMed catalog, testing workflow, ordering process, and compliance standards.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="section">
        <div className="container">
          <div style={{ maxWidth: '720px' }}>
            {FAQ_CATEGORIES.map((category) => {
              const items = FAQ_ITEMS.filter((f) => f.category === category)
              if (items.length === 0) return null
              return (
                <div key={category} style={{ marginBottom: '48px' }}>
                  <div className="section-label" style={{ marginBottom: '20px' }}>{category}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {items.map((faq) => {
                      const isOpen = openId === faq.id
                      return (
                        <div
                          key={faq.id}
                          style={{
                            border: '1px solid',
                            borderColor: isOpen ? 'var(--border-hover)' : 'var(--border)',
                            borderRadius: 'var(--radius-md)',
                            overflow: 'hidden',
                            marginBottom: '4px',
                            background: isOpen ? 'var(--bg-card-hover)' : 'var(--bg-card)',
                            transition: 'all 0.2s',
                          }}
                        >
                          <button
                            onClick={() => setOpenId(isOpen ? null : faq.id)}
                            style={{
                              width: '100%',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '16px 20px',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              textAlign: 'left',
                              gap: '16px',
                            }}
                          >
                            <span
                              style={{
                                fontFamily: 'var(--font-body)',
                                fontSize: '14px',
                                fontWeight: 400,
                                color: isOpen ? 'var(--text-primary)' : 'var(--text-secondary)',
                                lineHeight: 1.4,
                              }}
                            >
                              {faq.question}
                            </span>
                            <span
                              style={{
                                fontSize: '16px',
                                color: 'var(--amber)',
                                flexShrink: 0,
                                transition: 'transform 0.2s',
                                transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                              }}
                            >
                              +
                            </span>
                          </button>
                          {isOpen && (
                            <div
                              style={{
                                padding: '0 20px 20px 20px',
                                borderTop: '1px solid var(--border)',
                                marginTop: '0',
                              }}
                            >
                              <p
                                style={{
                                  fontSize: '13px',
                                  color: 'var(--text-secondary)',
                                  lineHeight: 1.8,
                                  paddingTop: '16px',
                                  margin: 0,
                                }}
                              >
                                {faq.answer}
                              </p>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
