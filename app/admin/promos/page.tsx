'use client'

import Image from 'next/image'
import {
  BadgePercent,
  Check,
  Copy,
  Gift,
  ImageIcon,
  Megaphone,
  PanelTop,
  Pause,
  Pencil,
  Play,
  Save,
  Search,
  ShoppingCart,
  Trash2,
  Truck,
  View,
} from 'lucide-react'
import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { AdminShell } from '@/components/AdminShell'
import { ImageAdjustmentDialog } from '@/components/ImageAdjustmentDialog'
import type { CatalogInventoryRecord } from '@/lib/catalog-admin'
import { SITE_SETTINGS } from '@/lib/data-site'
import type {
  PromoDiscountType,
  PromoPlacement,
  SitePromoRecord,
} from '@/lib/site-promos'
import type { VialCaseRecord } from '@/lib/vial-cases'

type TargetMode = 'products' | 'vial_cases'
type AdminPromoSection = 'promos' | 'featured'

type PromoForm = {
  id: string
  title: string
  detail: string
  badgeLabel: string
  discountType: PromoDiscountType
  discountPercent: number
  buyQuantity: number
  getQuantity: number
  targetMode: TargetMode
  allProducts: boolean
  targetFamilyKeys: string[]
  targetSlugs: string[]
  targetVialCaseIds: string[]
  placements: Array<Exclude<PromoPlacement, 'product'>>
  popupImageUrl: string
  isActive: boolean
  startsAt: string
  endsAt: string
}

type ProductFamily = {
  key: string
  name: string
  products: CatalogInventoryRecord[]
}

const OFFER_OPTIONS: Array<{
  value: PromoDiscountType
  label: string
  icon: typeof BadgePercent
}> = [
  { value: 'percentage', label: 'Percent off', icon: BadgePercent },
  { value: 'bogo', label: 'Buy 1, get 1', icon: Gift },
  { value: 'free_shipping', label: 'Free shipping', icon: Truck },
  { value: 'announcement', label: 'Announcement', icon: Megaphone },
]

const PLACEMENT_OPTIONS: Array<{
  value: Exclude<PromoPlacement, 'product'>
  label: string
  detail: string
  icon: typeof PanelTop
}> = [
  { value: 'banner', label: 'Top banner', detail: 'Across the top of the site', icon: PanelTop },
  { value: 'popup', label: 'Arrival popup', detail: 'Shown once after age verification', icon: View },
  { value: 'checkout', label: 'Cart and checkout', detail: 'Shown beside savings and totals', icon: ShoppingCart },
]

function createEmptyForm(): PromoForm {
  return {
    id: '',
    title: '',
    detail: '',
    badgeLabel: '',
    discountType: 'percentage',
    discountPercent: 15,
    buyQuantity: 1,
    getQuantity: 1,
    targetMode: 'products',
    allProducts: false,
    targetFamilyKeys: [],
    targetSlugs: [],
    targetVialCaseIds: [],
    placements: ['banner'],
    popupImageUrl: '',
    isActive: true,
    startsAt: '',
    endsAt: '',
  }
}

function normalizeFamilyKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function stripStrength(value: string) {
  return value.replace(/\s+\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|iu)\b.*$/i, '').trim()
}

function getFamilyKey(product: CatalogInventoryRecord) {
  return normalizeFamilyKey(product.variantGroup || stripStrength(product.displayName))
}

function getFamilyName(product: CatalogInventoryRecord) {
  return product.variantGroup?.trim() || stripStrength(product.displayName) || product.displayName
}

function getStrengthLabel(record: CatalogInventoryRecord) {
  return record.variantLabel || `${record.strength} ${record.unit}`.trim()
}

function getEasternParts(date: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  return Object.fromEntries(parts.map((part) => [part.type, part.value]))
}

function isoToEasternInput(value: string | null) {
  if (!value) return ''
  const parts = getEasternParts(new Date(value))
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`
}

function easternInputToIso(value: string) {
  if (!value) return null
  const [datePart, timePart] = value.split('T')
  const [year, month, day] = datePart.split('-').map(Number)
  const [hour, minute] = timePart.split(':').map(Number)
  const desiredUtc = Date.UTC(year, month - 1, day, hour, minute, 0)
  let estimate = desiredUtc

  for (let iteration = 0; iteration < 3; iteration += 1) {
    const parts = getEasternParts(new Date(estimate))
    const representedUtc = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
      Number(parts.second),
    )
    estimate += desiredUtc - representedUtc
  }

  return new Date(estimate).toISOString()
}

function getOfferLabel(form: Pick<PromoForm, 'discountType' | 'discountPercent'>) {
  if (form.discountType === 'percentage') return `${form.discountPercent}% off`
  if (form.discountType === 'bogo') return 'Buy 1, get 1 free'
  if (form.discountType === 'free_shipping') return 'Free shipping'
  return 'Announcement'
}

function getDefaultBadge(form: Pick<PromoForm, 'discountType' | 'discountPercent'>) {
  if (form.discountType === 'percentage') return `${form.discountPercent}% OFF`
  if (form.discountType === 'bogo') return 'BOGO'
  if (form.discountType === 'free_shipping') return 'FREE SHIPPING'
  return 'SPECIAL'
}

function getLifecycle(promo: SitePromoRecord) {
  const now = Date.now()
  if (!promo.isActive) return 'Paused'
  if (promo.startsAt && Date.parse(promo.startsAt) > now) return 'Scheduled'
  if (promo.endsAt && Date.parse(promo.endsAt) <= now) return 'Expired'
  return 'Live'
}

function promoToForm(promo: SitePromoRecord): PromoForm {
  return {
    id: promo.id,
    title: promo.title,
    detail: promo.detail,
    badgeLabel: promo.badgeLabel,
    discountType: promo.discountType,
    discountPercent: promo.discountPercent ?? 15,
    buyQuantity: promo.buyQuantity,
    getQuantity: promo.getQuantity,
    targetMode: promo.promoKind === 'vial_cases' ? 'vial_cases' : 'products',
    allProducts: promo.promoKind === 'sitewide',
    targetFamilyKeys: promo.targetFamilyKeys,
    targetSlugs: promo.targetSlugs,
    targetVialCaseIds: promo.targetVialCaseIds,
    placements: promo.placements.filter(
      (placement): placement is Exclude<PromoPlacement, 'product'> => placement !== 'product',
    ),
    popupImageUrl: promo.popupImageUrl,
    isActive: promo.isActive,
    startsAt: isoToEasternInput(promo.startsAt),
    endsAt: isoToEasternInput(promo.endsAt),
  }
}

export default function AdminPromosPage() {
  const [products, setProducts] = useState<CatalogInventoryRecord[]>([])
  const [vialCases, setVialCases] = useState<VialCaseRecord[]>([])
  const [promos, setPromos] = useState<SitePromoRecord[]>([])
  const [activeSection, setActiveSection] = useState<AdminPromoSection>('promos')
  const [form, setForm] = useState<PromoForm>(createEmptyForm)
  const [search, setSearch] = useState('')
  const [expandedFamilyKey, setExpandedFamilyKey] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [popupImageFile, setPopupImageFile] = useState<File | null>(null)
  const [popupImagePreview, setPopupImagePreview] = useState('')
  const [popupImageEditorOpen, setPopupImageEditorOpen] = useState(false)
  const [featuredSaving, setFeaturedSaving] = useState(false)
  const [featuredReorderMode, setFeaturedReorderMode] = useState(false)
  const [featuredReorderSlugs, setFeaturedReorderSlugs] = useState<string[]>([])
  const [message, setMessage] = useState('')
  const [messageTone, setMessageTone] = useState<'success' | 'error'>('success')

  async function refreshPromos() {
    const response = await fetch('/api/admin/promos', { cache: 'no-store' })
    const result = (await response.json()) as { ok?: boolean; promos?: SitePromoRecord[]; error?: string }
    if (!response.ok || !result.ok) throw new Error(result.error || 'Promos could not be loaded.')
    setPromos(result.promos ?? [])
  }

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const [productsResponse, casesResponse, promosResponse] = await Promise.all([
          fetch('/api/catalog-source', { cache: 'no-store' }),
          fetch('/api/admin/vial-cases', { cache: 'no-store' }),
          fetch('/api/admin/promos', { cache: 'no-store' }),
        ])
        const productsResult = (await productsResponse.json()) as {
          ok?: boolean
          records?: CatalogInventoryRecord[]
        }
        const casesResult = (await casesResponse.json()) as {
          ok?: boolean
          cases?: VialCaseRecord[]
        }
        const promosResult = (await promosResponse.json()) as {
          ok?: boolean
          promos?: SitePromoRecord[]
          error?: string
        }

        if (!active) return
        if (productsResponse.ok && productsResult.ok) setProducts(productsResult.records ?? [])
        if (casesResponse.ok && casesResult.ok) setVialCases(casesResult.cases ?? [])
        if (promosResponse.ok && promosResult.ok) {
          setPromos(promosResult.promos ?? [])
        } else {
          setMessageTone('error')
          setMessage(promosResult.error || 'Promos could not be loaded.')
        }
      } catch (error) {
        if (active) {
          setMessageTone('error')
          setMessage(error instanceof Error ? error.message : 'Promo data could not be loaded.')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    return () => {
      if (popupImagePreview) URL.revokeObjectURL(popupImagePreview)
    }
  }, [popupImagePreview])

  const families = useMemo(() => {
    const map = new Map<string, ProductFamily>()
    for (const product of products) {
      if (product.archived || !product.publicVisible) continue
      const key = getFamilyKey(product)
      const current = map.get(key)
      if (current) current.products.push(product)
      else map.set(key, { key, name: getFamilyName(product), products: [product] })
    }
    return [...map.values()]
      .map((family) => ({
        ...family,
        products: family.products.sort((a, b) => a.strength - b.strength),
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [products])

  const filteredFamilies = useMemo(() => {
    const needle = search.trim().toLowerCase()
    if (!needle) return families
    return families.filter((family) =>
      `${family.name} ${family.products.map((product) => product.variantLabel || product.slug).join(' ')}`
        .toLowerCase()
        .includes(needle),
    )
  }, [families, search])

  const adminFeaturedRecords = useMemo(
    () =>
      products
        .filter((record) => record.featured && record.publicVisible && !record.archived)
        .sort((a, b) => {
          const orderA = a.featuredOrder ?? Number.MAX_SAFE_INTEGER
          const orderB = b.featuredOrder ?? Number.MAX_SAFE_INTEGER
          if (orderA !== orderB) return orderA - orderB
          return a.displayName.localeCompare(b.displayName)
        }),
    [products],
  )
  const defaultFeaturedRecords = useMemo(() => {
    const recordsBySlug = new Map(products.map((record) => [record.slug, record]))
    return SITE_SETTINGS.featuredProductSlugs
      .map((slug) => recordsBySlug.get(slug))
      .filter((record): record is CatalogInventoryRecord => Boolean(record && record.publicVisible && !record.archived))
  }, [products])
  const usingDefaultFeatured = adminFeaturedRecords.length === 0 && defaultFeaturedRecords.length > 0
  const featuredRecords = usingDefaultFeatured ? defaultFeaturedRecords : adminFeaturedRecords
  const displayedFeaturedSlugs = useMemo(() => new Set(featuredRecords.map((record) => record.slug)), [featuredRecords])
  const activeFeaturedReorderSlugs = useMemo(
    () => featuredReorderSlugs.filter((slug) => displayedFeaturedSlugs.has(slug)),
    [displayedFeaturedSlugs, featuredReorderSlugs],
  )
  const featuredReorderComplete = featuredReorderMode && featuredRecords.length > 0 && activeFeaturedReorderSlugs.length === featuredRecords.length
  const popupImageSrc = popupImagePreview || form.popupImageUrl

  const selectedProductCount = form.allProducts
    ? products.filter((product) => product.publicVisible && !product.archived).length
    : families.reduce((count, family) => {
        if (form.targetFamilyKeys.includes(family.key)) return count + family.products.length
        return count + family.products.filter((product) => form.targetSlugs.includes(product.slug)).length
      }, 0)

  function selectOffer(discountType: PromoDiscountType) {
    setForm((current) => ({
      ...current,
      discountType,
      allProducts: discountType === 'free_shipping' || discountType === 'announcement'
        ? true
        : current.allProducts,
    }))
  }

  function toggleFamily(family: ProductFamily) {
    setForm((current) => {
      const selected = current.targetFamilyKeys.includes(family.key)
      const familySlugs = new Set(family.products.map((product) => product.slug))
      return {
        ...current,
        allProducts: false,
        targetFamilyKeys: selected
          ? current.targetFamilyKeys.filter((key) => key !== family.key)
          : [...current.targetFamilyKeys, family.key],
        targetSlugs: current.targetSlugs.filter((slug) => !familySlugs.has(slug)),
      }
    })
  }

  function toggleStrength(family: ProductFamily, slug: string) {
    setForm((current) => {
      const familySlugs = family.products.map((product) => product.slug)
      const isFamilySelected = current.targetFamilyKeys.includes(family.key)
      const isStrengthSelected = current.targetSlugs.includes(slug)

      // Choosing one strength turns a family-wide selection into an exact
      // strength selection so a promo cannot spill across sibling variants.
      if (isFamilySelected) {
        return {
          ...current,
          allProducts: false,
          targetFamilyKeys: current.targetFamilyKeys.filter((key) => key !== family.key),
          targetSlugs: [
            ...current.targetSlugs.filter((item) => !familySlugs.includes(item)),
            slug,
          ],
        }
      }

      const nextSlugs = isStrengthSelected
        ? current.targetSlugs.filter((item) => item !== slug)
        : [...current.targetSlugs, slug]
      const selectedFamilySlugs = nextSlugs.filter((item) => familySlugs.includes(item))
      const nextFamilyKeys = current.targetFamilyKeys.filter((key) => key !== family.key)

      // Collapse a complete individual selection back to the family target.
      if (selectedFamilySlugs.length === familySlugs.length && familySlugs.length > 0) {
        return {
          ...current,
          allProducts: false,
          targetFamilyKeys: [...nextFamilyKeys, family.key],
          targetSlugs: nextSlugs.filter((item) => !familySlugs.includes(item)),
        }
      }

      return {
        ...current,
        allProducts: false,
        targetFamilyKeys: nextFamilyKeys,
        targetSlugs: nextSlugs,
      }
    })
  }

  function toggleVialCase(id: string) {
    setForm((current) => ({
      ...current,
      targetVialCaseIds: current.targetVialCaseIds.includes(id)
        ? current.targetVialCaseIds.filter((item) => item !== id)
        : [...current.targetVialCaseIds, id],
    }))
  }

  function togglePlacement(placement: Exclude<PromoPlacement, 'product'>) {
    setForm((current) => ({
      ...current,
      placements: current.placements.includes(placement)
        ? current.placements.filter((item) => item !== placement)
        : [...current.placements, placement],
    }))
  }

  function selectPopupImage(file: File | null) {
    if (!file) return
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setMessageTone('error')
      setMessage('Use a PNG, JPG, JPEG, or WEBP image for popup promos.')
      return
    }
    if (popupImagePreview) URL.revokeObjectURL(popupImagePreview)
    setPopupImageFile(file)
    setPopupImagePreview(URL.createObjectURL(file))
    setPopupImageEditorOpen(true)
    setMessage('')
    setForm((current) => ({
      ...current,
      placements: current.placements.includes('popup') ? current.placements : [...current.placements, 'popup'],
    }))
  }

  function clearPopupImage() {
    if (popupImagePreview) URL.revokeObjectURL(popupImagePreview)
    setPopupImageFile(null)
    setPopupImagePreview('')
    setPopupImageEditorOpen(false)
    setForm((current) => ({ ...current, popupImageUrl: '' }))
  }

  function applyAdjustedPopupImage(file: File) {
    if (popupImagePreview) URL.revokeObjectURL(popupImagePreview)
    setPopupImageFile(file)
    setPopupImagePreview(URL.createObjectURL(file))
    setPopupImageEditorOpen(false)
    setMessageTone('success')
    setMessage('Popup image adjusted. Save the promotion to sync it.')
  }

  async function uploadPopupImage(promoId: string) {
    if (!popupImageFile) return null
    const formData = new FormData()
    formData.append('file', popupImageFile)
    const response = await fetch(`/api/admin/promos/${promoId}/image`, {
      method: 'POST',
      body: formData,
    })
    const result = (await response.json()) as { ok?: boolean; imageUrl?: string; error?: string; detail?: string }
    if (!response.ok || !result.ok) {
      throw new Error(result.detail ? `${result.error} ${result.detail}` : result.error || 'Popup image could not be uploaded.')
    }
    return result.imageUrl ?? null
  }

  function validateForm() {
    if (form.discountType === 'percentage' && (form.discountPercent < 1 || form.discountPercent > 100)) {
      return 'Enter a discount from 1% to 100%.'
    }
    if (
      form.targetMode === 'products' &&
      !form.allProducts &&
      form.targetFamilyKeys.length === 0 &&
      form.targetSlugs.length === 0
    ) {
      return 'Choose at least one product.'
    }
    if (form.targetMode === 'vial_cases' && form.targetVialCaseIds.length === 0) {
      return 'Choose at least one vial case.'
    }
    if (form.placements.length === 0) return 'Choose where customers should see the promotion.'
    return null
  }

  async function savePromo() {
    const validationError = validateForm()
    if (validationError) {
      setMessageTone('error')
      setMessage(validationError)
      return
    }

    const offerLabel = getOfferLabel(form)
    const targetLabel = form.targetMode === 'vial_cases'
      ? 'vial cases'
      : form.allProducts
        ? 'all products'
        : `${selectedProductCount} selected product${selectedProductCount === 1 ? '' : 's'}`
    const title = form.title.trim() || `${offerLabel} — ${targetLabel}`
    const placements: PromoPlacement[] = [...form.placements]
    if (
      form.targetMode === 'products' &&
      (form.discountType === 'percentage' || form.discountType === 'bogo') &&
      !placements.includes('product')
    ) {
      placements.push('product')
    }

    setSaving(true)
    setMessage('')
    try {
      const response = await fetch('/api/admin/promos', {
        method: form.id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: form.id || undefined,
          title,
          detail: form.detail.trim(),
          promoKind: form.targetMode === 'vial_cases'
            ? 'vial_cases'
            : form.allProducts
              ? 'sitewide'
              : 'product_selection',
          placements,
          scope: form.allProducts ? 'sitewide' : form.targetMode,
          targetSlug: null,
          targetSlugs: form.allProducts ? [] : form.targetSlugs,
          targetFamilyKeys: form.allProducts ? [] : form.targetFamilyKeys,
          targetVialCaseIds: form.targetMode === 'vial_cases' ? form.targetVialCaseIds : [],
          badgeLabel: form.badgeLabel.trim() || getDefaultBadge(form),
          popupImageUrl: form.popupImageUrl.trim(),
          discountType: form.discountType,
          discountPercent: form.discountType === 'percentage' ? form.discountPercent : null,
          buyQuantity: form.discountType === 'bogo' ? 1 : form.buyQuantity,
          getQuantity: form.discountType === 'bogo' ? 1 : form.getQuantity,
          isActive: form.isActive,
          startsAt: easternInputToIso(form.startsAt),
          endsAt: easternInputToIso(form.endsAt),
        }),
      })
      const result = (await response.json()) as { ok?: boolean; promo?: SitePromoRecord | null; error?: string; detail?: string }
      if (!response.ok || !result.ok) {
        throw new Error(result.detail ? `${result.error} ${result.detail}` : result.error || 'Promo could not be saved.')
      }
      const savedId = result.promo?.id || form.id
      if (popupImageFile && savedId) await uploadPopupImage(savedId)
      setMessageTone('success')
      setMessage(popupImageFile ? 'Promotion saved with popup image and synced.' : form.id ? 'Promotion updated and synced.' : 'Promotion saved and synced.')
      setForm(createEmptyForm())
      if (popupImagePreview) URL.revokeObjectURL(popupImagePreview)
      setPopupImageFile(null)
      setPopupImagePreview('')
      setSearch('')
      await refreshPromos()
    } catch (error) {
      setMessageTone('error')
      setMessage(error instanceof Error ? error.message : 'Promo could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  async function updatePromo(promo: SitePromoRecord, changes: Partial<PromoForm>) {
    const next = { ...promoToForm(promo), ...changes }
    const placements: PromoPlacement[] = [...next.placements]
    if (
      next.targetMode === 'products' &&
      (next.discountType === 'percentage' || next.discountType === 'bogo') &&
      !placements.includes('product')
    ) {
      placements.push('product')
    }
    const response = await fetch('/api/admin/promos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: next.id,
        title: next.title,
        detail: next.detail,
        badgeLabel: next.badgeLabel || getDefaultBadge(next),
        discountType: next.discountType,
        discountPercent: next.discountType === 'percentage' ? next.discountPercent : null,
        buyQuantity: next.buyQuantity,
        getQuantity: next.getQuantity,
        promoKind: next.targetMode === 'vial_cases' ? 'vial_cases' : next.allProducts ? 'sitewide' : 'product_selection',
        placements,
        scope: next.allProducts ? 'sitewide' : next.targetMode,
        targetSlug: null,
        targetSlugs: next.allProducts ? [] : next.targetSlugs,
        targetFamilyKeys: next.allProducts ? [] : next.targetFamilyKeys,
        targetVialCaseIds: next.targetMode === 'vial_cases' ? next.targetVialCaseIds : [],
        popupImageUrl: next.popupImageUrl.trim(),
        isActive: next.isActive,
        startsAt: easternInputToIso(next.startsAt),
        endsAt: easternInputToIso(next.endsAt),
      }),
    })
    const result = (await response.json()) as { ok?: boolean; error?: string }
    if (!response.ok || !result.ok) throw new Error(result.error || 'Promo could not be updated.')
    await refreshPromos()
  }

  async function togglePromoActive(promo: SitePromoRecord) {
    try {
      await updatePromo(promo, { isActive: !promo.isActive })
      setMessageTone('success')
      setMessage(promo.isActive ? 'Promotion paused.' : 'Promotion activated.')
    } catch (error) {
      setMessageTone('error')
      setMessage(error instanceof Error ? error.message : 'Promo could not be updated.')
    }
  }

  function editPromo(promo: SitePromoRecord) {
    setForm(promoToForm(promo))
    if (popupImagePreview) URL.revokeObjectURL(popupImagePreview)
    setPopupImageFile(null)
    setPopupImagePreview('')
    setMessage('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function duplicatePromo(promo: SitePromoRecord) {
    setForm({ ...promoToForm(promo), id: '', title: `${promo.title} copy`, isActive: false })
    if (popupImagePreview) URL.revokeObjectURL(popupImagePreview)
    setPopupImageFile(null)
    setPopupImagePreview('')
    setMessageTone('success')
    setMessage('Copy loaded as paused. Review it, then save.')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function deletePromo(id: string) {
    if (!window.confirm('Delete this promotion permanently?')) return
    try {
      const response = await fetch('/api/admin/promos', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      const result = (await response.json()) as { ok?: boolean; error?: string }
      if (!response.ok || !result.ok) throw new Error(result.error || 'Promo could not be deleted.')
      if (form.id === id) setForm(createEmptyForm())
      setMessageTone('success')
      setMessage('Promotion deleted.')
      await refreshPromos()
    } catch (error) {
      setMessageTone('error')
      setMessage(error instanceof Error ? error.message : 'Promo could not be deleted.')
    }
  }

  async function syncFeaturedProducts(nextProducts: CatalogInventoryRecord[], successMessage = 'Featured carousel items saved and synced.') {
    setProducts(nextProducts)
    setFeaturedSaving(true)
    setMessage('')
    try {
      const response = await fetch('/api/catalog-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records: nextProducts }),
      })
      const result = (await response.json()) as { ok?: boolean; error?: string; detail?: string }
      if (!response.ok || !result.ok) {
        throw new Error(result.detail || result.error || 'Featured items could not be synced.')
      }
      setMessageTone('success')
      setMessage(successMessage)
      return true
    } catch (error) {
      setMessageTone('error')
      setMessage(error instanceof Error ? error.message : 'Featured items could not be synced.')
      return false
    } finally {
      setFeaturedSaving(false)
    }
  }

  async function updateFeaturedRecord(slug: string, changes: Partial<Pick<CatalogInventoryRecord, 'featured' | 'featuredOrder'>>) {
    const updatedAt = new Date().toISOString()
    const nextProducts = products.map((record) =>
      record.slug === slug
        ? {
            ...record,
            ...changes,
            updatedAt,
          }
        : record,
    )

    await syncFeaturedProducts(nextProducts)
  }

  async function makeDefaultFeaturedEditable(extraSlug?: string) {
    const selectedSlugs = new Set(defaultFeaturedRecords.map((record) => record.slug))
    if (extraSlug) selectedSlugs.add(extraSlug)
    const updatedAt = new Date().toISOString()
    const nextProducts = products.map((record) => {
      if (!selectedSlugs.has(record.slug)) return record.featured ? { ...record, featured: false, featuredOrder: null, updatedAt } : record
      const order = [...selectedSlugs].indexOf(record.slug) + 1
      return {
        ...record,
        featured: true,
        featuredOrder: order,
        updatedAt,
      }
    })

    await syncFeaturedProducts(
      nextProducts,
      extraSlug ? 'Default carousel copied and the new item was added.' : 'Default carousel copied into editable featured items.',
    )
  }

  function beginFeaturedReorder() {
    if (usingDefaultFeatured) {
      setMessageTone('error')
      setMessage('Make the current carousel editable before rearranging it.')
      return
    }
    setFeaturedReorderMode(true)
    setFeaturedReorderSlugs([])
    setMessageTone('success')
    setMessage('Rearrange mode is on. Click each item in the order it should appear.')
  }

  function cancelFeaturedReorder() {
    setFeaturedReorderMode(false)
    setFeaturedReorderSlugs([])
    setMessage('')
  }

  function toggleFeaturedReorderPick(slug: string) {
    if (!featuredReorderMode || featuredSaving || usingDefaultFeatured) return
    setFeaturedReorderSlugs((current) => {
      const visibleCurrent = current.filter((item) => displayedFeaturedSlugs.has(item))
      return visibleCurrent.includes(slug)
        ? visibleCurrent.filter((item) => item !== slug)
        : [...visibleCurrent, slug]
    })
  }

  async function saveFeaturedReorder() {
    if (!featuredReorderComplete) {
      setMessageTone('error')
      setMessage('Click every featured item once before saving the new order.')
      return
    }

    const orderBySlug = new Map(activeFeaturedReorderSlugs.map((slug, index) => [slug, index + 1]))
    const updatedAt = new Date().toISOString()
    const nextProducts = products.map((record) =>
      orderBySlug.has(record.slug)
        ? {
            ...record,
            featured: true,
            featuredOrder: orderBySlug.get(record.slug) ?? record.featuredOrder,
            updatedAt,
          }
        : record,
    )
    const saved = await syncFeaturedProducts(nextProducts, 'Featured carousel order saved and synced.')
    if (saved) {
      setFeaturedReorderMode(false)
      setFeaturedReorderSlugs([])
    }
  }

  return (
    <AdminShell
      active="/admin/promos"
      title="Promos and Offers"
      description="Choose the discount, select products, decide where it appears, and save."
    >
      <style jsx>{`
        .promo-form {
          display: grid;
          gap: 24px;
          padding: 22px;
        }
        .promo-section {
          display: grid;
          gap: 14px;
          padding-bottom: 24px;
          border-bottom: 1px solid var(--border);
        }
        .promo-section:last-child {
          padding-bottom: 0;
          border-bottom: 0;
        }
        .offer-row,
        .placement-row {
          display: flex;
          flex-wrap: wrap;
          gap: 9px;
        }
        .choice-button {
          min-height: 46px;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--bg-card);
          color: var(--text-secondary);
          padding: 10px 13px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          text-align: left;
        }
        .choice-button[data-selected='true'] {
          border-color: var(--accent-500);
          background: var(--amber-muted);
          color: var(--accent-500);
        }
        .choice-button:focus-visible,
        .promo-input:focus-visible,
        .icon-button:focus-visible {
          outline: 3px solid rgba(42, 79, 174, 0.22);
          outline-offset: 2px;
        }
        .amount-control {
          display: flex;
          align-items: center;
          gap: 10px;
          max-width: 230px;
        }
        .promo-input {
          width: 100%;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--bg-card);
          color: var(--text-primary);
          padding: 11px 12px;
          font: inherit;
        }
        .target-toolbar {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
        }
        .target-list {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 12px;
          max-height: 390px;
          overflow-y: auto;
          padding: 2px 4px 2px 2px;
          align-items: start;
          align-content: start;
          grid-auto-rows: max-content;
        }
        .target-button {
          min-height: 86px;
          height: auto;
          box-sizing: border-box;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--bg-card);
          color: var(--text-primary);
          padding: 10px 12px;
          cursor: pointer;
          text-align: left;
        }
        .target-list > .target-button {
          display: block;
          min-width: 0;
          width: 100%;
        }
        .target-button[data-selected='true'] {
          border-color: var(--accent-500);
          background: var(--amber-muted);
        }
        .target-family-toggle {
          flex: 1 1 auto;
          min-width: 0;
          min-height: 54px;
          border: 0;
          background: transparent;
          color: inherit;
          padding: 0;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          text-align: left;
        }
        .target-family-header {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
        }
        .target-family-select {
          flex: 0 0 auto;
          min-height: 34px;
          border: 1px solid var(--border);
          border-radius: 7px;
          background: var(--bg-elevated);
          color: var(--text-secondary);
          padding: 6px 9px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          font: inherit;
          font-size: 11px;
          white-space: nowrap;
        }
        .target-family-select[data-selected='true'] {
          border-color: var(--accent-500);
          background: var(--accent-500);
          color: #fff;
        }
        .target-strength-list {
          display: flex;
          width: 100%;
          min-width: 0;
          flex-wrap: wrap;
          gap: 6px;
          padding: 8px 0 12px;
          box-sizing: border-box;
          border-top: 1px solid var(--border);
        }
        .target-strength-button {
          border: 1px solid var(--border);
          border-radius: 999px;
          background: var(--bg-elevated);
          color: var(--text-secondary);
          padding: 6px 9px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          cursor: pointer;
          font: inherit;
          font-size: 12px;
        }
        .target-strength-button[data-selected='true'] {
          border-color: var(--accent-500);
          background: var(--accent-500);
          color: #fff;
        }
        .check-box {
          width: 19px;
          height: 19px;
          border-radius: 5px;
          border: 1px solid var(--border-strong);
          display: grid;
          place-items: center;
          flex: 0 0 auto;
        }
        [data-selected='true'] > .check-box {
          border-color: var(--accent-500);
          background: var(--accent-500);
          color: #fff;
        }
        .optional-settings {
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 14px;
        }
        .popup-image-panel {
          display: grid;
          grid-template-columns: 180px minmax(0, 1fr);
          gap: 14px;
          align-items: start;
          border: 1px solid var(--border);
          border-radius: 10px;
          background: var(--bg-elevated);
          padding: 14px;
        }
        .popup-image-panel[data-active='true'] {
          border-color: var(--accent-400);
          background: rgba(42, 79, 174, 0.06);
        }
        .popup-image-preview {
          aspect-ratio: 16 / 10;
          border-radius: 8px;
          border: 1px solid var(--border);
          background: linear-gradient(135deg, rgba(42, 79, 174, 0.13), rgba(99, 201, 212, 0.14));
          background-position: center;
          background-size: cover;
          display: grid;
          place-items: center;
          color: var(--text-muted);
          overflow: hidden;
        }
        .popup-image-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
        }
        .optional-settings summary {
          cursor: pointer;
          color: var(--text-primary);
          font-weight: 600;
        }
        .optional-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin-top: 14px;
        }
        .saved-list {
          display: grid;
          gap: 9px;
        }
        .saved-row {
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 15px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 14px;
          align-items: center;
        }
        .actions {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        .icon-button {
          width: 38px;
          height: 38px;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--bg-card);
          color: var(--text-secondary);
          display: grid;
          place-items: center;
          cursor: pointer;
        }
        .admin-subtabs {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 16px;
        }
        .admin-subtab {
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--bg-card);
          color: var(--text-secondary);
          padding: 10px 14px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }
        .admin-subtab[data-selected='true'] {
          border-color: var(--accent-500);
          background: var(--amber-muted);
          color: var(--accent-500);
        }
        .featured-grid {
          display: grid;
          gap: 10px;
        }
        .featured-controls {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          flex-wrap: wrap;
          gap: 10px;
        }
        .featured-reorder-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          border: 1px solid var(--amber-border);
          border-radius: 10px;
          background: var(--amber-muted);
          padding: 12px 14px;
          color: var(--text-secondary);
          font-size: 13px;
        }
        .featured-reorder-actions {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
        }
        .featured-row {
          display: grid;
          grid-template-columns: 56px minmax(180px, 1fr) minmax(92px, 110px) minmax(112px, max-content);
          gap: 12px;
          align-items: center;
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 10px;
          background: var(--bg-elevated);
        }
        .featured-row[data-reorder-mode='true'] {
          cursor: pointer;
          transition: border-color 0.18s ease, background-color 0.18s ease;
        }
        .featured-row[data-reorder-mode='true']:hover,
        .featured-row[data-reorder-selected='true'] {
          border-color: var(--accent-400);
          background: rgba(42, 79, 174, 0.08);
        }
        .featured-row[data-reorder-mode='true']:focus-visible {
          outline: 3px solid rgba(42, 79, 174, 0.22);
          outline-offset: 2px;
        }
        .featured-order-field {
          display: grid;
          gap: 4px;
          min-width: 0;
          color: var(--text-muted);
          font-size: 11px;
        }
        .featured-order-input {
          width: 100%;
          min-width: 0;
          box-sizing: border-box;
          border-radius: 8px;
          border: 1px solid var(--border);
          background: var(--bg-card);
          color: var(--text-primary);
          padding: 9px 10px;
        }
        .featured-remove-button {
          justify-self: end;
          white-space: nowrap;
          padding: 8px 12px;
          font-size: 12px;
        }
        .featured-rank-pill {
          justify-self: start;
          white-space: nowrap;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--bg-card);
          color: var(--text-secondary);
          padding: 8px 10px;
          font-size: 12px;
          font-weight: 700;
        }
        .featured-rank-pill[data-selected='true'] {
          border-color: var(--accent-500);
          background: var(--accent-500);
          color: #fff;
        }
        @media (max-width: 680px) {
          .promo-form {
            padding: 16px;
          }
          .optional-grid,
          .saved-row,
          .popup-image-panel,
          .featured-row {
            grid-template-columns: 1fr;
          }
          .target-list {
            grid-template-columns: 1fr;
          }
          .target-family-header {
            align-items: stretch;
          }
          .target-family-select {
            align-self: center;
          }
          .target-strength-list {
            padding-left: 0;
          }
          .featured-controls {
            width: 100%;
            justify-content: stretch;
          }
          .featured-controls > * {
            flex: 1 1 100%;
          }
          .featured-order-field {
            max-width: 150px;
          }
          .featured-remove-button {
            justify-self: start;
          }
        }
      `}</style>

      {popupImageEditorOpen && popupImageSrc ? (
        <ImageAdjustmentDialog
          title="Popup promo image"
          fileName={popupImageFile?.name || 'Current popup image'}
          sourceUrl={popupImageSrc}
          outputName={`${form.title || form.badgeLabel || 'promo-popup'}-popup`}
          outputWidth={1600}
          outputHeight={1000}
          previewAspectRatio="16 / 10"
          onClose={() => setPopupImageEditorOpen(false)}
          onSave={(file) => applyAdjustedPopupImage(file)}
        />
      ) : null}

      <div className="admin-subtabs" role="tablist" aria-label="Promos workspace">
        <button
          type="button"
          role="tab"
          className="admin-subtab"
          data-selected={activeSection === 'promos'}
          aria-selected={activeSection === 'promos'}
          onClick={() => setActiveSection('promos')}
        >
          Promos and Offers
        </button>
        <button
          type="button"
          role="tab"
          className="admin-subtab"
          data-selected={activeSection === 'featured'}
          aria-selected={activeSection === 'featured'}
          onClick={() => setActiveSection('featured')}
        >
          Featured Items
        </button>
      </div>

      {activeSection === 'promos' ? (
      <>
      <div className="card promo-form">
        <section className="promo-section">
          <SectionTitle title="1. Choose the offer" detail="Percentage off is the normal option." />
          <div className="offer-row">
            {OFFER_OPTIONS.map((option) => {
              const Icon = option.icon
              return (
                <button
                  key={option.value}
                  type="button"
                  className="choice-button"
                  data-selected={form.discountType === option.value}
                  aria-pressed={form.discountType === option.value}
                  onClick={() => selectOffer(option.value)}
                >
                  <Icon size={17} aria-hidden="true" />
                  {option.label}
                </button>
              )
            })}
          </div>

          {form.discountType === 'percentage' ? (
            <label style={fieldLabelStyle}>
              Discount amount
              <div className="amount-control">
                <input
                  className="promo-input"
                  type="number"
                  min="1"
                  max="100"
                  step="1"
                  value={form.discountPercent}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, discountPercent: Number(event.target.value) }))
                  }
                />
                <strong style={{ fontSize: '17px' }}>% off</strong>
              </div>
            </label>
          ) : null}
        </section>

        <section className="promo-section">
          <SectionTitle title="2. Choose where it appears" detail="Select one or more. Popup images show only on arrival popups." />
          <div className="placement-row">
            {PLACEMENT_OPTIONS.map((option) => {
              const Icon = option.icon
              const selected = form.placements.includes(option.value)
              return (
                <button
                  key={option.value}
                  type="button"
                  className="choice-button"
                  data-selected={selected}
                  aria-pressed={selected}
                  onClick={() => togglePlacement(option.value)}
                >
                  <span className="check-box">{selected ? <Check size={13} /> : null}</span>
                  <Icon size={17} aria-hidden="true" />
                  <span>
                    <strong style={{ display: 'block' }}>{option.label}</strong>
                    <span style={{ fontSize: '12px' }}>{option.detail}</span>
                  </span>
                </button>
              )
            })}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
            Discounted prices will automatically appear on the selected product listings.
          </div>
          <div className="popup-image-panel" data-active={form.placements.includes('popup')}>
            <div
              className="popup-image-preview"
              style={popupImageSrc ? { backgroundImage: `url(${popupImageSrc})` } : undefined}
              aria-label={popupImageSrc ? 'Popup promo image preview' : 'No popup promo image selected'}
            >
              {!popupImageSrc ? <ImageIcon size={26} aria-hidden="true" /> : null}
            </div>
            <div style={{ display: 'grid', gap: '10px', minWidth: 0 }}>
              <div>
                <strong style={{ display: 'block' }}>Popup image</strong>
                <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                  Optional image for arrival popups. Select Arrival popup above, then upload or paste an image URL.
                </span>
              </div>
              <label style={fieldLabelStyle}>
                Image URL
                <input
                  className="promo-input"
                  value={form.popupImageUrl}
                  onChange={(event) => {
                    if (popupImagePreview) URL.revokeObjectURL(popupImagePreview)
                    setPopupImageFile(null)
                    setPopupImagePreview('')
                    setForm((current) => ({ ...current, popupImageUrl: event.target.value }))
                  }}
                  placeholder="https://..."
                />
              </label>
              <div className="popup-image-actions">
                <label className="fm-btn-outline" style={{ cursor: 'pointer' }}>
                  <ImageIcon size={16} aria-hidden="true" style={{ marginRight: '8px' }} />
                  Choose image
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    style={{ display: 'none' }}
                    onChange={(event) => selectPopupImage(event.target.files?.[0] ?? null)}
                  />
                </label>
                {popupImageSrc ? (
                  <button type="button" className="fm-btn-outline" onClick={() => setPopupImageEditorOpen(true)}>
                    Adjust image
                  </button>
                ) : null}
                {popupImageSrc ? (
                  <button type="button" className="fm-btn-outline" onClick={clearPopupImage}>
                    Remove image
                  </button>
                ) : null}
                {popupImageFile ? (
                  <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                    {popupImageFile.name} will upload when saved.
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <section className="promo-section">
          <SectionTitle
            title="3. Choose products"
            detail={
              form.targetMode === 'products'
                ? `${selectedProductCount} product famil${selectedProductCount === 1 ? 'y' : 'ies'} selected`
                : `${form.targetVialCaseIds.length} vial case${form.targetVialCaseIds.length === 1 ? '' : 's'} selected`
            }
          />

          <div className="offer-row">
            <button
              type="button"
              className="choice-button"
              data-selected={form.targetMode === 'products'}
              onClick={() => setForm((current) => ({ ...current, targetMode: 'products' }))}
            >
              Products
            </button>
            <button
              type="button"
              className="choice-button"
              data-selected={form.targetMode === 'vial_cases'}
              onClick={() => setForm((current) => ({ ...current, targetMode: 'vial_cases', allProducts: false }))}
            >
              Vial cases
            </button>
          </div>

          {form.targetMode === 'products' ? (
            <>
              <div className="target-toolbar">
                <button
                  type="button"
                  className="choice-button"
                  data-selected={form.allProducts}
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      allProducts: !current.allProducts,
                      targetFamilyKeys: [],
                      targetSlugs: [],
                    }))
                  }
                >
                  <span className="check-box">{form.allProducts ? <Check size={13} /> : null}</span>
                  All products
                </button>
                {!form.allProducts ? (
                  <label style={{ position: 'relative', flex: '1 1 280px', maxWidth: '420px' }}>
                    <Search
                      size={16}
                      aria-hidden="true"
                      style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-muted)',
                      }}
                    />
                    <span className="sr-only">Search products</span>
                    <input
                      className="promo-input"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search products"
                      style={{ paddingLeft: '37px' }}
                    />
                  </label>
                ) : null}
              </div>

              {!form.allProducts ? (
                <div className="target-list">
                  {filteredFamilies.map((family) => {
                    const selected =
                      form.targetFamilyKeys.includes(family.key) ||
                      family.products.some((product) => form.targetSlugs.includes(product.slug))
                    return (
                      <div
                        key={family.key}
                        className="target-button"
                        data-selected={selected}
                      >
                        <div className="target-family-header">
                          <button
                            type="button"
                            className="target-family-toggle"
                            aria-expanded={expandedFamilyKey === family.key}
                            onClick={() => setExpandedFamilyKey((current) => (current === family.key ? null : family.key))}
                          >
                            <span style={{ minWidth: 0 }}>
                              <strong style={{ display: 'block' }}>{family.name}</strong>
                              <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                                {expandedFamilyKey === family.key ? 'Choose strengths below' : `${family.products.length} strength${family.products.length === 1 ? '' : 's'}`}
                              </span>
                            </span>
                          </button>
                          <button
                            type="button"
                            className="target-family-select"
                            data-selected={form.targetFamilyKeys.includes(family.key)}
                            aria-pressed={form.targetFamilyKeys.includes(family.key)}
                            onClick={() => toggleFamily(family)}
                          >
                            <span className="check-box">{form.targetFamilyKeys.includes(family.key) ? <Check size={13} /> : null}</span>
                            All
                          </button>
                        </div>
                        {expandedFamilyKey === family.key ? (
                          <div className="target-strength-list" aria-label={`${family.name} strengths`}>
                            {family.products.map((product) => {
                              const strengthSelected =
                                form.targetFamilyKeys.includes(family.key) || form.targetSlugs.includes(product.slug)
                              const strengthLabel = getStrengthLabel(product)
                              return (
                                <button
                                  key={product.slug}
                                  type="button"
                                  className="target-strength-button"
                                  data-selected={strengthSelected}
                                  aria-pressed={strengthSelected}
                                  onClick={() => toggleStrength(family, product.slug)}
                                >
                                  {strengthSelected ? <Check size={12} aria-hidden="true" /> : null}
                                  {strengthLabel}
                                </button>
                              )
                            })}
                          </div>
                        ) : null}
                      </div>
                    )
                  })}
                </div>
              ) : null}
            </>
          ) : (
            <div className="target-list">
              {vialCases.filter((item) => !item.archived).map((item) => {
                const selected = form.targetVialCaseIds.includes(item.id)
                return (
                  <button
                    key={item.id}
                    type="button"
                    className="target-button"
                    data-selected={selected}
                    aria-pressed={selected}
                    onClick={() => toggleVialCase(item.id)}
                  >
                    <span className="check-box">{selected ? <Check size={13} /> : null}</span>
                    <span>
                      <strong style={{ display: 'block' }}>{item.name}</strong>
                      <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{item.priceLabel}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </section>

        <section className="promo-section">
          <details className="optional-settings">
            <summary>Optional message and schedule</summary>
            <div className="optional-grid">
              <label style={fieldLabelStyle}>
                Promotion name
                <input
                  className="promo-input"
                  value={form.title}
                  onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                  placeholder={`${getOfferLabel(form)} — selected products`}
                />
              </label>
              <label style={fieldLabelStyle}>
                Short message
                <input
                  className="promo-input"
                  value={form.detail}
                  onChange={(event) => setForm((current) => ({ ...current, detail: event.target.value }))}
                  placeholder="Limited-time research special"
                />
              </label>
              <label style={fieldLabelStyle}>
                Start date and time
                <input
                  className="promo-input"
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={(event) => setForm((current) => ({ ...current, startsAt: event.target.value }))}
                />
              </label>
              <label style={fieldLabelStyle}>
                End date and time
                <input
                  className="promo-input"
                  type="datetime-local"
                  value={form.endsAt}
                  onChange={(event) => setForm((current) => ({ ...current, endsAt: event.target.value }))}
                />
              </label>
              <label style={{ display: 'inline-flex', gap: '9px', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
                />
                Make active after saving
              </label>
            </div>
          </details>

          {message ? (
            <div
              role={messageTone === 'error' ? 'alert' : 'status'}
              style={{
                borderRadius: '8px',
                padding: '11px 13px',
                background: messageTone === 'error' ? 'rgba(180,35,24,0.08)' : 'rgba(5,150,105,0.08)',
                color: messageTone === 'error' ? '#b42318' : '#047857',
                lineHeight: 1.6,
              }}
            >
              {message}
            </div>
          ) : null}

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button type="button" className="fm-btn-primary" disabled={saving || loading} onClick={savePromo}>
              <Save size={16} aria-hidden="true" style={{ marginRight: '8px' }} />
              {saving ? 'Saving...' : form.id ? 'Update Promotion' : 'Save Promotion'}
            </button>
            <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
              {getOfferLabel(form)} ·{' '}
              {form.targetMode === 'vial_cases'
                ? `${form.targetVialCaseIds.length} vial cases`
                : form.allProducts
                  ? 'all products'
                  : `${selectedProductCount} product${selectedProductCount === 1 ? '' : 's'}`}
            </span>
            {form.id ? (
              <button
                type="button"
                className="fm-btn-outline"
                onClick={() => {
                  setForm(createEmptyForm())
                  setMessage('')
                }}
              >
                Cancel edit
              </button>
            ) : null}
          </div>
        </section>
      </div>

      <section style={{ display: 'grid', gap: '12px', marginTop: '24px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '21px' }}>Saved promotions</h2>
          <p style={{ margin: '5px 0 0', color: 'var(--text-secondary)' }}>
            Edit, copy, pause, or delete existing promotions.
          </p>
        </div>
        <div className="saved-list">
          {loading ? (
            <div className="card" style={{ padding: '17px', color: 'var(--text-muted)' }}>Loading promotions...</div>
          ) : promos.length === 0 ? (
            <div className="card" style={{ padding: '17px', color: 'var(--text-muted)' }}>
              No promotions have been saved yet.
            </div>
          ) : (
            promos.map((promo) => {
              const lifecycle = getLifecycle(promo)
              return (
                <article key={promo.id} className="saved-row">
                  <div style={{ display: 'grid', gap: '6px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <strong>{promo.title}</strong>
                      <span className={`badge ${lifecycle === 'Live' ? 'badge-green' : lifecycle === 'Scheduled' ? 'badge-blue' : 'badge-muted'}`}>
                        {lifecycle}
                      </span>
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                      {promo.discountType === 'percentage' ? `${promo.discountPercent}% off` : getOfferLabel(promoToForm(promo))}
                      {' · '}
                      {promo.placements
                        .filter((placement) => placement !== 'product')
                        .map((placement) => PLACEMENT_OPTIONS.find((option) => option.value === placement)?.label)
                        .filter(Boolean)
                        .join(', ')}
                      {promo.popupImageUrl ? ' · Popup image' : ''}
                    </div>
                  </div>
                  <div className="actions">
                    <IconButton label="Edit promotion" onClick={() => editPromo(promo)}><Pencil size={17} /></IconButton>
                    <IconButton label="Copy promotion" onClick={() => duplicatePromo(promo)}><Copy size={17} /></IconButton>
                    <IconButton label={promo.isActive ? 'Pause promotion' : 'Activate promotion'} onClick={() => togglePromoActive(promo)}>
                      {promo.isActive ? <Pause size={17} /> : <Play size={17} />}
                    </IconButton>
                    <IconButton label="Delete promotion" onClick={() => deletePromo(promo.id)}><Trash2 size={17} /></IconButton>
                  </div>
                </article>
              )
            })
          )}
        </div>
      </section>
      </>
      ) : (
        <section className="card" style={{ padding: '20px', display: 'grid', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: '14px', flexWrap: 'wrap' }}>
            <div>
              <div className="section-label">Featured carousel</div>
              <h2 style={{ margin: '6px 0 0', fontSize: '21px' }}>Featured Items</h2>
              <p style={{ margin: '6px 0 0', color: 'var(--text-secondary)', fontSize: '13px', maxWidth: '760px' }}>
                These products appear in the storefront featured carousel. Add, reorder, or remove items here without leaving the promos workspace.
                {usingDefaultFeatured ? ' This is currently the default storefront list; make it editable to save custom changes.' : ''}
              </p>
            </div>
            <div className="featured-controls">
              {usingDefaultFeatured ? (
                <button
                  type="button"
                  className="fm-btn-outline"
                  disabled={featuredSaving}
                  onClick={() => {
                    void makeDefaultFeaturedEditable()
                  }}
                  style={{ padding: '10px 14px', fontSize: '13px' }}
                >
                  Make current carousel editable
                </button>
              ) : null}
              <button
                type="button"
                className={featuredReorderMode ? 'fm-btn-primary' : 'fm-btn-outline'}
                disabled={loading || featuredSaving || usingDefaultFeatured || featuredRecords.length < 2}
                title={
                  usingDefaultFeatured
                    ? 'Make the current carousel editable before rearranging it.'
                    : featuredRecords.length < 2
                      ? 'Add at least two featured items before rearranging.'
                      : undefined
                }
                onClick={featuredReorderMode ? cancelFeaturedReorder : beginFeaturedReorder}
                style={{ padding: '10px 14px', fontSize: '13px' }}
              >
                {featuredReorderMode ? 'Cancel rearrange' : 'Rearrange'}
              </button>
              <select
                value=""
                disabled={loading || featuredSaving || featuredReorderMode}
                onChange={(event) => {
                  const slug = event.target.value
                  if (!slug) return
                  if (usingDefaultFeatured) {
                    void makeDefaultFeaturedEditable(slug)
                  } else {
                    void updateFeaturedRecord(slug, {
                      featured: true,
                      featuredOrder: featuredRecords.length + 1,
                    })
                  }
                }}
                style={{
                  minWidth: '260px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  padding: '12px 14px',
                  fontSize: '14px',
                }}
              >
                <option value="">Add featured product...</option>
                {products
                  .filter((record) => !record.archived && record.publicVisible && !displayedFeaturedSlugs.has(record.slug))
                  .sort((a, b) => a.displayName.localeCompare(b.displayName))
                  .map((record) => (
                    <option key={record.slug} value={record.slug}>
                      {record.displayName} {getStrengthLabel(record)}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {featuredReorderMode ? (
            <div className="featured-reorder-bar" role="status">
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>Click items in display order.</strong>{' '}
                {activeFeaturedReorderSlugs.length}/{featuredRecords.length} selected.
              </div>
              <div className="featured-reorder-actions">
                <button
                  type="button"
                  className="fm-btn-outline"
                  disabled={featuredSaving || activeFeaturedReorderSlugs.length === 0}
                  onClick={() => setFeaturedReorderSlugs([])}
                  style={{ padding: '8px 12px', fontSize: '12px' }}
                >
                  Reset picks
                </button>
                <button
                  type="button"
                  className="fm-btn-primary"
                  disabled={featuredSaving || !featuredReorderComplete}
                  onClick={() => {
                    void saveFeaturedReorder()
                  }}
                  style={{ padding: '8px 12px', fontSize: '12px' }}
                >
                  {featuredSaving ? 'Saving...' : 'Save order'}
                </button>
              </div>
            </div>
          ) : null}

          {message ? (
            <div
              role={messageTone === 'error' ? 'alert' : 'status'}
              style={{
                borderRadius: '8px',
                padding: '11px 13px',
                background: messageTone === 'error' ? 'rgba(180,35,24,0.08)' : 'rgba(5,150,105,0.08)',
                color: messageTone === 'error' ? '#b42318' : '#047857',
                lineHeight: 1.6,
              }}
            >
              {message}
            </div>
          ) : null}

          {loading ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Loading featured items...</div>
          ) : featuredRecords.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
              No admin-selected featured products yet. The storefront will use the default featured list until one is selected here.
            </div>
          ) : (
            <div className="featured-grid">
              {usingDefaultFeatured ? (
                <div className="badge badge-blue" style={{ width: 'fit-content' }}>
                  Showing current default storefront carousel
                </div>
              ) : null}
              {featuredRecords.map((record, index) => {
                const reorderIndex = activeFeaturedReorderSlugs.indexOf(record.slug)
                const reorderSelected = reorderIndex >= 0
                const nextPickNumber = activeFeaturedReorderSlugs.length + 1

                return (
                  <div
                    key={record.slug}
                    className="featured-row"
                    data-reorder-mode={featuredReorderMode}
                    data-reorder-selected={reorderSelected}
                    role={featuredReorderMode ? 'button' : undefined}
                    tabIndex={featuredReorderMode ? 0 : undefined}
                    aria-pressed={featuredReorderMode ? reorderSelected : undefined}
                    onClick={featuredReorderMode ? () => toggleFeaturedReorderPick(record.slug) : undefined}
                    onKeyDown={
                      featuredReorderMode
                        ? (event) => {
                            if (event.key !== 'Enter' && event.key !== ' ') return
                            event.preventDefault()
                            toggleFeaturedReorderPick(record.slug)
                          }
                        : undefined
                    }
                  >
                    <div style={{ position: 'relative', width: '56px', height: '56px', borderRadius: '8px', overflow: 'hidden', background: 'var(--bg-card)' }}>
                      <Image src={record.imageUrl || '/products/front.png'} alt="" fill sizes="56px" style={{ objectFit: 'contain', padding: '4px' }} />
                    </div>
                    <div style={{ display: 'grid', gap: '3px', minWidth: 0 }}>
                      <strong style={{ color: 'var(--text-primary)' }}>{record.displayName}</strong>
                      <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                        {getStrengthLabel(record)} · {record.collection.replaceAll('_', ' ')}
                      </span>
                    </div>
                    {featuredReorderMode ? (
                      <div className="featured-rank-pill" data-selected={reorderSelected}>
                        {reorderSelected ? `#${reorderIndex + 1}` : `Next #${nextPickNumber}`}
                      </div>
                    ) : (
                      <label className="featured-order-field">
                        Order
                        <input
                          className="featured-order-input"
                          type="number"
                          min="1"
                          value={record.featuredOrder ?? index + 1}
                          disabled={featuredSaving || usingDefaultFeatured}
                          onChange={(event) => {
                            void updateFeaturedRecord(record.slug, {
                              featuredOrder: Number(event.target.value || index + 1),
                            })
                          }}
                        />
                      </label>
                    )}
                    {featuredReorderMode ? (
                      <button
                        type="button"
                        className="fm-btn-outline featured-remove-button"
                        disabled={featuredSaving || usingDefaultFeatured}
                        onClick={(event) => {
                          event.stopPropagation()
                          toggleFeaturedReorderPick(record.slug)
                        }}
                      >
                        {reorderSelected ? 'Undo pick' : 'Pick next'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="fm-btn-outline featured-remove-button"
                        disabled={featuredSaving || usingDefaultFeatured}
                        title={usingDefaultFeatured ? 'Make the current carousel editable before removing items.' : undefined}
                        onClick={() => {
                          void updateFeaturedRecord(record.slug, { featured: false, featuredOrder: null })
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {featuredSaving ? (
            <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Saving featured carousel...</div>
          ) : null}
        </section>
      )}
    </AdminShell>
  )
}

function SectionTitle({ title, detail }: { title: string; detail: string }) {
  return (
    <div>
      <h2 style={{ margin: 0, fontSize: '18px' }}>{title}</h2>
      <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>{detail}</p>
    </div>
  )
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button type="button" className="icon-button" aria-label={label} title={label} onClick={onClick}>
      {children}
    </button>
  )
}

const fieldLabelStyle: CSSProperties = {
  display: 'grid',
  gap: '7px',
  color: 'var(--text-secondary)',
  fontSize: '13px',
  fontWeight: 600,
}
