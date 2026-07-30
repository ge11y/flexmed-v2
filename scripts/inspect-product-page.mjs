import { chromium } from 'playwright'

const BASE_URL = 'https://flexmed-v2.vercel.app'
const slugs = process.argv.slice(2)

if (slugs.length === 0) {
  console.error('Usage: node scripts/inspect-product-page.mjs <slug> [more-slugs...]')
  process.exit(1)
}

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
const page = await context.newPage()

try {
  await context.addCookies([
    {
      name: 'flexmed_research_gateway_v2',
      value: 'accepted',
      domain: 'flexmed-v2.vercel.app',
      path: '/',
      httpOnly: false,
      secure: true,
      sameSite: 'Lax',
    },
  ])

  const results = []

  for (const slug of slugs) {
    await page.goto(`${BASE_URL}/products/${slug}`, {
      waitUntil: 'domcontentloaded',
      timeout: 45000,
    })
    await page.waitForTimeout(1200)

    const data = await page.evaluate(() => {
      const bodyText = document.body?.innerText ?? ''
      const heading = document.querySelector('h1')?.textContent?.trim() ?? ''
      const breadcrumb = Array.from(document.querySelectorAll('span'))
        .map((node) => node.textContent?.trim() ?? '')
        .filter(Boolean)
        .find((text) => text !== '/' && text.length > 1) ?? ''
      const isStrengthControl = (text) =>
        /\bavailable\b/i.test(text) ||
        /\bout of stock\b/i.test(text) ||
        /\bincoming\b/i.test(text) ||
        /^\d+(\.\d+)?\s*[a-zA-Z]+$/.test(text)

      const strengthLinkEntries = Array.from(document.querySelectorAll('a'))
        .map((node) => ({
          text: node.textContent?.replace(/\s+/g, ' ').trim() ?? '',
          href: node.getAttribute('href') ?? '',
        }))
        .filter((entry) => isStrengthControl(entry.text))
      const productLinkEntries = Array.from(document.querySelectorAll('a'))
        .map((node) => ({
          text: node.textContent?.replace(/\s+/g, ' ').trim() ?? '',
          href: node.getAttribute('href') ?? '',
        }))
        .filter((entry) => entry.href.startsWith('/products/'))
      const strengthLinks = strengthLinkEntries.map((entry) => entry.text)
      const strengthHrefs = strengthLinkEntries.map((entry) => entry.href).filter(Boolean)
      const strengthButtons = Array.from(document.querySelectorAll('button'))
        .map((node) => node.textContent?.replace(/\s+/g, ' ').trim() ?? '')
        .filter(isStrengthControl)
      const imageSources = Array.from(document.querySelectorAll('img'))
        .map((img) => img.getAttribute('src') ?? '')
        .filter(Boolean)
      const familyVariantScripts = Array.from(document.querySelectorAll('script'))
        .map((node) => node.textContent ?? '')
        .filter((text) => text.includes('familyVariants'))
        .slice(0, 2)
      const coaLinks = Array.from(document.querySelectorAll('a'))
        .map((node) => ({
          text: node.textContent?.replace(/\s+/g, ' ').trim() ?? '',
          href: node.getAttribute('href') ?? '',
        }))
        .filter((entry) => /coa/i.test(entry.text))

      const listingAmountMatch = bodyText.match(/Listing amount:\s*([^\n.]+)/i)
      const detailStrengthMatch = bodyText.match(/Strength\s+([^\n]+)/i)

      return {
        heading,
        breadcrumb,
        listingAmount: listingAmountMatch?.[1]?.trim() ?? null,
        detailStrengthLine: detailStrengthMatch?.[1]?.trim() ?? null,
        strengthLinks,
        strengthHrefs,
        productLinkEntries,
        strengthButtons,
        coaLinks,
        imageSources,
        familyVariantScripts,
      }
    })

    results.push({ slug, ...data })
  }

  console.log(JSON.stringify({ ok: true, results }, null, 2))
} finally {
  await browser.close()
}
