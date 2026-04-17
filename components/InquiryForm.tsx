'use client'

export function InquiryForm() {
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
        const data = Object.fromEntries(new FormData(form))
        alert(`Inquiry submitted (demo): ${JSON.stringify(data, null, 2)}`)
      }}
    >
      <FormField label="Institutional Name *" required placeholder="[REQUIRED]" />
      <FormField label="Contact Name *" required placeholder="[REQUIRED]" />
      <FormField label="Institutional Email *" type="email" required placeholder="[REQUIRED]" />
      <FormField label="Phone (optional)" type="tel" placeholder="[OPTIONAL]" />

      <div>
        <div className="label" style={{ marginBottom: '8px', fontSize: '10px' }}>
          Research Application (optional)
        </div>
        <textarea
          name="researchApplication"
          placeholder="Brief description of your research application or project..."
          rows={3}
          style={textareaStyle}
        />
      </div>

      <div>
        <div className="label" style={{ marginBottom: '8px', fontSize: '10px' }}>
          Compounds of Interest
        </div>
        <textarea
          name="compounds"
          placeholder="e.g., CJC/Ipa 10mg, NAD+ 500mg..."
          rows={2}
          style={textareaStyle}
        />
      </div>

      <div>
        <div className="label" style={{ marginBottom: '8px', fontSize: '10px' }}>
          Approximate Quantity
        </div>
        <input
          name="quantity"
          type="text"
          placeholder="e.g., 10 vials per compound..."
          style={inputStyle}
        />
      </div>

      <button
        type="submit"
        className="btn btn-primary"
        style={{ justifyContent: 'center', padding: '14px', marginTop: '8px' }}
      >
        Submit Research Inquiry
      </button>

      <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.6 }}>
        By submitting this form you confirm that you are submitting from an institutional email address or on behalf of a recognized research institution.
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
