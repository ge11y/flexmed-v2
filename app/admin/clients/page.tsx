'use client'

import { useEffect, useMemo, useState } from 'react'
import { AdminShell } from '@/components/AdminShell'
import { formatCurrency } from '@/lib/cart'
import { getManualOrderStatusLabel, type ManualOrderStatus } from '@/lib/manual-orders'

type ClientAddress = {
  address1: string
  address2?: string
  city: string
  state: string
  postalCode: string
  country: string
}

type ClientRecord = {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string
  createdAt: string
  latestShippingAddress: ClientAddress | null
  latestBillingAddress: ClientAddress | null
  orderCount: number
  completedCount: number
  pendingCount: number
  totalSpent: number
  latestOrderAt: string | null
  lastStatus: ManualOrderStatus | null
  orders: Array<{
    id: string
    createdAt: string
    status: ManualOrderStatus
    total: number
    itemCount: number
  }>
}

type ClientEditForm = {
  firstName: string
  lastName: string
  phone: string
  shippingAddress: ClientAddress
  billingAddress: ClientAddress
}

const blankAddress: ClientAddress = {
  address1: '',
  address2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'US',
}

function addressFrom(address: ClientAddress | null): ClientAddress {
  return {
    ...blankAddress,
    ...(address ?? {}),
  }
}

function adminInputStyle(): React.CSSProperties {
  return {
    width: '100%',
    borderRadius: '12px',
    border: '1px solid var(--border)',
    background: 'var(--bg-card)',
    color: 'var(--text-primary)',
    padding: '10px 12px',
    fontSize: '13px',
    boxSizing: 'border-box',
  }
}

export default function AdminClientsPage() {
  const [clients, setClients] = useState<ClientRecord[]>([])
  const [openClientId, setOpenClientId] = useState<string | null>(null)
  const [editingClientId, setEditingClientId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<ClientEditForm | null>(null)
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [removingClientId, setRemovingClientId] = useState<string | null>(null)
  const [savingClientId, setSavingClientId] = useState<string | null>(null)

  function formatAddress(
    address: ClientRecord['latestShippingAddress'] | ClientRecord['latestBillingAddress'],
  ) {
    if (!address) return 'No saved address yet.'
    return [address.address1, address.address2, `${address.city}, ${address.state} ${address.postalCode}`, address.country]
      .filter(Boolean)
      .join('\n')
  }

  useEffect(() => {
    let isMounted = true

    async function loadClients() {
      setLoading(true)
      setError('')

      try {
        const response = await fetch('/api/admin/clients', { cache: 'no-store' })
        const result = (await response.json()) as { ok: boolean; error?: string; clients?: ClientRecord[] }

        if (!response.ok || !result.ok) {
          throw new Error(result.error || 'The CRM client list could not be loaded.')
        }

        if (isMounted) {
          setClients(result.clients ?? [])
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : 'The CRM client list could not be loaded.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    void loadClients()

    return () => {
      isMounted = false
    }
  }, [])

  async function removeClient(client: ClientRecord) {
    const displayName = [client.firstName, client.lastName].filter(Boolean).join(' ') || client.email
    const confirmed = window.confirm(
      `Remove ${displayName} from the client list?\n\nThis will remove the client account and any linked order records from the admin CRM.`,
    )

    if (!confirmed) return

    setRemovingClientId(client.id)
    setError('')

    try {
      const response = await fetch('/api/admin/clients', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: client.id, email: client.email }),
      })
      const result = (await response.json()) as { ok: boolean; error?: string; detail?: string }

      if (!response.ok || !result.ok) {
        throw new Error(result.error || result.detail || 'The client could not be removed.')
      }

      setClients((current) => current.filter((item) => item.id !== client.id))
      setOpenClientId((current) => (current === client.id ? null : current))
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : 'The client could not be removed.')
    } finally {
      setRemovingClientId(null)
    }
  }

  function startEditingClient(client: ClientRecord) {
    setEditingClientId(client.id)
    setOpenClientId(client.id)
    setMessage('')
    setError('')
    setEditForm({
      firstName: client.firstName,
      lastName: client.lastName,
      phone: client.phone,
      shippingAddress: addressFrom(client.latestShippingAddress),
      billingAddress: addressFrom(client.latestBillingAddress),
    })
  }

  function updateEdit<K extends keyof ClientEditForm>(key: K, value: ClientEditForm[K]) {
    setEditForm((current) => (current ? { ...current, [key]: value } : current))
  }

  function updateEditAddress(type: 'shippingAddress' | 'billingAddress', key: keyof ClientAddress, value: string) {
    setEditForm((current) =>
      current
        ? {
            ...current,
            [type]: {
              ...current[type],
              [key]: value,
            },
          }
        : current,
    )
  }

  async function saveClientEdit(client: ClientRecord) {
    if (!editForm) return
    setSavingClientId(client.id)
    setError('')
    setMessage('')

    try {
      const response = await fetch('/api/admin/clients', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: client.id,
          email: client.email,
          ...editForm,
        }),
      })
      const result = (await response.json()) as { ok: boolean; error?: string; detail?: string }
      if (!response.ok || !result.ok) {
        throw new Error(result.detail || result.error || 'The client could not be updated.')
      }

      setClients((current) =>
        current.map((item) =>
          item.id === client.id
            ? {
                ...item,
                firstName: editForm.firstName,
                lastName: editForm.lastName,
                phone: editForm.phone,
                latestShippingAddress: editForm.shippingAddress,
                latestBillingAddress: editForm.billingAddress,
              }
            : item,
        ),
      )
      setEditingClientId(null)
      setEditForm(null)
      setMessage('Client details saved.')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'The client could not be updated.')
    } finally {
      setSavingClientId(null)
    }
  }

  const filteredClients = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return clients
    return clients.filter((client) =>
      [client.firstName, client.lastName, client.email, client.phone].some((value) =>
        value.toLowerCase().includes(normalized),
      ),
    )
  }, [clients, query])

  const totals = useMemo(() => {
    return filteredClients.reduce(
      (summary, client) => {
        summary.orderCount += client.orderCount
        summary.revenue += client.totalSpent
        summary.pending += client.pendingCount
        return summary
      },
      { orderCount: 0, revenue: 0, pending: 0 },
    )
  }, [filteredClients])

  return (
    <AdminShell
      active="/admin/clients"
      title="Clients"
      description="Customer accounts, order history, and relationship details live here so founder and staff can track repeat buyers and follow up cleanly."
      purpose="This page is the CRM view for customer accounts. Use it to understand who is ordering, how often they order, and which clients still have active order activity."
      workflow={[
        'Search for the customer by name, email, or phone.',
        'Open the client card to review account details and order history.',
        'Check pending versus completed orders before replying or fulfilling anything new.',
      ]}
      teamNotes={[
        'This is the best place to understand a customer before handling support or fulfillment questions.',
        'Repeat buyers and open orders are visible at a glance, so use this before digging through individual orders.',
        'Once notes are added in a later pass, this page will become the central customer relationship view.',
      ]}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
        {[
          ['Accounts', String(filteredClients.length)],
          ['Orders', String(totals.orderCount)],
          ['Pending', String(totals.pending)],
          ['Revenue', formatCurrency(totals.revenue)],
        ].map(([label, value]) => (
          <div key={label} className="card" style={{ padding: '18px', display: 'grid', gap: '8px' }}>
            <div className="section-label">{label}</div>
            <div style={{ fontSize: '28px', fontWeight: 600 }}>{value}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: '18px', display: 'grid', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'grid', gap: '6px' }}>
            <div className="section-label">Customer Search</div>
            <div style={{ color: 'var(--text-secondary)' }}>Search by name, email, or phone.</div>
          </div>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search clients"
            style={{
              minWidth: '280px',
              borderRadius: '14px',
              border: '1px solid var(--border)',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              padding: '12px 14px',
              fontSize: '14px',
            }}
          />
        </div>

        {error ? (
          <div style={{ color: '#b42318', background: '#fef3f2', border: '1px solid #fecdca', borderRadius: '14px', padding: '14px 16px' }}>
            {error}
          </div>
        ) : null}
        {message ? (
          <div style={{ color: '#027a48', background: 'rgba(2, 122, 72, 0.1)', border: '1px solid rgba(2, 122, 72, 0.18)', borderRadius: '14px', padding: '14px 16px' }}>
            {message}
          </div>
        ) : null}

        {loading ? (
          <div style={{ color: 'var(--text-secondary)' }}>Loading customer CRM…</div>
        ) : filteredClients.length === 0 ? (
          <div style={{ color: 'var(--text-secondary)' }}>No client accounts found yet.</div>
        ) : (
          <div style={{ display: 'grid', gap: '14px' }}>
            {filteredClients.map((client) => {
              const isOpen = openClientId === client.id
              const displayName = [client.firstName, client.lastName].filter(Boolean).join(' ') || client.email

              return (
                <div key={client.id} className="card" style={{ padding: '18px', display: 'grid', gap: '14px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2.1fr) repeat(4, minmax(0, 1fr)) auto', gap: '14px', alignItems: 'center' }}>
                    <div style={{ display: 'grid', gap: '6px' }}>
                      <div style={{ fontSize: '18px', fontWeight: 600 }}>{displayName}</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{client.email}</div>
                      {client.phone ? <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{client.phone}</div> : null}
                    </div>
                    <div>
                      <div className="section-label">Orders</div>
                      <div style={{ fontSize: '18px', fontWeight: 600 }}>{client.orderCount}</div>
                    </div>
                    <div>
                      <div className="section-label">Completed</div>
                      <div style={{ fontSize: '18px', fontWeight: 600 }}>{client.completedCount}</div>
                    </div>
                    <div>
                      <div className="section-label">Pending</div>
                      <div style={{ fontSize: '18px', fontWeight: 600 }}>{client.pendingCount}</div>
                    </div>
                    <div>
                      <div className="section-label">Spent</div>
                      <div style={{ fontSize: '18px', fontWeight: 600 }}>{formatCurrency(client.totalSpent)}</div>
                    </div>
                    <button
                      type="button"
                      className="fm-btn-outline"
                      onClick={() => setOpenClientId(isOpen ? null : client.id)}
                    >
                      {isOpen ? 'Close Client' : 'Open Client'}
                    </button>
                  </div>

                  {isOpen ? (
                    <div style={{ display: 'grid', gap: '16px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="fm-btn-outline"
                          onClick={() => startEditingClient(client)}
                        >
                          Edit Client
                        </button>
                        <button
                          type="button"
                          className="fm-btn-outline"
                          onClick={() => removeClient(client)}
                          disabled={removingClientId === client.id}
                          style={{
                            borderColor: 'rgba(217, 45, 32, 0.25)',
                            color: '#b42318',
                            opacity: removingClientId === client.id ? 0.7 : 1,
                          }}
                        >
                          {removingClientId === client.id ? 'Removing Client...' : 'Remove Client'}
                        </button>
                      </div>

                      {editingClientId === client.id && editForm ? (
                        <div style={{ borderRadius: '16px', border: '1px solid rgba(42,79,174,0.24)', background: 'rgba(42,79,174,0.06)', padding: '16px', display: 'grid', gap: '16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <div>
                              <div className="section-label">Edit Client Details</div>
                              <div style={{ marginTop: '6px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                                Updates the customer profile and linked order contact/address details.
                              </div>
                            </div>
                            <button
                              type="button"
                              className="fm-btn-outline"
                              onClick={() => {
                                setEditingClientId(null)
                                setEditForm(null)
                              }}
                            >
                              Cancel
                            </button>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px' }}>
                            <label style={{ display: 'grid', gap: '7px' }}>
                              <span className="section-label">First Name</span>
                              <input value={editForm.firstName} onChange={(event) => updateEdit('firstName', event.target.value)} style={adminInputStyle()} />
                            </label>
                            <label style={{ display: 'grid', gap: '7px' }}>
                              <span className="section-label">Last Name</span>
                              <input value={editForm.lastName} onChange={(event) => updateEdit('lastName', event.target.value)} style={adminInputStyle()} />
                            </label>
                            <label style={{ display: 'grid', gap: '7px' }}>
                              <span className="section-label">Phone</span>
                              <input value={editForm.phone} onChange={(event) => updateEdit('phone', event.target.value)} style={adminInputStyle()} />
                            </label>
                          </div>

                          <AdminAddressEditor
                            title="Shipping Address"
                            address={editForm.shippingAddress}
                            onChange={(key, value) => updateEditAddress('shippingAddress', key, value)}
                          />
                          <AdminAddressEditor
                            title="Billing Address"
                            address={editForm.billingAddress}
                            onChange={(key, value) => updateEditAddress('billingAddress', key, value)}
                          />

                          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              className="fm-btn-primary"
                              onClick={() => saveClientEdit(client)}
                              disabled={savingClientId === client.id}
                              style={{ opacity: savingClientId === client.id ? 0.7 : 1 }}
                            >
                              {savingClientId === client.id ? 'Saving Client...' : 'Save Client'}
                            </button>
                          </div>
                        </div>
                      ) : null}

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '12px' }}>
                        <div style={{ borderRadius: '14px', border: '1px solid var(--border)', background: 'var(--bg-elevated)', padding: '14px' }}>
                          <div className="section-label">Joined</div>
                          <div style={{ marginTop: '8px' }}>{new Date(client.createdAt).toLocaleDateString()}</div>
                        </div>
                        <div style={{ borderRadius: '14px', border: '1px solid var(--border)', background: 'var(--bg-elevated)', padding: '14px' }}>
                          <div className="section-label">Latest Order</div>
                          <div style={{ marginTop: '8px' }}>{client.latestOrderAt ? new Date(client.latestOrderAt).toLocaleDateString() : '—'}</div>
                        </div>
                        <div style={{ borderRadius: '14px', border: '1px solid var(--border)', background: 'var(--bg-elevated)', padding: '14px' }}>
                          <div className="section-label">Latest Status</div>
                          <div style={{ marginTop: '8px' }}>{client.lastStatus ? getManualOrderStatusLabel(client.lastStatus) : '—'}</div>
                        </div>
                        <div style={{ borderRadius: '14px', border: '1px solid var(--border)', background: 'var(--bg-elevated)', padding: '14px' }}>
                          <div className="section-label">Customer Type</div>
                          <div style={{ marginTop: '8px' }}>{client.orderCount > 1 ? 'Repeat Buyer' : 'New Buyer'}</div>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '12px' }}>
                        <div style={{ borderRadius: '14px', border: '1px solid var(--border)', background: 'var(--bg-elevated)', padding: '14px', display: 'grid', gap: '8px' }}>
                          <div className="section-label">Latest Shipping Info</div>
                          <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                            {client.phone || 'No phone saved'}
                          </div>
                          <pre
                            style={{
                              margin: 0,
                              whiteSpace: 'pre-wrap',
                              fontFamily: 'var(--font-body)',
                              fontSize: '14px',
                              lineHeight: 1.6,
                              color: 'var(--text-primary)',
                            }}
                          >
                            {formatAddress(client.latestShippingAddress)}
                          </pre>
                        </div>
                        <div style={{ borderRadius: '14px', border: '1px solid var(--border)', background: 'var(--bg-elevated)', padding: '14px', display: 'grid', gap: '8px' }}>
                          <div className="section-label">Latest Billing Info</div>
                          <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                            {client.email}
                          </div>
                          <pre
                            style={{
                              margin: 0,
                              whiteSpace: 'pre-wrap',
                              fontFamily: 'var(--font-body)',
                              fontSize: '14px',
                              lineHeight: 1.6,
                              color: 'var(--text-primary)',
                            }}
                          >
                            {formatAddress(client.latestBillingAddress)}
                          </pre>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gap: '10px' }}>
                        <div className="section-label">Order History</div>
                        {client.orders.length === 0 ? (
                          <div style={{ color: 'var(--text-secondary)' }}>No orders placed yet.</div>
                        ) : (
                          <div style={{ display: 'grid', gap: '10px' }}>
                            {client.orders.map((order) => (
                              <div
                                key={order.id}
                                style={{
                                  borderRadius: '14px',
                                  border: '1px solid var(--border)',
                                  background: 'var(--bg-elevated)',
                                  padding: '14px 16px',
                                  display: 'grid',
                                  gridTemplateColumns: 'minmax(0, 1.4fr) repeat(4, minmax(0, 1fr))',
                                  gap: '12px',
                                  alignItems: 'center',
                                }}
                              >
                                <div style={{ display: 'grid', gap: '4px' }}>
                                  <strong>{order.id}</strong>
                                  <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                                    {new Date(order.createdAt).toLocaleString()}
                                  </span>
                                </div>
                                <div>
                                  <div className="section-label">Status</div>
                                  <div>{getManualOrderStatusLabel(order.status)}</div>
                                </div>
                                <div>
                                  <div className="section-label">Items</div>
                                  <div>{order.itemCount}</div>
                                </div>
                                <div>
                                  <div className="section-label">Total</div>
                                  <div>{formatCurrency(order.total)}</div>
                                </div>
                                <div>
                                  <div className="section-label">State</div>
                                  <div>{order.status === 'shipped' || order.status === 'fulfilled' ? 'Closed' : 'Open'}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AdminShell>
  )
}

function AdminAddressEditor({
  title,
  address,
  onChange,
}: {
  title: string
  address: ClientAddress
  onChange: (key: keyof ClientAddress, value: string) => void
}) {
  return (
    <div style={{ display: 'grid', gap: '10px' }}>
      <div className="section-label">{title}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '10px' }}>
        <label style={{ display: 'grid', gap: '7px', gridColumn: 'span 2' }}>
          <span className="section-label">Address 1</span>
          <input value={address.address1} onChange={(event) => onChange('address1', event.target.value)} style={adminInputStyle()} />
        </label>
        <label style={{ display: 'grid', gap: '7px', gridColumn: 'span 2' }}>
          <span className="section-label">Address 2</span>
          <input value={address.address2 ?? ''} onChange={(event) => onChange('address2', event.target.value)} style={adminInputStyle()} />
        </label>
        <label style={{ display: 'grid', gap: '7px' }}>
          <span className="section-label">City</span>
          <input value={address.city} onChange={(event) => onChange('city', event.target.value)} style={adminInputStyle()} />
        </label>
        <label style={{ display: 'grid', gap: '7px' }}>
          <span className="section-label">State</span>
          <input value={address.state} onChange={(event) => onChange('state', event.target.value)} style={adminInputStyle()} />
        </label>
        <label style={{ display: 'grid', gap: '7px' }}>
          <span className="section-label">Postal</span>
          <input value={address.postalCode} onChange={(event) => onChange('postalCode', event.target.value)} style={adminInputStyle()} />
        </label>
        <label style={{ display: 'grid', gap: '7px' }}>
          <span className="section-label">Country</span>
          <input value={address.country} onChange={(event) => onChange('country', event.target.value)} style={adminInputStyle()} />
        </label>
      </div>
    </div>
  )
}
