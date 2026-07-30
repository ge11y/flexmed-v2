import { useMemo } from "react"
import { usePathname, useSearchParams } from "next/navigation"

export function ResearchUseGateway() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const nextPath = useMemo(() => {
    const explicitNext = searchParams.get("next")
    if (explicitNext?.startsWith("/")) return explicitNext

    const params = new URLSearchParams(searchParams.toString())
    params.delete("next")
    const queryString = params.toString()
    return `${pathname || "/"}${queryString ? `?${queryString}` : ""}`
  }, [pathname, searchParams])

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "rgba(14, 18, 28, 0.68)",
        backdropFilter: "blur(10px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        overflowY: "auto",
      }}
    >
      <form
        action="/api/research-access"
        method="post"
        style={{
          width: "100%",
          maxWidth: "760px",
          maxHeight: "calc(100vh - 48px)",
          background: "#FFFFFF",
          border: "1px solid rgba(28,35,64,0.08)",
          borderRadius: "20px",
          boxShadow: "0 28px 80px rgba(18, 24, 40, 0.28)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <input type="hidden" name="next" value={nextPath} />
        <div
          style={{
            padding: "28px 28px 20px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--text-muted)",
              marginBottom: "10px",
            }}
          >
            Research Access Notice
          </div>
          <h2
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(22px, 3vw, 30px)",
              fontWeight: 600,
              color: "var(--text-primary)",
              lineHeight: 1.2,
              margin: 0,
            }}
          >
            FlexMed sells materials intended solely for scientific and laboratory research purposes.
          </h2>
        </div>

        <div
          style={{
            padding: "24px 28px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            color: "var(--text-secondary)",
            fontSize: "14px",
            lineHeight: 1.75,
            overflowY: "auto",
          }}
        >
          <p style={{ margin: 0 }}>
            Before proceeding, you must acknowledge and agree to the following:
          </p>

          <div>
            <strong style={{ color: "var(--text-primary)" }}>Age Requirement:</strong>{" "}
            You must be at least 21 years of age to purchase from this website.
          </div>
          <div>
            <strong style={{ color: "var(--text-primary)" }}>Intended Use:</strong>{" "}
            All products sold through this website are designated for in vitro research use only.
            These materials are not intended for human consumption, animal use, cosmetic
            application, or use as dietary supplements.
          </div>
          <div>
            <strong style={{ color: "var(--text-primary)" }}>No Medical Guidance:</strong>{" "}
            FlexMed is not a pharmacy, medical provider, or healthcare facility. We do not offer
            medical advice, dosing protocols, reconstitution instructions, or guidance related to
            human use.
          </div>
          <div>
            <strong style={{ color: "var(--text-primary)" }}>Researcher Responsibility:</strong>{" "}
            The purchaser assumes full responsibility for handling all materials in compliance with
            institutional safety guidelines and all applicable local, state, and federal
            regulations.
          </div>
          <div>
            <strong style={{ color: "var(--text-primary)" }}>All Sales Final:</strong>{" "}
            Due to the nature of these products, all sales are final. Returns and exchanges are not
            accepted. Please refer to our shipping and returns policy for information regarding
            damaged or missing items.
          </div>
          <div>
            By checking both boxes, you confirm that you have read, understood, and agree to our{" "}
            <a href="/terms" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-500)", textDecoration: "none" }}>
              Terms and Conditions
            </a>
            ,{" "}
            <a href="/disclaimer" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-500)", textDecoration: "none" }}>
              Disclaimer
            </a>
            , and{" "}
            <a
              href="/shipping-returns"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--accent-500)", textDecoration: "none" }}
            >
              Shipping and Returns Policy
            </a>
            .
          </div>
        </div>

        <div
          style={{
            padding: "0 28px 24px",
            display: "grid",
            gap: "12px",
          }}
        >
          <label
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              fontSize: "14px",
              color: "var(--text-primary)",
              lineHeight: 1.55,
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              required
              name="confirm_21_plus"
              style={{ marginTop: "3px" }}
            />
            I confirm that I am at least 21 years of age.
          </label>

          <label
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              fontSize: "14px",
              color: "var(--text-primary)",
              lineHeight: 1.55,
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              required
              name="confirm_research_only"
              style={{ marginTop: "3px" }}
            />
            I understand these materials are for in vitro research use only, not for human or
            animal use, and I agree to the Terms and Conditions, Disclaimer, and Shipping and
            Returns Policy.
          </label>
        </div>

        <div
          style={{
            padding: "20px 28px 28px",
            borderTop: "1px solid var(--border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
            flexWrap: "wrap",
            background: "#FFFFFF",
            flexShrink: 0,
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "12px",
              color: "var(--text-muted)",
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.03em",
              textTransform: "uppercase",
            }}
          >
            Access is limited to research use acknowledgment.
          </p>
          <p
            style={{
              margin: 0,
              fontSize: "13px",
              color: "var(--text-muted)",
              fontWeight: 500,
            }}
          >
            Check both boxes to continue.
          </p>
          <button
            type="submit"
            style={{
              border: "none",
              borderRadius: "9999px",
              padding: "12px 22px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              background: "var(--accent-500)",
              color: "#FFFFFF",
              transition: "all 0.2s ease",
            }}
          >
            Continue
          </button>
        </div>
      </form>
    </div>
  );
}
