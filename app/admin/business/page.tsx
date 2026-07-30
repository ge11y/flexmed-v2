'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { AdminShell } from '@/components/AdminShell'
import type { AdminSettingsPayload, BusinessDetailsSettings, BusinessPaymentMethodSettings, CheckoutOperationsSettings } from '@/lib/admin-settings'
import { buildManualPaymentLink } from '@/lib/manual-orders'

function inputStyle() {
  return {
    borderRadius: '12px',
    border: '1px solid var(--border)',
    background: 'var(--bg-card)',
    color: 'var(--text-primary)',
    padding: '12px 14px',
    fontSize: '14px',
    width: '100%',
    boxSizing: 'border-box' as const,
  }
}

function emptyBusinessDetails(): BusinessDetailsSettings {
  return {
    businessName: 'FlexMed Peptides, LLC',
    companyEmail: '',
    orderNotificationEmail: '',
    companyPhone: '',
    companyAddress: '',
    contactInfo: '',
    paymentMethods: [],
  }
}

type QrUploadState = {
  status: 'uploading' | 'saved' | 'error'
  message: string
  previewUrl?: string
}

export default function AdminBusinessPage() {
  const [settings, setSettings] = useState<AdminSettingsPayload | null>(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [qrUploadStates, setQrUploadStates] = useState<Record<string, QrUploadState>>({})

  async function loadSettings() {
    try {
      const response = await fetch('/api/admin/settings', { cache: 'no-store' })
      const result = (await response.json()) as { ok?: boolean; settings?: AdminSettingsPayload; error?: string }
      if (!response.ok || !result.ok || !result.settings) {
        setMessage(result.error || 'Business settings could not be loaded.')
        return
      }
      setSettings(result.settings)
    } catch {
      setMessage('Business settings could not be loaded.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadSettings()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [])

  function updateBusinessField<K extends keyof BusinessDetailsSettings>(key: K, value: BusinessDetailsSettings[K]) {
    setSettings((current) =>
      current
        ? {
            ...current,
            businessDetails: {
              ...current.businessDetails,
              [key]: value,
            },
          }
        : current,
    )
  }

  function updatePaymentMethod(method: BusinessPaymentMethodSettings['method'], patch: Partial<BusinessPaymentMethodSettings>) {
    setSettings((current) =>
      current
        ? {
            ...current,
            businessDetails: {
              ...current.businessDetails,
              paymentMethods: current.businessDetails.paymentMethods.map((entry) =>
                entry.method === method ? { ...entry, ...patch } : entry,
              ),
            },
          }
        : current,
    )
  }

  function updateCheckoutField<K extends keyof CheckoutOperationsSettings>(key: K, value: CheckoutOperationsSettings[K]) {
    setSettings((current) =>
      current
        ? {
            ...current,
            checkoutOperations: {
              ...current.checkoutOperations,
              [key]: value,
            },
          }
        : current,
    )
  }

  function autoBuildLink(method: BusinessPaymentMethodSettings) {
    updatePaymentMethod(method.method, { link: buildManualPaymentLink(method.method, method.destination) ?? '' })
  }

  async function uploadPaymentQr(method: BusinessPaymentMethodSettings['method'], file: File) {
    const previewUrl = URL.createObjectURL(file)
    setQrUploadStates((current) => ({
      ...current,
      [method]: { status: 'uploading', message: 'Uploading and saving...', previewUrl },
    }))
    const formData = new FormData()
    formData.set('file', file)
    try {
      const response = await fetch(`/api/admin/payment-qr/${method}`, { method: 'POST', body: formData })
      const raw = await response.text()
      let result: { ok?: boolean; imageUrl?: string; error?: string; detail?: string } = {}
      try {
        result = JSON.parse(raw) as typeof result
      } catch {
        result = { error: 'The server returned an invalid upload response.', detail: raw.slice(0, 180) }
      }
      if (!response.ok || !result.ok || !result.imageUrl) {
        setQrUploadStates((current) => ({
          ...current,
          [method]: { status: 'error', message: result.detail || result.error || 'Upload failed.', previewUrl },
        }))
        return
      }
      updatePaymentMethod(method, { qrImageUrl: result.imageUrl })
      setQrUploadStates((current) => ({
        ...current,
        [method]: { status: 'saved', message: 'Uploaded and saved.', previewUrl: result.imageUrl },
      }))
    } catch {
      setQrUploadStates((current) => ({
        ...current,
        [method]: { status: 'error', message: 'Upload failed. Check your connection and try again.', previewUrl },
      }))
    }
  }

  async function saveSettings() {
    if (!settings) return
    setSaving(true)
    setMessage('')
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessDetails: settings.businessDetails,
          checkoutOperations: settings.checkoutOperations,
        }),
      })
      const result = (await response.json()) as { ok?: boolean; settings?: AdminSettingsPayload; error?: string }
      if (!response.ok || !result.ok || !result.settings) {
        setMessage(result.error || 'Business settings could not be saved.')
        return
      }
      setSettings(result.settings)
      setMessage('Business details and shipping settings saved.')
    } catch {
      setMessage('Business settings could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  const businessDetails = settings?.businessDetails ?? emptyBusinessDetails()
  const checkoutOperations = settings?.checkoutOperations

  return (
    <AdminShell
      active="/admin/business"
      title="Business Details"
      description="Update customer-facing company contact details, payment destinations, and checkout shipping rules from one source of truth."
      purpose="Use this page before accepting orders so checkout, payment instructions, and shipping charges show the current business settings."
      workflow={[
        'Update company contact details customers may need.',
        'Edit payment handles for Cash App, Venmo, PayPal, Crypto, Zelle, or Other.',
        'Set the flat shipping rate, local free-shipping ZIPs, and per-order pickup workflow.',
        'Turn off any payment method that should not appear at checkout.',
        'Save changes before customers begin checking out.',
      ]}
      teamNotes={[
        'Payment destinations update the customer payment-instructions page.',
        'Cash App and Venmo links can be auto-built from the saved handle.',
        'Use Flat Rate for automatic checkout shipping; use the Orders tab pickup toggle for one-off local pickup orders.',
        'No Supabase schema update is needed because this uses app_settings JSON.',
      ]}
    >
      <style>{`
        .business-settings-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 12px;
        }

        .checkout-settings-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
        }

        .payment-method-grid {
          display: grid;
          grid-template-columns: minmax(150px, 0.8fr) minmax(180px, 1fr) minmax(180px, 1fr) minmax(180px, 1fr) 120px;
          gap: 12px;
          align-items: end;
        }

        @media (max-width: 980px) {
          .payment-method-grid {
            grid-template-columns: 1fr;
          }

          .checkout-settings-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div style={{ display: 'grid', gap: '18px' }}>
		        <div id="shipping-settings" className="card" style={{ padding: '18px', display: 'grid', gap: '16px', order: -1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <div className="section-label">Company Contact</div>
              <div style={{ color: 'var(--text-secondary)', marginTop: '6px' }}>
                These details are the admin-managed business profile for customer support and payment communication.
              </div>
            </div>
            <button type="button" className="fm-btn-primary" disabled={saving || loading || !settings} onClick={saveSettings}>
              {saving ? 'Saving...' : 'Save Business Details'}
            </button>
          </div>

          {loading ? <div style={{ color: 'var(--text-muted)' }}>Loading business details...</div> : null}
          {message ? <div style={{ color: 'var(--text-secondary)' }}>{message}</div> : null}

          <div className="business-settings-grid">
            <label style={{ display: 'grid', gap: '8px' }}>
              <span className="section-label">Business Name</span>
              <input value={businessDetails.businessName} onChange={(event) => updateBusinessField('businessName', event.target.value)} style={inputStyle()} />
            </label>
            <label style={{ display: 'grid', gap: '8px' }}>
              <span className="section-label">Company Email</span>
              <input value={businessDetails.companyEmail} onChange={(event) => updateBusinessField('companyEmail', event.target.value)} style={inputStyle()} placeholder="sales@flexmedpeptides.com" />
            </label>
            <label style={{ display: 'grid', gap: '8px' }}>
              <span className="section-label">Internal Order Notifications</span>
              <input
                type="email"
                value={businessDetails.orderNotificationEmail}
                onChange={(event) => updateBusinessField('orderNotificationEmail', event.target.value)}
                style={inputStyle()}
                placeholder="orders@flexmedpeptides.com"
              />
              <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                Order alerts are copied here. Customers still receive messages at the email used at checkout.
              </span>
            </label>
            <label style={{ display: 'grid', gap: '8px' }}>
              <span className="section-label">Company Phone</span>
              <input value={businessDetails.companyPhone} onChange={(event) => updateBusinessField('companyPhone', event.target.value)} style={inputStyle()} placeholder="Customer contact number" />
            </label>
          </div>

          <label style={{ display: 'grid', gap: '8px' }}>
            <span className="section-label">Company Address</span>
            <textarea
              value={businessDetails.companyAddress}
              onChange={(event) => updateBusinessField('companyAddress', event.target.value)}
              rows={3}
              style={{ ...inputStyle(), resize: 'vertical' as const }}
              placeholder="Business mailing address"
            />
          </label>

          <label style={{ display: 'grid', gap: '8px' }}>
            <span className="section-label">Contact Info / Customer Note</span>
            <textarea
              value={businessDetails.contactInfo}
              onChange={(event) => updateBusinessField('contactInfo', event.target.value)}
              rows={3}
              style={{ ...inputStyle(), resize: 'vertical' as const }}
              placeholder="Any support note or contact detail customers should see."
            />
          </label>
	        </div>

	        <div className="card" style={{ padding: '18px', display: 'grid', gap: '16px' }}>
	          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
	            <div>
		              <div className="section-label">Shipping Settings</div>
	              <div style={{ color: 'var(--text-secondary)', marginTop: '6px' }}>
	                Use Flat Rate for automatic customer checkout shipping. Local ZIPs can be free, and pickup can still be toggled off per order from the Orders tab.
	              </div>
	            </div>
	            <button type="button" className="fm-btn-primary" disabled={saving || loading || !settings} onClick={saveSettings}>
	              {saving ? 'Saving...' : 'Save Shipping Settings'}
	            </button>
	          </div>

		          {checkoutOperations ? (
	            <div className="checkout-settings-grid">
	              <label style={{ display: 'grid', gap: '8px' }}>
	                <span className="section-label">Shipping Mode</span>
	                <select
	                  value={checkoutOperations.shippingMode}
	                  onChange={(event) => updateCheckoutField('shippingMode', event.target.value as CheckoutOperationsSettings['shippingMode'])}
	                  style={inputStyle()}
	                >
	                  <option value="flat_rate">Flat Rate</option>
	                  <option value="manual_review">Manual Review / Shipping Off</option>
	                  <option value="tiered_placeholder">Tiered Placeholder</option>
	                </select>
	              </label>
	              <label style={{ display: 'grid', gap: '8px' }}>
	                <span className="section-label">Flat Rate</span>
	                <input
	                  value={checkoutOperations.flatRate}
	                  onChange={(event) => updateCheckoutField('flatRate', event.target.value)}
	                  placeholder="$12"
	                  style={inputStyle()}
	                />
	              </label>
	              <label style={{ display: 'grid', gap: '8px' }}>
	                <span className="section-label">Tax Mode</span>
	                <select
	                  value={checkoutOperations.taxMode}
	                  onChange={(event) => updateCheckoutField('taxMode', event.target.value as CheckoutOperationsSettings['taxMode'])}
	                  style={inputStyle()}
	                >
	                  <option value="not_charging">Not Charging</option>
	                  <option value="pending_review">Pending Review</option>
	                  <option value="collect_at_checkout">Collect at Checkout</option>
	                </select>
	              </label>
	              <label style={{ display: 'grid', gap: '8px' }}>
	                <span className="section-label">Free Shipping Threshold</span>
	                <input
	                  value={checkoutOperations.freeShippingThreshold}
	                  onChange={(event) => updateCheckoutField('freeShippingThreshold', event.target.value)}
	                  placeholder="$300"
	                  style={inputStyle()}
	                />
	              </label>
	              <label style={{ display: 'grid', gap: '8px' }}>
	                <span className="section-label">Tax Rate</span>
	                <input
	                  value={checkoutOperations.taxRate}
	                  onChange={(event) => updateCheckoutField('taxRate', event.target.value)}
	                  placeholder="8"
	                  style={inputStyle()}
	                />
	              </label>
	              <div style={{ display: 'grid', gap: '8px' }}>
	                <span className="section-label">Enabled Rules</span>
	                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '13px', minHeight: '46px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', padding: '12px 14px' }}>
	                  <input
	                    type="checkbox"
	                    checked={checkoutOperations.freeShippingEnabled}
	                    onChange={(event) => updateCheckoutField('freeShippingEnabled', event.target.checked)}
	                  />
	                  Threshold free shipping
	                </label>
	                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '13px', minHeight: '46px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', padding: '12px 14px' }}>
	                  <input
	                    type="checkbox"
	                    checked={checkoutOperations.localFreeShippingEnabled}
	                    onChange={(event) => updateCheckoutField('localFreeShippingEnabled', event.target.checked)}
	                  />
	                  Local free shipping
	                </label>
	              </div>
	              <label style={{ display: 'grid', gap: '8px' }}>
	                <span className="section-label">Store Home ZIP</span>
	                <input
	                  value={checkoutOperations.localFreeShippingHomeZip}
	                  onChange={(event) => updateCheckoutField('localFreeShippingHomeZip', event.target.value)}
	                  placeholder="35640"
	                  style={inputStyle()}
	                />
	              </label>
	              <label style={{ display: 'grid', gap: '8px' }}>
	                <span className="section-label">Local Radius Miles</span>
	                <input
	                  value={checkoutOperations.localFreeShippingRadiusMiles}
	                  onChange={(event) => updateCheckoutField('localFreeShippingRadiusMiles', event.target.value)}
	                  placeholder="35"
	                  style={inputStyle()}
	                />
	              </label>
	              <label style={{ display: 'grid', gap: '8px', gridColumn: '1 / -1' }}>
	                <span className="section-label">Free Local ZIPs / Ranges</span>
	                <input
	                  value={checkoutOperations.localFreeShippingZipCodes}
	                  onChange={(event) => updateCheckoutField('localFreeShippingZipCodes', event.target.value)}
	                  placeholder="35640, 35601, 35555-35558"
	                  style={inputStyle()}
	                />
	                <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
	                  Separate ZIPs with commas. Ranges like 35555-35558 are supported.
	                </span>
	              </label>
	              <label style={{ display: 'grid', gap: '8px', gridColumn: '1 / -1' }}>
	                <span className="section-label">Checkout Notes</span>
	                <textarea
	                  value={checkoutOperations.notes}
	                  onChange={(event) => updateCheckoutField('notes', event.target.value)}
	                  rows={2}
	                  style={{ ...inputStyle(), resize: 'vertical' as const }}
	                />
	              </label>
		            </div>
		          ) : (
		            <div style={{ color: 'var(--text-muted)' }}>
		              Loading shipping settings...
		            </div>
		          )}
		        </div>
	
	        <div className="card" style={{ padding: '18px', display: 'grid', gap: '16px' }}>
          <div>
            <div className="section-label">Payment Methods</div>
            <div style={{ color: 'var(--text-secondary)', marginTop: '6px' }}>
              Turn payment options on or off and keep customer-facing handles current.
            </div>
          </div>

          <div style={{ display: 'grid', gap: '14px' }}>
            {businessDetails.paymentMethods.map((method) => (
              <div key={method.method} className="card" style={{ padding: '16px', display: 'grid', gap: '12px' }}>
                <div className="payment-method-grid">
                  <label style={{ display: 'grid', gap: '8px' }}>
                    <span className="section-label">Label</span>
                    <input value={method.label} onChange={(event) => updatePaymentMethod(method.method, { label: event.target.value })} style={inputStyle()} />
                  </label>
                  <label style={{ display: 'grid', gap: '8px' }}>
                    <span className="section-label">Username / Destination</span>
                    <input
                      value={method.destination}
                      onChange={(event) => updatePaymentMethod(method.method, { destination: event.target.value })}
                      onBlur={() => autoBuildLink(method)}
                      style={inputStyle()}
                      placeholder="$cashapp, @venmo, email, wallet"
                    />
                  </label>
                  <label style={{ display: 'grid', gap: '8px' }}>
                    <span className="section-label">Open Link</span>
                    <input value={method.link} onChange={(event) => updatePaymentMethod(method.method, { link: event.target.value })} style={inputStyle()} placeholder="https://..." />
                  </label>
                  <label style={{ display: 'grid', gap: '8px' }}>
                    <span className="section-label">Upload QR Code</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(event) => {
                        const file = event.currentTarget.files?.[0]
                        event.currentTarget.value = ''
                        if (file) void uploadPaymentQr(method.method, file)
                      }}
                      style={{ ...inputStyle(), padding: '9px 10px' }}
                    />
                    {qrUploadStates[method.method] ? (
                      <div
                        role="status"
                        style={{
                          color: qrUploadStates[method.method].status === 'error' ? '#b42318' : qrUploadStates[method.method].status === 'saved' ? '#087443' : '#2457b8',
                          fontSize: '12px',
                          fontWeight: 700,
                        }}
                      >
                        {qrUploadStates[method.method].message}
                      </div>
                    ) : null}
                    {(qrUploadStates[method.method]?.previewUrl || method.qrImageUrl) ? (
                      <Image
                        src={qrUploadStates[method.method]?.previewUrl || method.qrImageUrl || ''}
                        alt={`${method.label} QR code preview`}
                        width={72}
                        height={72}
                        unoptimized
                        style={{ width: '72px', height: '72px', objectFit: 'contain', borderRadius: '8px', background: '#fff', padding: '4px' }}
                      />
                    ) : null}
                  </label>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)', minHeight: '46px' }}>
                    <input type="checkbox" checked={method.enabled} onChange={(event) => updatePaymentMethod(method.method, { enabled: event.target.checked })} />
                    Active
                  </label>
                </div>

                <label style={{ display: 'grid', gap: '8px' }}>
                  <span className="section-label">Customer Instruction</span>
                  <textarea
                    value={method.detail}
                    onChange={(event) => updatePaymentMethod(method.method, { detail: event.target.value })}
                    rows={2}
                    style={{ ...inputStyle(), resize: 'vertical' as const }}
                  />
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminShell>
  )
}
