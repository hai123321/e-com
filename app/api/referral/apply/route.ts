import { NextRequest, NextResponse } from 'next/server'

const BACKEND = process.env.NEXT_PUBLIC_API_URL ?? ''

function backendUrl(path: string): string {
  return BACKEND ? `${BACKEND}${path}` : `http://localhost:3001/api/v1${path}`
}

export async function POST(req: NextRequest) {
  const refCode = req.cookies.get('ref_code')?.value
  if (!refCode) {
    return NextResponse.json({ success: true, skipped: true })
  }

  const auth = req.headers.get('Authorization')
  if (!auth) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const res = await fetch(backendUrl('/referral/apply'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: auth },
      body: JSON.stringify({ referralCode: refCode }),
    })
    const json = await res.json()

    const response = NextResponse.json(json, { status: res.status })
    if (res.ok) {
      // Clear the cookie after successful apply
      response.cookies.set('ref_code', '', { maxAge: 0, path: '/' })
    }
    return response
  } catch {
    return NextResponse.json({ success: false, error: 'Backend unavailable' }, { status: 502 })
  }
}
