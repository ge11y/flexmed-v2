'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { getAdminBackendLabel } from '@/lib/admin-backend'
import { loadSeenOrderIds } from '@/lib/admin-notifications'
import type { ManualOrderSubmission } from '@/lib/manual-orders'

const ADMIN_LINKS = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/inventory', label: 'Inventory' },
  { href: '/admin/supply', label: 'Supply' },
  { href: '/admin/vial-cases', label: 'Vial Cases' },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/clients', label: 'Clients' },
  { href: '/admin/affiliates', label: 'Affiliates' },
  { href: '/admin/business', label: 'Business Details' },
  { href: '/admin/emails', label: 'Emails' },
  { href: '/admin/promos', label: 'Promos' },
  { href: '/admin/inbox', label: 'Inbox' },
]

interface AdminShellProps {
  active: string
  title: string
  description: string
  purpose?: string
  workflow?: string[]
  teamNotes?: string[]
  children: ReactNode
}

export function AdminShell({ active, title, description, purpose, workflow, teamNotes, children }: AdminShellProps) {
  const backendLabel = getAdminBackendLabel()
  const [unseenOrderCount, setUnseenOrderCount] = useState(0)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    let activeSession = true
    const seen = () => new Set(loadSeenOrderIds())

    function applyUnseenCount(orders: ManualOrderSubmission[]) {
      const unseen = orders.filter((order) => order.status !== 'fulfilled' && !seen().has(order.id)).length
      setUnseenOrderCount(unseen)
    }

    async function loadOrderNotifications() {
      try {
        const response = await fetch('/api/admin/orders', { cache: 'no-store' })
        const result = (await response.json()) as { ok: boolean; orders?: ManualOrderSubmission[] }
        if (!activeSession || !response.ok || !result.ok) return
        applyUnseenCount(result.orders ?? [])
      } catch {
        if (activeSession) setUnseenOrderCount(0)
      }
    }

    function handleOrdersUpdated(event: Event) {
      const customEvent = event as CustomEvent<{ orders?: ManualOrderSubmission[] }>
      if (customEvent.detail?.orders) {
        applyUnseenCount(customEvent.detail.orders)
        return
      }
      void loadOrderNotifications()
    }

    void loadOrderNotifications()
    const interval = window.setInterval(loadOrderNotifications, 15000)
    window.addEventListener('admin-seen-orders-updated', loadOrderNotifications)
    window.addEventListener('admin-orders-updated', handleOrdersUpdated)

    return () => {
      activeSession = false
      window.clearInterval(interval)
      window.removeEventListener('admin-seen-orders-updated', loadOrderNotifications)
      window.removeEventListener('admin-orders-updated', handleOrdersUpdated)
    }
  }, [active])

  const links = useMemo(
    () =>
      ADMIN_LINKS.map((item) => ({
        ...item,
        badge: item.href === '/admin/orders' ? unseenOrderCount : 0,
      })),
    [unseenOrderCount],
  )

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' })
      window.location.href = '/admin/login'
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <div className="admin-shell-root" style={{ background: 'var(--bg-base)', minHeight: '100vh', padding: '36px 40px 72px' }}>
      <style jsx global>{`
        @keyframes adminPulse {
          0% {
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.55);
          }
          70% {
            box-shadow: 0 0 0 8px rgba(239, 68, 68, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
          }
        }
        @media (max-width: 760px) {
          .admin-shell-root {
            padding: 20px 16px 56px !important;
          }
          .admin-workspace-nav {
            position: static !important;
            top: auto !important;
            backdrop-filter: none !important;
          }
        }
      `}</style>

      <div style={{ maxWidth: '1480px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
        <div
          className="card admin-workspace-nav"
          style={{
            padding: '18px 22px',
            display: 'grid',
            gap: '18px',
            position: 'sticky',
            top: '20px',
            zIndex: 20,
            backdropFilter: 'blur(14px)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'grid', gap: '6px' }}>
              <div className="section-label">Admin Workspace</div>
              <div style={{ color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: '760px' }}>
                Move between the storefront controls, CRM, orders, promos, and payment review from this top workspace header.
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div
                style={{
                  borderRadius: '999px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-elevated)',
                  padding: '10px 14px',
                  color: 'var(--text-muted)',
                  fontSize: '13px',
                }}
              >
                {backendLabel}
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="fm-btn-outline"
                disabled={loggingOut}
                style={{ minWidth: '120px', justifyContent: 'center' }}
              >
                {loggingOut ? 'Signing Out...' : 'Sign Out'}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            {links.map((item) => {
              const isActive = active === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    borderRadius: '999px',
                    border: isActive ? '1px solid var(--accent-400)' : '1px solid var(--border)',
                    background: isActive ? 'rgba(42,79,174,0.08)' : 'var(--bg-card)',
                    color: isActive ? 'var(--accent-500)' : 'var(--text-secondary)',
                    padding: '10px 14px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    letterSpacing: '0.04em',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  {item.label}
                  {item.badge ? (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        borderRadius: '999px',
                        background: 'rgba(217, 45, 32, 0.12)',
                        color: '#b42318',
                        padding: '3px 8px',
                        fontSize: '11px',
                        fontWeight: 700,
                      }}
                    >
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '999px',
                          background: '#ef4444',
                          boxShadow: '0 0 0 0 rgba(239, 68, 68, 0.55)',
                          animation: 'adminPulse 1.8s infinite',
                        }}
                      />
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              )
            })}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div className="section-label">Admin</div>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 44px)', margin: 0 }}>{title}</h1>
          <p style={{ margin: 0, maxWidth: '920px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{description}</p>
        </div>

        {(purpose || (workflow && workflow.length > 0) || (teamNotes && teamNotes.length > 0)) && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            <div className="card" style={{ padding: '20px', display: 'grid', gap: '10px' }}>
              <div className="section-label">What This Page Is For</div>
              <div style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                {purpose || 'Manage this part of the storefront and keep the public site current.'}
              </div>
            </div>

            <div className="card" style={{ padding: '20px', display: 'grid', gap: '10px' }}>
              <div className="section-label">Typical Workflow</div>
              <div style={{ display: 'grid', gap: '8px' }}>
                {(workflow && workflow.length > 0
                  ? workflow
                  : ['Review the records on this page.', 'Make needed updates.', 'Confirm the current status before moving on.']).map(
                  (item, index) => (
                    <div key={`${item}-${index}`} style={{ display: 'grid', gridTemplateColumns: '28px minmax(0, 1fr)', gap: '10px', alignItems: 'start' }}>
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '999px',
                          background: 'rgba(42,79,174,0.08)',
                          color: 'var(--accent-500)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '12px',
                        }}
                      >
                        {index + 1}
                      </div>
                      <div style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>{item}</div>
                    </div>
                  ),
                )}
              </div>
            </div>

            <div className="card" style={{ padding: '20px', display: 'grid', gap: '10px' }}>
              <div className="section-label">Team Tips</div>
              <div style={{ display: 'grid', gap: '8px' }}>
                {(teamNotes && teamNotes.length > 0
                  ? teamNotes
                  : ['Keep statuses current so the rest of the team can trust the queue.', 'Use notes fields for exceptions or follow-up.']).map((item) => (
                  <div key={item} style={{ display: 'flex', gap: '10px', alignItems: 'start' }}>
                    <span style={{ color: 'var(--accent-500)', fontSize: '15px', lineHeight: 1.4 }}>•</span>
                    <span style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {children}
      </div>
    </div>
  )
}
