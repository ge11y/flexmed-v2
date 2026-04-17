// ============================================================
// FlexMed v2 — Testing Records Data
// Batch-by-batch testing records — plug in lab data here
// ============================================================

import type { TestingRecord, TestingLab } from './types'

// ─── Testing Laboratories ─────────────────────────────────────
export const TESTING_LABS: Record<string, TestingLab> = {
  primary: {
    name: '[TESTING LAB NAME REQUIRED]',
    accreditationBody: '[ACCREDITATION BODY REQUIRED]',
    accreditationNumber: '[ACCREDITATION NUMBER REQUIRED]',
    website: '[LAB WEBSITE REQUIRED]',
  },
}

// ─── Batch Testing Records ────────────────────────────────────
// Map each product slug to its testing record(s).
// When CoA is available, populate coaUrl and inlinePreview.
// Inline preview: true = show on product page, false = download only.

export const TESTING_RECORDS: Record<string, TestingRecord[]> = {
  'cjc-ipa-10mg': [
    {
      productSlug: 'cjc-ipa-10mg',
      batchNumber: 'FM-CJC-IPA-001',
      testingLab: '[TESTING LAB REQUIRED]',
      labAccreditation: '[ACCREDITATION REQUIRED]',
      testDate: '[DATE REQUIRED]',
      purityPercent: '[PURITY REQUIRED]',
      methodology: ['HPLC', 'Mass Spectrometry'],
      coaUrl: '[COA URL REQUIRED]',
      inlinePreview: false,
    },
  ],
  'tirz-15mg': [
    {
      productSlug: 'tirz-15mg',
      batchNumber: 'FM-TZ-1501',
      testingLab: '[TESTING LAB REQUIRED]',
      labAccreditation: '[ACCREDITATION REQUIRED]',
      testDate: '[DATE REQUIRED]',
      purityPercent: '[PURITY REQUIRED]',
      methodology: ['HPLC', 'Mass Spectrometry'],
      coaUrl: '[COA URL REQUIRED]',
      inlinePreview: false,
    },
  ],
  'tirz-30mg': [
    {
      productSlug: 'tirz-30mg',
      batchNumber: 'FM-TZ-3001',
      testingLab: '[TESTING LAB REQUIRED]',
      labAccreditation: '[ACCREDITATION REQUIRED]',
      testDate: '[DATE REQUIRED]',
      purityPercent: '[PURITY REQUIRED]',
      methodology: ['HPLC', 'Mass Spectrometry'],
      coaUrl: '[COA URL REQUIRED]',
      inlinePreview: false,
    },
  ],
  'nad-plus-500': [
    {
      productSlug: 'nad-plus-500',
      batchNumber: 'FM-NAD-500-001',
      testingLab: '[TESTING LAB REQUIRED]',
      labAccreditation: '[ACCREDITATION REQUIRED]',
      testDate: '[DATE REQUIRED]',
      purityPercent: '[PURITY REQUIRED]',
      methodology: ['HPLC', 'Mass Spectrometry'],
      coaUrl: '[COA URL REQUIRED]',
      inlinePreview: false,
    },
  ],
  'ss-31-50mg': [
    {
      productSlug: 'ss-31-50mg',
      batchNumber: 'FM-SS31-001',
      testingLab: '[TESTING LAB REQUIRED]',
      labAccreditation: '[ACCREDITATION REQUIRED]',
      testDate: '[DATE REQUIRED]',
      purityPercent: '[PURITY REQUIRED]',
      methodology: ['HPLC', 'Mass Spectrometry'],
      coaUrl: '[COA URL REQUIRED]',
      inlinePreview: false,
    },
  ],
  'mots-c-40mg': [
    {
      productSlug: 'mots-c-40mg',
      batchNumber: 'FM-MTC-001',
      testingLab: '[TESTING LAB REQUIRED]',
      labAccreditation: '[ACCREDITATION REQUIRED]',
      testDate: '[DATE REQUIRED]',
      purityPercent: '[PURITY REQUIRED]',
      methodology: ['HPLC', 'Mass Spectrometry'],
      coaUrl: '[COA URL REQUIRED]',
      inlinePreview: false,
    },
  ],
  'pt-141-10mg': [
    {
      productSlug: 'pt-141-10mg',
      batchNumber: 'FM-PT-001',
      testingLab: '[TESTING LAB REQUIRED]',
      labAccreditation: '[ACCREDITATION REQUIRED]',
      testDate: '[DATE REQUIRED]',
      purityPercent: '[PURITY REQUIRED]',
      methodology: ['HPLC', 'Mass Spectrometry'],
      coaUrl: '[COA URL REQUIRED]',
      inlinePreview: false,
    },
  ],
  'cagri-5mg': [
    {
      productSlug: 'cagri-5mg',
      batchNumber: 'FM-CAG-001',
      testingLab: '[TESTING LAB REQUIRED]',
      labAccreditation: '[ACCREDITATION REQUIRED]',
      testDate: '[DATE REQUIRED]',
      purityPercent: '[PURITY REQUIRED]',
      methodology: ['HPLC', 'Mass Spectrometry'],
      coaUrl: '[COA URL REQUIRED]',
      inlinePreview: false,
    },
  ],
  'dsip-5mg': [
    {
      productSlug: 'dsip-5mg',
      batchNumber: 'FM-DSP-001',
      testingLab: '[TESTING LAB REQUIRED]',
      labAccreditation: '[ACCREDITATION REQUIRED]',
      testDate: '[DATE REQUIRED]',
      purityPercent: '[PURITY REQUIRED]',
      methodology: ['HPLC', 'Mass Spectrometry'],
      coaUrl: '[COA URL REQUIRED]',
      inlinePreview: false,
    },
  ],
  'epithalon-10mg': [
    {
      productSlug: 'epithalon-10mg',
      batchNumber: 'FM-EPT-001',
      testingLab: '[TESTING LAB REQUIRED]',
      labAccreditation: '[ACCREDITATION REQUIRED]',
      testDate: '[DATE REQUIRED]',
      purityPercent: '[PURITY REQUIRED]',
      methodology: ['HPLC', 'Mass Spectrometry'],
      coaUrl: '[COA URL REQUIRED]',
      inlinePreview: false,
    },
  ],
  'glutathione-600': [
    {
      productSlug: 'glutathione-600',
      batchNumber: 'FM-GSH-600-001',
      testingLab: '[TESTING LAB REQUIRED]',
      labAccreditation: '[ACCREDITATION REQUIRED]',
      testDate: '[DATE REQUIRED]',
      purityPercent: '[PURITY REQUIRED]',
      methodology: ['HPLC', 'Mass Spectrometry'],
      coaUrl: '[COA URL REQUIRED]',
      inlinePreview: false,
    },
  ],
  'glutathione-1200': [
    {
      productSlug: 'glutathione-1200',
      batchNumber: 'FM-GSH-1200-001',
      testingLab: '[TESTING LAB REQUIRED]',
      labAccreditation: '[ACCREDITATION REQUIRED]',
      testDate: '[DATE REQUIRED]',
      purityPercent: '[PURITY REQUIRED]',
      methodology: ['HPLC', 'Mass Spectrometry'],
      coaUrl: '[COA URL REQUIRED]',
      inlinePreview: false,
    },
  ],
  'kpv-10mg': [
    {
      productSlug: 'kpv-10mg',
      batchNumber: 'FM-KPV-001',
      testingLab: '[TESTING LAB REQUIRED]',
      labAccreditation: '[ACCREDITATION REQUIRED]',
      testDate: '[DATE REQUIRED]',
      purityPercent: '[PURITY REQUIRED]',
      methodology: ['HPLC', 'Mass Spectrometry'],
      coaUrl: '[COA URL REQUIRED]',
      inlinePreview: false,
    },
  ],
  'pnc-27-5mg': [
    {
      productSlug: 'pnc-27-5mg',
      batchNumber: 'FM-PNC-001',
      testingLab: '[TESTING LAB REQUIRED]',
      labAccreditation: '[ACCREDITATION REQUIRED]',
      testDate: '[DATE REQUIRED]',
      purityPercent: '[PURITY REQUIRED]',
      methodology: ['HPLC', 'Mass Spectrometry'],
      coaUrl: '[COA URL REQUIRED]',
      inlinePreview: false,
    },
  ],
  'snap-8-10mg': [
    {
      productSlug: 'snap-8-10mg',
      batchNumber: 'FM-SNP-001',
      testingLab: '[TESTING LAB REQUIRED]',
      labAccreditation: '[ACCREDITATION REQUIRED]',
      testDate: '[DATE REQUIRED]',
      purityPercent: '[PURITY REQUIRED]',
      methodology: ['HPLC', 'Mass Spectrometry'],
      coaUrl: '[COA URL REQUIRED]',
      inlinePreview: false,
    },
  ],
  'thy-a1-10mg': [
    {
      productSlug: 'thy-a1-10mg',
      batchNumber: 'FM-THA-001',
      testingLab: '[TESTING LAB REQUIRED]',
      labAccreditation: '[ACCREDITATION REQUIRED]',
      testDate: '[DATE REQUIRED]',
      purityPercent: '[PURITY REQUIRED]',
      methodology: ['HPLC', 'Mass Spectrometry'],
      coaUrl: '[COA URL REQUIRED]',
      inlinePreview: false,
    },
  ],
}

// ─── Helpers ──────────────────────────────────────────────────
export function getTestingRecordsForProduct(slug: string): TestingRecord[] {
  return TESTING_RECORDS[slug] ?? []
}

export function hasPublishedCoA(slug: string): boolean {
  const records = getTestingRecordsForProduct(slug)
  return records.some(
    (r) => r.coaUrl && !r.coaUrl.includes('[REQUIRED]') && !r.coaUrl.includes('[PENDING]')
  )
}
