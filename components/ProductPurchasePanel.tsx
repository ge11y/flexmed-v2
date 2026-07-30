'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useCart } from '@/components/CartProvider'
import { type CartItem, formatCurrency, parseCurrency } from '@/lib/cart'

type PurchaseOption = {
  key: 'vial'
  label: string
  price: string
}

type PurchaseVariant = {
  slug: string
  displayName: string
  variantLabel?: string
  strength?: number
  unit?: string
  priceVial?: string
  status?: 'in_stock' | 'incoming' | 'out_of_stock'
  inventoryOnHand?: number | null
  lowStockThreshold?: number | null
  promoLabel?: string
  promoDetail?: string
  promoDiscountType?: 'percentage' | 'bogo' | 'free_shipping' | 'announcement'
  promoBuyQuantity?: number
  promoGetQuantity?: number
  promoDiscountedPrice?: number | null
}

function hasPurchasablePrice(value?: string) {
  return Boolean(value && parseCurrency(value) !== null)
}

function formatVariantPrice(value?: string) {
  const numeric = parseCurrency(value)
  return numeric === null ? value ?? 'Pending' : formatCurrency(numeric)
}

function formatStrengthLabel(value?: string) {
  return String(value ?? '')
    .trim()
    .replace(/^(\d+(?:\.\d+)?)([a-zA-Z]+)/, '$1 $2')
}

type ProductPurchasePanelProps = {
  slug: string
  displayName: string
  priceVial?: string
  status?: 'in_stock' | 'incoming' | 'out_of_stock'
  inventoryOnHand?: number | null
  lowStockThreshold?: number | null
  promoLabel?: string
  promoDetail?: string
  promoDiscountType?: 'percentage' | 'bogo' | 'free_shipping' | 'announcement'
  promoBuyQuantity?: number
  promoGetQuantity?: number
  promoDiscountedPrice?: number | null
  familyVariants?: PurchaseVariant[]
}

export function ProductPurchasePanel({
  slug,
  displayName,
  priceVial,
  status = 'in_stock',
  inventoryOnHand = null,
  lowStockThreshold = null,
  promoLabel,
  promoDetail,
  promoDiscountType,
  promoBuyQuantity,
  promoGetQuantity,
  promoDiscountedPrice,
  familyVariants = [],
}: ProductPurchasePanelProps) {
  const { addItem } = useCart()
  const getVariantStrengthLabel = (variant: PurchaseVariant) => {
    if (variant.variantLabel?.trim()) {
      return formatStrengthLabel(variant.variantLabel)
    }
    if (typeof variant.strength === 'number' && variant.unit) {
      return `${variant.strength} ${variant.unit}`.trim()
    }
    return variant.variantLabel ?? variant.displayName
  }
  const variantChoices = useMemo(() => {
    if (familyVariants.length > 1) {
      return familyVariants
    }

    if (hasPurchasablePrice(priceVial)) {
      return [
        {
          slug,
          displayName,
          priceVial,
        },
      ]
    }

    return []
  }, [displayName, familyVariants, priceVial, slug])

  const [quantity, setQuantity] = useState(1)
  const [addedMessage, setAddedMessage] = useState('')
  const selectedVariant = variantChoices.find((variant) => variant.slug === slug) ?? variantChoices[0]

  const selectedStatus = selectedVariant?.status ?? status
  const selectedInventoryOnHand = selectedVariant?.inventoryOnHand ?? inventoryOnHand
  const selectedLowStockThreshold = selectedVariant?.lowStockThreshold ?? lowStockThreshold
  const selectedPromoLabel = selectedVariant?.promoLabel ?? promoLabel
  const selectedPromoDetail = selectedVariant?.promoDetail ?? promoDetail
  const selectedPromoDiscountType = selectedVariant?.promoDiscountType ?? promoDiscountType
  const selectedPromoBuyQuantity = selectedVariant?.promoBuyQuantity ?? promoBuyQuantity ?? 1
  const selectedPromoGetQuantity = selectedVariant?.promoGetQuantity ?? promoGetQuantity ?? 1
  const selectedPromoDiscountedPrice = selectedVariant?.promoDiscountedPrice ?? promoDiscountedPrice
  const lowStock =
    selectedStatus === 'in_stock' &&
    selectedInventoryOnHand !== null &&
    selectedInventoryOnHand !== undefined &&
    selectedLowStockThreshold !== null &&
    selectedLowStockThreshold !== undefined &&
    selectedInventoryOnHand <= selectedLowStockThreshold

  const options = useMemo<PurchaseOption[]>(() => {
    if (!selectedVariant) return []

    const next: PurchaseOption[] = []
    if (hasPurchasablePrice(selectedVariant.priceVial)) {
      next.push({ key: 'vial', label: 'Per vial', price: selectedVariant.priceVial as string })
    }
    return next
  }, [selectedVariant])

  const [selectedOption, setSelectedOption] = useState<'vial'>(options[0]?.key ?? 'vial')

  if (variantChoices.length === 0 || !selectedVariant) {
    return (
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            color: 'var(--text-muted)',
            lineHeight: 1.7,
          }}
        >
          Pricing is being finalized for this listing.
        </p>
      </div>
    )
  }

  const selectedVariantHasPricing = options.length > 0
  const activeOption = options.find((option) => option.key === selectedOption) ?? options[0]
  const activeNumericPrice = activeOption ? parseCurrency(activeOption.price) : null
  const bogoGroupSize = selectedPromoBuyQuantity + selectedPromoGetQuantity
  const isBogo = selectedPromoDiscountType === 'bogo'
  const fulfillmentQuantity = isBogo ? quantity * bogoGroupSize : quantity
  const paidQuantity = isBogo ? quantity * selectedPromoBuyQuantity : quantity
  const displayedUnitPrice =
    selectedPromoLabel &&
    selectedPromoDiscountType === 'percentage' &&
    typeof selectedPromoDiscountedPrice === 'number'
      ? selectedPromoDiscountedPrice
      : activeNumericPrice
  const subtotal = displayedUnitPrice !== null
    ? formatCurrency(displayedUnitPrice * paidQuantity)
    : null
  const canPurchase =
    selectedVariantHasPricing &&
    selectedStatus === 'in_stock' &&
    (selectedInventoryOnHand === null ||
      selectedInventoryOnHand === undefined ||
      selectedInventoryOnHand >= fulfillmentQuantity)

  function updateQuantity(nextQuantity: number) {
    setQuantity(Math.max(1, nextQuantity))
    setAddedMessage('')
  }

  function handleAddToCart() {
    if (!canPurchase || !activeOption) return

    const nextItem: CartItem = {
      slug: selectedVariant.slug,
      displayName: selectedVariant.displayName,
      strengthLabel: getVariantStrengthLabel(selectedVariant),
      option: activeOption.key,
      optionLabel: activeOption.label,
      price: activeOption.price,
      quantity: fulfillmentQuantity,
    }

    addItem(nextItem)
    setAddedMessage(
      isBogo
        ? `Added ${fulfillmentQuantity} units (${quantity * selectedPromoGetQuantity} free)`
        : 'Added to cart',
    )
  }

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
          }}
        >
          Pricing & Quantity
        </div>
        <div
          style={{
            fontSize: '14px',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
          }}
        >
          Review the current listed price, choose quantity, and add this item to your cart.
        </div>
      </div>

      {(selectedPromoLabel || selectedInventoryOnHand !== null || selectedStatus !== 'in_stock') && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            padding: '14px',
            borderRadius: '14px',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {selectedPromoLabel ? <span className="badge badge-amber">{selectedPromoLabel}</span> : null}
            {lowStock ? <span className="badge badge-amber">Low Stock</span> : null}
            {selectedStatus === 'incoming' ? <span className="badge badge-amber">Incoming</span> : null}
            {selectedStatus === 'out_of_stock' ? <span className="badge badge-muted">Out of Stock</span> : null}
          </div>
          {selectedPromoDetail ? (
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{selectedPromoDetail}</div>
          ) : null}
          {selectedPromoDiscountType === 'bogo' ? (
            <div style={{ fontSize: '13px', color: '#047857', lineHeight: 1.6 }}>
              Buy {selectedPromoBuyQuantity}, get {selectedPromoGetQuantity} free. Free units are added to the cart automatically.
            </div>
          ) : null}
          {selectedInventoryOnHand !== null && selectedInventoryOnHand !== undefined ? (
            <div style={{ fontSize: '13px', color: lowStock ? 'var(--amber)' : 'var(--text-secondary)' }}>
              {lowStock ? `Only ${selectedInventoryOnHand} currently available.` : `${selectedInventoryOnHand} currently available.`}
            </div>
          ) : null}
        </div>
      )}

      {variantChoices.length > 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              letterSpacing: '0.08em',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
            }}
          >
            Available strengths
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {variantChoices.map((variant) => {
              const isActive = variant.slug === selectedVariant.slug
              const previewPrice = variant.priceVial
              const previewStatus = variant.status ?? 'in_stock'
              const previewInventory = variant.inventoryOnHand
              const previewLowStock =
                previewStatus === 'in_stock' &&
                previewInventory !== null &&
                previewInventory !== undefined &&
                variant.lowStockThreshold !== null &&
                variant.lowStockThreshold !== undefined &&
                previewInventory <= variant.lowStockThreshold

              return (
                <Link
                  key={variant.slug}
                  href={`/products/${variant.slug}`}
                  style={{
                    display: 'inline-flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: '4px',
                    minWidth: '110px',
                    padding: '12px 14px',
                    borderRadius: '14px',
                    border: isActive ? '1px solid var(--accent-400)' : '1px solid var(--border)',
                    background: isActive ? 'rgba(42, 79, 174, 0.08)' : 'var(--bg-elevated)',
                    cursor: 'pointer',
                    textDecoration: 'none',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      letterSpacing: '0.05em',
                      color: isActive ? 'var(--accent-500)' : 'var(--text-muted)',
                      textTransform: 'uppercase',
                    }}
                  >
                    {getVariantStrengthLabel(variant)}
                  </span>
                  <span
                    style={{
                      fontSize: '15px',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                    }}
                  >
                    {formatVariantPrice(previewPrice)}
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      color:
                        previewStatus === 'out_of_stock'
                          ? 'var(--text-muted)'
                          : previewLowStock
                            ? 'var(--amber)'
                            : 'var(--text-secondary)',
                    }}
                  >
                    {previewStatus === 'incoming'
                      ? 'Incoming'
                      : previewStatus === 'out_of_stock'
                        ? 'Out of Stock'
                        : previewInventory !== null && previewInventory !== undefined
                          ? `${previewInventory} available`
                          : 'In Stock'}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {!selectedVariantHasPricing && (
        <div
          style={{
            borderRadius: '14px',
            border: '1px solid var(--border)',
            background: 'var(--bg-elevated)',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              letterSpacing: '0.08em',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
            }}
          >
            Pricing Pending
          </span>
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            This strength is listed and tracked, but its individual price has not been finalized yet.
          </span>
        </div>
      )}

      {options.length > 1 && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {options.map((option) => {
            const isActive = option.key === activeOption.key
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => {
                  setSelectedOption(option.key)
                  setAddedMessage('')
                }}
                style={{
                  display: 'inline-flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: '4px',
                  minWidth: '110px',
                  padding: '12px 14px',
                  borderRadius: '14px',
                  border: isActive ? '1px solid var(--accent-400)' : '1px solid var(--border)',
                  background: isActive ? 'rgba(42, 79, 174, 0.08)' : 'var(--bg-elevated)',
                  cursor: 'pointer',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    letterSpacing: '0.05em',
                    color: isActive ? 'var(--accent-500)' : 'var(--text-muted)',
                    textTransform: 'uppercase',
                  }}
                >
                  {option.label}
                </span>
                <span
                  style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                  }}
                >
                  {formatVariantPrice(option.price)}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {options.length === 1 && activeOption && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 16px',
            borderRadius: '14px',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              letterSpacing: '0.05em',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
            }}
          >
            {activeOption.label}
          </span>
          <span
            style={{
              fontSize: '18px',
              fontWeight: 600,
              color: 'var(--text-primary)',
            }}
          >
            {selectedPromoLabel &&
            selectedPromoDiscountType === 'percentage' &&
            typeof selectedPromoDiscountedPrice === 'number' ? (
              <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ color: 'var(--text-muted)', textDecoration: 'line-through', fontSize: '14px' }}>
                  {formatVariantPrice(activeOption.price)}
                </span>
                <span>{formatCurrency(selectedPromoDiscountedPrice)}</span>
              </span>
            ) : (
              formatVariantPrice(activeOption.price)
            )}
          </span>
        </div>
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              letterSpacing: '0.08em',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
            }}
          >
            {isBogo ? 'Promo sets' : 'Quantity'}
          </span>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              border: '1px solid var(--border)',
              borderRadius: '999px',
              overflow: 'hidden',
              background: 'var(--bg-elevated)',
            }}
          >
            <button
              type="button"
              onClick={() => updateQuantity(quantity - 1)}
              style={{
                width: '38px',
                height: '38px',
                border: 'none',
                background: 'transparent',
                color: 'var(--text-secondary)',
                fontSize: '18px',
                cursor: 'pointer',
              }}
              aria-label="Decrease quantity"
            >
              -
            </button>
            <div
              style={{
                minWidth: '44px',
                textAlign: 'center',
                fontFamily: 'var(--font-mono)',
                fontSize: '13px',
                color: 'var(--text-primary)',
              }}
            >
              {quantity}
            </div>
            <button
              type="button"
              onClick={() => updateQuantity(quantity + 1)}
              style={{
                width: '38px',
                height: '38px',
                border: 'none',
                background: 'transparent',
                color: 'var(--text-secondary)',
                fontSize: '18px',
                cursor: 'pointer',
              }}
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
        </div>

        {subtotal && selectedVariantHasPricing && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                letterSpacing: '0.08em',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
              }}
            >
              Subtotal
            </span>
            <span
              style={{
                fontSize: '18px',
                fontWeight: 600,
                color: 'var(--text-primary)',
              }}
            >
              {subtotal}
            </span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="fm-btn-primary"
            onClick={handleAddToCart}
            disabled={!canPurchase}
            style={{
              opacity: canPurchase ? 1 : 0.6,
              cursor: canPurchase ? 'pointer' : 'not-allowed',
            }}
          >
            {!selectedVariantHasPricing
              ? 'Pricing Pending'
              : !canPurchase
                ? 'Unavailable'
                : isBogo
                  ? `Add ${fulfillmentQuantity} units`
                  : 'Add to Cart'}
          </button>
          <Link href="/cart" className="fm-btn-outline">
            View Cart
          </Link>
        </div>
        <span
          style={{
            minHeight: '18px',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            letterSpacing: '0.05em',
            color: addedMessage ? 'var(--accent-500)' : 'var(--text-muted)',
          }}
        >
          {addedMessage || ''}
        </span>
      </div>
    </div>
  )
}
