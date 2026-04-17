import Image from 'next/image';
import { Check } from 'lucide-react';

const checklistItems = [
  'Neuroscience-backed subconscious retraining',
  'Nervous-system regulation',
  'Behavioral and identity change',
  'Real-world application paired with medical care',
];

export function FeaturedProgram() {
  return (
    <section style={{ background: 'white', padding: '80px 40px' }}>
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          gap: 40,
        }}
      >
        {/* Left column — phone mockup */}
        <div style={{ flex: '0 0 45%', position: 'relative', borderRadius: 16, overflow: 'hidden' }}>
          <Image
            src="/images/Screenshot-2026-01-08-at-2.01.33-PM-1.png"
            alt="Lose It For Life app mockup"
            width={400}
            height={600}
            style={{ display: 'block', width: '100%', height: 'auto' }}
          />
        </div>

        {/* Right column — content */}
        <div style={{ flex: '0 0 55%', paddingLeft: 60 }}>
          {/* Badge */}
          <div
            style={{
              display: 'inline-block',
              background: 'rgba(159, 183, 120, 0.2)',
              color: 'rgb(80, 120, 40)',
              borderRadius: 50,
              padding: '6px 16px',
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 16,
            }}
          >
            Featured Program
          </div>

          {/* Heading */}
          <h2
            style={{
              fontSize: 44,
              fontWeight: 700,
              color: 'rgb(29, 29, 31)',
              lineHeight: 1.1,
              marginBottom: 20,
            }}
          >
            Featured Program: Lose It For Life™
          </h2>

          {/* Body 1 */}
          <p
            style={{
              fontSize: 16,
              color: 'rgba(29, 29, 31, 0.75)',
              lineHeight: 1.6,
            }}
          >
            Lose it for Life™ is Telezen MD&apos;s flagship weight-loss education system, designed to work
            alongside GLP-1 therapy and other medical treatments.
          </p>

          {/* Body 2 */}
          <p
            style={{
              fontSize: 16,
              color: 'rgba(29, 29, 31, 0.75)',
              lineHeight: 1.6,
              marginTop: 12,
              marginBottom: 16,
            }}
          >
            Patients receive access to a complete, step-by-step program that combines:
          </p>

          {/* Checklist */}
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {checklistItems.map((item) => (
              <li
                key={item}
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  gap: 10,
                  alignItems: 'flex-start',
                  marginBottom: 12,
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    display: 'inline-flex',
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                >
                  <Check size={16} color="rgb(100, 160, 60)" strokeWidth={3} />
                  <Check size={16} color="rgb(100, 160, 60)" strokeWidth={3} style={{ marginLeft: -8 }} />
                </span>
                <span style={{ fontSize: 16, color: 'rgba(29, 29, 31, 0.8)' }}>{item}</span>
              </li>
            ))}
          </ul>

          {/* CTA */}
          <div style={{ marginTop: 32 }}>
            <a
              href="https://join.telezenmd.com/start-online-visit/medicalweightlossintake"
              style={{
                display: 'inline-block',
                background: 'rgb(34, 34, 34)',
                color: 'white',
                borderRadius: 50,
                padding: '14px 40px',
                fontSize: 16,
                fontWeight: 500,
                textDecoration: 'none',
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
