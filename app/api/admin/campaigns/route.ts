import { NextResponse } from 'next/server'
import { getCampaignDashboard, sendEmailCampaign } from '@/lib/email-campaigns'

export async function GET() {
  const result = await getCampaignDashboard()
  if (!result.ok) {
    return NextResponse.json(result, { status: result.setupRequired ? 503 : 502 })
  }
  return NextResponse.json(result)
}

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid campaign payload.' }, { status: 400 })
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ ok: false, error: 'Campaign payload is invalid.' }, { status: 400 })
  }

  const record = body as Record<string, unknown>
  const result = await sendEmailCampaign({
    title: typeof record.title === 'string' ? record.title : '',
    subject: typeof record.subject === 'string' ? record.subject : '',
    bodyText: typeof record.bodyText === 'string' ? record.bodyText : '',
    testRecipient: typeof record.testRecipient === 'string' && record.testRecipient.trim() ? record.testRecipient : undefined,
  })

  return NextResponse.json(result, { status: result.ok ? 200 : 502 })
}
