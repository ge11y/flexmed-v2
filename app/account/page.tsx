'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { getManualOrderStatusLabel, type ManualOrderAddress, type ManualOrderSubmission } from '@/lib/manual-orders'
import { formatCurrency } from '@/lib/cart'
import { supabase } from '@/lib/supabase'

type AccountProfile = {
  email: string
  firstName: string
  lastName: string
  phone: string
  shippingAddress: ManualOrderAddress | null
  billingAddress: ManualOrderAddress | null
  marketingOptIn: boolean
}

type AccountForm = {
  firstName: string
  lastName: string
  phone: string
  shippingAddress: ManualOrderAddress
  billingAddress: ManualOrderAddress
  marketingOptIn: boolean
}

type AuthMode = 'sign_in' | 'create'

type AuthForm = {
  email: string
  password: string
  firstName: string
  lastName: string
  phone: string
  marketingOptIn: boolean
}

const blankAddress: ManualOrderAddress = {
  address1: '',
  address2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'US',
}

const blankForm: AccountForm = {
  firstName: '',
  lastName: '',
  phone: '',
  shippingAddress: blankAddress,
  billingAddress: blankAddress,
  marketingOptIn: false,
}

const blankAuthForm: AuthForm = {
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  phone: '',
  marketingOptIn: false,
}

function inputStyle(): React.CSSProperties {
  return {
    width: '100%',
    borderRadius: '14px',
    border: '1px solid var(--border)',
    background: 'var(--bg-card)',
    color: 'var(--text-primary)',
    padding: '13px 14px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  }
}

function labelStyle(): React.CSSProperties {
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  }
}

function fieldLabel(label: string) {
  return (
    <span
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '11px',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'var(--text-muted)',
      }}
    >
      {label}
    </span>
  )
}

function addressFrom(profileAddress: ManualOrderAddress | null): ManualOrderAddress {
  return {
    ...blankAddress,
    ...(profileAddress ?? {}),
  }
}

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null)
  const [email, setEmail] = useState('')
  const [form, setForm] = useState<AccountForm>(blankForm)
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(false)
  const [authMode, setAuthMode] = useState<AuthMode>('sign_in')
  const [authForm, setAuthForm] = useState<AuthForm>(blankAuthForm)
  const [authSubmitting, setAuthSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [orders, setOrders] = useState<ManualOrderSubmission[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [ordersError, setOrdersError] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const getAccessToken = useCallback(async () => {
    if (!supabase) return ''
    const { data: sessionData } = await supabase.auth.getSession()
    return sessionData.session?.access_token ?? ''
  }, [])

  const loadCustomerOrders = useCallback(async () => {
    const accessToken = await getAccessToken()
    if (!accessToken) return

    setOrdersLoading(true)
    setOrdersError('')

    try {
      const response = await fetch('/api/customer-orders', {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: 'no-store',
      })
      const result = (await response.json()) as { ok: boolean; error?: string; orders?: ManualOrderSubmission[] }
      if (!response.ok || !result.ok) {
        throw new Error(result.error || 'Order history could not be loaded.')
      }
      setOrders(result.orders ?? [])
    } catch (loadError) {
      setOrdersError(loadError instanceof Error ? loadError.message : 'Order history could not be loaded.')
    } finally {
      setOrdersLoading(false)
    }
  }, [getAccessToken])

  const loadAccountProfile = useCallback(async (currentUser: User) => {
    if (!supabase) return
    setUser(currentUser)

    const accessToken = await getAccessToken()
    if (!accessToken) {
      throw new Error('Please sign in again to edit account details.')
    }

    const response = await fetch('/api/account/profile', {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    })
    const result = (await response.json()) as { ok: boolean; error?: string; profile?: AccountProfile }
    if (!response.ok || !result.ok || !result.profile) {
      throw new Error(result.error || 'Account details could not be loaded.')
    }

    setEmail(result.profile.email)
    setForm({
      firstName: result.profile.firstName,
      lastName: result.profile.lastName,
      phone: result.profile.phone,
      shippingAddress: addressFrom(result.profile.shippingAddress),
      billingAddress: addressFrom(result.profile.billingAddress),
      marketingOptIn: result.profile.marketingOptIn,
    })
    setBillingSameAsShipping(false)
    setAuthForm((current) => ({
      ...current,
      email: result.profile?.email ?? current.email,
      firstName: result.profile?.firstName ?? current.firstName,
      lastName: result.profile?.lastName ?? current.lastName,
      phone: result.profile?.phone ?? current.phone,
      password: '',
    }))
    await loadCustomerOrders()
  }, [getAccessToken, loadCustomerOrders])

  useEffect(() => {
    let isMounted = true

    async function loadProfile() {
      setLoading(true)
      setError('')

      if (!supabase) {
        setError('Customer account access is not configured yet.')
        setLoading(false)
        return
      }

      const { data: userData } = await supabase.auth.getUser()
      const currentUser = userData.user ?? null
      if (!isMounted) return

      setUser(currentUser)
      if (!currentUser) {
        setLoading(false)
        return
      }

      try {
        await loadAccountProfile(currentUser)
        if (!isMounted) return
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : 'Account details could not be loaded.')
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    void loadProfile()

    return () => {
      isMounted = false
    }
  }, [loadAccountProfile])

  function update<K extends keyof AccountForm>(key: K, value: AccountForm[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function updateAuth<K extends keyof AuthForm>(key: K, value: AuthForm[K]) {
    setAuthForm((current) => ({ ...current, [key]: value }))
  }

  function updateAddress(type: 'shippingAddress' | 'billingAddress', key: keyof ManualOrderAddress, value: string) {
    setForm((current) => ({
      ...current,
      [type]: {
        ...current[type],
        [key]: value,
      },
    }))
  }

  function updateBillingSameAsShipping(checked: boolean) {
    setBillingSameAsShipping(checked)
    if (checked) {
      setForm((current) => ({
        ...current,
        billingAddress: current.shippingAddress,
      }))
    }
  }

  async function saveProfile() {
    if (!supabase) return
    setSaving(true)
    setMessage('')
    setError('')

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData.session?.access_token
      if (!accessToken) throw new Error('Please sign in again to save account details.')

      const response = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...form,
          billingAddress: billingSameAsShipping ? form.shippingAddress : form.billingAddress,
          marketingOptIn: form.marketingOptIn,
        }),
      })
      const result = (await response.json()) as { ok: boolean; error?: string; profile?: AccountProfile }
      if (!response.ok || !result.ok || !result.profile) {
        throw new Error(result.error || 'Account details could not be saved.')
      }

      setMessage('Account details saved.')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Account details could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  async function handleAccountAccess() {
    if (!supabase) return
    setAuthSubmitting(true)
    setMessage('')
    setError('')

    try {
      if (authMode === 'create') {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: authForm.email,
            password: authForm.password,
            firstName: authForm.firstName,
            lastName: authForm.lastName,
            phone: authForm.phone,
            marketingOptIn: authForm.marketingOptIn,
          }),
        })
        const result = (await response.json()) as { ok: boolean; error?: string; detail?: string }
        if (!response.ok || !result.ok) {
          throw new Error(result.error || result.detail || 'Account could not be created.')
        }
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: authForm.email.trim().toLowerCase(),
        password: authForm.password,
      })
      if (signInError) throw signInError

      const { data } = await supabase.auth.getUser()
      if (data.user) {
        await loadAccountProfile(data.user)
        setMessage(authMode === 'create' ? 'Account created. You can add address details now.' : 'Signed in.')
      }
    } catch (accessError) {
      setError(accessError instanceof Error ? accessError.message : 'Account access failed.')
    } finally {
      setAuthSubmitting(false)
    }
  }

  async function signOut() {
    if (!supabase) return
    await supabase.auth.signOut()
    setUser(null)
    setEmail('')
    setForm(blankForm)
    setBillingSameAsShipping(false)
    setAuthForm(blankAuthForm)
    setOrders([])
    setMessage('Signed out.')
  }

  return (
    <main className="storefront-blue-shell" style={{ background: 'var(--bg-base)', minHeight: '100vh', padding: '112px 40px 72px' }}>
      <div className="container" style={{ display: 'grid', gap: '24px', maxWidth: '980px' }}>
        <div style={{ display: 'grid', gap: '10px' }}>
          <div className="section-label">Customer Account</div>
          <h1 style={{ fontSize: 'clamp(30px, 5vw, 52px)', margin: 0 }}>Account details</h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: '720px' }}>
            Update customer contact and address details for future FlexMed orders.
          </p>
        </div>

        {loading ? (
          <div className="card" style={{ padding: '22px', color: 'var(--text-secondary)' }}>Loading account...</div>
        ) : !user ? (
          <div className="card" style={{ padding: '22px', display: 'grid', gap: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'grid', gap: '6px' }}>
                <div className="section-label">Account Access</div>
                <div style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                  Sign in or create an account before checkout so orders, saved details, and updates stay connected.
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="fm-btn-outline"
                  onClick={() => setAuthMode('sign_in')}
                  style={{
                    borderColor: authMode === 'sign_in' ? 'var(--accent-400)' : undefined,
                    color: authMode === 'sign_in' ? 'var(--accent-500)' : undefined,
                  }}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  className="fm-btn-outline"
                  onClick={() => setAuthMode('create')}
                  style={{
                    borderColor: authMode === 'create' ? 'var(--accent-400)' : undefined,
                    color: authMode === 'create' ? 'var(--accent-500)' : undefined,
                  }}
                >
                  Create Account
                </button>
              </div>
            </div>

            {message ? (
              <div style={{ color: '#027a48', background: 'rgba(2,122,72,0.1)', border: '1px solid rgba(2,122,72,0.18)', borderRadius: '14px', padding: '14px 16px' }}>
                {message}
              </div>
            ) : null}
            {error ? (
              <div style={{ color: '#b42318', background: '#fef3f2', border: '1px solid #fecdca', borderRadius: '14px', padding: '14px 16px' }}>
                {error}
              </div>
            ) : null}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '14px' }}>
              {authMode === 'create' ? (
                <>
                  <label style={labelStyle()}>
                    {fieldLabel('First name')}
                    <input value={authForm.firstName} onChange={(event) => updateAuth('firstName', event.target.value)} style={inputStyle()} />
                  </label>
                  <label style={labelStyle()}>
                    {fieldLabel('Last name')}
                    <input value={authForm.lastName} onChange={(event) => updateAuth('lastName', event.target.value)} style={inputStyle()} />
                  </label>
                </>
              ) : null}
              <label style={labelStyle()}>
                {fieldLabel('Email')}
                <input value={authForm.email} onChange={(event) => updateAuth('email', event.target.value)} style={inputStyle()} type="email" />
              </label>
              {authMode === 'create' ? (
                <label style={labelStyle()}>
                  {fieldLabel('Phone')}
                  <input value={authForm.phone} onChange={(event) => updateAuth('phone', event.target.value)} style={inputStyle()} />
                </label>
              ) : null}
              <label style={labelStyle()}>
                {fieldLabel('Password')}
                <input value={authForm.password} onChange={(event) => updateAuth('password', event.target.value)} style={inputStyle()} type="password" />
              </label>
            </div>

            {authMode === 'create' ? (
              <label style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                <input
                  type="checkbox"
                  checked={authForm.marketingOptIn}
                  onChange={(event) => updateAuth('marketingOptIn', event.target.checked)}
                  style={{ marginTop: '4px' }}
                />
                <span>Send me occasional product and promotion updates by email. I can unsubscribe at any time.</span>
              </label>
            ) : null}

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
              <Link href="/products" className="fm-btn-outline">Browse Catalog</Link>
              <button
                type="button"
                className="fm-btn-primary"
                onClick={handleAccountAccess}
                disabled={authSubmitting}
                style={{ opacity: authSubmitting ? 0.7 : 1 }}
              >
                {authSubmitting ? 'Working...' : authMode === 'create' ? 'Create Account' : 'Sign In'}
              </button>
            </div>
          </div>
        ) : (
          <div className="card" style={{ padding: '22px', display: 'grid', gap: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <div className="section-label">Signed In</div>
                <div style={{ marginTop: '6px', color: 'var(--text-secondary)' }}>{email || user.email}</div>
              </div>
              <button type="button" className="fm-btn-outline" onClick={signOut}>Sign Out</button>
            </div>

            {message ? (
              <div style={{ color: '#027a48', background: 'rgba(2,122,72,0.1)', border: '1px solid rgba(2,122,72,0.18)', borderRadius: '14px', padding: '14px 16px' }}>
                {message}
              </div>
            ) : null}
            {error ? (
              <div style={{ color: '#b42318', background: '#fef3f2', border: '1px solid #fecdca', borderRadius: '14px', padding: '14px 16px' }}>
                {error}
              </div>
            ) : null}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '14px' }}>
              <label style={labelStyle()}>
                {fieldLabel('First name')}
                <input value={form.firstName} onChange={(event) => update('firstName', event.target.value)} style={inputStyle()} />
              </label>
              <label style={labelStyle()}>
                {fieldLabel('Last name')}
                <input value={form.lastName} onChange={(event) => update('lastName', event.target.value)} style={inputStyle()} />
              </label>
              <label style={labelStyle()}>
                {fieldLabel('Phone')}
                <input value={form.phone} onChange={(event) => update('phone', event.target.value)} style={inputStyle()} />
              </label>
              <label style={labelStyle()}>
                {fieldLabel('Email')}
                <input value={email || user.email || ''} readOnly style={{ ...inputStyle(), opacity: 0.75 }} />
              </label>
            </div>

            <AddressFields title="Shipping Address" address={form.shippingAddress} onChange={(key, value) => updateAddress('shippingAddress', key, value)} />
            <div style={{ display: 'grid', gap: '14px' }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)' }}>
                <input
                  type="checkbox"
                  checked={billingSameAsShipping}
                  onChange={(event) => updateBillingSameAsShipping(event.target.checked)}
                />
                Same as shipping
              </label>

              {!billingSameAsShipping ? (
                <AddressFields title="Billing Address" address={form.billingAddress} onChange={(key, value) => updateAddress('billingAddress', key, value)} />
              ) : (
                <div
                  style={{
                    borderRadius: '14px',
                    border: '1px solid rgba(42,79,174,0.18)',
                    background: 'rgba(42,79,174,0.07)',
                    padding: '14px 16px',
                    color: 'var(--text-secondary)',
                    fontSize: '13px',
                    lineHeight: 1.6,
                  }}
                >
                  Billing address will match the shipping address when saved.
                </div>
              )}
            </div>

            <label style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <input
                type="checkbox"
                checked={form.marketingOptIn}
                onChange={(event) => update('marketingOptIn', event.target.checked)}
                style={{ marginTop: '4px' }}
              />
              <span>Send me occasional product and promotion updates by email. I can unsubscribe at any time.</span>
            </label>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" className="fm-btn-primary" onClick={saveProfile} disabled={saving} style={{ opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving...' : 'Save Account'}
              </button>
            </div>
          </div>
        )}

        {user ? (
          <OrderHistory orders={orders} loading={ordersLoading} error={ordersError} />
        ) : null}
      </div>
    </main>
  )
}

const ORDER_STEPS: Array<{
  key: string
  label: string
  matches: Array<ManualOrderSubmission['status'] | ManualOrderSubmission['paymentProofStatus']>
}> = [
  { key: 'placed', label: 'Placed', matches: ['submitted', 'payment_pending', 'proof_received', 'ready_to_fulfill', 'waiting_to_ship', 'shipped', 'fulfilled'] },
  { key: 'proof', label: 'Proof', matches: ['submitted', 'confirmed', 'proof_received', 'ready_to_fulfill', 'waiting_to_ship', 'shipped', 'fulfilled'] },
  { key: 'confirmed', label: 'Confirmed', matches: ['confirmed', 'ready_to_fulfill', 'waiting_to_ship', 'shipped', 'fulfilled'] },
  { key: 'shipping', label: 'Shipping', matches: ['waiting_to_ship', 'shipped', 'fulfilled'] },
  { key: 'complete', label: 'Complete', matches: ['shipped', 'fulfilled'] },
]

function orderStepActive(order: ManualOrderSubmission, step: (typeof ORDER_STEPS)[number]) {
  return step.matches.includes(order.status) || step.matches.includes(order.paymentProofStatus)
}

function OrderHistory({
  orders,
  loading,
  error,
}: {
  orders: ManualOrderSubmission[]
  loading: boolean
  error: string
}) {
  return (
    <section className="card" style={{ padding: '22px', display: 'grid', gap: '18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '14px', alignItems: 'baseline', flexWrap: 'wrap' }}>
        <div>
          <div className="section-label">Order History</div>
          <h2 style={{ margin: '8px 0 0', fontSize: '24px' }}>Your orders</h2>
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
          {loading ? 'Loading...' : `${orders.length} order${orders.length === 1 ? '' : 's'}`}
        </div>
      </div>

      {error ? (
        <div style={{ color: '#b42318', background: '#fef3f2', border: '1px solid #fecdca', borderRadius: '14px', padding: '14px 16px' }}>
          {error}
        </div>
      ) : null}

      {!loading && orders.length === 0 ? (
        <div style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          No orders are tied to this account yet. Once you place an order, status and products will appear here.
        </div>
      ) : null}

      <div style={{ display: 'grid', gap: '14px' }}>
        {orders.map((order) => (
          <article
            key={order.id}
            style={{
              borderRadius: '16px',
              border: '1px solid var(--border)',
              background: 'var(--bg-elevated)',
              padding: '16px',
              display: 'grid',
              gap: '14px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap' }}>
              <div style={{ display: 'grid', gap: '4px' }}>
                <strong style={{ fontSize: '17px' }}>Order {order.id}</strong>
                <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                  {new Date(order.createdAt).toLocaleString()} · {getManualOrderStatusLabel(order.status)}
                </span>
              </div>
              <div style={{ fontWeight: 700 }}>{formatCurrency(order.order.totals.total)}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: '8px' }}>
              {ORDER_STEPS.map((step) => {
                const active = orderStepActive(order, step)
                return (
                  <div key={step.key} style={{ display: 'grid', gap: '6px' }}>
                    <div
                      style={{
                        height: '6px',
                        borderRadius: '999px',
                        background: active ? 'var(--accent-500)' : 'rgba(100,116,139,0.18)',
                      }}
                    />
                    <span style={{ fontSize: '11px', color: active ? 'var(--text-primary)' : 'var(--text-muted)', textAlign: 'center' }}>
                      {step.label}
                    </span>
                  </div>
                )
              })}
            </div>

            <div style={{ display: 'grid', gap: '8px' }}>
              {order.order.lines.map((line) => (
                <div key={`${order.id}-${line.slug}`} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                  <span>
                    {line.displayName}{line.strengthLabel ? ` · ${line.strengthLabel}` : ''} · Qty {line.quantity}
                  </span>
                  <span>{formatCurrency(line.lineTotal ?? line.lineSubtotal)}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <Link href={`/checkout/confirmation/${order.id}`} className="fm-btn-outline" style={{ padding: '9px 12px', fontSize: '12px' }}>
                View order
              </Link>
              {order.paymentProofStatus !== 'submitted' && order.paymentProofStatus !== 'confirmed' ? (
                <Link href={`/checkout/payment/${order.id}`} className="fm-btn-primary" style={{ padding: '9px 12px', fontSize: '12px' }}>
                  Complete payment
                </Link>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function AddressFields({
  title,
  address,
  onChange,
}: {
  title: string
  address: ManualOrderAddress
  onChange: (key: keyof ManualOrderAddress, value: string) => void
}) {
  return (
    <div style={{ display: 'grid', gap: '14px' }}>
      <div className="section-label">{title}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '14px' }}>
        <label style={{ ...labelStyle(), gridColumn: '1 / -1' }}>
          {fieldLabel('Address line 1')}
          <input value={address.address1} onChange={(event) => onChange('address1', event.target.value)} style={inputStyle()} />
        </label>
        <label style={{ ...labelStyle(), gridColumn: '1 / -1' }}>
          {fieldLabel('Address line 2')}
          <input value={address.address2 ?? ''} onChange={(event) => onChange('address2', event.target.value)} style={inputStyle()} />
        </label>
        <label style={labelStyle()}>
          {fieldLabel('City')}
          <input value={address.city} onChange={(event) => onChange('city', event.target.value)} style={inputStyle()} />
        </label>
        <label style={labelStyle()}>
          {fieldLabel('State')}
          <input value={address.state} onChange={(event) => onChange('state', event.target.value)} style={inputStyle()} />
        </label>
        <label style={labelStyle()}>
          {fieldLabel('Postal code')}
          <input value={address.postalCode} onChange={(event) => onChange('postalCode', event.target.value)} style={inputStyle()} />
        </label>
        <label style={labelStyle()}>
          {fieldLabel('Country')}
          <input value={address.country} onChange={(event) => onChange('country', event.target.value)} style={inputStyle()} />
        </label>
      </div>
    </div>
  )
}
