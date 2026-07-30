// ============================================================
// FlexMed v2 — Testing Records Data
// Batch-by-batch testing records — populated when batches are tested.
// A product's TESTING_RECORDS entry must exist AND have status='available'
// AND a valid coaUrl for any CoA link to appear publicly.
// All records with placeholder data (including status='pending') are
// excluded from the public-facing documentation panel.
// ============================================================

import type { TestingRecord, TestingLab } from './types'

// ─── Testing Laboratories ─────────────────────────────────────
// Populate when the testing lab is confirmed. All fields required
// before any lab info is shown publicly.
// ─────────────────────────────────────────────────────────────
export const TESTING_LABS: Record<string, TestingLab> = {
  primary: {
    name: '',
    accreditationBody: '',
    accreditationNumber: '',
    website: '',
  },
}

// ─── Batch Testing Records ────────────────────────────────────
// Map each confirmed product slug to its testing record(s).
// Rules for public display:
//   status === 'available' AND coaUrl is a real URL  → CoA link shown
//   status === 'pending'                           → no CoA link, badge shows Pending
//   no entry for slug                              → empty state shown
// ─────────────────────────────────────────────────────────────
export const TESTING_RECORDS: Record<string, TestingRecord[]> = {
  '5-amino-1-50mg': [
    {
      productSlug: '5-amino-1-50mg',
      batchNumber: 'N/A',
      testingLab: 'Analytical Formulations, Inc.',
      labAccreditation: '',
      testDate: '2026-02-09',
      purityPercent: '99.4%',
      methodology: ['UV/Vis Spectrophotometry'],
      coaUrl: '/coa/flexmed-coas.pdf#page=1',
      inlinePreview: false,
      status: 'available',
    },
  ],
  'ara-290-10mg': [
    {
      productSlug: 'ara-290-10mg',
      batchNumber: 'N/A',
      testingLab: 'Analytical Formulations, Inc.',
      labAccreditation: '',
      testDate: '2026-01-20',
      purityPercent: '',
      methodology: ['UV/Vis Spectrophotometry'],
      coaUrl: '/coa/flexmed-coas.pdf#page=2',
      inlinePreview: false,
      status: 'available',
    },
  ],
  'adalink': [
    {
      productSlug: 'adalink',
      batchNumber: 'PGB-NASLK-4',
      testingLab: 'Janoshik',
      labAccreditation: '',
      testDate: '2026-03-17',
      purityPercent: '99.829% / 99.815% / 99.822%',
      methodology: ['HPLC', 'Mass Spectrometry'],
      coaUrl: '/coa/flexmed-coas.pdf#page=3',
      inlinePreview: false,
      status: 'available',
    },
  ],
  'adalink-amp': [
    {
      productSlug: 'adalink-amp',
      batchNumber: 'SEL1002022026-06',
      testingLab: 'Janoshik',
      labAccreditation: '',
      testDate: '2026-02-16',
      purityPercent: '99.907% / 99.867% / 99.828%',
      methodology: ['HPLC', 'Mass Spectrometry'],
      coaUrl: '/coa/flexmed-coas.pdf#page=4',
      inlinePreview: false,
      status: 'available',
    },
  ],
  'aodc-5mg': [
    {
      productSlug: 'aodc-5mg',
      batchNumber: 'Unknown',
      testingLab: 'Janoshik',
      labAccreditation: '',
      testDate: '2025-07-23',
      purityPercent: '99.411%',
      methodology: ['HPLC', 'Mass Spectrometry'],
      coaUrl: '/coa/flexmed-coas.pdf#page=6',
      inlinePreview: false,
      status: 'available',
    },
  ],
  'cagri-5mg': [
    {
      productSlug: 'cagri-5mg',
      batchNumber: 'N/A',
      testingLab: 'Analytical Formulations, Inc.',
      labAccreditation: '',
      testDate: '2026-01-02',
      purityPercent: '',
      methodology: ['UV/Vis Spectrophotometry'],
      coaUrl: '/coa/flexmed-coas.pdf#page=9',
      inlinePreview: false,
      status: 'available',
    },
    {
      productSlug: 'cagri-5mg',
      batchNumber: 'n2qs9md',
      testingLab: 'Finnrick / Krause Analytical',
      labAccreditation: '',
      testDate: '2026-03-17',
      purityPercent: '>99.9%',
      methodology: ['HPLC-UV-MS'],
      coaUrl: '/coa/flexmed-coas.pdf#page=10',
      inlinePreview: false,
      status: 'available',
    },
  ],
  'cartalax-20mg': [
    {
      productSlug: 'cartalax-20mg',
      batchNumber: 'CALAX20-1111',
      testingLab: 'Janoshik',
      labAccreditation: '',
      testDate: '2025-12-09',
      purityPercent: '99.860%',
      methodology: ['HPLC', 'Mass Spectrometry'],
      coaUrl: '/coa/flexmed-coas.pdf#page=11',
      inlinePreview: false,
      status: 'available',
    },
  ],
  'cjc-ipa-10mg': [
    {
      productSlug: 'cjc-ipa-10mg',
      batchNumber: 'Unknown',
      testingLab: 'Janoshik',
      labAccreditation: '',
      testDate: '2025-07-28',
      purityPercent: '',
      methodology: ['HPLC', 'Mass Spectrometry'],
      coaUrl: '/coa/flexmed-coas.pdf#page=12',
      inlinePreview: false,
      status: 'available',
    },
  ],
  'dsip-5mg': [
    {
      productSlug: 'dsip-5mg',
      batchNumber: 'PGB-DS5-2',
      testingLab: 'Janoshik',
      labAccreditation: '',
      testDate: '2026-01-15',
      purityPercent: '99.182% / 99.186%',
      methodology: ['HPLC', 'Mass Spectrometry'],
      coaUrl: '/coa/flexmed-coas.pdf#page=13',
      inlinePreview: false,
      status: 'available',
    },
  ],
  'epithalon-10mg': [
    {
      productSlug: 'epithalon-10mg',
      batchNumber: 'EPT10-112525',
      testingLab: 'Freedom Diagnostics',
      labAccreditation: '',
      testDate: '2025-11-30',
      purityPercent: '99.442%',
      methodology: ['HPLC-UV', 'Mass Spectrometry'],
      coaUrl: '/coa/flexmed-coas.pdf#page=14',
      inlinePreview: false,
      status: 'available',
    },
  ],
  'glow-50-10-10': [
    {
      productSlug: 'glow-50-10-10',
      batchNumber: 'Unknown',
      testingLab: 'Janoshik',
      labAccreditation: '',
      testDate: '2025-10-16',
      purityPercent: '',
      methodology: ['HPLC', 'Mass Spectrometry'],
      coaUrl: '/coa/flexmed-coas.pdf#page=16',
      inlinePreview: false,
      status: 'available',
    },
  ],
  'hgh36-36iu': [
    {
      productSlug: 'hgh36-36iu',
      batchNumber: '',
      testingLab: 'Analytical Formulations, Inc.',
      labAccreditation: '',
      testDate: '2026-02-09',
      purityPercent: '98.5%',
      methodology: ['UV/Vis Spectrophotometry'],
      coaUrl: '/coa/flexmed-coas.pdf#page=18',
      inlinePreview: false,
      status: 'available',
    },
  ],
  'mots-c-10mg': [
    {
      productSlug: 'mots-c-10mg',
      batchNumber: 'MC10-012026',
      testingLab: 'Freedom Diagnostics',
      labAccreditation: '',
      testDate: '2026-01-23',
      purityPercent: '99.493%',
      methodology: ['HPLC-UV', 'Mass Spectrometry'],
      coaUrl: '/coa/flexmed-coas.pdf#page=21',
      inlinePreview: false,
      status: 'available',
    },
  ],
  'mel-2-10mg': [
    {
      productSlug: 'mel-2-10mg',
      batchNumber: 'dqb2bff',
      testingLab: 'Finnrick / Krause Analytical',
      labAccreditation: '',
      testDate: '2026-02-01',
      purityPercent: '>99.9%',
      methodology: ['HPLC-UV-MS'],
      coaUrl: '/coa/flexmed-coas.pdf#page=22',
      inlinePreview: false,
      status: 'available',
    },
  ],
  'pe-22-28-wwb-10mg': [
    {
      productSlug: 'pe-22-28-wwb-10mg',
      batchNumber: '-EGB-WWB0825PE-10',
      testingLab: 'Janoshik',
      labAccreditation: '',
      testDate: '2025-09-09',
      purityPercent: '99.898% / 99.596%',
      methodology: ['HPLC', 'Mass Spectrometry'],
      coaUrl: '/coa/flexmed-coas.pdf#page=23',
      inlinePreview: false,
      status: 'available',
    },
  ],
  'pinealon-10mg': [
    {
      productSlug: 'pinealon-10mg',
      batchNumber: 'PGB-PIN-1',
      testingLab: 'Janoshik',
      labAccreditation: '',
      testDate: '2025-08-18',
      purityPercent: '99.764%',
      methodology: ['HPLC', 'Mass Spectrometry'],
      coaUrl: '/coa/flexmed-coas.pdf#page=24',
      inlinePreview: false,
      status: 'available',
    },
  ],
  'pnc-27-5mg': [
    {
      productSlug: 'pnc-27-5mg',
      batchNumber: 'LS-PNC252.7.2026',
      testingLab: 'Vanguard Laboratory',
      labAccreditation: 'A2LA Certificate #16377.01.01',
      testDate: '2026-02-20',
      purityPercent: '99.63% / 99.47% / 99.23%',
      methodology: ['HPLC-UV/VIS'],
      coaUrl: '/coa/flexmed-coas.pdf#page=25',
      inlinePreview: false,
      status: 'available',
    },
    {
      productSlug: 'pnc-27-5mg',
      batchNumber: 'LS-PNC252.7.2026',
      testingLab: 'Vanguard Laboratory',
      labAccreditation: 'A2LA Certificate #16377.01.01',
      testDate: '2026-02-20',
      purityPercent: '',
      methodology: ['ICP-MS', 'LAL', 'USP <61>'],
      coaUrl: '/coa/flexmed-coas.pdf#page=26',
      inlinePreview: false,
      status: 'available',
    },
  ],
  'pt-141-10mg': [
    {
      productSlug: 'pt-141-10mg',
      batchNumber: 'N/A',
      testingLab: 'Analytical Formulations, Inc.',
      labAccreditation: '',
      testDate: '2026-01-02',
      purityPercent: '',
      methodology: ['UV/Vis Spectrophotometry'],
      coaUrl: '/coa/flexmed-coas.pdf#page=27',
      inlinePreview: false,
      status: 'available',
    },
  ],
  'reta-20mg': [
    {
      productSlug: 'reta-20mg',
      batchNumber: '031326-RD',
      testingLab: 'Janoshik',
      labAccreditation: '',
      testDate: '2026-04-07',
      purityPercent: '99.598% / 99.624%',
      methodology: ['HPLC', 'Mass Spectrometry'],
      coaUrl: '/coa/flexmed-coas.pdf#page=28',
      inlinePreview: false,
      status: 'available',
    },
  ],
  'reta-30mg': [
    {
      productSlug: 'reta-30mg',
      batchNumber: 'N/A',
      testingLab: 'Analytical Formulations, Inc.',
      labAccreditation: '',
      testDate: '2026-02-10',
      purityPercent: '99.5%',
      methodology: ['UV/Vis Spectrophotometry'],
      coaUrl: '/coa/flexmed-coas.pdf#page=29',
      inlinePreview: false,
      status: 'available',
    },
    {
      productSlug: 'reta-30mg',
      batchNumber: '(Raether)',
      testingLab: 'Analytical Formulations, Inc.',
      labAccreditation: '',
      testDate: '2025-11-21',
      purityPercent: '99.6%',
      methodology: ['UV/Vis Spectrophotometry'],
      coaUrl: '/coa/flexmed-coas.pdf#page=30',
      inlinePreview: false,
      status: 'available',
    },
  ],
  'selank-10mg': [
    {
      productSlug: 'selank-10mg',
      batchNumber: 'PGB-NASEL-3',
      testingLab: 'Janoshik',
      labAccreditation: '',
      testDate: '2025-11-26',
      purityPercent: '99.554% / 99.557% / 99.543%',
      methodology: ['HPLC', 'Mass Spectrometry'],
      coaUrl: '/coa/flexmed-coas.pdf#page=31',
      inlinePreview: false,
      status: 'available',
    },
  ],
  'semax-10mg': [
    {
      productSlug: 'semax-10mg',
      batchNumber: 'PGB-SEM10-1',
      testingLab: 'Janoshik',
      labAccreditation: '',
      testDate: '2025-12-16',
      purityPercent: '99.384% / 99.301% / 99.332%',
      methodology: ['HPLC', 'Mass Spectrometry'],
      coaUrl: '/coa/flexmed-coas.pdf#page=32',
      inlinePreview: false,
      status: 'available',
    },
  ],
  'snap-8-10mg': [
    {
      productSlug: 'snap-8-10mg',
      batchNumber: 'N/A',
      testingLab: 'Analytical Formulations, Inc.',
      labAccreditation: '',
      testDate: '2026-01-20',
      purityPercent: '99.6%',
      methodology: ['UV/Vis Spectrophotometry'],
      coaUrl: '/coa/flexmed-coas.pdf#page=33',
      inlinePreview: false,
      status: 'available',
    },
  ],
  'ss-31-50mg': [
    {
      productSlug: 'ss-31-50mg',
      batchNumber: 'SS50-0118',
      testingLab: 'Janoshik',
      labAccreditation: '',
      testDate: '2026-01-26',
      purityPercent: '99.730%',
      methodology: ['HPLC', 'Mass Spectrometry'],
      coaUrl: '/coa/flexmed-coas.pdf#page=34',
      inlinePreview: false,
      status: 'available',
    },
  ],
  'tesamor-10mg': [
    {
      productSlug: 'tesamor-10mg',
      batchNumber: 'GX-TSMN10-W1326',
      testingLab: 'Janoshik',
      labAccreditation: '',
      testDate: '2026-04-09',
      purityPercent: '99.026%',
      methodology: ['HPLC', 'Mass Spectrometry'],
      coaUrl: '/coa/flexmed-coas.pdf#page=35',
      inlinePreview: false,
      status: 'available',
    },
  ],
  'thy-a1-10mg': [
    {
      productSlug: 'thy-a1-10mg',
      batchNumber: 'TA110-0114',
      testingLab: 'Janoshik',
      labAccreditation: '',
      testDate: '2026-01-20',
      purityPercent: '99.454%',
      methodology: ['HPLC', 'Mass Spectrometry'],
      coaUrl: '/coa/flexmed-coas.pdf#page=36',
      inlinePreview: false,
      status: 'available',
    },
    {
      productSlug: 'thy-a1-10mg',
      batchNumber: 'JBTA1012162025',
      testingLab: 'Analytical Formulations, Inc.',
      labAccreditation: '',
      testDate: '2026-02-04',
      purityPercent: '99.6% / 99.5%',
      methodology: ['UV/Vis Spectrophotometry'],
      coaUrl: '/coa/flexmed-coas.pdf#page=37',
      inlinePreview: false,
      status: 'available',
    },
  ],
  'tirz-20mg': [
    {
      productSlug: 'tirz-20mg',
      batchNumber: '005000039215930',
      testingLab: 'B Labs',
      labAccreditation: '',
      testDate: '2026-03-11',
      purityPercent: '',
      methodology: ['FTIR', 'HPLC'],
      coaUrl: '/coa/flexmed-coas.pdf#page=38',
      inlinePreview: false,
      status: 'available',
    },
  ],
  'tirz-30mg': [
    {
      productSlug: 'tirz-30mg',
      batchNumber: 'M3POS01-1J',
      testingLab: 'Janoshik',
      labAccreditation: '',
      testDate: '2026-02-02',
      purityPercent: '99.899%',
      methodology: ['HPLC', 'Mass Spectrometry'],
      coaUrl: '/coa/flexmed-coas.pdf#page=39',
      inlinePreview: false,
      status: 'available',
    },
    {
      productSlug: 'tirz-30mg',
      batchNumber: 'ZE30-0304',
      testingLab: 'Janoshik',
      labAccreditation: '',
      testDate: '2026-03-18',
      purityPercent: '99.825%',
      methodology: ['HPLC', 'Mass Spectrometry'],
      coaUrl: '/coa/flexmed-coas.pdf#page=41',
      inlinePreview: false,
      status: 'available',
    },
  ],
  'tirz-15mg': [
    {
      productSlug: 'tirz-15mg',
      batchNumber: 'SPL-3163',
      testingLab: 'Peptide Test / TrustPointe',
      labAccreditation: '',
      testDate: '2026-02-27',
      purityPercent: '99.242% / 99.822%',
      methodology: ['TM-1001 Assay', 'Purity', 'Spectral ID'],
      coaUrl: '/coa/flexmed-coas.pdf#page=40',
      inlinePreview: false,
      status: 'available',
    },
  ],
  'vesugen-20mg': [
    {
      productSlug: 'vesugen-20mg',
      batchNumber: 'GX-VSGN20-U1326',
      testingLab: 'Analytical Formulations, Inc.',
      labAccreditation: '',
      testDate: '2026-03-20',
      purityPercent: '99.9%',
      methodology: ['UV/Vis Spectrophotometry'],
      coaUrl: '/coa/flexmed-coas.pdf#page=42',
      inlinePreview: false,
      status: 'available',
    },
    {
      productSlug: 'vesugen-20mg',
      batchNumber: 'GX-VSGN20-U1326',
      testingLab: 'Analytical Formulations, Inc.',
      labAccreditation: '',
      testDate: '2026-03-20',
      purityPercent: '99.9%',
      methodology: ['UV/Vis Spectrophotometry'],
      coaUrl: '/coa/flexmed-coas.pdf#page=43',
      inlinePreview: false,
      status: 'available',
    },
  ],
}

// ─── Helpers ─────────────────────────────────────────────────
export function getTestingRecordsForProduct(slug: string): TestingRecord[] {
  return TESTING_RECORDS[slug] ?? []
}

export function hasPublishedCoA(slug: string): boolean {
  const records = getTestingRecordsForProduct(slug)
  return records.some(
    (r) => r.status === 'available' && r.coaUrl && !r.coaUrl.startsWith('[')
  )
}

export function getPrimaryPublishedCoAUrl(slug: string): string | null {
  const record = getTestingRecordsForProduct(slug).find(
    (r) => r.status === 'available' && r.coaUrl && !r.coaUrl.startsWith('[')
  )
  return record?.coaUrl ?? null
}

export function getPrimaryPublishedCoAPage(slug: string): number | null {
  const url = getPrimaryPublishedCoAUrl(slug)
  if (!url) return null
  const match = url.match(/#page=(\d+)/i)
  return match ? Number(match[1]) : null
}

export function getProductCoALink(product: { slug: string; coaUrl?: string | null }): string | null {
  if (product.coaUrl && !product.coaUrl.startsWith('[')) {
    if (product.coaUrl.startsWith('/api/catalog-assets/coa/') || product.coaUrl.startsWith('/coa/')) {
      return `/coa/${product.slug}`
    }
    return product.coaUrl
  }
  return hasPublishedCoA(product.slug) ? `/coa/${product.slug}` : null
}
