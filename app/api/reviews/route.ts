import { NextRequest, NextResponse } from 'next/server'

// In-memory store for development until backend (MIU-17) is deployed.
// Keys: `${userId}:${productId}` for duplicate detection.
// Replace with backend proxy when NEXT_PUBLIC_API_URL points to real server.

type Review = {
  id: string
  userId: string
  productId: string
  rating: number
  comment: string
  isApproved: boolean
  createdAt: string
  user: { id: string; name: string; avatarUrl?: string }
}

declare global {
  // eslint-disable-next-line no-var
  var __reviews: Review[] | undefined
}

function getStore(): Review[] {
  if (!global.__reviews) global.__reviews = []
  return global.__reviews
}

function parseToken(req: NextRequest): { userId: string; name: string } | null {
  const auth = req.headers.get('Authorization') ?? ''
  const token = auth.replace('Bearer ', '').trim()
  if (!token) return null
  // Real JWT validation happens on the backend.
  // For local dev, treat any non-empty token as valid and extract a stub user.
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return { userId: String(payload.sub ?? payload.id ?? 'guest'), name: payload.name ?? 'Khu00e1ch' }
  } catch {
    return { userId: token.slice(0, 12), name: 'Khu00e1ch' }
  }
}

export async function POST(req: NextRequest) {
  // Proxy to real backend when available
  const apiUrl = process.env.NEXT_PUBLIC_API_URL
  if (apiUrl) {
    const body = await req.text()
    const res = await fetch(`${apiUrl}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: req.headers.get('Authorization') ?? '',
      },
      body,
    })
    const json = await res.json().catch(() => ({}))
    return NextResponse.json(json, { status: res.status })
  }

  // Local dev fallback
  const user = parseToken(req)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body?.productId || !body?.rating) {
    return NextResponse.json({ message: 'productId and rating are required' }, { status: 400 })
  }

  const { productId, rating, comment = '' } = body
  if (rating < 1 || rating > 5) {
    return NextResponse.json({ message: 'Rating must be 1-5' }, { status: 400 })
  }

  const store = getStore()
  const key = `${user.userId}:${productId}`
  const existing = store.find((r) => r.userId === user.userId && r.productId === productId)
  if (existing) {
    return NextResponse.json({ message: 'Already reviewed' }, { status: 409 })
  }

  const review: Review = {
    id: Math.random().toString(36).slice(2),
    userId: user.userId,
    productId,
    rating,
    comment: String(comment).slice(0, 1000),
    isApproved: true, // auto-approve in dev
    createdAt: new Date().toISOString(),
    user: { id: user.userId, name: user.name },
  }
  store.push(review)

  return NextResponse.json({ review }, { status: 201 })
}
