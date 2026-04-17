import Image from "next/image";

type Doctor = {
  image: string;
  name: string;
  specialty: string;
  description: string;
  certLabel: string;
  certs: string[];
};

const DOCTORS: Doctor[] = [
  {
    image: "/images/01_dr.png",
    name: "Dr. James Teet, DO",
    specialty: "Board-Certified Family Medicine Physician",
    description:
      "Comprehensive family medicine, preventative care, and evidence-based treatment across the lifespan.",
    certLabel: "Education & Training:",
    certs: [
      "University of Pittsburgh",
      "Philadelphia College of Osteopathic Medicine",
      "UPMC Mercy",
      "South Nassau Community Hospital",
    ],
  },
  {
    image: "/images/03_dr.png",
    name: "Dr. Ozita Cooper, MD",
    specialty: "Dual Board-Certified in Obesity Medicine & Emergency Medicine",
    description:
      "Obesity medicine, metabolic health, weight management, and long-term wellness-focused care.",
    certLabel: "Board Certifications:",
    certs: [
      "American Board of Obesity Medicine",
      "American Board of Emergency Medicine",
    ],
  },
  {
    image: "/images/02_dr.png",
    name: "Dr. Michael Wasef, MD",
    specialty: "Board-Certified Internal Medicine Physician",
    description:
      "Internal medicine, telemedicine, and personalized care with a focus on accessibility and continuity.",
    certLabel: "Education & Training:",
    certs: ["University of South Florida – Morsani College of Medicine"],
  },
  {
    image: "/images/04_dr.png",
    name: "Dr. Andrew Sakla, DO",
    specialty: "Board-Certified Internal Medicine Physician",
    description:
      "Internal medicine, preventative care, chronic disease management, and telehealth-based patient care.",
    certLabel: "Education:",
    certs: ["Nova Southeastern University College of Osteopathic Medicine"],
  },
];

export function PhysicianCare() {
  return (
    <section
      style={{
        backgroundColor: "white",
        padding: "80px 40px",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Headings */}
        <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
          <h2
            style={{
              fontSize: 40,
              fontWeight: 700,
              color: "rgb(29, 29, 31)",
              textAlign: "center",
            }}
          >
            Physician-Led Care You Can Trust
          </h2>
          <p
            style={{
              fontSize: 16,
              color: "rgba(29, 29, 31, 0.7)",
              textAlign: "center",
              marginTop: 16,
              lineHeight: 1.6,
            }}
          >
            Telezen MD is led by a board-certified medical team dedicated to
            providing safe, effective, and science-backed treatments. Our
            U.S.-licensed healthcare providers carefully evaluate each patient
            and create personalized prescription treatment plans tailored to
            your unique goals — from vitality and wellness to longevity and
            aesthetic health.
          </p>

          {/* CTA buttons */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 16,
              marginTop: 32,
              marginBottom: 56,
              flexWrap: "wrap",
            }}
          >
            <a
              href="https://join.telezenmd.com/start-online-visit/medicalweightlossintake"
              style={{
                display: "inline-block",
                backgroundColor: "rgb(29, 29, 31)",
                color: "white",
                borderRadius: 50,
                padding: "14px 36px",
                fontSize: 15,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Get Started
            </a>
            <a
              href="https://join.telezenmd.com/start-online-visit/medicalweightlossintake"
              style={{
                display: "inline-block",
                backgroundColor: "transparent",
                color: "rgb(29, 29, 31)",
                border: "1.5px solid rgb(29, 29, 31)",
                borderRadius: 50,
                padding: "14px 36px",
                fontSize: 15,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              See if you&apos;re eligible
            </a>
          </div>
        </div>

        {/* Doctor cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 24,
          }}
        >
          {DOCTORS.map((doctor) => (
            <div
              key={doctor.name}
              style={{
                backgroundColor: "white",
                borderRadius: 20,
                overflow: "hidden",
                border: "1px solid rgb(229, 229, 229)",
              }}
            >
              {/* Doctor image */}
              <div style={{ position: "relative", width: "100%", height: 320 }}>
                <Image
                  src={doctor.image}
                  alt={doctor.name}
                  width={400}
                  height={380}
                  style={{
                    width: "100%",
                    height: 320,
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              </div>

              {/* Doctor info */}
              <div style={{ padding: 24 }}>
                <h3
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: "rgb(29, 29, 31)",
                    margin: 0,
                  }}
                >
                  {doctor.name}
                </h3>
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "rgb(159, 183, 120)",
                    marginTop: 4,
                    margin: "4px 0 0",
                  }}
                >
                  {doctor.specialty}
                </p>
                <p
                  style={{
                    fontSize: 14,
                    color: "rgba(29, 29, 31, 0.7)",
                    marginTop: 12,
                    lineHeight: 1.5,
                  }}
                >
                  {doctor.description}
                </p>

                {/* Certifications */}
                <p
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "rgba(29, 29, 31, 0.5)",
                    marginTop: 16,
                    marginBottom: 4,
                  }}
                >
                  {doctor.certLabel}
                </p>
                <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                  {doctor.certs.map((cert) => (
                    <li
                      key={cert}
                      style={{
                        fontSize: 13,
                        color: "rgba(29, 29, 31, 0.65)",
                        lineHeight: 1.8,
                      }}
                    >
                      {cert}
                    </li>
                  ))}
                </ul>

                {/* Footer note */}
                <p
                  style={{
                    fontSize: 12,
                    color: "rgba(29, 29, 31, 0.45)",
                    marginTop: 12,
                    fontStyle: "italic",
                  }}
                >
                  Providing patient care through Telezen MD&apos;s
                  physician-led telehealth platform.
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
