"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/types";
import { getProductImageSrc } from "@/lib/data-products";
import { isLowStock } from "@/lib/inventory-state";
import { getProductCoALink } from "@/lib/data-testing";
import { getProductCardSummary } from "@/lib/product-copy";
import { formatCurrency, parseCurrency } from "@/lib/cart";

interface ProductCardProps {
  product: Product;
  variant?: "light" | "dark";
}

function getStatusBadge(product: Product) {
  if (product.listingAvailabilityLabel) {
    return {
      label: product.listingAvailabilityLabel,
      className:
        product.listingAvailabilityTone === 'amber'
          ? 'badge-amber'
          : product.listingAvailabilityTone === 'muted'
            ? 'badge-muted'
            : product.listingAvailabilityTone === 'green'
              ? 'badge-green'
              : 'badge-blue',
    }
  }

  return null
}

function getCustomerInventoryBadge(product: Product, lowStock: boolean) {
  const customStatusBadge = getStatusBadge(product)
  if (customStatusBadge) return customStatusBadge
  if (product.status === 'incoming') return { label: 'Incoming', className: 'badge-amber' }
  if (product.status === 'out_of_stock') return { label: 'Out of Stock', className: 'badge-muted' }
  if (lowStock) return { label: 'Low Stock', className: 'badge-amber' }
  return { label: 'In Stock', className: 'badge-green' }
}

function formatProductCardPrice(value?: string) {
  const numeric = parseCurrency(value)
  return numeric === null ? value ?? '' : formatCurrency(numeric)
}

function CoaButton({ product }: { product: Product }) {
  if (product.coaStatus === "not_available") {
    return null
  }

  const href = product.coaUrl ?? getProductCoALink(product)
  if (!href) {
    return null
  }
  const external = href.startsWith("http") || href.endsWith(".pdf") || href.startsWith("/api/catalog-assets/coa/")

  return (
    <a
      href={href}
      onClick={(event) => event.stopPropagation()}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="badge badge-green"
      style={{ textDecoration: "none", cursor: "pointer" }}
    >
      CoA Available
    </a>
  )
}

export function ProductCard({ product, variant = "light" }: ProductCardProps) {
  const [hovered, setHovered] = useState(false)
  const [prefetched, setPrefetched] = useState(false)
  const router = useRouter()
  const isDark = variant === "dark"
  const imageSrc = getProductImageSrc(product)
  const cardSummary = getProductCardSummary(product)
  const lowStock = isLowStock(product)
  const inventoryBadge = getCustomerInventoryBadge(product, lowStock)
  const displayDiscountedPrice =
    product.promoLabel &&
    typeof product.promoDiscountedPrice === 'number' &&
    Number.isFinite(product.promoDiscountedPrice)

  const cardBg = isDark
    ? "linear-gradient(165deg, rgba(38,82,145,0.92), rgba(26,62,116,0.90))"
    : "#FFFFFF"
  const borderColor = hovered
    ? (isDark ? "rgba(77,211,232,0.74)" : "var(--border-strong)")
    : (isDark ? "rgba(77,211,232,0.34)" : "var(--border)")
  const accentBarColor = isDark
    ? "linear-gradient(to right, rgba(155,150,212,0.8), rgba(155,150,212,0.3))"
    : `linear-gradient(to right, ${product.accentColorHex}, var(--accent-300))`
  const footerBorder = hovered
    ? (isDark ? "rgba(155,150,212,0.4)" : "var(--border-strong)")
    : (isDark ? "rgba(255,255,255,0.1)" : "var(--border)")
  const textPrimary = isDark ? "rgba(255,255,255,0.92)" : "var(--text-primary)"
  const textSecondary = isDark ? "rgba(255,255,255,0.55)" : "var(--text-secondary)"
  const textMuted = isDark ? "rgba(255,255,255,0.35)" : "var(--text-muted)"
  const shadowColor = isDark
    ? "0 20px 50px rgba(0,0,0,0.34)"
    : "rgba(50, 50, 93, 0.25) 0px 50px 100px -20px, rgba(0, 0, 0, 0.3) 0px 30px 60px -30px, rgba(10, 37, 64, 0.35) 0px -2px 6px 0px inset"
  const productHref = `/products/${product.slug}`

  function prefetchProductPage() {
    if (prefetched) return
    router.prefetch(productHref)
    setPrefetched(true)
  }

  return (
      <article
        className="product-card"
        onMouseEnter={() => {
          setHovered(true)
          prefetchProductPage()
        }}
        onMouseLeave={() => setHovered(false)}
        onFocus={prefetchProductPage}
        onTouchStart={prefetchProductPage}
        onClick={() => router.push(productHref)}
        role="link"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            router.push(productHref)
          }
        }}
        style={{
          background: cardBg,
          border: `1px solid ${borderColor}`,
          borderRadius: "18px",
          overflow: "hidden",
          position: "relative",
          cursor: "pointer",
          transition: "border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease",
          transform: "none",
          boxShadow: hovered
            ? (isDark ? "0 26px 58px rgba(0,0,0,0.42)" : "0 16px 48px rgba(42,79,174,0.15)")
            : shadowColor,
          padding: 0,
        }}
      >
        {/* Accent bar */}
        <div style={{
          position: "absolute",
          top: 0, left: 0, right: 0,
          height: "3px",
          background: accentBarColor,
          opacity: hovered ? 1 : 0.7,
          transition: "opacity 0.2s ease",
          borderRadius: 0,
        }} />

        {/* Card media — always show the full product image */}
        <div style={{
          // Keep desktop product media generous; mobile compacts this via CSS for 2-up grids.
          borderRadius: "16px 16px 0 0",
          overflow: "hidden",
          background: isDark
            ? "linear-gradient(180deg, rgba(32,74,132,0.96), rgba(26,62,116,0.92))"
            : "linear-gradient(180deg, #f7f9fc, #ffffff)",
          width: "100%",
          aspectRatio: "1 / 0.82",
          minHeight: "280px",
          maxHeight: "410px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0",
          boxSizing: "border-box",
          borderBottom: isDark ? "1px solid rgba(77,211,232,0.34)" : "1px solid var(--border)",
        }}>
          <div
            style={{
              position: "relative",
              width: "calc(100% - 22px)",
              height: "calc(100% - 22px)",
              margin: "11px",
              borderRadius: "0",
              overflow: "hidden",
              background: "transparent",
              border: "0",
            }}
          >
            <Image
              src={imageSrc}
              alt={product.displayName}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              quality={75}
              style={{
                objectFit: "contain",
                objectPosition: "center center",
                padding: "10px",
              }}
            />
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: "16px 18px 10px", display: "flex", flexDirection: "column", gap: "7px" }}>
          {/* Badges */}
          <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
            <span className={`badge ${inventoryBadge.className}`}>{inventoryBadge.label}</span>
            <CoaButton product={product} />
            {product.promoLabel ? (
              <span
                className="badge badge-amber"
                style={{
                  boxShadow: isDark ? "none" : "0 0 0 3px rgba(180,83,9,0.06)",
                }}
              >
                {product.promoLabel}
              </span>
            ) : null}
          </div>

          {/* Name */}
          <div style={{
            fontFamily: "var(--font-heading)",
            fontSize: "17px",
            fontWeight: 800,
            color: textPrimary,
            letterSpacing: "0",
            lineHeight: 1.18,
            textTransform: "none",
          }}>
            {product.displayName}
          </div>

          {/* Chemical name */}
          <div style={{
            fontFamily: "var(--font-mono)",
            fontSize: "9px",
            letterSpacing: "0.10em",
            textTransform: "uppercase",
            color: textMuted,
            fontWeight: 800,
          }}>
            {product.fullName}
          </div>

          {product.priceVial && (
            <div
              style={{
                display: "flex",
                gap: "7px",
                flexWrap: "wrap",
                alignItems: "baseline",
                marginTop: "2px",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  letterSpacing: "0.04em",
                  color: displayDiscountedPrice ? textMuted : textPrimary,
                  textDecoration: displayDiscountedPrice ? "line-through" : "none",
                  fontWeight: 900,
                }}
              >
                {formatProductCardPrice(product.priceVial)}
              </span>
              {displayDiscountedPrice ? (
                <strong
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "14px",
                    color: isDark ? "#fff" : "var(--accent-500)",
                  }}
                >
                  {formatCurrency(product.promoDiscountedPrice as number)}
                </strong>
              ) : null}
            </div>
          )}

          {product.promoDiscountType === "bogo" && product.promoBuyQuantity && product.promoGetQuantity ? (
            <div
              style={{
                width: "fit-content",
                borderRadius: "9px",
                padding: "5px 8px",
                background: isDark ? "rgba(16,185,129,0.16)" : "rgba(16,185,129,0.10)",
                color: isDark ? "#A7F3D0" : "#047857",
                fontSize: "11px",
                lineHeight: 1.5,
                fontWeight: 700,
              }}
            >
              Buy {product.promoBuyQuantity}, get {product.promoGetQuantity} free
            </div>
          ) : null}

          {product.promoDetail ? (
            <div
              style={{
                borderRadius: "9px",
                padding: "7px 9px",
                background: isDark ? "rgba(255,255,255,0.08)" : "rgba(42,79,174,0.07)",
                color: isDark ? "rgba(255,255,255,0.82)" : "var(--accent-500)",
                fontSize: "11px",
                lineHeight: 1.5,
              }}
            >
              {product.promoDetail}
            </div>
          ) : null}

          {!product.listingAvailabilityLabel && product.inventoryOnHand !== null && product.inventoryOnHand !== undefined ? (
            <div
              style={{
                fontSize: "11px",
                color: lowStock ? "var(--amber)" : textMuted,
                marginTop: "2px",
              }}
            >
              {lowStock ? `Only ${product.inventoryOnHand} left` : `${product.inventoryOnHand} available`}
            </div>
          ) : null}

          {/* Summary */}
          <p style={{
            fontSize: "11.5px",
            color: textSecondary,
            lineHeight: 1.6,
            margin: "2px 0 0",
            fontWeight: 600,
          }}>
            {cardSummary}
          </p>

          {/* CTA */}
          <p style={{
            fontSize: "7.5px",
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.02em",
            color: textMuted,
            margin: "1px 0 0",
            lineHeight: 1.5,
          }}>
            Laboratory research use only. Not for human consumption.
          </p>
        </div>

        <div style={{
          padding: "8px 4px 2px",
          borderTop: `1px solid ${footerBorder}`,
          transition: "border-color 0.2s ease",
        }} />
      </article>
  )
}
