'use client'

import type { ManualOrderSubmission } from '@/lib/manual-orders'
import { supabase } from '@/lib/supabase'

export async function fetchCustomerOrder(orderId: string): Promise<ManualOrderSubmission> {
  if (!supabase) {
    throw new Error('Customer account access is unavailable.')
  }

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.access_token) {
    throw new Error('Please sign in to view this order.')
  }

  const response = await fetch(`/api/customer-orders/${encodeURIComponent(orderId)}`, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
    cache: 'no-store',
  })
  const result = (await response.json()) as {
    ok: boolean
    order?: ManualOrderSubmission
    error?: string
  }

  if (!response.ok || !result.ok || !result.order) {
    throw new Error(result.error || 'We could not load this order.')
  }

  return result.order
}

export async function getCustomerAccessToken() {
  if (!supabase) return null
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session?.access_token ?? null
}
