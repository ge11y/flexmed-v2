import type { Metadata } from 'next'
import type { CSSProperties } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { PUBLIC_SLUGS, getProductImageSrc, getProductHoverSpinFrames } from '@/lib/data-products'
import { getLiveProductBySlug, getLiveProductVariants } from '@/lib/catalog-live'
import { isDelistedProductSlug } from '@/lib/catalog-delist'
import { isLowStock } from '@/lib/inventory-state'
import { getProductCoALink, getTestingRecordsForProduct, hasPublishedCoA } from '@/lib/data-testing'
import { getCatalogCoAObjectNames } from '@/lib/catalog-assets'
import { ProductImage } from '@/components/ProductImage'
import { ProductPurchasePanel } from '@/components/ProductPurchasePanel'
import {
  getProductCardSummary,
  getProductFormatLabel,
  getProductListingNotes,
  getProductMetaDescription,
  getProductResearchDescription,
  getProductResearchFocusPoints,
  getProductResearchLead,
  getProductResearchReferenceCategories,
  getResearchUseDisclaimer,
} from '@/lib/product-copy'

interface Props {
  params: Promise<{ slug: string }>
}

export const dynamic = 'force-dynamic'

const productDetailTheme = {
  '--bg-base': '#071A3D',
  '--bg-surface': '#102A54',
  '--bg-elevated': 'rgba(255,255,255,0.07)',
  '--bg-card': 'linear-gradient(165deg, rgba(38,82,145,0.92), rgba(26,62,116,0.90))',
  '--border': 'rgba(140,175,225,0.20)',
  '--border-strong': 'rgba(77,211,232,0.42)',
  '--text-primary': '#F2F7FE',
  '--text-secondary': 'rgba(230,240,255,0.76)',
  '--text-muted': 'rgba(195,211,236,0.62)',
  '--accent-400': '#5FE3D6',
  '--accent-500': '#2DD4C4',
  '--amber': '#5FE3D6',
  '--amber-muted': 'rgba(45,212,196,0.12)',
  '--amber-border': 'rgba(45,212,196,0.26)',
} as CSSProperties

function getNormalizedFamilyDisplayName(
  product: { displayName: string; strength: number; unit: string },
  familyVariants: Array<{ displayName: string; strength: number; unit: string }> = [],
) {
  const stripStrengthSuffix = (displayName: string, strength: number, unit: string) => {
    const trimmed = displayName.trim()
    if (!trimmed) return trimmed
    const compact = `${strength}${unit}`.trim()
    const spaced = `${strength} ${unit}`.trim()
    for (const candidate of [compact, spaced]) {
      if (!candidate) continue
      const escaped = candidate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const pattern = new RegExp(`(?:\\s+)?${escaped}$`, 'i')
      if (pattern.test(trimmed)) return trimmed.replace(pattern, '').trim()
    }
    return trimmed
  }

  const names = [product, ...familyVariants]
    .map((entry) => stripStrengthSuffix(entry.displayName, entry.strength, entry.unit))
    .filter(Boolean)
    .sort((a, b) => a.length - b.length || a.localeCompare(b))

  return names[0] ?? product.displayName
}

function formatVariantStrengthLabel(entry: {
  variantLabel?: string
  strength: number
  unit: string
}) {
  const rawLabel = entry.variantLabel?.trim()
  if (rawLabel) {
    return rawLabel.replace(/^(\d+(?:\.\d+)?)([a-zA-Z]+)/, '$1 $2').trim()
  }

  return `${entry.strength} ${entry.unit}`.trim()
}

export async function generateStaticParams() {
  return PUBLIC_SLUGS.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  if (isDelistedProductSlug(slug)) return { title: 'Product Not Found' }
  const product = await getLiveProductBySlug(slug)
  if (!product) return { title: 'Product Not Found' }
  const familyVariants = await getLiveProductVariants(product)
  const displayTitle =
    familyVariants.length > 1 ? getNormalizedFamilyDisplayName(product, familyVariants) : product.displayName
  return {
    title: displayTitle,
    description: getProductMetaDescription(product),
  }
}

// ─── Placeholder guard ─────────────────────────────────────────
// Strips empty or [XXX REQUIRED] patterns so raw placeholders
// never appear publicly.
// ───────────────────────────────────────────────────────────────

const PLACEHOLDER_PATTERN =
  /^\[.+(REQUIRED|PENDING).*\]|^\[DATE.*\]|^\[LABEL.*\]|^\[PRODUCT.*\]|^\[IMAGE.*\]/i

function cleanValue(val: string | undefined | null): string | null {
  if (!val) return null
  if (PLACEHOLDER_PATTERN.test(val.trim())) return null
  return val
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params
  if (isDelistedProductSlug(slug)) notFound()
  const product = await getLiveProductBySlug(slug)
  if (!product || product.publicVisible === false) notFound()

  const [uploadedCoaObjectNames, familyVariants] = await Promise.all([
    getCatalogCoAObjectNames(slug),
    getLiveProductVariants(product),
  ])
  const uploadedCoaHref = uploadedCoaObjectNames.length > 0 ? `/coa/${slug}` : null
  const testingRecords = getTestingRecordsForProduct(slug)
  const primaryTestingRecord = testingRecords.find((record) => record.status === 'available') ?? testingRecords[0] ?? null
  const coaHref = product.coaUrl || getProductCoALink(product) || uploadedCoaHref
  const coaNotRequired = Boolean(product.coaNotRequired)
  const hasCoA = !coaNotRequired && (Boolean(coaHref) || hasPublishedCoA(slug))
  const frontSrc = getProductImageSrc(product)
  const cardSummary = getProductCardSummary(product)
  const researchLead = getProductResearchLead(product)
  const researchDescription = getProductResearchDescription(product)
  const researchFocusPoints = getProductResearchFocusPoints(product)
  const researchReferenceCategories = getProductResearchReferenceCategories(product)
  const listingNotes = getProductListingNotes(product)
  const ruoDisclaimer = getResearchUseDisclaimer()
  const familyDisplayName =
    familyVariants.length > 1 ? getNormalizedFamilyDisplayName(product, familyVariants) : product.displayName
  const lowStock = isLowStock(product)

  const statusLabel: Record<string, string> = {
    in_stock: 'In Stock',
    out_of_stock: 'Out of Stock',
    incoming: 'Incoming',
  }

  const coaStatusLabel: Record<string, string> = {
    available: 'CoA Available',
    pending: 'CoA Pending Publication',
    not_available: 'CoA Pending Publication',
  }

  // ─── Clean key details rows ──────────────────────────────────
  const detailRows = [
    { label: 'Full Peptide Name', value: cleanValue(product.fullName) },
    { label: 'Alias', value: cleanValue(product.alias) },
    {
      label: 'Strength',
      value:
        product.strength || product.variantLabel
          ? cleanValue(
              formatVariantStrengthLabel({
                strength: product.strength,
                unit: product.unit,
                variantLabel: product.variantLabel,
              }),
            )
          : null,
    },
    { label: 'Format', value: cleanValue(getProductFormatLabel(product)) },
    { label: 'Structure Type', value: cleanValue(product.structureType) },
    { label: 'Batch / Lot', value: cleanValue(product.batchNumber) },
    { label: 'CoA Status', value: coaNotRequired ? null : hasCoA ? 'CoA Available' : coaStatusLabel[product.coaStatus] || null },
    { label: 'Testing Lab', value: cleanValue(product.testingLab) },
  ].filter((r) => r.value !== null) as { label: string; value: string }[]

  return (
    <div
      className="storefront-blue-shell"
      style={{
        ...productDetailTheme,
        background:
          'radial-gradient(circle at 12% 0%, rgba(77,211,232,0.16), transparent 34%), radial-gradient(circle at 88% 18%, rgba(155,150,212,0.12), transparent 32%), linear-gradient(180deg, #1B3E72 0%, #071A3D 42%, #061531 100%)',
        minHeight: '100vh',
      }}
    >

      {/* ─── Breadcrumb bar ───────────────────────────────────── */}
      <div
        className="product-detail-breadcrumb"
        style={{
          borderBottom: '1px solid rgba(140,175,225,0.20)',
          background: 'rgba(6,21,49,0.42)',
          padding: '0 40px',
          height: '48px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <Link
          href="/products"
          style={{
            fontSize: '13px',
            color: 'var(--text-muted)',
            textDecoration: 'none',
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.02em',
          }}
        >
          Catalog
        </Link>
        <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>/</span>
        <span
          style={{
            fontSize: '13px',
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {familyDisplayName}
        </span>
      </div>

      {/* ─── Product Hero ──────────────────────────────────────── */}
      <section
        className="product-detail-hero"
        style={{
          padding: '48px 40px 56px',
          borderBottom: '1px solid rgba(140,175,225,0.18)',
        }}
      >
        <div
          className="product-detail-hero-grid"
          style={{
            maxWidth: '1100px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) 360px',
            gap: '64px',
            alignItems: 'start',
          }}
        >
          {/* Left — product info + image */}
          <div className="product-detail-main" style={{ paddingTop: '8px' }}>

            {/* Status badges */}
            <div style={{ marginBottom: '20px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span
                className={`badge ${
                  product.status === 'in_stock' && lowStock
                    ? 'badge-amber'
                    : product.status === 'in_stock'
                    ? 'badge-green'
                    : product.status === 'out_of_stock'
                    ? 'badge-muted'
                    : 'badge-amber'
                }`}
              >
                {product.status === 'in_stock' && lowStock ? 'Low Stock' : statusLabel[product.status]}
              </span>
              {hasCoA && (
                <span className="badge badge-green">
                  CoA Available
                </span>
              )}
              {product.promoLabel && <span className="badge badge-amber">{product.promoLabel}</span>}
            </div>

            {/* Product name — large */}
            <h1
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(28px, 4vw, 44px)',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '6px',
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
              }}
            >
              {familyDisplayName}
            </h1>

            {/* Full name */}
            {product.fullName && (
              <p
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  marginBottom: '24px',
                  letterSpacing: '0.03em',
                }}
              >
                {product.fullName}
              </p>
            )}

            {familyVariants.length > 1 && (
              <div style={{ marginBottom: '24px' }}>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    marginBottom: '10px',
                  }}
                >
                  Available Strengths
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {familyVariants.map((variant) => {
                    const isCurrent = variant.slug === product.slug
                    const variantLowStock = isLowStock(variant)
                    return (
                      <Link
                        key={variant.slug}
                        href={`/products/${variant.slug}`}
                        style={{
                          display: 'inline-flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          minWidth: '72px',
                          padding: '10px 14px',
                          borderRadius: '999px',
                          border: isCurrent ? '1px solid var(--accent-400)' : '1px solid var(--border)',
                          background: isCurrent ? 'rgba(42, 79, 174, 0.08)' : 'var(--bg-card)',
                          color: isCurrent ? 'var(--accent-500)' : 'var(--text-secondary)',
                          textDecoration: 'none',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '12px',
                          letterSpacing: '0.04em',
                        }}
                      >
                        <span>
                          {formatVariantStrengthLabel({
                            strength: variant.strength,
                            unit: variant.unit,
                            variantLabel: variant.variantLabel,
                          })}
                        </span>
                        <span
                          style={{
                            fontSize: '10px',
                            letterSpacing: '0',
                            textTransform: 'none',
                            color:
                              variant.status === 'out_of_stock'
                                ? 'var(--text-muted)'
                                : variantLowStock
                                  ? 'var(--amber)'
                                  : isCurrent
                                    ? 'var(--accent-500)'
                                    : 'var(--text-muted)',
                          }}
                        >
                          {variant.status === 'incoming'
                            ? 'Incoming'
                            : variant.status === 'out_of_stock'
                              ? 'Out of Stock'
                              : variant.inventoryOnHand !== null && variant.inventoryOnHand !== undefined
                                ? `${variant.inventoryOnHand} available`
                                : 'In Stock'}
                        </span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Summary — larger, readable */}
            <p
              style={{
                fontSize: '16px',
                color: 'var(--text-secondary)',
                lineHeight: 1.7,
                maxWidth: '560px',
                marginBottom: '18px',
              }}
              >
                {cardSummary}
              </p>

            {(product.inventoryOnHand !== null && product.inventoryOnHand !== undefined) || product.promoDetail ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  marginBottom: '24px',
                }}
              >
                {product.inventoryOnHand !== null && product.inventoryOnHand !== undefined ? (
                  <div
                    style={{
                      fontSize: '14px',
                      color: lowStock ? 'var(--amber)' : 'var(--text-secondary)',
                    }}
                  >
                    {lowStock ? `Only ${product.inventoryOnHand} currently available.` : `${product.inventoryOnHand} currently available.`}
                  </div>
                ) : null}
                {product.promoDetail ? (
                  <div
                    style={{
                      fontSize: '14px',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.7,
                      maxWidth: '560px',
                    }}
                  >
                    {product.promoDetail}
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* CTAs */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {product.publishStatus !== 'needs_confirmation' ? (
                <>
                  {coaHref && (
                    <a
                      href={coaHref}
                      className="fm-btn-outline"
                      target={coaHref.endsWith('.pdf') || coaHref.startsWith('http') || coaHref.startsWith('/api/catalog-assets/coa/') ? '_blank' : undefined}
                      rel={coaHref.endsWith('.pdf') || coaHref.startsWith('http') || coaHref.startsWith('/api/catalog-assets/coa/') ? 'noopener noreferrer' : undefined}
                    >
                      CoA Available
                    </a>
                  )}
                </>
              ) : null}
            </div>

            <div
              className="product-detail-image-panel"
              style={{
                marginTop: '36px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-xl)',
                padding: '24px',
              }}
            >
              <ProductImage
                className="product-detail-image"
                slug={product.slug}
                displayName={product.displayName}
                accentColorHex={product.accentColorHex}
                image={frontSrc}
                hoverSpinFrames={getProductHoverSpinFrames(product)}
                height={620}
              />
            </div>
          </div>

          {/* Right — documentation + purchase options */}
          <div
            className="product-detail-side"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              position: 'sticky',
              top: '88px',
            }}
          >
            {/* Documentation */}
            {hasCoA ? (
              <div>
                <p
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    letterSpacing: '0.10em',
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    marginBottom: '12px',
                    fontWeight: 500,
                  }}
                >
                  Documentation
                </p>
                <div
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                  }}
                >
                {coaNotRequired ? (
                  <div style={{ display: 'grid', gap: '10px' }}>
                    <span className="badge badge-muted" style={{ width: 'fit-content' }}>
                      No CoA needed
                    </span>
                    <p
                      style={{
                        margin: 0,
                        color: 'var(--text-secondary)',
                        fontSize: '13px',
                        lineHeight: 1.7,
                      }}
                    >
                      This listing does not require a CoA display.
                    </p>
                  </div>
	                ) : primaryTestingRecord ? (
                  (() => {
                    const cleanRecordRows = [
                      {
                        label: 'Testing Lab',
                        value: cleanValue(primaryTestingRecord.testingLab),
                      },
                      {
                        label: 'Test Date',
                        value: cleanValue(primaryTestingRecord.testDate),
                      },
                      {
                        label: 'Purity',
                        value: cleanValue(primaryTestingRecord.purityPercent),
                      },
                      {
                        label: 'Methodology',
                        value: primaryTestingRecord.methodology?.length
                          ? primaryTestingRecord.methodology.join(', ')
                          : null,
                      },
                    ].filter((r) => r.value !== null) as {
                      label: string
                      value: string
                    }[]

                    return (
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <span
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: '11px',
                              color: 'var(--text-muted)',
                              letterSpacing: '0.05em',
                            }}
                          >
                            Batch {cleanValue(primaryTestingRecord.batchNumber) ?? '—'}
                          </span>
                          <span
                            className={`badge ${
                              (coaHref || primaryTestingRecord.status === 'available') ? 'badge-green' : 'badge-muted'
                            }`}
                          >
                            {(coaHref || primaryTestingRecord.status === 'available') ? 'Available' : 'Pending'}
                          </span>
                        </div>
                        {cleanRecordRows.length > 0 && (
                          <div style={{ display: 'grid', gap: '8px' }}>
                            {cleanRecordRows.map((r) => (
                              <div
                                key={r.label}
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  fontSize: '13px',
                                }}
                              >
                                <span style={{ color: 'var(--text-muted)' }}>
                                  {r.label}
                                </span>
                                <span
                                  style={{
                                    color: 'var(--text-secondary)',
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: '12px',
                                  }}
                                >
                                  {r.value}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                        {coaHref ? (
                          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                            <a
                              href={coaHref}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '12px',
                                fontFamily: 'var(--font-mono)',
                                letterSpacing: '0.05em',
                                color: 'var(--accent-400)',
                                textDecoration: 'none',
                                fontWeight: 500,
                              }}
                            >
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                              </svg>
                              View CoA Document
                            </a>
                          </div>
                        ) : (
                          <p
                            style={{
                              fontSize: '12px',
                              color: 'var(--text-muted)',
                              fontFamily: 'var(--font-mono)',
                            }}
                          >
                            CoA record pending publication
                          </p>
                        )}
                      </div>
                    )
                  })()
	                ) : coaHref ? (
	                  <div style={{ display: 'grid', gap: '14px' }}>
	                    <span className="badge badge-green" style={{ width: 'fit-content' }}>
	                      Available
	                    </span>
	                    <p
	                      style={{
	                        margin: 0,
	                        color: 'var(--text-secondary)',
	                        fontSize: '13px',
	                        lineHeight: 1.7,
	                      }}
	                    >
	                      A CoA document is available for this product and strength.
	                    </p>
	                    <a
	                      href={coaHref}
	                      target="_blank"
	                      rel="noopener noreferrer"
	                      style={{
	                        display: 'inline-flex',
	                        alignItems: 'center',
	                        gap: '6px',
	                        fontSize: '12px',
	                        fontFamily: 'var(--font-mono)',
	                        letterSpacing: '0.05em',
	                        color: 'var(--accent-400)',
	                        textDecoration: 'none',
	                        fontWeight: 500,
	                      }}
	                    >
	                      <svg
	                        width="12"
	                        height="12"
	                        viewBox="0 0 24 24"
	                        fill="none"
	                        stroke="currentColor"
	                        strokeWidth="2"
	                      >
	                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
	                        <polyline points="14 2 14 8 20 8" />
	                      </svg>
	                      View CoA Document
	                    </a>
	                  </div>
	                ) : null}
                </div>
              </div>
            ) : null}

            {/* Pricing + quantity */}
            <div>
              <p
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  letterSpacing: '0.10em',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  marginBottom: '12px',
                  fontWeight: 500,
                }}
              >
                Purchase Options
              </p>
              <ProductPurchasePanel
                key={product.slug}
                slug={product.slug}
                displayName={product.displayName}
                priceVial={product.priceVial}
                status={product.status}
                inventoryOnHand={product.inventoryOnHand}
                lowStockThreshold={product.lowStockThreshold}
                promoLabel={product.promoLabel}
                promoDetail={product.promoDetail}
                promoDiscountType={product.promoDiscountType}
                promoBuyQuantity={product.promoBuyQuantity}
                promoGetQuantity={product.promoGetQuantity}
                promoDiscountedPrice={product.promoDiscountedPrice}
                familyVariants={familyVariants.map((variant) => ({
                  slug: variant.slug,
                  displayName: variant.displayName,
                  variantLabel: variant.variantLabel,
                  strength: variant.strength,
                  unit: variant.unit,
                  priceVial: variant.priceVial,
                  status: variant.status,
                  inventoryOnHand: variant.inventoryOnHand ?? null,
                  lowStockThreshold: variant.lowStockThreshold ?? null,
                  promoLabel: variant.promoLabel,
                  promoDetail: variant.promoDetail,
                  promoDiscountType: variant.promoDiscountType,
                  promoBuyQuantity: variant.promoBuyQuantity,
                  promoGetQuantity: variant.promoGetQuantity,
                  promoDiscountedPrice: variant.promoDiscountedPrice,
                }))}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Content Section ──────────────────────────────────── */}
      <section className="product-detail-content" style={{ padding: '64px 40px 80px' }}>
        <div
          style={{
            maxWidth: '1100px',
            margin: '0 auto',
          }}
        >
          {/* Left column — content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>

            {/* Research Summary */}
            <div>
              <p
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  letterSpacing: '0.10em',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  marginBottom: '14px',
                  fontWeight: 500,
                }}
              >
                Research Summary
              </p>
              <h2
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '22px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '16px',
                  letterSpacing: '-0.01em',
                  lineHeight: 1.3,
                }}
              >
                {product.fullName}
              </h2>
              <p
                style={{
                  fontSize: '16px',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.8,
                  marginBottom: '18px',
                }}
              >
                {researchLead}
              </p>
              <p
                style={{
                  fontSize: '15px',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.8,
                }}
              >
                {researchDescription}
              </p>
            </div>

            {/* Key Product Details — larger text */}
            {detailRows.length > 0 && (
              <div>
                <p
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    letterSpacing: '0.10em',
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    marginBottom: '14px',
                    fontWeight: 500,
                  }}
                >
                  Key Product Details
                </p>
                <div
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                  }}
                >
                  {detailRows.map((row, i) => (
                    <div
                      key={row.label}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '180px 1fr',
                        gap: '24px',
                        padding: '15px 20px',
                        borderBottom:
                          i < detailRows.length - 1
                            ? '1px solid var(--border)'
                            : 'none',
                        alignItems: 'start',
                      }}
                    >
                      <div
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '11px',
                          color: 'var(--text-muted)',
                          letterSpacing: '0.04em',
                          paddingTop: '1px',
                        }}
                      >
                        {row.label}
                      </div>
                      <div
                        style={{
                          fontFamily: 'var(--font-body)',
                          fontSize: '15px',
                          color: 'var(--text-primary)',
                          lineHeight: 1.5,
                        }}
                      >
                        {row.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Product Description */}
            <div>
              <p
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  letterSpacing: '0.10em',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  marginBottom: '14px',
                  fontWeight: 500,
                }}
              >
                Product Description
              </p>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  color: 'var(--text-secondary)',
                  fontSize: '15px',
                  lineHeight: 1.7,
                }}
              >
                <div>{researchLead}</div>
                <div>{researchDescription}</div>
              </div>
            </div>

            {/* Primary Research Focus */}
            {researchFocusPoints.length > 0 && (
              <div>
                <p
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    letterSpacing: '0.10em',
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    marginBottom: '14px',
                    fontWeight: 500,
                  }}
                >
                  Primary Research Focus
                </p>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  {researchFocusPoints.map((f) => (
                    <div
                      key={f}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        fontSize: '15px',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.5,
                      }}
                    >
                      <div
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: 'var(--accent-400)',
                          flexShrink: 0,
                        }}
                      />
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Research Reference Categories */}
            {researchReferenceCategories.length > 0 && (
              <div>
                <p
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    letterSpacing: '0.10em',
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    marginBottom: '14px',
                    fontWeight: 500,
                  }}
                >
                  Research Reference Categories
                </p>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
                    gap: '14px',
                  }}
                >
                  {researchReferenceCategories.map((category) => (
                    <div
                      key={category.label}
                      style={{
                        padding: '18px',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-lg)',
                        background: 'rgba(95, 227, 214, 0.07)',
                        boxShadow: '0 18px 44px rgba(0, 0, 0, 0.12)',
                      }}
                    >
                      <h3
                        style={{
                          fontFamily: 'var(--font-heading)',
                          fontSize: '17px',
                          lineHeight: 1.25,
                          color: 'var(--text-primary)',
                          marginBottom: '10px',
                        }}
                      >
                        {category.label}
                      </h3>
                      <p
                        style={{
                          fontSize: '14px',
                          lineHeight: 1.65,
                          color: 'var(--text-secondary)',
                          marginBottom: '14px',
                        }}
                      >
                        {category.description}
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {category.keywords.map((keyword) => (
                          <span
                            key={keyword}
                            style={{
                              border: '1px solid var(--amber-border)',
                              borderRadius: '999px',
                              color: 'var(--accent-400)',
                              background: 'var(--amber-muted)',
                              fontFamily: 'var(--font-mono)',
                              fontSize: '10px',
                              letterSpacing: '0.06em',
                              textTransform: 'uppercase',
                              padding: '6px 9px',
                            }}
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <p
                  style={{
                    color: 'var(--text-muted)',
                    fontSize: '12px',
                    lineHeight: 1.7,
                    marginTop: '12px',
                  }}
                >
                  Categories are provided for research organization and literature search context only. They are not
                  treatment, diagnostic, administration, dosing, or human-use guidance.
                </p>
              </div>
            )}

            {/* Listing Details */}
            {listingNotes.length > 0 && (
              <div>
                <p
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    letterSpacing: '0.10em',
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    marginBottom: '14px',
                    fontWeight: 500,
                  }}
                >
                  Listing Details
                </p>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  {listingNotes.map((f) => (
                    <div
                      key={f}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        fontSize: '15px',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.5,
                      }}
                    >
                      <div
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: 'var(--accent-400)',
                          flexShrink: 0,
                        }}
                      />
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Research-use notice */}
            <div
              style={{
                padding: '16px 20px',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-elevated)',
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  letterSpacing: '0.04em',
                  color: 'var(--text-muted)',
                  lineHeight: 1.8,
                }}
              >
                {ruoDisclaimer}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
