import Image from "next/image";

const CARDS = [
  {
    badge: "Lost 30+ lbs",
    image: "/images/your_paragraph_text_-_2026-01-19t112040.176.png",
    quote:
      '"Want to give a quick shoutout to the Telezen MD team! i was super skeptical because I had several bad experience with other telehealth companies. The team has been helpful and the medications have always arrived on time."',
    name: "Theresa S., Telezen MD Patient",
  },
  {
    badge: "Lost 45+ lbs",
    image: "/images/2-1-1.png",
    quote:
      '"My weight struggles date back to early childhood, so this medication has changed my life. I\'ve lost over 45 pounds and I feel great! My experience with Telezen has been great."',
    name: "Grace L., Telezen MD Patient",
  },
  {
    badge: "Lost 28+ lbs",
    image: "/images/3-2.png",
    quote:
      '"My before and after pictures speak for themselves! I love my new body. These medications are life changing or at least they have been for me. Telezen MD has been a pleasure to work with."',
    name: "Patient, Telezen MD",
  },
  {
    badge: "Lost 60+ lbs",
    image: "/images/4-1-1.png",
    quote:
      '"I\'ve been overweight my entire life. Six months later I\'m over 60 pounds down. I\'ve never felt better. Thank you Telezen."',
    name: "Monica G., Telezen MD Patient",
  },
];

const CTA_HREF =
  "https://join.telezenmd.com/start-online-visit/medicalweightlossintake";

export function BeforeAfterSection() {
  return (
    <section
      style={{
        backgroundColor: "white",
        padding: "80px 40px",
      }}
    >
      <style>{`
        .ba-scroll::-webkit-scrollbar { display: none; }
        .ba-scroll { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Heading */}
      <h2
        style={{
          fontSize: "40px",
          fontWeight: 700,
          color: "rgb(29,29,31)",
          textAlign: "center",
          margin: 0,
        }}
      >
        This Is What Sustainable Weight Loss Looks Like
      </h2>

      {/* CTA buttons */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "16px",
          margin: "32px 0",
          flexWrap: "wrap",
        }}
      >
        <a
          href={CTA_HREF}
          style={{
            backgroundColor: "rgb(34,34,34)",
            color: "white",
            borderRadius: "9999px",
            padding: "14px 40px",
            fontWeight: 600,
            fontSize: "15px",
            textDecoration: "none",
            display: "inline-block",
          }}
        >
          Get Started
        </a>
        <a
          href={CTA_HREF}
          style={{
            backgroundColor: "transparent",
            color: "rgb(34,34,34)",
            border: "1.5px solid rgb(34,34,34)",
            borderRadius: "9999px",
            padding: "14px 40px",
            fontWeight: 600,
            fontSize: "15px",
            textDecoration: "none",
            display: "inline-block",
          }}
        >
          See if you&apos;re eligible
        </a>
      </div>

      {/* Cards carousel */}
      <div
        className="ba-scroll"
        style={{
          overflowX: "auto",
          display: "flex",
          gap: "16px",
          paddingBottom: "16px",
        }}
      >
        {CARDS.map((card) => (
          <div
            key={card.name}
            style={{
              width: "360px",
              minWidth: "360px",
              maxWidth: "360px",
              backgroundColor: "white",
              borderRadius: "20px",
              border: "1px solid rgb(229,229,229)",
              padding: "20px",
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            {/* Badge */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                backgroundColor: "rgb(100,160,60)",
                color: "white",
                borderRadius: "50px",
                padding: "5px 16px",
                fontSize: "13px",
                fontWeight: 600,
                marginBottom: "14px",
              }}
            >
              {card.badge}
            </div>

            {/* Image */}
            <Image
              src={card.image}
              alt={card.badge}
              width={240}
              height={180}
              style={{
                objectFit: "cover",
                borderRadius: "10px",
                width: "100%",
                height: "180px",
              }}
            />

            {/* Quote */}
            <p
              style={{
                fontSize: "13px",
                color: "rgba(29,29,31,0.75)",
                marginTop: "14px",
                lineHeight: 1.55,
                fontStyle: "italic",
                margin: "14px 0 0 0",
              }}
            >
              {card.quote}
            </p>

            {/* Name */}
            <p
              style={{
                fontSize: "12px",
                fontWeight: 500,
                color: "rgba(29,29,31,0.5)",
                marginTop: "8px",
              }}
            >
              {card.name}
            </p>

            {/* Stars */}
            <div
              style={{
                color: "rgb(251,188,5)",
                fontSize: "14px",
                marginTop: "6px",
              }}
            >
              ★★★★★
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
