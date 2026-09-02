"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, Search, ShoppingCart, UserRound, X } from "lucide-react";
import { useCart } from "@/components/CartProvider";
import { isDelistedCatalogEntry } from "@/lib/catalog-delist";

type SearchSuggestion = {
  slug: string;
  displayName: string;
  fullName: string;
  strength: number | null;
  unit: string;
  collection: string;
  formatType?: string;
  sku?: string;
  variantGroup?: string | null;
  publicVisible?: boolean;
  archived?: boolean;
};

const SHOP_LINKS = [
  { label: "Peptides", href: "/products?group=peptides" },
  { label: "Peptide Blends", href: "/products?group=blends" },
  { label: "Bio Regulators", href: "/products?group=bio_regulators" },
  { label: "Topicals", href: "/products?group=topicals" },
  { label: "Vial Cases", href: "/vial-cases" },
];

const INFO_LINKS = [
  { label: "COA Library", href: "/coa" },
  { label: "FAQ", href: "/faq" },
  { label: "About Us", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export function NavBar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [searchedQuery, setSearchedQuery] = useState("");
  const pathname = usePathname();
  const router = useRouter();
  const { itemCount } = useCart();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen && !searchOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen, searchOpen]);

  useEffect(() => {
    if (!searchOpen) return;
    const query = searchQuery.trim().toLowerCase();
    if (!query) return;

    let cancelled = false;
    const timeout = window.setTimeout(async () => {
      setSuggestionsLoading(true);
      try {
        const response = await fetch("/api/catalog-source", { cache: "no-store" });
        const result = (await response.json()) as { ok?: boolean; records?: SearchSuggestion[] };
        if (cancelled) return;
        const records = result.records ?? [];
        const matches = records
          .filter((record) => record.publicVisible !== false && !record.archived && !isDelistedCatalogEntry(record))
          .filter((record) => {
            const haystack = [
              record.displayName,
              record.fullName,
              record.collection,
              record.unit,
              `${record.strength ?? ""}${record.unit ?? ""}`,
              `${record.strength ?? ""} ${record.unit ?? ""}`,
            ]
              .join(" ")
              .toLowerCase();
            return haystack.includes(query);
          })
          .slice(0, 6);
        setSuggestions(matches);
        setSearchedQuery(query);
      } catch {
        if (!cancelled) setSuggestions([]);
      } finally {
        if (!cancelled) setSuggestionsLoading(false);
      }
    }, 40);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [searchOpen, searchQuery]);

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    setSearchOpen(false);
    setMenuOpen(false);
    // Search must span the whole catalog. Scoping it to the peptides group made
    // blends, topicals and water return "No catalog listings found"
    // unless the shopper had already guessed the right category tab.
    router.push(`/products?q=${encodeURIComponent(query)}`);
  }

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const searchIsWorking = Boolean(normalizedSearchQuery) && (suggestionsLoading || searchedQuery !== normalizedSearchQuery);

  return (
    <>
      <nav
        className="site-nav"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          height: "var(--site-nav-height, 68px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 40px",
          backgroundColor: scrolled ? "rgba(255, 255, 255, 0.98)" : "rgba(255, 255, 255, 0.94)",
          borderBottom: "1px solid var(--border)",
          backdropFilter: "blur(12px)",
          transition: "background-color 0.3s ease, border-color 0.3s ease, backdrop-filter 0.3s ease",
        }}
      >
        <style>{`
          @media (max-width: 980px) {
            .site-nav {
              padding: 0 14px !important;
            }
            .site-nav-logo {
              width: 150px !important;
              min-width: 150px !important;
            }
          }
          @media (max-width: 720px) {
            .site-nav {
              gap: 10px !important;
            }
            .site-nav-actions {
              gap: 8px !important;
            }
            .site-nav-shop-cta {
              min-height: 36px !important;
              padding: 0 12px !important;
              font-size: 11px !important;
            }
            .site-nav-action-button {
              width: 36px !important;
              height: 36px !important;
            }
          }
          @media (max-width: 420px) {
            .site-nav-logo {
              width: 116px !important;
              min-width: 116px !important;
            }
            .site-nav-shop-cta {
              display: none !important;
            }
            .site-nav-cart-label {
              display: none !important;
            }
          }
          @keyframes flexmed-search-pulse {
            0%, 80%, 100% { opacity: 0.28; transform: scale(0.82); }
            40% { opacity: 1; transform: scale(1); }
          }
        `}</style>
        <Link
          href="/"
          className="site-nav-logo"
          style={{
            display: "inline-flex",
            alignItems: "center",
            width: "168px",
            minWidth: "168px",
            height: "50px",
            textDecoration: "none",
          }}
          aria-label="FlexMed home"
        >
          <Image
            src="/brand/flexmed-logo-nav.png"
            alt="FlexMed"
            width={1420}
            height={430}
            priority
            style={{ width: "100%", height: "auto", display: "block" }}
          />
        </Link>

        <div className="site-nav-actions" style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <Link
            href="/products"
            className="site-nav-shop-cta"
            style={{
              minHeight: "38px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "999px",
              border: pathname === "/products" ? "1px solid var(--accent-400)" : "1px solid var(--border)",
              background: pathname === "/products" ? "rgba(42, 79, 174, 0.08)" : "var(--bg-card)",
              color: pathname === "/products" ? "var(--accent-500)" : "var(--text-primary)",
              padding: "0 15px",
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              fontWeight: 800,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              textDecoration: "none",
              whiteSpace: "nowrap",
              transition: "border-color 0.2s ease, background 0.2s ease, color 0.2s ease",
            }}
          >
            Shop Catalog
          </Link>
          <Link
            href="/cart"
            aria-label="Cart"
            title="Cart"
            className="site-nav-action-button"
            style={{
              position: "relative",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "38px",
              height: "38px",
              borderRadius: "999px",
              border: pathname === "/cart" ? "1px solid var(--accent-400)" : "1px solid var(--border)",
              background: pathname === "/cart" ? "rgba(42, 79, 174, 0.08)" : "var(--bg-card)",
              color: pathname === "/cart" ? "var(--accent-500)" : "var(--text-primary)",
              textDecoration: "none",
              transition: "border-color 0.2s ease, background 0.2s ease, color 0.2s ease",
            }}
          >
            <ShoppingCart size={16} />
            <span
              style={{
                position: "absolute",
                top: "-5px",
                right: "-5px",
                minWidth: "18px",
                height: "18px",
                padding: "0 6px",
                borderRadius: "999px",
                background: itemCount > 0 ? "var(--accent-500)" : "var(--bg-elevated)",
                border: itemCount > 0 ? "1px solid var(--accent-500)" : "1px solid var(--border)",
                color: itemCount > 0 ? "#fff" : "var(--text-muted)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                lineHeight: 1,
              }}
            >
              {itemCount}
            </span>
          </Link>
          <Link
            href="/account"
            aria-label="Customer account"
            title="Account"
            className="site-nav-action-button"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "38px",
              height: "38px",
              borderRadius: "999px",
              border: pathname === "/account" ? "1px solid var(--accent-400)" : "1px solid var(--border)",
              background: pathname === "/account" ? "rgba(42, 79, 174, 0.08)" : "var(--bg-card)",
              color: pathname === "/account" ? "var(--accent-500)" : "var(--text-primary)",
              textDecoration: "none",
              transition: "border-color 0.2s ease, background 0.2s ease, color 0.2s ease",
            }}
          >
            <UserRound size={16} />
          </Link>
          <button
            type="button"
            aria-label={searchOpen ? "Close search" : "Open search"}
            aria-expanded={searchOpen}
            className="site-nav-action-button"
            onClick={() => {
              setSearchOpen((current) => !current);
              setMenuOpen(false);
            }}
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "999px",
              border: searchOpen ? "1px solid var(--accent-400)" : "1px solid var(--border)",
              background: searchOpen ? "rgba(42, 79, 174, 0.08)" : "var(--bg-card)",
              color: searchOpen ? "var(--accent-500)" : "var(--text-primary)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "border-color 0.2s ease, background 0.2s ease, color 0.2s ease",
            }}
          >
            <Search size={16} />
          </button>
          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            className="site-nav-action-button"
            onClick={() => {
              setMenuOpen((current) => !current);
              setSearchOpen(false);
            }}
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "999px",
              border: menuOpen ? "1px solid var(--accent-400)" : "1px solid var(--border)",
              background: menuOpen ? "rgba(42, 79, 174, 0.08)" : "var(--bg-card)",
              color: menuOpen ? "var(--accent-500)" : "var(--text-primary)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "border-color 0.2s ease, background 0.2s ease, color 0.2s ease",
            }}
          >
            {menuOpen ? <X size={17} /> : <Menu size={17} />}
          </button>

        </div>
      </nav>
      {menuOpen || searchOpen ? (
        <div
          role="presentation"
          onClick={() => {
            setMenuOpen(false);
            setSearchOpen(false);
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 45,
            background: "rgba(13, 20, 36, 0.18)",
          }}
        />
      ) : null}
      <form
        role="search"
        aria-hidden={!searchOpen}
        onSubmit={submitSearch}
        style={{
          position: "fixed",
          top: "calc(var(--site-nav-height, 68px) + 10px)",
          right: "clamp(14px, 4vw, 40px)",
          zIndex: 60,
          width: "min(380px, calc(100vw - 28px))",
          borderRadius: "18px",
          border: "1px solid var(--border)",
          background: "rgba(255, 255, 255, 0.98)",
          boxShadow: "0 18px 42px rgba(28, 35, 64, 0.16)",
          padding: "12px",
          display: "grid",
          gap: "10px",
          opacity: searchOpen ? 1 : 0,
          transform: searchOpen ? "translateY(0)" : "translateY(-8px)",
          pointerEvents: searchOpen ? "auto" : "none",
          transition: "opacity 0.18s ease, transform 0.18s ease",
        }}
      >
        <div style={{ display: "flex", gap: "10px" }}>
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search products"
            autoComplete="off"
            style={{
              minWidth: 0,
              flex: 1,
              height: "42px",
              borderRadius: "12px",
              border: "1px solid var(--border)",
              background: "var(--bg-card)",
              color: "var(--text-primary)",
              padding: "0 12px",
              fontSize: "14px",
              outline: "none",
            }}
          />
          <button
            type="submit"
            className="fm-btn-primary"
            style={{ height: "42px", padding: "0 14px", justifyContent: "center" }}
          >
            Search
          </button>
        </div>
        {searchQuery.trim() ? (
          <div
            style={{
              borderRadius: "14px",
              border: "1px solid var(--border)",
              background: "var(--bg-card)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "9px 12px",
                borderBottom: "1px solid var(--border)",
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--text-muted)",
              }}
            >
              {searchIsWorking ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                  Searching
                  <span aria-hidden="true" style={{ display: "inline-flex", gap: "3px" }}>
                    {[0, 1, 2].map((index) => (
                      <span
                        key={index}
                        style={{
                          width: "4px",
                          height: "4px",
                          borderRadius: "999px",
                          background: "var(--accent-500)",
                          animation: "flexmed-search-pulse 0.9s ease-in-out infinite",
                          animationDelay: `${index * 0.12}s`,
                        }}
                      />
                    ))}
                  </span>
                </span>
              ) : suggestions.length > 0 ? "Matches" : "No matches yet"}
            </div>
            {suggestions.map((suggestion) => (
              <Link
                key={suggestion.slug}
                href={`/products/${suggestion.slug}`}
                onClick={() => {
                  setSearchOpen(false);
                  setSearchQuery("");
                  setSuggestions([]);
                  setSearchedQuery("");
                }}
                style={{
                  display: "grid",
                  gap: "3px",
                  padding: "11px 12px",
                  borderBottom: "1px solid var(--border)",
                  color: "var(--text-primary)",
                  textDecoration: "none",
                }}
              >
                <span style={{ fontSize: "14px", fontWeight: 700 }}>{suggestion.displayName}</span>
                <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>
                  {[suggestion.fullName, suggestion.strength ? `${suggestion.strength}${suggestion.unit}` : "", suggestion.collection]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </Link>
            ))}
          </div>
        ) : null}
      </form>
      <div
        role="menu"
        aria-hidden={!menuOpen}
        onClick={(event) => {
          if ((event.target as HTMLElement).closest("a")) setMenuOpen(false);
        }}
        style={{
          position: "fixed",
          top: "calc(var(--site-nav-height, 68px) + 10px)",
          right: "clamp(14px, 4vw, 40px)",
          zIndex: 60,
          width: "min(360px, calc(100vw - 28px))",
          borderRadius: "18px",
          border: "1px solid var(--border)",
          background: "rgba(255, 255, 255, 0.98)",
          boxShadow: "0 18px 42px rgba(28, 35, 64, 0.16)",
          padding: "14px",
          display: "grid",
          gap: "14px",
          opacity: menuOpen ? 1 : 0,
          transform: menuOpen ? "translateY(0)" : "translateY(-8px)",
          pointerEvents: menuOpen ? "auto" : "none",
          transition: "opacity 0.18s ease, transform 0.18s ease",
        }}
      >
        <MenuSection title="Shop">
          {SHOP_LINKS.map((link) => (
            <MenuLink key={link.href} href={link.href}>
              {link.label}
            </MenuLink>
          ))}
        </MenuSection>
        <MenuSection title="Company">
          {INFO_LINKS.map((link) => (
            <MenuLink key={link.href} href={link.href}>
              {link.label}
            </MenuLink>
          ))}
        </MenuSection>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <Link href="/account" className="fm-btn-outline" style={{ justifyContent: "center" }}>
            Account
          </Link>
          <Link href="/cart" className="fm-btn-primary" style={{ justifyContent: "center" }}>
            Cart
          </Link>
        </div>
      </div>
    </>
  );
}

function MenuSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gap: "8px" }}>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "10px",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--text-muted)",
          padding: "0 4px",
        }}
      >
        {title}
      </div>
      <div style={{ display: "grid", gap: "4px" }}>{children}</div>
    </div>
  );
}

function MenuLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      role="menuitem"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        minHeight: "40px",
        borderRadius: "12px",
        padding: "0 12px",
        color: "var(--text-primary)",
        textDecoration: "none",
        fontSize: "14px",
        fontWeight: 600,
        background: "transparent",
      }}
    >
      <span>{children}</span>
      <span aria-hidden="true" style={{ color: "var(--text-muted)" }}>›</span>
    </Link>
  );
}
