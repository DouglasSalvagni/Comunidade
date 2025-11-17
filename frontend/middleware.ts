import { NextRequest, NextResponse } from 'next/server'

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname.startsWith('/admin/login')) {
    return NextResponse.next()
  }

  const accessToken = req.cookies.get('accessToken')?.value
  const isAuthenticated = !!accessToken

  if (!isAuthenticated) {
    if (pathname.startsWith('/admin')) {
      const url = req.nextUrl.clone()
      url.pathname = '/admin/login'
      return NextResponse.redirect(url)
    }
    if (pathname.startsWith('/dashboard')) {
      const url = req.nextUrl.clone()
      url.pathname = '/auth/login'
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*'],
}
