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

  if (isAuthenticated && pathname.startsWith('/dashboard')) {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003/api/v1'
    const url = `${apiBase}/auth/profile`
    return fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(async (r) => {
        try {
          const data = await r.json()
          const user = (data as any)?.data ?? data ?? null
          const isAdmin = user?.role === 'admin'
          const accepted = !!user?.acceptedLegal
          const hasAcceptedAnyRequired = !!user?.hasAcceptedAnyRequired
          if (!isAdmin && !accepted) {
            if (hasAcceptedAnyRequired) {
              return NextResponse.next()
            }
            const redir = req.nextUrl.clone()
            redir.pathname = '/auth/legal'
            return NextResponse.redirect(redir)
          }
          return NextResponse.next()
        } catch {
          const acceptedCookie = req.cookies.get('acceptedLegal')?.value
          if (acceptedCookie === '1') {
            return NextResponse.next()
          }
          const redir = req.nextUrl.clone()
          redir.pathname = '/auth/legal'
          return NextResponse.redirect(redir)
        }
      })
      .catch(() => {
        const acceptedCookie = req.cookies.get('acceptedLegal')?.value
        if (acceptedCookie === '1') {
          return NextResponse.next()
        }
        const redir = req.nextUrl.clone()
        redir.pathname = '/auth/legal'
        return NextResponse.redirect(redir)
      })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*'],
}
