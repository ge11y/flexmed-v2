"use client";

import { useEffect, useMemo, useState } from "react";
import { Sparkles, Tag } from "lucide-react";
import { getPromoOfferLabel, getPromoTargetLabel, type PromoDisplayCopy } from "@/lib/promo-display";
import type { SitePromoRecord } from "@/lib/site-promos";

type PromoWithDisplay = SitePromoRecord & Partial<PromoDisplayCopy>;

function getOffer(promo: PromoWithDisplay) {
  return promo.offerLabel || getPromoOfferLabel(promo);
}

function getTarget(promo: PromoWithDisplay) {
  return promo.targetLabel || getPromoTargetLabel(promo);
}

export function HomePromoStrip() {
  const [promos, setPromos] = useState<PromoWithDisplay[]>([]);

  useEffect(() => {
    let active = true;

    async function loadPromos() {
      try {
        const response = await fetch("/api/promos", { cache: "no-store" });
        const result = (await response.json()) as { ok?: boolean; promos?: PromoWithDisplay[] };
        if (active && response.ok && result.ok) setPromos(result.promos ?? []);
      } catch {
        if (active) setPromos([]);
      }
    }

    void loadPromos();
    return () => {
      active = false;
    };
  }, []);

  const displayPromos = useMemo(
    () => promos.filter((promo) => promo.placements.includes("banner") || promo.placements.includes("product") || promo.placements.includes("checkout")).slice(0, 6),
    [promos],
  );

  if (displayPromos.length === 0) return null;

  return (
    <section
      aria-label="Current promotions and offers"
      style={{
        position: "relative",
        overflow: "hidden",
        padding: "18px 32px",
        background:
          "linear-gradient(90deg, rgba(42,79,174,0.96), rgba(34,128,180,0.92) 50%, rgba(36,172,190,0.92))",
        color: "#fff",
      }}
    >
      <style>{`
        .home-promo-track {
          display: flex;
          gap: 12px;
          width: max-content;
          min-width: 100%;
          animation: flexmed-promo-marquee 28s linear infinite;
        }
        .home-promo-strip:hover .home-promo-track {
          animation-play-state: paused;
        }
        .home-promo-pill {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          min-height: 42px;
          padding: 9px 14px;
          border: 1px solid rgba(255,255,255,0.22);
          border-radius: 999px;
          background: rgba(255,255,255,0.12);
          color: #fff;
          white-space: nowrap;
          backdrop-filter: blur(12px);
        }
        @media (max-width: 720px) {
          .home-promo-track {
            width: 100%;
            min-width: 0;
            flex-wrap: nowrap;
            overflow-x: auto;
            animation: none;
            scrollbar-width: none;
          }
          .home-promo-track::-webkit-scrollbar {
            display: none;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .home-promo-track {
            animation: none !important;
            width: 100%;
            flex-wrap: wrap;
          }
        }
      `}</style>
      <div className="home-promo-strip" style={{ maxWidth: 1240, margin: "0 auto", display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, flex: "0 0 auto", fontWeight: 800 }}>
          <Sparkles size={18} aria-hidden="true" />
          Promos & Offers
        </div>
        <div style={{ minWidth: 0, overflow: "hidden", flex: 1 }}>
          <div className="home-promo-track">
            {[...displayPromos, ...displayPromos].map((promo, index) => {
              const offer = getOffer(promo);
              const target = getTarget(promo);
              return (
                <div key={`${promo.id}-${index}`} className="home-promo-pill">
                  <Tag size={15} aria-hidden="true" />
                  <strong>{promo.badgeLabel || offer || promo.title}</strong>
                  <span style={{ opacity: 0.82 }}>{promo.title}</span>
                  {target && target !== "sitewide" ? <span style={{ opacity: 0.72 }}>on {target}</span> : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
