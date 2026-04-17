// ============================================================
// FlexMed v2 — FAQ Data
// All FAQ content lives here — no hardcoded text in components
// ============================================================

import type { FaqItem } from './types'

export const FAQ_ITEMS: FaqItem[] = [
  // General
  {
    id: 'faq-001',
    question: 'What is the FlexMed catalog?',
    answer:
      'The FlexMed catalog is a research-grade peptide and compound reference platform designed for institutional researchers. It provides standardized, batch-verified product documentation — including independent Certificates of Analysis — to support procurement decisions at research institutions.',
    category: 'General',
    order: 1,
  },
  {
    id: 'faq-002',
    question: 'Who can access the FlexMed catalog?',
    answer:
      'The FlexMed catalog is open for browsing by any researcher or institutional representative. Placing inquiries or requests for quotes requires institutional affiliation. FlexMed verifies institutional status prior to fulfilling any order.',
    category: 'General',
    order: 2,
  },
  {
    id: 'faq-003',
    question: 'What makes FlexMed different from other peptide suppliers?',
    answer:
      'FlexMed is built around a documentation-first model. Every compound in the catalog leads with batch-specific testing data — not marketing claims. CoAs are publicly accessible before any order is placed, and all testing is conducted by independent, accredited laboratories.',
    category: 'General',
    order: 3,
  },
  {
    id: 'faq-004',
    question: 'Are the compounds sold here intended for human use?',
    answer:
      'No. All compounds cataloged on FlexMed are sold exclusively for in vitro laboratory research and preclinical investigation within licensed research institutions. They have not been evaluated by the FDA or any comparable authority for human, animal, diagnostic, or therapeutic use.',
    category: 'General',
    order: 4,
  },
  {
    id: 'faq-005',
    question: 'Does FlexMed sell directly to independent researchers?',
    answer:
      'FlexMed sells to verified institutional buyers. Individual researchers purchasing under an institutional account may place inquiries through their institution\'s authorized procurement process.',
    category: 'General',
    order: 5,
  },

  // Documentation & COA
  {
    id: 'faq-006',
    question: 'What is a Certificate of Analysis (CoA)?',
    answer:
      'A Certificate of Analysis (CoA) is a document issued by an independent testing laboratory that confirms the identity, purity, molecular weight, and other specifications of a specific batch of a compound. FlexMed publishes batch-specific CoAs for every compound in the catalog.',
    category: 'Documentation & COA',
    order: 1,
  },
  {
    id: 'faq-007',
    question: 'How do I access a CoA?',
    answer:
      'Batch-specific CoAs are available directly from each product page in the catalog. You can also browse all published CoAs in the Testing section. No login is required — CoAs are publicly accessible.',
    category: 'Documentation & COA',
    order: 2,
  },
  {
    id: 'faq-008',
    question: 'Are CoAs available for all compounds in the catalog?',
    answer:
      'Each product page shows the current CoA status: Available, Pending, or Not Available. As batches are tested and verified, CoAs are published. A CoA must be available before a product batch is released for fulfillment.',
    category: 'Documentation & COA',
    order: 3,
  },
  {
    id: 'faq-009',
    question: 'Who conducts the testing?',
    answer:
      'All compound testing is conducted by independent, third-party laboratories. The lab conducting each test is identified on the relevant CoA. Testing typically includes HPLC (purity) and Mass Spectrometry (identity and molecular weight).',
    category: 'Documentation & COA',
    order: 4,
  },
  {
    id: 'faq-010',
    question: 'Can I verify a CoA independently?',
    answer:
      'Yes. Each CoA includes the testing laboratory\'s name and accreditation details. The laboratory\'s accreditation can be verified directly through the accreditation body\'s public registry.',
    category: 'Documentation & COA',
    order: 5,
  },
  {
    id: 'faq-011',
    question: 'What testing methods are used?',
    answer:
      'Standard testing includes High-Performance Liquid Chromatography (HPLC) for purity assessment and Mass Spectrometry (MS) for identity confirmation and molecular weight verification. Additional methods may be applied per compound as required.',
    category: 'Documentation & COA',
    order: 6,
  },

  // Catalog & Products
  {
    id: 'faq-012',
    question: 'How are products organized in the catalog?',
    answer:
      'Products are organized by research category (e.g., Growth Hormone Research, Metabolic Research, Mitochondrial Research). Each product page provides a full compound profile including structure type, research category, batch traceability, and CoA access.',
    category: 'Catalog & Products',
    order: 1,
  },
  {
    id: 'faq-013',
    question: 'What information is provided for each compound?',
    answer:
      'Each product page includes: the full compound name and alias, research category, structure type, format and strength, batch/lot number, CoA status, testing lab details, purity results (when available), and a research-use summary. No dosage or administration information is provided.',
    category: 'Catalog & Products',
    order: 2,
  },
  {
    id: 'faq-014',
    question: 'Why is pricing not displayed on the catalog pages?',
    answer:
      'FlexMed operates on a quote-first model. Pricing is confirmed at the time of inquiry based on batch availability, quantity, and institutional requirements. This approach reflects the research procurement process and ensures quote accuracy at the time of fulfillment.',
    category: 'Catalog & Products',
    order: 3,
  },
  {
    id: 'faq-015',
    question: 'How do I know if a compound is in stock?',
    answer:
      'Each product page displays a status indicator: In Stock, Low Stock, Out of Stock, or Coming Soon. Stock status is updated as batches are tested and released. For specific availability inquiries, submit a quote request.',
    category: 'Catalog & Products',
    order: 4,
  },
  {
    id: 'faq-016',
    question: 'Can I request a compound not currently in the catalog?',
    answer:
      'For institutional procurement inquiries on compounds not currently cataloged, contact us directly. FlexMed evaluates catalog expansion based on institutional demand and regulatory feasibility.',
    category: 'Catalog & Products',
    order: 5,
  },

  // Ordering & Inquiry
  {
    id: 'faq-017',
    question: 'How do I place an order?',
    answer:
      'FlexMed operates on an inquiry-first model. Browse the catalog, select the compound and format, and submit a research inquiry from the product page or contact page. Our team will prepare a formal quote based on your institutional requirements.',
    category: 'Ordering & Inquiry',
    order: 1,
  },
  {
    id: 'faq-018',
    question: 'What information is required to submit an inquiry?',
    answer:
      'Submit your institutional name, contact details, the compound(s) and format(s) you are interested in, approximate quantity, and any relevant project or grant reference (if applicable). All inquiries are reviewed by our institutional accounts team.',
    category: 'Ordering & Inquiry',
    order: 2,
  },
  {
    id: 'faq-019',
    question: 'What happens after I submit an inquiry?',
    answer:
      'Our institutional accounts team will review your inquiry and respond within 1–2 business days with a formal quote. The quote will include compound pricing, format availability, estimated lead time, and shipping terms.',
    category: 'Ordering & Inquiry',
    order: 3,
  },
  {
    id: 'faq-020',
    question: 'What payment methods are accepted?',
    answer:
      'Accepted payment methods are confirmed at the time of quote. FlexMed typically supports institutional invoicing (NET 30/60 terms for verified institutions), wire transfer, and select card payments for established accounts.',
    category: 'Ordering & Inquiry',
    order: 4,
  },
  {
    id: 'faq-021',
    question: 'Does FlexMed ship internationally?',
    answer:
      'Shipping terms and international availability are confirmed at the time of order based on your institution\'s location and applicable import regulations. The purchasing institution is responsible for ensuring compliance with local import requirements.',
    category: 'Ordering & Inquiry',
    order: 5,
  },

  // Compliance
  {
    id: 'faq-022',
    question: 'What compliance standards does FlexMed adhere to?',
    answer:
      'FlexMed operates in accordance with applicable federal, state, and international research procurement regulations. All compounds are sold exclusively for in vitro and preclinical research use. FlexMed does not sell products for human, animal, diagnostic, food, or therapeutic use.',
    category: 'Compliance',
    order: 1,
  },
  {
    id: 'faq-023',
    question: 'Does FlexMed require institutional verification?',
    answer:
      'Yes. FlexMed verifies institutional status prior to fulfilling any order. We may request institutional credentials, licensing documentation, or research protocol summaries to confirm eligibility. Orders may be refused at FlexMed\'s discretion.',
    category: 'Compliance',
    order: 2,
  },
  {
    id: 'faq-024',
    question: 'Can compounds be purchased for veterinary or agricultural research?',
    answer:
      'FlexMed sells exclusively for in vitro and preclinical research within licensed institutions. Any use outside of this scope — including veterinary, agricultural, or food-producing applications — requires separate verification and is subject to review.',
    category: 'Compliance',
    order: 3,
  },
]

export const FAQ_CATEGORIES = [
  'General',
  'Documentation & COA',
  'Catalog & Products',
  'Ordering & Inquiry',
  'Compliance',
]

export function getFaqsByCategory(category: string): FaqItem[] {
  if (category === 'All') return FAQ_ITEMS
  return FAQ_ITEMS.filter((f) => f.category === category).sort((a, b) => a.order - b.order)
}
