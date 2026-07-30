'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useCart } from '@/components/CartProvider'
import { formatCurrency } from '@/lib/cart'
import { getPromoEffectivePercent, promoMatchesVialCase, type SitePromoRecord } from '@/lib/site-promos'
import type { VialCaseImage, VialCaseRecord } from '@/lib/vial-cases'

type VialCaseCatalogProps = {
  vialCases: VialCaseRecord[]
  promos: SitePromoRecord[]
}

function getCaseInitials(name: string) {
  const parts = name
    .replace(/\bct\b/gi, 'count')
    .split(/\s+/)
    .filter(Boolean)

  const numeric = parts.find((part) => /\d/.test(part))
  const word = parts.find((part) => /^[a-z]/i.test(part) && !/\d/.test(part))
  return [numeric, word?.slice(0, 1)].filter(Boolean).join(' ')
}

function withVersion(url: string, version?: string) {
  if (!version) return url
  return `${url}${url.includes('?') ? '&' : '?'}v=${encodeURIComponent(version)}`
}

function getImages(vialCase: VialCaseRecord): VialCaseImage[] {
  if (vialCase.images.length > 0) return vialCase.images
  return vialCase.imageUrl
    ? [{ id: 'front', url: vialCase.imageUrl, label: 'Front', isPrimary: true, sortOrder: 0 }]
    : []
}

function getBestCasePromo(vialCase: VialCaseRecord, promos: SitePromoRecord[]) {
  return promos
    .filter((promo) => promoMatchesVialCase(promo, vialCase.id))
    .filter((promo) => promo.discountType === 'percentage' || promo.discountType === 'bogo')
    .sort((a, b) => getPromoEffectivePercent(b) - getPromoEffectivePercent(a))[0]
}

function VialCaseCard({ vialCase, promos }: { vialCase: VialCaseRecord; promos: SitePromoRecord[] }) {
  const { addItem } = useCart()
  const images = getImages(vialCase)
  const primaryImage = images.find((image) => image.isPrimary) ?? images[0]
  const [selectedImageId, setSelectedImageId] = useState(primaryImage?.id ?? '')
  const [quantity, setQuantity] = useState(1)
  const [addedMessage, setAddedMessage] = useState('')
  const selectedImage = images.find((image) => image.id === selectedImageId) ?? primaryImage
  const selectedImageIndex = Math.max(0, images.findIndex((image) => image.id === selectedImage?.id))
  const displayPromo = promos.find((promo) => promo.placements.includes('product') && promoMatchesVialCase(promo, vialCase.id))
  const discountPromo = getBestCasePromo(vialCase, promos)
  const isPercentage = discountPromo?.discountType === 'percentage' && Boolean(discountPromo.discountPercent)
  const isBogo = discountPromo?.discountType === 'bogo'
  const discountedPrice = isPercentage
    ? Math.max(0, vialCase.priceAmount * (1 - (discountPromo?.discountPercent ?? 0) / 100))
    : null
  const bogoGroupSize = (discountPromo?.buyQuantity ?? 1) + (discountPromo?.getQuantity ?? 1)
  const fulfillmentQuantity = isBogo ? quantity * bogoGroupSize : quantity
  const freeQuantity = isBogo ? quantity * (discountPromo?.getQuantity ?? 1) : 0
  const canAddToCart = Number.isFinite(vialCase.priceAmount) && vialCase.priceAmount > 0

  function updateQuantity(nextQuantity: number) {
    setQuantity(Math.max(1, nextQuantity))
    setAddedMessage('')
  }

  function showAdjacentImage(direction: -1 | 1) {
    if (images.length < 2) return
    const nextIndex = (selectedImageIndex + direction + images.length) % images.length
    setSelectedImageId(images[nextIndex].id)
  }

  function addCaseToCart() {
    if (!canAddToCart) return

    addItem({
      itemType: 'vial_case',
      sourceId: vialCase.id,
      slug: vialCase.id,
      displayName: vialCase.name,
      option: 'case',
      optionLabel: 'Vial Case',
      price: formatCurrency(vialCase.priceAmount),
      quantity: fulfillmentQuantity,
      imageUrl: selectedImage?.url || vialCase.imageUrl,
    })
    setAddedMessage(
      isBogo
        ? `Added ${fulfillmentQuantity} cases (${freeQuantity} free)`
        : 'Added to cart',
    )
  }

  return (
    <article
      style={{
        background:
          'linear-gradient(165deg, rgba(38,82,145,0.92), rgba(26,62,116,0.90))',
        border: '1px solid rgba(140,175,225,0.22)',
        borderRadius: '16px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100%',
        color: 'var(--text-primary)',
      }}
    >
      <div
        style={{
          position: 'relative',
          aspectRatio: '16 / 10',
          background: 'rgba(9, 29, 68, 0.42)',
          borderBottom: '1px solid rgba(140,175,225,0.18)',
          display: 'grid',
          placeItems: 'center',
          overflow: 'hidden',
        }}
      >
        {selectedImage?.url ? (
          <Image
            src={withVersion(selectedImage.url, vialCase.updatedAt)}
            alt={selectedImage.label || vialCase.name}
            fill
            sizes="(max-width: 760px) 100vw, (max-width: 1180px) 33vw, 280px"
            unoptimized
            style={{ objectFit: 'contain', padding: '10px' }}
          />
        ) : (
          <div
            aria-label={`${vialCase.name} image placeholder`}
            style={{
              width: '88px',
              height: '88px',
              borderRadius: '8px',
              border: '1px solid rgba(140,175,225,0.26)',
              background: 'rgba(255,255,255,0.08)',
              display: 'grid',
              placeItems: 'center',
              color: 'var(--accent-500)',
              fontFamily: 'var(--font-mono)',
              fontSize: '20px',
              fontWeight: 700,
            }}
          >
            {getCaseInitials(vialCase.name) || 'VC'}
          </div>
        )}
        {images.length > 1 ? (
          <>
            <button
              type="button"
              aria-label={`View previous image for ${vialCase.name}`}
              onClick={() => showAdjacentImage(-1)}
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '34px',
                height: '34px',
                borderRadius: '999px',
                border: '1px solid rgba(140,175,225,0.36)',
                background: 'rgba(8, 24, 55, 0.72)',
                color: '#ffffff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <ChevronLeft size={18} aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label={`View next image for ${vialCase.name}`}
              onClick={() => showAdjacentImage(1)}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '34px',
                height: '34px',
                borderRadius: '999px',
                border: '1px solid rgba(140,175,225,0.36)',
                background: 'rgba(8, 24, 55, 0.72)',
                color: '#ffffff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <ChevronRight size={18} aria-hidden="true" />
            </button>
            <span
              aria-label={`Image ${selectedImageIndex + 1} of ${images.length}`}
              style={{
                position: 'absolute',
                right: '10px',
                bottom: '10px',
                borderRadius: '999px',
                border: '1px solid rgba(140,175,225,0.36)',
                background: 'rgba(8, 24, 55, 0.72)',
                color: 'rgba(230,240,255,0.82)',
                padding: '5px 8px',
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                lineHeight: 1,
              }}
            >
              {selectedImageIndex + 1} / {images.length}
            </span>
          </>
        ) : null}
      </div>

      <div
        style={{
          padding: '16px',
          display: 'flex',
          flex: 1,
          flexDirection: 'column',
          gap: '14px',
          background: 'linear-gradient(180deg, rgba(35, 78, 140, 0.38), rgba(28, 67, 126, 0.16))',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div style={{ display: 'grid', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <span className="badge badge-blue">Vial Case</span>
            {displayPromo ? (
              <span className="badge badge-amber">{displayPromo.badgeLabel || displayPromo.title}</span>
            ) : null}
          </div>
          <h2 style={{ margin: 0, fontSize: '18px', lineHeight: 1.25 }}>{vialCase.name}</h2>
          {displayPromo?.detail ? (
            <p style={{ margin: 0, color: 'var(--accent-500)', fontSize: '13px', lineHeight: 1.6 }}>
              {displayPromo.detail}
            </p>
          ) : null}
          {vialCase.description ? (
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.6 }}>
              {vialCase.description}
            </p>
          ) : null}
          {isBogo ? (
            <p style={{ margin: 0, color: 'var(--accent-500)', fontSize: '13px', lineHeight: 1.6 }}>
              Buy {discountPromo.buyQuantity}, get {discountPromo.getQuantity} free. Free units are added automatically.
            </p>
          ) : null}
        </div>

        {images.length > 1 ? (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {images.map((image) => (
              <button
                key={image.id}
                type="button"
                aria-label={`View ${image.label || vialCase.name} image`}
                onClick={() => setSelectedImageId(image.id)}
                style={{
                  position: 'relative',
                  width: '48px',
                  height: '48px',
                  borderRadius: '6px',
                  border: image.id === selectedImage?.id ? '1px solid var(--accent-400)' : '1px solid var(--border)',
                  background: 'rgba(255,255,255,0.10)',
                  overflow: 'hidden',
                  cursor: 'pointer',
                }}
              >
                <Image
                  src={withVersion(image.url, vialCase.updatedAt)}
                  alt=""
                  fill
                  sizes="48px"
                  unoptimized
                  style={{ objectFit: 'contain' }}
                />
              </button>
            ))}
          </div>
        ) : null}

        <div
          style={{
            display: 'grid',
            gap: '12px',
            marginTop: 'auto',
            paddingTop: '12px',
            borderTop: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'baseline' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Price</span>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {discountedPrice !== null ? (
                <span style={{ color: 'var(--text-muted)', fontSize: '13px', textDecoration: 'line-through' }}>
                  {formatCurrency(vialCase.priceAmount)}
                </span>
              ) : null}
              <strong style={{ color: 'var(--text-primary)', fontSize: '16px' }}>
                {discountedPrice !== null ? formatCurrency(discountedPrice) : vialCase.priceLabel}
              </strong>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <button type="button" className="fm-btn-outline" style={{ padding: '8px 10px', minWidth: '36px' }} onClick={() => updateQuantity(quantity - 1)}>
                -
              </button>
              <span style={{ minWidth: '22px', textAlign: 'center', fontWeight: 700 }}>{quantity}</span>
              <button type="button" className="fm-btn-outline" style={{ padding: '8px 10px', minWidth: '36px' }} onClick={() => updateQuantity(quantity + 1)}>
                +
              </button>
            </div>
            <button type="button" className="fm-btn-primary" onClick={addCaseToCart} disabled={!canAddToCart} style={{ padding: '10px 14px' }}>
              {canAddToCart ? 'Add case to cart' : 'Price pending'}
            </button>
          </div>
          {addedMessage ? (
            <div aria-live="polite" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', color: 'var(--accent-500)', fontSize: '12px' }}>
              <span>{addedMessage}</span>
              <Link href="/cart" style={{ color: 'var(--accent-500)', fontWeight: 700 }}>
                View cart
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  )
}

export function VialCaseCatalog({ vialCases, promos }: VialCaseCatalogProps) {
  if (vialCases.length === 0) {
    return (
      <div style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
        Vial case products are being updated.
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
      {vialCases.map((vialCase) => (
        <VialCaseCard key={vialCase.id} vialCase={vialCase} promos={promos} />
      ))}
    </div>
  )
}
