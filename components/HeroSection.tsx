"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { AlertCircle, CheckCircle, FileText, Truck } from "lucide-react";
import { getCatalogDisplayProducts, getProductBySlug, getProductImageSrc } from "@/lib/data-products";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "specifications", label: "Specifications" },
  { id: "compliance", label: "Compliance" },
] as const;

type Tab = (typeof TABS)[number]["id"];

const TRUST_ITEMS = [
  { icon: <FileText size={16} />, text: "Third-party tested before release" },
  { icon: <CheckCircle size={16} />, text: "Published CoA with each available batch" },
  { icon: <AlertCircle size={16} />, text: "Stock status shown on every listing" },
  { icon: <Truck size={16} />, text: "Domestic shipping only" },
];

const FAQS = [
  {
    q: "How is peptide identity verified?",
    a: "Each batch undergoes HPLC purity analysis and MS molecular weight confirmation through an ISO-accredited third-party laboratory before documentation is published.",
  },
  {
    q: "What documentation is available with each listing?",
    a: "Available batches publish a Certificate of Analysis in the COA Testing section with identity, purity, and methodology details.",
  },
  {
    q: "Who can browse the FlexMed catalog?",
    a: "The catalog is open for researchers and institutional representatives reviewing listings for laboratory research workflows.",
  },
];

const HERO_PRODUCT_SLUGS = [
  "cjc-ipa-10mg",
  "tirz-10mg",
  "reta-20mg",
] as const;

function OverviewTab() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        gap: "12px",
      }}
    >
      {TRUST_ITEMS.map((item, index) => (
        <div
          key={index}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "14px 16px",
            borderRadius: "14px",
            border: "1px solid var(--border)",
            background: "rgba(255,255,255,0.9)",
          }}
        >
          <span style={{ color: "var(--amber)", flexShrink: 0 }}>{item.icon}</span>
          <span style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.45 }}>
            {item.text}
          </span>
        </div>
      ))}
    </div>
  );
}

function SpecificationsTab() {
  return (
    <div style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.7 }}>
      <p
        style={{
          marginBottom: "8px",
          color: "var(--text-muted)",
          fontFamily: "var(--font-mono)",
          fontSize: "11px",
          letterSpacing: "0.06em",
        }}
      >
        CATALOG STANDARDS
      </p>
      <p>
        Listings are organized by research area, product family, strength, stock status, and
        linked documentation so researchers can move from overview to batch review without
        jumping between pages.
      </p>
    </div>
  );
}

function ComplianceTab() {
  return (
    <div style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.7 }}>
      <p
        style={{
          marginBottom: "8px",
          color: "var(--text-muted)",
          fontFamily: "var(--font-mono)",
          fontSize: "11px",
          letterSpacing: "0.06em",
        }}
      >
        RESEARCH COMPLIANCE
      </p>
      <p>
        FlexMed listings are presented for laboratory research use only. The site does not
        provide human-use instructions, dosing guidance, veterinary guidance, or therapeutic
        claims.
      </p>
    </div>
  );
}

function FaqAccordion({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: "12px",
        padding: "14px 16px",
        background: "rgba(255,255,255,0.92)",
      }}
    >
      <button
        onClick={() => setOpen((current) => !current)}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
          cursor: "pointer",
          background: "none",
          border: "none",
          padding: 0,
          textAlign: "left",
        }}
      >
        <span
          style={{
            fontSize: "13px",
            fontWeight: 500,
            color: "var(--text-primary)",
            flex: 1,
            marginRight: "12px",
          }}
        >
          {q}
        </span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          style={{
            flexShrink: 0,
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
          }}
        >
          <path
            d="M2 4.5L7 9.5L12 4.5"
            stroke="var(--text-muted)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open ? (
        <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "10px", lineHeight: 1.6 }}>
          {a}
        </p>
      ) : null}
    </div>
  );
}

export function HeroSection() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const heroProducts = HERO_PRODUCT_SLUGS.flatMap((slug) => {
    const product = getProductBySlug(slug);
    return product ? [product] : [];
  });

  return (
    <section
      style={{
        padding: "36px 40px 72px",
        background:
          "radial-gradient(circle at top left, rgba(42,79,174,0.08), transparent 38%), radial-gradient(circle at top right, rgba(155,150,212,0.12), transparent 36%), #ffffff",
        fontFamily: "var(--font-body)",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.1fr) minmax(340px, 0.9fr)",
            gap: "28px",
            alignItems: "stretch",
            marginBottom: "28px",
          }}
        >
          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: "24px",
              background: "rgba(255,255,255,0.86)",
              boxShadow: "0 30px 80px rgba(28, 45, 89, 0.08)",
              padding: "36px",
              backdropFilter: "blur(10px)",
            }}
          >
            <p
              style={{
                fontSize: "11px",
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--amber)",
                marginBottom: "18px",
              }}
            >
              Research-Grade Peptides and Bio Regulators
            </p>

            <h1
              style={{
                fontSize: "clamp(34px, 6vw, 56px)",
                fontWeight: 700,
                color: "var(--text-primary)",
                lineHeight: 1.02,
                marginBottom: "18px",
                maxWidth: "12ch",
              }}
            >
              A true landing page, with the catalog one step deeper.
            </h1>

            <p
              style={{
                fontSize: "16px",
                color: "var(--text-secondary)",
                lineHeight: 1.7,
                marginBottom: "24px",
                maxWidth: "56ch",
              }}
            >
              Browse research categories from the homepage, then move into a separate catalog
              with product menus, keyword search, stock status, and linked CoA documentation.
            </p>

            <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
              <Link href="/products" className="fm-btn-primary">
                Shop Peptides
              </Link>
              <Link href="/products?group=bio_regulators" className="fm-btn-outline">
                Shop Bio Regulators
              </Link>
              <Link href="/testing" className="fm-btn-outline">
                COA Testing
              </Link>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: "14px",
              }}
            >
              <div
                style={{
                  borderRadius: "18px",
                  border: "1px solid var(--border)",
                  background: "rgba(245,247,251,0.92)",
                  padding: "16px",
                }}
              >
                <p style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "var(--font-mono)", letterSpacing: "0.08em", marginBottom: "8px" }}>
                  CATALOG
                </p>
                <p style={{ fontSize: "26px", fontWeight: 700, color: "var(--text-primary)" }}>
                  {getCatalogDisplayProducts().length}
                </p>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                  public research listings
                </p>
              </div>
              <div
                style={{
                  borderRadius: "18px",
                  border: "1px solid var(--border)",
                  background: "rgba(245,247,251,0.92)",
                  padding: "16px",
                }}
              >
                <p style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "var(--font-mono)", letterSpacing: "0.08em", marginBottom: "8px" }}>
                  ACCESS
                </p>
                <p style={{ fontSize: "26px", fontWeight: 700, color: "var(--text-primary)" }}>
                  2
                </p>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                  browsing paths from the homepage
                </p>
              </div>
              <div
                style={{
                  borderRadius: "18px",
                  border: "1px solid var(--border)",
                  background: "rgba(245,247,251,0.92)",
                  padding: "16px",
                }}
              >
                <p style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "var(--font-mono)", letterSpacing: "0.08em", marginBottom: "8px" }}>
                  DOCUMENTS
                </p>
                <p style={{ fontSize: "26px", fontWeight: 700, color: "var(--text-primary)" }}>
                  COA
                </p>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                  testing linked product-by-product
                </p>
              </div>
            </div>
          </div>

          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: "24px",
              background: "linear-gradient(180deg, rgba(245,247,251,0.96) 0%, rgba(255,255,255,0.98) 100%)",
              boxShadow: "0 30px 80px rgba(28, 45, 89, 0.08)",
              padding: "24px",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: "14px",
                marginBottom: "18px",
              }}
            >
              {heroProducts.map((product, index) => (
                <div
                  key={product.slug}
                  style={{
                    borderRadius: "18px",
                    border: "1px solid var(--border)",
                    background: "#ffffff",
                    padding: "16px 14px 14px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    minHeight: "260px",
                    transform: index === 1 ? "translateY(16px)" : "translateY(0)",
                  }}
                >
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      aspectRatio: "1 / 1.25",
                      borderRadius: "14px",
                      background: "rgba(245,247,251,0.92)",
                      overflow: "hidden",
                    }}
                  >
                    <Image
                      src={getProductImageSrc(product)}
                      alt={product.displayName}
                      fill
                      sizes="(max-width: 900px) 33vw, 220px"
                      style={{ objectFit: "contain", padding: "12px" }}
                      priority={index === 0}
                    />
                  </div>
                  <div>
                    <p
                      style={{
                        fontSize: "10px",
                        color: "var(--text-muted)",
                        fontFamily: "var(--font-mono)",
                        letterSpacing: "0.08em",
                        marginBottom: "6px",
                      }}
                    >
                      FEATURED PRODUCT
                    </p>
                    <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.35 }}>
                      {product.displayName}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                borderRadius: "16px",
                border: "1px solid var(--border)",
                background: "rgba(255,255,255,0.92)",
                padding: "16px",
              }}
            >
              <p
                style={{
                  fontSize: "11px",
                  fontFamily: "var(--font-mono)",
                  color: "var(--text-muted)",
                  letterSpacing: "0.08em",
                  marginBottom: "10px",
                }}
              >
                CATALOG FRAMEWORK
              </p>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.65 }}>
                The homepage is now separate from the catalog. Use the research-category cards
                below to narrow the field, or open the full catalog to search by product name,
                category, and collection.
              </p>
            </div>
          </div>
        </div>

        <div
          style={{
            border: "1px solid var(--border)",
            borderRadius: "22px",
            background: "rgba(255,255,255,0.88)",
            boxShadow: "0 24px 70px rgba(28, 45, 89, 0.06)",
            padding: "24px",
          }}
        >
          <div
            style={{
              background: "var(--bg-surface)",
              borderRadius: "14px",
              padding: "4px",
              display: "flex",
              marginBottom: "18px",
              border: "1px solid var(--border)",
              flexWrap: "wrap",
            }}
          >
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1,
                  minWidth: "120px",
                  padding: "10px 12px",
                  textAlign: "center",
                  borderRadius: "10px",
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: "pointer",
                  border: "none",
                  background: activeTab === tab.id ? "var(--bg-elevated)" : "transparent",
                  color: activeTab === tab.id ? "var(--text-primary)" : "var(--text-muted)",
                  transition: "all 0.15s ease",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ marginBottom: "20px" }}>
            {activeTab === "overview" ? <OverviewTab /> : null}
            {activeTab === "specifications" ? <SpecificationsTab /> : null}
            {activeTab === "compliance" ? <ComplianceTab /> : null}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: "10px",
            }}
          >
            {FAQS.map((faq) => (
              <FaqAccordion key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
