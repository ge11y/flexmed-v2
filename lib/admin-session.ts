// Shared by proxy.ts (which cannot import next/headers) and lib/admin-auth.ts.
export const ADMIN_AUTH_COOKIE = 'flexmed_admin_auth_v1'
export const ADMIN_SESSION_VALUE = 'authenticated'

export function isAdminSessionValue(value: string | null | undefined) {
  return value === ADMIN_SESSION_VALUE
}
