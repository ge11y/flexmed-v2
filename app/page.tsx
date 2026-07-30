import { VideoHero } from "@/components/VideoHero";
import { FrostedPrincipleCard } from "@/components/FrostedPrincipleCard";
import { HomePromoStrip } from "@/components/HomePromoStrip";
import { getLiveFeaturedProducts } from "@/lib/catalog-live";

export const dynamic = 'force-dynamic'

/* ------------------------------------------------------------------ */
/* FlexMed — Landing Page                                              */
/* Public storefront visual shell. NavBar and Footer are in layout.tsx. */
/* NavBar and Footer are rendered by layout.tsx                        */
/* ------------------------------------------------------------------ */

export default async function Home() {
  const featuredProducts = await getLiveFeaturedProducts();

  return (
    <div
      className="storefront-blue-shell"
      style={{
        background: "linear-gradient(180deg, #0A1A33 0%, #102A54 44%, #071A3D 100%)",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ====================================================== */}
      {/* HERO / MEDIA                                           */}
      {/* ====================================================== */}
      <VideoHero featuredProducts={featuredProducts} />
      <HomePromoStrip />

      {/* ====================================================== */}
      {/* TRUST STRIP — 4 frosted glass principle cards        */}
      {/* ====================================================== */}
      <section
        className="home-trust-section"
        style={{
          padding: "82px 40px",
        }}
      >
        <div
          className="home-trust-grid"
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "20px",
          }}
        >
          {([
            {
              label: "Third-Party Testing",
              detail:
                "Every batch verified by ISO-accredited third-party laboratories.",
              accent: "var(--accent-500)",
              bg: "linear-gradient(165deg, rgba(38,82,145,0.88), rgba(26,62,116,0.84))",
              border: "rgba(140,175,225,0.20)",
              text: "rgba(230,240,255,0.76)",
              activeText: "#FFFFFF",
              motion: "inspect",
            },
            {
              label: "CoA Before Procurement",
              detail:
                "Certificate of Analysis published before any batch is released.",
              accent: "var(--accent-400)",
              bg: "linear-gradient(165deg, rgba(38,82,145,0.86), rgba(26,62,116,0.82))",
              border: "rgba(140,175,225,0.20)",
              text: "rgba(230,240,255,0.76)",
              activeText: "#FFFFFF",
              motion: "certify",
            },
            {
              label: "Research-Use Access",
              detail:
                "Catalog browsing is open to researchers and research organizations.",
              accent: "var(--accent-300)",
              bg: "linear-gradient(165deg, rgba(38,82,145,0.84), rgba(26,62,116,0.80))",
              border: "rgba(140,175,225,0.20)",
              text: "rgba(230,240,255,0.76)",
              activeText: "#FFFFFF",
              motion: "access",
            },
            {
              label: "Availability Tracking",
              detail:
                "Current batch availability is reflected directly on each peptide listing.",
              accent: "var(--accent-500)",
              bg: "linear-gradient(165deg, rgba(38,82,145,0.88), rgba(26,62,116,0.84))",
              border: "rgba(140,175,225,0.20)",
              text: "rgba(230,240,255,0.76)",
              activeText: "#FFFFFF",
              motion: "track",
            },
          ] as const).map((item) => (
            <FrostedPrincipleCard key={item.label} item={item} />
          ))}
        </div>
      </section>
    </div>
  );
}
