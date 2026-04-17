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
                      fontWeight: 700,
                      letterSpacing: "0.10em",
                      textTransform: "uppercase",
                      padding: "3px 8px",
                      borderRadius: "9999px",
                      display: "inline-block",
                      marginBottom: 6,
                      background:
                        product.category === "Growth Hormone Research" ? "rgba(100,220,140,0.12)" :
                        product.category === "Metabolic Research" ? "rgba(160,130,240,0.12)" :
                        product.category === "Neuropeptide Research" ? "rgba(240,200,120,0.12)" :
                        product.category === "Telomere Research" ? "rgba(100,190,240,0.12)" :
                        product.category === "Antioxidant Research" ? "rgba(240,130,160,0.12)" :
                        product.category === "Inflammatory Research" ? "rgba(140,230,110,0.12)" :
                        product.category === "Mitochondrial Research" ? "rgba(120,230,130,0.12)" :
                        product.category === "Cellular Health Research" ? "rgba(240,180,100,0.12)" :
                        "rgba(130,190,240,0.12)",
                      color:
                        product.category === "Growth Hormone Research" ? "#6DD88C" :
                        product.category === "Metabolic Research" ? "#9A80F0" :
                        product.category === "Neuropeptide Research" ? "#F0C060" :
                        product.category === "Telomere Research" ? "#60B8F0" :
                        product.category === "Antioxidant Research" ? "#F07090" :
                        product.category === "Inflammatory Research" ? "#88E060" :
                        product.category === "Mitochondrial Research" ? "#60E070" :
                        product.category === "Cellular Health Research" ? "#F0A050" :
                        "#70B8F0",
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
                      color: "#D0CCC4",
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
