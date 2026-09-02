"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ProductCard } from "./ProductCard";
import type { Product } from "@/lib/types";
import { isBioRegulator } from "@/lib/data-products";

interface Props {
  products: Product[];
  variant?: "light" | "dark";
}

type CatalogGroup =
  | "all"
  | "peptides"
  | "blends"
  | "topicals"
  | "bio_regulators"
  | "water";

type PriceFilter = "all" | "under_50" | "50_to_99" | "100_plus";

const INITIAL_VISIBLE_PRODUCTS = 15;
const LOAD_MORE_PRODUCTS = 15;

export function ProductCatalog({ products, variant = "dark" }: Props) {
  const isDark = variant === "dark";
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const deferredQuery = useDeferredValue(query);
  const [category, setCategory] = useState(searchParams.get("category") ?? "All");
  const [group, setGroup] = useState<CatalogGroup>(normalizeCatalogGroup(searchParams.get("group") ?? searchParams.get("collection")));
  const [priceFilter, setPriceFilter] = useState<PriceFilter>(
    (searchParams.get("price") as PriceFilter) ?? "all"
  );
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_PRODUCTS);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(products.map((product) => normalizeCategoryFilter(product.category)))).sort()],
    [products]
  );

  const normalizedQuery = deferredQuery.trim().toLowerCase();
  // A search has to find a product no matter which group tab happens to be
  // open. Shoppers search by name, not by our taxonomy -- searching "KLOW"
  // from the Peptides tab returned nothing because it is catalogued as a
  // blend. The tab still governs plain browsing when the search box is empty.
  const searchSpansAllGroups = group !== "all" && Boolean(normalizedQuery);

  const filteredProducts = useMemo(() => {
    const normalized = deferredQuery.trim().toLowerCase();
    const restrictToGroup = group !== "all" && !normalized;

    return products.filter((product) => {
      if (restrictToGroup && getCatalogGroup(product) !== group) return false;
      if (category !== "All" && normalizeCategoryFilter(product.category) !== category) return false;
      if (!matchesPriceFilter(product, priceFilter)) return false;
      if (!normalized) return true;

      const haystack = [
        product.displayName,
        product.fullName,
        product.alias,
        product.slug,
        product.category,
        product.researchCategory,
        product.slug.toLowerCase().includes("wolver") ? "Wolverine" : "",
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalized);
    });
  }, [products, category, deferredQuery, group, priceFilter]);

  const sortedProducts = useMemo(
    () => [...filteredProducts].sort(compareProductsAlphabetically),
    [filteredProducts]
  );
  const visibleProducts = useMemo(
    () => sortedProducts.slice(0, visibleCount),
    [sortedProducts, visibleCount]
  );
  const hasMoreProducts = visibleProducts.length < sortedProducts.length;
  const remainingProducts = Math.max(sortedProducts.length - visibleProducts.length, 0);

  return (
    <div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          gap: "16px",
          marginBottom: "28px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          {[
            { id: "all", label: "View All" },
            { id: "peptides", label: "Peptides" },
            { id: "blends", label: "Peptide Blends" },
            { id: "topicals", label: "Topicals" },
            { id: "bio_regulators", label: "Bio Regulators" },
            { id: "water", label: "Water" },
          ].map((item) => {
            const active = group === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setGroup(item.id as CatalogGroup);
                  setVisibleCount(INITIAL_VISIBLE_PRODUCTS);
                }}
                style={{
                  borderRadius: "999px",
                  border: active
                    ? (isDark ? "1px solid #2DD4C4" : "1px solid var(--accent-400)")
                    : (isDark ? "1px solid rgba(140,175,225,.18)" : "1px solid var(--border)"),
                  background: active
                    ? (isDark ? "rgba(45,212,196,.14)" : "rgba(42,79,174,0.08)")
                    : (isDark ? "rgba(255,255,255,.06)" : "var(--bg-card)"),
                  color: active ? (isDark ? "#EAF1FB" : "var(--accent-500)") : (isDark ? "#C3D3EC" : "var(--text-secondary)"),
                  padding: "10px 14px",
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  letterSpacing: "0.04em",
                  cursor: "pointer",
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <div
          className="product-filter-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) 240px 200px",
            gap: "12px",
          }}
        >
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setVisibleCount(INITIAL_VISIBLE_PRODUCTS);
            }}
            placeholder="Search by peptide, bio regulator, alias, or keyword"
            style={{
              width: "100%",
              background: isDark ? "rgba(255,255,255,0.06)" : "var(--bg-card)",
              border: isDark ? "1px solid rgba(140,175,225,.18)" : "1px solid var(--border)",
              borderRadius: "14px",
              padding: "12px 14px",
              fontFamily: "var(--font-body)",
              fontSize: "14px",
              color: isDark ? "#FFFFFF" : "var(--text-primary)",
              outline: "none",
            }}
          />
          <select
            value={category}
            onChange={(event) => {
              setCategory(event.target.value);
              setVisibleCount(INITIAL_VISIBLE_PRODUCTS);
            }}
            style={{
              width: "100%",
              background: isDark ? "#FFFFFF" : "var(--bg-card)",
              border: isDark ? "1px solid rgba(140,175,225,.18)" : "1px solid var(--border)",
              borderRadius: "14px",
              padding: "12px 14px",
              fontFamily: "var(--font-body)",
              fontSize: "14px",
              color: isDark ? "#111827" : "var(--text-primary)",
              outline: "none",
            }}
          >
            {categories.map((option) => (
              <option key={option} value={option} style={{ color: "#111827", background: "#FFFFFF" }}>
                {option === "All" ? "All Research Categories" : formatCategoryLabel(option)}
              </option>
            ))}
          </select>
          <select
            value={priceFilter}
            onChange={(event) => {
              setPriceFilter(event.target.value as PriceFilter);
              setVisibleCount(INITIAL_VISIBLE_PRODUCTS);
            }}
            style={{
              width: "100%",
              background: isDark ? "#FFFFFF" : "var(--bg-card)",
              border: isDark ? "1px solid rgba(140,175,225,.18)" : "1px solid var(--border)",
              borderRadius: "14px",
              padding: "12px 14px",
              fontFamily: "var(--font-body)",
              fontSize: "14px",
              color: isDark ? "#111827" : "var(--text-primary)",
              outline: "none",
            }}
          >
            <option value="all" style={{ color: "#111827", background: "#FFFFFF" }}>All Prices</option>
            <option value="under_50" style={{ color: "#111827", background: "#FFFFFF" }}>Under $50</option>
            <option value="50_to_99" style={{ color: "#111827", background: "#FFFFFF" }}>$50 to $99</option>
            <option value="100_plus" style={{ color: "#111827", background: "#FFFFFF" }}>$100 and up</option>
          </select>
        </div>

        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            letterSpacing: "0.10em",
            textTransform: "uppercase",
            color: isDark ? "rgba(155,150,212,0.6)" : "var(--text-muted)",
          }}
        >
          {filteredProducts.length} result{filteredProducts.length !== 1 ? "s" : ""}
          {searchSpansAllGroups ? " · all categories" : ""}
        </span>
      </div>

      {filteredProducts.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "64px 0",
            color: isDark ? "rgba(255,255,255,0.35)" : "var(--text-muted)",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "18px",
              marginBottom: "8px",
              color: isDark ? "#FFFFFF" : "var(--text-primary)",
            }}
          >
            No catalog listings found
          </div>
          <div style={{ fontSize: "13px" }}>
            Try a different keyword, filter, or research category.
          </div>
        </div>
      )}

      {sortedProducts.length > 0 && (
        <div
          className="product-catalog-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "20px",
            alignItems: "start",
          }}
        >
          {visibleProducts.map((product) => (
            <div
              key={product.slug}
              className="product-catalog-item"
              style={{
                contentVisibility: "auto",
                containIntrinsicSize: "620px",
              }}
            >
              <ProductCard product={product} variant={variant} />
            </div>
          ))}
        </div>
      )}

      {hasMoreProducts ? (
        <div
          style={{
            padding: "34px 0 8px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
          }}
        >
          <button
            type="button"
            onClick={() => setVisibleCount((current) => Math.min(current + LOAD_MORE_PRODUCTS, sortedProducts.length))}
            className="fm-btn-outline"
            style={{
              minHeight: "42px",
              padding: "0 22px",
              justifyContent: "center",
              background: isDark ? "rgba(255,255,255,0.06)" : "var(--bg-card)",
              color: isDark ? "#EAF1FB" : undefined,
              borderColor: isDark ? "rgba(140,175,225,.24)" : undefined,
            }}
          >
            Show more
          </button>
          <span
            style={{
              color: isDark ? "rgba(255,255,255,0.45)" : "var(--text-muted)",
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            Showing {visibleProducts.length} of {sortedProducts.length} listings · {remainingProducts} remaining
          </span>
        </div>
      ) : null}
    </div>
  );
}

function getCatalogGroup(product: Product): CatalogGroup {
  if (isBioRegulator(product)) return "bio_regulators";
  if (product.category === "water" || product.category === "other") return "water";
  if (product.category === "topicals" || product.category === "serums" || product.formatType.toLowerCase().includes("serum")) return "topicals";
  if (product.category === "topicals" || product.formatType.toLowerCase().includes("topical")) return "topicals";
  if (product.formatType.toLowerCase().includes("blend")) return "blends";
  return "peptides";
}

function normalizeCatalogGroup(value?: string | null): CatalogGroup {
  if (value === "other") return "water";
  if (value === "serums") return "topicals";
  if (
    value === "peptides" ||
    value === "blends" ||
    value === "topicals" ||
    value === "bio_regulators" ||
    value === "water"
  ) {
    return value;
  }
  return "all";
}

function normalizeCategoryFilter(value: string) {
  if (value === "other") return "water";
  if (value === "serums") return "topicals";
  return value;
}

function formatCategoryLabel(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function matchesPriceFilter(product: Product, priceFilter: PriceFilter) {
  if (priceFilter === "all") return true;
  const price = getNumericPrice(product.priceVial);
  if (price === null) return false;

  switch (priceFilter) {
    case "under_50":
      return price < 50;
    case "50_to_99":
      return price >= 50 && price < 100;
    case "100_plus":
      return price >= 100;
    default:
      return true;
  }
}

function getNumericPrice(price?: string) {
  if (!price) return null;
  const parsed = Number(price.replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function compareProductsAlphabetically(a: Product, b: Product) {
  return a.displayName.localeCompare(b.displayName, undefined, {
    numeric: true,
    sensitivity: "base",
  });
}
