import Image from "next/image";
import { CheckCircle } from "lucide-react";

const CHECKLIST_ITEMS = [
  "Physician-guided GLP-1 treatment",
  "Lose It for Life™ neuroscience-based program",
  "24/7 provider messaging & support",
  "Nutrition guidance & injection tutorials",
  "Flexible plans — no long-term contracts",
];

export function MedicalWeightLossCTA() {
  return (
    <section
      style={{
        backgroundColor: "rgb(249, 249, 250)",
        padding: "80px 40px",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          gap: 0,
        }}
      >
        {/* Left: image */}
        <div style={{ flex: "0 0 45%" }}>
          <Image
            src="/images/Frame-124-2-952x1024.png"
            alt="Medical Weight Loss Program"
            width={480}
            height={520}
            style={{ borderRadius: 16, width: "100%", height: "auto" }}
          />
        </div>

        {/* Right: text content */}
        <div style={{ flex: "0 0 55%", paddingLeft: 60 }}>
          {/* Eyebrow */}
          <p
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "rgb(159, 183, 120)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: 12,
              margin: "0 0 12px",
            }}
          >
            Medical Weight Loss
          </p>

          {/* Heading */}
          <h2
            style={{
              fontSize: 40,
              fontWeight: 700,
              color: "rgb(29, 29, 31)",
              lineHeight: 1.1,
              margin: 0,
            }}
          >
            Medical Weight Loss Built for Lasting Change
          </h2>

          {/* Sub */}
          <p
            style={{
              fontSize: 16,
              color: "rgba(29, 29, 31, 0.7)",
              marginTop: 16,
              lineHeight: 1.6,
            }}
          >
            Physician-guided care paired with our proprietary,
            neuroscience-based education and ongoing community support.
          </p>

          {/* Checklist */}
          <div style={{ marginTop: 28 }}>
            {CHECKLIST_ITEMS.map((item) => (
              <div
                key={item}
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 12,
                }}
              >
                <CheckCircle
                  size={18}
                  color="rgb(159, 183, 120)"
                  style={{ flexShrink: 0 }}
                />
                <span
                  style={{
                    fontSize: 15,
                    color: "rgba(29, 29, 31, 0.8)",
                  }}
                >
                  {item}
                </span>
              </div>
            ))}
          </div>

          {/* CTA button */}
          <div style={{ marginTop: 32 }}>
            <a
              href="https://join.telezenmd.com/start-online-visit/medicalweightlossintake"
              style={{
                display: "inline-block",
                backgroundColor: "rgb(29, 29, 31)",
                color: "white",
                borderRadius: 50,
                padding: "16px 48px",
                fontSize: 16,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Get Started
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
