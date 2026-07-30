import type { Product } from './types'

function lowercaseFirst(value: string): string {
  return value ? value.charAt(0).toLowerCase() + value.slice(1) : value
}

function titleCaseWords(value: string): string {
  return value
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function formatStrengthLabel(product: Pick<Product, 'strength' | 'unit'> & { variantLabel?: string }) {
  const rawVariantLabel = product.variantLabel?.trim()
  if (rawVariantLabel) {
    return rawVariantLabel.replace(/^(\d+(?:\.\d+)?)([a-zA-Z]+)/, '$1 $2').trim()
  }

  return `${product.strength} ${product.unit}`.trim()
}

function getNormalizedProductDisplayName(product: Pick<Product, 'displayName' | 'strength' | 'unit'> & { variantLabel?: string }) {
  const displayName = product.displayName.trim()
  if (!displayName) return displayName

  const strengthCandidates = [
    formatStrengthLabel(product),
    formatStrengthLabel(product).replace(/\s+/g, ''),
  ].filter(Boolean)

  for (const candidate of strengthCandidates) {
    const escaped = candidate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const pattern = new RegExp(`(?:[\\s_-]+)?${escaped}$`, 'i')
    if (pattern.test(displayName)) {
      return displayName.replace(pattern, '').trim()
    }
  }

  return displayName
}

export function getProductFormatLabel(product: Product): string {
  return titleCaseWords(product.formatType)
}

export function getProductCardSummary(product: Product): string {
  return product.summaryShort || `${product.fullName} is cataloged for ${lowercaseFirst(product.researchCategory)} under research-use-only handling.`
}

export function getProductMetaDescription(product: Product): string {
  return `${getNormalizedProductDisplayName(product)} research listing for ${lowercaseFirst(product.researchCategory)}. For laboratory research use only.`
}

export function getProductResearchLead(product: Product): string {
  return product.summaryShort || `${product.fullName} is listed for ${lowercaseFirst(product.researchCategory)}. This page covers the product format, main research focus, and current documentation status.`
}

export function getProductResearchDescription(product: Product): string {
  return product.summaryFull || `${getNormalizedProductDisplayName(product)} is presented as a ${lowercaseFirst(product.formatType)} listing for teams organizing research materials by category, format, and batch-linked records.`
}

export function getProductResearchFocusPoints(product: Product): string[] {
  if (product.researchFocusPoints?.length) return product.researchFocusPoints
  return [
    `Primary research area: ${product.researchCategory}.`,
    `Material type: ${product.structureType}.`,
    `Catalog group: ${product.category}.`,
  ]
}

export function getProductListingNotes(product: Product): string[] {
  if (product.listingNotes?.length) return product.listingNotes
  return [
    `Format: ${titleCaseWords(product.formatType)}.`,
    `Listing amount: ${formatStrengthLabel(product)}.`,
    'Documentation: batch-linked CoA workflow.',
  ]
}

export interface ProductResearchReferenceCategory {
  label: string
  description: string
  keywords: string[]
}

const RESEARCH_REFERENCE_CATEGORIES: Array<{
  match: RegExp
  label: string
  description: string
  keywords: string[]
}> = [
  {
    match: /metabolic|incretin|glp|gip|glucagon|amylin|insulin|lipid|adipocyte|energy-expenditure/i,
    label: 'Metabolic Signaling Research',
    description:
      'Commonly organized around receptor signaling, pathway characterization, and metabolic-model research literature.',
    keywords: ['receptor signaling', 'metabolic pathways', 'assay models'],
  },
  {
    match: /mitochondrial|nad|sirtuin|oxidative|cellular energy/i,
    label: 'Cellular Energy Research',
    description:
      'Commonly referenced in cellular-energy, mitochondrial-pathway, and redox-biology research contexts.',
    keywords: ['mitochondrial pathways', 'cellular energy', 'redox biology'],
  },
  {
    match: /cognitive|neuro|memory|circadian|sleep|melanocortin|mood/i,
    label: 'Neurobehavioral Research',
    description:
      'Commonly grouped with neuropeptide signaling, receptor-pathway, cognitive-model, and circadian research literature.',
    keywords: ['neuropeptide signaling', 'receptor pathways', 'behavioral models'],
  },
  {
    match: /immune|inflammatory|thymic|infection|vascular|circulation/i,
    label: 'Immune And Inflammatory Pathway Research',
    description:
      'Commonly categorized around immune-response, inflammatory-signaling, and cellular-communication research models.',
    keywords: ['immune response', 'inflammatory signaling', 'cell communication'],
  },
  {
    match: /repair|collagen|skin|dermal|barrier|tissue|joint|tendon|wound|connective/i,
    label: 'Tissue And Matrix Research',
    description:
      'Commonly organized around extracellular-matrix, collagen-pathway, tissue-model, and barrier-research literature.',
    keywords: ['matrix pathways', 'collagen research', 'tissue models'],
  },
  {
    match: /hormone|endocrine|growth|igf|kisspeptin|testosterone/i,
    label: 'Endocrine Signaling Research',
    description:
      'Commonly grouped with endocrine-pathway, hormone-signaling, and receptor-characterization research.',
    keywords: ['endocrine pathways', 'hormone signaling', 'receptor studies'],
  },
  {
    match: /bioregulator|peptide bioregulator/i,
    label: 'Bioregulator Reference Research',
    description:
      'Commonly cataloged as peptide-bioregulator reference material for controlled laboratory research organization.',
    keywords: ['bioregulator cataloging', 'peptide references', 'laboratory records'],
  },
]

export function getProductResearchReferenceCategories(product: Product): ProductResearchReferenceCategory[] {
  const source = [
    product.researchCategory,
    product.summaryShort,
    product.summaryFull,
    ...(product.researchFocusPoints ?? []),
  ].join(' ')

  const matches = RESEARCH_REFERENCE_CATEGORIES.filter((category) => category.match.test(source))
  const primary =
    matches.length > 0
      ? matches
      : [
          {
            label: 'General Research Reference',
            description:
              'Presented for catalog identification, documentation review, and laboratory research organization.',
            keywords: ['catalog reference', 'documentation review', 'laboratory records'],
          },
        ]

  const formatKeywords = [titleCaseWords(product.formatType), formatStrengthLabel(product)]
    .filter(Boolean)
    .map((value) => `${value} format`)

  return primary.slice(0, 3).map((category, index) => ({
    label: category.label,
    description: category.description,
    keywords: index === 0 ? [...category.keywords, ...formatKeywords] : category.keywords,
  }))
}

export function getResearchUseDisclaimer(): string {
  return 'For laboratory research use only. Not for human consumption, clinical use, veterinary use, cosmetic use, or therapeutic application. No dosing, administration, or reconstitution guidance is provided on this site.'
}
