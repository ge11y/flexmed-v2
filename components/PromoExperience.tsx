'use client'

import Image from 'next/image'
import { X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { getPromoOfferLabel, getPromoTargetLabel, type PromoDisplayCopy } from '@/lib/promo-display'
import type { SitePromoRecord } from '@/lib/site-promos'

const POPUP_STORAGE_PREFIX = 'flexmed_promo_popup_v1'
type PromoWithDisplay = SitePromoRecord & Partial<PromoDisplayCopy>

function getDisplayOfferLabel(promo: PromoWithDisplay) {
  const fallback = getPromoOfferLabel(promo)
  return promo.offerLabel || (fallback === 'Announcement' ? '' : fallback)
}

function getDisplayTargetLabel(promo: PromoWithDisplay) {
  return promo.targetLabel || getPromoTargetLabel(promo)
}

export function PromoExperience({ enabled }: { enabled: boolean }) {
  const [promos, setPromos] = useState<PromoWithDisplay[]>([])
  const [popupOpen, setPopupOpen] = useState(false)
  const [bannerIndex, setBannerIndex] = useState(0)
  const bannerRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!enabled) return
    let active = true

    async function loadPromos() {
      try {
        const response = await fetch('/api/promos', { cache: 'no-store' })
        const result = (await response.json()) as { ok?: boolean; promos?: PromoWithDisplay[] }
        if (active && response.ok && result.ok) setPromos(result.promos ?? [])
      } catch {
        if (active) setPromos([])
      }
    }

    void loadPromos()
    return () => {
      active = false
    }
  }, [enabled])

  const bannerPromos = useMemo(
    () => promos.filter((promo) => promo.placements.includes('banner')),
    [promos],
  )
  const banner = bannerPromos.length > 0 ? bannerPromos[bannerIndex % bannerPromos.length] : null
  const popup = useMemo(
    () => promos.find((promo) => promo.placements.includes('popup')) ?? null,
    [promos],
  )

  useEffect(() => {
    if (bannerPromos.length <= 1) return
    const timer = window.setInterval(() => {
      setBannerIndex((current) => (current + 1) % bannerPromos.length)
    }, 5200)
    return () => window.clearInterval(timer)
  }, [bannerPromos.length])

  useEffect(() => {
    const root = document.documentElement
    if (!banner) {
      root.style.setProperty('--promo-banner-offset', '0px')
      return () => {
        root.style.setProperty('--promo-banner-offset', '0px')
      }
    }

    const updateOffset = () => {
      const height = bannerRef.current?.getBoundingClientRect().height ?? 0
      root.style.setProperty('--promo-banner-offset', `${Math.ceil(height)}px`)
    }

    updateOffset()
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateOffset) : null
    if (observer && bannerRef.current) observer.observe(bannerRef.current)
    window.addEventListener('resize', updateOffset)

    return () => {
      observer?.disconnect()
      window.removeEventListener('resize', updateOffset)
      root.style.setProperty('--promo-banner-offset', '0px')
    }
  }, [banner])

  useEffect(() => {
    if (!enabled || !popup) return

    const version = popup.updatedAt || popup.createdAt || 'initial'
    const storageKey = `${POPUP_STORAGE_PREFIX}:${popup.id}:${version}`
    try {
      if (window.localStorage.getItem(storageKey)) return
      window.localStorage.setItem(storageKey, new Date().toISOString())
    } catch {
      // The dialog can still be shown when storage is unavailable.
    }
    const timeout = window.setTimeout(() => setPopupOpen(true), 0)
    return () => window.clearTimeout(timeout)
  }, [enabled, popup])

  useEffect(() => {
    if (!popupOpen) return
    closeButtonRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPopupOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [popupOpen])

  return (
    <>
      <style>{`
        @keyframes flexmed-promo-slide-in {
          from { opacity: 0; transform: translateX(18px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .flexmed-promo-banner-copy {
            animation: none !important;
          }
        }
      `}</style>
      {banner ? (
        <div
          ref={bannerRef}
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            top: 'var(--site-nav-height, 68px)',
            left: 0,
            right: 0,
            zIndex: 45,
            minHeight: '42px',
            padding: '8px 48px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '9px',
            textAlign: 'center',
            background: 'var(--accent-500)',
            color: '#fff',
            fontSize: '13px',
            lineHeight: 1.4,
          }}
        >
	          {(() => {
	            const offerLabel = getDisplayOfferLabel(banner)
	            const targetLabel = getDisplayTargetLabel(banner)
	            const primary = banner.badgeLabel || offerLabel || banner.title
	            const showTitle = banner.title && banner.title !== primary
	            const targetCopy = targetLabel && targetLabel !== 'sitewide' ? `on ${targetLabel}` : ''
	            return (
	              <div
                key={banner.id}
                className="flexmed-promo-banner-copy"
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '9px',
                  animation: 'flexmed-promo-slide-in 360ms cubic-bezier(0.16, 1, 0.3, 1)',
                }}
	              >
	                <strong>{primary}</strong>
	                {showTitle ? <span style={{ opacity: 0.92 }}>{banner.title}</span> : null}
	                {targetCopy ? <span style={{ opacity: 0.92 }}>{targetCopy}</span> : null}
	                {banner.detail ? <span style={{ opacity: 0.74 }}>{banner.detail}</span> : null}
	                {bannerPromos.length > 1 ? (
                  <span style={{ opacity: 0.72 }}>
                    {bannerIndex % bannerPromos.length + 1}/{bannerPromos.length}
                  </span>
                ) : null}
              </div>
            )
          })()}
        </div>
      ) : null}

      {enabled && popupOpen && popup ? (
        <div
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setPopupOpen(false)
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 160,
            display: 'grid',
            placeItems: 'center',
            padding: '24px',
            background: 'rgba(14, 18, 28, 0.62)',
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="promo-popup-title"
            aria-describedby={popup.detail ? 'promo-popup-detail' : undefined}
            style={{
              width: 'min(520px, 100%)',
              borderRadius: '12px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-strong)',
              padding: popup.popupImageUrl ? '0 0 24px' : '24px',
              display: 'grid',
              gap: '16px',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 8px 28px rgba(18, 24, 40, 0.22)',
            }}
          >
            <button
              ref={closeButtonRef}
              type="button"
              aria-label="Close promotion"
              title="Close"
              onClick={() => setPopupOpen(false)}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--bg-card)',
                color: 'var(--text-secondary)',
                display: 'grid',
                placeItems: 'center',
                cursor: 'pointer',
                zIndex: 2,
              }}
            >
              <X size={18} aria-hidden="true" />
            </button>
            {popup.popupImageUrl ? (
              <div
                style={{
                  aspectRatio: '16 / 9',
                  background: 'linear-gradient(135deg, #102d5f, #0f7678)',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <Image
                  src={popup.popupImageUrl}
                  alt=""
                  fill
                  sizes="min(520px, 100vw)"
                  unoptimized
                  style={{ objectFit: 'cover' }}
                />
              </div>
            ) : null}
            <div style={{ display: 'grid', gap: '16px', padding: popup.popupImageUrl ? '0 24px' : 0 }}>
            {popup.badgeLabel ? (
              <span className="badge badge-blue" style={{ width: 'fit-content' }}>{popup.badgeLabel}</span>
            ) : null}
            <h2 id="promo-popup-title" style={{ margin: 0, paddingRight: '36px', fontSize: '26px' }}>
              {popup.title}
            </h2>
            {popup.detail ? (
              <p id="promo-popup-detail" style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                {popup.detail}
              </p>
            ) : null}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {getDisplayOfferLabel(popup) ? <span className="badge badge-amber">{getDisplayOfferLabel(popup)}</span> : null}
              {getDisplayTargetLabel(popup) ? <span className="badge badge-muted">{getDisplayTargetLabel(popup)}</span> : null}
            </div>
            <button type="button" className="fm-btn-primary" onClick={() => setPopupOpen(false)}>
              Continue shopping
            </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
