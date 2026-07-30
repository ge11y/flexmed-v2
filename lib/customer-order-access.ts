import type { User } from '@supabase/supabase-js'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export type CustomerOrderAccessResult =
  | { ok: true; user: User }
  | { ok: false; status: 401 | 503; error: string }

export async function getCustomerOrderUser(request: Request): Promise<CustomerOrderAccessResult> {
  const supabase = getSupabaseAdmin()
  if (!supabase) {
    return { ok: false, status: 503, error: 'Customer order access is not configured.' }
  }

  const authorization = request.headers.get('authorization') ?? ''
  const accessToken = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : ''
  if (!accessToken) {
    return { ok: false, status: 401, error: 'Please sign in to view this order.' }
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(accessToken)

  if (error || !user?.email) {
    return { ok: false, status: 401, error: 'Your sign-in session has expired. Please sign in again.' }
  }

  return { ok: true, user }
}

export function customerOwnsOrder(user: User, customerEmail: unknown) {
  return (
    typeof customerEmail === 'string' &&
    user.email?.trim().toLowerCase() === customerEmail.trim().toLowerCase()
  )
}
