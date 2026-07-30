import { NextResponse } from 'next/server'
import { hasAdminSession } from '@/lib/admin-auth'
import { getLiveProductBySlug, getLiveProductVariants } from '@/lib/catalog-live'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { slug } = await params
  const product = await getLiveProductBySlug(slug)

  if (!product) {
    return NextResponse.json({ ok: false, error: 'Product not found' }, { status: 404 })
  }

  const familyVariants = await getLiveProductVariants(product)

  return NextResponse.json({
    ok: true,
    product: {
      slug: product.slug,
      displayName: product.displayName,
      variantGroup: product.variantGroup,
      variantLabel: product.variantLabel,
      status: product.status,
      inventoryOnHand: product.inventoryOnHand ?? null,
      publicVisible: product.publicVisible,
      coaStatus: product.coaStatus,
      coaUrl: product.coaUrl,
      coaNotRequired: product.coaNotRequired ?? false,
    },
    familyVariants: familyVariants.map((variant) => ({
      slug: variant.slug,
      displayName: variant.displayName,
      variantGroup: variant.variantGroup,
      variantLabel: variant.variantLabel,
      strength: variant.strength,
      unit: variant.unit,
      status: variant.status,
      inventoryOnHand: variant.inventoryOnHand ?? null,
      publicVisible: variant.publicVisible,
      priceVial: variant.priceVial,
      coaStatus: variant.coaStatus,
      coaUrl: variant.coaUrl,
      coaNotRequired: variant.coaNotRequired ?? false,
    })),
  })
}
