"use client";

import Image from "next/image";
import { useState } from "react";
import Link from "next/link";
import { CheckCircle, AlertCircle, FileText, Truck } from "lucide-react";

/* ------------------------------------------------------------------ */
/* FlexMed homepage hero — split-panel: sticky image + scrollable info */
/* ------------------------------------------------------------------ */

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "specifications", label: "Specifications" },
  { id: "compliance", label: "Compliance" },
] as const;
type Tab = (typeof TABS)[number]["id"];

const TRUST_ITEMS = [
  { icon: <FileText size={16} />, text: "Third-party tested, every batch" },
  { icon: <CheckCircle size={16} />, text: "CoA published before procurement" },
  { icon: <AlertCircle size={16} />, text: "No pricing — quote-first model" },
  { icon: <Truck size={16} />, text: "Institutional accounts only" },
];

const FAQS = [
  {
    q: "How is compound identity verified?",
    a: "Each batch undergoes HPLC purity analysis and MS molecular weight confirmation by an independent ISO-accredited laboratory before results are published.",
  },
  {
    q: "What documentation is provided with each order?",
    a: "A Certificate of Analysis (CoA) for the specific batch is published on the product page and provided with every fulfilled order, including identity, purity, and methodology.",
  },
  {
    q: "Who can purchase from FlexMed?",
    a: "FlexMed supplies verified institutional buyers — university labs, contract research organizations, and licensed research facilities. All accounts are reviewed before first order.",
  },
];

function OverviewTab() {
  return (
    <div>
      {TRUST_ITEMS.map((item, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: "12px",
            padding: "10px 0",
            borderBottom: i < TRUST_ITEMS.length - 1 ? "1px solid var(--border)" : "none",
          }}
        >
          <span style={{ color: "var(--amber)", flexShrink: 0 }}>{item.icon}</span>
          <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>{item.text}</span>
        </div>
      ))}
    </div>
  );
}

function SpecificationsTab() {
  return (
    <div style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.7 }}>
      <p style={{ marginBottom: "8px", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: "11px", letterSpacing: "0.06em" }}>COMPOUND SPECIFICATIONS</p>
      <p>Compound identity confirmed via HPLC and MS. Purity &ge;97% required for release. Full methodology published on each product page.</p>
    </div>
  );
}

function ComplianceTab() {
  return (
    <div style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.7 }}>
      <p style={{ marginBottom: "8px", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: "11px", letterSpacing: "0.06em" }}>RESEARCH COMPLIANCE</p>
      <p>All compounds are sold for in-vitro and in-vivo research use only. FlexMed does not sell investigational or finished pharmaceutical products. No human-use claims are made on this site.</p>
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
        marginBottom: "8px",
      }}
    >
      <button
        onClick={() => setOpen(!open)}
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
        <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)", flex: 1, marginRight: "12px" }}>
          {q}
        </span>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>
          <path d="M2 4.5L7 9.5L12 4.5" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "10px", lineHeight: 1.6 }}>
          {a}
        </p>
      )}
    </div>
  );
}

export function HeroSection() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  return (
    <section
      style={{
        display: "flex",
        minHeight: "100vh",
        paddingTop: "68px",
        fontFamily: "var(--font-body)",
      }}
    >
      {/* LEFT — sticky product image panel */}
      <div
        style={{
          width: "54%",
          position: "sticky",
          top: "68px",
          height: "calc(100vh - 68px)",
          overflow: "hidden",
          background: "var(--bg-surface)",
          borderRight: "1px solid var(--border)",
        }}
      >
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          <Image
            src="/products/cjc-ipa-10mg/front.png"
            alt="FlexMed compound catalog"
            fill
            style={{ objectFit: "cover" }}
            priority
          />
          {/* Overlay label */}
          <div
            style={{
              position: "absolute",
              bottom: "24px",
              left: "24px",
              background: "rgba(10, 11, 14, 0.85)",
              backdropFilter: "blur(8px)",
              borderRadius: "8px",
              padding: "10px 16px",
              border: "1px solid var(--border)",
            }}
          >
            <p style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--text-muted)", marginBottom: "2px" }}>FLEXMED CATALOG</p>
            <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>16 Research Compounds</p>
            <p style={{ fontSize: "12px", color: "var(--amber)" }}>All batch-tested</p>
          </div>
        </div>
      </div>

      {/* RIGHT — scrollable content */}
      <div
        style={{
          width: "46%",
          overflowY: "auto",
          padding: "56px 48px 80px",
        }}
      >
        {/* Eyebrow */}
        <p
          style={{
            fontSize: "11px",
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--amber)",
            marginBottom: "16px",
          }}
        >
          Research-Grade Compounds
        </p>

        {/* H1 */}
        <h1
          style={{
            fontSize: "36px",
            fontWeight: 700,
            color: "var(--text-primary)",
            lineHeight: 1.1,
            marginBottom: "20px",
          }}
        >
          Research compounds presented with clarity.
        </h1>

        {/* Sub */}
        <p
          style={{
            fontSize: "15px",
            color: "var(--text-secondary)",
            lineHeight: 1.6,
            marginBottom: "28px",
            maxWidth: "460px",
          }}
        >
          Every batch third-party tested. Every CoA published before procurement. No marketing language, no dosage guidance — just verified research compounds for verified institutions.
        </p>

        {/* CTAs */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "28px", flexWrap: "wrap" }}>
          <Link href="/products" className="fm-btn-primary">
            View Catalog
          </Link>
          <Link href="/testing" className="fm-btn-outline">
            Testing Standards
          </Link>
        </div>

        {/* Trust strip */}
        <div
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            borderRadius: "14px",
            padding: "16px",
            marginBottom: "20px",
          }}
        >
          <p
            style={{
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
              color: "var(--text-muted)",
              letterSpacing: "0.08em",
              marginBottom: "12px",
            }}
          >
            RESEARCH STANDARDS
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            {TRUST_ITEMS.map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ color: "var(--amber)", flexShrink: 0 }}>{item.icon}</span>
                <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div
          style={{
            background: "var(--bg-surface)",
            borderRadius: "12px",
            padding: "4px",
            display: "flex",
            marginBottom: "16px",
            border: "1px solid var(--border)",
          }}
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: "9px",
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
          {activeTab === "overview" && <OverviewTab />}
          {activeTab === "specifications" && <SpecificationsTab />}
          {activeTab === "compliance" && <ComplianceTab />}
        </div>

        {/* FAQ */}
        <p
          style={{
            fontSize: "11px",
            fontFamily: "var(--font-mono)",
            color: "var(--text-muted)",
            letterSpacing: "0.08em",
            marginBottom: "12px",
          }}
        >
          FREQUENTLY ASKED
        </p>
        {FAQS.map((faq) => (
          <FaqAccordion key={faq.q} q={faq.q} a={faq.a} />
        ))}

        {/* Disclaimer */}
        <p
          style={{
            fontSize: "11px",
            color: "var(--text-muted)",
            marginTop: "24px",
            lineHeight: 1.6,
            fontStyle: "italic",
          }}
        >
          All FlexMed compounds are sold for laboratory research purposes only. No information on this site is intended to diagnose, treat, cure, or prevent any disease.
        </p>
      </div>
    </section>
  );
}
