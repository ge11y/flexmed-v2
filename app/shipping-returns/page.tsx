import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shipping & Returns",
  description: "FlexMed shipping terms, final sale policy, and claim procedures.",
};

export default function ShippingReturnsPage() {
  return (
    <div style={{ backgroundColor: "var(--bg-base)", minHeight: "100vh" }}>
      <section style={{ padding: "72px 0 48px", borderBottom: "1px solid var(--border)" }}>
        <div className="container">
          <div className="section-label" style={{ marginBottom: "12px" }}>
            Shipping &amp; Returns
          </div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2rem, 5vw, 3rem)",
              fontWeight: 400,
              marginBottom: "16px",
              maxWidth: "680px",
            }}
          >
            Shipping terms and final-sale policy for research orders.
          </h1>
          <p style={{ fontSize: "15px", color: "var(--text-secondary)", maxWidth: "560px", lineHeight: 1.7 }}>
            FlexMed provides batch-documented research materials intended solely for laboratory use.
            Please review these shipping and claims terms before placing an order.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div style={{ maxWidth: "760px", display: "flex", flexDirection: "column", gap: "28px" }}>
            {[
              {
                title: "Shipping Terms",
                body:
                  "Shipping timelines and carrier details are confirmed at the time of order. Risk of loss or damage transfers to the purchaser when the shipment is accepted by the carrier.",
              },
              {
                title: "All Sales Final",
                body:
                  "Due to the nature of research materials, all sales are final. Returns and exchanges are not accepted once an order has shipped.",
              },
              {
                title: "Damage or Missing Item Claims",
                body:
                  "If an order arrives damaged or incomplete, claims must be submitted within 48 hours of delivery. Include order details, a clear description of the issue, and photographic evidence where applicable.",
              },
              {
                title: "Research Use Responsibility",
                body:
                  "The purchasing party is responsible for ensuring that receipt, storage, handling, and use of all materials comply with applicable institutional and regulatory requirements.",
              },
            ].map((item) => (
              <div
                key={item.title}
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-lg)",
                  padding: "24px",
                }}
              >
                <h2
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "16px",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    marginBottom: "10px",
                  }}
                >
                  {item.title}
                </h2>
                <p style={{ margin: 0, fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.8 }}>
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
