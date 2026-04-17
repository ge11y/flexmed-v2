"use client";

import { useRef, useState, useEffect } from "react";

const CIRCUMFERENCE = 2 * Math.PI * 64; // ≈ 402.12

type CircleChartProps = {
  target: number;
  label: string;
};

function CircleChart({ target, label }: CircleChartProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
          const start = Date.now();
          const tick = () => {
            const elapsed = Date.now() - start;
            const p = Math.min(elapsed / 1500, 1);
            setProgress(Math.round(p * target));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started, target]);

  const dashOffset = (progress / 100) * CIRCUMFERENCE;

  return (
    <div
      ref={ref}
      style={{
        backgroundColor: "white",
        borderRadius: 20,
        padding: "40px 24px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <svg width={160} height={160} viewBox="0 0 160 160">
        {/* Track */}
        <circle
          cx={80}
          cy={80}
          r={64}
          fill="none"
          stroke="rgb(229, 229, 229)"
          strokeWidth={10}
        />
        {/* Progress */}
        <circle
          cx={80}
          cy={80}
          r={64}
          fill="none"
          stroke="rgb(159, 183, 120)"
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={`${dashOffset} ${CIRCUMFERENCE}`}
          transform="rotate(-90 80 80)"
        />
        {/* Center text */}
        <text
          x={80}
          y={80}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={28}
          fontWeight={700}
          fill="rgb(100, 140, 60)"
        >
          {progress}%
        </text>
      </svg>

      <p
        style={{
          fontSize: 14,
          color: "rgba(29, 29, 31, 0.65)",
          textAlign: "center",
          marginTop: 20,
          lineHeight: 1.4,
        }}
      >
        {label}
      </p>
    </div>
  );
}

const STATS: { target: number; label: string }[] = [
  {
    target: 99,
    label: "of Telezen MD reviews are rated 5 stars",
  },
  {
    target: 97,
    label: "of patients say they would recommend Telezen MD to family or friends",
  },
  {
    target: 95,
    label: "of patients report a positive overall experience",
  },
];

export function TrustedStats() {
  return (
    <section
      style={{
        backgroundColor: "rgb(246, 248, 242)",
        padding: "80px 40px",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Heading */}
        <h2
          style={{
            fontSize: 40,
            fontWeight: 700,
            color: "rgb(29, 29, 31)",
            textAlign: "center",
          }}
        >
          Trusted By 100k+ Happy Members
        </h2>

        {/* Sub text */}
        <p
          style={{
            fontSize: 16,
            color: "rgba(29, 29, 31, 0.7)",
            textAlign: "center",
            maxWidth: 700,
            margin: "16px auto 48px",
          }}
        >
          Real people are seeing improvements across weight, energy, metabolism,
          hormone balance, hair health, and overall aging support with Telezen MD.
        </p>

        {/* Stats grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 20,
          }}
        >
          {STATS.map((stat) => (
            <CircleChart key={stat.target} target={stat.target} label={stat.label} />
          ))}
        </div>
      </div>
    </section>
  );
}
