"use client";

import Link from "next/link";

const columnHeadingStyle: React.CSSProperties = {
  fontSize: "10px",
  fontWeight: 600,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "var(--text-muted)",
  fontFamily: "var(--font-mono)",
  marginBottom: "16px",
};

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      style={{
        fontSize: "14px",
        color: "var(--text-secondary)",
        display: "block",
        lineHeight: 2,
        textDecoration: "none",
        transition: "color 0.2s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.color = "var(--amber)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-secondary)";
      }}
    >
      {children}
    </Link>
  );
}

export function Footer() {
  return (
    <footer
      style={{
        backgroundColor: "var(--bg-surface)",
        borderTop: "1px solid var(--border)",
        padding: "60px 40px 32px",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "48px",
          alignItems: "flex-start",
          maxWidth: 1200,
          margin: "0 auto",
        }}
      >
        {/* Brand column */}
        <div style={{ flex: "0 0 240px" }}>
          <div
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "18px",
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: "12px",
            }}
          >
            <span style={{ color: "var(--amber)" }}>F</span>lexMed
          </div>
          <p
            style={{
              fontSize: "13px",
              color: "var(--text-muted)",
              lineHeight: 1.6,
              maxWidth: "200px",
            }}
          >
            Research compounds presented with clarity.
          </p>
        </div>

        {/* Catalog */}
        <div>
          <p style={columnHeadingStyle}>Catalog</p>
          <FooterLink href="/products">View All Compounds</FooterLink>
          <FooterLink href="/products?category=growth-hormone">Growth Hormone</FooterLink>
          <FooterLink href="/products?category=metabolic">Metabolic Research</FooterLink>
          <FooterLink href="/products?category=neuropeptide">Neuropeptide</FooterLink>
          <FooterLink href="/products?category=mitochondrial">Mitochondrial</FooterLink>
        </div>

        {/* Company */}
        <div>
          <p style={columnHeadingStyle}>Company</p>
          <FooterLink href="/about">About</FooterLink>
          <FooterLink href="/testing">Testing Standards</FooterLink>
          <FooterLink href="/contact">Contact</FooterLink>
          <FooterLink href="/faq">FAQ</FooterLink>
        </div>

        {/* Legal */}
        <div>
          <p style={columnHeadingStyle}>Legal</p>
          <FooterLink href="/terms">Terms of Service</FooterLink>
          <FooterLink href="/privacy">Privacy Policy</FooterLink>
          <FooterLink href="/disclaimer">Research Disclaimer</FooterLink>
        </div>
      </div>

      {/* Copyright bar */}
      <div
        style={{
          borderTop: "1px solid var(--border)",
          marginTop: "40px",
          paddingTop: "20px",
          fontSize: "11px",
          color: "var(--text-muted)",
          maxWidth: 1200,
          margin: "40px auto 0",
          lineHeight: 1.6,
        }}
      >
        © 2026 FlexMed. All rights reserved. For laboratory research use only — not for human consumption.
      </div>
    </footer>
  );
}
