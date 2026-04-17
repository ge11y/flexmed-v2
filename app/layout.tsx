import type { Metadata } from 'next'
import './globals.css'
import { NavBar } from '@/components/NavBar'
import { Footer } from '@/components/Footer'
import { SITE_SETTINGS } from '@/lib/data-site'

export const metadata: Metadata = {
  title: {
    default: `${SITE_SETTINGS.businessName} — Research Catalog`,
    template: `%s — ${SITE_SETTINGS.businessName}`,
  },
  description:
    'Research compounds presented with clarity. Third-party testing, batch transparency, and research-first cataloging.',
  keywords: ['research peptides', 'laboratory research', 'certificate of analysis', 'batch testing'],
  authors: [{ name: SITE_SETTINGS.businessName }],
  openGraph: {
    type: 'website',
    siteName: SITE_SETTINGS.businessName,
    title: `${SITE_SETTINGS.businessName} — Research Catalog`,
    description: SITE_SETTINGS.heroSubheadline,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=DM+Mono:wght@300;400;500&family=DM+Sans:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <NavBar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
