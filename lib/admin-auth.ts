import { cookies } from "next/headers"

export const ADMIN_AUTH_COOKIE = "flexmed_admin_auth_v1"

const ADMIN_USERNAME = "FlexMedAdmin"
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD
const ADMIN_SESSION_VALUE = "authenticated"

export function isValidAdminCredentials(username: string, password: string) {
  // No fallback: if ADMIN_PASSWORD is unset, admin auth is closed rather than open.
  if (!ADMIN_PASSWORD) return false
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD
}

export async function hasAdminSession() {
  return (await cookies()).get(ADMIN_AUTH_COOKIE)?.value === ADMIN_SESSION_VALUE
}

export function getAdminSessionValue() {
  return ADMIN_SESSION_VALUE
}
