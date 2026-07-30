'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { useCart } from '@/components/CartProvider'
import { formatCurrency } from '@/lib/cart'
import type { BusinessDetailsSettings, CheckoutOperationsSettings } from '@/lib/admin-settings'
import { loadAffiliateReferralCapture } from '@/lib/affiliates'
import {
  appendManualOrder,
  CHECKOUT_FORM_STORAGE_KEY,
  getConfiguredManualPaymentInstructions,
  getEnabledManualPaymentMethods,
  type ManualPaymentMethod,
  type ManualOrderSubmission,
} from '@/lib/manual-orders'
import { supabase } from '@/lib/supabase'
import { useCheckoutQuote } from '@/lib/use-checkout-quote'

type CheckoutForm = {
  email: string
  firstName: string
  lastName: string
  phone: string
  shippingAddress1: string
  shippingAddress2: string
  shippingCity: string
  shippingState: string
  shippingPostalCode: string
  shippingCountry: string
  billingSameAsShipping: boolean
  billingAddress1: string
  billingAddress2: string
  billingCity: string
  billingState: string
  billingPostalCode: string
  billingCountry: string
  paymentMethod: ManualPaymentMethod
  notes: string
}

type AccountForm = {
  firstName: string
  lastName: string
  email: string
  phone: string
  password: string
  marketingOptIn: boolean
}

const initialForm: CheckoutForm = {
  email: '',
  firstName: '',
  lastName: '',
  phone: '',
  shippingAddress1: '',
  shippingAddress2: '',
  shippingCity: '',
  shippingState: '',
  shippingPostalCode: '',
  shippingCountry: 'US',
  billingSameAsShipping: true,
  billingAddress1: '',
  billingAddress2: '',
  billingCity: '',
  billingState: '',
  billingPostalCode: '',
  billingCountry: 'US',
  paymentMethod: 'paypal',
  notes: '',
}

const initialAccountForm: AccountForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  marketingOptIn: false,
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
      {children}
    </label>
  )
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

function mergeAccountIntoCheckout(
  current: CheckoutForm,
  values: {
    email?: string
    firstName?: string
    lastName?: string
    phone?: string
    shippingAddress?: Partial<{
      address1: string
      address2: string
      city: string
      state: string
      postalCode: string
      country: string
    }> | null
    billingAddress?: Partial<{
      address1: string
      address2: string
      city: string
      state: string
      postalCode: string
      country: string
    }> | null
  },
) {
  return {
    ...current,
    email: values.email ?? current.email,
    firstName: values.firstName ?? current.firstName,
    lastName: values.lastName ?? current.lastName,
    phone: values.phone ?? current.phone,
    shippingAddress1: values.shippingAddress?.address1 ?? current.shippingAddress1,
    shippingAddress2: values.shippingAddress?.address2 ?? current.shippingAddress2,
    shippingCity: values.shippingAddress?.city ?? current.shippingCity,
    shippingState: values.shippingAddress?.state ?? current.shippingState,
    shippingPostalCode: values.shippingAddress?.postalCode ?? current.shippingPostalCode,
    shippingCountry: values.shippingAddress?.country ?? current.shippingCountry,
    billingAddress1: values.billingAddress?.address1 ?? current.billingAddress1,
    billingAddress2: values.billingAddress?.address2 ?? current.billingAddress2,
    billingCity: values.billingAddress?.city ?? current.billingCity,
    billingState: values.billingAddress?.state ?? current.billingState,
    billingPostalCode: values.billingAddress?.postalCode ?? current.billingPostalCode,
    billingCountry: values.billingAddress?.country ?? current.billingCountry,
  }
}

const checkoutResponsiveStyles = `
  .checkout-page-shell {
    --bg-base: #071a3d;
    --text-primary: #ffffff;
    --text-secondary: rgba(235, 245, 255, 0.86);
    --text-muted: rgba(207, 226, 255, 0.76);
    --bg-card: rgba(8, 30, 68, 0.74);
    --bg-elevated: rgba(10, 33, 76, 0.72);
    --border: rgba(77, 211, 232, 0.26);
    --amber: #5de7d8;
    --amber-muted: rgba(93, 231, 216, 0.12);
    --amber-border: rgba(93, 231, 216, 0.34);
    background: var(--bg-base);
    min-height: 100vh;
    padding: 112px 40px 72px;
  }

  .checkout-page-inner {
    max-width: 1120px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 28px;
  }

  .checkout-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 360px;
    gap: 24px;
    align-items: start;
  }

  .checkout-form-stack,
  .checkout-review-stack {
    display: flex;
    flex-direction: column;
    gap: 20px;
    min-width: 0;
  }

  .checkout-card {
    background:
      linear-gradient(165deg, rgba(38, 82, 145, 0.96), rgba(26, 62, 116, 0.94)),
      radial-gradient(circle at 100% 0%, rgba(77, 211, 232, 0.12), transparent 34%);
    border-color: rgba(77, 211, 232, 0.24);
    color: #ffffff;
  }

  .checkout-page-shell .checkout-card h1,
  .checkout-page-shell .checkout-card h2,
  .checkout-page-shell .checkout-card h3,
  .checkout-page-shell .checkout-card strong,
  .checkout-page-shell .checkout-review-line {
    color: #ffffff !important;
  }

  .checkout-page-shell .checkout-card .section-label {
    color: rgba(223, 238, 255, 0.82) !important;
  }

  .checkout-form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }

  .checkout-review-line {
    padding: 12px 14px;
    border-radius: 14px;
    background: rgba(10, 33, 76, 0.62);
    border: 1px solid rgba(77, 211, 232, 0.24);
    display: flex;
    justify-content: space-between;
    gap: 16px;
  }

  .checkout-review-line-price {
    text-align: right;
    flex: 0 0 auto;
  }

  .payment-method-options {
    display: grid;
    gap: 10px;
  }

  .payment-method-option {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    text-align: left;
    padding: 14px 16px;
    border-radius: 14px;
    border: 2px solid transparent;
    color: #ffffff;
    cursor: pointer;
    transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease;
  }

  .payment-brand {
    min-width: 92px;
    min-height: 38px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0 12px;
    border-radius: 10px;
    font-size: 16px;
    font-weight: 800;
    letter-spacing: -0.02em;
    flex: 0 0 auto;
  }

  .payment-brand-cashapp {
    color: #ffffff;
    background: #00c244;
  }

  .payment-brand-venmo {
    color: #ffffff;
    background: #3d95ce;
    font-style: italic;
  }

  .payment-brand-paypal {
    color: #102b67;
    background: #ffc439;
  }

  .payment-brand-zelle {
    color: #ffffff;
    background: #6d1ed4;
  }

  .payment-brand-crypto,
  .payment-brand-other {
    color: #ffffff;
    background: #42618e;
  }

  .payment-method-option.payment-method-cashapp { background: #00c244; }
  .payment-method-option.payment-method-venmo { background: #3d95ce; }
  .payment-method-option.payment-method-paypal { background: #ffc439; color: #102b67; }
  .payment-method-option.payment-method-zelle { background: #6d1ed4; }
  .payment-method-option.payment-method-crypto,
  .payment-method-option.payment-method-other { background: #42618e; }

  .payment-method-option.payment-method-paypal strong,
  .payment-method-option.payment-method-paypal span { color: #102b67 !important; }

  .payment-method-option[data-selected="true"] {
    border-color: #ffffff;
    box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.22);
  }

  .payment-method-option:hover,
  .payment-method-option:focus-visible {
    transform: translateY(-1px);
    border-color: rgba(255, 255, 255, 0.9);
  }

  @media (max-width: 860px) {
    .checkout-page-shell {
      padding: calc(112px + var(--promo-banner-offset, 0px)) 16px 86px;
    }

    .checkout-layout,
    .checkout-form-grid {
      grid-template-columns: 1fr;
    }

    .checkout-layout {
      gap: 18px;
    }

    .checkout-card {
      border-color: rgba(77, 211, 232, 0.32);
      box-shadow: 0 18px 44px rgba(0, 0, 0, 0.24);
    }

    .checkout-review-stack {
      position: relative;
      z-index: 1;
    }
  }

  @media (max-width: 560px) {
    .checkout-page-shell {
      padding-left: 14px;
      padding-right: 14px;
    }

    .checkout-page-inner {
      gap: 22px;
    }

    .checkout-account-card,
    .checkout-card {
      padding: 18px !important;
    }

    .checkout-review-line {
      flex-direction: column;
      align-items: stretch;
      gap: 10px;
    }

    .checkout-review-line-price {
      text-align: left;
    }

    .checkout-page-shell .fm-btn-primary,
    .checkout-page-shell .fm-btn-outline {
      width: 100%;
      justify-content: center;
      text-align: center;
    }
  }
`

export default function CheckoutPage() {
  const { items, clearCart } = useCart()
  const router = useRouter()
  const [authMode, setAuthMode] = useState<'sign_in' | 'create'>('create')
  const [authUser, setAuthUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(Boolean(supabase))
  const [authSubmitting, setAuthSubmitting] = useState(false)
  const [authError, setAuthError] = useState('')
  const [form, setForm] = useState<CheckoutForm>(() => {
    if (typeof window === 'undefined') return initialForm
    try {
      const raw = window.localStorage.getItem(CHECKOUT_FORM_STORAGE_KEY)
      return raw ? { ...initialForm, ...(JSON.parse(raw) as Partial<CheckoutForm>) } : initialForm
    } catch {
      return initialForm
    }
  })
  const [accountForm, setAccountForm] = useState<AccountForm>(initialAccountForm)
  const [submissionState, setSubmissionState] = useState<'idle' | 'submitting' | 'submitted'>('idle')
  const [submissionNote, setSubmissionNote] = useState('')
  const [checkoutSettings, setCheckoutSettings] = useState<CheckoutOperationsSettings | null>(null)
  const [businessDetails, setBusinessDetails] = useState<BusinessDetailsSettings | null>(null)
  const [affiliateReferral, setAffiliateReferral] = useState<ReturnType<typeof loadAffiliateReferralCapture>>(() =>
    typeof window === 'undefined' ? null : loadAffiliateReferralCapture(),
  )
  const { quote: orderDraft, errors: quoteErrors, loading: quoteLoading } = useCheckoutQuote(items, form.shippingPostalCode)

  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch('/api/checkout-settings', { cache: 'no-store' })
        const result = (await response.json()) as {
          ok: boolean
          checkoutOperations?: CheckoutOperationsSettings
          businessDetails?: BusinessDetailsSettings
        }
        if (response.ok && result.ok && result.checkoutOperations) {
          setCheckoutSettings(result.checkoutOperations)
          setBusinessDetails(result.businessDetails ?? null)
        }
      } catch {
        // leave defaults in place
      }
    }

    void loadSettings()
  }, [])

  useEffect(() => {
    function refreshAffiliateReferral() {
      setAffiliateReferral(loadAffiliateReferralCapture())
    }

    refreshAffiliateReferral()
    window.addEventListener('focus', refreshAffiliateReferral)
    window.addEventListener('storage', refreshAffiliateReferral)

    return () => {
      window.removeEventListener('focus', refreshAffiliateReferral)
      window.removeEventListener('storage', refreshAffiliateReferral)
    }
  }, [])

  const flatRateAmount = Number(String(checkoutSettings?.flatRate ?? '').replace(/[^0-9.]/g, ''))
  const hasFlatRate = checkoutSettings?.shippingMode === 'flat_rate'
  const freeShippingApplied = Boolean(
    orderDraft.metadata.appliedPromotions?.some((promo) => promo.discountType === 'free_shipping') ||
      (hasFlatRate && flatRateAmount > 0 && orderDraft.totals.shipping === 0),
  )
  const paymentMethodOptions = useMemo(() => getEnabledManualPaymentMethods(businessDetails), [businessDetails])
  const selectedPaymentInstructions = getConfiguredManualPaymentInstructions(form.paymentMethod, businessDetails)

  useEffect(() => {
    if (paymentMethodOptions.some((method) => method.method === form.paymentMethod)) return
    update('paymentMethod', paymentMethodOptions[0]?.method ?? 'paypal')
  }, [form.paymentMethod, paymentMethodOptions])

  useEffect(() => {
    try {
      window.localStorage.setItem(CHECKOUT_FORM_STORAGE_KEY, JSON.stringify(form))
    } catch {
      // Ignore storage failures and keep the form in memory.
    }
  }, [form])

  useEffect(() => {
    if (!supabase) return
    const client = supabase

    let isMounted = true

    function applyAuthUser(user: User | null) {
      if (!isMounted) return
      setAuthUser(user)
      setAuthLoading(false)

      if (!user) return
      const metadata = (user.user_metadata ?? {}) as Record<string, unknown>
      const email = user.email ?? ''
      const firstName = typeof metadata.firstName === 'string' ? metadata.firstName : ''
      const lastName = typeof metadata.lastName === 'string' ? metadata.lastName : ''
      const phone = typeof metadata.phone === 'string' ? metadata.phone : ''
      const shippingAddress = metadata.shippingAddress && typeof metadata.shippingAddress === 'object'
        ? metadata.shippingAddress as Record<string, string>
        : null
      const billingAddress = metadata.billingAddress && typeof metadata.billingAddress === 'object'
        ? metadata.billingAddress as Record<string, string>
        : null

      setForm((current) =>
        mergeAccountIntoCheckout(current, {
          email,
          firstName,
          lastName,
          phone,
          shippingAddress,
          billingAddress,
        }),
      )

      setAccountForm((current) => ({
        ...current,
        email: email || current.email,
        firstName: firstName || current.firstName,
        lastName: lastName || current.lastName,
        phone: phone || current.phone,
        password: '',
      }))
    }

    async function loadUser() {
      const { data } = await client.auth.getUser()
      applyAuthUser(data.user ?? null)
    }

    void loadUser()

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      applyAuthUser(session?.user ?? null)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  function update<K extends keyof CheckoutForm>(key: K, value: CheckoutForm[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function updateAccount<K extends keyof AccountForm>(key: K, value: AccountForm[K]) {
    setAccountForm((current) => ({ ...current, [key]: value }))
  }

  const billingAddress = form.billingSameAsShipping
    ? {
        address1: form.shippingAddress1,
        address2: form.shippingAddress2,
        city: form.shippingCity,
        state: form.shippingState,
        postalCode: form.shippingPostalCode,
        country: form.shippingCountry,
      }
    : {
        address1: form.billingAddress1,
        address2: form.billingAddress2,
        city: form.billingCity,
        state: form.billingState,
        postalCode: form.billingPostalCode,
        country: form.billingCountry,
      }

  async function handleSubmitManualOrder() {
    if (!authUser) {
      setSubmissionNote('Please sign in or create an account before placing the order.')
      return
    }
    if (quoteLoading || quoteErrors.length > 0) {
      setSubmissionNote(
        quoteErrors.length > 0
          ? quoteErrors.join(' ')
          : 'Refreshing current prices and availability. Please try again in a moment.',
      )
      return
    }

    const currentAffiliateReferral = loadAffiliateReferralCapture() ?? affiliateReferral

    const submission: ManualOrderSubmission = {
      id: orderDraft.orderId,
      createdAt: orderDraft.createdAt,
      status: 'payment_pending',
      paymentMethod: form.paymentMethod,
      order: orderDraft,
      customer: {
        email: form.email,
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
      },
      shippingAddress: {
        address1: form.shippingAddress1,
        address2: form.shippingAddress2,
        city: form.shippingCity,
        state: form.shippingState,
        postalCode: form.shippingPostalCode,
        country: form.shippingCountry,
      },
      billingAddress,
      notes: form.notes,
      paymentProofStatus: 'not_received',
      affiliateCode: currentAffiliateReferral?.code,
      affiliateSource: currentAffiliateReferral?.source,
      affiliateLandingPath: currentAffiliateReferral?.landingPath,
    }

    setSubmissionState('submitting')
    setSubmissionNote('')

    try {
      const response = await fetch('/api/manual-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submission),
      })

      const result = (await response.json()) as {
        ok: boolean
        code?: string
        error?: string
        detail?: string
        order?: ManualOrderSubmission
      }

      if (!response.ok || !result.ok || !result.order) {
        setSubmissionState('idle')
        setSubmissionNote(result.detail ? `${result.error || 'Order submission failed.'} ${result.detail}` : result.error || 'Order submission failed. Please try again.')
        return
      }

      appendManualOrder(result.order)
      clearCart()
      setForm(initialForm)
      try {
        window.localStorage.removeItem(CHECKOUT_FORM_STORAGE_KEY)
      } catch {
        // Ignore storage failures and keep the submitted order moving.
      }
      setSubmissionState('submitted')
      router.replace(`/checkout/payment/${result.order.id}`)
    } catch {
      setSubmissionState('idle')
      setSubmissionNote('Order submission failed. Please try again.')
    }
  }

  async function handleAccountSubmit() {
    setAuthSubmitting(true)
    setAuthError('')

    try {
      if (!supabase) {
        throw new Error('Supabase auth is not available yet.')
      }

      if (authMode === 'sign_in') {
        const { error } = await supabase.auth.signInWithPassword({
          email: accountForm.email.trim().toLowerCase(),
          password: accountForm.password,
        })

        if (error) throw error
        return
      }

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
          email: accountForm.email,
          password: accountForm.password,
          firstName: accountForm.firstName,
          lastName: accountForm.lastName,
            phone: accountForm.phone,
            marketingOptIn: accountForm.marketingOptIn,
          }),
      })

      const result = (await response.json()) as { ok: boolean; error?: string; detail?: string }
      if (!response.ok || !result.ok) {
        throw new Error(result.error || result.detail || 'Account creation failed.')
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: accountForm.email.trim().toLowerCase(),
        password: accountForm.password,
      })

      if (error) throw error
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Account setup failed.')
    } finally {
      setAuthSubmitting(false)
    }
  }

  async function handleSignOut() {
    if (!supabase) return
    await supabase.auth.signOut()
    setAuthUser(null)
  }

  if (items.length === 0) {
    return (
      <div className="storefront-blue-shell checkout-page-shell">
        <style>{checkoutResponsiveStyles}</style>
        <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="section-label">Checkout</div>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 44px)', margin: 0 }}>Nothing to check out yet.</h1>
          <p style={{ margin: 0, maxWidth: '680px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            Add products to the cart first, then return here to enter customer details and review the order.
          </p>
          <div>
            <Link href="/products?group=peptides" className="fm-btn-primary">
              Browse catalog
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="storefront-blue-shell checkout-page-shell">
      <style>{checkoutResponsiveStyles}</style>
      <div className="checkout-page-inner">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div className="section-label">Checkout</div>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 44px)', margin: 0 }}>Customer Details & Order Review</h1>
          <p style={{ margin: 0, maxWidth: '760px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            Create an account or sign in first, then review the order, submit it, and continue to payment verification.
          </p>
        </div>

        <div className="card checkout-card checkout-account-card" style={{ padding: '22px', display: 'grid', gap: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'grid', gap: '8px' }}>
              <div className="section-label">Customer Account</div>
              <div style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                {authUser
                  ? `Signed in as ${authUser.email}. Orders from this account will be available in your account history.`
                  : 'Sign in or create an account before continuing to order submission.'}
              </div>
            </div>

            {authUser ? (
              <button type="button" className="fm-btn-outline" onClick={handleSignOut}>
                Sign Out
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
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
              </div>
            )}
          </div>

          {!authUser ? (
            <div style={{ display: 'grid', gap: '16px' }}>
              <div className="checkout-form-grid">
                {authMode === 'create' ? (
                  <>
                    <Field label="First name">
                      <input value={accountForm.firstName} onChange={(e) => updateAccount('firstName', e.target.value)} style={inputStyle()} />
                    </Field>
                    <Field label="Last name">
                      <input value={accountForm.lastName} onChange={(e) => updateAccount('lastName', e.target.value)} style={inputStyle()} />
                    </Field>
                  </>
                ) : null}
                <Field label="Email">
                  <input value={accountForm.email} onChange={(e) => updateAccount('email', e.target.value)} style={inputStyle()} type="email" />
                </Field>
                {authMode === 'create' ? (
                  <Field label="Phone">
                    <input value={accountForm.phone} onChange={(e) => updateAccount('phone', e.target.value)} style={inputStyle()} />
                  </Field>
                ) : (
                  <div />
                )}
                <Field label="Password">
                  <input
                    value={accountForm.password}
                    onChange={(e) => updateAccount('password', e.target.value)}
                    style={inputStyle()}
                    type="password"
                  />
                </Field>
              </div>

              {authError ? (
                <div style={{ color: '#b42318', background: '#fef3f2', border: '1px solid #fecdca', borderRadius: '14px', padding: '14px 16px' }}>
                  {authError}
                </div>
              ) : null}

              {authMode === 'create' ? (
                <label style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  <input
                    type="checkbox"
                    checked={accountForm.marketingOptIn}
                    onChange={(event) => updateAccount('marketingOptIn', event.target.checked)}
                    style={{ marginTop: '4px' }}
                  />
                  <span>Send me occasional product and promotion updates by email. I can unsubscribe at any time.</span>
                </label>
              ) : null}

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                  {authMode === 'create'
                    ? 'Account details will be saved for future orders.'
                    : 'Use your existing FlexMed customer account to continue.'}
                </div>
                <button
                  type="button"
                  className="fm-btn-primary"
                  onClick={handleAccountSubmit}
                  disabled={authSubmitting || authLoading}
                  style={{ opacity: authSubmitting || authLoading ? 0.7 : 1 }}
                >
                  {authSubmitting ? 'Saving account...' : authMode === 'create' ? 'Create Account' : 'Sign In'}
                </button>
              </div>

              {affiliateReferral ? (
                <div
                  style={{
                    borderRadius: '14px',
                    border: '1px solid rgba(42,79,174,0.18)',
                    background: 'rgba(42,79,174,0.07)',
                    padding: '14px 16px',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.7,
                  }}
                >
                  Affiliate referral detected: <strong style={{ color: 'var(--text-primary)' }}>{affiliateReferral.code}</strong>. Orders placed in this session will be tracked under that link automatically.
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="checkout-layout">
          <div className="checkout-form-stack">
            <div className="card checkout-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div className="section-label">Contact</div>
              {!authUser ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Account access is required before the order can be submitted.</div>
              ) : null}
              <div className="checkout-form-grid">
                <Field label="First name">
                  <input value={form.firstName} onChange={(e) => update('firstName', e.target.value)} style={inputStyle()} />
                </Field>
                <Field label="Last name">
                  <input value={form.lastName} onChange={(e) => update('lastName', e.target.value)} style={inputStyle()} />
                </Field>
                <Field label="Email">
                  <input value={form.email} readOnly style={{ ...inputStyle(), opacity: authUser ? 1 : 0.7 }} type="email" />
                </Field>
                <Field label="Phone">
                  <input value={form.phone} onChange={(e) => update('phone', e.target.value)} style={inputStyle()} />
                </Field>
              </div>
            </div>

            <div className="card checkout-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div className="section-label">Shipping</div>
              <div className="checkout-form-grid">
                <div style={{ gridColumn: '1 / -1' }}>
                  <Field label="Address line 1">
                    <input value={form.shippingAddress1} onChange={(e) => update('shippingAddress1', e.target.value)} style={inputStyle()} />
                  </Field>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <Field label="Address line 2">
                    <input value={form.shippingAddress2} onChange={(e) => update('shippingAddress2', e.target.value)} style={inputStyle()} />
                  </Field>
                </div>
                <Field label="City">
                  <input value={form.shippingCity} onChange={(e) => update('shippingCity', e.target.value)} style={inputStyle()} />
                </Field>
                <Field label="State">
                  <input value={form.shippingState} onChange={(e) => update('shippingState', e.target.value)} style={inputStyle()} />
                </Field>
                <Field label="Postal code">
                  <input value={form.shippingPostalCode} onChange={(e) => update('shippingPostalCode', e.target.value)} style={inputStyle()} />
                </Field>
                <Field label="Country">
                  <input value={form.shippingCountry} onChange={(e) => update('shippingCountry', e.target.value)} style={inputStyle()} />
                </Field>
              </div>
            </div>

            <div className="card checkout-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div className="section-label">Billing</div>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)' }}>
                <input
                  type="checkbox"
                  checked={form.billingSameAsShipping}
                  onChange={(e) => update('billingSameAsShipping', e.target.checked)}
                />
                Same as shipping
              </label>

              {!form.billingSameAsShipping && (
                <div className="checkout-form-grid">
                  <div style={{ gridColumn: '1 / -1' }}>
                    <Field label="Address line 1">
                      <input value={form.billingAddress1} onChange={(e) => update('billingAddress1', e.target.value)} style={inputStyle()} />
                    </Field>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <Field label="Address line 2">
                      <input value={form.billingAddress2} onChange={(e) => update('billingAddress2', e.target.value)} style={inputStyle()} />
                    </Field>
                  </div>
                  <Field label="City">
                    <input value={form.billingCity} onChange={(e) => update('billingCity', e.target.value)} style={inputStyle()} />
                  </Field>
                  <Field label="State">
                    <input value={form.billingState} onChange={(e) => update('billingState', e.target.value)} style={inputStyle()} />
                  </Field>
                  <Field label="Postal code">
                    <input value={form.billingPostalCode} onChange={(e) => update('billingPostalCode', e.target.value)} style={inputStyle()} />
                  </Field>
                  <Field label="Country">
                    <input value={form.billingCountry} onChange={(e) => update('billingCountry', e.target.value)} style={inputStyle()} />
                  </Field>
                </div>
              )}
            </div>

            <div className="card checkout-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="section-label">Order Notes</div>
              <textarea
                value={form.notes}
                onChange={(e) => update('notes', e.target.value)}
                style={{
                  ...inputStyle(),
                  minHeight: '120px',
                  resize: 'vertical',
                }}
                placeholder="Add any order notes you want the FlexMed team to review."
              />
            </div>
          </div>

          <div className="checkout-review-stack">
            <div className="card checkout-card checkout-review-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="section-label">Review</div>
              <div style={{ display: 'grid', gap: '10px' }}>
                {orderDraft.lines.map((line) => {
                  const descriptor = [line.strengthLabel, line.formatType].filter(Boolean).join(' · ')
                  return (
                    <div
                      key={`${line.itemType ?? 'product'}-${line.slug}`}
                      className="checkout-review-line"
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <strong style={{ color: 'var(--text-primary)' }}>{line.displayName}</strong>
                        {descriptor ? (
                          <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                            {descriptor}
                          </span>
                        ) : null}
                      </div>
                      <div className="checkout-review-line-price">
                        {(line.discountAmount ?? 0) > 0 ? (
                          <div style={{ color: 'var(--text-muted)', fontSize: '12px', textDecoration: 'line-through' }}>
                            {formatCurrency(line.lineSubtotal)}
                          </div>
                        ) : null}
                        <div style={{ fontWeight: 600 }}>{formatCurrency(line.lineTotal ?? line.lineSubtotal)}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                          {line.quantity} x {formatCurrency(line.unitPrice)}
                        </div>
                        {line.freeUnits ? (
                          <div style={{ color: '#047857', fontSize: '12px' }}>{line.freeUnits} free unit{line.freeUnits === 1 ? '' : 's'}</div>
                        ) : null}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '14px', display: 'grid', gap: '10px' }}>
                {quoteErrors.length > 0 ? (
                  <div role="alert" style={{ color: '#b42318', background: '#fef3f2', borderRadius: '8px', padding: '11px 12px' }}>
                    {quoteErrors.join(' ')}
                  </div>
                ) : null}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Items</span>
                  <strong>{orderDraft.totals.itemCount}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
                  <strong>{formatCurrency(orderDraft.totals.subtotal)}</strong>
                </div>
                {orderDraft.totals.discount > 0 ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#047857' }}>
                    <span>Promotion savings</span>
                    <strong>-{formatCurrency(orderDraft.totals.discount)}</strong>
                  </div>
                ) : null}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Shipping</span>
                  <span style={{ color: freeShippingApplied ? 'var(--accent-500)' : 'var(--text-muted)' }}>
                    {freeShippingApplied
                      ? 'Free local shipping'
                      : hasFlatRate
                        ? formatCurrency(orderDraft.totals.shipping)
                        : 'Pending / none'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Tax</span>
                  <span style={{ color: orderDraft.totals.tax > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                    {orderDraft.totals.tax > 0 ? formatCurrency(orderDraft.totals.tax) : 'Pending / none'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px' }}>
                  <span>Total</span>
                  <strong>{formatCurrency(orderDraft.totals.total)}</strong>
                </div>
                {hasFlatRate && checkoutSettings?.freeShippingEnabled ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                    Orders over {formatCurrency(Number(checkoutSettings.freeShippingThreshold || '0'))} ship free.
                  </div>
                ) : null}
                {orderDraft.metadata.appliedPromotions?.length ? (
                  <div style={{ display: 'grid', gap: '5px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                    {orderDraft.metadata.appliedPromotions.map((promo) => (
                      <div key={promo.id}>{promo.title}</div>
                    ))}
                  </div>
                ) : null}
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '14px', display: 'grid', gap: '12px' }}>
                <div className="section-label">Choose Payment Method</div>
                <div style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  Choose how you want to pay before placing your order.
                </div>
                <div className="payment-method-options" role="radiogroup" aria-label="Payment method">
                  {paymentMethodOptions.map((method) => {
                    const selected = form.paymentMethod === method.method
                    return (
                      <button
                        key={method.method}
                      type="button"
                      className={`payment-method-option payment-method-${method.method}`}
                        data-selected={selected}
                        role="radio"
                        aria-checked={selected}
                        onClick={() => update('paymentMethod', method.method)}
                      >
                        <span style={{ display: 'grid', gap: '4px' }}>
                          <strong style={{ color: 'inherit' }}>{method.label}</strong>
                          <span style={{ color: 'inherit', opacity: 0.9, fontSize: '13px' }}>
                            {method.destination || 'Payment instructions shown next'}
                          </span>
                        </span>
                        {selected ? <span aria-hidden="true" style={{ fontSize: '20px', fontWeight: 800 }}>✓</span> : null}
                      </button>
                    )
                  })}
                </div>
                <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                  Payment instructions for <strong>{selectedPaymentInstructions.label}</strong> appear after you place the order.
                </p>
              </div>

              <Link href="/cart" className="fm-btn-outline" style={{ textAlign: 'center' }}>
                Back to cart
              </Link>
              <button
                type="button"
                className="fm-btn-outline"
                onClick={handleSubmitManualOrder}
                disabled={submissionState === 'submitting' || !authUser || quoteLoading || quoteErrors.length > 0}
                style={{ opacity: submissionState === 'submitting' || !authUser || quoteLoading || quoteErrors.length > 0 ? 0.7 : 1 }}
              >
                {submissionState === 'submitting'
                  ? 'Preparing payment step...'
                  : quoteLoading
                    ? 'Refreshing total...'
                  : authUser
                    ? 'Place order and continue to payment'
                    : 'Create account to continue'}
              </button>
              {submissionNote ? (
                <div style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>{submissionNote}</div>
              ) : null}
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
