import Image from 'next/image';

const CTA_HREF = 'https://join.telezenmd.com/start-online-visit/medicalweightlossintake';

export function BuiltToLastCTA() {
  return (
    <section
      style={{
        background: 'rgb(246, 248, 242)',
        padding: '80px 40px',
        textAlign: 'center',
      }}
    >
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        {/* Heading */}
        <h2
          style={{
            fontSize: 48,
            fontWeight: 700,
            color: 'rgb(29, 29, 31)',
            lineHeight: 1.1,
            margin: 0,
          }}
        >
          Weight Loss That&apos;s Actually Built To Last
        </h2>

        {/* Buttons */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 16,
            marginTop: 32,
            flexWrap: 'wrap',
          }}
        >
          <a
            href={CTA_HREF}
            style={{
              display: 'inline-block',
              background: 'rgb(34, 34, 34)',
              color: 'white',
              borderRadius: 9999,
              padding: '14px 40px',
              fontSize: 16,
              fontWeight: 500,
              textDecoration: 'none',
            }}
          >
            Get Started
          </a>
          <a
            href={CTA_HREF}
            style={{
              display: 'inline-block',
              background: 'transparent',
              color: 'rgb(34, 34, 34)',
              border: '1.5px solid rgb(34, 34, 34)',
              borderRadius: 9999,
              padding: '14px 40px',
              fontSize: 16,
              fontWeight: 500,
              textDecoration: 'none',
            }}
          >
            See if you&apos;re eligible
          </a>
        </div>

        {/* Comparison image */}
        <div style={{ marginTop: 40 }}>
          <Image
            src="/images/soft_pink_simple_comparison_table_digital_marketing_vs_traditional_marketing_graph__1_-1-scaled.png"
            alt="TeleZen MD vs Traditional Telehealth comparison"
            width={1100}
            height={600}
            style={{ borderRadius: 16, maxWidth: '100%', height: 'auto' }}
          />
        </div>
      </div>
    </section>
  );
}
