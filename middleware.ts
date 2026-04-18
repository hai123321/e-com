import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const ref = searchParams.get('ref')

  if (ref) {
    const response = NextResponse.next()
    // First-referrer-wins: only set if cookie doesn't already exist
    if (!request.cookies.has('ref_code')) {
      response.cookies.set('ref_code', ref.toUpperCase(), {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
      })
    }
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
}
