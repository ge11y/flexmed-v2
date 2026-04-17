// ============================================================
// FlexMed v2 — Products Data
// Centralized product catalog — all product data lives here
// ============================================================

import type { Product } from './types'

// ─── Image Asset Mapping ──────────────────────────────────────
// Maps product slugs to their source files from the FLEXMED
// asset folder. 'front' is required for the catalog card and
// product detail hero. 'side' is optional alternate angle.
// 'hoverSpinFrames' can be added later without refactoring.
// ──────────────────────────────────────────────────────────────

export const PRODUCT_IMAGES: Record<string, { front: string; side?: string; hoverSpinFrames?: string[] }> = {
  'cagri-5mg':         { front: '/products/cagri-5mg/front.png' },
  'cjc-ipa-10mg':      { front: '/products/cjc-ipa-10mg/front.png' },
  'dsip-5mg':          { front: '/products/dsip-5mg/front.png' },
  'epithalon-10mg':    { front: '/products/epithalon-10mg/front.png', side: '/products/epithalon-10mg/side.png' },
  'glutathione-600':   { front: '/products/glutathione-600/front.png' },
  'glutathione-1200':  { front: '/products/glutathione-1200/front.png' },
  'kpv-10mg':          { front: '/products/kpv-10mg/front.png' },
  'mots-c-40mg':       { front: '/products/mots-c-40mg/front.png' },
  'nad-plus-500':       { front: '/products/nad-plus-500/front.png', side: '/products/nad-plus-500/side.png' },
  'pnc-27-5mg':        { front: '/products/pnc-27-5mg/front.png' },
  'pt-141-10mg':       { front: '/products/pt-141-10mg/front.png' },
  'snap-8-10mg':      { front: '/products/snap-8-10mg/front.png', side: '/products/snap-8-10mg/side.png' },
  'ss-31-50mg':        { front: '/products/ss-31-50mg/front.png' },
  'thy-a1-10mg':       { front: '/products/thy-a1-10mg/front.png' },
  'tirz-15mg':         { front: '/products/tirz-15mg/front.png' },
  'tirz-30mg':         { front: '/products/tirz-30mg/front.png', side: '/products/tirz-30mg/side.png' },
}

export const PRODUCTS: Record<string, Product> = {

  // ─── CONFIRMED — BUILD NOW ───────────────────────────────────

  'cjc-ipa-10mg': {
    slug: 'cjc-ipa-10mg',
    displayName: 'CJC/Ipa 10mg',
    fullName: 'CJC-1295 + Ipamorelin',
    alias: 'CJC/Ipa',
    category: 'Growth Hormone Research',
    researchCategory: 'Growth Hormone / GHRP Stack',
    structureType: 'Synthetic peptide combination',
    strength: 10,
    unit: 'mg',
    formatType: 'vial',
    status: 'in_stock',
    coaStatus: 'pending',
    coaUrl: '',
    verificationUrl: '',
    batchNumber: 'FM-CJC-IPA-001',
    testingLab: '[TESTING LAB REQUIRED]',
    purityPercent: '[PURITY REQUIRED]',
    summaryShort: 'Synthetic peptide combination commonly grouped in growth hormone research.',
    summaryFull:
      'CJC-1295 (No-DAC) combined with Ipamorelin is generally classified in growth hormone and GHRP research catalogs. This page is intended for cataloging and research-reference purposes only.',
    features: [
      'Standardized label format',
      'Research-first presentation',
      'COA-linked workflow',
    ],
    accentColor: 'cool cyan-blue',
    accentColorHex: '#6B9FBF',
    image: '/products/cjc-ipa-10mg/front.png',
    hoverSpinFrames: [],
    publishStatus: 'confirmed',
    needsFounderConfirmation: false,
  },

  'cagri-5mg': {
    slug: 'cagri-5mg',
    displayName: 'CAGRI 5mg',
    fullName: 'Cagrilintide',
    alias: 'CAGRI',
    category: 'Metabolic Research',
    researchCategory: 'Amylin receptor research',
    structureType: 'Synthetic peptide analog',
    strength: 5,
    unit: 'mg',
    formatType: 'vial',
    status: 'in_stock',
    coaStatus: 'pending',
    coaUrl: '',
    verificationUrl: '',
    batchNumber: 'FM-CAG-001',
    testingLab: '[TESTING LAB REQUIRED]',
    purityPercent: '[PURITY REQUIRED]',
    summaryShort: 'Synthetic peptide analog commonly grouped in amylin receptor and metabolic research.',
    summaryFull:
      'Cagrilintide is generally classified in metabolic and amylin receptor research catalogs. This page is intended for cataloging and research-reference purposes only.',
    features: [
      'Standardized label format',
      'Research-first presentation',
      'COA-linked workflow',
    ],
    accentColor: 'warm amber',
    accentColorHex: '#C4976A',
    image: '/products/cagri-5mg/front.png',
    hoverSpinFrames: [],
    publishStatus: 'confirmed',
    needsFounderConfirmation: false,
  },

  'dsip-5mg': {
    slug: 'dsip-5mg',
    displayName: 'DSIP 5mg',
    fullName: 'Delta Sleep-Inducing Peptide',
    alias: 'DSIP',
    category: 'Neuropeptide Research',
    researchCategory: 'Sleep and circadian rhythm research',
    structureType: 'Nonapeptide',
    strength: 5,
    unit: 'mg',
    formatType: 'vial',
    status: 'in_stock',
    coaStatus: 'pending',
    coaUrl: '',
    verificationUrl: '',
    batchNumber: 'FM-DSP-001',
    testingLab: '[TESTING LAB REQUIRED]',
    purityPercent: '[PURITY REQUIRED]',
    summaryShort: 'Nonapeptide commonly grouped in sleep and circadian rhythm research.',
    summaryFull:
      'Delta Sleep-Inducing Peptide (DSIP) is generally classified in neuropeptide and sleep-related research catalogs. This page is intended for cataloging and research-reference purposes only.',
    features: [
      'Standardized label format',
      'Research-first presentation',
      'COA-linked workflow',
    ],
    accentColor: 'soft indigo',
    accentColorHex: '#8B8FC7',
    image: '/products/dsip-5mg/front.png',
    hoverSpinFrames: [],
    publishStatus: 'confirmed',
    needsFounderConfirmation: false,
  },

  'epithalon-10mg': {
    slug: 'epithalon-10mg',
    displayName: 'Epithalon 10mg',
    fullName: 'Epithalon',
    alias: 'Epithalon',
    category: 'Telomere Research',
    researchCategory: 'Telomere biology and cellular aging research',
    structureType: 'Tetrapeptide',
    strength: 10,
    unit: 'mg',
    formatType: 'vial',
    status: 'in_stock',
    coaStatus: 'pending',
    coaUrl: '',
    verificationUrl: '',
    batchNumber: 'FM-EPT-001',
    testingLab: '[TESTING LAB REQUIRED]',
    purityPercent: '[PURITY REQUIRED]',
    summaryShort: 'Tetrapeptide commonly grouped in telomere biology and cellular aging research.',
    summaryFull:
      'Epithalon is generally classified in telomere biology and anti-aging research catalogs. This page is intended for cataloging and research-reference purposes only.',
    features: [
      'Standardized label format',
      'Research-first presentation',
      'COA-linked workflow',
    ],
    accentColor: 'muted silver',
    accentColorHex: '#9EAAB4',
    image: '/products/epithalon-10mg/front.png',
    hoverSpinFrames: [],
    publishStatus: 'confirmed',
    needsFounderConfirmation: false,
  },

  'glutathione-600': {
    slug: 'glutathione-600',
    displayName: 'Glutathione 600mg',
    fullName: 'Glutathione',
    alias: 'GSH',
    category: 'Antioxidant Research',
    researchCategory: 'Cellular antioxidant defense research',
    structureType: 'Tripeptide',
    strength: 600,
    unit: 'mg',
    formatType: 'vial',
    status: 'in_stock',
    coaStatus: 'pending',
    coaUrl: '',
    verificationUrl: '',
    batchNumber: 'FM-GSH-600-001',
    testingLab: '[TESTING LAB REQUIRED]',
    purityPercent: '[PURITY REQUIRED]',
    summaryShort: 'Tripeptide commonly grouped in cellular antioxidant defense research.',
    summaryFull:
      'Glutathione (GSH) is generally classified in antioxidant and redox biology research catalogs. This page is intended for cataloging and research-reference purposes only.',
    features: [
      'Standardized label format',
      'Research-first presentation',
      'COA-linked workflow',
    ],
    accentColor: 'sage green',
    accentColorHex: '#7A9E7E',
    image: '/products/glutathione-600/front.png',
    hoverSpinFrames: [],
    publishStatus: 'confirmed',
    needsFounderConfirmation: false,
  },

  'glutathione-1200': {
    slug: 'glutathione-1200',
    displayName: 'Glutathione 1200mg',
    fullName: 'Glutathione',
    alias: 'GSH',
    category: 'Antioxidant Research',
    researchCategory: 'Cellular antioxidant defense research',
    structureType: 'Tripeptide',
    strength: 1200,
    unit: 'mg',
    formatType: 'vial',
    status: 'in_stock',
    coaStatus: 'pending',
    coaUrl: '',
    verificationUrl: '',
    batchNumber: 'FM-GSH-1200-001',
    testingLab: '[TESTING LAB REQUIRED]',
    purityPercent: '[PURITY REQUIRED]',
    summaryShort: 'Tripeptide commonly grouped in cellular antioxidant defense research.',
    summaryFull:
      'Glutathione (GSH) is generally classified in antioxidant and redox biology research catalogs. This page is intended for cataloging and research-reference purposes only.',
    features: [
      'Standardized label format',
      'Research-first presentation',
      'COA-linked workflow',
    ],
    accentColor: 'sage green',
    accentColorHex: '#7A9E7E',
    image: '/products/glutathione-1200/front.png',
    hoverSpinFrames: [],
    publishStatus: 'confirmed',
    needsFounderConfirmation: false,
  },

  'kpv-10mg': {
    slug: 'kpv-10mg',
    displayName: 'KPV 10mg',
    fullName: 'Lysine-Proline-Valine',
    alias: 'KPV',
    category: 'Inflammatory Research',
    researchCategory: 'Anti-inflammatory peptide research',
    structureType: 'Tripeptide',
    strength: 10,
    unit: 'mg',
    formatType: 'vial',
    status: 'in_stock',
    coaStatus: 'pending',
    coaUrl: '',
    verificationUrl: '',
    batchNumber: 'FM-KPV-001',
    testingLab: '[TESTING LAB REQUIRED]',
    purityPercent: '[PURITY REQUIRED]',
    summaryShort: 'Tripeptide commonly grouped in anti-inflammatory peptide research.',
    summaryFull:
      'KPV (Lysine-Proline-Valine) is generally classified in inflammatory and dermatological research catalogs. This page is intended for cataloging and research-reference purposes only.',
    features: [
      'Standardized label format',
      'Research-first presentation',
      'COA-linked workflow',
    ],
    accentColor: 'cool slate',
    accentColorHex: '#7A8FA0',
    image: '/products/kpv-10mg/front.png',
    hoverSpinFrames: [],
    publishStatus: 'confirmed',
    needsFounderConfirmation: false,
  },

  'mots-c-40mg': {
    slug: 'mots-c-40mg',
    displayName: 'MOTS-C 40mg',
    fullName: 'MOTS-C',
    alias: 'MOTS-C',
    category: 'Mitochondrial Research',
    researchCategory: 'Mitochondrial peptide and metabolic research',
    structureType: 'Mitochondrial-encoded peptide',
    strength: 40,
    unit: 'mg',
    formatType: 'vial',
    status: 'in_stock',
    coaStatus: 'pending',
    coaUrl: '',
    verificationUrl: '',
    batchNumber: 'FM-MTC-001',
    testingLab: '[TESTING LAB REQUIRED]',
    purityPercent: '[PURITY REQUIRED]',
    summaryShort: 'Mitochondrial-encoded peptide commonly grouped in metabolic and mitochondrial research.',
    summaryFull:
      'MOTS-C is generally classified in mitochondrial biology and metabolic research catalogs. This page is intended for cataloging and research-reference purposes only.',
    features: [
      'Standardized label format',
      'Research-first presentation',
      'COA-linked workflow',
    ],
    accentColor: 'deep teal',
    accentColorHex: '#4A7A7A',
    image: '/products/mots-c-40mg/front.png',
    hoverSpinFrames: [],
    publishStatus: 'confirmed',
    needsFounderConfirmation: false,
  },

  'nad-plus-500': {
    slug: 'nad-plus-500',
    displayName: 'NAD+ 500mg',
    fullName: 'Nicotinamide Adenine Dinucleotide',
    alias: 'NAD+',
    category: 'Cellular Health Research',
    researchCategory: 'NAD+ biosynthetic and cellular health research',
    structureType: 'Dinucleotide',
    strength: 500,
    unit: 'mg',
    formatType: 'vial',
    status: 'in_stock',
    coaStatus: 'pending',
    coaUrl: '',
    verificationUrl: '',
    batchNumber: 'FM-NAD-500-001',
    testingLab: '[TESTING LAB REQUIRED]',
    purityPercent: '[PURITY REQUIRED]',
    summaryShort: 'Dinucleotide commonly grouped in NAD+ biosynthetic and cellular health research.',
    summaryFull:
      'Nicotinamide Adenine Dinucleotide (NAD+) is generally classified in cellular health, metabolism, and sirtuin biology research catalogs. This page is intended for cataloging and research-reference purposes only.',
    features: [
      'Standardized label format',
      'Research-first presentation',
      'COA-linked workflow',
    ],
    accentColor: 'warm ivory',
    accentColorHex: '#C4B89A',
    image: '/products/nad-plus-500/front.png',
    hoverSpinFrames: [],
    publishStatus: 'confirmed',
    needsFounderConfirmation: false,
  },

  'pnc-27-5mg': {
    slug: 'pnc-27-5mg',
    displayName: 'PNC-27 5mg',
    fullName: 'PNC-27',
    alias: 'PNC-27',
    category: 'Cell Cycle Research',
    researchCategory: 'Cell cycle and proliferative research',
    structureType: 'Helical peptide',
    strength: 5,
    unit: 'mg',
    formatType: 'vial',
    status: 'in_stock',
    coaStatus: 'pending',
    coaUrl: '',
    verificationUrl: '',
    batchNumber: 'FM-PNC-001',
    testingLab: '[TESTING LAB REQUIRED]',
    purityPercent: '[PURITY REQUIRED]',
    summaryShort: 'Helical peptide commonly grouped in cell cycle and proliferative research.',
    summaryFull:
      'PNC-27 is generally classified in cell cycle, oncology, and proliferative research catalogs. This page is intended for cataloging and research-reference purposes only.',
    features: [
      'Standardized label format',
      'Research-first presentation',
      'COA-linked workflow',
    ],
    accentColor: 'rose taupe',
    accentColorHex: '#B08080',
    image: '/products/pnc-27-5mg/front.png',
    hoverSpinFrames: [],
    publishStatus: 'confirmed',
    needsFounderConfirmation: false,
  },

  'pt-141-10mg': {
    slug: 'pt-141-10mg',
    displayName: 'PT-141 10mg',
    fullName: 'PT-141 (Bremelanotide)',
    alias: 'PT-141',
    category: 'Neuropeptide Research',
    researchCategory: 'Melanocortin receptor research',
    structureType: 'Cyclic heptapeptide',
    strength: 10,
    unit: 'mg',
    formatType: 'vial',
    status: 'in_stock',
    coaStatus: 'pending',
    coaUrl: '',
    verificationUrl: '',
    batchNumber: 'FM-PT-001',
    testingLab: '[TESTING LAB REQUIRED]',
    purityPercent: '[PURITY REQUIRED]',
    summaryShort: 'Cyclic heptapeptide commonly grouped in melanocortin receptor research.',
    summaryFull:
      'PT-141 (Bremelanotide) is generally classified in melanocortin and neuropeptide research catalogs. This page is intended for cataloging and research-reference purposes only.',
    features: [
      'Standardized label format',
      'Research-first presentation',
      'COA-linked workflow',
    ],
    accentColor: 'deep burgundy',
    accentColorHex: '#8B4A5A',
    image: '/products/pt-141-10mg/front.png',
    hoverSpinFrames: [],
    publishStatus: 'confirmed',
    needsFounderConfirmation: false,
  },

  'snap-8-10mg': {
    slug: 'snap-8-10mg',
    displayName: 'SNAP-8 10mg',
    fullName: 'SNAP-8',
    alias: 'SNAP-8',
    category: 'Dermatological Research',
    researchCategory: 'Neuropeptide and skin barrier research',
    structureType: 'Octapeptide',
    strength: 10,
    unit: 'mg',
    formatType: 'vial',
    status: 'in_stock',
    coaStatus: 'pending',
    coaUrl: '',
    verificationUrl: '',
    batchNumber: 'FM-SNP-001',
    testingLab: '[TESTING LAB REQUIRED]',
    purityPercent: '[PURITY REQUIRED]',
    summaryShort: 'Octapeptide commonly grouped in dermatological and skin barrier research.',
    summaryFull:
      'SNAP-8 is generally classified in dermatological and skin barrier research catalogs. This page is intended for cataloging and research-reference purposes only.',
    features: [
      'Standardized label format',
      'Research-first presentation',
      'COA-linked workflow',
    ],
    accentColor: 'soft lavender',
    accentColorHex: '#9A8FC4',
    image: '/products/snap-8-10mg/front.png',
    hoverSpinFrames: [],
    publishStatus: 'confirmed',
    needsFounderConfirmation: false,
  },

  'ss-31-50mg': {
    slug: 'ss-31-50mg',
    displayName: 'SS-31 50mg',
    fullName: 'SS-31 (Elamipretide)',
    alias: 'SS-31',
    category: 'Mitochondrial Research',
    researchCategory: 'Mitochondrial targeting and cardiac research',
    structureType: 'Short cationic peptide',
    strength: 50,
    unit: 'mg',
    formatType: 'vial',
    status: 'in_stock',
    coaStatus: 'pending',
    coaUrl: '',
    verificationUrl: '',
    batchNumber: 'FM-SS31-001',
    testingLab: '[TESTING LAB REQUIRED]',
    purityPercent: '[PURITY REQUIRED]',
    summaryShort: 'Short cationic peptide commonly grouped in mitochondrial targeting research.',
    summaryFull:
      'SS-31 (Elamipretide) is generally classified in mitochondrial targeting, cardiac, and neurodegenerative research catalogs. This page is intended for cataloging and research-reference purposes only.',
    features: [
      'Standardized label format',
      'Research-first presentation',
      'COA-linked workflow',
    ],
    accentColor: 'forest teal',
    accentColorHex: '#3A6A6A',
    image: '/products/ss-31-50mg/front.png',
    hoverSpinFrames: [],
    publishStatus: 'confirmed',
    needsFounderConfirmation: false,
  },

  'thy-a1-10mg': {
    slug: 'thy-a1-10mg',
    displayName: 'THY-A1 10mg',
    fullName: 'Thymosin Alpha-1',
    alias: 'THY-A1',
    category: 'Immunomodulation Research',
    researchCategory: 'Immune modulation and thymic peptide research',
    structureType: 'Polypeptide',
    strength: 10,
    unit: 'mg',
    formatType: 'vial',
    status: 'in_stock',
    coaStatus: 'pending',
    coaUrl: '',
    verificationUrl: '',
    batchNumber: 'FM-THA-001',
    testingLab: '[TESTING LAB REQUIRED]',
    purityPercent: '[PURITY REQUIRED]',
    summaryShort: 'Polypeptide commonly grouped in immune modulation and thymic peptide research.',
    summaryFull:
      'Thymosin Alpha-1 (THY-A1) is generally classified in immunomodulation and thymic biology research catalogs. This page is intended for cataloging and research-reference purposes only.',
    features: [
      'Standardized label format',
      'Research-first presentation',
      'COA-linked workflow',
    ],
    accentColor: 'pearl white',
    accentColorHex: '#C8C4BC',
    image: '/products/thy-a1-10mg/front.png',
    hoverSpinFrames: [],
    publishStatus: 'confirmed',
    needsFounderConfirmation: false,
  },

  'tirz-15mg': {
    slug: 'tirz-15mg',
    displayName: 'TIRZ 15mg',
    fullName: 'Tirzepatide',
    alias: 'TIRZ',
    category: 'Metabolic Research',
    researchCategory: 'Dual incretin receptor research',
    structureType: 'Synthetic peptide analog',
    strength: 15,
    unit: 'mg',
    formatType: 'vial',
    status: 'in_stock',
    coaStatus: 'pending',
    coaUrl: '',
    verificationUrl: '',
    batchNumber: 'FM-TZ-1501',
    testingLab: '[TESTING LAB REQUIRED]',
    purityPercent: '[PURITY REQUIRED]',
    summaryShort: 'Synthetic peptide analog commonly grouped in dual incretin receptor research.',
    summaryFull:
      'Tirzepatide is generally classified in metabolic and incretin receptor research catalogs. This page is intended for cataloging and research-reference purposes only.',
    features: [
      'Standardized label format',
      'Research-first presentation',
      'COA-linked workflow',
    ],
    accentColor: 'cool cyan-blue',
    accentColorHex: '#4A8FC4',
    image: '/products/tirz-15mg/front.png',
    hoverSpinFrames: [],
    publishStatus: 'confirmed',
    needsFounderConfirmation: false,
  },

  'tirz-30mg': {
    slug: 'tirz-30mg',
    displayName: 'TIRZ 30mg',
    fullName: 'Tirzepatide',
    alias: 'TIRZ',
    category: 'Metabolic Research',
    researchCategory: 'Dual incretin receptor research',
    structureType: 'Synthetic peptide analog',
    strength: 30,
    unit: 'mg',
    formatType: 'vial',
    status: 'in_stock',
    coaStatus: 'pending',
    coaUrl: '',
    verificationUrl: '',
    batchNumber: 'FM-TZ-3001',
    testingLab: '[TESTING LAB REQUIRED]',
    purityPercent: '[PURITY REQUIRED]',
    summaryShort: 'Synthetic peptide analog commonly grouped in dual incretin receptor research.',
    summaryFull:
      'Tirzepatide is generally classified in metabolic and incretin receptor research catalogs. This page is intended for cataloging and research-reference purposes only.',
    features: [
      'Standardized label format',
      'Research-first presentation',
      'COA-linked workflow',
    ],
    accentColor: 'cool cyan-blue',
    accentColorHex: '#4A8FC4',
    image: '/products/tirz-30mg/front.png',
    hoverSpinFrames: [],
    publishStatus: 'confirmed',
    needsFounderConfirmation: false,
  },

  // ─── NEEDS FOUNDER CONFIRMATION ──────────────────────────────
  // Shown in catalog with "Pending Confirmation" badge.
  // Do not publish until founder approves labeling.

  'aodc-5mg': {
    slug: 'aodc-5mg',
    displayName: 'AODC 5mg',
    fullName: 'AOD-9604',
    alias: 'AODC',
    category: 'Metabolic Research',
    researchCategory: 'Lipid metabolism and adipocyte research',
    structureType: 'Synthetic peptide fragment',
    strength: 5,
    unit: 'mg',
    formatType: 'vial',
    status: 'in_stock',
    coaStatus: 'pending',
    coaUrl: '',
    verificationUrl: '',
    batchNumber: '',
    testingLab: '',
    purityPercent: '',
    summaryShort: 'Synthetic peptide fragment commonly grouped in lipid metabolism research.',
    summaryFull:
      'AOD-9604 is generally classified in metabolic and lipid research catalogs. This page is intended for cataloging and research-reference purposes only.',
    features: ['Standardized label format', 'Research-first presentation'],
    accentColor: 'warm sand',
    accentColorHex: '#C4A882',
    image: '/products/aodc-5mg/front.png',
    hoverSpinFrames: [],
    publishStatus: 'needs_confirmation',
    needsFounderConfirmation: true,
    notes: 'Awaiting founder confirmation before public labeling.',
  },

  'mel-2-10mg': {
    slug: 'mel-2-10mg',
    displayName: 'MEL-2 10mg',
    fullName: 'Melanotan II',
    alias: 'MT-II',
    category: 'Pigmentation Research',
    researchCategory: 'Melanocortin and pigmentation research',
    structureType: 'Cyclic heptapeptide',
    strength: 10,
    unit: 'mg',
    formatType: 'vial',
    status: 'in_stock',
    coaStatus: 'pending',
    coaUrl: '',
    verificationUrl: '',
    batchNumber: '',
    testingLab: '',
    purityPercent: '',
    summaryShort: 'Cyclic heptapeptide commonly grouped in melanocortin receptor research.',
    summaryFull:
      'Melanotan II (MT-II) is generally classified in melanocortin and pigmentation research catalogs. This page is intended for cataloging and research-reference purposes only.',
    features: ['Standardized label format', 'Research-first presentation'],
    accentColor: 'deep umber',
    accentColorHex: '#7A5030',
    image: '/products/mel-2-10mg/front.png',
    hoverSpinFrames: [],
    publishStatus: 'needs_confirmation',
    needsFounderConfirmation: true,
    notes: 'Awaiting founder confirmation before public labeling.',
  },

  'pe-22-28-wwb-10mg': {
    slug: 'pe-22-28-wwb-10mg',
    displayName: 'PE 22-28 WWB 10mg',
    fullName: 'PE-22-28 (W蝴蝶 Winged Belt)',
    alias: 'PE-22-28',
    category: 'Neuropeptide Research',
    researchCategory: 'Neuronal and neuropeptide receptor research',
    structureType: 'Oligopeptide',
    strength: 10,
    unit: 'mg',
    formatType: 'vial',
    status: 'in_stock',
    coaStatus: 'pending',
    coaUrl: '',
    verificationUrl: '',
    batchNumber: '',
    testingLab: '',
    purityPercent: '',
    summaryShort: 'Oligopeptide commonly grouped in neuropeptide receptor research.',
    summaryFull:
      'PE-22-28 is generally classified in neuronal and neuropeptide receptor research catalogs. This page is intended for cataloging and research-reference purposes only.',
    features: ['Standardized label format', 'Research-first presentation'],
    accentColor: 'muted violet',
    accentColorHex: '#7A6A9A',
    image: '/products/pe-22-28-wwb-10mg/front.png',
    hoverSpinFrames: [],
    publishStatus: 'needs_confirmation',
    needsFounderConfirmation: true,
    notes: 'Awaiting founder confirmation before public labeling.',
  },

  'reta-20mg': {
    slug: 'reta-20mg',
    displayName: 'RETA 20mg',
    fullName: 'Retatrutide',
    alias: 'RETA',
    category: 'Metabolic Research',
    researchCategory: 'GLP-1 / GIP / glucagon receptor research',
    structureType: 'Synthetic peptide analog',
    strength: 20,
    unit: 'mg',
    formatType: 'vial',
    status: 'in_stock',
    coaStatus: 'pending',
    coaUrl: '',
    verificationUrl: '',
    batchNumber: '',
    testingLab: '',
    purityPercent: '',
    summaryShort: 'Synthetic peptide analog commonly grouped in GLP-1 / GIP / glucagon receptor research.',
    summaryFull:
      'Retatrutide is generally classified in metabolic and multi-receptor agonist research catalogs. This page is intended for cataloging and research-reference purposes only.',
    features: ['Standardized label format', 'Research-first presentation'],
    accentColor: 'cool slate blue',
    accentColorHex: '#5A7A9A',
    image: '/products/reta-20mg/front.png',
    hoverSpinFrames: [],
    publishStatus: 'needs_confirmation',
    needsFounderConfirmation: true,
    notes: 'Awaiting founder confirmation before public labeling.',
  },

  'reta-30mg': {
    slug: 'reta-30mg',
    displayName: 'RETA 30mg',
    fullName: 'Retatrutide',
    alias: 'RETA',
    category: 'Metabolic Research',
    researchCategory: 'GLP-1 / GIP / glucagon receptor research',
    structureType: 'Synthetic peptide analog',
    strength: 30,
    unit: 'mg',
    formatType: 'vial',
    status: 'in_stock',
    coaStatus: 'pending',
    coaUrl: '',
    verificationUrl: '',
    batchNumber: '',
    testingLab: '',
    purityPercent: '',
    summaryShort: 'Synthetic peptide analog commonly grouped in GLP-1 / GIP / glucagon receptor research.',
    summaryFull:
      'Retatrutide is generally classified in metabolic and multi-receptor agonist research catalogs. This page is intended for cataloging and research-reference purposes only.',
    features: ['Standardized label format', 'Research-first presentation'],
    accentColor: 'cool slate blue',
    accentColorHex: '#5A7A9A',
    image: '/products/reta-30mg/front.png',
    hoverSpinFrames: [],
    publishStatus: 'needs_confirmation',
    needsFounderConfirmation: true,
    notes: 'Awaiting founder confirmation before public labeling.',
  },

  // ─── ON HOLD — DO NOT BUILD ─────────────────────────────────
  // Not included in PRODUCTS record.
  // HGH36 UTH, SLU-PP-5, WOLVERINE-20 are on hold pending clarification.
}

export const PRODUCT_CATEGORIES = [
  'All',
  'Growth Hormone Research',
  'Metabolic Research',
  'Mitochondrial Research',
  'Neuropeptide Research',
  'Antioxidant Research',
  'Dermatological Research',
  'Immunomodulation Research',
  'Telomere Research',
  'Cellular Health Research',
  'Cell Cycle Research',
  'Inflammatory Research',
  'Pigmentation Research',
]

export const CONFIRMED_SLUGS = [
  'cjc-ipa-10mg',
  'cagri-5mg',
  'dsip-5mg',
  'epithalon-10mg',
  'glutathione-600',
  'glutathione-1200',
  'kpv-10mg',
  'mots-c-40mg',
  'nad-plus-500',
  'pnc-27-5mg',
  'pt-141-10mg',
  'snap-8-10mg',
  'ss-31-50mg',
  'thy-a1-10mg',
  'tirz-15mg',
  'tirz-30mg',
]

export const NEEDS_CONFIRMATION_SLUGS = [
  'aodc-5mg',
  'mel-2-10mg',
  'pe-22-28-wwb-10mg',
  'reta-20mg',
  'reta-30mg',
]

export const ALL_PRODUCT_SLUGS = [...CONFIRMED_SLUGS, ...NEEDS_CONFIRMATION_SLUGS]

export function getProductsByCategory(category: string): Product[] {
  const all = Object.values(PRODUCTS).filter((p) => p.publishStatus !== 'on_hold' && p.publishStatus !== 'needs_confirmation')
  if (category === 'All') return all
  return all.filter((p) => p.category === category)
}

export function getAllPublicProducts(): Product[] {
  return Object.values(PRODUCTS).filter((p) => p.publishStatus !== 'on_hold' && p.publishStatus !== 'needs_confirmation')
}

export function getPendingConfirmationProducts(): Product[] {
  return Object.values(PRODUCTS).filter((p) => p.publishStatus === 'needs_confirmation')
}

export function getAdminCatalogProducts(): Product[] {
  // Admin view: includes confirmed + needs_confirmation, excludes only on_hold
  return Object.values(PRODUCTS).filter((p) => p.publishStatus !== 'on_hold')
}

export function getProductBySlug(slug: string): Product | undefined {
  return PRODUCTS[slug]
}

export function getConfirmedProducts(): Product[] {
  return Object.values(PRODUCTS).filter((p) => p.publishStatus === 'confirmed')
}

export function getFeaturedProducts(): Product[] {
  return CONFIRMED_SLUGS.slice(0, 6).map((s) => PRODUCTS[s]).filter(Boolean)
}

// ─── Image Resolution ──────────────────────────────────────────
// Centralized image resolution for all product imagery.
// Uses PRODUCT_IMAGES map as the source of truth for file paths.
// Falls back to product.image for any products not yet in the map.
// hoverSpinFrames come from PRODUCT_IMAGES — add to that map to enable.
// ──────────────────────────────────────────────────────────────

export function getProductImageSrc(product: Product): string {
  if (PRODUCT_IMAGES[product.slug]?.front) {
    return PRODUCT_IMAGES[product.slug].front
  }
  return product.image || ''
}

export function getProductSideSrc(product: Product): string {
  return PRODUCT_IMAGES[product.slug]?.side || ''
}

export function getProductHoverSpinFrames(product: Product): string[] {
  return PRODUCT_IMAGES[product.slug]?.hoverSpinFrames ?? []
}
