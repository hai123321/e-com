import { NextRequest, NextResponse } from 'next/server'

declare global {
  // eslint-disable-next-line no-var
  var __reviews:
    | {
        id: string
        userId: string
        productId: string
        rating: number
        comment: string
        isApproved: boolean
        createdAt: string
        user: { id: string; name: string; avatarUrl?: string }
      }[]
    | undefined
}

function getStore() {
  if (!global.__reviews) global.__reviews = []
  return global.__reviews
}

function isAdmin(req: NextRequest): boolean {
  const auth = req.headers.get('Authorization') ?? ''
  const token = auth.replace('Bearer ', '').trim()
  if (!token) return false
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.role === 'admin' || payload.isAdmin === true
  } catch {
    return token.endsWith('.admin')
  }
}

export async function GET(req: NextRequest) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL
  if (apiUrl) {
    const url = new URL(req.url)
    const res = await fetch(`${apiUrl}/admin/reviews${url.search}`, {
      headers: { Authorization: req.headers.get('Authorization') ?? '' },
    })
    const json = await res.json().catch(() => ({}))
    return NextResponse.json(json, { status: res.status })
  }

  if (!isAdmin(req)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))
  const limit = 20
  const q = searchParams.get('q')?.toLowerCase() ?? ''

  let reviews = getStore()

  if (status === 'pending') reviews = reviews.filter((r) => !r.isApproved)
  else if (status === 'approved') reviews = reviews.filter((r) => r.isApproved)

  if (q) reviews = reviews.filter((r) => r.productId.toLowerCase().includes(q))

  const total = reviews.length
  const data = reviews.slice((page - 1) * limit, page * limit)

  return NextResponse.json({ data, total, page, limit })
}
