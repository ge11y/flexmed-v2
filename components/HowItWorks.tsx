import Image from "next/image";

type Step = {
  number: string;
  title: string;
  body: string;
  image: string;
};

const STEPS: Step[] = [
  {
    number: "1",
    title: "Start Your Care With a Licensed Physician",
    body: "Complete a short online intake and connect with a licensed medical provider through Telezen MD's secure telehealth platform. Your physician will review your health history and determine whether a personalized treatment plan is appropriate for you.",
    image: "/images/Untitled-design.png",
  },
  {
    number: "2",
    title: "Receive Your Treatment at Home",
    body: "If approved, your prescribed medication is prepared by our partner pharmacy and shipped directly to your home. Delivery is discreet, fast, reliable, and included with your care.",
    image: "/images/Copy-of-Your-paragraph-text-29-1.png",
  },
  {
    number: "3",
    title: "Ongoing Care, Support, and Guidance",
    body: "Telezen MD provides continued physician oversight, 24/7 access to medical support, and a seamless patient portal experience— along with structured digital education and behavioral support designed to help you stay consistent and achieve results.",
    image: "/images/ChatGPT-Image-Jan-9-2026-05_25_10-PM-1.png",
  },
];

export function HowItWorks() {
  return (
    <section
      style={{
        backgroundColor: "rgb(249, 249, 250)",
        padding: "80px 40px",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Eyebrow */}
        <p
          style={{
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "rgb(159, 183, 120)",
            textAlign: "center",
            marginBottom: 12,
          }}
        >
          Getting Started Is Simple
        </p>

        {/* Main heading */}
        <h2
          style={{
            fontSize: 40,
            fontWeight: 700,
            color: "rgb(29, 29, 31)",
            textAlign: "center",
            marginBottom: 48,
          }}
        >
          Doctor-Guided Care, Delivered To Your Door
        </h2>

        {/* Step cards grid */}
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
                backgroundColor: "white",
                borderRadius: 20,
                padding: 32,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Step label */}
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "rgba(29, 29, 31, 0.4)",
                }}
              >
                Step
              </span>

              {/* Step number */}
              <span
                style={{
                  fontSize: 72,
                  fontWeight: 700,
                  color: "rgb(29, 29, 31)",
                  lineHeight: 1,
                }}
              >
                {step.number}
              </span>

              {/* Card title */}
              <h3
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: "rgb(29, 29, 31)",
                  marginTop: 8,
                }}
              >
                {step.title}
              </h3>

              {/* Card body */}
              <p
                style={{
                  fontSize: 14,
                  color: "rgba(29, 29, 31, 0.7)",
                  lineHeight: 1.6,
                  marginTop: 12,
                }}
              >
                {step.body}
              </p>

              {/* Image */}
              <div style={{ marginTop: 24 }}>
                <Image
                  src={step.image}
                  alt={step.title}
                  width={400}
                  height={280}
                  style={{ width: "100%", height: "auto", borderRadius: 12 }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* CTA button */}
        <div style={{ textAlign: "center", marginTop: 48 }}>
          <a
            href="https://join.telezenmd.com/start-online-visit/medicalweightlossintake"
            style={{
              display: "inline-block",
              backgroundColor: "rgb(34, 34, 34)",
              color: "white",
              borderRadius: 50,
              padding: "16px 48px",
              fontSize: 16,
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            Get Started in Just 5 Minutes!
          </a>
        </div>
      </div>
    </section>
  );
}
