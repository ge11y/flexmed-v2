import Image from 'next/image';

const cards = [
  {
    src: '/images/Group-1000004652.png',
    alt: 'Choose your GLP-1 option',
  },
  {
    src: '/images/Group-1000004653.png',
    alt: 'Compounded GLP-1',
  },
  {
    src: '/images/Group-1000004653-1.png',
    alt: 'Compounded GLP-1+GIP',
  },
  {
    src: '/images/Group-1000004653-2.png',
    alt: 'Device options',
  },
];

export function PricingCarousel() {
  return (
    <section style={{ background: 'white', padding: '60px 40px' }}>
      <style>{`
        .pricing-carousel::-webkit-scrollbar { display: none; }
        .pricing-carousel { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Headings */}
      <div style={{ textAlign: 'center' }}>
        <h2
          style={{
            fontSize: 36,
            fontWeight: 700,
            color: 'rgb(29, 29, 31)',
            margin: 0,
          }}
        >
          Flexible Weight Loss Care - Without Insurance
        </h2>
        <p
          style={{
            fontSize: 16,
            color: 'rgba(29, 29, 31, 0.6)',
            marginTop: 8,
            marginBottom: 40,
          }}
        >
          Transparent pricing. Multiple options. Doctor-guided care.
        </p>
      </div>

      {/* Carousel */}
      <div
        className="pricing-carousel"
        style={{
          display: 'flex',
          gap: 16,
          overflowX: 'auto',
          padding: '0 40px',
          scrollSnapType: 'x mandatory',
        }}
      >
        {cards.map((card) => (
          <div
            key={card.src}
            style={{
              scrollSnapAlign: 'start',
              minWidth: 280,
              borderRadius: 16,
              overflow: 'hidden',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <Image
              src={card.src}
              alt={card.alt}
              width={280}
              height={380}
              style={{ display: 'block', width: '100%', height: 'auto', objectFit: 'cover' }}
            />
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{ textAlign: 'center', marginTop: 32 }}>
        <a
          href="https://join.telezenmd.com/start-online-visit/medicalweightlossintake"
          style={{
            display: 'inline-block',
            background: 'rgb(34, 34, 34)',
            color: 'white',
            borderRadius: 50,
            padding: '14px 48px',
            fontSize: 16,
            fontWeight: 500,
            textDecoration: 'none',
          }}
        >
          Get Started
        </a>
      </div>
    </section>
  );
}
