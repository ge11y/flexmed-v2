'use client'

import { useState } from 'react'

export function InquiryForm() {
  const [status, setStatus] = useState<'idle' | 'sent'>('idle')

  return (
    <form
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px',
      }}
      onSubmit={(e) => {
        e.preventDefault()
        const form = e.currentTarget
        setStatus('sent')
        form.reset()
      }}
    >
      <FormField label="Research Organization or Lab *" required placeholder="Organization, lab, or account name" />
      <FormField label="Contact Name *" required placeholder="Your name" />
      <FormField label="Email *" type="email" required placeholder="name@example.com" />
      <FormField label="Phone (optional)" type="tel" placeholder="Best callback number" />

      <div>
        <div className="label" style={{ marginBottom: '8px', fontSize: '10px' }}>
          Research Context (optional)
        </div>
        <textarea
          name="researchApplication"
          placeholder="Brief description of the research context or documentation request..."
          rows={3}
          style={textareaStyle}
        />
      </div>

      <div>
        <div className="label" style={{ marginBottom: '8px', fontSize: '10px' }}>
          Catalog Items of Interest
        </div>
        <textarea
          name="peptides"
          placeholder="e.g., CJC/Ipa 10mg, NAD+ 500mg..."
          rows={2}
          style={textareaStyle}
        />
      </div>

      <div>
        <div className="label" style={{ marginBottom: '8px', fontSize: '10px' }}>
          Notes
        </div>
        <input
          name="quantity"
          type="text"
          placeholder="Anything you'd like FlexMed to know..."
          style={inputStyle}
        />
      </div>

      <button
        type="submit"
        className="btn btn-primary"
        style={{ justifyContent: 'center', padding: '14px', marginTop: '8px' }}
      >
        Send Message
      </button>

      {status === 'sent' ? (
        <div
          role="status"
          style={{
            borderRadius: '14px',
            border: '1px solid rgba(2, 122, 72, 0.18)',
          background: 'rgba(99, 201, 212, 0.12)',
          color: '#FFFFFF',
          padding: '12px 14px',
            fontSize: '13px',
            lineHeight: 1.6,
            textAlign: 'center',
          }}
        >
          Message received. FlexMed will follow up as soon as possible.
        </div>
      ) : null}

      <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.6 }}>
        By sending this form you confirm that your request relates to scientific or laboratory research use only.
      </p>
    </form>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-md)',
  padding: '10px 12px',
  fontFamily: 'var(--font-body)',
  fontSize: '13px',
  color: 'var(--text-secondary)',
  outline: 'none',
}

const textareaStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-md)',
  padding: '10px 12px',
  fontFamily: 'var(--font-body)',
  fontSize: '13px',
  color: 'var(--text-secondary)',
  resize: 'vertical',
  outline: 'none',
}

function FormField({
  label,
  type = 'text',
  required,
  placeholder,
}: {
  label: string
  type?: string
  required?: boolean
  placeholder: string
}) {
  return (
    <div>
      <div className="label" style={{ marginBottom: '8px', fontSize: '10px' }}>
        {label}
      </div>
      <input
        type={type}
        name={label.toLowerCase().replace(/[^a-z0-9]/g, '_')}
        placeholder={placeholder}
        required={required}
        style={inputStyle}
      />
    </div>
  )
}
