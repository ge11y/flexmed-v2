import assert from 'node:assert/strict'
import { buildCheckoutQuote } from '../lib/promo-pricing'
import { isPromoActiveNow, type SitePromoRecord } from '../lib/site-promos'

const settings = {
  shippingMode: 'flat_rate' as const,
  flatRate: '15',
  freeShippingEnabled: false,
  freeShippingThreshold: '300',
  localFreeShippingEnabled: true,
  localFreeShippingHomeZip: '35640',
  localFreeShippingRadiusMiles: '35',
  localFreeShippingZipCodes: '35640, 35601, 35555-35558',
  taxMode: 'not_charging' as const,
  taxRate: '',
  notes: '',
}

const catalog = [
  {
    slug: 'test-10mg',
    sku: 'TEST-10',
    displayName: 'Test Compound',
    fullName: 'Test Compound',
    strength: 10,
    unit: 'mg',
    collection: 'peptides' as const,
    researchCategory: 'General Research',
    formatType: 'vial',
    summaryShort: '',
    summaryFull: '',
    researchFocusPoints: [],
    listingNotes: [],
    coaNotRequired: false,
    variantGroup: 'Test Compound',
    variantLabel: '10mg',
    status: 'in_stock' as const,
    priceVial: '$100',
    inventoryOnHand: 20,
    lowStockThreshold: 4,
    promoLabel: '',
    promoDetail: '',
    featured: false,
    featuredOrder: null,
    publicVisible: true,
    imageUrl: '',
    imageSource: 'placeholder' as const,
    coaUrl: null,
    coaSource: 'none' as const,
    customProduct: false,
    archived: false,
  },
]

const vialCases = [
  {
    id: 'case-10',
    name: '10 Vial Case',
    description: 'Ten-count vial case.',
    priceLabel: '$25',
    priceAmount: 25,
    imageUrl: '',
    images: [],
    publicVisible: true,
    archived: false,
    sortOrder: 1,
    createdAt: undefined,
    updatedAt: undefined,
  },
]

function promo(
  overrides: Partial<SitePromoRecord> & Pick<SitePromoRecord, 'id' | 'discountType'>,
): SitePromoRecord {
  const { id, discountType, ...rest } = overrides
  return {
    title: rest.title ?? id,
    detail: '',
    promoKind: 'sitewide',
    placements: ['checkout'],
    scope: 'sitewide',
    targetSlug: null,
    targetSlugs: [],
    targetFamilyKeys: [],
    targetVialCaseIds: [],
    badgeLabel: '',
    popupImageUrl: '',
    discountPercent: null,
    buyQuantity: 1,
    getQuantity: 1,
    isActive: true,
    startsAt: null,
    endsAt: null,
    updatedAt: null,
    createdAt: '2026-06-24T12:00:00.000Z',
    ...rest,
    id,
    discountType,
  }
}

{
  const quote = buildCheckoutQuote({
    items: [{ slug: 'test-10mg', quantity: 2 }],
    catalog,
    promos: [promo({ id: 'percent-20', discountType: 'percentage', discountPercent: 20 })],
    settings: { ...settings, flatRate: '0' },
  })
  assert.equal(quote.order.totals.discount, 40)
  assert.equal(quote.order.totals.total, 160)
}

{
  const quote = buildCheckoutQuote({
    items: [{ itemType: 'vial_case', slug: 'case-10', option: 'case', quantity: 1 }],
    catalog,
    vialCases,
    promos: [
      promo({
        id: 'case-percent-20',
        discountType: 'percentage',
        promoKind: 'vial_cases',
        discountPercent: 20,
        targetVialCaseIds: ['case-10'],
      }),
    ],
    settings: { ...settings, flatRate: '0' },
  })
  assert.equal(quote.errors.length, 0)
  assert.equal(quote.order.lines[0].itemType, 'vial_case')
  assert.equal(quote.order.lines[0].discountAmount, 5)
  assert.equal(quote.order.totals.total, 20)
}

{
  const quote = buildCheckoutQuote({
    items: [{ itemType: 'vial_case', slug: 'case-10', option: 'case', quantity: 2 }],
    catalog,
    vialCases,
    promos: [
      promo({
        id: 'case-bogo',
        discountType: 'bogo',
        promoKind: 'vial_cases',
        targetVialCaseIds: ['case-10'],
      }),
    ],
    settings: { ...settings, flatRate: '0' },
  })
  assert.equal(quote.errors.length, 0)
  assert.equal(quote.order.lines[0].freeUnits, 1)
  assert.equal(quote.order.lines[0].quantity, 2)
  assert.equal(quote.order.totals.discount, 25)
  assert.equal(quote.order.totals.total, 25)
}

{
  const quote = buildCheckoutQuote({
    items: [{ slug: 'test-10mg', quantity: 2 }],
    catalog,
    promos: [promo({ id: 'bogo', discountType: 'bogo' })],
    settings: { ...settings, flatRate: '0' },
  })
  assert.equal(quote.order.lines[0].freeUnits, 1)
  assert.equal(quote.order.lines[0].quantity, 2)
  assert.equal(quote.order.totals.discount, 100)
  assert.equal(quote.order.totals.total, 100)
}

{
  const quote = buildCheckoutQuote({
    items: [{ slug: 'test-10mg', quantity: 1 }],
    catalog,
    promos: [
      promo({ id: 'bogo-not-complete', discountType: 'bogo' }),
      promo({ id: 'percent-20', discountType: 'percentage', discountPercent: 20 }),
    ],
    settings: { ...settings, flatRate: '0' },
  })
  assert.equal(quote.order.lines[0].appliedPromotion?.id, 'percent-20')
  assert.equal(quote.order.totals.discount, 20)
}

{
  const quote = buildCheckoutQuote({
    items: [{ slug: 'test-10mg', quantity: 1 }],
    catalog,
    promos: [
      promo({ id: 'percent-10', discountType: 'percentage', discountPercent: 10 }),
      promo({ id: 'free-ship', discountType: 'free_shipping' }),
    ],
    settings: {
      ...settings,
      taxMode: 'collect_at_checkout',
      taxRate: '10',
    },
  })
  assert.equal(quote.order.totals.discount, 10)
  assert.equal(quote.order.totals.shipping, 0)
  assert.equal(quote.order.totals.tax, 9)
  assert.equal(quote.order.totals.total, 99)
  assert.equal(quote.order.metadata.appliedPromotions?.length, 2)
}

{
  const quote = buildCheckoutQuote({
    items: [{ slug: 'test-10mg', quantity: 21 }],
    catalog,
    promos: [],
    settings,
  })
  assert.equal(quote.errors.length, 1)
  assert.equal(quote.order.lines.length, 0)
}

{
  const quote = buildCheckoutQuote({
    items: [
      { slug: 'test-10mg', quantity: 12 },
      { slug: 'test-10mg', quantity: 12 },
    ],
    catalog,
    promos: [],
    settings,
  })
  assert.equal(quote.errors.length, 1)
  assert.equal(quote.order.lines.length, 0)
}

{
  const now = new Date('2026-06-24T12:00:00.000Z')
  assert.equal(
    isPromoActiveNow(promo({ id: 'future', discountType: 'announcement', startsAt: '2026-06-25T12:00:00.000Z' }), now),
    false,
  )
  assert.equal(
    isPromoActiveNow(promo({ id: 'paused', discountType: 'announcement', isActive: false }), now),
    false,
  )
}

console.log('Promo pricing tests passed.')
