/* ------------------------------------------------------------------ */
/* EverythingYouGet — 2×4 grid of catalog trust/feature cards        */
/* ------------------------------------------------------------------ */

const CARDS = [
  {
    label: "Catalog Standard",
    text: "Every entry is a research reference — not a product page. No usage instructions, no dosing language, no therapeutic claims.",
  },
  {
    label: "Batch Transparency",
    text: "Each product page publishes the testing lab, methodology, purity result, and batch CoA before any order is fulfilled.",
  },
  {
    label: "Third-Party Testing",
    text: "All testing is conducted by ISO-accredited third-party laboratories with no commercial relationship to FlexMed.",
  },
  {
    label: "Verified Records",
    text: "Product details, pricing, inventory status, and documentation are reviewed before orders are fulfilled.",
  },
  {
    label: "Documentation-First",
    text: "CoAs precede all product availability. If a CoA is not published for a batch, that batch is not available for order.",
  },
  {
    label: "No Self-Certification",
    text: "FlexMed does not self-certify. Third-party testing is not optional, not deferred, and not aggregated across batches.",
  },
];

export function EverythingYouGet() {
  return (
    <section
      style={{
        backgroundColor: "var(--bg-base)",
        padding: "80px 40px",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <h2
          style={{
            fontSize: 36,
            fontWeight: 700,
            color: "var(--text-primary)",
            textAlign: "center",
            marginBottom: 12,
          }}
        >
          Catalog &amp; Research Standards
        </h2>
        <p
          style={{
            fontSize: 15,
            color: "var(--text-muted)",
            textAlign: "center",
            marginBottom: 48,
          }}
        >
          What FlexMed requires before any peptide reaches procurement
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 16,
          }}
        >
          {CARDS.map(({ label, text }) => (
            <div
              key={label}
              style={{
                backgroundColor: "var(--bg-surface)",
                borderRadius: 16,
                padding: "24px 28px",
                border: "1px solid var(--border)",
              }}
            >
              <p
                style={{
                  fontSize: "11px",
                  fontFamily: "var(--font-mono)",
                  letterSpacing: "0.10em",
                  textTransform: "uppercase",
                  color: "var(--amber)",
                  marginBottom: 8,
                  fontWeight: 600,
                }}
              >
                {label}
              </p>
              <p
                style={{
                  fontSize: 14,
                  color: "var(--text-secondary)",
                  lineHeight: 1.6,
                }}
              >
                {text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
