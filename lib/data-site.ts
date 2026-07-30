// ============================================================
// FlexMed v2 — Site Settings
// Centralized site-wide configuration — plug in founder data here
// ============================================================

import type { SiteSettings, NavLink } from './types'

export const SITE_SETTINGS: SiteSettings = {
  businessName: 'FlexMed',
  tagline: 'Research peptides presented with clarity.',
  heroHeadline: 'Research peptides presented with clarity.',
  heroSubheadline:
    'Third-party testing, batch transparency, and research-first cataloging.',
  heroPrimaryCta: 'View Catalog',
  heroSecondaryCta: 'View COA Testing',
  heroDisclaimer: 'For laboratory research use only. Not for human consumption.',
  trustSignals: [
    { label: 'Third-Party Tested', icon: 'flask' },
    { label: 'Batch Transparency', icon: 'batch' },
    { label: 'COA Documentation', icon: 'document' },
    { label: 'Research-First Cataloging', icon: 'catalog' },
  ],
  featuredProductSlugs: [
    'epithalon-10mg',
    'glutathione-500',
    'nad-plus-1000',
    'nad-plus-500',
    'tirz-10mg',
    'reta-20mg',
  ],
  footerDisclaimer:
    'For laboratory research use only. Not for human consumption. No information on this site is intended to diagnose, treat, cure, or prevent any disease or condition.',
  institutionalEmail: 'flexmedpeptides@gmail.com',
  businessAddress: '',
  companyRegistration: '',
}

export const NAV_LINKS: NavLink[] = [
  { label: 'Shop Peptides', href: '/products?group=peptides' },
  { label: 'Shop Bio Regulators', href: '/products?group=bio_regulators' },
  { label: 'Vial Cases', href: '/vial-cases' },
  { label: 'Affiliate', href: '/affiliate' },
]

export const FOOTER_LINKS = {
  company: [
    { label: 'About', href: '/about' },
    { label: 'COA Testing', href: '/testing' },
    { label: 'Contact', href: '/contact' },
  ],
  legal: [
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Research Disclaimer', href: '/disclaimer' },
  ],
  catalog: [
    { label: 'View Catalog', href: '/products' },
    { label: 'View COA Testing', href: '/testing' },
  ],
}
