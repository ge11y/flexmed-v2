"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { getFeaturedProducts, getProductImageSrc } from "@/lib/data-products";
import { isLowStock } from "@/lib/inventory-state";
import { getProductCardSummary } from "@/lib/product-copy";
import type { Product } from "@/lib/types";

interface FeaturedCompoundsProps {
  featuredProducts?: Product[];
  compact?: boolean;
  embedded?: boolean;
}

function getFeaturedInventoryBadge(product: Product) {
  if (product.listingAvailabilityLabel) {
    return {
      label: product.listingAvailabilityLabel,
      className:
        product.listingAvailabilityTone === "amber"
          ? "badge-amber"
          : product.listingAvailabilityTone === "muted"
            ? "badge-muted"
            : product.listingAvailabilityTone === "green"
              ? "badge-green"
              : "badge-blue",
    };
  }

  if (product.status === "incoming") return { label: "Incoming", className: "badge-amber" };
  if (product.status === "out_of_stock") return { label: "Out of Stock", className: "badge-muted" };
  if (isLowStock(product)) return { label: "Low Stock", className: "badge-amber" };
  return { label: "In Stock", className: "badge-green" };
}

function cleanPrice(price?: string) {
  return price?.replace(/^\$\$/, "$") ?? "";
}

function formatCurrency(value?: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function ProductFeatureCard({ product, compact = false }: { product: Product; compact?: boolean }) {
  const inventoryBadge = getFeaturedInventoryBadge(product);
  const lowStock = isLowStock(product);
  const originalPrice = cleanPrice(product.priceVial);
  const discountedPrice = formatCurrency(product.promoDiscountedPrice);

  return (
    <Link href={`/products/${product.slug}`} className="featured-product-card">
      <div className="featured-product-image">
        <Image
          src={getProductImageSrc(product)}
          alt={product.displayName}
          fill
          sizes={compact ? "280px" : "(max-width: 760px) 78vw, 360px"}
          style={{ objectFit: "contain", objectPosition: "center", padding: compact ? "14px" : "20px" }}
        />
        <div className="featured-product-badges">
          <span className={`badge ${inventoryBadge.className}`}>{inventoryBadge.label}</span>
          {product.promoLabel ? <span className="badge badge-amber">{product.promoLabel}</span> : null}
        </div>
      </div>
      <div className="featured-product-body">
        <span className="featured-product-kicker">{product.category?.replaceAll("_", " ") || "Catalog Listing"}</span>
        <h3>{product.displayName}</h3>
        <p>{getProductCardSummary(product)}</p>
        <div className="featured-product-meta">
          {discountedPrice ? (
            <span>
              <strong>{discountedPrice}</strong>
              {originalPrice ? <em>{originalPrice}</em> : null}
            </span>
          ) : originalPrice ? (
            <strong>{originalPrice}</strong>
          ) : (
            <span>{product.fullName}</span>
          )}
          {!product.listingAvailabilityLabel && product.inventoryOnHand !== null && product.inventoryOnHand !== undefined ? (
            <small style={{ color: lowStock ? "var(--status-amber)" : "var(--text-muted)" }}>
              {lowStock ? `Only ${product.inventoryOnHand} left` : `${product.inventoryOnHand} available`}
            </small>
          ) : null}
        </div>
        {product.promoDetail ? <div className="featured-promo-detail">{product.promoDetail}</div> : null}
      </div>
    </Link>
  );
}

export function FeaturedCompounds({ featuredProducts, compact = false, embedded = false }: FeaturedCompoundsProps) {
  const featured = useMemo(
    () => (featuredProducts ?? getFeaturedProducts()).filter((product) => product.publicVisible !== false),
    [featuredProducts],
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const maxIndex = Math.max(0, featured.length - 1);

  useEffect(() => {
    if (featured.length <= 1 || paused) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current >= maxIndex ? 0 : current + 1));
    }, compact || embedded ? 4800 : 3900);
    return () => window.clearInterval(timer);
  }, [compact, embedded, featured.length, maxIndex, paused]);

  const safeActiveIndex = Math.min(activeIndex, maxIndex);
  const activeProduct = featured[safeActiveIndex] ?? featured[0] ?? null;

  const goPrevious = () => setActiveIndex((current) => (current === 0 ? maxIndex : current - 1));
  const goNext = () => setActiveIndex((current) => (current >= maxIndex ? 0 : current + 1));

  if (featured.length === 0) return null;

  if (compact || embedded) {
    return (
      <section className="featured-compact" style={{ backgroundColor: embedded ? "transparent" : "var(--bg-surface)", padding: embedded ? 0 : "44px 40px 28px" }}>
        <style>{featuredStyles}</style>
        <div style={{ maxWidth: embedded ? "none" : 1200, margin: embedded ? 0 : "0 auto" }}>
          <div className="featured-compact-heading">
            <div>
              <span className="featured-section-label">Founder Selected</span>
              <h2>Featured products</h2>
            </div>
            <Link href="/products?group=peptides" className="fm-btn-outline" style={{ padding: "9px 16px", fontSize: 12 }}>
              Browse all
            </Link>
          </div>
          <div
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
          >
            {activeProduct ? <ProductFeatureCard product={activeProduct} compact /> : null}
          </div>
          {featured.length > 1 ? (
            <div className="featured-controls">
              <button type="button" onClick={goPrevious} aria-label="Previous featured product">
                <ArrowLeft size={16} aria-hidden="true" />
              </button>
              <div className="featured-dots">
                {featured.map((product, index) => (
                  <button
                    key={product.slug}
                    type="button"
                    aria-label={`Show ${product.displayName}`}
                    data-active={index === safeActiveIndex}
                    onClick={() => setActiveIndex(index)}
                  />
                ))}
              </div>
              <button type="button" onClick={goNext} aria-label="Next featured product">
                <ArrowRight size={16} aria-hidden="true" />
              </button>
            </div>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section className="featured-orbit-section">
      <style>{featuredStyles}</style>
      <div className="featured-orbit-shell">
        <div className="featured-orbit-copy">
          <span className="featured-section-label">
            <Sparkles size={14} aria-hidden="true" />
            Featured
          </span>
          <h2>Featured products in motion.</h2>
          <p>
            A rotating window into selected catalog products, current availability, and research-use listings.
          </p>
          <div className="featured-orbit-actions">
            <Link href="/products?group=peptides" className="fm-btn-primary">
              Browse full catalog <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <span>{featured.length} selected</span>
          </div>
        </div>

        <div
          className="featured-orbit-stage"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
        >
          <div className="featured-carousel-viewport" aria-live="polite">
            <div
              className="featured-carousel-track"
              style={{
                transform: `translate3d(calc((var(--featured-viewport-width) - var(--featured-card-width)) / 2 - ${safeActiveIndex} * (var(--featured-card-width) + var(--featured-card-gap))), 0, 0)`,
              }}
            >
              {featured.map((product, index) => (
                <div
                  key={product.slug}
                  className="featured-carousel-slide"
                  data-active={index === safeActiveIndex}
                >
                  <ProductFeatureCard product={product} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {featured.length > 1 ? (
          <div className="featured-controls featured-controls-large">
            <button type="button" onClick={goPrevious} aria-label="Previous featured product">
              <ArrowLeft size={16} aria-hidden="true" />
            </button>
            <div className="featured-dots">
              {featured.map((product, index) => (
                <button
                  key={product.slug}
                  type="button"
                  aria-label={`Show ${product.displayName}`}
                  data-active={index === safeActiveIndex}
                  onClick={() => setActiveIndex(index)}
                />
              ))}
            </div>
            <button type="button" onClick={goNext} aria-label="Next featured product">
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}

const featuredStyles = `
  .featured-orbit-section {
    position: relative;
    overflow: hidden;
    padding: 82px 32px 88px;
    background:
      radial-gradient(circle at 8% 10%, rgba(77,211,232,0.16), transparent 28%),
      radial-gradient(circle at 88% 20%, rgba(155,150,212,0.12), transparent 32%),
      linear-gradient(180deg, #102A54 0%, #071A3D 100%);
  }
  .featured-orbit-shell {
    max-width: 1240px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: minmax(280px, 0.72fr) minmax(520px, 1fr);
    gap: clamp(32px, 6vw, 82px);
    align-items: center;
  }
  .featured-section-label {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    color: #5FE3D6;
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.11em;
    text-transform: uppercase;
  }
  .featured-orbit-copy h2 {
    margin: 12px 0 14px;
    max-width: 440px;
    color: #F2F7FE;
    font-size: clamp(30px, 4vw, 48px);
    line-height: 1;
    letter-spacing: -0.03em;
    text-wrap: balance;
  }
  .featured-orbit-copy p {
    max-width: 470px;
    margin: 0;
    color: rgba(230,240,255,0.74);
    font-size: 15px;
    line-height: 1.72;
  }
  .featured-orbit-actions {
    display: flex;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
    margin-top: 24px;
  }
  .featured-orbit-actions span {
    color: rgba(195,211,236,0.66);
    font-family: var(--font-mono);
    font-size: 12px;
  }
  .featured-orbit-stage {
    position: relative;
    min-height: 520px;
    --featured-card-width: 360px;
    --featured-card-gap: 24px;
    --featured-viewport-width: min(100%, calc(var(--featured-card-width) * 3 + var(--featured-card-gap) * 2));
  }
  .featured-carousel-viewport {
    position: relative;
    overflow: visible;
    width: var(--featured-viewport-width);
    max-width: 100%;
    min-height: 520px;
    margin: 0 auto;
    padding: 22px 0 28px;
    box-sizing: border-box;
  }
  .featured-carousel-track {
    display: flex;
    align-items: stretch;
    gap: var(--featured-card-gap);
    will-change: transform;
    transition: transform 820ms cubic-bezier(0.16, 1, 0.3, 1);
  }
  .featured-carousel-slide {
    flex: 0 0 var(--featured-card-width);
    max-width: var(--featured-card-width);
    opacity: 0.42;
    transform: translateY(10px);
    filter: saturate(0.86);
    transition:
      opacity 520ms ease,
      transform 820ms cubic-bezier(0.16, 1, 0.3, 1),
      filter 520ms ease;
  }
  .featured-carousel-slide[data-active="true"] {
    transform: translateY(0);
    opacity: 1;
    filter: saturate(1);
  }
  .featured-carousel-slide[data-active="true"] .featured-product-card {
    border-color: rgba(77,211,232,0.44);
    box-shadow: 0 22px 52px rgba(0,0,0,0.28);
  }
  .featured-product-card {
    display: block;
    overflow: hidden;
    min-height: 100%;
    color: inherit;
    text-decoration: none;
    background:
      linear-gradient(165deg, rgba(38,82,145,0.92), rgba(26,62,116,0.90));
    border: 1px solid rgba(220,230,245,0.20);
    border-radius: 16px;
    box-shadow: 0 16px 38px rgba(0,0,0,0.22);
    backdrop-filter: blur(16px);
    transition: transform 180ms ease, border-color 180ms ease;
  }
  .featured-product-card:hover,
  .featured-product-card:focus-visible {
    transform: none;
    border-color: rgba(77,211,232,0.72);
    outline: none;
  }
  .featured-product-image {
    position: relative;
    height: 230px;
    overflow: hidden;
    border-bottom: 1px solid rgba(77,211,232,0.32);
    background:
      linear-gradient(165deg, rgba(20,62,117,0.96), rgba(12,40,84,0.94)),
      radial-gradient(circle at 50% 8%, rgba(77,211,232,0.18), transparent 34%);
  }
  .featured-product-badges {
    position: absolute;
    top: 12px;
    left: 12px;
    right: 12px;
    display: flex;
    justify-content: space-between;
    gap: 8px;
    flex-wrap: wrap;
  }
  .featured-product-body {
    padding: 18px;
  }
  .featured-product-kicker {
    display: inline-flex;
    width: fit-content;
    margin-bottom: 8px;
    padding: 4px 8px;
    border-radius: 999px;
    background: rgba(42,79,174,0.08);
    color: #d7fbff;
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.09em;
    text-transform: uppercase;
  }
  .featured-product-body h3 {
    margin: 0 0 7px;
    color: #ffffff;
    font-size: 19px;
    font-weight: 850;
    line-height: 1.12;
  }
  .featured-product-body p {
    min-height: 58px;
    margin: 0 0 14px;
    color: rgba(230,240,255,0.74);
    font-size: 13px;
    line-height: 1.5;
    font-weight: 600;
  }
  .featured-product-meta {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: baseline;
    color: #ffffff;
    font-family: var(--font-mono);
    font-size: 12px;
  }
  .featured-product-meta strong {
    font-size: 15px;
    font-weight: 900;
  }
  .featured-product-meta em {
    margin-left: 8px;
    color: var(--text-muted);
    font-style: normal;
    text-decoration: line-through;
  }
  .featured-promo-detail {
    margin-top: 12px;
    color: var(--accent-500);
    font-size: 12px;
    line-height: 1.45;
  }
  .featured-controls {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 12px;
    margin-top: 18px;
  }
  .featured-controls button {
    width: 36px;
    height: 36px;
    border-radius: 999px;
    border: 1px solid var(--border);
    background: #fff;
    color: var(--accent-500);
    display: inline-grid;
    place-items: center;
    cursor: pointer;
  }
  .featured-dots {
    display: flex;
    gap: 7px;
    align-items: center;
  }
  .featured-dots button {
    width: 8px;
    height: 8px;
    border: 0;
    background: rgba(42,79,174,0.22);
    padding: 0;
  }
  .featured-dots button[data-active="true"] {
    width: 24px;
    background: var(--accent-500);
  }
  .featured-compact-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
    margin-bottom: 16px;
  }
  .featured-compact-heading h2 {
    margin: 6px 0 0;
    color: #ffffff;
    font-size: 22px;
    font-weight: 850;
  }
  @media (max-width: 980px) {
    .featured-orbit-shell {
      grid-template-columns: 1fr;
      gap: 24px;
    }
    .featured-orbit-stage {
      min-height: 500px;
      --featured-card-width: min(360px, 82vw);
      --featured-viewport-width: var(--featured-card-width);
    }
  }
  @media (max-width: 720px) {
    .featured-orbit-section {
      padding: 58px 20px 64px;
    }
    .featured-orbit-stage {
      min-height: auto;
      --featured-card-width: calc(100vw - 32px);
      --featured-viewport-width: var(--featured-card-width);
    }
    .featured-carousel-viewport {
      min-height: auto;
      overflow: visible;
      padding: 0 0 8px;
      mask-image: none;
    }
    .featured-carousel-slide {
      transform: scale(1);
      opacity: 1;
      filter: saturate(1);
    }
    .featured-carousel-slide[data-active="true"] {
      transform: scale(1);
      opacity: 1;
    }
    .featured-product-image {
      height: 196px;
    }
    .featured-product-body {
      padding: 15px;
    }
    .featured-product-body p {
      min-height: auto;
      font-size: 12.5px;
    }
    .featured-orbit-copy h2 {
      font-size: 30px;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .featured-carousel-track,
    .featured-carousel-slide,
    .featured-product-card,
    .featured-dots button {
      animation: none !important;
      transition: none !important;
    }
  }
`;
