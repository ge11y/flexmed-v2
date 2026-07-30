"use client";

import { ProductCard } from "./ProductCard";
import type { Product } from "@/lib/types";

interface Props {
  products: Product[];
}

export function CompoundGrid({ products }: Props) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        gap: "20px",
      }}
    >
      {products.map((product) => (
        <ProductCard key={product.slug} product={product} variant="light" />
      ))}
    </div>
  );
}
