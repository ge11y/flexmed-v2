import { cookies } from "next/headers"
import { ADMIN_AUTH_COOKIE, ADMIN_SESSION_VALUE, isAdminSessionValue } from "@/lib/admin-session"

export { ADMIN_AUTH_COOKIE }

const ADMIN_USERNAME = "FlexMedAdmin"
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

export function isValidAdminCredentials(username: string, password: string) {
  // No fallback: if ADMIN_PASSWORD is unset, admin auth is closed rather than open.
  if (!ADMIN_PASSWORD) return false
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD
}

export async function hasAdminSession() {
  return isAdminSessionValue((await cookies()).get(ADMIN_AUTH_COOKIE)?.value)
}

export function getAdminSessionValue() {
  return ADMIN_SESSION_VALUE
}
