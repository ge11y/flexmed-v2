import { NextResponse } from "next/server"
import { ADMIN_AUTH_COOKIE, getAdminSessionValue, isValidAdminCredentials } from "@/lib/admin-auth"

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { username?: string; password?: string }
    | null

  const username = body?.username?.trim() ?? ""
  const password = body?.password ?? ""

  if (!isValidAdminCredentials(username, password)) {
    return NextResponse.json({ ok: false, error: "Invalid admin username or password." }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set(ADMIN_AUTH_COOKIE, getAdminSessionValue(), {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 12,
  })
  return response
}
