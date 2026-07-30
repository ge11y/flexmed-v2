'use client'

import { useEffect, useState } from 'react'
import { AdminShell } from '@/components/AdminShell'
import type { EmailAutomationSetting, EmailLogRecord, EmailSenderSettings } from '@/lib/email-admin'

type CampaignSummary = {
  id: string
  title: string
  subject: string
  status: string
  recipientCount: number
  sentCount: number
  failedCount: number
  createdAt: string
  sentAt: string | null
}

const CAMPAIGN_TEMPLATES = {
  percentage: {
    title: 'Limited-time sale',
    subject: 'A special FlexMed offer is live',
    body: 'A limited-time offer is now available.\n\n{{PROMO_DETAILS}}\n\nShop while the promotion is active: {{STORE_LINK}}\n\nThank you,\nFlexMed',
  },
  bogo: {
    title: 'Buy one, get one promotion',
    subject: 'Buy one, get one from FlexMed',
    body: 'A buy-one, get-one promotion is now available for a limited time.\n\n{{PROMO_DETAILS}}\n\nView the offer: {{STORE_LINK}}\n\nThank you,\nFlexMed',
  },
  announcement: {
    title: 'New promotion announcement',
    subject: 'New FlexMed promotion announcement',
    body: 'We have a new promotion to share with you.\n\n{{PROMO_DETAILS}}\n\nBrowse the current catalog: {{STORE_LINK}}\n\nThank you,\nFlexMed',
  },
} as const

export default function AdminEmailsPage() {
  const [settings, setSettings] = useState<EmailAutomationSetting[]>([])
  const [logs, setLogs] = useState<EmailLogRecord[]>([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sourceStatus, setSourceStatus] = useState('ok')
  const [senderSettings, setSenderSettings] = useState<EmailSenderSettings>({
    id: 'primary',
    businessName: 'FlexMed',
    senderName: 'FlexMed',
    senderEmail: '',
    replyToEmail: '',
    providerLabel: 'Resend',
  })
  const [testRecipient, setTestRecipient] = useState('')
  const [sendingTestKey, setSendingTestKey] = useState<string | null>(null)
  const [subscriberCount, setSubscriberCount] = useState(0)
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([])
  const [campaignTitle, setCampaignTitle] = useState('')
  const [campaignSubject, setCampaignSubject] = useState('')
  const [campaignBody, setCampaignBody] = useState('')
  const [campaignRecipient, setCampaignRecipient] = useState('')
  const [campaignAction, setCampaignAction] = useState<'test' | 'send' | null>(null)

  function applyCampaignTemplate(key: keyof typeof CAMPAIGN_TEMPLATES) {
    const template = CAMPAIGN_TEMPLATES[key]
    setCampaignTitle(template.title)
    setCampaignSubject(template.subject)
    setCampaignBody(template.body.replaceAll('{{STORE_LINK}}', 'https://flexmedpeptides.com/products'))
  }

  async function load() {
    try {
      const response = await fetch('/api/admin/emails', { cache: 'no-store' })
      const result = (await response.json()) as {
        ok: boolean
        settings?: EmailAutomationSetting[]
        logs?: EmailLogRecord[]
        senderSettings?: EmailSenderSettings
        sourceStatus?: string
        error?: string | null
      }

      if (response.ok && result.ok) {
        setSettings(result.settings ?? [])
        setLogs(result.logs ?? [])
        if (result.senderSettings) setSenderSettings(result.senderSettings)
        setSourceStatus(result.sourceStatus ?? 'ok')
        setMessage(result.error ?? '')
      } else {
        setMessage('Email settings could not be loaded.')
      }

      const campaignResponse = await fetch('/api/admin/campaigns', { cache: 'no-store' })
      const campaignResult = (await campaignResponse.json()) as {
        ok?: boolean
        subscriberCount?: number
        campaigns?: CampaignSummary[]
        error?: string
        setupRequired?: boolean
      }
      if (campaignResponse.ok && campaignResult.ok) {
        setSubscriberCount(campaignResult.subscriberCount ?? 0)
        setCampaigns(campaignResult.campaigns ?? [])
      } else if (campaignResult.setupRequired) {
        setMessage('Run docs/supabase-email-campaigns.sql in Supabase to enable promo email campaigns.')
      }
    } catch {
      setMessage('Email settings could not be loaded.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [])

  function updateSetting(key: string, patch: Partial<EmailAutomationSetting>) {
    setSettings((current) => current.map((setting) => (setting.key === key ? { ...setting, ...patch } : setting)))
  }

  async function saveSettings() {
    setSaving(true)
    setMessage('')
    try {
      const response = await fetch('/api/admin/emails', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings, senderSettings }),
      })
      const result = (await response.json()) as { ok?: boolean; error?: string }
      if (!response.ok || !result.ok) {
        setMessage(result.error || 'Email settings could not be saved.')
        return
      }
      setMessage('Email settings saved.')
      await load()
    } catch {
      setMessage('Email settings could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  async function sendTestEmail(key: string) {
    if (!testRecipient.trim()) {
      setMessage('Enter a test email address first.')
      return
    }

    setSendingTestKey(key)
    setMessage('')
    try {
      const response = await fetch('/api/admin/emails/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: testRecipient.trim(), key }),
      })
      const result = (await response.json()) as { ok?: boolean; error?: string }
      if (!response.ok || !result.ok) {
        setMessage(result.error || 'Test email could not be sent.')
        return
      }
      setMessage(`Test email sent to ${testRecipient.trim()}.`)
      await load()
    } catch {
      setMessage('Test email could not be sent.')
    } finally {
      setSendingTestKey(null)
    }
  }

  async function sendCampaign(testOnly: boolean) {
    if (!campaignSubject.trim() || !campaignBody.trim()) {
      setMessage('Add a campaign subject and message first.')
      return
    }
    if (testOnly && !campaignRecipient.trim()) {
      setMessage('Enter an opted-in test recipient first.')
      return
    }
    if (!testOnly && !window.confirm(`Send this campaign to ${subscriberCount} opted-in subscriber${subscriberCount === 1 ? '' : 's'}?`)) return

    setCampaignAction(testOnly ? 'test' : 'send')
    setMessage('')
    try {
      const response = await fetch('/api/admin/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: campaignTitle,
          subject: campaignSubject,
          bodyText: campaignBody,
          testRecipient: testOnly ? campaignRecipient : undefined,
        }),
      })
      const result = (await response.json()) as { ok?: boolean; sentCount?: number; failedCount?: number; error?: string }
      if (!response.ok || !result.ok) {
        setMessage(result.error || 'Campaign email could not be sent.')
        return
      }
      setMessage(testOnly ? `Test campaign sent to ${campaignRecipient.trim()}.` : `Campaign sent to ${result.sentCount ?? 0} opted-in subscribers.`)
      await load()
    } catch {
      setMessage('Campaign email could not be sent.')
    } finally {
      setCampaignAction(null)
    }
  }

  return (
    <AdminShell
      active="/admin/emails"
      title="Email Automations"
      description="Control order emails here so founder can manage the customer communication flow from the dashboard."
      purpose="Use this page to control which customer emails are active, review the wording, and monitor recent sends."
      workflow={[
        'Review each automation and turn off anything that should not send yet.',
        'Edit the subject and body for the customer-facing emails.',
        'Save changes before the team starts working orders.',
        'Use the recent send log to confirm what has already gone out.',
      ]}
      teamNotes={[
        'Business email setup still depends on Resend env configuration.',
        'This page controls wording and on/off state; it does not replace domain verification.',
        'Recent sends are logged so founder can see what customers already received.',
      ]}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(320px, 1fr)', gap: '18px' }}>
        <div className="card" style={{ padding: '18px', display: 'grid', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <div className="section-label">Automations</div>
              <div style={{ color: 'var(--text-secondary)', marginTop: '6px' }}>
                Customer emails send from these templates when the order workflow changes.
              </div>
            </div>
            <button type="button" className="fm-btn-primary" disabled={saving} onClick={saveSettings}>
              {saving ? 'Saving...' : 'Save Email Settings'}
            </button>
          </div>

          <div className="card" style={{ padding: '14px', display: 'grid', gap: '10px' }}>
            <div className="section-label">Send Test Email</div>
            <div style={{ color: 'var(--text-secondary)' }}>Use this to preview the live email templates once Resend is connected.</div>
            <input
              value={testRecipient}
              onChange={(event) => setTestRecipient(event.target.value)}
              placeholder="founder@flexmed.com"
              style={{
                borderRadius: '12px',
                border: '1px solid var(--border)',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                padding: '12px 14px',
                fontSize: '14px',
              }}
            />
          </div>

          <div className="card" style={{ padding: '14px', display: 'grid', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <div className="section-label">Promo Email Campaigns</div>
                <div style={{ color: 'var(--text-secondary)', marginTop: '6px' }}>
                  Send only to customers who explicitly opted in. Saving a promo never sends an email automatically.
                </div>
              </div>
              <strong style={{ color: 'var(--accent-500)' }}>{subscriberCount} opted in</strong>
            </div>
            <select
              defaultValue=""
              onChange={(event) => {
                if (event.target.value) applyCampaignTemplate(event.target.value as keyof typeof CAMPAIGN_TEMPLATES)
                event.currentTarget.value = ''
              }}
              style={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '12px 14px', fontSize: '14px' }}
            >
              <option value="">Choose a campaign template</option>
              <option value="percentage">Limited-time percentage sale</option>
              <option value="bogo">Buy one, get one promotion</option>
              <option value="announcement">General promotion announcement</option>
            </select>
            <input value={campaignTitle} onChange={(event) => setCampaignTitle(event.target.value)} placeholder="Campaign name" style={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '12px 14px', fontSize: '14px' }} />
            <input value={campaignSubject} onChange={(event) => setCampaignSubject(event.target.value)} placeholder="Email subject" style={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '12px 14px', fontSize: '14px' }} />
            <textarea value={campaignBody} onChange={(event) => setCampaignBody(event.target.value)} rows={8} placeholder="Write the customer-facing promotion message..." style={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '12px 14px', fontSize: '14px', resize: 'vertical' }} />
            <input value={campaignRecipient} onChange={(event) => setCampaignRecipient(event.target.value)} placeholder="Opted-in test recipient email" type="email" style={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '12px 14px', fontSize: '14px' }} />
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button type="button" className="fm-btn-outline" onClick={() => sendCampaign(true)} disabled={campaignAction !== null}>{campaignAction === 'test' ? 'Sending...' : 'Send Test Campaign'}</button>
              <button type="button" className="fm-btn-primary" onClick={() => sendCampaign(false)} disabled={campaignAction !== null || subscriberCount === 0}>{campaignAction === 'send' ? 'Sending...' : 'Send to Opted-In Customers'}</button>
            </div>
            {campaigns.length > 0 ? (
              <div style={{ display: 'grid', gap: '8px' }}>
                <div className="section-label">Campaign History</div>
                {campaigns.slice(0, 5).map((campaign) => (
                  <div key={campaign.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', color: 'var(--text-secondary)', fontSize: '13px' }}>
                    <span>{campaign.title || campaign.subject}</span>
                    <span>{campaign.status} · {campaign.sentCount}/{campaign.recipientCount} sent</span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="card" style={{ padding: '14px', display: 'grid', gap: '12px' }}>
            <div className="section-label">Business Sender Settings</div>
            <div style={{ color: 'var(--text-secondary)' }}>
              Save the sender details founder wants to use so email setup is ready once Resend is connected.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              <input
                value={senderSettings.businessName}
                onChange={(event) => setSenderSettings((current) => ({ ...current, businessName: event.target.value }))}
                placeholder="Business name"
                style={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '12px 14px', fontSize: '14px' }}
              />
              <input
                value={senderSettings.senderName}
                onChange={(event) => setSenderSettings((current) => ({ ...current, senderName: event.target.value }))}
                placeholder="Sender name"
                style={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '12px 14px', fontSize: '14px' }}
              />
              <input
                value={senderSettings.senderEmail}
                onChange={(event) => setSenderSettings((current) => ({ ...current, senderEmail: event.target.value }))}
                placeholder="sender@yourdomain.com"
                style={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '12px 14px', fontSize: '14px' }}
              />
              <input
                value={senderSettings.replyToEmail}
                onChange={(event) => setSenderSettings((current) => ({ ...current, replyToEmail: event.target.value }))}
                placeholder="replyto@yourdomain.com"
                style={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '12px 14px', fontSize: '14px' }}
              />
            </div>
          </div>

          {loading ? <div style={{ color: 'var(--text-muted)' }}>Loading email settings…</div> : null}
          {message ? <div style={{ color: 'var(--text-secondary)' }}>{message}</div> : null}
          {sourceStatus !== 'ok' ? (
            <div style={{ color: '#b54708', background: 'rgba(181,71,8,0.08)', border: '1px solid rgba(181,71,8,0.18)', borderRadius: '14px', padding: '12px 14px' }}>
              The email settings table may still need the latest schema update. Founder can still finish the setup after rerunning the schema.
            </div>
          ) : null}

          <div style={{ display: 'grid', gap: '16px' }}>
            {settings.map((setting) => (
              <div key={setting.key} className="card" style={{ padding: '18px', display: 'grid', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div>
                    <div className="section-label">{setting.label}</div>
                    <div style={{ color: 'var(--text-secondary)', marginTop: '6px' }}>{setting.description}</div>
                  </div>
                  <label style={{ display: 'inline-flex', gap: '10px', alignItems: 'center', color: 'var(--text-secondary)' }}>
                    <input type="checkbox" checked={setting.isEnabled} onChange={(event) => updateSetting(setting.key, { isEnabled: event.target.checked })} />
                    Active
                  </label>
                </div>

                <input
                  value={setting.subject}
                  onChange={(event) => updateSetting(setting.key, { subject: event.target.value })}
                  style={{
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    padding: '12px 14px',
                    fontSize: '14px',
                  }}
                />
                <textarea
                  value={setting.bodyText}
                  onChange={(event) => updateSetting(setting.key, { bodyText: event.target.value })}
                  rows={10}
                  style={{
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    padding: '12px 14px',
                    fontSize: '14px',
                    resize: 'vertical',
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="fm-btn-outline"
                    onClick={() => sendTestEmail(setting.key)}
                    disabled={sendingTestKey === setting.key}
                  >
                    {sendingTestKey === setting.key ? 'Sending Test...' : 'Send Test'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: '18px', display: 'grid', gap: '16px', alignSelf: 'start' }}>
          <div>
            <div className="section-label">Recent Email Activity</div>
            <div style={{ color: 'var(--text-secondary)', marginTop: '6px' }}>
              This log shows recent customer emails sent from the order workflow.
            </div>
          </div>

          <div style={{ display: 'grid', gap: '10px' }}>
            <div className="card" style={{ padding: '14px', display: 'grid', gap: '6px' }}>
              <div className="section-label">Provider Status</div>
              <div style={{ color: 'var(--text-secondary)' }}>{senderSettings.providerLabel}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                Actual sending still depends on `RESEND_API_KEY` and `EMAIL_FROM` being set in Vercel.
              </div>
            </div>
            {logs.length === 0 ? (
              <div style={{ color: 'var(--text-muted)' }}>No email sends logged yet.</div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="card" style={{ padding: '14px', display: 'grid', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                    <strong style={{ color: 'var(--text-primary)' }}>{log.messageType.replaceAll('_', ' ')}</strong>
                    <span style={{ color: log.status === 'sent' ? '#027a48' : '#b42318', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{log.status}</span>
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Order: {log.orderId ?? 'n/a'}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{new Date(log.createdAt).toLocaleString()}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AdminShell>
  )
}
