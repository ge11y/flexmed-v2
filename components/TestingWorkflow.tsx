/* ------------------------------------------------------------------ */
/* TestingWorkflow — 3-step process section                            */
/* ------------------------------------------------------------------ */

const STEPS = [
  {
    number: "1",
    title: "Batch Submission",
    body: "Each compound batch is received and logged. Unique batch identifiers are assigned and cross-referenced with the compound record before testing begins.",
    icon: "01",
  },
  {
    number: "2",
    title: "Independent HPLC + MS Analysis",
    body: "Every batch is tested by an ISO-accredited third-party laboratory. HPLC quantifies purity; MS confirms molecular identity. Results are reviewed before release.",
    icon: "02",
  },
  {
    number: "3",
    title: "CoA Published + Batch Traceability",
    body: "Results are published on the product page with full methodology, testing lab details, and batch traceability. No batch ships before its CoA is published.",
    icon: "03",
  },
];

export function TestingWorkflow() {
  return (
    <section
      style={{
        backgroundColor: "var(--bg-base)",
        padding: "80px 40px",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Eyebrow */}
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
          Testing & Verification
        </p>

        {/* Heading */}
        <h2
          style={{
            fontSize: 36,
            fontWeight: 700,
            color: "var(--text-primary)",
            textAlign: "center",
            marginBottom: 48,
          }}
        >
          How FlexMed Ensures Batch Integrity
        </h2>

        {/* Step cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 20,
          }}
        >
          {STEPS.map((step) => (
            <div
              key={step.number}
              style={{
                backgroundColor: "var(--bg-surface)",
                borderRadius: 20,
                padding: 32,
                border: "1px solid var(--border)",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "var(--text-muted)",
                  marginBottom: 4,
                }}
              >
                Step
              </span>
              <span
                style={{
                  fontSize: 64,
                  fontWeight: 700,
                  color: "var(--amber)",
                  lineHeight: 1,
                  marginBottom: 16,
                  opacity: 0.25,
                }}
              >
                {step.number}
              </span>
              <h3
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  marginBottom: 12,
                }}
              >
                {step.title}
              </h3>
              <p
                style={{
                  fontSize: 14,
                  color: "var(--text-secondary)",
                  lineHeight: 1.6,
                }}
              >
                {step.body}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ textAlign: "center", marginTop: 48 }}>
          <a
            href="/testing"
            className="fm-btn-outline"
            style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
          >
            View Testing Standards
          </a>
        </div>
      </div>
    </section>
  );
}
