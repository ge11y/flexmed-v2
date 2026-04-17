// ============================================================
// FlexMed v2 — Site Settings
// Centralized site-wide configuration — plug in founder data here
// ============================================================

import type { SiteSettings, NavLink } from './types'

export const SITE_SETTINGS: SiteSettings = {
  businessName: 'FlexMed',
  tagline: 'Research compounds presented with clarity.',
  heroHeadline: 'Research compounds presented with clarity.',
  heroSubheadline:
    'Third-party testing, batch transparency, and research-first cataloging.',
  heroPrimaryCta: 'View Catalog',
  heroSecondaryCta: 'View Testing Standards',
  heroDisclaimer: 'For laboratory research use only. Not for human consumption.',
  trustSignals: [
    { label: 'Third-Party Tested', icon: 'flask' },
    { label: 'Batch Transparency', icon: 'batch' },
    { label: 'COA Documentation', icon: 'document' },
    { label: 'Research-First Cataloging', icon: 'catalog' },
  ],
  featuredProductSlugs: [
    'cjc-ipa-10mg',
    'tirz-15mg',
    'nad-plus-500',
    'ss-31-50mg',
    'mots-c-40mg',
    'pt-141-10mg',
  ],
  footerDisclaimer:
    'For laboratory research use only. Not for human consumption. No information on this site is intended to diagnose, treat, cure, or prevent any disease or condition.',
  institutionalEmail: '[INSTITUTIONAL EMAIL REQUIRED]',
  businessAddress: '[BUSINESS ADDRESS REQUIRED]',
  companyRegistration: '[COMPANY REGISTRATION REQUIRED]',
}

export const NAV_LINKS: NavLink[] = [
  { label: 'Catalog', href: '/products' },
  { label: 'Testing', href: '/testing' },
  { label: 'About', href: '/about' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Contact', href: '/contact' },
]

export const FOOTER_LINKS = {
  company: [
    { label: 'About', href: '/about' },
    { label: 'Testing Standards', href: '/testing' },
    { label: 'Contact', href: '/contact' },
  ],
  legal: [
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Research Disclaimer', href: '/disclaimer' },
  ],
  catalog: [
    { label: 'View Catalog', href: '/products' },
    { label: 'View Testing Standards', href: '/testing' },
  ],
}
