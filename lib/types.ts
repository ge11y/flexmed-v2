// ============================================================
// FlexMed v2 — TypeScript Type Definitions
// ============================================================

export type ProductSlug = string

export type ProductStatus = 'in_stock' | 'incoming' | 'out_of_stock'
export type CoaStatus = 'available' | 'pending' | 'not_available'
export type PublishStatus = 'confirmed' | 'needs_confirmation' | 'on_hold'
export type ProductUnit = string
export type ProductFormatType = string

/**
 * Risk tier for public visibility.
 * tier1_everything — higher-scrutiny compounds requiring explicit founder approval
 *                     before going public even after normal confirmation.
 * tier2_standard   — normal research catalog compounds.
 */
export type RiskTier = 'tier1_everything' | 'tier2_standard'

export interface ProductFormat {
  size: number
  unit: ProductUnit
  formatType: ProductFormatType
}

export interface Product {
  slug: string
  sku?: string
  displayName: string
  fullName: string
  alias: string
  category: string
  researchCategory: string
  structureType: string
  strength: number
  unit: ProductUnit
  formatType: ProductFormatType
  status: ProductStatus
  coaStatus: CoaStatus
  coaUrl: string
  verificationUrl: string
  batchNumber: string
  testingLab: string
  purityPercent: string
  summaryShort: string
  summaryFull: string
  researchFocusPoints?: string[]
  listingNotes?: string[]
  coaNotRequired?: boolean
  priceVial?: string
  priceKit?: string
  inventoryOnHand?: number | null
  lowStockThreshold?: number | null
  promoLabel?: string
  promoDetail?: string
  promoId?: string
  promoDiscountType?: 'percentage' | 'bogo' | 'free_shipping' | 'announcement'
  promoDiscountPercent?: number
  promoBuyQuantity?: number
  promoGetQuantity?: number
  promoDiscountedPrice?: number | null
  publicVisible?: boolean
  customProduct?: boolean
  archived?: boolean
  updatedAt?: string
  features: string[]
  accentColor: string
  accentColorHex: string
  image: string
  hoverSpinFrames: string[]
  publishStatus: PublishStatus
  needsFounderConfirmation: boolean
  /**
   * Risk tier for public visibility.
   * tier1_everything = higher-scrutiny compounds requiring explicit founder approval
   *                     before any public-facing presence, even after publishStatus='confirmed'.
   * tier2_standard   = normal catalog compounds (assumed when absent).
   */
  riskTier?: RiskTier
  onHoldReason?: string
  notes?: string
  variantGroup?: string
  variantLabel?: string
  listingAvailabilityLabel?: string
  listingAvailabilityTone?: 'green' | 'amber' | 'muted' | 'blue'
}

export interface SiteSettings {
  businessName: string
  tagline: string
  heroHeadline: string
  heroSubheadline: string
  heroPrimaryCta: string
  heroSecondaryCta: string
  heroDisclaimer: string
  trustSignals: TrustSignal[]
  featuredProductSlugs: ProductSlug[]
  footerDisclaimer: string
  institutionalEmail: string
  businessAddress: string
  companyRegistration: string
}

export interface TrustSignal {
  label: string
  icon: string
}

export interface LegalPage {
  slug: string
  title: string
  lastUpdated: string
  content: string
}

export interface FaqItem {
  id: string
  question: string
  answer: string
  category: string
  order: number
}

export interface TestingRecord {
  productSlug: string
  batchNumber: string
  testingLab: string
  labAccreditation: string
  testDate: string
  purityPercent: string
  methodology: string[]
  coaUrl: string
  inlinePreview: boolean
  /** 'available' = CoA published, link shown; 'pending' = no link */
  status: 'available' | 'pending'
}

export interface TestingLab {
  name: string
  accreditationBody: string
  accreditationNumber: string
  website: string
}

export interface NavLink {
  label: string
  href: string
}
