import { NextResponse } from 'next/server'
import { getAdminSettings, saveAdminSettings, type AdminSettingsPayload } from '@/lib/admin-settings'

export async function GET() {
  const settings = await getAdminSettings()
  return NextResponse.json({ ok: true, settings })
}

export async function PATCH(request: Request) {
  let payload: unknown

  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON payload.' }, { status: 400 })
  }

  const record = payload as Partial<AdminSettingsPayload>
  const current = await getAdminSettings()
  const nextSettings: AdminSettingsPayload = {
    inventoryDefaults: {
      lowStockThreshold:
        typeof record.inventoryDefaults?.lowStockThreshold === 'number'
          ? record.inventoryDefaults.lowStockThreshold
          : current.inventoryDefaults.lowStockThreshold,
    },
    checkoutOperations: {
      shippingMode: record.checkoutOperations?.shippingMode ?? current.checkoutOperations.shippingMode,
      flatRate:
        typeof record.checkoutOperations?.flatRate === 'string'
          ? record.checkoutOperations.flatRate
          : current.checkoutOperations.flatRate,
      freeShippingEnabled:
        typeof record.checkoutOperations?.freeShippingEnabled === 'boolean'
          ? record.checkoutOperations.freeShippingEnabled
          : current.checkoutOperations.freeShippingEnabled,
      freeShippingThreshold:
        typeof record.checkoutOperations?.freeShippingThreshold === 'string'
          ? record.checkoutOperations.freeShippingThreshold
          : current.checkoutOperations.freeShippingThreshold,
      localFreeShippingEnabled:
        typeof record.checkoutOperations?.localFreeShippingEnabled === 'boolean'
          ? record.checkoutOperations.localFreeShippingEnabled
          : current.checkoutOperations.localFreeShippingEnabled,
      localFreeShippingHomeZip:
        typeof record.checkoutOperations?.localFreeShippingHomeZip === 'string'
          ? record.checkoutOperations.localFreeShippingHomeZip
          : current.checkoutOperations.localFreeShippingHomeZip,
      localFreeShippingRadiusMiles:
        typeof record.checkoutOperations?.localFreeShippingRadiusMiles === 'string'
          ? record.checkoutOperations.localFreeShippingRadiusMiles
          : current.checkoutOperations.localFreeShippingRadiusMiles,
      localFreeShippingZipCodes:
        typeof record.checkoutOperations?.localFreeShippingZipCodes === 'string'
          ? record.checkoutOperations.localFreeShippingZipCodes
          : current.checkoutOperations.localFreeShippingZipCodes,
      taxMode: record.checkoutOperations?.taxMode ?? current.checkoutOperations.taxMode,
      taxRate:
        typeof record.checkoutOperations?.taxRate === 'string'
          ? record.checkoutOperations.taxRate
          : current.checkoutOperations.taxRate,
      notes:
        typeof record.checkoutOperations?.notes === 'string'
          ? record.checkoutOperations.notes
          : current.checkoutOperations.notes,
    },
    businessDetails: {
      businessName:
        typeof record.businessDetails?.businessName === 'string'
          ? record.businessDetails.businessName
          : current.businessDetails.businessName,
      companyEmail:
        typeof record.businessDetails?.companyEmail === 'string'
          ? record.businessDetails.companyEmail
          : current.businessDetails.companyEmail,
      orderNotificationEmail:
        typeof record.businessDetails?.orderNotificationEmail === 'string'
          ? record.businessDetails.orderNotificationEmail
          : current.businessDetails.orderNotificationEmail,
      companyPhone:
        typeof record.businessDetails?.companyPhone === 'string'
          ? record.businessDetails.companyPhone
          : current.businessDetails.companyPhone,
      companyAddress:
        typeof record.businessDetails?.companyAddress === 'string'
          ? record.businessDetails.companyAddress
          : current.businessDetails.companyAddress,
      contactInfo:
        typeof record.businessDetails?.contactInfo === 'string'
          ? record.businessDetails.contactInfo
          : current.businessDetails.contactInfo,
      paymentMethods:
        Array.isArray(record.businessDetails?.paymentMethods)
          ? current.businessDetails.paymentMethods.map((method) => {
              const saved = record.businessDetails?.paymentMethods.find((entry) => entry.method === method.method)
              return saved
                ? {
                    ...method,
                    label: typeof saved.label === 'string' ? saved.label : method.label,
                    destination: typeof saved.destination === 'string' ? saved.destination : method.destination,
                    link: typeof saved.link === 'string' ? saved.link : method.link,
                    qrImageUrl: typeof saved.qrImageUrl === 'string' ? saved.qrImageUrl : method.qrImageUrl,
                    detail: typeof saved.detail === 'string' ? saved.detail : method.detail,
                    enabled: typeof saved.enabled === 'boolean' ? saved.enabled : method.enabled,
                  }
                : method
            })
          : current.businessDetails.paymentMethods,
    },
  }

  const result = await saveAdminSettings(nextSettings)
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 502 })
  }

  return NextResponse.json({ ok: true, settings: nextSettings })
}
