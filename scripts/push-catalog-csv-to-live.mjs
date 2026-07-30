import fs from 'node:fs/promises'

function parseCsvLine(line) {
  const values = []
  let current = ''
  let inQuotes = false

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index]

    if (character === '"') {
      const nextCharacter = line[index + 1]
      if (inQuotes && nextCharacter === '"') {
        current += '"'
        index += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (character === ',' && !inQuotes) {
      values.push(current)
      current = ''
      continue
    }

    current += character
  }

  values.push(current)
  return values
}

function parseCsv(text) {
  const normalized = text.replace(/\r\n/g, '\n').trim()
  const lines = normalized.split('\n')
  const headers = parseCsvLine(lines[0]).map((value, index) =>
    value.trim().replace(index === 0 ? /^\uFEFF/ : /$^/, ''),
  )

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line)
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']))
  })
}

function toNullableNumber(value) {
  if (value === '' || value === null || value === undefined) return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function toBoolean(value) {
  return String(value).trim().toLowerCase() === 'yes'
}

const csvPath = process.argv[2]
const endpoint = process.argv[3] || 'https://flexmed-v2.vercel.app/api/catalog-sync'

if (!csvPath) {
  console.error('Usage: node scripts/push-catalog-csv-to-live.mjs /path/to/catalog.csv [endpoint]')
  process.exit(1)
}

const csvText = await fs.readFile(csvPath, 'utf8')
const rows = parseCsv(csvText)

const records = rows.map((row) => ({
  slug: row.slug,
  sku: row.sku,
  displayName: row.display_name,
  fullName: row.full_name,
  strength: toNullableNumber(row.strength) ?? 0,
  unit: row.unit || 'mg',
  collection: row.collection || 'peptides',
  researchCategory: row.research_category || 'General Research',
  formatType: row.format_type || 'vial',
  variantGroup: row.variant_group || undefined,
  variantLabel: row.variant_label || undefined,
  publicVisible: toBoolean(row.public_visible),
  status: row.status || 'out_of_stock',
  inventoryOnHand: toNullableNumber(row.inventory_on_hand),
  lowStockThreshold: toNullableNumber(row.low_stock_threshold),
  promoLabel: row.promo_label || '',
  promoDetail: row.promo_detail || '',
  priceVial: row.price_vial || '',
  imageUrl: row.image_url || '/products/front.png',
  imageSource: row.image_source || 'catalog',
  coaUrl: row.coa_url || null,
  coaSource: row.coa_source || 'none',
  customProduct: toBoolean(row.custom_product),
  archived: toBoolean(row.archived),
  summaryShort: '',
  summaryFull: '',
  researchFocusPoints: [],
  listingNotes: [],
}))

const gatewayForm = new URLSearchParams()
gatewayForm.set('confirm_21_plus', 'on')
gatewayForm.set('confirm_research_only', 'on')

const gatewayResponse = await fetch(endpoint.replace('/api/catalog-sync', '/api/research-access'), {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: gatewayForm.toString(),
  redirect: 'manual',
})

const gatewayCookie = gatewayResponse.headers.get('set-cookie')

if (!gatewayCookie) {
  console.error('Could not obtain research access cookie before restore.')
  process.exit(1)
}

const response = await fetch(endpoint, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Cookie: gatewayCookie.split(';')[0],
  },
  body: JSON.stringify({ records }),
})

const result = await response.json()

if (!response.ok || !result?.ok) {
  console.error('Live restore failed:', result)
  process.exit(1)
}

console.log(`Live restore synced ${records.length} records.`)
