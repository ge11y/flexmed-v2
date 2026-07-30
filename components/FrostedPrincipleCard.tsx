"use client";

import { useState } from "react";

interface PrincipleItem {
  label: string;
  detail: string;
  accent: string;
  bg: string;
  border: string;
  text?: string;
  activeText?: string;
  motion: "inspect" | "certify" | "access" | "track";
}

const ICON_COLORS: Record<PrincipleItem["motion"], string> = {
  inspect: "#06446c",
  certify: "#1959b6",
  access: "#0a8f8a",
  track: "#213f9a",
}

function PrincipleIcon({ motion }: { motion: PrincipleItem["motion"] }) {
  const svgProps = {
    width: 33,
    height: 33,
    style: { display: "block", overflow: "visible" },
    "aria-hidden": "true",
  } as const

  if (motion === "inspect") {
    return (
      <svg {...svgProps} className="principle-svg principle-svg-inspect" viewBox="0 0 48 48">
        <g className="microscope-body" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 10h9v6h-9z" />
          <path d="M25 16v5" />
          <path d="M19 20l11 6" />
          <path d="M18 27c-2 2.2-3.1 4.7-3.1 7.5" />
          <path d="M14 38h23" />
          <path d="M20 34h11" />
          <path d="M34 30c1.4 1.2 2.4 2.7 3 4.5" />
        </g>
        <g className="microscope-lens">
          <circle cx="31" cy="27" r="6.2" fill="rgba(255,255,255,0.34)" stroke="currentColor" strokeWidth="2.3" />
          <circle className="microscope-zoom" cx="31" cy="27" r="2.4" fill="currentColor" opacity="0.20" />
        </g>
      </svg>
    )
  }

  if (motion === "certify") {
    return (
      <svg {...svgProps} className="principle-svg principle-svg-certify" viewBox="0 0 48 48">
        <rect className="coa-page coa-page-back" x="13" y="10" width="20" height="27" rx="3" fill="none" stroke="currentColor" strokeWidth="2" />
        <rect className="coa-page coa-page-front" x="17" y="13" width="20" height="27" rx="3" fill="rgba(255,255,255,0.42)" stroke="currentColor" strokeWidth="2" />
        <path d="M22 22h10M22 27h8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path className="coa-check" d="M23 33l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  if (motion === "access") {
    return (
      <svg {...svgProps} className="principle-svg principle-svg-access" viewBox="0 0 48 48">
        <circle cx="22" cy="17" r="6" fill="none" stroke="currentColor" strokeWidth="2.2" />
        <path d="M10 38c2.4-7 7.1-10.5 14-10.5 2.2 0 4.2.37 5.9 1.12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <path className="access-check" d="M29 34l4 4 8-10" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  return (
    <svg {...svgProps} className="principle-svg principle-svg-track" viewBox="0 0 48 48">
      <path d="M9 38h30M10 10v28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.55" />
      <path className="track-line" d="M13 31l7-8 6 4 10-14" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle className="track-dot track-dot-a" cx="20" cy="23" r="2.5" fill="currentColor" />
      <circle className="track-dot track-dot-b" cx="26" cy="27" r="2.5" fill="currentColor" />
      <circle className="track-dot track-dot-c" cx="36" cy="13" r="2.5" fill="currentColor" />
    </svg>
  )
}

export function FrostedPrincipleCard({ item }: { item: PrincipleItem }) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const active = hovered || pressed;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
      onBlur={() => setPressed(false)}
      style={{
        boxSizing: "border-box",
        width: "100%",
        minHeight: "220px",
        background: item.bg,
        border: `1px solid ${active ? "rgba(42,79,174,0.26)" : item.border}`,
        boxShadow: active
          ? "12px 17px 51px rgba(42,79,174,0.18), 0 4px 16px rgba(42,79,174,0.08)"
          : "2px 4px 16px rgba(42,79,174,0.06)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderRadius: "16px",
        padding: "28px 24px 24px",
        textAlign: "left",
        cursor: "pointer",
        userSelect: "none",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        transform: pressed ? "scale(0.99) translateY(0)" : hovered ? "scale(1.018) translateY(-3px)" : "scale(1)",
        transition: "transform 220ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 220ms ease, border-color 200ms ease, background 200ms ease",
      }}
    >
      <style jsx global>{`
        .principle-icon-shell {
          position: relative;
          width: 50px;
          height: 50px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          overflow: hidden;
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.72), 0 8px 18px rgba(6,68,108,0.14);
          transition: transform 220ms ease, background 220ms ease, box-shadow 220ms ease;
        }
        .principle-icon-shell:before {
          content: "";
          position: absolute;
          inset: 7px;
          border-radius: 999px;
          opacity: 0;
          transform: scale(0.55);
          transition: opacity 220ms ease, transform 220ms ease;
        }
        .principle-icon-shell[data-active="true"]:before {
          opacity: 1;
          transform: scale(1);
        }
        .principle-icon-shell[data-active="true"][data-motion="inspect"] {
          transform: translateY(-2px);
        }
        .principle-icon-shell[data-active="true"][data-motion="certify"] {
          transform: translateY(-2px);
        }
        .principle-icon-shell[data-active="true"][data-motion="access"] {
          transform: translateY(-2px);
        }
        .principle-icon-shell[data-active="true"][data-motion="track"] {
          transform: translateY(-2px);
        }
        .principle-icon {
          position: relative;
          z-index: 1;
          transition: transform 220ms ease;
        }
        .principle-svg {
          width: 33px;
          height: 33px;
          display: block;
          overflow: visible;
          filter: drop-shadow(0 1px 0 rgba(255,255,255,0.55));
        }
        .microscope-lens,
        .microscope-zoom,
        .coa-page,
        .coa-check,
        .access-check,
        .track-line,
        .track-dot {
          transform-box: fill-box;
          transform-origin: center;
        }
        .track-line {
          stroke-dasharray: 45;
          stroke-dashoffset: 0;
        }
        .access-check,
        .coa-check {
          stroke-dasharray: 20;
          stroke-dashoffset: 0;
        }
        .principle-icon-shell[data-active="true"][data-motion="inspect"] .microscope-lens {
          animation: microscope-zoom-lens 780ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .principle-icon-shell[data-active="true"][data-motion="inspect"] .microscope-zoom {
          animation: microscope-zoom-pulse 780ms ease both;
        }
        .principle-icon-shell[data-active="true"][data-motion="certify"] .coa-page-front {
          animation: coa-page-flip 720ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .principle-icon-shell[data-active="true"][data-motion="certify"] .coa-check {
          animation: check-draw 720ms ease both;
        }
        .principle-icon-shell[data-active="true"][data-motion="access"] .access-check {
          animation: check-draw 620ms ease both;
        }
        .principle-icon-shell[data-active="true"][data-motion="track"] .track-line {
          animation: graph-draw 780ms ease both;
        }
        .principle-icon-shell[data-active="true"][data-motion="track"] .track-dot {
          animation: graph-dot 620ms ease both;
        }
        .principle-icon-shell[data-active="true"][data-motion="track"] .track-dot-b {
          animation-delay: 90ms;
        }
        .principle-icon-shell[data-active="true"][data-motion="track"] .track-dot-c {
          animation-delay: 180ms;
        }
        @keyframes microscope-zoom-lens {
          0% { transform: translateY(0) scale(1); }
          45% { transform: translateY(5px) scale(1.28); }
          100% { transform: translateY(0) scale(1); }
        }
        @keyframes microscope-zoom-pulse {
          0% { opacity: 0.12; transform: scale(0.6); }
          45% { opacity: 0.34; transform: scale(2.35); }
          100% { opacity: 0.12; transform: scale(0.75); }
        }
        @keyframes coa-page-flip {
          0% { transform: perspective(80px) rotateY(0deg) translateX(0); }
          48% { transform: perspective(80px) rotateY(-26deg) translateX(2px); }
          100% { transform: perspective(80px) rotateY(0deg) translateX(0); }
        }
        @keyframes check-draw {
          0% { stroke-dashoffset: 20; opacity: 0.28; transform: scale(0.92); }
          70% { stroke-dashoffset: 0; opacity: 1; transform: scale(1.04); }
          100% { stroke-dashoffset: 0; opacity: 1; transform: scale(1); }
        }
        @keyframes graph-draw {
          0% { stroke-dashoffset: 45; opacity: 0.34; }
          100% { stroke-dashoffset: 0; opacity: 1; }
        }
        @keyframes graph-dot {
          0% { opacity: 0; transform: scale(0.45); }
          70% { opacity: 1; transform: scale(1.18); }
          100% { opacity: 1; transform: scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .principle-icon-shell,
          .principle-icon-shell:before,
          .principle-icon,
          .principle-svg *,
          .principle-svg {
            transition: none !important;
            animation: none !important;
          }
        }
      `}</style>
      {/* Icon */}
      <div
        className="principle-icon-shell"
        data-active={active}
        data-motion={item.motion}
        style={{
          color: ICON_COLORS[item.motion],
          background: active
            ? "linear-gradient(135deg, rgba(255,255,255,0.96), rgba(219,245,248,0.76))"
            : "linear-gradient(135deg, rgba(255,255,255,0.90), rgba(226,241,248,0.66))",
        }}
      >
        <span className="principle-icon" aria-hidden="true">
          <PrincipleIcon motion={item.motion} />
        </span>
      </div>

      {/* Label */}
      <p
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "10px",
          letterSpacing: "0.09em",
          textTransform: "uppercase",
          color: item.accent,
          fontWeight: 700,
          margin: 0,
          opacity: active ? 1 : 0.85,
          transition: "opacity 0.3s ease",
        }}
      >
        {item.label}
      </p>

      {/* Detail */}
      <p
        style={{
          fontSize: "13px",
          color: active ? (item.activeText ?? "var(--text-primary)") : (item.text ?? "var(--text-secondary)"),
          lineHeight: 1.65,
          margin: 0,
          flex: 1,
          transition: "color 0.3s ease",
        }}
      >
        {item.detail}
      </p>
    </div>
  );
}
