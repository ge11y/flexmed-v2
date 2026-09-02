import { chromium } from 'playwright'

const BASE_URL = 'https://flexmed-v2.vercel.app'

const targets = [
  { family: '5 Amino 1', slug: '5-amino-1-5mg', expected: ['10 mg', '50 mg'] },
  { family: 'HGH', slug: 'hgh-24iu', expected: ['15 iu', '24 iu', '36 iu'] },
  { family: 'Glutathione', slug: 'glutathione-600mg-1000mg', expected: ['1000 mg', '1200 mg', '1500 mg'] },
]

function normalizeLabel(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
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

  for (const target of targets) {
    let pageData = null
    let error = null
    try {
      await page.goto(`${BASE_URL}/products/${target.slug}`, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      })
      await page.waitForTimeout(1200)

      pageData = await page.evaluate(() => {
        const heading = document.querySelector('h1')?.textContent?.trim() ?? ''
        const bodyText = document.body?.innerText ?? ''
        const buttons = Array.from(document.querySelectorAll('button'))
          .map((button) => button.textContent?.replace(/\s+/g, ' ').trim() ?? '')
          .filter(Boolean)
        const links = Array.from(document.querySelectorAll('a'))
          .map((link) => link.textContent?.replace(/\s+/g, ' ').trim() ?? '')
          .filter(Boolean)
        return { heading, bodyText, buttons, links }
      })
    } catch (err) {
      error = err instanceof Error ? err.message : String(err)
    }

    if (!pageData) {
      results.push({ ...target, error })
      continue
    }

    const foundLabels = Array.from(
      new Set(
        [...pageData.buttons, ...pageData.links]
          .filter((label) => /^\d+(\.\d+)?\s*[a-zA-Z]+/.test(label))
          .map(normalizeLabel),
      ),
    )

    results.push({
      family: target.family,
      slug: target.slug,
      heading: pageData.heading,
      expected: target.expected,
      foundLabels,
      missing: target.expected.map(normalizeLabel).filter((label) => !foundLabels.includes(label)),
      foundInBody: target.expected.filter((label) => pageData.bodyText.toLowerCase().includes(label.toLowerCase())),
    })
  }

  console.log(JSON.stringify({ ok: true, results }, null, 2))
} finally {
  await browser.close()
}
