import fs from 'node:fs/promises'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

function parseEnv(text) {
  const env = {}
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const separatorIndex = trimmed.indexOf('=')
    if (separatorIndex === -1) continue
    const key = trimmed.slice(0, separatorIndex)
    const value = trimmed.slice(separatorIndex + 1)
    env[key] = value
  }
  return env
}

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

const csvPath = process.argv[2]

if (!csvPath) {
  console.error('Usage: node scripts/restore-inventory-from-csv.mjs /path/to/file.csv')
  process.exit(1)
}

const envPath = path.join(process.cwd(), '.vercel', '.env.production.local')
const envText = await fs.readFile(envPath, 'utf8')
const env = parseEnv(envText)

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase production env vars.')
  process.exit(1)
}

const csvText = await fs.readFile(csvPath, 'utf8')
const rows = parseCsv(csvText)

const updates = rows
  .filter((row) => row.slug)
  .map((row) => ({
    slug: row.slug,
    inventory_on_hand: row.inventory_on_hand === '' ? null : Number(row.inventory_on_hand),
    low_stock_threshold: row.low_stock_threshold === '' ? null : Number(row.low_stock_threshold),
    status: row.status || 'out_of_stock',
    updated_at: new Date().toISOString(),
  }))
  .filter((row) => row.inventory_on_hand !== null || row.low_stock_threshold !== null)

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const { error } = await supabase.from('catalog_products').upsert(updates, { onConflict: 'slug' })

if (error) {
  console.error('Restore failed:', error.message)
  process.exit(1)
}

console.log(`Restored ${updates.length} inventory rows from CSV.`)
