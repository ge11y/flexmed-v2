"use client";

import { useState } from "react";

/* ------------------------------------------------------------------ */
/* FAQSection — accordion with FlexMed research FAQ items             */
/* ------------------------------------------------------------------ */

const FAQ_ITEMS = [
  {
    q: "What is FlexMed's target buyer?",
    a: "FlexMed supplies verified institutional buyers — university laboratories, contract research organizations (CROs), and licensed research facilities. We do not sell to individual consumers or unverified accounts.",
  },
  {
    q: "How does FlexMed verify compound identity and purity?",
    a: "Every batch undergoes HPLC (High-Performance Liquid Chromatography) for purity quantification and MS (Mass Spectrometry) for molecular identity confirmation. Both are conducted by independent ISO-accredited third-party laboratories.",
  },
  {
    q: "When is a CoA required before an order?",
    a: "Always. A Certificate of Analysis for the specific batch must be published on the product page before that batch is made available for order. If no CoA is published, the batch is not available — no exceptions.",
  },
  {
    q: "How are institutional accounts verified?",
    a: "New accounts are reviewed against institutional credentials (lab affiliation, research license, or institutional email domain). FlexMed reserves the right to request documentation before approving any account.",
  },
  {
    q: "What is the quote-first model?",
    a: "FlexMed does not display pricing in the catalog. Quotes are issued based on confirmed batch availability, quantity, and institutional account status. This ensures accurate pricing reflecting current stock.",
  },
  {
    q: "What purity threshold does FlexMed require?",
    a: "A minimum of 97% purity via HPLC is required for any batch to be released. Higher thresholds may apply per compound specification.",
  },
  {
    q: "Are your compounds FDA-approved?",
    a: "No. FlexMed compounds are sold for laboratory research purposes only. They are not FDA-approved, not for human use, and not for clinical or diagnostic applications.",
  },
  {
    q: "What does 'batch traceability' mean?",
    a: "Each batch has a unique identifier (e.g., FM-CJC-IPA-001) that links directly to its published CoA, testing date, testing lab, purity result, and methodology — making audit trails straightforward for institutional procurement.",
  },
];

export function FAQSection() {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set([0]));

  function toggleItem(index: number) {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  return (
    <section
      style={{
        backgroundColor: "var(--bg-surface)",
        padding: "80px 40px",
      }}
    >
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        {/* Heading */}
        <h2
          style={{
            fontSize: 36,
            fontWeight: 700,
            color: "var(--text-primary)",
            textAlign: "center",
            marginBottom: 12,
          }}
        >
          Research &amp; Procurement FAQ
        </h2>
        <p
          style={{
            fontSize: 15,
            color: "var(--text-muted)",
            textAlign: "center",
            marginBottom: 48,
          }}
        >
          Answers to common institutional procurement questions.
        </p>

        {/* Accordion */}
        {FAQ_ITEMS.map((item, index) => {
          const isOpen = openItems.has(index);
          return (
            <div
              key={index}
              style={{
                border: "1px solid var(--border)",
                borderRadius: 12,
                marginBottom: 10,
                background: "var(--bg-elevated)",
                overflow: "hidden",
              }}
            >
              <button
                onClick={() => toggleItem(index)}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "18px 20px",
                  width: "100%",
                  cursor: "pointer",
                  backgroundColor: "transparent",
                  border: "none",
                  textAlign: "left",
                }}
              >
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: "var(--text-primary)",
                    flex: 1,
                    marginRight: 16,
                  }}
                >
                  {item.q}
                </span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  style={{
                    flexShrink: 0,
                    transform: isOpen ? "rotate(180deg)" : "rotate(0)",
                    transition: "transform 0.2s ease",
                  }}
                >
                  <path d="M2 4.5L7 9.5L12 4.5" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {isOpen && (
                <div
                  style={{
                    padding: "0 20px 18px",
                    fontSize: 14,
                    color: "var(--text-secondary)",
                    lineHeight: 1.7,
                  }}
                >
                  {item.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
