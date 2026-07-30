// ============================================================
// FlexMed v2 — FAQ Data
// All FAQ content lives here — no hardcoded text in components
// ============================================================

import type { FaqItem } from './types'

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'faq-catalog-001',
    question: 'How do I shop the catalog?',
    answer:
      'Use the category buttons or search bar to find a product family, choose an available strength, add it to cart, and continue through account sign-in and checkout.',
    category: 'Catalog & Products',
    order: 1,
  },
  {
    id: 'faq-catalog-002',
    question: 'Can I buy vial cases with my order?',
    answer:
      'Yes. Vial cases have their own storefront section and can be added to the same cart as catalog products.',
    category: 'Catalog & Products',
    order: 2,
  },
  {
    id: 'faq-catalog-003',
    question: 'Can I request something that is not listed?',
    answer:
      'Yes. Use the contact form and include the product name, strength, and any documentation details you are looking for.',
    category: 'Catalog & Products',
    order: 3,
  },
  {
    id: 'faq-ordering-001',
    question: 'How does checkout work?',
    answer:
      'Create or sign into your account, place the order, follow the payment instructions, and upload proof of payment so the order can be confirmed.',
    category: 'Ordering & Shipping',
    order: 1,
  },
  {
    id: 'faq-ordering-002',
    question: 'How do I track my order?',
    answer:
      'After an order is placed, your account page shows order history and status updates. Shipment details are added once fulfillment is completed.',
    category: 'Ordering & Shipping',
    order: 2,
  },
  {
    id: 'faq-ordering-003',
    question: 'Do you ship internationally?',
    answer:
      'No. FlexMed currently ships domestically only.',
    category: 'Ordering & Shipping',
    order: 3,
  },
  {
    id: 'faq-support-001',
    question: 'Who should I contact for order or catalog help?',
    answer:
      'Use the contact form or email flexmedpeptides@gmail.com. Include product names, strengths, order numbers, or CoA details so the team can respond faster.',
    category: 'Support',
    order: 1,
  },
]

export const FAQ_CATEGORIES = [
  'Catalog & Products',
  'Ordering & Shipping',
  'Support',
]

export function getFaqsByCategory(category: string): FaqItem[] {
  if (category === 'All') return FAQ_ITEMS
  return FAQ_ITEMS.filter((f) => f.category === category).sort((a, b) => a.order - b.order)
}
