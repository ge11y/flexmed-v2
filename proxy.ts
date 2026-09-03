import { NextResponse, type NextRequest } from 'next/server'
import { ADMIN_AUTH_COOKIE, isAdminSessionValue } from '@/lib/admin-session'

// The admin workspace and its API answered anonymous requests: /admin/orders,
// /api/admin/orders, /api/admin/clients and the purchase-cost log were all
// readable without signing in. Everything under /admin and /api/admin now
// needs the session cookie that /admin/login sets. The storefront is not
// matched, so nothing public changes.

const OPEN_PATHS = ['/admin/login', '/api/admin/auth/login', '/api/admin/auth/logout']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (OPEN_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return NextResponse.next()
  }

  if (isAdminSessionValue(request.cookies.get(ADMIN_AUTH_COOKIE)?.value)) {
    return NextResponse.next()
  }

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ ok: false, error: 'Admin sign-in required.' }, { status: 401 })
  }

  return NextResponse.redirect(new URL('/admin/login', request.url))
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*', '/api/catalog-sync'],
}
