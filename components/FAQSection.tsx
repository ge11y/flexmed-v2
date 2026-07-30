"use client";

import { useState } from "react";
import { FAQ_ITEMS } from "@/lib/data-faq";

/* ------------------------------------------------------------------ */
/* FAQSection — accordion sourced from lib/data-faq.ts                 */
/* ------------------------------------------------------------------ */

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
          Research FAQ
        </h2>
        <p
          style={{
            fontSize: 15,
            color: "var(--text-muted)",
            textAlign: "center",
            marginBottom: 48,
          }}
        >
          Answers to common questions about catalog access, COAs, and research-use handling.
        </p>

        {/* Accordion */}
        {FAQ_ITEMS.slice(0, 8).map((item, index) => {
          const isOpen = openItems.has(index);
          return (
            <div
              key={item.id}
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
                  {item.question}
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
                  {item.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
