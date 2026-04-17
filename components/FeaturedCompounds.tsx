"use client";

import Image from "next/image";
import Link from "next/link";
import { CONFIRMED_SLUGS, PRODUCTS } from "@/lib/data-products";

/* ------------------------------------------------------------------ */
/* FeaturedCompounds — 3-column product grid from FlexMed data        */
/* ------------------------------------------------------------------ */

export function FeaturedCompounds() {
  const featured = CONFIRMED_SLUGS.slice(0, 6)
    .map((s) => PRODUCTS[s])
    .filter(Boolean);

  return (
    <section
      style={{
        backgroundColor: "var(--bg-surface)",
        padding: "80px 40px",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Heading */}
        <p
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--amber)",
            textAlign: "center",
            marginBottom: 12,
          }}
        >
          Research Catalog
        </p>
        <h2
          style={{
            fontSize: 36,
            fontWeight: 700,
            color: "var(--text-primary)",
            textAlign: "center",
            marginBottom: 12,
          }}
        >
          Featured Compounds
        </h2>
        <p
          style={{
            fontSize: 15,
            color: "var(--text-muted)",
            textAlign: "center",
            marginBottom: 48,
          }}
        >
          Batch-verified research compounds from the FlexMed catalog.
        </p>

        {/* 3-column grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 20,
          }}
        >
          {featured.map((product) => (
            <Link
              key={product.slug}
              href={`/products/${product.slug}`}
              style={{ textDecoration: "none" }}
            >
              <div
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  borderRadius: 16,
                  overflow: "hidden",
                  transition: "border-color 0.2s",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border-strong)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)";
                }}
              >
                {/* Product image */}
                <div
                  style={{
                    position: "relative",
                    height: 200,
                    background: "var(--bg-surface)",
                    overflow: "hidden",
                  }}
                >
                  <Image
                    src={`/products/${product.slug}/front.png`}
                    alt={product.displayName}
                    fill
                    style={{ objectFit: "cover" }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: 12,
                      right: 12,
                    }}
                  >
                    <span className="badge badge-green">In Stock</span>
                  </div>
                </div>

                {/* Info */}
                <div style={{ padding: "20px" }}>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "10px",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "var(--pastel-mint)",
                      display: "block",
                      marginBottom: 6,
                    }}
                  >
                    {product.category}
                  </span>
                  <h3
                    style={{
                      fontSize: "16px",
                      fontWeight: 700,
                      color: "var(--text-primary)",
                      marginBottom: 6,
                    }}
                  >
                    {product.displayName}
                  </h3>
                  <p
                    style={{
                      fontSize: "13px",
                      color: "var(--text-secondary)",
                      lineHeight: 1.5,
                      marginBottom: 12,
                    }}
                  >
                    {product.summaryShort}
                  </p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                      {product.fullName}
                    </span>
                    <span
                      style={{
                        fontSize: "11px",
                        color: "var(--amber)",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      View →
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div style={{ textAlign: "center", marginTop: 48 }}>
          <Link href="/products" className="fm-btn-primary">
            Browse Full Catalog
          </Link>
        </div>
      </div>
    </section>
  );
}
