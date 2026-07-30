import { getSupabaseAdmin } from '@/lib/supabase-admin'
import type { ManualPaymentMethod } from '@/lib/manual-orders'
import { normalizePaymentQrImageUrl } from '@/lib/payment-qr-assets'

export type InventoryDefaultsSettings = {
  lowStockThreshold: number
}

export type CheckoutOperationsSettings = {
  shippingMode: 'manual_review' | 'flat_rate' | 'tiered_placeholder'
  flatRate: string
  freeShippingEnabled: boolean
  freeShippingThreshold: string
  localFreeShippingEnabled: boolean
  localFreeShippingHomeZip: string
  localFreeShippingRadiusMiles: string
  localFreeShippingZipCodes: string
  taxMode: 'pending_review' | 'not_charging' | 'collect_at_checkout'
  taxRate: string
  notes: string
}

export type BusinessPaymentMethodSettings = {
  method: ManualPaymentMethod
  label: string
  destination: string
  link: string
  qrImageUrl?: string
  detail: string
  enabled: boolean
}

export type BusinessDetailsSettings = {
  businessName: string
  companyEmail: string
  orderNotificationEmail: string
  companyPhone: string
  companyAddress: string
  contactInfo: string
  paymentMethods: BusinessPaymentMethodSettings[]
}

export type AdminSettingsPayload = {
  inventoryDefaults: InventoryDefaultsSettings
  checkoutOperations: CheckoutOperationsSettings
  businessDetails: BusinessDetailsSettings
}

const DEFAULT_SETTINGS: AdminSettingsPayload = {
  inventoryDefaults: {
    lowStockThreshold: 4,
  },
  checkoutOperations: {
    shippingMode: 'manual_review',
    flatRate: '',
    freeShippingEnabled: true,
    freeShippingThreshold: '300',
    localFreeShippingEnabled: true,
    localFreeShippingHomeZip: '35640',
    localFreeShippingRadiusMiles: '35',
    localFreeShippingZipCodes: '35640, 35601, 35555-35558',
    taxMode: 'pending_review',
    taxRate: '',
    notes: '',
  },
  businessDetails: {
    businessName: 'FlexMed Peptides, LLC',
    companyEmail: 'management@flexmedpeptides.com',
    orderNotificationEmail: 'management@flexmedpeptides.com',
    companyPhone: '',
    companyAddress: '',
    contactInfo: '',
    paymentMethods: [
      {
        method: 'cashapp',
        label: 'Cash App',
        destination: '$flexmed',
        link: 'https://cash.app/$flexmed',
        qrImageUrl: '/payment-qr/cashapp.jpg',
        detail: 'Send the full order amount through Cash App using the destination shown above.',
        enabled: true,
      },
      {
        method: 'paypal',
        label: 'PayPal',
        destination: 'founder-paypal@example.com',
        link: '',
        detail: 'Send the full order amount through PayPal using the payment account shown above.',
        enabled: false,
      },
      {
        method: 'venmo',
        label: 'Venmo',
        destination: '@flexmed_p',
        link: 'https://venmo.com/flexmed_p',
        qrImageUrl: '/payment-qr/venmo.jpg',
        detail: 'Send the full order amount through Venmo using the handle shown above.',
        enabled: true,
      },
      {
        method: 'crypto',
        label: 'Crypto',
        destination: 'Wallet provided after order review',
        link: '',
        detail: 'Use this option if the current wallet and chain instructions are shown for your order.',
        enabled: false,
      },
      {
        method: 'zelle',
        label: 'Zelle',
        destination: 'payments@example.com',
        link: '',
        detail: 'Send the full order amount through Zelle using the destination shown above.',
        enabled: false,
      },
      {
        method: 'other',
        label: 'Other',
        destination: 'Details provided after order review',
        link: '',
        detail: 'Use the payment destination and instructions shown here for this order.',
        enabled: false,
      },
    ],
  },
}

export function getDefaultAdminSettings(): AdminSettingsPayload {
  return DEFAULT_SETTINGS
}

export async function getAdminSettings(): Promise<AdminSettingsPayload> {
  const supabase = getSupabaseAdmin()
  if (!supabase) return DEFAULT_SETTINGS

  const { data, error } = await supabase.from('app_settings').select('key, value_json')
  if (error || !data) return DEFAULT_SETTINGS

  const map = new Map<string, unknown>()
  for (const row of data) {
    map.set(row.key as string, row.value_json)
  }

  const inventoryDefaults = map.get('inventory_defaults') as Partial<InventoryDefaultsSettings> | undefined
  const checkoutOperations = map.get('checkout_operations') as Partial<CheckoutOperationsSettings> | undefined
  const businessDetails = map.get('business_details') as Partial<BusinessDetailsSettings> | undefined
  const savedPaymentMethods = Array.isArray(businessDetails?.paymentMethods) ? businessDetails.paymentMethods : []
  const paymentMethods = DEFAULT_SETTINGS.businessDetails.paymentMethods.map((method) => {
    const saved = savedPaymentMethods.find((entry) => entry?.method === method.method)
    return {
      ...method,
      label: typeof saved?.label === 'string' ? saved.label : method.label,
      destination:
        typeof saved?.destination === 'string'
          ? saved.destination
          : method.destination,
      link:
        typeof saved?.link === 'string'
          ? saved.link
          : method.link,
      qrImageUrl:
        typeof saved?.qrImageUrl === 'string'
          ? normalizePaymentQrImageUrl(method.method, saved.qrImageUrl)
          : method.qrImageUrl,
      detail: typeof saved?.detail === 'string' ? saved.detail : method.detail,
      enabled: typeof saved?.enabled === 'boolean' ? saved.enabled : method.enabled,
    }
  })

  return {
    inventoryDefaults: {
      lowStockThreshold:
        typeof inventoryDefaults?.lowStockThreshold === 'number'
          ? inventoryDefaults.lowStockThreshold
          : DEFAULT_SETTINGS.inventoryDefaults.lowStockThreshold,
    },
    checkoutOperations: {
      shippingMode:
        checkoutOperations?.shippingMode ?? DEFAULT_SETTINGS.checkoutOperations.shippingMode,
      flatRate:
        typeof checkoutOperations?.flatRate === 'string'
          ? checkoutOperations.flatRate
          : DEFAULT_SETTINGS.checkoutOperations.flatRate,
      freeShippingEnabled:
        typeof checkoutOperations?.freeShippingEnabled === 'boolean'
          ? checkoutOperations.freeShippingEnabled
          : DEFAULT_SETTINGS.checkoutOperations.freeShippingEnabled,
      freeShippingThreshold:
        typeof checkoutOperations?.freeShippingThreshold === 'string'
          ? checkoutOperations.freeShippingThreshold
          : DEFAULT_SETTINGS.checkoutOperations.freeShippingThreshold,
      localFreeShippingEnabled:
        typeof checkoutOperations?.localFreeShippingEnabled === 'boolean'
          ? checkoutOperations.localFreeShippingEnabled
          : DEFAULT_SETTINGS.checkoutOperations.localFreeShippingEnabled,
      localFreeShippingHomeZip:
        typeof checkoutOperations?.localFreeShippingHomeZip === 'string'
          ? checkoutOperations.localFreeShippingHomeZip
          : DEFAULT_SETTINGS.checkoutOperations.localFreeShippingHomeZip,
      localFreeShippingRadiusMiles:
        typeof checkoutOperations?.localFreeShippingRadiusMiles === 'string'
          ? checkoutOperations.localFreeShippingRadiusMiles
          : DEFAULT_SETTINGS.checkoutOperations.localFreeShippingRadiusMiles,
      localFreeShippingZipCodes:
        typeof checkoutOperations?.localFreeShippingZipCodes === 'string'
          ? checkoutOperations.localFreeShippingZipCodes
          : DEFAULT_SETTINGS.checkoutOperations.localFreeShippingZipCodes,
      taxMode:
        checkoutOperations?.taxMode ?? DEFAULT_SETTINGS.checkoutOperations.taxMode,
      taxRate:
        typeof checkoutOperations?.taxRate === 'string'
          ? checkoutOperations.taxRate
          : DEFAULT_SETTINGS.checkoutOperations.taxRate,
      notes:
        typeof checkoutOperations?.notes === 'string'
          ? checkoutOperations.notes
          : DEFAULT_SETTINGS.checkoutOperations.notes,
    },
    businessDetails: {
      businessName:
        typeof businessDetails?.businessName === 'string'
          ? businessDetails.businessName
          : DEFAULT_SETTINGS.businessDetails.businessName,
      companyEmail:
        typeof businessDetails?.companyEmail === 'string'
          ? businessDetails.companyEmail
          : DEFAULT_SETTINGS.businessDetails.companyEmail,
      orderNotificationEmail:
        typeof businessDetails?.orderNotificationEmail === 'string'
          ? businessDetails.orderNotificationEmail
          : DEFAULT_SETTINGS.businessDetails.orderNotificationEmail,
      companyPhone:
        typeof businessDetails?.companyPhone === 'string'
          ? businessDetails.companyPhone
          : DEFAULT_SETTINGS.businessDetails.companyPhone,
      companyAddress:
        typeof businessDetails?.companyAddress === 'string'
          ? businessDetails.companyAddress
          : DEFAULT_SETTINGS.businessDetails.companyAddress,
      contactInfo:
        typeof businessDetails?.contactInfo === 'string'
          ? businessDetails.contactInfo
          : DEFAULT_SETTINGS.businessDetails.contactInfo,
      paymentMethods,
    },
  }
}

export async function saveAdminSettings(settings: AdminSettingsPayload) {
  const supabase = getSupabaseAdmin()
  if (!supabase) {
    return { ok: false as const, error: 'Supabase is not configured.' }
  }

  const rows = [
    {
      key: 'inventory_defaults',
      value_json: settings.inventoryDefaults,
      updated_at: new Date().toISOString(),
    },
    {
      key: 'checkout_operations',
      value_json: settings.checkoutOperations,
      updated_at: new Date().toISOString(),
    },
    {
      key: 'business_details',
      value_json: settings.businessDetails,
      updated_at: new Date().toISOString(),
    },
  ]

  const { error } = await supabase.from('app_settings').upsert(rows, { onConflict: 'key' })
  if (error) {
    return { ok: false as const, error: error.message }
  }

  return { ok: true as const }
}
