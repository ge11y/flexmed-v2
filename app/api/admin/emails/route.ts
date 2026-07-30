import { NextResponse } from 'next/server'
import {
  getEmailAutomationSettings,
  saveEmailAutomationSettings,
  saveEmailSenderSettings,
  type EmailSenderSettings,
  type EmailAutomationSetting,
} from '@/lib/email-admin'

function isPayload(value: unknown): value is { settings: EmailAutomationSetting[]; senderSettings?: EmailSenderSettings } {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return Array.isArray(record.settings)
}

export async function GET() {
  const result = await getEmailAutomationSettings()
  return NextResponse.json({
    ok: true,
    settings: result.settings,
    logs: result.logs,
    senderSettings: result.senderSettings,
    sourceStatus: result.status,
    error: result.error ?? null,
  })
}

export async function PATCH(request: Request) {
  let payload: unknown

  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON payload.' }, { status: 400 })
  }

  if (!isPayload(payload)) {
    return NextResponse.json({ ok: false, error: 'Email settings payload is invalid.' }, { status: 400 })
  }

  const result = await saveEmailAutomationSettings(payload.settings)
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 502 })
  }

  if (payload.senderSettings) {
    const senderResult = await saveEmailSenderSettings(payload.senderSettings)
    if (!senderResult.ok) {
      return NextResponse.json({ ok: false, error: senderResult.error }, { status: 502 })
    }
  }

  return NextResponse.json({ ok: true })
}
