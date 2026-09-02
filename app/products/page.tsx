import type { Metadata } from 'next'
import Image from 'next/image'
import { permanentRedirect } from 'next/navigation'
import { Suspense } from 'react'
import { getLiveCatalogDisplayProducts, getLiveCatalogProducts, getLiveFeaturedProducts } from '@/lib/catalog-live'
import { DELISTED_COLLECTIONS } from '@/lib/catalog-delist'
import { buildPromoDisplayCopy } from '@/lib/promo-display'
import { getActiveSitePromos, type SitePromoRecord } from '@/lib/site-promos'
import { getPublicVialCases } from '@/lib/vial-cases'
import { ProductCatalog } from '@/components/ProductCatalog'
import { FeaturedCompounds } from '@/components/FeaturedCompounds'

const VISUAL_SHOP_GROUPS = new Set(['all', 'peptides', 'blends', 'topicals', 'bio_regulators', 'water'])

const SHOP_GROUP_LABELS: Record<string, { eyebrow: string; title: string; description: string }> = {
  all: {
    eyebrow: 'Shop Catalog',
    title: 'Shop the full research catalog',
    description: 'Browse product families, strength options, stock status, and available documentation in one storefront view.',
  },
  peptides: {
    eyebrow: 'Shop Peptides',
    title: 'Shop peptide research catalog',
    description: 'Browse strength options, stock status, and available documentation in one focused storefront view.',
  },
  blends: {
    eyebrow: 'Shop Blends',
    title: 'Shop peptide blend catalog',
    description: 'Browse combination listings, available strengths, stock status, and published documentation.',
  },
  topicals: {
    eyebrow: 'Shop Topicals',
    title: 'Shop topical research catalog',
    description: 'Browse topical research products, availability, and documentation in one focused category view.',
  },
  bio_regulators: {
    eyebrow: 'Shop Bio Regulators',
    title: 'Shop bio regulator catalog',
    description: 'Browse bio regulator listings with live stock status and available documentation.',
  },
  water: {
    eyebrow: 'Shop Water',
    title: 'Shop water catalog',
    description: 'Browse water listings, stock status, and fulfillment-ready product details.',
  },
}

const SHOP_GROUP_IMAGES: Record<string, string> = {
  all: '/claude-storefront/banners/peptides.png',
  peptides: '/claude-storefront/banners/peptides.png',
  blends: '/claude-storefront/banners/blends.png',
  topicals: '/claude-storefront/banners/topicals-serum.png',
  bio_regulators: '/claude-storefront/banners/bioregulators.png',
  water: '/claude-storefront/banners/water.png',
}

const SHOP_GROUP_IMAGE_POSITIONS: Record<string, string> = {
  topicals: 'center 58%',
}

export const metadata: Metadata = {
  title: 'Catalog',
  description: 'Browse the FlexMed peptide and bio-regulator catalog.',
}

export const dynamic = 'force-dynamic'

function getPromoHighlightText(promo: SitePromoRecord, summaryLabel: string) {
  const title = promo.title || promo.badgeLabel
  const detail = promo.detail.trim()
  const pieces = [summaryLabel, detail]
    .filter(Boolean)
    .filter((piece, index, list) => list.findIndex((item) => item.toLowerCase() === piece.toLowerCase()) === index)
    .filter((piece) => piece.toLowerCase() !== title.toLowerCase())

  return {
    title: title || summaryLabel,
    detail: pieces.join(' - '),
  }
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const rawGroup = Array.isArray(params.group) ? params.group[0] : params.group
  const rawCollection = Array.isArray(params.collection) ? params.collection[0] : params.collection
  const activeGroup = rawGroup ?? rawCollection ?? 'all'
  // Withdrawn collections keep no landing page: old links go to the full catalog.
  if (DELISTED_COLLECTIONS.has(activeGroup)) permanentRedirect('/products')
  const hasVisualShopFrame = VISUAL_SHOP_GROUPS.has(activeGroup)
  const shopCopy = SHOP_GROUP_LABELS[activeGroup] ?? SHOP_GROUP_LABELS.peptides
  const shopImage = SHOP_GROUP_IMAGES[activeGroup] ?? SHOP_GROUP_IMAGES.peptides
  const shopImagePosition = SHOP_GROUP_IMAGE_POSITIONS[activeGroup] ?? 'center'
  const [products, featuredProducts, activePromos, promoProducts, vialCases] = await Promise.all([
    getLiveCatalogDisplayProducts(),
    hasVisualShopFrame ? getLiveFeaturedProducts() : Promise.resolve([]),
    hasVisualShopFrame ? getActiveSitePromos() : Promise.resolve([]),
    hasVisualShopFrame ? getLiveCatalogProducts() : Promise.resolve([]),
    hasVisualShopFrame ? getPublicVialCases() : Promise.resolve([]),
  ])
  const promoHighlights = activePromos.map((promo) => {
    const copy = buildPromoDisplayCopy(promo, { products: promoProducts, vialCases })
    return {
      id: promo.id,
      ...getPromoHighlightText(promo, copy.summaryLabel),
    }
  })
  const catalogKey = JSON.stringify({
    q: params.q ?? '',
    category: params.category ?? 'All',
    group: params.group ?? 'all',
    collection: params.collection ?? 'all',
  })

  return (
    <div
      className={hasVisualShopFrame ? 'storefront-blue-shell' : undefined}
      style={{
        background: hasVisualShopFrame ? '#061531' : '#FFFFFF',
        minHeight: '100vh',
      }}
    >
      {/* Page header */}
      <section
        className={`products-page-header${hasVisualShopFrame ? ' products-page-header-visual' : ''}`}
        style={{
          position: 'relative',
          overflow: 'hidden',
          padding: hasVisualShopFrame ? '86px 0 46px' : '80px 0 48px',
          borderBottom: hasVisualShopFrame ? 'none' : '1px solid var(--border)',
        }}
      >
        <div
          style={{
            maxWidth: hasVisualShopFrame ? 1240 : 1180,
            margin: '0 auto',
            padding: '0 40px',
            display: hasVisualShopFrame ? 'grid' : 'block',
            gridTemplateColumns: hasVisualShopFrame ? 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))' : undefined,
            gap: hasVisualShopFrame ? '28px' : undefined,
            alignItems: 'start',
          }}
        >
          {hasVisualShopFrame ? (
            <>
              <div
                style={{
                  position: 'relative',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.72)',
                  background: '#fff',
                  overflow: 'hidden',
                  boxShadow: '0 14px 36px rgba(42,79,174,0.10)',
                }}
              >
                <Image
                  src={shopImage}
                  alt="FlexMed peptide catalog visual"
                  width={1800}
                  height={1012}
                  priority
                  style={{
                    display: 'block',
                    width: '100%',
                    height: '100%',
                    minHeight: '420px',
                    objectFit: 'cover',
                    objectPosition: shopImagePosition,
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background:
                      'linear-gradient(180deg, rgba(4,17,36,0.62) 0%, rgba(4,17,36,0.30) 34%, rgba(4,17,36,0.06) 78%)',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    padding: '30px',
                  }}
                >
                  <p
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10px',
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      color: 'rgba(255,255,255,0.82)',
                      marginBottom: '10px',
                      fontWeight: 600,
                    }}
                  >
                    {shopCopy.eyebrow}
                  </p>
                  <h1
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: 'clamp(2rem, 4vw, 3rem)',
                      fontWeight: 700,
                      color: '#FFFFFF',
                      marginBottom: '12px',
                      letterSpacing: '-0.01em',
                      lineHeight: 1.05,
                      textWrap: 'balance',
                      textShadow: '0 2px 18px rgba(0,0,0,0.32)',
                    }}
                  >
                    {shopCopy.title}
                  </h1>
                  <p
                    style={{
                      fontSize: '14px',
                      color: 'rgba(255,255,255,0.88)',
                      maxWidth: '460px',
                      lineHeight: 1.65,
                      margin: 0,
                      textShadow: '0 1px 10px rgba(0,0,0,0.26)',
                    }}
                  >
                    {shopCopy.description}
                  </p>
                </div>
              </div>

              {featuredProducts.length > 0 || promoHighlights.length > 0 ? (
                <div style={{ display: 'grid', gap: '16px' }}>
                  {featuredProducts.length > 0 ? (
                    <FeaturedCompounds featuredProducts={featuredProducts} compact embedded />
                  ) : null}
                  {promoHighlights.length > 0 ? (
                    <section
                      aria-label="Current promotions"
                      style={{
                        border: '1px solid var(--border)',
                        borderRadius: '12px',
                        background: 'var(--bg-elevated)',
                        padding: '16px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'baseline',
                          gap: '12px',
                          marginBottom: '10px',
                        }}
                      >
                        <h2 style={{ margin: 0, fontSize: '17px', color: 'var(--text-primary)' }}>Current promos</h2>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {promoHighlights.length} live
                        </span>
                      </div>
                      <ul
                        style={{
                          margin: 0,
                          paddingLeft: '18px',
                          display: 'grid',
                          gap: '9px',
                          color: 'var(--text-secondary)',
                          fontSize: '13px',
                          lineHeight: 1.55,
                        }}
                      >
                        {promoHighlights.map((promo) => (
                          <li key={promo.id}>
                            <strong style={{ color: 'var(--text-primary)' }}>{promo.title}</strong>
                            {promo.detail ? <span> - {promo.detail}</span> : null}
                          </li>
                        ))}
                      </ul>
                    </section>
                  ) : null}
                </div>
              ) : null}
            </>
          ) : (
            <div>
              <p
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  marginBottom: '12px',
                  fontWeight: 500,
                }}
              >
                Research Catalog
              </p>
              <h1
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 'clamp(2rem, 5vw, 2.8rem)',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '16px',
                  letterSpacing: '-0.01em',
                }}
              >
                Peptide catalog
              </h1>
              <p
                style={{
                  fontSize: '14px',
                  color: 'var(--text-secondary)',
                  maxWidth: '520px',
                  lineHeight: 1.7,
                }}
              >
                Browse research peptides and bio regulators. Use keyword and category search to move through the catalog, and review published documentation on the COA Testing tab.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Catalog */}
      <section
        className={`catalog-shopping-section${hasVisualShopFrame ? ' catalog-shopping-section-visual' : ''}`}
        style={{ padding: hasVisualShopFrame ? '0 0 80px' : '48px 0 80px' }}
      >
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: hasVisualShopFrame ? '28px 40px 0' : '0 40px' }}>
          <Suspense fallback={<div style={{ height: '200px' }} />}>
            <ProductCatalog key={catalogKey} products={products} variant={hasVisualShopFrame ? 'dark' : 'light'} />
          </Suspense>
        </div>
      </section>
    </div>
  )
}
