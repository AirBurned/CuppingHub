import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyJWT } from '@/lib/jwt'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes — no auth needed
  if (
    pathname === '/' ||
    pathname === '/login' ||
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/api/uploads/') ||
    pathname === '/api/seed'
  ) {
    return NextResponse.next()
  }

  const token = request.cookies.get('token')?.value

  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const user = await verifyJWT(token)
  if (!user) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (pathname.startsWith('/admin') || pathname === '/api/users') {
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Нет доступа' }, { status: 403 })
      }
      return NextResponse.redirect(new URL('/lots', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|landing.html|lots/.*\\.svg|uploads/).*)',],
}
