import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getPrimaryPublishedCoAPage, getPrimaryPublishedCoAUrl } from '@/lib/data-testing'
import { PRODUCTS } from '@/lib/data-products'
import { CoAPageCanvas } from '@/components/CoAPageCanvas'
import { getStorefrontCoAObjectNames } from '@/lib/storefront-data'
import { getLiveProductBySlug, getLiveProductVariants } from '@/lib/catalog-live'
import { isDelistedProductSlug } from '@/lib/catalog-delist'

interface Props {
  params: Promise<{ slug: string }>
}

export const dynamic = 'force-dynamic'

function getPacketPdfPath(url: string) {
  return url.split('#')[0]
}

function getFallbackDisplayName(slug: string) {
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  if (isDelistedProductSlug(slug)) return { title: 'CoA Not Found' }
  const product = PRODUCTS[slug] ?? (await getLiveProductBySlug(slug))
  const displayName = product?.displayName ?? getFallbackDisplayName(slug)
  return {
    title: `${displayName} CoA`,
    description: `Certificate of analysis for ${displayName}.`,
  }
}

export default async function ProductCoAPage({ params }: Props) {
  const { slug } = await params
  // Withdrawn products keep no public CoA page, even if a certificate was uploaded for them.
  if (isDelistedProductSlug(slug)) notFound()
  const product = PRODUCTS[slug] ?? (await getLiveProductBySlug(slug))
  let effectiveCoaSlug = slug
  let effectiveCoaProduct = product
  let sourceUrl = getPrimaryPublishedCoAUrl(slug)
  let pageNumber = getPrimaryPublishedCoAPage(slug)
  let uploadedCoaObjectNames = await getStorefrontCoAObjectNames(slug)

  if ((!sourceUrl || !pageNumber) && uploadedCoaObjectNames.length === 0 && product) {
    const variants = await getLiveProductVariants(product)
    for (const variant of variants) {
      if (variant.slug === slug) continue

      const variantSourceUrl = getPrimaryPublishedCoAUrl(variant.slug)
      const variantPageNumber = getPrimaryPublishedCoAPage(variant.slug)
      const variantUploadedCoaObjectNames = await getStorefrontCoAObjectNames(variant.slug)
      if ((!variantSourceUrl || !variantPageNumber) && variantUploadedCoaObjectNames.length === 0) continue

      effectiveCoaSlug = variant.slug
      effectiveCoaProduct = variant
      sourceUrl = variantSourceUrl
      pageNumber = variantPageNumber
      uploadedCoaObjectNames = variantUploadedCoaObjectNames
      break
    }
  }

  if ((!sourceUrl || !pageNumber) && uploadedCoaObjectNames.length === 0) {
    notFound()
  }

  const displayName = product?.displayName ?? getFallbackDisplayName(slug)
  const sourceDescription =
    effectiveCoaSlug === slug
      ? ''
      : ` Showing the available CoA attached to ${effectiveCoaProduct?.variantLabel || effectiveCoaProduct?.displayName || effectiveCoaSlug}.`
  const pdfPath = sourceUrl ? getPacketPdfPath(sourceUrl) : ''
  const uploadedCoaFiles = uploadedCoaObjectNames.map((fileName, index) => {
    const extension = fileName.split('.').pop()?.toLowerCase() ?? ''
    return {
      fileName,
      pageIndex: index + 1,
      url: `/api/catalog-assets/coa/${effectiveCoaSlug}?file=${encodeURIComponent(fileName)}`,
      isPdf: extension === 'pdf',
    }
  })

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh', padding: '48px 24px 72px' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto', display: 'grid', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'grid', gap: '8px' }}>
            <div className="section-label">Product CoA</div>
            <h1 style={{ margin: 0, fontSize: 'clamp(26px, 4vw, 40px)' }}>{displayName}</h1>
            <div style={{ color: 'var(--text-secondary)' }}>
              {uploadedCoaFiles.length > 0
                ? `Showing ${uploadedCoaFiles.length} uploaded CoA page${uploadedCoaFiles.length === 1 ? '' : 's'} for this product.${sourceDescription}`
                : `Showing only the matched certificate page for this product.${sourceDescription}`}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Link href={`/products/${slug}`} className="fm-btn-outline">
              Back to Product
            </Link>
          </div>
        </div>

        {uploadedCoaFiles.length > 0 ? (
          <div className="card" style={{ padding: '20px', display: 'grid', gap: '18px' }}>
            {uploadedCoaFiles.map((file) => (
              <div key={file.fileName} style={{ display: 'grid', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div className="section-label">Uploaded CoA Page {file.pageIndex}</div>
                  <a href={file.url} target="_blank" rel="noopener noreferrer" className="fm-btn-outline" style={{ textDecoration: 'none' }}>
                    Open Page {file.pageIndex}
                  </a>
                </div>
                {file.isPdf ? (
                  <iframe
                    src={file.url}
                    title={`${displayName} CoA Page ${file.pageIndex}`}
                    style={{
                      width: '100%',
                      minHeight: '88vh',
                      border: '1px solid var(--border)',
                      borderRadius: '14px',
                      background: '#fff',
                    }}
                  />
                ) : (
                  <Image
                    src={file.url}
                    alt={`${displayName} CoA Page ${file.pageIndex}`}
                    width={1600}
                    height={2200}
                    unoptimized
                    style={{
                      width: '100%',
                      height: 'auto',
                      borderRadius: '14px',
                      border: '1px solid var(--border)',
                      background: '#fff',
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        ) : (
          <CoAPageCanvas pdfPath={pdfPath} pageNumber={pageNumber!} title={`${displayName} CoA`} />
        )}
      </div>
    </div>
  )
}
