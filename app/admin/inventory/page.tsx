'use client'

import Image from 'next/image'
import { type ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  applyCatalogInventoryOverrides,
  buildCatalogCsv,
  CATALOG_ADMIN_DRAFT_STORAGE_KEY,
  type CatalogInventoryOverride,
  type CatalogInventoryRecord,
} from '@/lib/catalog-admin'
import { AdminShell } from '@/components/AdminShell'
import { ImageAdjustmentDialog } from '@/components/ImageAdjustmentDialog'
import type { ProductStatus } from '@/lib/types'
import { getDefaultAdminSettings, type AdminSettingsPayload } from '@/lib/admin-settings'
import { getInventoryStatusFromCount } from '@/lib/inventory-state'
import { supabase } from '@/lib/supabase'
import { PurchaseLedger } from '@/components/PurchaseLedger'
import { formatMoney, groupPurchaseRowsBySlug, summarizePurchaseLedger, type PurchaseLedgerRow } from '@/lib/purchase-ledger'

const CATALOG_COA_BUCKET = 'catalog-coas'

const COLLECTION_OPTIONS: Array<{ value: CatalogInventoryRecord['collection']; label: string }> = [
  { value: 'peptides', label: 'Peptides' },
  { value: 'blends', label: 'Blends' },
  { value: 'topicals', label: 'Topicals' },
  { value: 'bio_regulators', label: 'Bio Regulators' },
  { value: 'water', label: 'Water' },
]

const FORMAT_OPTIONS = ['vial', 'blend', 'topical', 'capsule', 'water']

const EMPTY_LISTING_FORM = {
  slug: '',
  sku: '',
  displayName: '',
  fullName: '',
  strength: '',
  unit: 'mg',
  collection: 'peptides' as CatalogInventoryRecord['collection'],
  researchCategory: 'General Research',
  formatType: 'vial',
  status: 'out_of_stock' as ProductStatus,
  priceVial: '',
  inventoryOnHand: '',
  lowStockThreshold: '4',
  coaNotRequired: false,
  publicVisible: true,
}

type PendingProductImageEditor = {
  slug: string
  displayName: string
  fileName: string
  previewUrl: string
}

function saveDraft(overrides: Record<string, CatalogInventoryOverride>) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(CATALOG_ADMIN_DRAFT_STORAGE_KEY, JSON.stringify(overrides))
}

function loadDraft() {
  if (typeof window === 'undefined') return {} as Record<string, CatalogInventoryOverride>
  try {
    const raw = window.localStorage.getItem(CATALOG_ADMIN_DRAFT_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Record<string, CatalogInventoryOverride>) : {}
  } catch {
    return {}
  }
}

async function readApiResponse<T>(response: Response): Promise<T & { ok?: boolean; error?: string; detail?: string }> {
  const text = await response.text()
  try {
    return JSON.parse(text) as T & { ok?: boolean; error?: string; detail?: string }
  } catch {
    const readableText = text.trim()
    if (/request entity too large/i.test(readableText)) {
      throw new Error('The selected CoA file is too large for the old upload path. Try again; this screen now uses direct storage upload for larger CoA files.')
    }
    throw new Error(readableText || `Upload request failed with status ${response.status}.`)
  }
}

function getEffectiveLowStockThreshold(record: CatalogInventoryRecord, fallback: number) {
  return record.lowStockThreshold ?? fallback
}

function getFamilyNameForRecord(record: CatalogInventoryRecord) {
  const displayName = record.displayName.trim()
  if (!displayName) return displayName

  const rawVariantLabel = record.variantLabel?.trim()
  const candidates = new Set<string>()
  if (rawVariantLabel) {
    candidates.add(rawVariantLabel)
    candidates.add(rawVariantLabel.replace(/^(\d+(?:\.\d+)?)([a-zA-Z]+)/, '$1 $2').trim())
    candidates.add(rawVariantLabel.replace(/\s+/g, ''))
  }
  candidates.add(`${record.strength}${record.unit}`.trim())
  candidates.add(`${record.strength} ${record.unit}`.trim())

  for (const candidate of candidates) {
    if (!candidate) continue
    const escaped = candidate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const pattern = new RegExp(`(?:[\\s_-]+)?${escaped}$`, 'i')
    if (pattern.test(displayName)) {
      return displayName.replace(pattern, '').trim()
    }
  }

  return displayName
}

function groupKeyForRecord(record: CatalogInventoryRecord) {
  const familyName = getFamilyNameForRecord(record)
  const rawGroup = record.variantGroup?.trim()
  if (!rawGroup) return normalizeKeyPart(familyName)

  const pseudoRecord = {
    ...record,
    displayName: rawGroup,
  }
  return normalizeKeyPart(getFamilyNameForRecord(pseudoRecord) || familyName)
}

function getStrengthLabelForRecord(record: CatalogInventoryRecord) {
  const rawLabel = record.variantLabel?.trim()
  if (rawLabel) {
    return rawLabel.replace(/^(\d+(?:\.\d+)?)([a-zA-Z]+)/, '$1 $2').trim()
  }

  return `${record.strength} ${record.unit}`.trim()
}

function normalizeKeyPart(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function normalizeMatchText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function getInventoryPatchFromInput(rawValue: string, fallbackStatus: ProductStatus = 'out_of_stock') {
  const nextInventory = rawValue === '' ? null : Number(rawValue)
  return {
    inventoryOnHand: nextInventory,
    status: getInventoryStatusFromCount(nextInventory, fallbackStatus),
  } satisfies CatalogInventoryOverride
}

function linesToMultiline(lines: string[]) {
  return lines.join('\n')
}

function multilineToLines(value: string) {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

function getRecordUpdatedTime(record: CatalogInventoryRecord) {
  const parsed = Date.parse(record.updatedAt ?? '')
  return Number.isFinite(parsed) ? parsed : 0
}

function isPlaceholderImageRecord(record: CatalogInventoryRecord) {
  return record.imageSource === 'placeholder' || record.imageUrl === '/products/front.png'
}

function getRepresentativeMediaRecord(records: CatalogInventoryRecord[]) {
  return [...records].sort((a, b) => {
    const aUploaded = a.imageSource === 'uploaded' ? 1 : 0
    const bUploaded = b.imageSource === 'uploaded' ? 1 : 0
    if (aUploaded !== bUploaded) return bUploaded - aUploaded

    if (aUploaded && bUploaded) {
      const updatedDiff = getRecordUpdatedTime(b) - getRecordUpdatedTime(a)
      if (updatedDiff !== 0) return updatedDiff
    }

    const aPlaceholder = isPlaceholderImageRecord(a) ? 1 : 0
    const bPlaceholder = isPlaceholderImageRecord(b) ? 1 : 0
    if (aPlaceholder !== bPlaceholder) return aPlaceholder - bPlaceholder

    return a.strength - b.strength || a.unit.localeCompare(b.unit)
  })[0]
}

function parseCsvLine(line: string) {
  const values: string[] = []
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

function parseCsv(text: string) {
  const normalized = text.replace(/\r\n/g, '\n').trim()
  if (!normalized) return []
  const lines = normalized.split('\n')
  const headers = parseCsvLine(lines[0]).map((value, index) =>
    value
      .trim()
      .replace(index === 0 ? /^\uFEFF/ : /$^/, ''),
  )

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line)
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']))
  })
}

export default function AdminInventoryPage() {
  const importInputRef = useRef<HTMLInputElement | null>(null)
  const autoSyncTimeoutRef = useRef<number | null>(null)
  const [baseRecords, setBaseRecords] = useState<CatalogInventoryRecord[]>([])
  const [search, setSearch] = useState('')
  const [collectionFilter, setCollectionFilter] = useState<'all' | CatalogInventoryRecord['collection']>('all')
  const [overrides, setOverrides] = useState<Record<string, CatalogInventoryOverride>>(() => loadDraft())
  const [showArchived, setShowArchived] = useState(false)
  const [syncMessage, setSyncMessage] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [loadingSource, setLoadingSource] = useState(true)
  const [newListingForm, setNewListingForm] = useState(EMPTY_LISTING_FORM)
  const [settings, setSettings] = useState<AdminSettingsPayload | null>(null)
  const [settingsMessage, setSettingsMessage] = useState('')
  const [savingSettings, setSavingSettings] = useState(false)
  const [autoSyncing, setAutoSyncing] = useState(false)
  const [autoSyncStatus, setAutoSyncStatus] = useState<'idle' | 'pending' | 'saving' | 'saved' | 'error'>('idle')
  const [lastAutoSyncAt, setLastAutoSyncAt] = useState('')
  const [costLogs, setCostLogs] = useState<PurchaseLedgerRow[]>([])
  const [expandedFamilies, setExpandedFamilies] = useState<Record<string, boolean>>({})
  const [highlightedStrengthFamily, setHighlightedStrengthFamily] = useState<string | null>(null)
  const [familyStrengthDrafts, setFamilyStrengthDrafts] = useState<
    Record<
      string,
      {
        strength: string
        unit: string
        sku: string
        priceVial: string
        inventoryOnHand: string
        lowStockThreshold: string
        publicVisible: boolean
      }
    >
  >({})
  const [familyStrengthFeedback, setFamilyStrengthFeedback] = useState<
    Record<string, { tone: 'success' | 'error'; message: string }>
  >({})
  const [assetFeedback, setAssetFeedback] = useState<Record<string, { kind: 'image' | 'coa'; tone: 'idle' | 'success' | 'error'; message: string }>>({})
  const [productImageEditor, setProductImageEditor] = useState<PendingProductImageEditor | null>(null)
  const hasLocalDraftChanges = Object.keys(overrides).length > 0

  useEffect(() => {
    return () => {
      if (productImageEditor?.previewUrl) URL.revokeObjectURL(productImageEditor.previewUrl)
    }
  }, [productImageEditor?.previewUrl])

  const loadSource = useCallback(async (active = true): Promise<void> => {
    try {
      const response = await fetch('/api/catalog-source', { cache: 'no-store' })
      const result = (await response.json()) as { ok: boolean; records?: CatalogInventoryRecord[] }

      if (!active) return
      if (response.ok && result.ok && Array.isArray(result.records)) {
        setBaseRecords(result.records)
      } else {
        setSyncMessage('Shared catalog source could not be loaded, so this session is using the local catalog shape.')
      }
    } catch {
      if (active) {
        setSyncMessage('Shared catalog source could not be loaded, so this session is using the local catalog shape.')
      }
    } finally {
      if (active) setLoadingSource(false)
    }
  }, [])

  useEffect(() => {
    let active = true

    async function load() {
      try {
        await loadSource(active)
      } finally {
        // no-op
      }
    }

    load()
    return () => {
      active = false
    }
  }, [loadSource])

  useEffect(() => {
    function refreshFromOrderUpdates() {
      if (hasLocalDraftChanges) return
      void loadSource(true)
    }

    function refreshOnFocus() {
      if (hasLocalDraftChanges) return
      void loadSource(true)
    }

    const interval = window.setInterval(() => {
      if (hasLocalDraftChanges) return
      void loadSource(true)
    }, 10000)

    window.addEventListener('admin-orders-updated', refreshFromOrderUpdates)
    window.addEventListener('focus', refreshOnFocus)

    return () => {
      window.clearInterval(interval)
      window.removeEventListener('admin-orders-updated', refreshFromOrderUpdates)
      window.removeEventListener('focus', refreshOnFocus)
    }
  }, [hasLocalDraftChanges, loadSource])

  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch('/api/admin/settings', { cache: 'no-store' })
        const result = (await response.json()) as { ok: boolean; settings?: AdminSettingsPayload }
        if (response.ok && result.ok && result.settings) {
          setSettings(result.settings)
          setNewListingForm((current) => ({
            ...current,
            lowStockThreshold: String(result.settings?.inventoryDefaults.lowStockThreshold ?? 4),
          }))
        }
      } catch {
        // leave defaults in place
      }
    }

    void loadSettings()
  }, [])

  const refreshCosts = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/inventory-costs', { cache: 'no-store' })
      const result = (await response.json()) as { ok: boolean; logs?: PurchaseLedgerRow[] }
      if (response.ok && result.ok) setCostLogs(result.logs ?? [])
    } catch {
      // Keep the last known ledger when the request fails.
    }
  }, [])

  useEffect(() => {
    let active = true
    async function loadCosts() {
      try {
        const response = await fetch('/api/admin/inventory-costs', { cache: 'no-store' })
        const result = (await response.json()) as { ok: boolean; logs?: PurchaseLedgerRow[] }
        if (active && response.ok && result.ok) setCostLogs(result.logs ?? [])
      } catch {
        // Keep the last known ledger when the request fails.
      }
    }
    void loadCosts()
    return () => {
      active = false
    }
  }, [])

  const records = useMemo(() => applyCatalogInventoryOverrides(baseRecords, overrides), [baseRecords, overrides])
  const featuredRecords = useMemo(
    () =>
      records
        .filter((record) => record.featured && record.publicVisible && !record.archived)
        .sort((a, b) => {
          const orderA = a.featuredOrder ?? Number.MAX_SAFE_INTEGER
          const orderB = b.featuredOrder ?? Number.MAX_SAFE_INTEGER
          if (orderA !== orderB) return orderA - orderB
          return a.displayName.localeCompare(b.displayName)
        }),
    [records],
  )

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const haystack = `${record.displayName} ${record.fullName} ${record.slug} ${record.sku}`.toLowerCase()
      const matchesSearch = !search.trim() || haystack.includes(search.trim().toLowerCase())
      const matchesCollection = collectionFilter === 'all' || record.collection === collectionFilter
      const matchesArchive = showArchived ? true : !record.archived
      return matchesSearch && matchesCollection && matchesArchive
    })
  }, [collectionFilter, records, search, showArchived])

  const groupedRecords = useMemo(() => {
    const groups = new Map<
      string,
      {
        key: string
        familyName: string
        familyFullName: string
        collection: CatalogInventoryRecord['collection']
        researchCategory: string
        formatType: string
        summaryShort: string
        summaryFull: string
        researchFocusPoints: string[]
        listingNotes: string[]
        coaNotRequired: boolean
        imageUrl: string
        imageSource: CatalogInventoryRecord['imageSource']
        records: CatalogInventoryRecord[]
      }
    >()

    for (const record of filteredRecords) {
      const key = groupKeyForRecord(record)
      const familyName = getFamilyNameForRecord(record)
      const existing = groups.get(key)
      if (!existing) {
        groups.set(key, {
          key,
          familyName,
          familyFullName: record.fullName,
          collection: record.collection,
          researchCategory: record.researchCategory,
          formatType: record.formatType,
          summaryShort: record.summaryShort,
          summaryFull: record.summaryFull,
          researchFocusPoints: record.researchFocusPoints,
          listingNotes: record.listingNotes,
          coaNotRequired: Boolean(record.coaNotRequired),
          imageUrl: record.imageUrl,
          imageSource: record.imageSource,
          records: [record],
        })
        continue
      }

      existing.records.push(record)
      if (familyName && familyName.length < existing.familyName.length) {
        existing.familyName = familyName
      }
    }

  return [...groups.values()]
      .map((group) => {
        const mediaRecord = getRepresentativeMediaRecord(group.records)
        return {
          ...group,
          coaNotRequired: group.records.every((record) => record.coaNotRequired),
          imageUrl: mediaRecord?.imageUrl ?? group.imageUrl,
          imageSource: mediaRecord?.imageSource ?? group.imageSource,
          records: [...group.records].sort((a, b) => a.strength - b.strength || a.unit.localeCompare(b.unit)),
        }
      })
      .sort((a, b) => a.familyName.localeCompare(b.familyName))
  }, [filteredRecords])

  const summary = useMemo(() => {
    return {
      total: records.length,
      visible: records.filter((record) => record.publicVisible).length,
      inStock: records.filter((record) => record.status === 'in_stock').length,
      incoming: records.filter((record) => record.status === 'incoming').length,
      outOfStock: records.filter((record) => record.status === 'out_of_stock').length,
      lowStock: records.filter((record) => {
        if (record.status !== 'in_stock') return false
        if (record.inventoryOnHand === null) return false
        return record.inventoryOnHand <= getEffectiveLowStockThreshold(record, settings?.inventoryDefaults.lowStockThreshold ?? 4)
      }).length,
      archived: records.filter((record) => record.archived).length,
    }
  }, [records, settings])

  const purchaseRowsBySlug = useMemo(() => groupPurchaseRowsBySlug(costLogs), [costLogs])
  const ledgerSummaries = useMemo(
    () =>
      [...purchaseRowsBySlug.entries()]
        .map(([slug, rows]) => ({
          slug,
          productName: rows[0]?.product_name ?? slug,
          strengthLabel: rows[0]?.strength_label ?? '',
          summary: summarizePurchaseLedger(rows),
        }))
        .sort((a, b) => a.productName.localeCompare(b.productName) || a.strengthLabel.localeCompare(b.strengthLabel)),
    [purchaseRowsBySlug],
  )
  const ledgerTotalSpend = useMemo(() => ledgerSummaries.reduce((sum, item) => sum + item.summary.totalSpend, 0), [ledgerSummaries])

  function updateRecord(slug: string, patch: CatalogInventoryOverride) {
    setAutoSyncStatus('pending')
    setOverrides((current) => {
      const next = {
        ...current,
        [slug]: {
          ...(current[slug] ?? {}),
          ...patch,
        },
      }
      saveDraft(next)
      return next
    })
  }

  function updateFamily(groupKey: string, patch: CatalogInventoryOverride) {
    const familyRecords = records.filter((record) => groupKeyForRecord(record) === groupKey)
    const nextPatch =
      typeof patch.displayName === 'string'
        ? {
            ...patch,
            variantGroup: normalizeKeyPart(patch.displayName),
          }
        : patch
    for (const record of familyRecords) {
      updateRecord(record.slug, nextPatch)
    }
  }

  function toggleFamily(groupKey: string) {
    setExpandedFamilies((current) => ({
      ...current,
      [groupKey]: !current[groupKey],
    }))
    setHighlightedStrengthFamily((current) => (current === groupKey ? null : current))
  }

  function getFamilyStrengthDraft(group: (typeof groupedRecords)[number]) {
    const existing = familyStrengthDrafts[group.key]
    if (existing) return existing
    const template = getRepresentativeMediaRecord(group.records) ?? group.records[0]
    return {
      strength: '',
      unit: template.unit,
      sku: '',
      priceVial: '',
      inventoryOnHand: '',
      lowStockThreshold: String(settings?.inventoryDefaults.lowStockThreshold ?? 4),
      publicVisible: true,
    }
  }

  function updateFamilyStrengthDraft(
    groupKey: string,
    patch: Partial<{
      strength: string
      unit: string
      sku: string
      priceVial: string
      inventoryOnHand: string
      lowStockThreshold: string
      publicVisible: boolean
    }>,
    group?: (typeof groupedRecords)[number],
  ) {
    const fallback = group ? getFamilyStrengthDraft(group) : familyStrengthDrafts[groupKey]
    if (!fallback) return
    setFamilyStrengthDrafts((current) => ({
      ...current,
      [groupKey]: {
        ...fallback,
        ...patch,
      },
    }))
    setFamilyStrengthFeedback((current) => {
      if (!current[groupKey]) return current
      const next = { ...current }
      delete next[groupKey]
      return next
    })
  }

  function resetNewListingForm() {
    setNewListingForm(EMPTY_LISTING_FORM)
  }

  function addListing() {
    const strength = Number(newListingForm.strength)
    const normalizedUnit = newListingForm.unit.trim() || 'mg'
    const normalizedDisplayName = newListingForm.displayName.trim()
    const autoSlug = `${normalizeKeyPart(normalizedDisplayName)}-${normalizeKeyPart(String(strength))}${normalizeKeyPart(normalizedUnit)}`
    const slug = (newListingForm.slug.trim() ? newListingForm.slug : autoSlug)
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
    if (!slug) {
      setSyncMessage('Add a product name and strength before creating a listing.')
      return
    }
    if (!newListingForm.displayName.trim() || !newListingForm.fullName.trim()) {
      setSyncMessage('Add both listing name and full name before creating a listing.')
      return
    }
    if (records.some((record) => record.slug === slug)) {
      setSyncMessage('That slug already exists. Use a new slug or edit the existing listing.')
      return
    }

    if (!Number.isFinite(strength)) {
      setSyncMessage('Add a valid strength before creating a listing.')
      return
    }

    const familyKey = normalizeKeyPart(newListingForm.displayName) || slug
    const nextInventory = newListingForm.inventoryOnHand === '' ? null : Number(newListingForm.inventoryOnHand)

    const nextRecord: CatalogInventoryRecord = {
      slug,
      sku: newListingForm.sku.trim() || slug.toUpperCase(),
      displayName: normalizedDisplayName,
      fullName: newListingForm.fullName.trim(),
      strength,
      unit: normalizedUnit,
      collection: newListingForm.collection,
      researchCategory: newListingForm.researchCategory.trim() || 'General Research',
      formatType: newListingForm.formatType.trim() || 'vial',
      summaryShort: `${normalizedDisplayName} is cataloged for ${(newListingForm.researchCategory.trim() || 'general research').toLowerCase()} under research-use-only handling.`,
      summaryFull: `${normalizedDisplayName} is presented as a ${(newListingForm.formatType.trim() || 'vial').toLowerCase()} listing for research teams organizing materials by category, format, and documentation.`,
      researchFocusPoints: [],
      listingNotes: [],
      coaNotRequired: newListingForm.coaNotRequired,
      status: getInventoryStatusFromCount(nextInventory, newListingForm.status),
      priceVial: newListingForm.priceVial.trim(),
      inventoryOnHand: nextInventory,
      lowStockThreshold: newListingForm.lowStockThreshold === '' ? null : Number(newListingForm.lowStockThreshold),
      variantGroup: familyKey,
      variantLabel: `${strength} ${normalizedUnit}`,
      promoLabel: '',
      promoDetail: '',
      featured: false,
      featuredOrder: null,
      publicVisible: newListingForm.publicVisible,
      imageUrl: '/products/front.png',
      imageSource: 'placeholder',
      coaUrl: null,
      coaSource: 'none',
      customProduct: true,
      archived: false,
    }

    setAutoSyncStatus('pending')
    setBaseRecords((current) => [...current, nextRecord].sort((a, b) => a.displayName.localeCompare(b.displayName)))
    setOverrides((current) => {
      const next = {
        ...current,
        [slug]: {
          sku: nextRecord.sku,
          displayName: nextRecord.displayName,
          fullName: nextRecord.fullName,
          strength: nextRecord.strength,
          unit: nextRecord.unit,
          collection: nextRecord.collection,
          researchCategory: nextRecord.researchCategory,
          formatType: nextRecord.formatType,
          summaryShort: nextRecord.summaryShort,
          summaryFull: nextRecord.summaryFull,
          researchFocusPoints: nextRecord.researchFocusPoints,
          listingNotes: nextRecord.listingNotes,
          coaNotRequired: nextRecord.coaNotRequired,
          status: nextRecord.status,
          priceVial: nextRecord.priceVial,
          inventoryOnHand: nextRecord.inventoryOnHand,
          lowStockThreshold: nextRecord.lowStockThreshold,
          variantGroup: nextRecord.variantGroup,
          variantLabel: nextRecord.variantLabel,
          publicVisible: nextRecord.publicVisible,
          customProduct: true,
          archived: false,
        },
      }
      saveDraft(next)
      return next
    })
    setSyncMessage(`Added ${nextRecord.displayName}. Sync the catalog when you're ready to publish it.`)
    resetNewListingForm()
  }

  function archiveListing(record: CatalogInventoryRecord) {
    const confirmed = window.confirm(`Archive ${record.displayName}? This removes it from the live catalog but keeps the record for history.`)
    if (!confirmed) return
    updateRecord(record.slug, { publicVisible: false, archived: true })
    setSyncMessage(`${record.displayName} is marked for removal. Sync the catalog to update the live site.`)
  }

  function restoreListing(record: CatalogInventoryRecord) {
    updateRecord(record.slug, { archived: false })
    setSyncMessage(`${record.displayName} is back in the working catalog. Sync when ready.`)
  }

  function archiveFamily(groupKey: string, familyName: string) {
    const confirmed = window.confirm(`Remove ${familyName} from the live catalog? All listed strengths in this product will be archived.`)
    if (!confirmed) return
    const familyRecords = records.filter((record) => groupKeyForRecord(record) === groupKey)
    for (const record of familyRecords) {
      updateRecord(record.slug, { publicVisible: false, archived: true })
    }
    setSyncMessage(`${familyName} and its listed strengths are marked for removal. Sync when ready.`)
  }

  function restoreFamily(groupKey: string, familyName: string) {
    const familyRecords = records.filter((record) => groupKeyForRecord(record) === groupKey)
    for (const record of familyRecords) {
      updateRecord(record.slug, { archived: false })
    }
    setSyncMessage(`${familyName} is back in the working catalog. Sync when ready.`)
  }

  function removeStrength(record: CatalogInventoryRecord) {
    const siblingCount = records.filter((entry) => groupKeyForRecord(entry) === groupKeyForRecord(record) && !entry.archived).length
    if (siblingCount <= 1) {
      setSyncMessage(`Use Remove Product for ${record.displayName} if you want to remove the last listed strength.`)
      return
    }

    const strengthLabel = getStrengthLabelForRecord(record)
    const confirmed = window.confirm(`Remove ${record.displayName} ${strengthLabel}? This will remove only this strength from the live catalog after sync.`)
    if (!confirmed) return

    updateRecord(record.slug, { publicVisible: false, archived: true })
    setSyncMessage(`${record.displayName} ${strengthLabel} is marked for removal. Sync when ready.`)
  }

  async function addStrengthToFamily(group: (typeof groupedRecords)[number]) {
    const draft = getFamilyStrengthDraft(group)
    const strength = Number(draft.strength)
    const normalizedUnit = draft.unit.trim() || 'mg'
    const normalizedDisplayName = group.familyName.trim()
    const autoSlug = `${normalizeKeyPart(normalizedDisplayName)}-${normalizeKeyPart(String(strength))}${normalizeKeyPart(normalizedUnit)}`
    const slug = autoSlug.toLowerCase().replace(/[^a-z0-9-]+/g, '-')

    if (!Number.isFinite(strength) || strength <= 0) {
      setFamilyStrengthFeedback((current) => ({
        ...current,
        [group.key]: {
          tone: 'error',
          message: `Add a valid strength before saving it under ${group.familyName}.`,
        },
      }))
      setSyncMessage(`Add a valid strength before saving it under ${group.familyName}.`)
      return
    }

    if (
      records.some(
        (record) =>
          !record.archived &&
          groupKeyForRecord(record) === group.key &&
          record.strength === strength &&
          normalizeKeyPart(record.unit) === normalizeKeyPart(normalizedUnit),
      )
    ) {
      setFamilyStrengthFeedback((current) => ({
        ...current,
        [group.key]: {
          tone: 'error',
          message: `${group.familyName} ${strength} ${normalizedUnit} already exists in this product family.`,
        },
      }))
      setSyncMessage(`${group.familyName} ${strength}${normalizedUnit} already exists.`)
      return
    }

    const nextInventory = draft.inventoryOnHand === '' ? null : Number(draft.inventoryOnHand)
    const template = group.records[0]
    const nextRecord: CatalogInventoryRecord = {
      slug,
      sku: draft.sku.trim() || slug.toUpperCase(),
      displayName: group.familyName,
      fullName: group.familyFullName,
      strength,
      unit: normalizedUnit,
      collection: group.collection,
      researchCategory: group.researchCategory,
      formatType: group.formatType,
      summaryShort: group.summaryShort,
      summaryFull: group.summaryFull,
      researchFocusPoints: group.researchFocusPoints,
      listingNotes: group.listingNotes,
      coaNotRequired: group.coaNotRequired,
      status: getInventoryStatusFromCount(nextInventory, 'out_of_stock'),
      priceVial: draft.priceVial.trim(),
      inventoryOnHand: nextInventory,
      lowStockThreshold: draft.lowStockThreshold === '' ? null : Number(draft.lowStockThreshold),
      variantGroup: group.key,
      variantLabel: `${strength} ${normalizedUnit}`,
      promoLabel: '',
      promoDetail: '',
      featured: false,
      featuredOrder: null,
      publicVisible: draft.publicVisible,
      imageUrl: template.imageUrl,
      imageSource: template.imageSource,
      coaUrl: template.coaUrl,
      coaSource: template.coaSource,
      customProduct: true,
      archived: false,
    }

    const nextBaseRecords = [...baseRecords, nextRecord].sort((a, b) => a.displayName.localeCompare(b.displayName))
    const nextOverrides = {
      ...overrides,
      [slug]: {
        sku: nextRecord.sku,
        displayName: nextRecord.displayName,
        fullName: nextRecord.fullName,
        strength: nextRecord.strength,
        unit: nextRecord.unit,
        collection: nextRecord.collection,
        researchCategory: nextRecord.researchCategory,
        formatType: nextRecord.formatType,
        summaryShort: nextRecord.summaryShort,
        summaryFull: nextRecord.summaryFull,
        researchFocusPoints: nextRecord.researchFocusPoints,
        listingNotes: nextRecord.listingNotes,
        coaNotRequired: nextRecord.coaNotRequired,
        status: nextRecord.status,
        priceVial: nextRecord.priceVial,
        inventoryOnHand: nextRecord.inventoryOnHand,
        lowStockThreshold: nextRecord.lowStockThreshold,
        variantGroup: nextRecord.variantGroup,
        variantLabel: nextRecord.variantLabel,
        publicVisible: nextRecord.publicVisible,
        customProduct: true,
        archived: false,
      },
    }
    const nextRecords = applyCatalogInventoryOverrides(nextBaseRecords, nextOverrides)

    setAutoSyncStatus('saving')
    setAutoSyncing(true)
    setBaseRecords(nextBaseRecords)
    saveDraft(nextOverrides)
    setOverrides(nextOverrides)
    setFamilyStrengthDrafts((current) => ({
      ...current,
      [group.key]: {
        ...draft,
        strength: '',
        sku: '',
        priceVial: '',
        inventoryOnHand: '',
      },
    }))
    setExpandedFamilies((current) => ({
      ...current,
      [group.key]: true,
    }))
    setHighlightedStrengthFamily(group.key)
    setFamilyStrengthFeedback((current) => ({
      ...current,
      [group.key]: {
        tone: 'success',
        message: `${group.familyName} ${strength} ${normalizedUnit} added below. Saving across devices...`,
      },
    }))
    let saved = false
    let failureDetail = 'Please try again.'
    try {
      const response = await fetch('/api/admin/catalog-strength', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ record: nextRecord }),
      })
      const result = (await response.json()) as { ok?: boolean; error?: string; detail?: string }
      if (response.ok && result.ok) {
        saved = true
      } else {
        failureDetail = result.detail || result.error || failureDetail
      }
    } catch {
      failureDetail = 'The network save did not finish. Please try again.'
    }
    setAutoSyncing(false)
    if (saved) {
      setAutoSyncStatus('saved')
      setLastAutoSyncAt(new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }))
      const syncedOverrides = { ...nextOverrides }
      delete syncedOverrides[slug]
      saveDraft(syncedOverrides)
      setOverrides(syncedOverrides)
      setBaseRecords(nextRecords)
      setSyncMessage(`${group.familyName} ${strength} ${normalizedUnit} saved across devices.`)
      void loadSource(true)
      setFamilyStrengthFeedback((current) => ({
        ...current,
        [group.key]: {
          tone: 'success',
          message: `${group.familyName} ${strength} ${normalizedUnit} saved and synced across devices.`,
        },
      }))
    } else {
      setAutoSyncStatus('error')
      setFamilyStrengthFeedback((current) => ({
        ...current,
        [group.key]: {
          tone: 'error',
          message: `${group.familyName} ${strength} ${normalizedUnit} was added on this screen, but the shared save failed. ${failureDetail}`,
        },
      }))
      setSyncMessage(failureDetail)
    }
  }

  async function saveInventoryDefaults() {
    if (!settings) return
    setSavingSettings(true)
    setSettingsMessage('')
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inventoryDefaults: settings.inventoryDefaults }),
      })
      const result = (await response.json()) as { ok?: boolean; error?: string }
      if (!response.ok || !result.ok) {
        setSettingsMessage(result.error || 'Inventory settings could not be saved.')
        return
      }
      setSettingsMessage('Low-stock number saved.')
    } catch {
      setSettingsMessage('Inventory settings could not be saved.')
    } finally {
      setSavingSettings(false)
    }
  }

  function applySitewideLowStockThreshold() {
    const nextThreshold = settings?.inventoryDefaults.lowStockThreshold ?? 4
    for (const record of records) {
      updateRecord(record.slug, { lowStockThreshold: nextThreshold })
    }
    setSyncMessage(`Applied ${nextThreshold} as the low-stock number across the catalog. Sync when ready.`)
  }

  function exportCsv() {
    const blob = new Blob([buildCatalogCsv(records)], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'flexmed-catalog-admin.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  async function importCsv(file: File) {
    try {
      const text = await file.text()
      const rows = parseCsv(text)
      if (rows.length === 0) {
        setSyncMessage('That CSV was empty.')
        return
      }

      const recordMap = new Map(records.map((record) => [record.slug, record]))
      const nameStrengthMap = new Map(
        records.map((record) => [
          `${normalizeMatchText(getFamilyNameForRecord(record))}|${record.strength}|${normalizeMatchText(record.unit)}`,
          record,
        ]),
      )
      const next = { ...overrides }
      let importedCount = 0
      let skippedCount = 0

      for (const row of rows) {
        const slug = String(row.slug ?? '').trim()
        const displayName = String(row.display_name ?? row.displayName ?? '').trim()
        const fullName = String(row.full_name ?? row.fullName ?? '').trim()
        const strengthRaw = String(row.strength ?? row.strength_value ?? '').trim()
        const unitRaw = String(row.unit ?? '').trim()

        let existing = slug ? recordMap.get(slug) : undefined
        if (!existing) {
          const normalizedName = normalizeMatchText(displayName || fullName)
          const normalizedStrength = Number(strengthRaw)
          const normalizedUnit = normalizeMatchText(unitRaw || 'mg')
          if (normalizedName && Number.isFinite(normalizedStrength)) {
            existing = nameStrengthMap.get(`${normalizedName}|${normalizedStrength}|${normalizedUnit}`)
          }
        }

        if (!existing) {
          skippedCount += 1
          continue
        }

        const inventoryRaw = String(row.inventory_on_hand ?? '').trim()
        const lowStockRaw = String(row.low_stock_threshold ?? '').trim()
        const importedStatus = String(row.status ?? '').trim() as ProductStatus

        const nextInventory =
          inventoryRaw === '' ? existing.inventoryOnHand : Number.isFinite(Number(inventoryRaw)) ? Number(inventoryRaw) : existing.inventoryOnHand

        const nextPatch: CatalogInventoryOverride = {
          inventoryOnHand: nextInventory ?? null,
          status: getInventoryStatusFromCount(nextInventory ?? null, importedStatus || existing.status),
        }

        if (lowStockRaw !== '' && Number.isFinite(Number(lowStockRaw))) {
          nextPatch.lowStockThreshold = Number(lowStockRaw)
        }

        next[existing.slug] = {
          ...(next[existing.slug] ?? {}),
          ...nextPatch,
        }
        importedCount += 1
      }

      setAutoSyncStatus('pending')
      saveDraft(next)
      setOverrides(next)

      setSyncMessage(
        `Imported ${importedCount} inventory row${importedCount === 1 ? '' : 's'} from CSV${skippedCount ? `, skipped ${skippedCount}` : ''}. Review the counts, then sync when ready.`,
      )
    } catch (error) {
      setSyncMessage(error instanceof Error ? error.message : 'That CSV could not be imported.')
    }
  }

  const pushCatalogToSharedSource = useCallback(async (nextRecords: CatalogInventoryRecord[], successMessage: string) => {
    try {
      const response = await fetch('/api/catalog-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records: nextRecords }),
      })
      const result = (await response.json()) as { ok: boolean; code?: string; error?: string; detail?: string }

      if (response.ok && result.ok) {
        setBaseRecords(nextRecords)
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(CATALOG_ADMIN_DRAFT_STORAGE_KEY)
        }
        setOverrides({})
        setSyncMessage(successMessage)
        void loadSource(true)
        return true
      } else {
        setSyncMessage(
          result.detail || result.error || 'Catalog sync failed. The draft is still saved in this browser for now.',
        )
        return false
      }
    } catch {
      setSyncMessage('Catalog sync failed. The draft is still saved in this browser for now.')
      return false
    }
  }, [loadSource])

  async function syncCatalog() {
    setSyncing(true)
    setSyncMessage('')

    try {
      await pushCatalogToSharedSource(records, 'Catalog synced to the live source successfully.')
    } finally {
      setSyncing(false)
    }
  }

  useEffect(() => {
    if (loadingSource || !hasLocalDraftChanges) return

    if (autoSyncTimeoutRef.current) {
      window.clearTimeout(autoSyncTimeoutRef.current)
    }

    autoSyncTimeoutRef.current = window.setTimeout(async () => {
      setAutoSyncStatus('saving')
      setAutoSyncing(true)
      const saved = await pushCatalogToSharedSource(records, 'Inventory saved to the shared catalog.')
      setAutoSyncing(false)
      if (saved) {
        setAutoSyncStatus('saved')
        setLastAutoSyncAt(new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }))
      } else {
        setAutoSyncStatus('error')
      }
    }, 900)

    return () => {
      if (autoSyncTimeoutRef.current) {
        window.clearTimeout(autoSyncTimeoutRef.current)
        autoSyncTimeoutRef.current = null
      }
    }
  }, [hasLocalDraftChanges, loadingSource, pushCatalogToSharedSource, records])

  async function uploadAsset(slug: string, kind: 'image' | 'coa', file: File) {
    const formData = new FormData()
    formData.append('file', file)
    setAssetFeedback((current) => ({
      ...current,
      [slug]: {
        kind,
        tone: 'idle',
        message: kind === 'image' ? 'Uploading image...' : 'Uploading CoA...',
      },
    }))
    setSyncMessage(kind === 'image' ? `Uploading image for ${slug}...` : `Uploading CoA for ${slug}...`)

    try {
      const response = await fetch(`/api/admin/catalog-assets/${slug}/${kind}`, {
        method: 'POST',
        body: formData,
      })
      const result = (await response.json()) as { ok?: boolean; error?: string; detail?: string }
      if (!response.ok || !result.ok) {
        throw new Error(result.detail || result.error || `Unable to upload ${kind}.`)
      }
      const verificationResponse = await fetch(
        kind === 'image' ? `/api/catalog-assets/image/${slug}` : `/api/catalog-assets/coa/${slug}`,
        { cache: 'no-store' },
      )
      if (!verificationResponse.ok) {
        throw new Error(kind === 'image' ? 'Image upload saved, but the file could not be loaded afterward.' : 'CoA upload saved, but the file could not be loaded afterward.')
      }
      const uploadedAt = new Date().toISOString()
      const assetPatch =
        kind === 'image'
          ? ({
              imageUrl: `/api/catalog-assets/image/${slug}`,
              imageSource: 'uploaded',
              updatedAt: uploadedAt,
            } satisfies CatalogInventoryOverride)
          : ({
              coaUrl: `/coa/${slug}`,
              coaSource: 'uploaded',
              coaNotRequired: false,
              updatedAt: uploadedAt,
            } satisfies CatalogInventoryOverride)
      setBaseRecords((current) =>
        current.map((record) =>
          record.slug === slug
            ? {
                ...record,
                ...assetPatch,
              }
            : record,
        ),
      )
      setOverrides((current) => {
        const next = {
          ...current,
          [slug]: {
            ...(current[slug] ?? {}),
            ...assetPatch,
          },
        }
        saveDraft(next)
        return next
      })
      setAssetFeedback((current) => ({
        ...current,
        [slug]: {
          kind,
          tone: 'success',
          message: kind === 'image' ? 'Image updated.' : 'CoA updated and ready to view.',
        },
      }))
      setSyncMessage(kind === 'image' ? `Updated product image for ${slug}.` : `Updated CoA for ${slug}.`)
    } catch (error) {
      const message = error instanceof Error ? error.message : `Unable to upload ${kind}.`
      setAssetFeedback((current) => ({
        ...current,
        [slug]: {
          kind,
          tone: 'error',
          message,
        },
      }))
      setSyncMessage(message)
    }
  }

  function openProductImageEditor(record: CatalogInventoryRecord, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.currentTarget.value = ''
    if (!file) return

    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setAssetFeedback((current) => ({
        ...current,
        [record.slug]: {
          kind: 'image',
          tone: 'error',
          message: 'Use a PNG, JPG, JPEG, or WEBP image.',
        },
      }))
      return
    }

    if (productImageEditor?.previewUrl) URL.revokeObjectURL(productImageEditor.previewUrl)
    setAssetFeedback((current) => ({
      ...current,
      [record.slug]: {
        kind: 'image',
        tone: 'idle',
        message: 'Adjust the image, then save it.',
      },
    }))
    setProductImageEditor({
      slug: record.slug,
      displayName: record.displayName || record.fullName || record.slug,
      fileName: file.name,
      previewUrl: URL.createObjectURL(file),
    })
  }

  async function saveAdjustedProductImage(file: File) {
    if (!productImageEditor) return
    const slug = productImageEditor.slug
    await uploadAsset(slug, 'image', file)
    setProductImageEditor(null)
  }

  async function uploadCoAFiles(slug: string, files: File[]) {
    const supportedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp']
    const unsupportedFile = files.find((file) => !supportedTypes.includes(file.type))
    if (unsupportedFile) {
      const message = `${unsupportedFile.name} is not supported. Use PDF, PNG, JPG, JPEG, or WEBP files for CoA uploads.`
      setAssetFeedback((current) => ({
        ...current,
        [slug]: {
          kind: 'coa',
          tone: 'error',
          message,
        },
      }))
      setSyncMessage(message)
      return
    }

    setAssetFeedback((current) => ({
      ...current,
      [slug]: {
        kind: 'coa',
        tone: 'idle',
        message: files.length > 1 ? `Uploading ${files.length} CoA pages...` : 'Uploading CoA...',
      },
    }))
    setSyncMessage(files.length > 1 ? `Uploading ${files.length} CoA pages for ${slug}...` : `Uploading CoA for ${slug}...`)

    try {
      if (!supabase) {
        throw new Error('Supabase upload client is not configured in this browser.')
      }

      const prepareResponse = await fetch(`/api/admin/catalog-assets/${slug}/coa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'prepare_signed_uploads',
          files: files.map((file) => ({ name: file.name, type: file.type })),
        }),
      })

      const prepareResult = await readApiResponse<{
        uploads?: Array<{ fileName: string; objectName: string; path: string; token: string }>
      }>(prepareResponse)
      if (!prepareResponse.ok || !prepareResult.ok || !prepareResult.uploads) {
        throw new Error(prepareResult.detail || prepareResult.error || 'Unable to prepare CoA upload.')
      }

      for (const [index, file] of files.entries()) {
        const upload = prepareResult.uploads[index]
        if (!upload) throw new Error(`${file.name}: upload destination was not prepared.`)

        const { error } = await supabase.storage
          .from(CATALOG_COA_BUCKET)
          .uploadToSignedUrl(upload.path, upload.token, file, {
            contentType: file.type,
            upsert: true,
          })

        if (error) {
          throw new Error(`${file.name}: ${error.message}`)
        }
      }

      const finalizeResponse = await fetch(`/api/admin/catalog-assets/${slug}/coa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'finalize_signed_uploads',
          uploadedCount: files.length,
        }),
      })

      const result = await readApiResponse<{ uploadedCount?: number }>(finalizeResponse)
      if (!finalizeResponse.ok || !result.ok) {
        throw new Error(result.detail || result.error || 'Unable to finish CoA upload.')
      }

      const assetPatch = {
        coaUrl: `/coa/${slug}`,
        coaSource: 'uploaded',
        coaNotRequired: false,
        updatedAt: new Date().toISOString(),
      } satisfies CatalogInventoryOverride
      setBaseRecords((current) =>
        current.map((record) =>
          record.slug === slug
            ? {
                ...record,
                ...assetPatch,
              }
            : record,
        ),
      )
      setOverrides((current) => {
        const next = {
          ...current,
          [slug]: {
            ...(current[slug] ?? {}),
            ...assetPatch,
          },
        }
        saveDraft(next)
        return next
      })
      setAssetFeedback((current) => ({
        ...current,
        [slug]: {
          kind: 'coa',
          tone: 'success',
          message:
            files.length > 1
              ? `${files.length} CoA pages added and ready to view.`
              : 'CoA updated and ready to view.',
        },
      }))
      setSyncMessage(files.length > 1 ? `Added ${files.length} CoA pages for ${slug}.` : `Updated CoA for ${slug}.`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to upload CoA pages.'
      setAssetFeedback((current) => ({
        ...current,
        [slug]: {
          kind: 'coa',
          tone: 'error',
          message,
        },
      }))
      setSyncMessage(message)
    }
  }

  async function removeAsset(slug: string, kind: 'image' | 'coa') {
    setAssetFeedback((current) => ({
      ...current,
      [slug]: {
        kind,
        tone: 'idle',
        message: kind === 'image' ? 'Removing image...' : 'Removing CoA...',
      },
    }))
    setSyncMessage(kind === 'image' ? `Removing image for ${slug}...` : `Removing CoA for ${slug}...`)

    try {
      const response = await fetch(`/api/admin/catalog-assets/${slug}/${kind}`, {
        method: 'DELETE',
      })
      const result = (await response.json()) as { ok?: boolean; error?: string; detail?: string }
      if (!response.ok || !result.ok) {
        throw new Error(result.detail || result.error || `Unable to remove ${kind}.`)
      }
      const assetPatch =
        kind === 'image'
          ? ({
              imageUrl: '/products/front.png',
              imageSource: 'placeholder',
              updatedAt: new Date().toISOString(),
            } satisfies CatalogInventoryOverride)
          : ({
              coaUrl: null,
              coaSource: 'none',
              updatedAt: new Date().toISOString(),
            } satisfies CatalogInventoryOverride)
      setBaseRecords((current) =>
        current.map((record) =>
          record.slug === slug
            ? {
                ...record,
                ...assetPatch,
              }
            : record,
        ),
      )
      setOverrides((current) => {
        const next = {
          ...current,
          [slug]: {
            ...(current[slug] ?? {}),
            ...assetPatch,
          },
        }
        saveDraft(next)
        return next
      })
      setAssetFeedback((current) => ({
        ...current,
        [slug]: {
          kind,
          tone: 'success',
          message: kind === 'image' ? 'Image removed.' : 'CoA removed.',
        },
      }))
      setSyncMessage(kind === 'image' ? `Removed uploaded image for ${slug}.` : `Removed uploaded CoA for ${slug}.`)
    } catch (error) {
      const message = error instanceof Error ? error.message : `Unable to remove ${kind}.`
      setAssetFeedback((current) => ({
        ...current,
        [slug]: {
          kind,
          tone: 'error',
          message,
        },
      }))
      setSyncMessage(message)
    }
  }

  return (
    <AdminShell
      active="/admin/inventory"
      title="Inventory Workspace"
      description="Manage product families, strengths, pricing, and counts in one place. This is the main product and inventory control panel."
      purpose="Use this page to keep the marketplace current. Product families are listed alphabetically, strengths stay grouped underneath, and deeper listing details open only when the team needs them."
      workflow={[
        'Search for the product family you need to update.',
        'Move down the list and update the count inside each strength box.',
        'Use Info only when you need deeper details like price, SKU, image, CoA, or adding another strength.',
        'Add a new product at the top, or use Add Strength inside an existing product family.',
        'Check low-stock warnings before saving or syncing.',
        'Sync the current catalog state so the storefront reflects the latest admin changes.',
      ]}
      teamNotes={[
        'Use Add Listing for a brand-new product family, and Add Strength inside an existing family for another mg option.',
        'Purchase costs live in each strength\'s Info panel. Log every restock as a new purchase so the cost history stays complete; received purchases are never overwritten.',
        'The default view is meant for fast inventory counting, not deep product editing.',
        'Price, SKU, and count changes here become the public listing once the catalog is synced.',
        'Inventory status follows the count automatically, and Incoming only appears after a replenishment order is logged.',
        'If inventory is low, make sure the count and low-stock threshold are both set so the warning can show publicly.',
        'Use the Promos tab for any customer-facing offer, badge, banner, or free-shipping message.',
      ]}
    >
        {productImageEditor ? (
          <ImageAdjustmentDialog
            title={productImageEditor.displayName}
            fileName={productImageEditor.fileName}
            sourceUrl={productImageEditor.previewUrl}
            outputName={`${productImageEditor.slug}-product`}
            outputWidth={1200}
            outputHeight={1200}
            previewAspectRatio="1 / 1"
            onClose={() => setProductImageEditor(null)}
            onSave={(file) => saveAdjustedProductImage(file)}
          />
        ) : null}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
          {[
            ['Products', String(summary.total)],
            ['Visible', String(summary.visible)],
            ['In Stock', String(summary.inStock)],
            ['Incoming', String(summary.incoming)],
            ['Out of Stock', String(summary.outOfStock)],
            ['Low Stock', String(summary.lowStock)],
            ['Archived', String(summary.archived)],
          ].map(([label, value]) => (
            <div key={label} className="card" style={{ padding: '18px' }}>
              <div className="section-label">{label}</div>
              <div style={{ marginTop: '8px', fontSize: '26px', fontWeight: 600 }}>{value}</div>
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: '18px', display: 'grid', gap: '16px' }}>
          <div>
            <div className="section-label">Inventory Defaults</div>
            <div style={{ color: 'var(--text-secondary)', marginTop: '6px' }}>
              Set the number that counts as low stock. Right now founder wants 4 or less, but this can be changed any time.
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'end', flexWrap: 'wrap' }}>
            <div style={{ display: 'grid', gap: '8px' }}>
              <label className="section-label">Low Stock Number</label>
              <input
                type="number"
                min="0"
                value={settings?.inventoryDefaults.lowStockThreshold ?? 4}
                onChange={(e) =>
                  setSettings((current) => {
                    const fallbackSettings = getDefaultAdminSettings()
                    return {
                    inventoryDefaults: {
                      lowStockThreshold: Number(e.target.value || '0'),
                    },
                    checkoutOperations: current?.checkoutOperations ?? fallbackSettings.checkoutOperations,
                    businessDetails: current?.businessDetails ?? fallbackSettings.businessDetails,
                  }
                  })
                }
                style={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '12px 14px', fontSize: '14px', width: '140px' }}
              />
            </div>
            <button type="button" className="fm-btn-outline" onClick={saveInventoryDefaults} disabled={savingSettings}>
              {savingSettings ? 'Saving...' : 'Save Number'}
            </button>
            <button type="button" className="fm-btn-primary" onClick={applySitewideLowStockThreshold}>
              Apply to All Listings
            </button>
          </div>
          {settingsMessage ? <div style={{ color: 'var(--text-secondary)' }}>{settingsMessage}</div> : null}
        </div>

        <div className="card" style={{ padding: '18px', display: 'grid', gap: '16px' }}>
          <div>
            <div className="section-label">Add Listing</div>
            <div style={{ color: 'var(--text-secondary)', marginTop: '6px' }}>
              Add a brand-new product here. To add another strength for an existing product, use the Add Strength button inside that product family below.
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '12px' }}>
            <input value={newListingForm.displayName} onChange={(e) => setNewListingForm((current) => ({ ...current, displayName: e.target.value }))} placeholder="Listing name" style={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '12px 14px', fontSize: '14px' }} />
            <input value={newListingForm.fullName} onChange={(e) => setNewListingForm((current) => ({ ...current, fullName: e.target.value }))} placeholder="Full name" style={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '12px 14px', fontSize: '14px' }} />
            <input value={newListingForm.slug} onChange={(e) => setNewListingForm((current) => ({ ...current, slug: e.target.value }))} placeholder="Slug (optional)" style={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '12px 14px', fontSize: '14px' }} />
            <input value={newListingForm.sku} onChange={(e) => setNewListingForm((current) => ({ ...current, sku: e.target.value }))} placeholder="SKU" style={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '12px 14px', fontSize: '14px' }} />
            <input value={newListingForm.strength} onChange={(e) => setNewListingForm((current) => ({ ...current, strength: e.target.value }))} placeholder="Strength" type="number" min="0" style={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '12px 14px', fontSize: '14px' }} />
            <input value={newListingForm.unit} onChange={(e) => setNewListingForm((current) => ({ ...current, unit: e.target.value }))} placeholder="Unit" style={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '12px 14px', fontSize: '14px' }} />
            <select value={newListingForm.collection} onChange={(e) => setNewListingForm((current) => ({ ...current, collection: e.target.value as CatalogInventoryRecord['collection'] }))} style={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '12px 14px', fontSize: '14px' }}>
              {COLLECTION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <input value={newListingForm.researchCategory} onChange={(e) => setNewListingForm((current) => ({ ...current, researchCategory: e.target.value }))} placeholder="Research category" style={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '12px 14px', fontSize: '14px' }} />
            <select value={newListingForm.formatType} onChange={(e) => setNewListingForm((current) => ({ ...current, formatType: e.target.value }))} style={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '12px 14px', fontSize: '14px' }}>
              {FORMAT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <input value={newListingForm.priceVial} onChange={(e) => setNewListingForm((current) => ({ ...current, priceVial: e.target.value }))} placeholder="Price" style={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '12px 14px', fontSize: '14px' }} />
            <input value={newListingForm.inventoryOnHand} onChange={(e) => setNewListingForm((current) => ({ ...current, inventoryOnHand: e.target.value, status: getInventoryStatusFromCount(e.target.value === '' ? null : Number(e.target.value), current.status) }))} placeholder="Inventory count" type="number" min="0" style={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '12px 14px', fontSize: '14px' }} />
            <input value={newListingForm.lowStockThreshold} onChange={(e) => setNewListingForm((current) => ({ ...current, lowStockThreshold: e.target.value }))} placeholder="Low stock" type="number" min="0" style={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '12px 14px', fontSize: '14px' }} />
            <div style={{ display: 'grid', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
              Status follows count automatically.
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '13px' }}>
              <input type="checkbox" checked={newListingForm.publicVisible} onChange={(e) => setNewListingForm((current) => ({ ...current, publicVisible: e.target.checked }))} />
              Live on site after sync
            </label>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '13px' }}>
              <input type="checkbox" checked={newListingForm.coaNotRequired} onChange={(e) => setNewListingForm((current) => ({ ...current, coaNotRequired: e.target.checked }))} />
              No CoA needed
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" className="fm-btn-outline" onClick={resetNewListingForm}>
                Reset
              </button>
              <button type="button" className="fm-btn-primary" onClick={addListing}>
                Add Listing
              </button>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product, name, slug, or SKU"
              style={{
                flex: '1 1 320px',
                borderRadius: '14px',
                border: '1px solid var(--border)',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                padding: '12px 14px',
                fontSize: '14px',
              }}
            />
            <select
              value={collectionFilter}
              onChange={(e) => setCollectionFilter(e.target.value as 'all' | CatalogInventoryRecord['collection'])}
              style={{
                borderRadius: '14px',
                border: '1px solid var(--border)',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                padding: '12px 14px',
                fontSize: '14px',
              }}
            >
              <option value="all">All collections</option>
              {COLLECTION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '13px' }}>
              <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
              Show archived
            </label>
            <button type="button" className="fm-btn-outline" onClick={exportCsv}>
              Export CSV
            </button>
            <label className="fm-btn-outline" style={{ cursor: 'pointer' }}>
              Import CSV
              <input
                ref={importInputRef}
                type="file"
                accept=".csv,text/csv"
                style={{ display: 'none' }}
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) void importCsv(file)
                  event.currentTarget.value = ''
                }}
              />
            </label>
            <button
              type="button"
              className="fm-btn-primary"
              onClick={syncCatalog}
              disabled={syncing || autoSyncing}
              style={{ opacity: syncing || autoSyncing ? 0.7 : 1 }}
            >
              {syncing ? 'Syncing...' : autoSyncing ? 'Saving across devices...' : 'Sync to live catalog'}
            </button>
          </div>

          {loadingSource ? <div style={{ color: 'var(--text-muted)' }}>Loading shared catalog source…</div> : null}
          {autoSyncStatus !== 'idle' ? (
            <div
              style={{
                color:
                  autoSyncStatus === 'error'
                    ? '#f59e0b'
                    : autoSyncStatus === 'saved'
                      ? '#60a5fa'
                      : 'var(--text-secondary)',
                fontSize: '13px',
              }}
            >
              {autoSyncStatus === 'pending' ? 'Changes detected. Autosave will push this inventory across devices.' : null}
              {autoSyncStatus === 'saving' ? 'Saving inventory across devices...' : null}
              {autoSyncStatus === 'saved' ? `Saved across devices${lastAutoSyncAt ? ` at ${lastAutoSyncAt}` : ''}.` : null}
              {autoSyncStatus === 'error' ? 'Autosave could not finish. Your edits are still on this screen and can be synced again.' : null}
            </div>
          ) : null}
          {syncMessage ? <div style={{ color: 'var(--text-secondary)' }}>{syncMessage}</div> : null}
        </div>

        <div className="card" style={{ padding: '18px', display: 'grid', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: '14px', flexWrap: 'wrap' }}>
            <div>
              <div className="section-label">Featured carousel</div>
              <div style={{ color: 'var(--text-secondary)', marginTop: '6px', fontSize: '13px', maxWidth: '760px' }}>
                Choose the products that appear in the storefront featured-products carousel. Changes autosave and sync with the live catalog.
              </div>
            </div>
            <select
              value=""
              onChange={(event) => {
                const slug = event.target.value
                if (!slug) return
                updateRecord(slug, {
                  featured: true,
                  featuredOrder: featuredRecords.length + 1,
                })
              }}
              style={{
                minWidth: '260px',
                borderRadius: '14px',
                border: '1px solid var(--border)',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                padding: '12px 14px',
                fontSize: '14px',
              }}
            >
              <option value="">Add featured product...</option>
              {records
                .filter((record) => !record.archived && record.publicVisible && !record.featured)
                .sort((a, b) => a.displayName.localeCompare(b.displayName))
                .map((record) => (
                  <option key={record.slug} value={record.slug}>
                    {record.displayName} {getStrengthLabelForRecord(record)}
                  </option>
                ))}
            </select>
          </div>

          {featuredRecords.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
              No admin-selected featured products yet. The storefront will use the default featured list until one is selected here.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '10px' }}>
              {featuredRecords.map((record, index) => (
                <div
                  key={record.slug}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '56px minmax(0, 1fr) 120px auto',
                    gap: '12px',
                    alignItems: 'center',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    padding: '10px',
                    background: 'var(--bg-elevated)',
                  }}
                >
                  <div style={{ position: 'relative', width: '56px', height: '56px', borderRadius: '8px', overflow: 'hidden', background: 'var(--bg-card)' }}>
                    <Image src={record.imageUrl || '/products/front.png'} alt="" fill sizes="56px" style={{ objectFit: 'contain', padding: '4px' }} />
                  </div>
                  <div style={{ display: 'grid', gap: '3px', minWidth: 0 }}>
                    <strong style={{ color: 'var(--text-primary)' }}>{record.displayName}</strong>
                    <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                      {getStrengthLabelForRecord(record)} · {record.collection.replaceAll('_', ' ')}
                    </span>
                  </div>
                  <label style={{ display: 'grid', gap: '4px', color: 'var(--text-muted)', fontSize: '11px' }}>
                    Order
                    <input
                      type="number"
                      min="1"
                      value={record.featuredOrder ?? index + 1}
                      onChange={(event) => updateRecord(record.slug, { featuredOrder: Number(event.target.value || index + 1) })}
                      style={{
                        borderRadius: '10px',
                        border: '1px solid var(--border)',
                        background: 'var(--bg-card)',
                        color: 'var(--text-primary)',
                        padding: '9px 10px',
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    className="fm-btn-outline"
                    onClick={() => updateRecord(record.slug, { featured: false, featuredOrder: null })}
                    style={{ padding: '8px 12px', fontSize: '12px' }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card" style={{ padding: '18px', display: 'grid', gap: '16px' }}>
          <div>
            <div className="section-label">Product Families</div>
            <div style={{ color: 'var(--text-secondary)', marginTop: '6px' }}>
              Use this as the quick count sheet. Each family stays on one line, and each strength has its own count box. Press Info only when you need the deeper product controls.
            </div>
          </div>

          <div style={{ display: 'grid', gap: '16px' }}>
            {groupedRecords.length === 0 ? (
              <div style={{ color: 'var(--text-muted)' }}>No products match the current filters.</div>
            ) : (
              groupedRecords.map((group) => (
                <div key={group.key} className="card" style={{ padding: '16px', display: 'grid', gap: '14px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 280px) minmax(0, 1fr) auto', gap: '14px', alignItems: 'start' }}>
                    <div style={{ display: 'grid', gap: '10px' }}>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <strong style={{ color: 'var(--text-primary)', fontSize: '18px' }}>{group.familyName}</strong>
                        <span className="badge badge-blue">{group.collection.replaceAll('_', ' ')}</span>
                        <span className="badge badge-muted">{group.records.length} strength{group.records.length === 1 ? '' : 's'}</span>
                        {group.records.every((record) => record.archived) ? <span className="badge badge-muted">Archived</span> : null}
                      </div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                        {group.familyFullName}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'stretch' }}>
                        {group.records.map((record) => {
                          const effectiveThreshold = getEffectiveLowStockThreshold(record, settings?.inventoryDefaults.lowStockThreshold ?? 4)
                          const lowStock =
                            record.status === 'in_stock' &&
                            record.inventoryOnHand !== null &&
                            record.inventoryOnHand !== undefined &&
                            record.inventoryOnHand <= effectiveThreshold

                          return (
                            <div
                              key={`${record.slug}-summary`}
                              style={{
                                borderRadius: '10px',
                                border: '1px solid var(--border)',
                                background: 'var(--bg-card)',
                                color: 'var(--text-secondary)',
                                padding: '8px 9px',
                                fontSize: '12px',
                                display: 'grid',
                                gap: '6px',
                                minWidth: '96px',
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'center' }}>
                                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontSize: '12px' }}>
                                  {getStrengthLabelForRecord(record)}
                                </span>
                                <span
                                  style={{
                                    fontSize: '10px',
                                    color:
                                      record.status === 'incoming'
                                        ? 'var(--accent-500)'
                                        : record.status === 'out_of_stock'
                                          ? 'var(--text-muted)'
                                          : lowStock
                                            ? 'var(--amber)'
                                            : 'var(--text-muted)',
                                  }}
                                >
                                  {record.status === 'incoming' ? 'Incoming' : record.status === 'out_of_stock' ? 'Out of Stock' : lowStock ? 'Low Stock' : 'In Stock'}
                                </span>
                              </div>
                              <input
                                value={record.inventoryOnHand ?? ''}
                                onChange={(e) => updateRecord(record.slug, getInventoryPatchFromInput(e.target.value, record.status))}
                                type="number"
                                min="0"
                                placeholder="0"
                                style={{
                                  borderRadius: '10px',
                                  border: '1px solid var(--border)',
                                  background: 'var(--bg-base)',
                                  color: 'var(--text-primary)',
                                  padding: '8px 10px',
                                  fontSize: '14px',
                                  fontWeight: 600,
                                  width: '100%',
                                  boxSizing: 'border-box',
                                }}
                              />
                            </div>
                          )
                        })}
                      <button
                        type="button"
                        aria-label={`Add strength for ${group.familyName}`}
                        className="fm-btn-outline"
                        style={{
                          width: '40px',
                          minWidth: '40px',
                          height: '76px',
                          borderRadius: '10px',
                          padding: '0',
                          fontSize: '22px',
                          lineHeight: 1,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          alignSelf: 'stretch',
                        }}
                        onClick={() => {
                          updateFamilyStrengthDraft(group.key, {}, group)
                          setHighlightedStrengthFamily(group.key)
                          setExpandedFamilies((current) => ({
                            ...current,
                            [group.key]: true,
                          }))
                        }}
                      >
                        +
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      <button type="button" className="fm-btn-outline" style={{ padding: '8px 10px', fontSize: '12px' }} onClick={() => toggleFamily(group.key)}>
                        {expandedFamilies[group.key] ? 'Hide Info' : 'Info'}
                      </button>
                    </div>
                  </div>

                  {expandedFamilies[group.key] ? (
                    <>
                    <div style={{ display: 'grid', gap: '12px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr) minmax(220px, 1.2fr) 180px 220px 160px', gap: '10px' }}>
                        <div style={{ display: 'grid', gap: '6px' }}>
                          <label className="section-label">Listing Name</label>
                          <input
                            value={group.familyName}
                            onChange={(e) => updateFamily(group.key, { displayName: e.target.value })}
                            style={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '10px 12px', fontSize: '13px' }}
                          />
                        </div>
                        <div style={{ display: 'grid', gap: '6px' }}>
                          <label className="section-label">Full Name</label>
                          <input
                            value={group.familyFullName}
                            onChange={(e) => updateFamily(group.key, { fullName: e.target.value })}
                            style={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '10px 12px', fontSize: '13px' }}
                          />
                        </div>
                        <div style={{ display: 'grid', gap: '6px' }}>
                          <label className="section-label">Collection</label>
                          <select
                            value={group.collection}
                            onChange={(e) => updateFamily(group.key, { collection: e.target.value as CatalogInventoryRecord['collection'] })}
                            style={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '10px 12px', fontSize: '13px' }}
                          >
                            {COLLECTION_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div style={{ display: 'grid', gap: '6px' }}>
                          <label className="section-label">Research Area</label>
                          <input
                            value={group.researchCategory}
                            onChange={(e) => updateFamily(group.key, { researchCategory: e.target.value })}
                            style={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '10px 12px', fontSize: '13px' }}
                          />
                        </div>
                        <div style={{ display: 'grid', gap: '6px' }}>
                          <label className="section-label">Format</label>
                          <select
                            value={group.formatType}
                            onChange={(e) => updateFamily(group.key, { formatType: e.target.value })}
                            style={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '10px 12px', fontSize: '13px' }}
                          >
                            {FORMAT_OPTIONS.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="fm-btn-outline"
                          style={{ padding: '8px 10px', fontSize: '12px' }}
                          onClick={() => {
                            updateFamilyStrengthDraft(group.key, {}, group)
                            setHighlightedStrengthFamily(group.key)
                          }}
                        >
                          Add Strength
                        </button>
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '13px', padding: '8px 0' }}>
                          <input
                            type="checkbox"
                            checked={group.coaNotRequired}
                            onChange={(e) => updateFamily(group.key, { coaNotRequired: e.target.checked })}
                          />
                          No CoA needed for this product
                        </label>
                        {group.records.every((record) => record.archived) ? (
                          <button type="button" className="fm-btn-outline" style={{ padding: '8px 10px', fontSize: '12px' }} onClick={() => restoreFamily(group.key, group.familyName)}>
                            Restore Product
                          </button>
                        ) : (
                          <button type="button" className="fm-btn-outline" style={{ padding: '8px 10px', fontSize: '12px' }} onClick={() => archiveFamily(group.key, group.familyName)}>
                            Remove Product
                          </button>
                        )}
                      </div>

                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                          gap: '12px',
                        }}
                      >
                        <div style={{ display: 'grid', gap: '8px' }}>
                          <label className="section-label">Short Summary</label>
                          <textarea
                            value={group.summaryShort}
                            onChange={(e) => updateFamily(group.key, { summaryShort: e.target.value })}
                            rows={3}
                            style={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '10px 12px', fontSize: '13px', resize: 'vertical', minHeight: '88px' }}
                          />
                        </div>
                        <div style={{ display: 'grid', gap: '8px' }}>
                          <label className="section-label">Full Research Description</label>
                          <textarea
                            value={group.summaryFull}
                            onChange={(e) => updateFamily(group.key, { summaryFull: e.target.value })}
                            rows={4}
                            style={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '10px 12px', fontSize: '13px', resize: 'vertical', minHeight: '110px' }}
                          />
                        </div>
                        <div style={{ display: 'grid', gap: '8px' }}>
                          <label className="section-label">Research Focus Points</label>
                          <textarea
                            value={linesToMultiline(group.researchFocusPoints)}
                            onChange={(e) => updateFamily(group.key, { researchFocusPoints: multilineToLines(e.target.value) })}
                            rows={4}
                            placeholder={'One point per line\nMitochondrial signaling research\nMetabolic pathway studies'}
                            style={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '10px 12px', fontSize: '13px', resize: 'vertical', minHeight: '110px' }}
                          />
                        </div>
                        <div style={{ display: 'grid', gap: '8px' }}>
                          <label className="section-label">Listing Details</label>
                          <textarea
                            value={linesToMultiline(group.listingNotes)}
                            onChange={(e) => updateFamily(group.key, { listingNotes: multilineToLines(e.target.value) })}
                            rows={4}
                            placeholder={'One detail per line\nFormat: Vial\nListing amount: 10 mg'}
                            style={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '10px 12px', fontSize: '13px', resize: 'vertical', minHeight: '110px' }}
                          />
                        </div>
                      </div>

                    </div>
                  <div style={{ display: 'grid', gap: '10px' }}>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '150px 120px 120px 120px 120px 120px 120px 180px',
                        gap: '10px',
                        alignItems: 'center',
                        padding: '12px',
                        borderRadius: '12px',
                        border:
                          highlightedStrengthFamily === group.key
                            ? '2px solid rgba(42, 79, 174, 0.9)'
                            : '1px dashed var(--border)',
                        background:
                          highlightedStrengthFamily === group.key
                            ? 'rgba(42, 79, 174, 0.08)'
                            : 'var(--bg-elevated)',
                        boxShadow:
                          highlightedStrengthFamily === group.key
                            ? '0 0 0 3px rgba(42, 79, 174, 0.14)'
                            : 'none',
                        transition: 'border-color 160ms ease, background 160ms ease, box-shadow 160ms ease',
                      }}
                    >
                      <input
                        value={getFamilyStrengthDraft(group).strength}
                        onChange={(e) => updateFamilyStrengthDraft(group.key, { strength: e.target.value }, group)}
                        type="number"
                        min="0"
                        placeholder="New mg"
                        style={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '10px 12px', fontSize: '13px', width: '100%', boxSizing: 'border-box' }}
                      />
                      <input
                        value={getFamilyStrengthDraft(group).sku}
                        onChange={(e) => updateFamilyStrengthDraft(group.key, { sku: e.target.value }, group)}
                        placeholder="SKU"
                        style={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '10px 12px', fontSize: '13px', width: '100%', boxSizing: 'border-box' }}
                      />
                      <div style={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-muted)', padding: '10px 12px', fontSize: '13px' }}>
                        Out of Stock
                      </div>
                      <input
                        value={getFamilyStrengthDraft(group).priceVial}
                        onChange={(e) => updateFamilyStrengthDraft(group.key, { priceVial: e.target.value }, group)}
                        placeholder="$40"
                        style={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '10px 12px', fontSize: '13px', width: '100%', boxSizing: 'border-box' }}
                      />
                      <input
                        value={getFamilyStrengthDraft(group).inventoryOnHand}
                        onChange={(e) => updateFamilyStrengthDraft(group.key, { inventoryOnHand: e.target.value }, group)}
                        type="number"
                        min="0"
                        placeholder="0"
                        style={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '10px 12px', fontSize: '13px', width: '100%', boxSizing: 'border-box' }}
                      />
                      <input
                        value={getFamilyStrengthDraft(group).lowStockThreshold}
                        onChange={(e) => updateFamilyStrengthDraft(group.key, { lowStockThreshold: e.target.value }, group)}
                        type="number"
                        min="0"
                        style={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '10px 12px', fontSize: '13px', width: '100%', boxSizing: 'border-box' }}
                      />
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                        <input
                          type="checkbox"
                          checked={getFamilyStrengthDraft(group).publicVisible}
                          onChange={(e) => updateFamilyStrengthDraft(group.key, { publicVisible: e.target.checked }, group)}
                        />
                        Live
                      </label>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button type="button" className="fm-btn-primary" style={{ padding: '8px 10px', fontSize: '12px' }} onClick={() => addStrengthToFamily(group)}>
                          Save Strength
                        </button>
                      </div>
                    </div>
                    {familyStrengthFeedback[group.key] ? (
                      <div
                        style={{
                          borderRadius: '10px',
                          border:
                            familyStrengthFeedback[group.key]?.tone === 'success'
                              ? '1px solid rgba(59, 130, 246, 0.28)'
                              : '1px solid rgba(245, 158, 11, 0.28)',
                          background:
                            familyStrengthFeedback[group.key]?.tone === 'success'
                              ? 'rgba(59, 130, 246, 0.08)'
                              : 'rgba(245, 158, 11, 0.08)',
                          color:
                            familyStrengthFeedback[group.key]?.tone === 'success'
                              ? 'var(--accent)'
                              : 'var(--warning)',
                          padding: '10px 12px',
                          fontSize: '12px',
                        }}
                      >
                        {familyStrengthFeedback[group.key]?.message}
                      </div>
                    ) : null}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '150px 120px 120px 120px 120px 120px 120px 180px',
                        gap: '10px',
                        padding: '10px 12px',
                        borderRadius: '12px',
                        background: 'var(--bg-elevated)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11px',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: 'var(--text-muted)',
                      }}
                    >
                      <span>Strength</span>
                      <span>SKU</span>
                      <span>Status</span>
                      <span>Price</span>
                      <span>Inventory</span>
                      <span>Low Stock</span>
                      <span>Visible</span>
                      <span>Actions</span>
                    </div>

                    {group.records.map((record) => (
                      <div
                        key={record.slug}
                        style={{
                          display: 'grid',
                          gap: '12px',
                          padding: '12px',
                          borderRadius: '12px',
                          border: '1px solid var(--border)',
                          background: 'var(--bg-base)',
                        }}
                      >
                        {assetFeedback[record.slug] ? (
                          <div
                            style={{
                              borderRadius: '10px',
                              padding: '10px 12px',
                              fontSize: '12px',
                              color: '#ffffff',
                              background:
                                assetFeedback[record.slug]?.tone === 'error'
                                  ? 'linear-gradient(135deg, rgba(127,29,29,0.96), rgba(185,28,28,0.9))'
                                  : assetFeedback[record.slug]?.tone === 'success'
                                    ? 'linear-gradient(135deg, rgba(20,83,45,0.96), rgba(21,128,61,0.88))'
                                    : 'linear-gradient(135deg, rgba(30,64,175,0.92), rgba(14,116,144,0.86))',
                              border:
                                assetFeedback[record.slug]?.tone === 'error'
                                  ? '1px solid rgba(254,202,202,0.8)'
                                  : assetFeedback[record.slug]?.tone === 'success'
                                    ? '1px solid rgba(187,247,208,0.72)'
                                    : '1px solid rgba(191,219,254,0.68)',
                              boxShadow: '0 10px 24px rgba(0,0,0,0.22)',
                              fontWeight: 700,
                              lineHeight: 1.45,
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                            }}
                          >
                            {assetFeedback[record.slug]?.tone === 'error' ? 'Upload error: ' : ''}
                            {assetFeedback[record.slug]?.message}
                          </div>
                        ) : null}
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '150px 120px 120px 120px 120px 120px 120px 180px',
                            gap: '10px',
                            alignItems: 'center',
                          }}
                        >
                          <div style={{ display: 'grid', gap: '8px' }}>
                            <input
                              value={record.strength}
                              onChange={(e) => updateRecord(record.slug, { strength: Number(e.target.value || 0) })}
                              type="number"
                              min="0"
                              style={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '10px 12px', fontSize: '13px', width: '100%', boxSizing: 'border-box' }}
                            />
                            <input
                              value={record.unit}
                              onChange={(e) => updateRecord(record.slug, { unit: e.target.value })}
                              style={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-muted)', padding: '8px 10px', fontSize: '12px', width: '100%', boxSizing: 'border-box' }}
                            />
                          </div>
                          <input
                            value={record.sku}
                            onChange={(e) => updateRecord(record.slug, { sku: e.target.value })}
                            style={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '10px 12px', fontSize: '13px', width: '100%', boxSizing: 'border-box' }}
                          />
                          <div style={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: record.status === 'incoming' ? 'var(--accent-500)' : record.status === 'out_of_stock' ? 'var(--text-muted)' : 'var(--text-primary)', padding: '10px 12px', fontSize: '13px' }}>
                            {record.status === 'incoming' ? 'Incoming' : record.status === 'out_of_stock' ? 'Out of Stock' : 'In Stock'}
                          </div>
                          <input
                            value={record.priceVial}
                            onChange={(e) => updateRecord(record.slug, { priceVial: e.target.value })}
                            placeholder="$40"
                            style={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '10px 12px', fontSize: '13px', width: '100%', boxSizing: 'border-box' }}
                          />
                          <input
                            value={record.inventoryOnHand ?? ''}
                            onChange={(e) => updateRecord(record.slug, getInventoryPatchFromInput(e.target.value, record.status))}
                            type="number"
                            min="0"
                            style={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '10px 12px', fontSize: '13px', width: '100%', boxSizing: 'border-box' }}
                          />
                          <input
                            value={record.lowStockThreshold ?? ''}
                            onChange={(e) => updateRecord(record.slug, { lowStockThreshold: e.target.value === '' ? null : Number(e.target.value) })}
                            type="number"
                            min="0"
                            style={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '10px 12px', fontSize: '13px', width: '100%', boxSizing: 'border-box' }}
                          />
                          <div style={{ display: 'grid', gap: '8px' }}>
                            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                              <input type="checkbox" checked={record.publicVisible} onChange={(e) => updateRecord(record.slug, { publicVisible: e.target.checked })} />
                              Live
                            </label>
                            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                              <input type="checkbox" checked={record.coaNotRequired} onChange={(e) => updateRecord(record.slug, { coaNotRequired: e.target.checked })} />
                              No CoA
                            </label>
                          </div>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {record.archived ? (
                              <button type="button" className="fm-btn-outline" style={{ padding: '8px 10px', fontSize: '12px' }} onClick={() => restoreListing(record)}>
                                Restore
                              </button>
                            ) : (
                              <button type="button" className="fm-btn-outline" style={{ padding: '8px 10px', fontSize: '12px' }} onClick={() => removeStrength(record)}>
                                Remove
                              </button>
                            )}
                          </div>
                        </div>

                        <PurchaseLedger
                          slug={record.slug}
                          productName={record.displayName}
                          strengthLabel={getStrengthLabelForRecord(record)}
                          onHandNow={record.inventoryOnHand ?? null}
                          rows={purchaseRowsBySlug.get(record.slug) ?? []}
                          onChanged={refreshCosts}
                        />

                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '96px minmax(220px, 1fr) auto',
                            gap: '12px',
                            alignItems: 'center',
                            borderRadius: '12px',
                            background: 'var(--bg-elevated)',
                            border: '1px solid var(--border)',
                            padding: '12px',
                          }}
                        >
                          <div
                            style={{
                              position: 'relative',
                              width: '96px',
                              height: '96px',
                              borderRadius: '12px',
                              overflow: 'hidden',
                              background: '#fff',
                              border: '1px solid var(--border)',
                            }}
                          >
                            <Image src={record.imageUrl} alt={record.displayName} fill unoptimized style={{ objectFit: 'contain' }} />
                          </div>
                          <div style={{ display: 'grid', gap: '6px' }}>
                            <div className="section-label">Files for {getStrengthLabelForRecord(record)}</div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                              Image: {record.imageSource === 'uploaded' ? 'Uploaded override' : record.imageSource === 'placeholder' ? 'Placeholder' : 'Catalog default'}
                            </div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                              CoA: {record.coaNotRequired ? 'No CoA needed' : record.coaSource === 'uploaded' ? 'Uploaded CoA page set' : record.coaSource === 'packet' ? 'Packet fallback' : 'Pending'}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                            <label className="fm-btn-outline" style={{ padding: '8px 10px', fontSize: '12px', cursor: 'pointer' }}>
                              Update Image
                              <input
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                style={{ display: 'none' }}
                                onChange={(event) => openProductImageEditor(record, event)}
                              />
                            </label>
                            <button type="button" className="fm-btn-outline" style={{ padding: '8px 10px', fontSize: '12px' }} onClick={() => removeAsset(record.slug, 'image')}>
                              Remove Image
                            </button>
                            <label className="fm-btn-outline" style={{ padding: '8px 10px', fontSize: '12px', cursor: 'pointer' }}>
                              Add CoA Page(s)
                              <input
                                type="file"
                                accept="application/pdf,image/png,image/jpeg,image/webp"
                                multiple
                                style={{ display: 'none' }}
                                onChange={(e) => {
                                  const files = e.target.files ? Array.from(e.target.files) : []
                                  if (files.length > 0) uploadCoAFiles(record.slug, files)
                                  e.currentTarget.value = ''
                                }}
                              />
                            </label>
                            <button type="button" className="fm-btn-outline" style={{ padding: '8px 10px', fontSize: '12px' }} onClick={() => removeAsset(record.slug, 'coa')}>
                              Remove CoA
                            </button>
                            {record.coaUrl ? (
                              <a href={record.coaUrl} target="_blank" rel="noopener noreferrer" className="fm-btn-outline" style={{ padding: '8px 10px', fontSize: '12px', textDecoration: 'none' }}>
                                View CoA
                              </a>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                    </>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>

        <details className="card" style={{ overflow: 'hidden' }}>
          <summary
            style={{
              listStyle: 'none',
              cursor: 'pointer',
              padding: '16px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <div>
              <div className="section-label">Extra Row Cleanup</div>
              <div style={{ color: 'var(--text-secondary)', marginTop: '6px' }}>
                Use this only when you need direct row-by-row cleanup outside the main family cards.
              </div>
            </div>
            <span className="badge badge-muted">{filteredRecords.length} rows</span>
          </summary>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(360px, 2.2fr) 120px 110px 1fr 150px 120px 120px 120px 170px 150px',
                  gap: '12px',
              padding: '14px 18px',
              borderBottom: '1px solid var(--border)',
              background: 'var(--bg-elevated)',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
            }}
          >
                <span>Product</span>
                <span>Strength</span>
                <span>SKU</span>
                <span>Collection</span>
                <span>Status</span>
                <span>Price</span>
            <span>Inventory</span>
            <span>Low Stock</span>
            <span>Notes</span>
            <span>Listing</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filteredRecords.map((record) => (
              <div
                key={record.slug}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(360px, 2.2fr) 120px 110px 1fr 150px 120px 120px 120px 170px 150px',
                  gap: '12px',
                  padding: '14px 18px',
                  borderBottom: '1px solid var(--border)',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '64px minmax(0, 1fr)', gap: '12px', alignItems: 'start' }}>
                  <div
                    style={{
                      position: 'relative',
                      width: '64px',
                      height: '64px',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      background: '#fff',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <Image src={record.imageUrl} alt={record.displayName} fill unoptimized style={{ objectFit: 'contain' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: 0 }}>
                    <input
                      value={record.displayName}
                      onChange={(e) => updateRecord(record.slug, { displayName: e.target.value })}
                      style={{
                        borderRadius: '12px',
                        border: '1px solid var(--border)',
                        background: 'var(--bg-card)',
                        color: 'var(--text-primary)',
                        padding: '10px 12px',
                        fontSize: '14px',
                        fontWeight: 600,
                        width: '100%',
                        boxSizing: 'border-box',
                      }}
                    />
                    <input
                      value={record.fullName}
                      onChange={(e) => updateRecord(record.slug, { fullName: e.target.value })}
                      style={{
                        borderRadius: '12px',
                        border: '1px solid var(--border)',
                        background: 'var(--bg-card)',
                        color: 'var(--text-muted)',
                        padding: '10px 12px',
                        fontSize: '12px',
                        width: '100%',
                        boxSizing: 'border-box',
                      }}
                    />
                    <span style={{ color: 'var(--text-muted)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>{record.slug}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                      Image: {record.imageSource === 'uploaded' ? 'Uploaded override' : record.imageSource === 'placeholder' ? 'Placeholder' : 'Catalog default'}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'grid', gap: '8px' }}>
                  <input
                    value={record.strength}
                    onChange={(e) => updateRecord(record.slug, { strength: Number(e.target.value || 0) })}
                    type="number"
                    min="0"
                    style={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '10px 12px', fontSize: '13px', width: '100%', boxSizing: 'border-box' }}
                  />
                  <input
                    value={record.unit}
                    onChange={(e) => updateRecord(record.slug, { unit: e.target.value })}
                    style={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-muted)', padding: '8px 10px', fontSize: '12px', width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
                <input
                  value={record.sku}
                  onChange={(e) => updateRecord(record.slug, { sku: e.target.value })}
                  style={{
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    padding: '10px 12px',
                    fontSize: '13px',
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                />
                <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                  <select
                    value={record.collection}
                    onChange={(e) => updateRecord(record.slug, { collection: e.target.value as CatalogInventoryRecord['collection'] })}
                    style={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '10px 12px', fontSize: '13px', width: '100%', boxSizing: 'border-box' }}
                  >
                    {COLLECTION_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <input
                    value={record.researchCategory}
                    onChange={(e) => updateRecord(record.slug, { researchCategory: e.target.value })}
                    style={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-muted)', padding: '8px 10px', fontSize: '12px', width: '100%', boxSizing: 'border-box', marginTop: '6px' }}
                  />
                </div>
                <div
                  style={{
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-card)',
                    color: record.status === 'incoming' ? 'var(--accent-500)' : record.status === 'out_of_stock' ? 'var(--text-muted)' : 'var(--text-primary)',
                    padding: '10px 12px',
                    fontSize: '13px',
                  }}
                >
                  {record.status === 'incoming' ? 'Incoming' : record.status === 'out_of_stock' ? 'Out of Stock' : 'In Stock'}
                </div>
                <input
                  value={record.priceVial}
                  onChange={(e) => updateRecord(record.slug, { priceVial: e.target.value })}
                  placeholder="$40"
                  style={{
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    padding: '10px 12px',
                    fontSize: '13px',
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                />
                <input
                  value={record.inventoryOnHand ?? ''}
                  onChange={(e) =>
                    updateRecord(record.slug, {
                      ...getInventoryPatchFromInput(e.target.value, record.status),
                    })
                  }
                  type="number"
                  min="0"
                  style={{
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    padding: '10px 12px',
                    fontSize: '13px',
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                />
                <input
                  value={record.lowStockThreshold ?? ''}
                  onChange={(e) =>
                    updateRecord(record.slug, {
                      lowStockThreshold: e.target.value === '' ? null : Number(e.target.value),
                    })
                  }
                  type="number"
                  min="0"
                  placeholder="5"
                  style={{
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    padding: '10px 12px',
                    fontSize: '13px',
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                />
                <div style={{ display: 'grid', gap: '6px' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                    Image: {record.imageSource === 'uploaded' ? 'Uploaded override' : record.imageSource === 'placeholder' ? 'Placeholder' : 'Catalog default'}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                    CoA: {record.coaNotRequired ? 'No CoA needed' : record.coaSource === 'uploaded' ? 'Uploaded CoA page set' : record.coaSource === 'packet' ? 'Packet fallback' : 'Pending'}
                  </div>
                  {record.coaUrl ? (
                    <a href={record.coaUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-500)', fontSize: '12px', textDecoration: 'none' }}>
                      View CoA
                    </a>
                  ) : null}
                </div>
                <div style={{ display: 'grid', gap: '8px' }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                    <input
                      type="checkbox"
                      checked={record.publicVisible}
                      onChange={(e) => updateRecord(record.slug, { publicVisible: e.target.checked })}
                    />
                    Live Listing
                  </label>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                    <input
                      type="checkbox"
                      checked={record.archived}
                      onChange={(e) => updateRecord(record.slug, { archived: e.target.checked, publicVisible: e.target.checked ? false : record.publicVisible })}
                    />
                    Archived
                  </label>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                    <input
                      type="checkbox"
                      checked={record.coaNotRequired}
                      onChange={(e) => updateRecord(record.slug, { coaNotRequired: e.target.checked })}
                    />
                    No CoA needed
                  </label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {record.archived ? (
                      <button type="button" className="fm-btn-outline" style={{ padding: '8px 10px', fontSize: '12px' }} onClick={() => restoreListing(record)}>
                        Restore
                      </button>
                    ) : (
                      <button type="button" className="fm-btn-outline" style={{ padding: '8px 10px', fontSize: '12px' }} onClick={() => archiveListing(record)}>
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </details>

        <div className="card" style={{ padding: '18px', display: 'grid', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <div className="section-label">Purchase Cost Ledger</div>
              <div style={{ color: 'var(--text-secondary)', marginTop: '6px' }}>
                Every restock is its own row and stays on record. The current cost is the most recent received purchase; open a strength&apos;s Info panel to see its full history or log a restock.
              </div>
            </div>
            <a href="/admin/supply" className="fm-btn-outline" style={{ textDecoration: 'none' }}>
              Open Supply Orders
            </a>
          </div>

          <div style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
            {costLogs.length} purchases · {formatMoney(ledgerTotalSpend)} total paid
          </div>

          {ledgerSummaries.length === 0 ? (
            <div style={{ color: 'var(--text-muted)' }}>No purchases logged yet.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    <th style={{ padding: '8px 10px' }}>Product</th>
                    <th style={{ padding: '8px 10px' }}>Current cost / vial</th>
                    <th style={{ padding: '8px 10px' }}>Average paid / vial</th>
                    <th style={{ padding: '8px 10px' }}>Vials bought</th>
                    <th style={{ padding: '8px 10px' }}>Total paid</th>
                    <th style={{ padding: '8px 10px' }}>Purchases</th>
                    <th style={{ padding: '8px 10px' }}>Last purchase</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerSummaries.map(({ slug, productName, strengthLabel, summary }) => (
                    <tr key={slug} style={{ borderTop: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px' }}>
                        <strong style={{ color: 'var(--text-primary)' }}>{productName}</strong>
                        <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{strengthLabel}</div>
                      </td>
                      <td style={{ padding: '10px', color: 'var(--text-primary)', fontWeight: 600 }}>
                        {summary.currentUnitCost === null ? '—' : formatMoney(summary.currentUnitCost)}
                        {summary.currentBasis === 'ordered' ? (
                          <div style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 400 }}>ordered, not received yet</div>
                        ) : null}
                      </td>
                      <td style={{ padding: '10px', color: 'var(--text-secondary)' }}>{summary.averageUnitCost === null ? '—' : formatMoney(summary.averageUnitCost)}</td>
                      <td style={{ padding: '10px', color: 'var(--text-secondary)' }}>{summary.totalUnits}</td>
                      <td style={{ padding: '10px', color: 'var(--text-secondary)' }}>{formatMoney(summary.totalSpend)}</td>
                      <td style={{ padding: '10px', color: 'var(--text-secondary)' }}>{summary.entries}</td>
                      <td style={{ padding: '10px', color: 'var(--text-secondary)' }}>
                        {summary.lastPurchaseOn ?? '—'}
                        {summary.lastVendor ? <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{summary.lastVendor}</div> : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
    </AdminShell>
  )
}
