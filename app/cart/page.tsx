'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useCart } from '@/components/CartProvider'
import { PRODUCTS, getProductImageSrc } from '@/lib/data-products'
import { formatCurrency, getCartLineKey } from '@/lib/cart'
import { useCheckoutQuote } from '@/lib/use-checkout-quote'

function quoteLineImage(lines: { slug: string; imageUrl?: string }[], slug: string) {
  return lines.find((line) => line.slug === slug)?.imageUrl
}

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart } = useCart()
  const { quote: orderDraft, errors: quoteErrors, loading: quoteLoading } = useCheckoutQuote(items)
  const freeShippingApplied = Boolean(
    orderDraft.metadata.appliedPromotions?.some((promo) => promo.discountType === 'free_shipping'),
  )

  return (
    <>
    <style>{`
      .cart-page-shell {
        background: var(--bg-base);
        min-height: 100vh;
        padding: 112px 40px 72px;
      }
      .cart-page-inner {
        max-width: 1120px;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        gap: 28px;
      }
      .cart-layout {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 360px;
        gap: 24px;
        align-items: start;
      }
      .cart-solid-card {
        background:
          linear-gradient(165deg, rgba(38,82,145,0.96), rgba(26,62,116,0.94)),
          radial-gradient(circle at 100% 0%, rgba(77,211,232,0.12), transparent 34%);
        border-color: rgba(77,211,232,0.24);
      }
      .cart-items-card {
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 18px;
      }
      .cart-line-item {
        display: grid;
        grid-template-columns: 120px minmax(0, 1fr);
        gap: 16px;
        padding-bottom: 18px;
        border-bottom: 1px solid var(--border);
      }
      .cart-line-image {
        position: relative;
        aspect-ratio: 1 / 1;
        border-radius: 16px;
        background: rgba(10,33,76,0.78);
        overflow: hidden;
        border: 1px solid rgba(77,211,232,0.30);
      }
      .cart-line-content {
        display: flex;
        flex-direction: column;
        gap: 12px;
        min-width: 0;
      }
      .cart-line-heading {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        align-items: start;
      }
      .cart-summary-stack {
        display: flex;
        flex-direction: column;
        gap: 20px;
        min-width: 0;
      }
      .cart-summary-card {
        padding: 20px;
        display: flex;
        flex-direction: column;
      }
      .cart-summary-card {
        gap: 14px;
      }
      @media (max-width: 860px) {
        .cart-page-shell {
          padding: calc(112px + var(--promo-banner-offset, 0px)) 18px 86px;
        }
        .cart-layout {
          grid-template-columns: 1fr;
          gap: 18px;
        }
        .cart-items-card,
        .cart-summary-card {
          border-color: rgba(77,211,232,0.32);
          box-shadow: 0 18px 44px rgba(0,0,0,0.24);
        }
        .cart-summary-stack {
          position: relative;
          z-index: 1;
        }
      }

      @media (max-width: 560px) {
        .cart-page-shell {
          padding-left: 14px;
          padding-right: 14px;
        }
        .cart-page-inner {
          gap: 22px;
        }
        .cart-line-item {
          grid-template-columns: 104px minmax(0, 1fr);
          gap: 12px;
        }
        .cart-line-heading {
          flex-direction: column;
          align-items: stretch;
          gap: 10px;
        }
        .cart-line-heading .fm-btn-outline {
          align-self: flex-start;
        }
      }

      @media (max-width: 390px) {
        .cart-line-item {
          grid-template-columns: 1fr;
        }
        .cart-line-image {
          width: min(180px, 100%);
          justify-self: center;
        }
      }
    `}</style>
    <div className="storefront-blue-shell cart-page-shell">
      <div
        className="cart-page-inner"
        style={{
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div className="section-label">Cart</div>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 44px)', margin: 0 }}>Review Cart</h1>
          <p style={{ margin: 0, maxWidth: '760px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            Review selected items, quantities, available promotions, and estimated totals before continuing to checkout.
          </p>
        </div>

        {items.length === 0 ? (
          <div className="card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ fontSize: '18px', fontWeight: 600 }}>Your cart is empty.</div>
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
              Browse the catalog, add products, and return here to review your order before checkout.
            </p>
            <div>
              <Link href="/products?group=peptides" className="fm-btn-primary">
                Browse catalog
              </Link>
            </div>
          </div>
        ) : (
          <div
            className="cart-layout"
            style={{
            }}
          >
            <div className="card cart-items-card cart-solid-card">
              {items.map((item) => {
                const itemType = item.itemType ?? 'product'
                const quoteLine = orderDraft.lines.find((line) => line.slug === item.slug && (line.itemType ?? 'product') === itemType)
                const product = itemType === 'product' ? PRODUCTS[item.slug] : null
                const imageSrc = item.imageUrl || quoteLine?.imageUrl || quoteLineImage(orderDraft.lines, item.slug) || (product ? getProductImageSrc(product) : '/products/front.png')
                const unitPrice = quoteLine?.unitPrice ?? 0
                const lineTotal = quoteLine?.lineTotal ?? quoteLine?.lineSubtotal ?? unitPrice * item.quantity
                const promo = quoteLine?.appliedPromotion
                const quantityStep =
                  promo?.discountType === 'bogo'
                    ? (promo.buyQuantity ?? 1) + (promo.getQuantity ?? 1)
                    : 1
                const strengthLabel =
                  quoteLine?.strengthLabel ??
                  item.strengthLabel ??
                  (product ? `${product.strength} ${product.unit}`.trim() : '')

                return (
                  <div
                    key={getCartLineKey(item)}
                    className="cart-line-item"
                    style={{
                    }}
                  >
                    <div
                      className="cart-line-image"
                      style={{
                      }}
                    >
                      <Image
                        src={imageSrc}
                        alt={item.displayName}
                        fill
                        sizes="120px"
                        style={{ objectFit: 'contain', objectPosition: 'center center' }}
                      />
                    </div>

                    <div className="cart-line-content">
                      <div
                        className="cart-line-heading"
                        style={{
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ fontSize: '18px', fontWeight: 600 }}>
                            {strengthLabel ? `${item.displayName} ${strengthLabel}` : item.displayName}
                          </div>
                          <div
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: '11px',
                              letterSpacing: '0.08em',
                              textTransform: 'uppercase',
                              color: 'var(--text-muted)',
                            }}
                          >
                            {item.optionLabel}
                          </div>
                          {promo ? (
                            <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
                              <span className="badge badge-blue">{promo.badgeLabel || promo.title}</span>
                              {quoteLine?.freeUnits ? (
                                <span className="badge badge-green">{quoteLine.freeUnits} free</span>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.slug, item.option, itemType)}
                          className="fm-btn-outline"
                          style={{ padding: '8px 14px', fontSize: '12px' }}
                        >
                          Remove
                        </button>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '16px',
                          flexWrap: 'wrap',
                        }}
                      >
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(
                                item.slug,
                                item.option,
                                Math.max(quantityStep, item.quantity - quantityStep),
                                itemType,
                              )
                            }
                            className="fm-btn-outline"
                            style={{ padding: '8px 12px', minWidth: '40px' }}
                          >
                            -
                          </button>
                          <span style={{ minWidth: '24px', textAlign: 'center', fontWeight: 600 }}>{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.slug, item.option, item.quantity + quantityStep, itemType)}
                            className="fm-btn-outline"
                            style={{ padding: '8px 12px', minWidth: '40px' }}
                          >
                            +
                          </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                          <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                            {formatCurrency(unitPrice)} each
                          </div>
                          {(quoteLine?.discountAmount ?? 0) > 0 ? (
                            <div style={{ color: 'var(--text-muted)', fontSize: '12px', textDecoration: 'line-through' }}>
                              {formatCurrency(quoteLine?.lineSubtotal ?? 0)}
                            </div>
                          ) : null}
                          <div style={{ fontSize: '18px', fontWeight: 600 }}>
                            {formatCurrency(lineTotal)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="cart-summary-stack">
              <div className="card cart-summary-card cart-solid-card">
                <div className="section-label">Summary</div>
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
                      ? 'Free'
                      : orderDraft.totals.shipping > 0
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
                <div
                  style={{
                    borderTop: '1px solid var(--border)',
                    paddingTop: '14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '18px',
                  }}
                >
                  <span>Total</span>
                  <strong>{formatCurrency(orderDraft.totals.total)}</strong>
                </div>
                {orderDraft.metadata.appliedPromotions?.length ? (
                  <div style={{ display: 'grid', gap: '5px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                    {orderDraft.metadata.appliedPromotions.map((promo) => (
                      <div key={promo.id}>{promo.title}</div>
                    ))}
                  </div>
                ) : null}
                {quoteErrors.length === 0 ? (
                  <Link href="/checkout" className="fm-btn-primary" style={{ textAlign: 'center' }}>
                    {quoteLoading ? 'Refreshing total...' : 'Continue to checkout'}
                  </Link>
                ) : (
                  <span className="fm-btn-primary" style={{ opacity: 0.55, cursor: 'not-allowed' }}>
                    Review cart availability
                  </span>
                )}
                <button
                  type="button"
                  onClick={clearCart}
                  className="fm-btn-outline"
                  style={{ width: '100%' }}
                >
                  Clear cart
                </button>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
    </>
  )
}
