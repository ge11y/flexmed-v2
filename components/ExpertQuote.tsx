import Image from "next/image";
import { CheckCircle } from "lucide-react";

export function ExpertQuote() {
  return (
    <section
      style={{
        backgroundColor: "rgb(29,29,31)",
        padding: "80px 40px",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "flex",
          gap: "48px",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        {/* Left: Quote + attribution */}
        <div style={{ flex: "55 55 0%", minWidth: "280px" }}>
          {/* Large quote headline */}
          <h2
            style={{
              fontSize: "28px",
              fontWeight: 700,
              color: "white",
              lineHeight: 1.4,
              marginBottom: "24px",
              margin: "0 0 24px 0",
            }}
          >
            &ldquo;Medication can help you lose weight - but keeping it off is
            where most people struggle, because the{" "}
            <em style={{ textDecoration: "underline" }}>habits</em> and{" "}
            <em style={{ textDecoration: "underline" }}>
              subconscious patterns
            </em>{" "}
            underneath were never addressed.&rdquo;
          </h2>

          {/* Sub text */}
          <p
            style={{
              fontSize: "16px",
              color: "rgba(255,255,255,0.65)",
              lineHeight: 1.6,
              marginBottom: "24px",
              margin: "0 0 24px 0",
            }}
          >
            Many people successfully lose weight with medication, only to regain
            it once old subconscious habits quietly take over again. The number
            on the scale may change — but the internal patterns stay the same.
          </p>

          {/* Attribution */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              gap: "12px",
              alignItems: "center",
              marginTop: "32px",
            }}
          >
            {/* Checkmark circle */}
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                backgroundColor: "rgb(159,183,120)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <CheckCircle size={18} color="white" />
            </div>

            {/* Name block */}
            <div>
              <div
                style={{
                  fontSize: "15px",
                  fontWeight: 600,
                  color: "white",
                }}
              >
                Lina Viner
              </div>
              <div
                style={{
                  fontSize: "13px",
                  color: "rgba(255,255,255,0.55)",
                }}
              >
                Head of Education &amp; Behavioral Science, Telezen MD
              </div>
            </div>
          </div>
        </div>

        {/* Right: Photo */}
        <div style={{ flex: "45 45 0%", minWidth: "240px" }}>
          <Image
            src="/images/Lina.png"
            alt="Lina Viner"
            width={500}
            height={600}
            style={{
              objectFit: "cover",
              borderRadius: "16px",
              width: "100%",
              height: "auto",
            }}
          />
        </div>
      </div>
    </section>
  );
}
