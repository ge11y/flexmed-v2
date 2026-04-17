"use client";

const CTA_HREF =
  "https://join.telezenmd.com/start-online-visit/medicalweightlossintake";

export function GuaranteeCTA() {
  return (
    <section
      style={{
        backgroundColor: "rgb(29,29,31)",
        padding: "80px 60px",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Decorative circle */}
      <div
        style={{
          position: "absolute",
          right: "-100px",
          top: "-100px",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          backgroundColor: "rgba(255,255,255,0.04)",
          pointerEvents: "none",
        }}
      />

      {/* Content */}
      <div
        style={{
          maxWidth: "650px",
          position: "relative",
          zIndex: 10,
        }}
      >
        {/* Eyebrow badge */}
        <div
          style={{
            display: "inline-block",
            backgroundColor: "rgba(159,183,120,0.2)",
            color: "rgb(159,183,120)",
            borderRadius: "50px",
            padding: "6px 16px",
            fontSize: "13px",
            fontWeight: 600,
            marginBottom: "20px",
          }}
        >
          Weight Loss Guarantee
        </div>

        {/* Heading */}
        <h2
          style={{
            fontSize: "44px",
            fontWeight: 700,
            color: "white",
            lineHeight: 1.1,
            marginBottom: "20px",
            margin: "0 0 20px 0",
          }}
        >
          180 Day Weight Loss Guarantee
        </h2>

        {/* Sub text */}
        <p
          style={{
            fontSize: "16px",
            color: "rgba(255,255,255,0.7)",
            lineHeight: 1.6,
            marginBottom: "32px",
            margin: "0 0 32px 0",
          }}
        >
          When you trust the science and stick to your plan, the results will
          blow you away! *Check Weight Loss Guarantee Rules on Returns &amp;
          Refunds Page
        </p>

        {/* CTA button */}
        <a
          href={CTA_HREF}
          style={{
            backgroundColor: "white",
            color: "rgb(29,29,31)",
            borderRadius: "50px",
            padding: "16px 40px",
            fontSize: "16px",
            fontWeight: 600,
            display: "inline-block",
            textDecoration: "none",
            transition: "background-color 0.2s",
          }}
          onMouseOver={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
              "rgb(240,240,240)";
          }}
          onMouseOut={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
              "white";
          }}
        >
          Sign Me Up! Start My Visit Now
        </a>

        {/* Promo code */}
        <p
          style={{
            fontSize: "14px",
            color: "rgba(255,255,255,0.5)",
            marginTop: "16px",
          }}
        >
          use code save25 to save $25
        </p>
      </div>
    </section>
  );
}
