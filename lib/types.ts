// ============================================================
// FlexMed v2 — TypeScript Type Definitions
// ============================================================

export type ProductSlug =
  | 'cjc-ipa-10mg'
  | 'cagri-5mg'
  | 'dsip-5mg'
  | 'epithalon-10mg'
  | 'glutathione-600'
  | 'glutathione-1200'
  | 'kpv-10mg'
  | 'mots-c-40mg'
  | 'nad-plus-500'
  | 'pnc-27-5mg'
  | 'pt-141-10mg'
  | 'snap-8-10mg'
  | 'ss-31-50mg'
  | 'thy-a1-10mg'
  | 'tirz-15mg'
  | 'tirz-30mg'

export type ProductStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'coming_soon'
export type CoaStatus = 'available' | 'pending' | 'not_available'
export type PublishStatus = 'confirmed' | 'needs_confirmation' | 'on_hold'

export interface ProductFormat {
  size: number
  unit: 'mg'
  formatType: 'vial'
}

export interface Product {
  slug: string
  displayName: string
  fullName: string
  alias: string
  category: string
  researchCategory: string
  structureType: string
  strength: number
  unit: 'mg'
  formatType: 'vial'
  status: ProductStatus
  coaStatus: CoaStatus
  coaUrl: string
  verificationUrl: string
  batchNumber: string
  testingLab: string
  purityPercent: string
  summaryShort: string
  summaryFull: string
  features: string[]
  accentColor: string
  accentColorHex: string
  image: string
  hoverSpinFrames: string[]
  publishStatus: PublishStatus
  needsFounderConfirmation: boolean
  onHoldReason?: string
  notes?: string
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
