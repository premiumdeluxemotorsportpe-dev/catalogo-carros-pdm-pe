import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-change-me')

async function isAdmin(req: NextRequest) {
  const token = req.cookies.get('session')?.value
  if (!token) return false
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload && payload.admin === true
  } catch {
    return false
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // proteger rotas admin
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    if (!(await isAdmin(req))) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
      }
      const url = req.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('next', pathname)
      return NextResponse.redirect(url)
    }
  }

  // já autenticado → não mostrar login
  if (pathname === '/login' && (await isAdmin(req))) {
    const url = req.nextUrl.clone()
    url.pathname = '/admin'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*', '/login'],
}
