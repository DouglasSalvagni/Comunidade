import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const token = body?.accessToken as string | undefined
    const acceptedLegal = body?.acceptedLegal as boolean | undefined

    const res = NextResponse.json({ ok: true })

    if (typeof token === 'string') {
      if (token.length > 0) {
        res.cookies.set('accessToken', token, {
          httpOnly: true,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production' ? true : false,
          path: '/',
          maxAge: 7 * 24 * 60 * 60,
        })
      } else {
        res.cookies.set('accessToken', '', {
          httpOnly: true,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production' ? true : false,
          path: '/',
          maxAge: 0,
        })
      }
    }

    if (typeof acceptedLegal === 'boolean') {
      res.cookies.set('acceptedLegal', acceptedLegal ? '1' : '0', {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production' ? true : false,
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
      })
    }

    return res
  } catch (e) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
}

