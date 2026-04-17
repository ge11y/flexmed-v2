"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const NAV_LINKS = [
  { label: "Catalog", href: "/products" },
  { label: "Testing", href: "/testing" },
  { label: "About", href: "/about" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
];

export function NavBar() {
  const [scrolled, setScrolled] = useState(true); // Always dark — not transparent

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        height: "68px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 40px",
        backgroundColor: "rgba(10, 11, 14, 0.97)",
        borderBottom: "1px solid var(--border)",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Logo */}
      <Link
        href="/"
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: "18px",
          fontWeight: 700,
          color: "var(--text-primary)",
          textDecoration: "none",
          letterSpacing: "0.02em",
          flexShrink: 0,
        }}
      >
        <span style={{ color: "var(--amber)" }}>F</span>lexMed
      </Link>

      {/* Nav links */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0",
        }}
      >
        {NAV_LINKS.map((link) => (
          <NavLink key={link.href} href={link.href}>
            {link.label}
          </NavLink>
        ))}
      </div>

      {/* CTA */}
      <Link
        href="/contact"
        className="fm-btn-outline"
        style={{ fontSize: "13px", padding: "8px 20px" }}
      >
        Request Quote
      </Link>
    </nav>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        fontSize: "14px",
        fontWeight: 500,
        color: hovered ? "var(--text-primary)" : "var(--text-muted)",
        padding: "8px 14px",
        textDecoration: "none",
        transition: "color 0.2s ease",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </Link>
  );
}
