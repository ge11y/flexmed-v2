"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Beaker,
  Dna,
  Droplets,
  FlaskConical,
  Layers3,
  ShieldCheck,
  Sparkles,
  SprayCan,
} from "lucide-react";
import { getProductImageSrc } from "@/lib/data-products";
import { isLowStock } from "@/lib/inventory-state";
import type { Product } from "@/lib/types";

interface VideoHeroProps {
  featuredProducts?: Product[];
}

const CATEGORY_LINKS = [
  {
    label: "Peptides",
    href: "/products?group=peptides",
    detail: "Core research catalog",
    icon: FlaskConical,
    image: "/claude-storefront/banners/peptides.png",
  },
  {
    label: "Blends",
    href: "/products?group=blends",
    detail: "Combination listings",
    icon: Layers3,
    image: "/claude-storefront/banners/blends.png",
  },
  {
    label: "Sprays",
    href: "/products?group=sprays",
    detail: "Nasal spray format",
    icon: SprayCan,
    image: "/claude-storefront/banners/sprays.png",
  },
  {
    label: "Topicals",
    href: "/products?group=topicals",
    detail: "Topical research",
    icon: Sparkles,
    image: "/claude-storefront/banners/topicals-serum.png",
    imagePosition: "center 58%",
  },
  {
    label: "Bio Regulators",
    href: "/products?group=bio_regulators",
    detail: "Regulator catalog",
    icon: Dna,
    image: "/claude-storefront/banners/bioregulators.png",
  },
  {
    label: "Water",
    href: "/products?group=water",
    detail: "Water listings",
    icon: Droplets,
    image: "/claude-storefront/banners/water.png",
  },
  {
    label: "Vial Cases",
    href: "/vial-cases",
    detail: "Case products",
    icon: ShieldCheck,
    image: "/claude-storefront/banners/vialcases.png",
  },
] as const;

function getHeroInventoryBadge(product: Product) {
  if (product.listingAvailabilityLabel) return product.listingAvailabilityLabel;
  if (product.status === "incoming") return "Incoming";
  if (product.status === "out_of_stock") return "Out of Stock";
  if (isLowStock(product)) return "Low Stock";
  return "In Stock";
}

function normalizePrice(price?: string) {
  if (!price) return "";
  return price.replace(/^\$\$/, "$");
}

function formatCurrency(value?: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function getProductPricing(product: Product) {
  return {
    originalPrice: normalizePrice(product.priceVial),
    discountedPrice: formatCurrency(product.promoDiscountedPrice),
  };
}

export function VideoHero({ featuredProducts = [] }: VideoHeroProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const featured = useMemo(() => featuredProducts.filter((product) => product.publicVisible !== false), [featuredProducts]);
  const heroFeaturedItems = featured.length > 1 ? [...featured, ...featured] : featured;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = 0.55;

    const playVideo = async () => {
      try {
        await video.play();
      } catch {
        // Autoplay can be blocked transiently; muted + playsInline still gives us the best shot.
      }
    };

    void playVideo();
  }, []);

  useEffect(() => {
    if (featured.length <= 1 || isPaused) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % featured.length);
    }, 4200);
    return () => window.clearInterval(timer);
  }, [featured.length, isPaused]);

  return (
    <>
    <section className="hero-showcase">
      <style>{`
        .hero-showcase {
          position: relative;
          overflow: hidden;
          min-height: 100svh;
          display: flex;
          align-items: center;
          isolation: isolate;
        }
        .hero-showcase:before {
          content: "";
          position: absolute;
          inset: 0;
          z-index: 0;
          background:
            radial-gradient(125% 95% at 50% 42%, rgba(11,26,56,.42) 0%, rgba(9,20,44,.80) 64%, rgba(7,15,33,.96) 100%),
            linear-gradient(90deg, rgba(7, 12, 32, 0.72), rgba(11, 29, 70, 0.42) 46%, rgba(6, 16, 38, 0.68));
          pointer-events: none;
        }
        .hero-showcase-video {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          z-index: -1;
          transform: scale(1.02);
          filter: saturate(1.12) contrast(1.02);
        }
        .hero-showcase-shell {
          position: relative;
          z-index: 1;
          width: min(1500px, calc(100% - 24px));
          margin: 0 auto;
          padding: 112px 0 54px;
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: 20px;
          align-items: center;
          justify-items: center;
          text-align: center;
        }
        .hero-showcase-logo {
          width: min(1160px, 94vw, 82svh);
          margin: 0 auto;
          padding: 0;
          box-sizing: border-box;
          filter: drop-shadow(0 26px 42px rgba(0,0,0,0.40));
          animation: flexmed-soft-float 7s ease-in-out infinite;
        }
        .hero-video-actions {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          margin-top: -78px;
          position: relative;
          z-index: 3;
        }
        .hero-scroll-cue {
          position: static;
          z-index: auto;
          display: grid;
          place-items: center;
          gap: 6px;
          color: rgba(255,255,255,0.70);
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.10em;
          text-transform: uppercase;
          text-decoration: none;
        }
        .hero-scroll-cue:after {
          content: "";
          width: 1px;
          height: 22px;
          border-radius: 999px;
          background: linear-gradient(180deg, rgba(255,255,255,0.82), rgba(77,211,232,0.08));
        }
        .home-shop-hub {
          position: relative;
          z-index: 2;
          overflow: hidden;
          background:
            radial-gradient(circle at 14% 0%, rgba(77, 211, 232, 0.14), transparent 34%),
            radial-gradient(circle at 88% 18%, rgba(155, 150, 212, 0.12), transparent 32%),
            linear-gradient(180deg, #1B3E72 0%, #102A54 100%);
          padding: 54px 40px 42px;
          border-bottom: 1px solid rgba(255,255,255,0.10);
        }
        .home-shop-hub-shell {
          position: relative;
          width: min(1100px, 100%);
          margin: 0 auto;
          display: grid;
          gap: 18px;
          text-align: center;
        }
        .hero-showcase-kicker {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          width: fit-content;
          margin: 8px auto 10px;
          padding: 8px 12px;
          border-radius: 999px;
          border: 1px solid rgba(77,211,232,0.28);
          background: rgba(77,211,232,0.10);
          color: #d7fbff;
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.09em;
          text-transform: uppercase;
          backdrop-filter: blur(12px);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.12);
        }
        .hero-showcase-copy {
          display: none;
          max-width: 560px;
          margin: 0 0 16px;
          color: rgba(255,255,255,0.86);
          font-size: 15px;
          line-height: 1.52;
          text-wrap: pretty;
        }
        .hero-showcase-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          align-items: center;
          justify-content: center;
        }
        .hero-showcase-right {
          display: grid;
          gap: 14px;
          width: min(980px, 100%);
          margin: 0 auto;
        }
        .hero-categories {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
        }
        .hero-category-tile {
          display: grid;
          grid-template-rows: 136px auto;
          gap: 0;
          align-items: stretch;
          min-height: 242px;
          padding: 0;
          border-radius: 18px;
          border: 1px solid rgba(140,175,225,.16);
          background: linear-gradient(165deg,#265291,#1A3E74);
          color: #f5fbff;
          text-decoration: none;
          backdrop-filter: blur(16px);
          box-shadow: 0 20px 50px rgba(0,0,0,.26);
          overflow: hidden;
          transition: transform 180ms ease, border-color 180ms ease, background 180ms ease, box-shadow 180ms ease;
        }
        .hero-category-tile:hover,
        .hero-category-tile:focus-visible {
          transform: translateY(-4px);
          border-color: rgba(77, 211, 232, 0.50);
          background: linear-gradient(165deg,#2A5A9F,#1C427A);
          box-shadow: 0 28px 58px rgba(0,0,0,0.30);
          outline: none;
        }
        .hero-category-image {
          position: relative;
          min-height: 136px;
          overflow: hidden;
          background: #0a214c;
        }
        .hero-category-image:after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(5,14,32,0.02), rgba(5,14,32,0.30));
          pointer-events: none;
        }
        .hero-category-body {
          display: grid;
          grid-template-columns: 44px minmax(0, 1fr);
          gap: 12px;
          align-items: center;
          padding: 16px;
        }
        .hero-category-icon {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          color: #72edff;
          background: rgba(77,211,232,0.10);
          border: 1px solid rgba(77,211,232,0.18);
          transition: transform 180ms ease;
        }
        .hero-category-tile:hover .hero-category-icon,
        .hero-category-tile:focus-visible .hero-category-icon {
          transform: rotate(-6deg) scale(1.04);
        }
        .hero-feature-card {
          position: relative;
          overflow: hidden;
          min-height: 136px;
          width: min(520px, calc(100vw - 48px));
          border-radius: 16px;
          border: 1px solid rgba(220,230,245,0.22);
          background:
            linear-gradient(165deg, rgba(38,82,145,.88), rgba(26,62,116,.82)),
            radial-gradient(circle at 88% 14%, rgba(77,211,232,0.14), transparent 28%);
          color: #f6fbff;
          text-decoration: none;
          box-shadow: 0 20px 48px rgba(0,0,0,0.26);
          backdrop-filter: blur(18px);
          display: grid;
          grid-template-columns: minmax(0, 1fr) 170px;
          gap: 12px;
          padding: 12px;
          text-align: left;
        }
        .hero-feature-stage {
          --hero-feature-gap: 28px;
          overflow: hidden;
          border-radius: 16px;
          padding: 2px 0 4px;
          touch-action: pan-y;
        }
        .hero-feature-track {
          display: flex;
          gap: var(--hero-feature-gap);
          width: max-content;
          animation: hero-feature-marquee 34s linear infinite;
          will-change: transform;
        }
        .hero-feature-stage:hover .hero-feature-track,
        .hero-feature-stage:focus-within .hero-feature-track,
        .hero-feature-stage:active .hero-feature-track,
        .hero-feature-stage[data-paused="true"] .hero-feature-track {
          animation-play-state: paused;
        }
        .hero-feature-track .hero-feature-card {
          flex: 0 0 min(520px, calc(100vw - 48px));
        }
        @keyframes hero-feature-marquee {
          from {
            transform: translate3d(0, 0, 0);
          }
          to {
            transform: translate3d(calc(-50% - (var(--hero-feature-gap) / 2)), 0, 0);
          }
        }
        .hero-feature-card:hover,
        .hero-feature-card:focus-visible {
          border-color: rgba(77, 211, 232, 0.58);
          transform: none;
          outline: none;
        }
        .hero-feature-copy {
          min-width: 0;
          transform: translateZ(0);
        }
        .hero-feature-image {
          position: relative;
          min-height: 112px;
          border-radius: 14px;
          border: 1px solid rgba(77,211,232,0.36);
          background:
            linear-gradient(165deg, rgba(20,62,117,0.96), rgba(12,40,84,0.94)),
            radial-gradient(circle at 48% 12%, rgba(77,211,232,0.18), transparent 34%);
          overflow: hidden;
        }
        .hero-feature-dots {
          display: flex;
          gap: 7px;
          margin-top: 15px;
        }
        .hero-feature-dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          border: 1px solid rgba(145, 164, 199, 0.42);
          padding: 0;
          background: #c8d2e5;
          cursor: pointer;
          transition: width 180ms ease, background 180ms ease, border-color 180ms ease;
        }
        .hero-feature-dot[data-active="true"] {
          width: 22px;
          border-color: #4dd3e8;
          background: #4dd3e8;
        }
        @media (max-width: 980px) {
          .hero-showcase-shell {
            width: min(100% - 18px, 900px);
            grid-template-columns: 1fr;
            padding: 104px 0 52px;
          }
          .hero-showcase-logo {
            width: min(860px, 94vw, 74svh);
          }
          .hero-categories {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .hero-category-tile:last-child {
            grid-column: 1 / -1;
            width: min(50%, 100%);
            justify-self: center;
          }
        }
        @media (max-width: 560px) {
          .hero-showcase-shell {
            width: min(100% - 14px, 560px);
            padding-top: 106px;
          }
          .home-shop-hub {
            padding: 34px 20px 26px;
          }
          .hero-showcase-logo {
            width: min(520px, 94vw, 62svh);
          }
          .hero-video-actions {
            margin-top: -24px;
          }
          .hero-scroll-cue {
            display: grid;
          }
          .hero-showcase-kicker {
            margin: 12px 0 12px;
            font-size: 9px;
            letter-spacing: 0.08em;
          }
          .hero-showcase-copy {
            display: none;
          }
          .hero-showcase-actions {
            gap: 10px;
          }
          .hero-categories {
            grid-template-columns: 1fr;
          }
          .hero-category-tile:last-child {
            grid-column: auto;
            width: 100%;
            justify-self: stretch;
          }
          .hero-category-tile {
            min-height: 212px;
            grid-template-rows: 126px auto;
          }
          .hero-category-icon {
            width: 36px;
            height: 36px;
          }
          .hero-feature-card {
            grid-template-columns: 1fr;
          }
          .hero-feature-image {
            min-height: 168px;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-showcase-logo {
            animation: none !important;
          }
          .hero-scroll-cue:after {
            height: 18px;
          }
          .hero-feature-track {
            animation: none !important;
          }
          .hero-category-tile,
          .hero-category-icon {
            transition: none !important;
          }
        }
      `}</style>

      <video ref={videoRef} className="hero-showcase-video" autoPlay muted loop playsInline preload="auto" poster="/hero-video-poster.png">
        <source src="/hero-video.mp4" type="video/mp4" />
        <source src="/videos/header-banner.mp4" type="video/mp4" />
        <source src="/videos/header-banner.mov" type="video/quicktime" />
      </video>

      <div className="hero-showcase-shell">
        <div className="hero-showcase-logo">
          <Image
            src="/claude-storefront/flexmed-logo-full.png"
            alt="FlexMed"
            width={2000}
            height={2000}
            priority
            style={{ display: "block", width: "100%", height: "auto", objectFit: "contain" }}
          />
        </div>
        <div className="hero-video-actions">
          <Link className="hero-scroll-cue" href="#shop-catalog">Scroll</Link>
        </div>
      </div>
    </section>
    <section id="shop-catalog" className="home-shop-hub" aria-label="Shop FlexMed catalog">
      <div className="home-shop-hub-shell">
        <div>
          <div className="hero-showcase-kicker">
            <BadgeCheck size={14} aria-hidden="true" />
            Third-party batch testing
          </div>

          <p className="hero-showcase-copy">
            Browse peptide families, vial cases, CoA availability, and live stock states from one
            research-use catalog built for clear ordering.
          </p>

        </div>

        <div className="hero-showcase-right">
          <div className="hero-categories" aria-label="Shop by category">
            {CATEGORY_LINKS.map((category) => {
              const Icon = category.icon;
              return (
                <Link key={category.href} href={category.href} className="hero-category-tile">
                  <span className="hero-category-image">
                    <Image
                      src={category.image}
                      alt=""
                      fill
                      sizes="(max-width: 560px) 100vw, (max-width: 980px) 50vw, 33vw"
                      style={{ objectFit: "cover", objectPosition: "imagePosition" in category ? category.imagePosition : "center" }}
                    />
                  </span>
                  <span className="hero-category-body">
                    <span className="hero-category-icon">
                      <Icon size={20} strokeWidth={1.9} aria-hidden="true" />
                    </span>
                    <span>
                      <strong style={{ display: "block", fontSize: "15px", lineHeight: 1.2, color: "#ffffff" }}>{category.label}</strong>
                      <span style={{ display: "block", marginTop: "5px", color: "rgba(226,241,255,0.72)", fontSize: "12px" }}>
                        {category.detail}
                      </span>
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>

          {featured.length > 0 ? (
            <div
              className="hero-feature-stage"
              data-paused={isPaused}
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
              onFocus={() => setIsPaused(true)}
              onBlur={() => setIsPaused(false)}
              onMouseDown={() => setIsPaused(true)}
              onMouseUp={() => setIsPaused(false)}
              onTouchStart={() => setIsPaused(true)}
              onTouchEnd={() => setIsPaused(false)}
            >
              <div className="hero-feature-track">
                {heroFeaturedItems.map((product, index) => {
                  const pricing = getProductPricing(product);
                  const isClone = index >= featured.length;
                  return (
                    <Link
                      key={`${product.slug}-${index}`}
                      href={`/products/${product.slug}`}
                      className="hero-feature-card"
                      aria-hidden={isClone}
                      tabIndex={isClone ? -1 : undefined}
                    >
                      <div className="hero-feature-copy">
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                          <span className="badge badge-blue-light">Founder selected</span>
                          <span className="badge badge-green-light">{getHeroInventoryBadge(product)}</span>
                          {product.promoLabel ? <span className="badge badge-amber-light">{product.promoLabel}</span> : null}
                        </div>
                        <h2 style={{ margin: "0 0 8px", color: "#ffffff", fontSize: "24px", lineHeight: 1.08, fontWeight: 850 }}>
                          {product.displayName}
                        </h2>
                        <p style={{ margin: "0 0 12px", color: "rgba(230,240,255,0.76)", fontSize: "13px", lineHeight: 1.55, fontWeight: 600 }}>
                          {product.fullName || "Featured research listing"}
                        </p>
                        {pricing.discountedPrice ? (
                          <div style={{ display: "flex", gap: 9, alignItems: "baseline", marginBottom: 8 }}>
                            <strong style={{ color: "#ffffff", fontSize: "20px" }}>{pricing.discountedPrice}</strong>
                            {pricing.originalPrice ? <span style={{ color: "var(--text-muted)", textDecoration: "line-through" }}>{pricing.originalPrice}</span> : null}
                          </div>
                        ) : pricing.originalPrice ? (
                          <strong style={{ display: "block", color: "#ffffff", fontSize: "18px", marginBottom: 8 }}>{pricing.originalPrice}</strong>
                        ) : null}
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 7, color: "var(--accent-500)", fontSize: "13px", fontWeight: 700 }}>
                          View listing <ArrowRight size={14} aria-hidden="true" />
                        </span>
                      </div>
                      <div className="hero-feature-image">
                        <Image
                          src={getProductImageSrc(product)}
                          alt={product.displayName}
                          fill
                          sizes="(max-width: 980px) 80vw, 180px"
                          style={{ objectFit: "contain", padding: "16px" }}
                        />
                      </div>
                    </Link>
                  );
                })}
              </div>
              <div className="hero-feature-dots" aria-label="Featured products">
                {featured.slice(0, 7).map((product, index) => (
                  <button
                    key={product.slug}
                    type="button"
                    className="hero-feature-dot"
                    data-active={index === activeIndex % featured.length}
                    aria-label={`Show ${product.displayName}`}
                    onClick={() => setActiveIndex(index)}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="hero-feature-card" style={{ gridTemplateColumns: "1fr" }}>
              <Beaker size={26} aria-hidden="true" />
              <h2 style={{ margin: 0, color: "var(--text-primary)", fontSize: "22px" }}>Featured catalog loading</h2>
              <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "13px" }}>
                Founder-selected products will appear here when available.
              </p>
            </div>
          )}

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {[
              { label: "Live inventory", icon: ShieldCheck },
              { label: "CoA-aware listings", icon: BadgeCheck },
              { label: "Fast checkout flow", icon: ArrowRight },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <span
                  key={item.label}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 7,
                    color: "var(--text-secondary)",
                    fontSize: "12px",
                  }}
                >
                  <Icon size={14} color="#4dd3e8" aria-hidden="true" />
                  {item.label}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </section>
    </>
  );
}
