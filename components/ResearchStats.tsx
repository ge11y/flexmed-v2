"use client";

import { useState, useEffect, useRef } from "react";

const CIRCUMFERENCE = 2 * Math.PI * 64; // ≈ 402.12

function CircleStat({ target, label, suffix = "" }: { target: number; label: string; suffix?: string }) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // Start animation shortly after mount so SSR shows 0, then animate to target
    const frame = requestAnimationFrame(() => {
      const start = performance.now()
      const duration = 1500
      const tick = (now: number) => {
        const p = Math.min((now - start) / duration, 1)
        // Ease-out cubic
        const eased = 1 - Math.pow(1 - p, 3)
        setProgress(Math.round(eased * target))
        if (p < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    })
    return () => cancelAnimationFrame(frame)
  }, [target])

  const dashOffset = (progress / 100) * CIRCUMFERENCE

  return (
    <div
      style={{
        backgroundColor: "var(--bg-surface)",
        borderRadius: 20,
        padding: "40px 24px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        border: "1px solid var(--border)",
      }}
    >
      <svg width={140} height={140} viewBox="0 0 160 160" aria-label={`${target}${suffix}`}>
        {/* Track */}
        <circle cx={80} cy={80} r={64} fill="none" stroke="rgba(196,168,130,0.12)" strokeWidth={10} />
        {/* Progress arc */}
        <circle
          cx={80}
          cy={80}
          r={64}
          fill="none"
          stroke="var(--amber)"
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={`${dashOffset} ${CIRCUMFERENCE}`}
          transform="rotate(-90 80 80)"
        />
        {/* Value */}
        <text x={80} y={80} textAnchor="middle" dominantBaseline="central" fontSize={28} fontWeight={700} fill="var(--text-primary)">
          {progress}{suffix}
        </text>
      </svg>
      <p
        style={{
          fontSize: 13,
          color: "#D0CCC4",
          textAlign: "center",
          marginTop: 16,
          lineHeight: 1.6,
          maxWidth: 160,
        }}
      >
        {label}
      </p>
    </div>
  )
}

const STATS = [
  { target: 16, suffix: "", label: "Research compounds in catalog — all batch-tested" },
  { target: 97, suffix: "%", label: "Minimum purity threshold for compound release" },
  { target: 100, suffix: "%", label: "CoAs published before any batch ships" },
]

export function ResearchStats() {
  return (
    <section style={{ backgroundColor: "var(--bg-surface)", padding: "80px 40px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <h2
          style={{
            fontSize: 36,
            fontWeight: 700,
            color: "var(--text-primary)",
            textAlign: "center",
            marginBottom: 12,
          }}
        >
          Research Transparency Standards
        </h2>
        <p
          style={{
            fontSize: 15,
            color: "var(--text-muted)",
            textAlign: "center",
            maxWidth: 600,
            margin: "0 auto 48px",
          }}
        >
          Every standard FlexMed applies exists to give institutional buyers the documentation they need for procurement and regulatory review.
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 20,
          }}
        >
          {STATS.map((stat) => (
            <CircleStat key={stat.label} target={stat.target} label={stat.label} suffix={stat.suffix} />
          ))}
        </div>
      </div>
    </section>
  )
}
