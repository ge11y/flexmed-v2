export const AFFILIATE_REFERRAL_STORAGE_KEY = 'flexmed_affiliate_referral_v1'

export type AffiliateReferralCapture = {
  code: string
  source: 'link' | 'code'
  landingPath: string
  capturedAt: string
}

export type AffiliateRecord = {
  id: string
  name: string
  email: string
  code: string
  notes: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export function normalizeAffiliateCode(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '')
}

export function buildAffiliateCode(name: string) {
  const cleaned = normalizeAffiliateCode(name).slice(0, 8)
  return cleaned || `AFF${Math.random().toString(36).slice(2, 6).toUpperCase()}`
}

export function buildAffiliateLink(origin: string, code: string) {
  return `${origin.replace(/\/$/, '')}/products?ref=${encodeURIComponent(code)}`
}

export function loadAffiliateReferralCapture(): AffiliateReferralCapture | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(AFFILIATE_REFERRAL_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<AffiliateReferralCapture>
    if (!parsed.code || !parsed.landingPath || !parsed.capturedAt) return null
    return {
      code: normalizeAffiliateCode(parsed.code),
      source: parsed.source === 'code' ? 'code' : 'link',
      landingPath: parsed.landingPath,
      capturedAt: parsed.capturedAt,
    }
  } catch {
    return null
  }
}

export function saveAffiliateReferralCapture(referral: AffiliateReferralCapture) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(AFFILIATE_REFERRAL_STORAGE_KEY, JSON.stringify(referral))
}

export function clearAffiliateReferralCapture() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(AFFILIATE_REFERRAL_STORAGE_KEY)
}
