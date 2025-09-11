import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifySession } from '@/lib/auth/server'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const needsAuth = pathname.startsWith('/admin') || pathname.startsWith('/api/admin')
  if (!needsAuth) return NextResponse.next()

  const session = await verifySession(req)
  if (!session?.isAdmin) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}

export const config = { matcher: ['/admin/:path*', '/api/admin/:path*'] }
